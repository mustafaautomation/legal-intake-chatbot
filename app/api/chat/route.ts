import { respond } from "@/lib/llm";
import { chunkText } from "@/lib/stream";
import { commitTurn } from "@/lib/store";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function lastAssistant(session: Session): string {
  return [...session.messages].reverse().find((message) => message.role === "assistant")?.content ?? "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "The desk could not read that request." }, { status: 400 });
  }
  const message = "message" in body && typeof body.message === "string" ? body.message.trim() : "";
  const sessionId = "sessionId" in body && typeof body.sessionId === "string" ? body.sessionId : "";
  const stream = "stream" in body && body.stream === true;
  if (!sessionId) return Response.json({ error: "Open an intake session first." }, { status: 400 });
  if (!message) return Response.json({ error: "Write a message before sending." }, { status: 400 });
  if (message.length > 4000) return Response.json({ error: "That note is too long. Shorten it and send again." }, { status: 400 });

  const result = await commitTurn(sessionId, message, (session, ctx) => respond(session, message, ctx));
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const mode = "mode" in result && result.mode === "live" ? "live" : "demo";
  if (!stream) return Response.json({ session: result.session, mode });

  const text = lastAssistant(result.session);
  const encoder = new TextEncoder();
  const bodyStream = new ReadableStream({
    start(controller) {
      for (const part of chunkText(text)) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: part })}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", session: result.session, mode })}\n\n`));
      controller.close();
    },
  });
  return new Response(bodyStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
