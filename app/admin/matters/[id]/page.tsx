import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Badge } from "@/components/ui/badge";
import { DISCLAIMER, FIRM, PRACTICE_LABEL, TOOL_LABELS } from "@/lib/firm";
import { getMatter } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MatterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getMatter(id);
  if (!found) notFound();
  const { matter, session } = found;
  const rows: Array<[string, string | undefined]> = [
    ["Client", matter.clientName],
    ["Phone", matter.phone],
    ["Email", matter.email],
    ["Practice", PRACTICE_LABEL[matter.practiceArea]],
    ["Attorney", matter.attorney],
    ["Urgency", matter.urgencyKind ?? matter.urgency],
    ["Conflict", matter.conflictClear === false ? "Hold" : matter.conflictClear ? "No match on the demo list" : "Not run"],
    ["Score", typeof matter.score === "number" ? `${matter.score} / 100` : undefined],
    ["Screen", matter.qualified === undefined ? undefined : matter.qualified ? "Qualified for a consult" : "Unqualified"],
    ["Consultation", matter.consult ? `${matter.consult.label} · ${matter.consult.attorney}` : undefined],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          Back to the pipeline
        </Link>
        <PrintButton />
      </div>
      <article className="print-sheet border border-line bg-sheet px-6 py-8 shadow-sm md:px-10">
        <header className="border-b border-ink pb-4">
          <p className="text-xs uppercase tracking-[0.22em]">{FIRM.name}</p>
          <p className="text-xs text-muted">{FIRM.address}</p>
          <h1 className="mt-6 font-serif text-3xl">Confidential intake summary</h1>
          <p className="mt-1 text-sm text-muted">
            {matter.id} · {new Date(matter.updatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-brass">Synthetic portfolio data</p>
        </header>
        <p className="mt-4 border border-line bg-paper px-3 py-2 text-sm leading-6">{DISCLAIMER} This summary is an intake note, not an opinion letter.</p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows
            .filter((row): row is [string, string] => Boolean(row[1]))
            .map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ))}
        </dl>
        <section className="mt-8">
          <h2 className="font-serif text-2xl">What was reported</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{matter.narrative || matter.summary}</p>
        </section>
        {matter.reasons.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-serif text-2xl">Screen notes</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
              {matter.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Next step</h2>
          <p className="mt-2 text-sm leading-6">
            {matter.status === "consult_booked"
              ? `Hold the consultation with ${matter.consult?.attorney ?? "the assigned lawyer"}. A booking is not an engagement.`
              : matter.status === "urgent"
                ? "A person should call now. The chatbot already gave public emergency resources and stopped intake."
                : matter.status === "conflict_hold"
                  ? "A person reviews the conflict screen before anyone discusses the facts further."
                  : matter.status === "unqualified"
                    ? "No consultation was offered. The note is not a ruling that a claim is barred."
                    : matter.status === "qualified"
                      ? "The screen met the consult threshold. The time is not booked yet."
                      : "Intake is still open."}
          </p>
        </section>
        {session ? (
          <section className="mt-8 border-t border-line pt-6">
            <h2 className="font-serif text-2xl">Transcript</h2>
            <div className="mt-4 space-y-4">
              {session.messages.map((message) => (
                <div key={message.id}>
                  <p className="text-xs uppercase tracking-wide text-muted">{message.role === "user" ? "Caller" : "Desk"}</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  {message.tools && message.tools.length > 0 ? (
                    <p className="mt-1 text-xs text-muted">{message.tools.map((tool) => TOOL_LABELS[tool.name] ?? tool.name).join(" · ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <footer className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          <Badge>Demo</Badge>
          <p className="mt-2">{FIRM.name} is fictional. Do not rely on this page for a real legal matter.</p>
        </footer>
      </article>
    </main>
  );
}
