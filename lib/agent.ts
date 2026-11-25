import { classifyMatter } from "./classify";
import { runConflictCheck } from "./conflict";
import { extractFacts } from "./extract";
import { ATTORNEYS, DISCLAIMER, FIRM, PRACTICE_LABEL } from "./firm";
import {
  ADVICE_REFUSAL,
  isFirmQuestion,
  isFrustrated,
  isLegalAdviceRequest,
  isOffTopic,
  isOutOfScopeRequest,
  isPromptInjection,
  isUngroundedQuestion,
  wantsHuman,
} from "./guardrails";
import { intakeProgress } from "./intake-form";
import { renderKbAnswer } from "./rag";
import { assertToolInput } from "./tool-schemas";
import { scoreCase } from "./score";
import { matchSlot, openSlots, toConsultation } from "./slots";
import type {
  ChatMessage,
  Citation,
  IntakeAnswers,
  HandoffTicket,
  MatterDraft,
  PracticeArea,
  Session,
  Suggestion,
  ToolTrace,
  TurnContext,
  UrgencyKind,
} from "./types";
import { detectUrgency } from "./urgency";

export const STARTERS: Suggestion[] = [
  {
    id: "injury",
    label: "Rear-end injury",
    send: "I was rear-ended last month on Harbor Avenue in Ashford. I have a herniated disc and I've been treating with an orthopedist. The other driver was Marcus Bell from Northwind Couriers.",
  },
  {
    id: "fired",
    label: "I was fired",
    send: "I was fired last month by my employer in Ashford. I want to talk about the termination.",
  },
  {
    id: "fees",
    label: "What are your fees?",
    send: "What are your fees for a personal injury matter?",
  },
  {
    id: "advice",
    label: "Can you give advice?",
    send: "Should I accept the insurance company's settlement offer?",
  },
  {
    id: "human",
    label: "Talk to a person",
    send: "I want to talk to a human.",
  },
];

const GREETING = [
  `I’m the intake assistant for ${FIRM.name}. I can explain how the firm works, collect the facts an intake file needs, and request a consultation.`,
  `${DISCLAIMER} This chat is not privileged. Please don’t put highly sensitive details here that you would not want stored in an intake note.`,
  "If you are in immediate danger, call 911.",
  "You can ask about fees, attorneys, consultations, or what to bring. You can ask to talk to a person at any time. Or tell me what happened.",
].join("\n\n");

function mid(): string {
  return `m_${Math.random().toString(36).slice(2, 10)}`;
}

function blankIntake(): IntakeAnswers {
  return { opposingParties: [] };
}

export function createSession(now: Date, id = crypto.randomUUID()): Session {
  const createdAt = now.toISOString();
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    messages: [
      {
        id: mid(),
        role: "assistant",
        content: GREETING,
        createdAt,
        suggestions: STARTERS,
      },
    ],
    stage: "greeting",
    status: "new",
    practiceArea: null,
    urgency: "routine",
    urgencyKind: null,
    intake: blankIntake(),
    consult: null,
    handoff: false,
    adviceRefusals: 0,
    introduced: false,
  };
}

function pushMessage(
  session: Session,
  content: string,
  now: Date,
  tools: ToolTrace[],
  citations: Citation[],
  suggestions: Suggestion[],
) {
  const message: ChatMessage = {
    id: mid(),
    role: "assistant",
    content,
    createdAt: now.toISOString(),
  };
  for (const tool of tools) assertToolInput(tool.name, tool.input);
  if (tools.length > 0) message.tools = tools;
  if (citations.length > 0) message.citations = citations;
  if (suggestions.length > 0) message.suggestions = suggestions;
  session.messages.push(message);
  session.updatedAt = now.toISOString();
}

function asRecord(value: object): Record<string, unknown> {
  return { ...(value as Record<string, unknown>) };
}

