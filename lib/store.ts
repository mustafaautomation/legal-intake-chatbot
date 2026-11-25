import fs from "fs";
import path from "path";
import { applyTurn, createSession } from "./agent";
import type { TurnContext } from "./types";
import { redact } from "./redact";
import type { Consultation, HandoffTicket, IntakeAnswers, Matter, Session } from "./types";

interface Booking {
  slotId: string;
  matterId: string;
}

interface Database {
  sessions: Session[];
  matters: Matter[];
  bookings: Booking[];
  tickets: HandoffTicket[];
  seq: number;
}

/** Vercel serverless can write only to /tmp. The project directory is read-only. */
function dbPath(): string {
  if (process.env.DATA_PATH) return process.env.DATA_PATH;
  if (process.env.VERCEL) return path.join("/tmp", "legal-intake.json");
  return path.join(process.cwd(), "data", "intake.json");
}

let memory: Database | null = null;
let memoryOnly = false;

function readOnlyError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM" || code === "ENOSPC";
}

function emptyIntake(partial: Partial<IntakeAnswers> = {}): IntakeAnswers {
  return { opposingParties: [], ...partial };
}

function seed(now: Date): Database {
  const stamp = now.toISOString();
  const consult: Consultation = {
    slotId: "seed-slot-avery",
    startsAt: "2026-12-02T16:00:00.000Z",
    label: "Wed, Dec 2, 10:00 AM CT",
    attorney: "Elena Harlow",
    mode: "Video or 400 Harbor Street, Suite 1200",
  };
  const sessions: Session[] = [
    {
      ...createSession(now, "seed-avery"),
      status: "consult_booked",
      stage: "closed",
      practiceArea: "personal_injury",
      introduced: true,
      matterId: "HP-1001",
      consult,
      intake: emptyIntake({
        clientName: "Avery Cole",
        phone: "555-014-2101",
        email: "avery.cole@example.com",
        narrative: "Rear-ended on Harbor Avenue in March. Treating with an orthopedist. Other driver: Marcus Bell.",
        incidentDate: "2026-03-12",
        location: "Ashford",
        opposingParties: ["Marcus Bell"],
        treatment: "Medical treatment described",
      }),
      score: { score: 88, qualified: true, reasons: ["Recent collision with treatment and a named driver."] },
      conflict: { clear: true, parties: ["Marcus Bell"], matches: [], note: "Preliminary screen against the demo client list. Not a formal conflicts opinion." },
      messages: [
        ...createSession(now, "seed-avery").messages,
        { id: "seed-avery-u", role: "user", content: "I was rear-ended in Ashford in March and I’m treating with an orthopedist.", createdAt: stamp },
        { id: "seed-avery-a", role: "assistant", content: "Qualified personal injury screen. Consultation booked with Elena Harlow.", createdAt: stamp, tools: [{ name: "score_case", input: {}, output: { score: 88, qualified: true } }, { name: "schedule_consultation", input: { slotId: consult.slotId }, output: { label: consult.label } }] },
      ],
    },
    {
      ...createSession(now, "seed-riley"),
      status: "unqualified",
      stage: "closed",
      practiceArea: "employment",
      introduced: true,
      matterId: "HP-1002",
      intake: emptyIntake({
        clientName: "Riley Okonkwo",
        phone: "555-014-2102",
        email: "riley.okonkwo@example.com",
        narrative: "Fired in 2015 from a warehouse job in Ashford. No recent adverse action.",
        incidentDate: "2015-06-15",
        location: "Ashford",
        employer: "Cedar Warehouse",
        opposingParties: ["Cedar Warehouse"],
        adverseAction: "Termination described",
      }),
      score: {
        score: 22,
        qualified: false,
        reasons: ["The adverse action is outside the general filter the firm uses before offering a consult. This is not a ruling that a charge is time-barred."],
      },
      conflict: { clear: true, parties: ["Cedar Warehouse"], matches: [], note: "Preliminary screen against the demo client list. Not a formal conflicts opinion." },
    },
    {
      ...createSession(now, "seed-safety"),
      status: "urgent",
      stage: "closed",
      practiceArea: "family",
      urgency: "immediate",
      urgencyKind: "domestic_violence",
      handoff: true,
      introduced: true,
      matterId: "HP-1003",
      intake: emptyIntake({
        narrative: "Caller reported a safety emergency at home and asked about a protective order. Intake stopped.",
        opposingParties: ["unknown"],
      }),
      conflict: { clear: true, parties: ["unknown"], matches: [], note: "Screen skipped for the handoff. Not a formal conflicts opinion." },
    },
    {
      ...createSession(now, "seed-noah"),
      status: "conflict_hold",
      stage: "closed",
      practiceArea: "employment",
      introduced: true,
      matterId: "HP-1004",
      intake: emptyIntake({
        clientName: "Noah Park",
        phone: "555-014-2104",
        email: "noah.park@example.com",
        narrative: "Fired last month. Named Dana Whitfield as the person who made the decision.",
        employer: "Dana Whitfield",
        opposingParties: ["Dana Whitfield"],
        incidentDate: "2026-10-20",
        location: "Ashford",
        adverseAction: "Termination described",
      }),
      conflict: {
        clear: false,
        parties: ["Dana Whitfield"],
        matches: [
          {
            id: "c-whitfield",
            name: "Dana Whitfield",
            role: "Current client",
            matter: "Employment counseling — Brightline Retail",
          },
        ],
        note: "Preliminary screen against the demo client list. Not a formal conflicts opinion.",
      },
    },
    {
      ...createSession(now, "seed-camila"),
      status: "in_intake",
      stage: "collecting",
      practiceArea: "immigration",
      introduced: true,
      matterId: "HP-1005",
      intake: emptyIntake({
        clientName: "Camila Rossi",
        narrative: "Wants to ask about a family petition. Citizenship not collected yet.",
        opposingParties: ["unknown"],
        immigrationProcess: "family petition",
      }),
      conflict: { clear: true, parties: ["unknown"], matches: [], note: "Preliminary screen against the demo client list. Not a formal conflicts opinion." },
    },
    {
      ...createSession(now, "seed-helen"),
      status: "qualified",
      stage: "scheduling",
      practiceArea: "family",
      introduced: true,
      matterId: "HP-1006",
      intake: emptyIntake({
        clientName: "Helen Cho",
        phone: "555-014-2106",
        email: "helen.cho@example.com",
        narrative: "Divorce and a parenting schedule. Two children. No existing orders. Ashford County. Other party: Chris Cho.",
        opposingParties: ["Chris Cho"],
        children: "children mentioned",
        county: "Ashford County",
        existingOrders: "no",
      }),
      score: { score: 76, qualified: true, reasons: ["Family facts needed for a screening consult are present."] },
      conflict: { clear: true, parties: ["Chris Cho"], matches: [], note: "Preliminary screen against the demo client list. Not a formal conflicts opinion." },
    },
  ];

  const matters: Matter[] = sessions.map((session) => ({
    id: session.matterId!,
    sessionId: session.id,
    status: session.status,
    practiceArea: session.practiceArea ?? "out_of_scope",
    clientName: session.intake.clientName || (session.status === "urgent" ? "Name withheld" : "Prospective client"),
    phone: session.intake.phone,
    email: session.intake.email,
    score: session.score?.score,
    qualified: session.score?.qualified,
    reasons: session.score?.reasons ?? (session.status === "urgent" ? ["Immediate handoff. Intake stopped. Hotline and the firm line were given."] : session.status === "conflict_hold" ? ["Conflict screen matched Dana Whitfield, a current client."] : []),
    urgency: session.urgency,
    urgencyKind: session.urgencyKind,
    conflictClear: session.conflict?.clear,
    summary:
      session.status === "urgent"
        ? "Caller reported a safety emergency at home and asked about a protective order. Intake stopped. Hotline and 911 were given."
        : session.status === "conflict_hold"
          ? "Employment inquiry. The conflict screen matched Dana Whitfield, a current client. Consultation not offered."
          : session.status === "in_intake"
            ? "Immigration family-petition inquiry. Contact is only partly collected."
            : session.intake.narrative ?? "Intake on file.",
    attorney: session.practiceArea && session.practiceArea !== "out_of_scope"
      ? session.practiceArea === "personal_injury"
        ? "Elena Harlow"
        : session.practiceArea === "employment"
          ? "Julian Pierce"
          : session.practiceArea === "family"
            ? "Priya Shah"
            : "Mateo Alvarez"
      : undefined,
    consult: session.consult,
    narrative: session.intake.narrative ?? "",
    intake: session.intake,
    createdAt: stamp,
    updatedAt: stamp,
  }));

  return {
    sessions,
    matters,
    bookings: [{ slotId: consult.slotId, matterId: "HP-1001" }],
    tickets: [
      {
        id: "T-seed-safety",
        sessionId: "seed-safety",
        reason: "sensitive",
        summary: "Safety emergency. Intake stopped. Hotline and 911 were given.",
        createdAt: stamp,
      },
    ],
    seq: 1007,
  };
}

