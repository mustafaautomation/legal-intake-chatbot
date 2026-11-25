import type { Session } from "./types";

export function phaseLabel(message: string, session: Session | null): string {
  if (/talk to a (person|human)|intake team|specialist/i.test(message)) return "Connecting you with the desk…";
  if (session?.stage === "scheduling" || /\b(first open|10:00|2:00|book)\b/i.test(message)) return "Checking the calendar…";
  if (session?.stage === "collecting" && session.practiceArea) return "Updating the intake file…";
  if (/\b(fee|fees|cost|hourly|contingency)\b/i.test(message)) return "Searching firm notes…";
  if (/\b(hurt|rear-end|accident|fired|job|custody|immigration|petition|injury)\b/i.test(message)) return "Sorting the matter…";
  return "Searching firm notes…";
}