function mergeIntake(intake: IntakeAnswers, facts: Partial<IntakeAnswers>) {
  for (const [key, value] of Object.entries(facts)) {
    if (value === undefined) continue;
    if (key === "opposingParties" && Array.isArray(value)) {
      for (const party of value) {
        if (!intake.opposingParties.some((existing) => existing.toLowerCase() === party.toLowerCase())) {
          intake.opposingParties.push(party);
        }
      }
      continue;
    }
    if (typeof value === "string" && value.trim()) {
      (intake as unknown as Record<string, string>)[key] = value.trim();
    }
  }
  if (intake.employer && !intake.opposingParties.some((party) => party.toLowerCase() === intake.employer!.toLowerCase())) {
    intake.opposingParties.push(intake.employer);
  }
}

function remember(session: Session, message: string) {
  if (message.startsWith("book:")) return;
  const current = session.intake.narrative ?? "";
  if (!current) session.intake.narrative = message.slice(0, 2000);
  else if (message.length > 40) session.intake.narrative = `${current}\n${message}`.slice(0, 2000);
}

function draftFrom(session: Session, summary: string): MatterDraft {
  const area = session.practiceArea ?? "out_of_scope";
  return {
    id: session.matterId ?? "HP-PENDING",
    sessionId: session.id,
    status: session.status,
    practiceArea: area,
    clientName: session.intake.clientName || "Prospective client",
    phone: session.intake.phone,
    email: session.intake.email,
    score: session.score?.score,
    qualified: session.score?.qualified,
    reasons: session.score?.reasons ?? [],
    urgency: session.urgency,
    urgencyKind: session.urgencyKind,
    conflictClear: session.conflict?.clear,
    summary,
    attorney: area === "out_of_scope" ? undefined : ATTORNEYS[area].name,
    consult: session.consult,
    narrative: session.intake.narrative ?? "",
    intake: session.intake,
  };
}

function ensureMatter(session: Session, ctx: TurnContext, summary: string, tools: ToolTrace[]): MatterDraft {
  const created = !session.matterId;
  if (!session.matterId) session.matterId = ctx.nextMatterId;
  const matter = draftFrom(session, summary);
  tools.push({
    name: "create_crm_matter",
    input: { matterId: matter.id, status: matter.status, created },
    output: { matterId: matter.id, status: matter.status },
  });
  return matter;
}

function urgentCopy(kinds: UrgencyKind[]): string {
  const parts = ["I am stopping the regular intake. This needs a person now, not a chatbot."];
  if (kinds.includes("domestic_violence")) {
    parts.push("If you are in immediate danger, call 911.");
    parts.push(
      "National Domestic Violence Hotline: 1-800-799-7233, 24 hours, or text START to 88788. https://www.thehotline.org",
    );
    parts.push("I will not ask more questions about the incident, and I cannot advise you on a protective order.");
  }
  if (kinds.includes("detention")) {
    parts.push(
      "You can look up a person in custody with the public ICE Online Detainee Locator: https://locator.ice.gov. That lookup is not legal advice.",
    );
  }
  if (kinds.includes("court")) {
    parts.push(`A hearing tomorrow has to go to a person now. Call ${FIRM.phone}. I will not tell you what to say to the judge.`);
  } else if (kinds.includes("detention")) {
    parts.push(`Call ${FIRM.phone} and say this is time-sensitive. I will not tell you what to say to the judge.`);
  } else {
    parts.push(`I flagged this for immediate handoff at ${FIRM.phone}.`);
  }
  parts.push(DISCLAIMER);
  return parts.join("\n\n");
}

function sameParties(left: string[], right: string[]): boolean {
  const norm = (values: string[]) => values.map((value) => value.toLowerCase()).sort().join("|");
  return norm(left) === norm(right);
}

function slotBlock(session: Session, ctx: TurnContext): { text: string; suggestions: Suggestion[] } {
  const slots = openSlots(ctx.now, session.practiceArea, ctx.bookedSlotIds);
  const lines = slots.map((slot) => `• ${slot.label} — ${slot.attorney}`).join("\n");
  return {
    text: lines || "I don’t have an open screening time on the demo calendar. Call (555) 014-2200.",
    suggestions: slots.map((slot) => ({ id: slot.id, label: slot.label, send: `book:${slot.id}` })),
  };
}

function openTicket(session: Session, reason: HandoffTicket["reason"], summary: string, now: Date): HandoffTicket {
  const ticket: HandoffTicket = {
    id: `T-${session.id.replace(/[^a-z0-9]/gi, "").slice(-6) || "desk"}-${session.messages.length}`,
    sessionId: session.id,
    reason,
    summary: summary.slice(0, 500),
    createdAt: now.toISOString(),
  };
  session.ticketId = ticket.id;
  return ticket;
}

