import { z } from "zod";
import { ATTORNEYS, PRACTICE_LABEL } from "./firm";
import type { ChatMessage, PracticeArea, Session, Suggestion } from "./types";

const AREAS = ["personal_injury", "employment", "family", "immigration"] as const;

const conflictSchema = z.object({
  clear: z.boolean(),
  parties: z.array(z.string()).default([]),
  matches: z
    .array(z.object({ name: z.string(), role: z.string(), matter: z.string() }))
    .default([]),
  note: z.string().default(""),
});

const classifySchema = z.object({
  practiceArea: z.string().nullable().optional(),
});

const scoreSchema = z.object({
  score: z.number(),
  qualified: z.boolean(),
  reasons: z.array(z.string()).default([]),
});

const consultSchema = z.object({
  slotId: z.string(),
  startsAt: z.string(),
  label: z.string(),
  attorney: z.string(),
  mode: z.string(),
});

const handoffSchema = z.object({
  ticketId: z.string(),
});

const collectSchema = z.object({
  practiceArea: z.string().optional(),
  missing: z.array(z.string()).default([]),
  complete: z.boolean().optional(),
});

export type MatterCard = { type: "matter"; area: Exclude<PracticeArea, "out_of_scope"> };
export type ConflictCard = {
  type: "conflict";
  clear: boolean;
  parties: string[];
  matches: Array<{ name: string; role: string; matter: string }>;
  note: string;
};
export type FormCard = {
  type: "form";
  area: Exclude<PracticeArea, "out_of_scope">;
  fields: Array<"clientName" | "phone" | "email">;
};
export type ScoreCard = {
  type: "score";
  score: number;
  qualified: boolean;
  reasons: string[];
  attorney: string;
  focus: string;
};
export type BookingCard = { type: "booking"; slots: Suggestion[] };
export type QuoteCard = { type: "quote"; kind: "contingency" | "hourly" | "flat" };
export type ConfirmCard = {
  type: "confirm";
  code: string;
  when: string;
  where: string;
  who: string;
  startsAt: string;
};
export type TimelineCard = {
  type: "timeline";
  status: string;
  steps: Array<{ title: string; meta: string; state: "done" | "current" | "next" }>;
};
export type SafetyCard = { type: "safety"; ticketId?: string };
export type HandoffCard = { type: "handoff"; ticketId: string };
export type ChecklistCard = { type: "checklist"; items: Array<{ label: string; done: boolean }> };

export type CardModel =
  | MatterCard
  | ConflictCard
  | FormCard
  | ScoreCard
  | BookingCard
  | QuoteCard
  | ConfirmCard
  | TimelineCard
  | SafetyCard
  | HandoffCard
  | ChecklistCard;

function toolOutput(message: ChatMessage, name: string): Record<string, unknown> | undefined {
  return message.tools?.find((tool) => tool.name === name)?.output;
}

function isArea(value: string | null | undefined): value is Exclude<PracticeArea, "out_of_scope"> {
  return AREAS.includes(value as (typeof AREAS)[number]);
}

function quoteKind(message: ChatMessage): QuoteCard["kind"] | null {
  const titles = (message.citations ?? []).map((citation) => citation.title.toLowerCase()).join(" ");
  if (/contingency/.test(titles)) return "contingency";
  if (/hourly/.test(titles)) return "hourly";
  if (/flat/.test(titles)) return "flat";
  return null;
}

function slotSuggestions(suggestions: Suggestion[] | undefined): Suggestion[] {
  return (suggestions ?? []).filter((suggestion) => /\d{1,2}:\d{2}\s*[AP]M/i.test(suggestion.label));
}

export function timelineFor(session: Session): TimelineCard {
  const booked = session.status === "consult_booked";
  const scored = Boolean(session.score);
  const screened = Boolean(session.conflict);
  const sorted = Boolean(session.practiceArea);
  const steps: TimelineCard["steps"] = [
    { title: "Sort the matter", meta: session.practiceArea ? PRACTICE_LABEL[session.practiceArea] : "Waiting", state: sorted ? "done" : "current" },
    { title: "Screen the names", meta: session.conflict ? (session.conflict.clear ? "No match on the demo list" : "Needs review") : "Not run", state: screened ? "done" : sorted ? "current" : "next" },
    { title: "Intake form", meta: scored ? "Contact and facts collected" : "In progress", state: scored ? "done" : screened ? "current" : "next" },
    { title: "Screening consult", meta: session.consult?.label ?? "Not booked", state: booked ? "done" : scored ? "current" : "next" },
  ];
  const status =
    session.status === "consult_booked"
      ? "Booked"
      : session.status === "conflict_hold"
        ? "Needs review"
        : session.status === "urgent"
          ? "Open"
          : session.status === "qualified"
            ? "Qualified"
            : "In intake";
  return { type: "timeline", status, steps };
}

