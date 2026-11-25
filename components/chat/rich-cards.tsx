"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, ShieldCheck } from "lucide-react";
import { FEE_TABLES } from "@/lib/brand";
import type { CardModel } from "@/lib/cards";
import type { Suggestion } from "@/lib/types";
import { FIRM, PRACTICE_LABEL } from "@/lib/firm";

function dayKey(label: string) {
  const parts = label.split(",");
  if (parts.length < 2) return label;
  return `${parts[0]},${parts[1]}`.trim();
}

function clock(label: string) {
  return label.match(/\d{1,2}:\d{2}\s*[AP]M/)?.[0] ?? label;
}

export function RichCards({
  cards,
  frozen,
  onSend,
  onLead,
}: {
  cards: CardModel[];
  frozen?: boolean;
  onSend: (text: string) => void;
  onLead?: () => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      {cards.map((card, index) => {
        if (card.type === "matter") return <MatterCard key={index} card={card} frozen={frozen} onSend={onSend} />;
        if (card.type === "conflict") return <ConflictCard key={index} card={card} />;
        if (card.type === "form") return <LeadCard key={index} testId="card-form" onSend={onSend} />;
        if (card.type === "score") return <ScoreCard key={index} card={card} frozen={frozen} onSend={onSend} />;
        if (card.type === "booking") return <SlotCard key={index} slots={card.slots} frozen={frozen} onSend={onSend} />;
        if (card.type === "quote") return <QuoteCard key={index} kind={card.kind} frozen={frozen} onSend={onSend} onLead={onLead} />;
        if (card.type === "confirm") return <ConfirmCard key={index} card={card} onLead={onLead} />;
        if (card.type === "timeline") return <TimelineCard key={index} card={card} />;
        if (card.type === "checklist") return <ChecklistCard key={index} card={card} />;
        if (card.type === "safety") return <SafetyCard key={index} ticketId={card.ticketId} />;
        return <HandoffCard key={index} ticketId={card.ticketId} />;
      })}
    </div>
  );
}