function answerFromNotes(session: Session, message: string, now: Date, ctx: TurnContext): HandoffTicket | undefined {
  const found = renderKbAnswer(message);
  const tools: ToolTrace[] = [
    {
      name: "search_kb",
      input: { query: message },
      output: { titles: found.citations.map((citation) => citation.title), confident: found.confident },
    },
  ];
  if (!found.confident) {
    const summary = `Low-confidence retrieval. Question: ${message.slice(0, 180)}`;
    const ticket = openTicket(session, "low_confidence", summary, now);
    tools.push({
      name: "request_handoff",
      input: { reason: "low_confidence", summary },
      output: { ticketId: ticket.id },
    });
    pushMessage(
      session,
      `I don't have a firm note that answers that with enough confidence. I opened a handoff so a person on the intake desk can take it. You can also call ${FIRM.phone}. ${DISCLAIMER}`,
      now,
      tools,
      [],
      [{ id: "human", label: "Talk to a person", send: "I want to talk to a human." }],
    );
    return ticket;
  }
  let text = found.text;
  let suggestions: Suggestion[] = [];
  if (session.stage === "collecting" && session.practiceArea) {
    const progress = intakeProgress(session.practiceArea, session.intake);
    if (progress.question) text += `\n\nWe can keep the intake going. ${progress.question}`;
  }
  if (session.stage === "scheduling" && session.score?.qualified && !session.consult) {
    const slots = slotBlock(session, ctx);
    text += `\n\nThe screening times still open:\n\n${slots.text}`;
    suggestions = slots.suggestions;
  }
  if (session.consult) {
    text += `\n\nYour consultation is still ${session.consult.label} with ${session.consult.attorney}. Matter ${session.matterId}.`;
  }
  pushMessage(session, text, now, tools, found.citations, suggestions);
  return undefined;
}