export function deriveCards(message: ChatMessage, session: Session, latest: boolean): CardModel[] {
  const cards: CardModel[] = [];
  const classify = classifySchema.safeParse(toolOutput(message, "classify_matter") ?? {});
  if (classify.success && isArea(classify.data.practiceArea) && toolOutput(message, "classify_matter")) {
    cards.push({ type: "matter", area: classify.data.practiceArea });
  }

  const conflict = conflictSchema.safeParse(toolOutput(message, "run_conflict_check"));
  if (conflict.success && toolOutput(message, "run_conflict_check")) cards.push({ type: "conflict", ...conflict.data });

  const collect = collectSchema.safeParse(toolOutput(message, "collect_intake"));
  if (latest && collect.success && toolOutput(message, "collect_intake") && !collect.data.complete && isArea(session.practiceArea)) {
    const fields = (["clientName", "phone", "email"] as const).filter((field) => collect.data.missing.includes(field));
    if (fields.length > 0) cards.push({ type: "form", area: session.practiceArea, fields });
  }

  const score = scoreSchema.safeParse(toolOutput(message, "score_case"));
  if (score.success && toolOutput(message, "score_case") && isArea(session.practiceArea)) {
    const attorney = ATTORNEYS[session.practiceArea];
    cards.push({ type: "score", ...score.data, attorney: attorney.name, focus: attorney.focus });
  }

  const consult = consultSchema.safeParse(toolOutput(message, "schedule_consultation"));
  if (consult.success && toolOutput(message, "schedule_consultation")) {
    const matter = message.tools?.find((tool) => tool.name === "create_crm_matter")?.output;
    const code = typeof matter?.matterId === "string" ? matter.matterId : session.matterId ?? "HP-PENDING";
    cards.push({
      type: "confirm",
      code,
      when: consult.data.label,
      where: consult.data.mode,
      who: consult.data.attorney,
      startsAt: consult.data.startsAt,
    });
  } else if (latest) {
    const slots = slotSuggestions(message.suggestions);
    if (slots.length > 0) cards.push({ type: "booking", slots });
  }

  const kind = quoteKind(message);
  if (kind) cards.push({ type: "quote", kind });

  const handoff = handoffSchema.safeParse(toolOutput(message, "request_handoff"));
  if (handoff.success && toolOutput(message, "request_handoff")) {
    const reason = message.tools?.find((tool) => tool.name === "request_handoff")?.input.reason;
    if (reason === "sensitive" || session.urgency === "immediate") cards.push({ type: "safety", ticketId: handoff.data.ticketId });
    else cards.push({ type: "handoff", ticketId: handoff.data.ticketId });
  }

  if (latest && session.practiceArea && session.practiceArea !== "out_of_scope" && (message.tools?.length ?? 0) > 0) {
    cards.push(timelineFor(session));
    cards.push(checklistFor(session));
  }

  return cards;
}

export function checklistFor(session: Session): ChecklistCard {
  const contact = Boolean(session.intake.clientName && session.intake.phone && session.intake.email);
  return {
    type: "checklist",
    items: [
      { label: "What happened", done: Boolean(session.intake.narrative) },
      { label: "Other party named", done: session.intake.opposingParties.length > 0 },
      { label: "Name, phone, and email", done: contact },
      { label: "Photo ID for the consult", done: Boolean(session.consult) },
    ],
  };
}

export function followUps(session: Session, message: ChatMessage): Suggestion[] {
  const fromEngine = otherSuggestions(message.suggestions);
  const extras: Suggestion[] = [
    { id: "fu-fees", label: "What a consult costs", send: "What are your fees for a personal injury matter?" },
    { id: "fu-bring", label: "What should I bring?", send: "What should I bring to a consultation?" },
    { id: "fu-human", label: "Talk to a person", send: "I want to talk to a human." },
  ];
  if (!session.intake.clientName) extras.unshift({ id: "fu-lead", label: "Leave my details", send: "__lead__" });
  if (session.stage === "scheduling" && !session.consult) {
    extras.unshift({ id: "fu-first", label: "First open time", send: "the first open time" });
  }
  const merged: Suggestion[] = [];
  for (const item of [...fromEngine, ...extras]) {
    if (merged.length >= 3) break;
    if (merged.some((existing) => existing.label === item.label)) continue;
    merged.push(item);
  }
  return merged;
}

export function otherSuggestions(suggestions: Suggestion[] | undefined): Suggestion[] {
  return (suggestions ?? []).filter((suggestion) => !/\d{1,2}:\d{2}\s*[AP]M/i.test(suggestion.label));
}

export function attachmentNames(content: string): string[] {
  const match = content.match(/\n\nAttached: (.+)$/);
  if (!match) return [];
  return match[1].split(",").map((name) => name.trim()).filter(Boolean);
}

export function visibleUserText(content: string): string {
  return content.replace(/\n\nAttached: .+$/, "");
}