function Shell({ children, testId, className = "" }: { children: React.ReactNode; testId: string; className?: string }) {
  return (
    <section data-testid={testId} className={`rounded-[16px] border border-line bg-surface p-3 shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </section>
  );
}

function MatterCard({ card, frozen, onSend }: { card: Extract<CardModel, { type: "matter" }>; frozen?: boolean; onSend: (text: string) => void }) {
  const areas = ["personal_injury", "employment", "family", "immigration"] as const;
  return (
    <Shell testId="card-matter">
      <p className="text-[14px] font-semibold leading-5">Matter type</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {areas.map((area) => (
          <button
            key={area}
            type="button"
            disabled={frozen || area === card.area}
            onClick={() => onSend(`This is a ${PRACTICE_LABEL[area].toLowerCase()} matter.`)}
            className={`h-9 rounded-full border px-3 text-[13px] font-medium ${area === card.area ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface"}`}
          >
            {PRACTICE_LABEL[area]}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function ConflictCard({ card }: { card: Extract<CardModel, { type: "conflict" }> }) {
  return (
    <Shell testId="card-conflict">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        <p className="text-[14px] font-semibold">{card.clear ? "Conflict screen clear" : "Conflict screen needs review"}</p>
      </div>
      <p className="mt-1 text-[13px] leading-5 text-muted">{card.note || "Preliminary screen against the demo client list."}</p>
      <p className="mt-2 font-mono text-[13px]">{card.parties.join(", ") || "No parties yet"}</p>
      {!card.clear
        ? card.matches.map((match) => (
            <p key={match.name} className="mt-1 text-[13px]">
              {match.name} · {match.role} · {match.matter}
            </p>
          ))
        : null}
    </Shell>
  );
}

export function LeadCard({ testId = "card-form", onSend }: { testId?: string; onSend: (text: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  if (done) {
    return (
      <Shell testId={testId}>
        <p className="text-[14px] font-semibold">Contact saved for the team</p>
        <p className="mt-1 text-[13px] leading-5 text-muted">{done}</p>
      </Shell>
    );
  }
  return (
    <Shell testId={testId}>
      <p className="text-[14px] font-semibold leading-5">Leave contact details</p>
      <p className="mt-1 text-[12px] text-muted">The intake team uses this only for the demo file.</p>
      <form
        className="mt-3 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!/^[A-Za-z]+(?:\s+[A-Za-z]+){1,2}$/.test(name.trim())) {
            setProblem("Enter a first and last name.");
            return;
          }
          if (!/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/.test(phone)) {
            setProblem("Use a 555 phone number, like 555-014-2299.");
            return;
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setProblem("Enter an email address.");
            return;
          }
          if (!consent) {
            setProblem("Check consent so the team can use these details.");
            return;
          }
          setProblem(null);
          const summary = `We'll use this callback number: ${phone.trim()}`;
          setDone(summary);
          onSend(`My name is ${name.trim()}. You can reach me at ${phone.trim()} or ${email.trim()}.`);
        }}
      >
        <label className="block text-[12px] font-medium">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jordan Hale" className="mt-1 h-10 w-full rounded-[12px] border border-line bg-surface px-3 text-[14px]" />
        </label>
        <label className="block text-[12px] font-medium">
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="555-014-2299" className="mt-1 h-10 w-full rounded-[12px] border border-line bg-surface px-3 text-[14px]" />
        </label>
        <label className="block text-[12px] font-medium">
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jordan.hale@example.com" className="mt-1 h-10 w-full rounded-[12px] border border-line bg-surface px-3 text-[14px]" />
        </label>
        <label className="flex items-start gap-2 text-[12px] leading-5">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
          The intake team may use these details for this demo file.
        </label>
        {problem ? (
          <p className="flex items-center gap-1 text-[12px] text-danger" role="alert">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> {problem}
          </p>
        ) : null}
        <button type="submit" className="inline-flex h-11 items-center rounded-[14px] bg-accent px-4 text-[13px] font-medium text-accent-foreground">
          Save for the team
        </button>
      </form>
    </Shell>
  );
}

function ScoreCard({ card, frozen, onSend }: { card: Extract<CardModel, { type: "score" }>; frozen?: boolean; onSend: (text: string) => void }) {
  return (
    <Shell testId="card-score">
      <p className="text-[14px] font-semibold">Screen score {card.score}/100</p>
      <p className="mt-1 text-[13px] text-muted">{card.qualified ? "Meets the consult screen" : "Does not meet the consult screen"} · {card.attorney}</p>
      <p className="mt-1 text-[13px] leading-5">{card.focus}</p>
      <p className="mt-2 text-[12px] text-muted">{card.reasons.join(" ")}</p>
      {card.qualified && !frozen ? (
        <button type="button" className="mt-3 inline-flex h-11 items-center rounded-[14px] bg-accent px-4 text-[13px] font-medium text-accent-foreground" onClick={() => onSend("the first open time")}>
          Book a consult
        </button>
      ) : null}
    </Shell>
  );
}

export function SlotCard({ slots, frozen, onSend }: { slots: Suggestion[]; frozen?: boolean; onSend: (text: string) => void }) {
  const groups = new Map<string, Suggestion[]>();
  for (const slot of slots) {
    const key = dayKey(slot.label);
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  }
  return (
    <Shell testId="card-booking">
      <p className="text-[11.5px] text-muted">Only times the booking system returned</p>
      {[...groups.entries()].map(([day, times]) => (
        <div key={day} className="mt-2">
          <p className="text-[13px] font-medium">Open times · {day}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {times.map((slot) => (
              <button
                key={slot.id}
                type="button"
                data-testid="slot-chip"
                disabled={frozen}
                aria-label={slot.label}
                onClick={() => onSend(slot.send)}
                className="h-9 min-w-11 rounded-[12px] border border-line bg-surface px-3 text-[13px] font-medium hover:bg-accent-soft"
              >
                {clock(slot.label)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="mt-2 text-[11.5px] text-muted">Central Time (America/Chicago). A booking is not an engagement letter.</p>
    </Shell>
  );
}

function QuoteCard({
  kind,
  frozen,
  onSend,
  onLead,
}: {
  kind: "contingency" | "hourly" | "flat";
  frozen?: boolean;
  onSend: (text: string) => void;
  onLead?: () => void;
}) {
  const table = FEE_TABLES[kind];
  return (
    <Shell testId="card-quote">
      <p className="text-[14px] font-semibold">{table.title}</p>
      <dl className="mt-2">
        {table.rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 text-[13px]">
            <dt>{row.label}</dt>
            <dd className="font-mono text-[13px]">{row.amount}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[18px] font-semibold leading-6">{table.total}</p>
      <p className="mt-1 text-[11.5px] leading-4 text-muted">{table.note}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={frozen} className="inline-flex h-11 items-center rounded-[14px] bg-accent px-4 text-[13px] font-medium text-accent-foreground" onClick={() => onSend("I was rear-ended last month on Harbor Avenue in Ashford. I have been treating with an orthopedist. The other driver was Marcus Bell.")}>
          Book a consult
        </button>
        <button type="button" disabled={frozen} className="inline-flex h-11 items-center rounded-[14px] border border-line px-4 text-[13px]" onClick={() => (onLead ? onLead() : onSend("I want to talk to a human."))}>
          Talk to a specialist
        </button>
      </div>
    </Shell>
  );
}

function ConfirmCard({ card, onLead }: { card: Extract<CardModel, { type: "confirm" }>; onLead?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Shell testId="card-confirm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-pine-soft text-success">
          <Check className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-[14px] font-semibold">You&apos;re booked</p>
      </div>
      <dl className="mt-3 space-y-1 text-[13px]">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted">Code</dt>
          <dd className="flex items-center gap-1 font-mono">
            {card.code}
            <button
              type="button"
              aria-label="Copy confirmation code"
              onClick={() => {
                void navigator.clipboard.writeText(card.code);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">When</dt>
          <dd>{card.when}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Where</dt>
          <dd className="text-right">{card.where}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Who</dt>
          <dd>{card.who}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[11.5px] text-muted">Not an engagement letter. {FIRM.address}.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className="inline-flex h-11 items-center rounded-[14px] border border-line px-4 text-[13px]" href={ics(card)} download={`${card.code}.ics`}>
          Add to calendar
        </a>
        <button type="button" className="inline-flex h-11 items-center rounded-[14px] border border-line px-4 text-[13px]" onClick={() => onLead?.()}>
          Talk to a person
        </button>
      </div>
    </Shell>
  );
}

function ics(card: Extract<CardModel, { type: "confirm" }>) {
  const start = new Date(card.startsAt);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:Screening consult with ${card.who}`, `LOCATION:${card.where}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

function TimelineCard({ card }: { card: Extract<CardModel, { type: "timeline" }> }) {
  return (
    <Shell testId="card-timeline">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-semibold">Intake stage</p>
        <span className="rounded-full border border-line px-2 py-0.5 text-[11.5px]">{card.status}</span>
      </div>
      <ol className="mt-3 space-y-3 border-l-2 border-line pl-3">
        {card.steps.map((step) => (
          <li key={step.title} className="relative">
            <span className={`absolute -left-[17px] top-1 h-3 w-3 rounded-full border-2 ${step.state === "done" ? "border-success bg-success" : step.state === "current" ? "border-accent bg-accent" : "border-line bg-surface"}`} />
            <p className="text-[13px] font-medium">{step.title}</p>
            <p className="text-[12px] text-muted">{step.meta}</p>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

function ChecklistCard({ card }: { card: Extract<CardModel, { type: "checklist" }> }) {
  return (
    <Shell testId="card-checklist">
      <p className="text-[14px] font-semibold">What the file still needs</p>
      <ul className="mt-2 space-y-1.5">
        {card.items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-[13px]">
            <span className={`grid h-4 w-4 place-items-center rounded border ${item.done ? "border-success bg-success text-white" : "border-line"}`} aria-hidden>
              {item.done ? <Check className="h-3 w-3" /> : null}
            </span>
            <span className={item.done ? "text-muted line-through" : ""}>{item.label}</span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function SafetyCard({ ticketId }: { ticketId?: string }) {
  return (
    <Shell testId="card-safety" className="border-danger">
      <p className="text-[14px] font-semibold text-danger" data-testid="urgent-banner">
        Urgent — this needs a person, not a chatbot
      </p>
      <p className="mt-1 text-[13px] leading-5">If you are in immediate danger, call 911. National Domestic Violence Hotline: 1-800-799-7233.</p>
      {ticketId ? <p className="mt-2 font-mono text-[13px]">{ticketId}</p> : null}
    </Shell>
  );
}

function HandoffCard({ ticketId }: { ticketId: string }) {
  return (
    <Shell testId="card-handoff">
      <p className="text-[14px] font-semibold">Connecting you with the Harlow & Pierce desk</p>
      <p className="mt-1 text-[13px] leading-5">In this demo, the ticket appears in /admin. A specialist usually replies in a few minutes.</p>
      <p className="mt-2 font-mono text-[13px]">{ticketId}</p>
    </Shell>
  );
}
