import Link from "next/link";
import { TOOL_LABELS } from "@/lib/firm";
import type { HandoffTicket, Session } from "@/lib/types";

export function Inbox({ sessions, tickets }: { sessions: Session[]; tickets: HandoffTicket[] }) {
  return (
    <section className="mt-10 border border-line bg-sheet p-4">
      <h2 className="font-serif text-3xl">Inbox</h2>
      <p className="mt-1 text-sm text-muted">Conversations, tool calls, and handoff tickets. This demo is read-only for visitors.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm uppercase tracking-wide text-muted">Handoffs</h3>
          {tickets.length === 0 ? <p className="mt-3 text-sm text-muted">No handoff tickets yet.</p> : null}
          <ul className="mt-3 space-y-3">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="border border-line bg-paper p-3 text-sm">
                <p className="font-medium">
                  {ticket.id} · {ticket.reason.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-muted">{ticket.summary}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-wide text-muted">Recent conversations</h3>
          <ul className="mt-3 space-y-3">
            {sessions.slice(0, 8).map((session) => {
              const tools = session.messages.flatMap((message) => message.tools ?? []);
              return (
                <li key={session.id} className="border border-line bg-paper p-3 text-sm">
                  <p className="font-medium">
                    {session.intake.clientName || "Prospective client"} · {session.status.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-muted">{tools.length === 0 ? "No tool calls yet." : tools.map((tool) => TOOL_LABELS[tool.name] ?? tool.name).join(" · ")}</p>
                  {session.matterId ? (
                    <Link href={`/admin/matters/${session.matterId}`} className="mt-2 inline-block underline">
                      {session.matterId}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
