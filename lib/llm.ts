import { applyTurn } from "./agent";
import { classifyMatter } from "./classify";
import { runConflictCheck } from "./conflict";
import { isLegalAdviceRequest } from "./guardrails";
import { renderKbAnswer } from "./rag";
import type { Session, TurnContext } from "./types";
import { TOOL_DEFINITIONS } from "./tool-schemas";

type Outcome = ReturnType<typeof applyTurn>;

export function demoMode(): boolean {
  if (process.env.LLM_PROVIDER === "demo") return true;
  return !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY;
}

function unsafe(userText: string, reply: string): boolean {
  if (!isLegalAdviceRequest(userText)) return false;
  return /you should (accept|settle|say|take)|strong case|you will win/i.test(reply);
}

async function groq(messages: unknown[]): Promise<{ content: string | null; toolCalls: Array<{ id: string; name: string; arguments: string }> }> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages,
      tools: TOOL_DEFINITIONS,
    }),
  });
  if (!response.ok) throw new Error(`Groq ${response.status}`);
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } }>;
  };
  const message = data.choices?.[0]?.message;
  return {
    content: message?.content ?? null,
    toolCalls: (message?.tool_calls ?? []).map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: call.function.arguments,
    })),
  };
}

async function gemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const models = [process.env.GEMINI_MODEL, "gemini-2.0-flash", "gemini-2.5-flash"].filter(Boolean) as string[];
  let last = "Gemini failed";
  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      },
    );
    if (!response.ok) {
      last = `Gemini ${model} ${response.status}`;
      continue;
    }
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (text) return text;
  }
  throw new Error(last);
}

function toolResult(name: string, args: Record<string, unknown>, session: Session): Record<string, unknown> {
  if (name === "search_kb") {
    const found = renderKbAnswer(String(args.query ?? ""));
    return { confident: found.confident, titles: found.citations.map((citation) => citation.title), text: found.text };
  }
  if (name === "classify_matter") {
    const result = classifyMatter(String(args.description ?? ""));
    if (result.practiceArea) session.practiceArea = result.practiceArea;
    return { ...result };
  }
  if (name === "run_conflict_check") {
    const parties = Array.isArray(args.parties) ? args.parties.map(String) : [];
    const result = runConflictCheck(parties);
    session.conflict = result;
    return { ...result };
  }
  if (name === "request_handoff") {
    session.handoff = true;
    session.stage = "closed";
    return { accepted: true, reason: args.reason ?? "human_requested" };
  }
  throw new Error(`Live tool ${name} is executed by the demo engine`);
}

async function liveTurn(session: Session, message: string, ctx: TurnContext): Promise<Outcome> {
  const demo = applyTurn(session, message, ctx);
  if (!process.env.GROQ_API_KEY) {
    const text = await gemini(
      `You are the Harlow & Pierce intake desk. Do not give legal advice. Rewrite this reply in two short paragraphs without changing the facts:\n\n${demo.session.messages.at(-1)?.content ?? ""}`,
    );
    if (unsafe(message, text)) return demo;
    const rewritten = structuredClone(demo);
    const last = rewritten.session.messages.at(-1);
    if (last) last.content = `${text}\n\nThis is not legal advice and does not create an attorney-client relationship.`;
    return rewritten;
  }
  const messages: Array<Record<string, unknown>> = [
    {
      role: "system",
      content:
        "You are the intake assistant for the fictional firm Harlow & Pierce LLP. Never give legal advice, value a claim, or say what to tell a judge. Use tools. If a tool fails, stop. This chat does not create an attorney-client relationship.",
    },
    { role: "user", content: message },
  ];
  const working = structuredClone(session);
  for (let step = 0; step < 4; step += 1) {
    const result = await groq(messages);
    if (result.toolCalls.length === 0) {
      if (!result.content || unsafe(message, result.content)) return demo;
      const merged = structuredClone(demo);
      const last = merged.session.messages.at(-1);
      if (last && !last.content.includes("not legal advice")) {
        last.content = `${result.content}\n\nThis is not legal advice and does not create an attorney-client relationship.`;
      }
      return merged;
    }
    messages.push({
      role: "assistant",
      content: result.content,
      tool_calls: result.toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: call.arguments },
      })),
    });
    for (const call of result.toolCalls) {
      const args = JSON.parse(call.arguments) as Record<string, unknown>;
      const output = toolResult(call.name, args, working);
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(output) });
    }
  }
  return demo;
}

export async function respond(session: Session, message: string, ctx: TurnContext): Promise<Outcome> {
  if (demoMode()) return applyTurn(session, message, ctx);
  try {
    return await liveTurn(session, message, ctx);
  } catch {
    return applyTurn(session, message, ctx);
  }
}
