import { PRACTICE_LABEL } from "@/lib/firm";
import type { Session } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_intake: "In intake",
  urgent: "Immediate handoff",
  conflict_hold: "Conflict hold",
  qualified: "Qualified",
  unqualified: "Unqualified",
  consult_booked: "Consult booked",
};

export function IntakeFile({ session }: { session: Session | null }) {
  if (!session) {
    return <p className="text-sm text-muted">The file opens when the desk does.</p>;
  }
  const parties = session.intake.opposingParties.join(", ");
  const rows = [
    ["Name", session.intake.clientName],
    ["Phone", session.intake.phone],
    ["Email", session.intake.email],
    ["Date", session.intake.incidentDate],
    ["Place", session.intake.location],
    ["Other parties", parties || undefined],
    ["Treatment", session.intake.treatment],
    ["Employer", session.intake.employer],
    ["Children", session.intake.children],
    ["County", session.intake.county],
    ["Citizenship", session.intake.citizenship],
    ["Process", session.intake.immigrationProcess],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <Badge>{STATUS_LABEL[session.status] ?? session.status}</Badge>
        {session.practiceArea ? <Badge>{PRACTICE_LABEL[session.practiceArea]}</Badge> : null}
        {session.urgency === "immediate" ? <Badge className="border-alert bg-alert-soft text-alert">Immediate</Badge> : null}
      </div>
      {session.conflict ? (
        <p>
          Conflict screen: {session.conflict.clear ? "no match on the demo list" : `hold — ${session.conflict.matches.map((match) => match.name).join(", ")}`}
        </p>
      ) : (
        <p className="text-muted">Conflict screen has not run.</p>
      )}
      {session.score ? (
        <p>
          Score {session.score.score}/100 · {session.score.qualified ? "meets the consult screen" : "does not meet the consult screen"}
        </p>
      ) : null}
      {session.consult ? (
        <p>
          {session.consult.label}
          <br />
          {session.consult.attorney}
        </p>
      ) : null}
      {session.matterId ? <p className="font-medium">Matter {session.matterId}</p> : null}
      <dl className="space-y-2">
        {rows.length === 0 ? <p className="text-muted">No facts collected yet.</p> : null}
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[7rem_1fr] gap-2 border-t border-line pt-2">
            <dt className="text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
