"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { PORTFOLIO_LINE, TOOL_LABELS } from "@/lib/firm";
import { displayTurnText } from "@/lib/slots";
import type { HandoffTicket, Session } from "@/lib/types";

export function AdminInbox({ sessions, tickets }: { sessions: Session[]; tickets: HandoffTicket[] }) {
  const router = useRouter();
  const first = sessions.find((session) => session.handoff)?.id ?? sessions[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(first);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0];

  async function resume() {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch("/api/sessions/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selected.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The desk did not resume.");
      setNote("The intake desk is back on this chat.");
      router.refresh();
    } catch (cause) {
      setNote(cause instanceof Error ? cause.message : "The desk did not resume.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-3xl">Inbox</h2>
      <p className="mt-1 text-[13px] text-muted">Conversations, tool calls, and handoff tickets. {PORTFOLIO_LINE}</p>
      <div className="mt-4 grid overflow-hidden rounded-[16px] border border-line bg-surface lg:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="max-h-[640px] divide-y divide-line overflow-y-auto border-b border-line lg:border-b-0 lg:border-r">
          {sessions.map((session) => {
            const ticket = tickets.find((item) => item.sessionId === session.id);
            const name = session.intake.clientName || "Prospective client";
            const active = session.id === selected?.id;
            return (
              <li key={session.id}>
                <button
                  type="button"
                  className={`w-full px-3 py-3 text-left text-[13px] ${active ? "bg-accent-soft" : ""} ${ticket ? "bg-accent-soft/60" : ""}`}
                  onClick={() => setSelectedId(session.id)}
                >
                  <span className="block font-medium">{name} · {session.status.replaceAll("_", " ")}</span>
                  <span className="mt-1 block text-[12px] text-muted">{ticket ? ticket.id : "No handoff ticket"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="max-h-[640px] overflow-y-auto p-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif text-2xl">{selected.intake.clientName || "Prospective client"}</h3>
                {selected.handoff ? (
                  <button type="button" data-testid="resume-bot" className="h-9 rounded-full border border-line px-3 text-[13px]" disabled={busy} onClick={() => void resume()}>
                    {busy ? "Resuming…" : "Resume bot"}
                  </button>
                ) : null}
              </div>
              {note ? <p className="mt-2 text-[13px]">{note}</p> : null}
              <div className="mt-4 space-y-3">
                {selected.messages.map((message) => (
                  <article key={message.id} className="text-[13px] leading-5">
                    <p className="text-[11px] uppercase tracking-wide text-muted">{message.role === "user" ? "Visitor" : "Desk"}</p>
                    <Markdown text={message.role === "user" ? displayTurnText(message.content) : message.content} />
                    {message.tools?.length ? <p className="mt-1 text-[12px] text-muted">{message.tools.map((tool) => TOOL_LABELS[tool.name] ?? tool.name).join(" · ")}</p> : null}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-muted">No conversations yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
