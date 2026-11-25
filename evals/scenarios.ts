import { runConversation } from "../lib/agent";
import type { LeadStatus, PracticeArea, Session } from "../lib/types";
import cases from "./cases.json";

export const NOW = new Date("2026-11-25T15:00:00.000Z");

export interface Scenario {
  id: string;
  messages: string[];
  includes?: string[];
  excludes?: string[];
  tools?: string[];
  toolsAbsent?: string[];
  status?: LeadStatus;
  qualified?: boolean;
  citationIncludes?: string;
  practiceArea?: PracticeArea | null;
  booked?: boolean;
  handoff?: boolean;
}

export const SCENARIOS = cases as Scenario[];

export function assistantText(session: Session): string {
  return session.messages
    .filter((message) => message.role === "assistant")
    .map((message) => message.content)
    .join("\n");
}

export function toolNames(session: Session): string[] {
  return session.messages.flatMap((message) => message.tools?.map((tool) => tool.name) ?? []);
}

export function evaluateScenario(scenario: Scenario, now = NOW): { pass: boolean; failures: string[] } {
  const session = runConversation(scenario.messages, now);
  const text = assistantText(session);
  const tools = toolNames(session);
  const failures: string[] = [];
  for (const phrase of scenario.includes ?? []) {
    if (!text.toLowerCase().includes(phrase.toLowerCase())) failures.push(`missing “${phrase}”`);
  }
  for (const phrase of scenario.excludes ?? []) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) failures.push(`forbidden “${phrase}”`);
  }
  for (const tool of scenario.tools ?? []) {
    if (!tools.includes(tool)) failures.push(`missing tool ${tool}`);
  }
  for (const tool of scenario.toolsAbsent ?? []) {
    if (tools.includes(tool)) failures.push(`unexpected tool ${tool}`);
  }
  if (scenario.status && session.status !== scenario.status) failures.push(`status ${session.status}, expected ${scenario.status}`);
  if (scenario.qualified !== undefined && session.score?.qualified !== scenario.qualified) {
    failures.push(`qualified ${String(session.score?.qualified)}, expected ${scenario.qualified}`);
  }
  if (scenario.practiceArea !== undefined && session.practiceArea !== scenario.practiceArea) {
    failures.push(`area ${String(session.practiceArea)}, expected ${scenario.practiceArea}`);
  }
  if (scenario.booked === true && !session.consult) failures.push("expected a booking");
  if (scenario.booked === false && session.consult) failures.push("did not expect a booking");
  if (scenario.handoff !== undefined && session.handoff !== scenario.handoff) {
    failures.push(`handoff ${String(session.handoff)}, expected ${scenario.handoff}`);
  }
  if (scenario.citationIncludes) {
    const titles = session.messages.flatMap((message) => message.citations?.map((citation) => citation.title) ?? []);
    if (!titles.some((title) => title.includes(scenario.citationIncludes!))) {
      failures.push(`citation missing “${scenario.citationIncludes}” (got ${titles.join(", ") || "none"})`);
    }
  }
  return { pass: failures.length === 0, failures };
}