function read(): Database {
  if (memoryOnly && memory) return memory;
  try {
    const file = dbPath();
    if (!fs.existsSync(file)) {
      const initial = seed(new Date());
      write(initial);
      return memoryOnly && memory ? memory : initial;
    }
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Database;
    if (!Array.isArray(parsed.tickets)) parsed.tickets = [];
    if (!Array.isArray(parsed.bookings)) parsed.bookings = [];
    return parsed;
  } catch (error) {
    if (!readOnlyError(error) && (error as NodeJS.ErrnoException)?.code !== "ENOENT") throw error;
    memoryOnly = true;
    memory = memory ?? seed(new Date());
    return memory;
  }
}

function audit(detail: unknown) {
  if (memoryOnly) return;
  try {
    const file = path.join(path.dirname(dbPath()), "audit.log");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${redact(JSON.stringify(detail))}\n`);
  } catch (error) {
    if (!readOnlyError(error)) throw error;
    memoryOnly = true;
  }
}

function write(db: Database) {
  if (memoryOnly) {
    memory = db;
    return;
  }
  const file = dbPath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, file);
  } catch (error) {
    if (!readOnlyError(error)) throw error;
    memoryOnly = true;
    memory = db;
  }
}

let chain: Promise<unknown> = Promise.resolve();

export function updateStore<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const db = read();
    const result = await fn(db);
    write(db);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function createStoredSession(now = new Date()): Promise<Session> {
  return updateStore((db) => {
    const session = createSession(now);
    db.sessions.unshift(session);
    return session;
  });
}

export async function getSession(id: string): Promise<Session | null> {
  const db = read();
  return db.sessions.find((session) => session.id === id) ?? null;
}

export async function listMatters(): Promise<Matter[]> {
  const db = read();
  return [...db.matters].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getMatter(id: string): Promise<{ matter: Matter; session: Session | null } | null> {
  const db = read();
  const matter = db.matters.find((item) => item.id === id);
  if (!matter) return null;
  const session = db.sessions.find((item) => item.id === matter.sessionId) ?? null;
  return { matter, session };
}

type TurnOutcome = ReturnType<typeof applyTurn>;

export async function commitTurn(
  sessionId: string,
  message: string,
  produce: (session: Session, ctx: TurnContext) => TurnOutcome | Promise<TurnOutcome>,
  now = new Date(),
): Promise<{ session: Session; mode: "live" | "demo" } | { error: string; status: number }> {
  return updateStore(async (db) => {
    const index = db.sessions.findIndex((session) => session.id === sessionId);
    if (index < 0) return { error: "That intake session is not on this desk.", status: 404 };
    const current = db.sessions[index];
    const outcome = await produce(current, {
      now,
      bookedSlotIds: db.bookings.map((booking) => booking.slotId),
      nextMatterId: current.matterId ?? `HP-${db.seq}`,
    });
    if (!current.matterId && outcome.session.matterId) db.seq += 1;
    db.sessions[index] = outcome.session;
    if (outcome.matter) {
      const existing = db.matters.findIndex((matter) => matter.id === outcome.matter!.id);
      const stored: Matter = {
        ...outcome.matter,
        createdAt: existing >= 0 ? db.matters[existing].createdAt : now.toISOString(),
        updatedAt: now.toISOString(),
      };
      if (existing >= 0) db.matters[existing] = stored;
      else db.matters.unshift(stored);
    }
    if (outcome.session.consult && !db.bookings.some((booking) => booking.slotId === outcome.session.consult!.slotId)) {
      db.bookings.push({ slotId: outcome.session.consult.slotId, matterId: outcome.session.matterId ?? "" });
    }
    if (outcome.ticket && !db.tickets.some((ticket) => ticket.id === outcome.ticket!.id)) {
      db.tickets.unshift(outcome.ticket);
    }
    audit({
      sessionId,
      message,
      tools: outcome.session.messages.at(-1)?.tools?.map((tool) => tool.name) ?? [],
      ticket: outcome.ticket?.id ?? null,
    });
    const produced = outcome as TurnOutcome & { mode?: "live" | "demo" };
    return { session: outcome.session, mode: produced.mode === "live" ? "live" : "demo" };
  });
}

export async function resumeBot(sessionId: string, now = new Date()): Promise<{ session: Session } | { error: string; status: number }> {
  return updateStore((db) => {
    const session = db.sessions.find((item) => item.id === sessionId);
    if (!session) return { error: "That intake session is not on this desk.", status: 404 };
    session.handoff = false;
    if (
      session.stage === "closed" &&
      session.status !== "urgent" &&
      session.status !== "consult_booked" &&
      session.status !== "conflict_hold" &&
      session.status !== "unqualified"
    ) {
      session.stage = session.practiceArea ? "collecting" : "greeting";
    }
    session.messages.push({
      id: `resume-${now.getTime()}`,
      role: "assistant",
      content: "The intake desk is back on this chat. I can keep collecting facts. This is not legal advice and does not create an attorney-client relationship.",
      createdAt: now.toISOString(),
    });
    session.updatedAt = now.toISOString();
    return { session };
  });
}

export async function saveTurn(sessionId: string, message: string, now = new Date()) {
  return commitTurn(sessionId, message, (session, ctx) => applyTurn(session, message, ctx), now);
}

export async function listInbox(): Promise<{ sessions: Session[]; tickets: HandoffTicket[] }> {
  const db = read();
  return {
    sessions: [...db.sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 30),
    tickets: [...db.tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

export async function ensureChannelSession(channel: "whatsapp" | "messenger", externalId: string, now = new Date()): Promise<Session> {
  const id = `${channel}:${externalId}`;
  return updateStore((db) => {
    const existing = db.sessions.find((session) => session.id === id);
    if (existing) return existing;
    const session = createSession(now, id);
    db.sessions.unshift(session);
    return session;
  });
}
