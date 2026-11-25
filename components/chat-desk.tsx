"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown";
import { DISCLAIMER, TOOL_LABELS } from "@/lib/firm";
import type { ChatMessage, Session } from "@/lib/types";
import { IntakeFile } from "@/components/intake-file";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatDesk({ embedded = false }: { embedded?: boolean }) {
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  async function openSession() {
    setOpening(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The desk did not open.");
      setSession(data.session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The desk did not open.");
    } finally {
      setOpening(false);
    }
  }

  useEffect(() => {
    void openSession();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.messages.length, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!session || !message || pending) return;
    const previous = session;
    setPending(true);
    setError(null);
    setDraft("");
    const placeholder: ChatMessage = {
      id: "pending",
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setSession({ ...session, messages: [...session.messages, { id: "you", role: "user", content: message, createdAt: new Date().toISOString() }, placeholder] });
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, message, stream: true }),
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({ error: "The message did not go through." }));
        throw new Error(data.error || "The message did not go through.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamed = "";
      while (true) {
        const step = await reader.read();
        if (step.done) break;
        buffer += decoder.decode(step.value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((item) => item.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as { type: string; text?: string; session?: Session };
          if (event.type === "delta" && event.text) {
            streamed += event.text;
            const snapshot = streamed;
            setSession((current) => {
              if (!current) return current;
              const messages = current.messages.map((item) => (item.id === "pending" ? { ...item, content: snapshot } : item));
              return { ...current, messages };
            });
          }
          if (event.type === "done" && event.session) setSession(event.session);
        }
      }
    } catch (cause) {
      setSession(previous);
      setError(cause instanceof Error ? cause.message : "The message did not go through.");
      setDraft(message);
    } finally {
      setPending(false);
    }
  }

  const lastAssistant = [...(session?.messages ?? [])].reverse().find((message) => message.role === "assistant");
  const suggestions = pending ? [] : (lastAssistant?.suggestions ?? []);

  return (
    <div className={embedded ? "grid min-h-screen grid-cols-1" : "mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_18rem]"}>
      <section className="flex min-h-[70vh] flex-col border border-line bg-sheet" aria-live="polite">
        <div className="border-b border-line px-4 py-3">
          <p className="font-serif text-xl">New client intake</p>
          <p className="text-sm text-muted">{DISCLAIMER}</p>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          {opening ? <p className="text-sm text-muted">Opening a file…</p> : null}
          {error ? (
            <div className="border border-alert bg-alert-soft px-3 py-2 text-sm text-alert" role="alert">
              {error}{" "}
              {!session ? (
                <button className="underline" onClick={() => void openSession()}>
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}
          {session?.messages.map((message) => (
            <article key={message.id} className={message.role === "user" ? "ml-auto max-w-[40rem]" : "max-w-[42rem]"}>
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                {message.role === "user" ? "You" : "Intake desk"}
              </p>
              <div className={message.role === "user" ? "bg-ink px-3 py-2 text-sheet" : "border-l-2 border-brass pl-3"}>
                <Markdown text={message.content} />
              </div>
              {message.tools && message.tools.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {message.tools.map((tool, index) => (
                    <li key={`${tool.name}-${index}`} className="border border-line bg-paper px-2 py-0.5 text-[11px] text-muted">
                      {TOOL_LABELS[tool.name] ?? tool.name}
                    </li>
                  ))}
                </ul>
              ) : null}
              {message.citations && message.citations.length > 0 ? (
                <p className="mt-2 text-xs text-muted">Firm note: {message.citations.map((citation) => citation.title).join(", ")}</p>
              ) : null}
            </article>
          ))}
          {pending ? <p className="text-sm text-muted">Writing the note…</p> : null}
          <div ref={endRef} />
        </div>
        {suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            {suggestions.map((suggestion) => (
              <Button key={suggestion.id} variant="outline" size="sm" onClick={() => void send(suggestion.send)}>
                {suggestion.label}
              </Button>
            ))}
          </div>
        ) : null}
        <form
          className="border-t border-line p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <label htmlFor="intake-message" className="sr-only">
            Message the intake desk
          </label>
          <Textarea
            id="intake-message"
            value={draft}
            placeholder="What happened, or what do you want to know about the firm?"
            disabled={!session || pending}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => void openSession()} disabled={pending}>
              New intake
            </Button>
            <Button type="submit" disabled={!session || pending || draft.trim().length === 0}>
              Send
            </Button>
          </div>
        </form>
      </section>
      <aside className={embedded ? "hidden" : "h-fit border border-line bg-sheet p-4 lg:sticky lg:top-4"}>
        <h2 className="font-serif text-lg">Intake file</h2>
        <div className="mt-3">
          <IntakeFile session={session} />
        </div>
      </aside>
    </div>
  );
}
