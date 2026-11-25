import { CLIENT_RECORDS } from "./clients";
import type { ConflictResult } from "./types";

const STOP = new Set(["llc", "inc", "co", "company", "the"]);

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP.has(token))
    .join(" ");
}

function matches(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (left === "unknown") return false;
  if (left === right) return true;
  const leftTokens = left.split(" ");
  const rightTokens = right.split(" ");
  if (leftTokens.length >= 2 && rightTokens.length >= 2 && left === right) return true;
  if (leftTokens.length >= 2 && left === right) return true;
  return false;
}

export function runConflictCheck(parties: string[]): ConflictResult {
  const cleaned = parties.map((party) => party.trim()).filter(Boolean);
  const matchesFound = CLIENT_RECORDS.filter((record) => {
    const recordName = normalizeName(record.name);
    return cleaned.some((party) => matches(normalizeName(party), recordName));
  });
  return {
    clear: matchesFound.length === 0,
    parties: cleaned,
    matches: matchesFound,
    note: "Preliminary screen against the demo client list. Not a formal conflicts opinion.",
  };
}
