export type PracticeArea =
  | "personal_injury"
  | "employment"
  | "family"
  | "immigration"
  | "out_of_scope";

export type LeadStatus =
  | "new"
  | "in_intake"
  | "urgent"
  | "conflict_hold"
  | "qualified"
  | "unqualified"
  | "consult_booked";

export type Stage = "greeting" | "collecting" | "scheduling" | "closed";

export type UrgencyLevel = "routine" | "soon" | "immediate";

export type UrgencyKind = "domestic_violence" | "detention" | "court";

export interface IntakeAnswers {
  clientName?: string;
  phone?: string;
  email?: string;
  narrative?: string;
  incidentDate?: string;
  location?: string;
  opposingParties: string[];
  treatment?: string;
  employer?: string;
  adverseAction?: string;
  stillEmployed?: string;
  children?: string;
  existingOrders?: string;
  county?: string;
  citizenship?: string;
  immigrationProcess?: string;
}

export interface Classification {
  practiceArea: PracticeArea | null;
  urgency: UrgencyLevel;
  confidence: number;
  reasons: string[];
}

export interface ConflictMatch {
  id: string;
  name: string;
  role: string;
  matter: string;
}

export interface ConflictResult {
  clear: boolean;
  parties: string[];
  matches: ConflictMatch[];
  note: string;
}

export interface ScoreResult {
  score: number;
  qualified: boolean;
  reasons: string[];
}

export interface Consultation {
  slotId: string;
  startsAt: string;
  label: string;
  attorney: string;
  mode: string;
}

export interface Citation {
  id: string;
  title: string;
  source: string;
  excerpt?: string;
}

export interface ToolTrace {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface Suggestion {
  id: string;
  label: string;
  send: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  tools?: ToolTrace[];
  citations?: Citation[];
  suggestions?: Suggestion[];
}

export interface HandoffTicket {
  id: string;
  sessionId: string;
  reason: "human_requested" | "frustration" | "low_confidence" | "sensitive";
  summary: string;
  createdAt: string;
}

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  stage: Stage;
  status: LeadStatus;
  practiceArea: PracticeArea | null;
  urgency: UrgencyLevel;
  urgencyKind: UrgencyKind | null;
  intake: IntakeAnswers;
  conflict?: ConflictResult;
  score?: ScoreResult;
  consult: Consultation | null;
  matterId?: string;
  handoff: boolean;
  adviceRefusals: number;
  introduced: boolean;
  ticketId?: string;
}

export interface Matter {
  id: string;
  sessionId: string;
  status: LeadStatus;
  practiceArea: PracticeArea;
  clientName: string;
  phone?: string;
  email?: string;
  score?: number;
  qualified?: boolean;
  reasons: string[];
  urgency: UrgencyLevel;
  urgencyKind: UrgencyKind | null;
  conflictClear?: boolean;
  summary: string;
  attorney?: string;
  consult: Consultation | null;
  narrative: string;
  intake: IntakeAnswers;
  createdAt: string;
  updatedAt: string;
}

export interface MatterDraft {
  id: string;
  sessionId: string;
  status: LeadStatus;
  practiceArea: PracticeArea;
  clientName: string;
  phone?: string;
  email?: string;
  score?: number;
  qualified?: boolean;
  reasons: string[];
  urgency: UrgencyLevel;
  urgencyKind: UrgencyKind | null;
  conflictClear?: boolean;
  summary: string;
  attorney?: string;
  consult: Consultation | null;
  narrative: string;
  intake: IntakeAnswers;
}

export interface TurnContext {
  now: Date;
  bookedSlotIds: string[];
  nextMatterId: string;
}