export function applyTurn(input: Session, raw: string, ctx: TurnContext): { session: Session; matter?: MatterDraft; ticket?: HandoffTicket } {
  const message = raw.trim();
  const session = structuredClone(input);
  const now = ctx.now;
  session.messages.push({
    id: mid(),
    role: "user",
    content: message,
    createdAt: now.toISOString(),
  });
  session.updatedAt = now.toISOString();

  const urgency = detectUrgency(message);
  if (urgency.immediate && !session.handoff) {
    const tools: ToolTrace[] = [];
    const classification = classifyMatter(message);
    tools.push({
      name: "classify_matter",
      input: { description: message },
      output: asRecord(classification),
    });
    let area: PracticeArea | null = classification.practiceArea;
    if (!area) {
      if (urgency.kinds.includes("detention")) area = "immigration";
      else area = "family";
    }
    session.practiceArea = area;
    session.urgency = "immediate";
    session.urgencyKind = urgency.kind;
    session.handoff = true;
    session.stage = "closed";
    session.status = "urgent";
    session.introduced = true;
    remember(session, message);
    const summary = `${session.intake.clientName ?? "Prospective client"} — immediate handoff (${urgency.kinds.join(", ")}). Intake stopped.`;
    const matter = ensureMatter(session, ctx, summary, tools);
    const ticket = openTicket(session, "sensitive", summary, now);
    tools.push({
      name: "request_handoff",
      input: { reason: "sensitive", summary },
      output: { ticketId: ticket.id },
    });
    pushMessage(session, urgentCopy(urgency.kinds), now, tools, [], []);
    return { session, matter, ticket };
  }

  if (isPromptInjection(message) && !isLegalAdviceRequest(message)) {
    pushMessage(
      session,
      `I can't follow that. I won't reveal hidden instructions or leave the intake desk. ${DISCLAIMER}`,
      now,
      [],
      [],
      [],
    );
    return { session };
  }

  if (isLegalAdviceRequest(message)) {
    session.adviceRefusals += 1;
    const extra =
      session.consult
        ? ` Your consultation on ${session.consult.label} is unchanged.`
        : session.stage === "collecting" || session.stage === "greeting"
          ? " If you want to keep going, tell me what happened and I will collect intake facts only."
          : "";
    pushMessage(session, `${ADVICE_REFUSAL}${extra}`, now, [], [], []);
    return { session };
  }

  if (wantsHuman(message) || isFrustrated(message)) {
    const reason = wantsHuman(message) ? "human_requested" : "frustration";
    const summary = reason === "human_requested" ? "Caller asked to talk to a person." : "Caller sounded frustrated. Intake paused for a person.";
    const ticket = openTicket(session, reason, summary, now);
    session.handoff = true;
    session.stage = "closed";
    pushMessage(
      session,
      `I've opened a handoff. A person will take this conversation from here. Call ${FIRM.phone} if you need the desk now. I will not keep collecting facts in this chat. ${DISCLAIMER}`,
      now,
      [{ name: "request_handoff", input: { reason, summary }, output: { ticketId: ticket.id } }],
      [],
      [],
    );
    return { session, ticket };
  }

  if (isOffTopic(message)) {
    pushMessage(
      session,
      `That is outside this desk. I only help with Harlow & Pierce intake for personal injury, employment, family, and immigration. ${DISCLAIMER}`,
      now,
      [],
      [],
      [],
    );
    return { session };
  }

  if (session.handoff) {
    pushMessage(
      session,
      `A person already has this as an immediate handoff. I can’t continue the intake or give advice. Call ${FIRM.phone}. If you are in danger, call 911. ${DISCLAIMER}`,
      now,
      [],
      [],
      [],
    );
    return { session };
  }

  if (isFirmQuestion(message) || isUngroundedQuestion(message)) {
    const ticket = answerFromNotes(session, message, now, ctx);
    return { session, ticket };
  }

  if (session.status === "conflict_hold") {
    pushMessage(
      session,
      `The conflict hold is still in place, so I can’t book a consultation from this chat. Call ${FIRM.phone} and the intake team will review the screen. ${DISCLAIMER}`,
      now,
      [],
      [],
      [],
    );
    return { session };
  }

  if (session.consult) {
    pushMessage(
      session,
      `You are already booked for ${session.consult.label} with ${session.consult.attorney}. Matter ${session.matterId}. Bring a photo ID and any papers you already have. ${DISCLAIMER}`,
      now,
      [],
      [],
      [{ id: "bring", label: "What should I bring?", send: "What should I bring to a consultation?" }],
    );
    return { session };
  }

  if (session.stage === "scheduling" && session.score?.qualified) {
    const slots = openSlots(ctx.now, session.practiceArea, ctx.bookedSlotIds);
    const chosen = matchSlot(message, slots);
    if (chosen) {
      if (ctx.bookedSlotIds.includes(chosen.id)) {
        const left = slotBlock(session, ctx);
        pushMessage(session, `That time was just taken. These are still open:\n\n${left.text}`, now, [], [], left.suggestions);
        return { session };
      }
      const tools: ToolTrace[] = [];
      session.consult = toConsultation(chosen);
      session.status = "consult_booked";
      session.stage = "closed";
      tools.push({
        name: "schedule_consultation",
        input: { slotId: chosen.id },
        output: asRecord(session.consult),
      });
      const summary = `${session.intake.clientName ?? "Prospective client"} — ${PRACTICE_LABEL[session.practiceArea ?? "personal_injury"]} consultation booked with ${chosen.attorney} on ${chosen.label}.`;
      const matter = ensureMatter(session, ctx, summary, tools);
      pushMessage(
        session,
        `You are booked for a 30-minute consultation with ${chosen.attorney} on ${chosen.label}. Matter ${session.matterId} is open in the demo CRM. The meeting is by video or at ${FIRM.address}. Bring a photo ID and any papers you already have. A booking is not an engagement letter. ${DISCLAIMER}`,
        now,
        tools,
        [],
        [{ id: "bring", label: "What should I bring?", send: "What should I bring to a consultation?" }],
      );
      return { session, matter };
    }
    const left = slotBlock(session, ctx);
    pushMessage(
      session,
      `I can book one of these screening times:\n\n${left.text}\n\nChoose a time, or say “the first open time.”`,
      now,
      [],
      [],
      left.suggestions,
    );
    return { session };
  }

  if (session.status === "unqualified") {
    pushMessage(
      session,
      `The intake screen did not qualify this for a consultation, so I can’t book a time from here. A person can still see the file. ${DISCLAIMER}`,
      now,
      [],
      [],
      [],
    );
    return { session };
  }

  remember(session, message);
  mergeIntake(session.intake, extractFacts(message, now));
  const tools: ToolTrace[] = [];
  const narrative = session.intake.narrative ?? message;

  if (!session.practiceArea) {
    if (isOutOfScopeRequest(message)) {
      const classification = classifyMatter(message);
      tools.push({ name: "classify_matter", input: { description: narrative }, output: asRecord(classification.practiceArea ? classification : { ...classification, practiceArea: "out_of_scope" }) });
      session.practiceArea = "out_of_scope";
      session.status = "unqualified";
      session.stage = "closed";
      session.introduced = true;
      const score = scoreCase("out_of_scope", session.intake, now);
      session.score = score;
      tools.push({ name: "score_case", input: { practiceArea: "out_of_scope" }, output: asRecord(score) });
      const matter = ensureMatter(
        session,
        ctx,
        "Inquiry is outside the firm’s practice areas. No consultation offered.",
        tools,
      );
      pushMessage(
        session,
        `${FIRM.short} does not handle criminal defense, bankruptcy, patents, or tax controversy. I will not open a consultation for this. If a separate injury, job, family, or immigration problem is what you need, tell me about that. ${DISCLAIMER}`,
        now,
        tools,
        [],
        [],
      );
      return { session, matter };
    }

    const classification = classifyMatter(narrative);
    if (!classification.practiceArea) {
      pushMessage(
        session,
        "I can intake an injury, a job problem, a family matter, or an immigration matter. Which of those is closest, in a sentence or two? I won’t give legal advice while we sort it.",
        now,
        [],
        [],
        [
          { id: "pi", label: "An injury", send: "I was hurt in a car accident last month in Ashford." },
          { id: "em", label: "A job problem", send: "I was fired last month in Ashford." },
          { id: "fa", label: "A family matter", send: "I need to talk about custody in Ashford County." },
          { id: "im", label: "Immigration", send: "I need help with a family petition. I am a citizen of Mexico." },
        ],
      );
      return { session };
    }
    tools.push({ name: "classify_matter", input: { description: narrative }, output: asRecord(classification) });
    session.practiceArea = classification.practiceArea;
    session.stage = "collecting";
    session.status = "in_intake";
    session.introduced = true;
  }

  let matter: MatterDraft | undefined;
  const partyList = [session.intake.clientName, ...session.intake.opposingParties].filter((party): party is string => Boolean(party));
  const needsConflict =
    session.practiceArea !== "out_of_scope" &&
    session.intake.opposingParties.length > 0 &&
    (!session.conflict || !sameParties(session.conflict.parties, partyList));
  if (needsConflict) {
    const result = runConflictCheck(partyList);
    session.conflict = result;
    tools.push({
      name: "run_conflict_check",
      input: { parties: result.parties },
      output: asRecord(result),
    });
    if (!result.clear) {
      session.status = "conflict_hold";
      session.stage = "closed";
      const names = result.matches.map((match) => match.name).join(", ");
      matter = ensureMatter(
        session,
        ctx,
        `Conflict screen matched ${names}. Consultation not offered.`,
        tools,
      );
      pushMessage(
        session,
        `The conflict screen matched an existing record for ${names}. I have to stop intake here so a person can review it. This is a preliminary screen, not a formal conflicts opinion. Call ${FIRM.phone} if you need the intake team today. ${DISCLAIMER}`,
        now,
        tools,
        [],
        [],
      );
      return { session, matter };
    }
  }

  if (!session.conflict) {
    const areaLabel = PRACTICE_LABEL[session.practiceArea ?? "personal_injury"].toLowerCase();
    const attorney = session.practiceArea && session.practiceArea !== "out_of_scope" ? ATTORNEYS[session.practiceArea] : null;
    const lead = session.introduced
      ? `This is a ${areaLabel} inquiry. I marked urgency as routine. That is an intake sort, not a legal conclusion.${attorney ? ` ${attorney.name} handles these consultations.` : ""}`
      : "";
    matter = ensureMatter(session, ctx, `${session.intake.clientName ?? "Prospective client"} — ${areaLabel} intake started.`, tools);
    pushMessage(
      session,
      `${lead}\n\nWho else is involved? I need a person or company name for the conflict screen. If you do not know, say unknown.`.trim(),
      now,
      tools,
      [],
      [],
    );
    return { session, matter };
  }

  const progress = intakeProgress(session.practiceArea, session.intake);
  tools.push({
    name: "collect_intake",
    input: { practiceArea: session.practiceArea },
    output: {
      practiceArea: session.practiceArea,
      missing: progress.missing,
      nextQuestion: progress.question,
      complete: progress.complete,
      answers: {
        clientName: session.intake.clientName ?? null,
        phone: session.intake.phone ?? null,
        email: session.intake.email ?? null,
        incidentDate: session.intake.incidentDate ?? null,
        location: session.intake.location ?? null,
        opposingParties: session.intake.opposingParties,
        treatment: session.intake.treatment ?? null,
        employer: session.intake.employer ?? null,
      },
    },
  });

  const areaLabel = PRACTICE_LABEL[session.practiceArea ?? "personal_injury"].toLowerCase();
  const attorney = session.practiceArea && session.practiceArea !== "out_of_scope" ? ATTORNEYS[session.practiceArea] : null;
  const explained = session.messages.some((item) => item.role === "assistant" && item.content.includes("preliminary screen"));
  const intro = `From what you described, this is a ${areaLabel} inquiry. I marked the urgency as routine. That is an intake sort, not a legal conclusion.${attorney ? ` ${attorney.name} handles these consultations.` : ""} I screened ${session.conflict.parties.join(", ")} against the demo client list and found no match. This is a preliminary screen, not a formal conflicts opinion.`;
  const lead = explained ? "" : `${intro}\n\n`;

  if (!progress.complete) {
    matter = ensureMatter(
      session,
      ctx,
      `${session.intake.clientName ?? "Prospective client"} — ${areaLabel} intake in progress.`,
      tools,
    );
    pushMessage(session, `${lead}${progress.question}`, now, tools, [], []);
    return { session, matter };
  }

  const score = scoreCase(session.practiceArea ?? "out_of_scope", session.intake, now);
  session.score = score;
  tools.push({
    name: "score_case",
    input: { practiceArea: session.practiceArea },
    output: asRecord(score),
  });
  if (!score.qualified) {
    session.status = "unqualified";
    session.stage = "closed";
    matter = ensureMatter(
      session,
      ctx,
      `${session.intake.clientName ?? "Prospective client"} — unqualified ${areaLabel} screen (${score.score}).`,
      tools,
    );
    pushMessage(
      session,
      `The intake screen score is ${score.score} out of 100, so this does not currently meet the firm’s criteria for a consultation. ${score.reasons.join(" ")} This is not a ruling that a claim is barred, and it is not legal advice. The file is on the staff board if a person wants to look again. ${DISCLAIMER}`,
      now,
      tools,
      [],
      [],
    );
    return { session, matter };
  }

  session.status = "qualified";
  session.stage = "scheduling";
  const slots = slotBlock(session, ctx);
  matter = ensureMatter(
    session,
    ctx,
    `${session.intake.clientName ?? "Prospective client"} — qualified ${areaLabel} screen (${score.score}).`,
    tools,
  );
  pushMessage(
    session,
    `${lead}The intake screen score is ${score.score} out of 100, so this meets the firm’s criteria for a screening consultation. That score is a filter, not a prediction of what a lawyer would say.\n\n${slots.text}\n\nPick one and I will book it.`,
    now,
    tools,
    [],
    slots.suggestions,
  );
  return { session, matter };
}

export function runConversation(messages: string[], now: Date, nextMatterId = "HP-2001"): Session {
  let session = createSession(now, "sess-test");
  for (const message of messages) {
    session = applyTurn(session, message, {
      now,
      bookedSlotIds: [],
      nextMatterId: session.matterId ?? nextMatterId,
    }).session;
  }
  return session;
}
