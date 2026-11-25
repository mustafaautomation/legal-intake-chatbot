const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function isoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shift(now: Date, days: number): string {
  const next = new Date(now.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return isoDate(next);
}

function shiftMonths(now: Date, months: number): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  next.setUTCMonth(next.getUTCMonth() + months);
  return isoDate(next);
}

export function monthIndex(text: string): number | null {
  const lower = text.toLowerCase();
  for (let i = 0; i < MONTHS.length; i += 1) {
    if (new RegExp(`\\b${MONTHS[i]}\\b`).test(lower)) return i;
  }
  return null;
}

/** Pull a calendar date out of ordinary intake language. Returns YYYY-MM-DD. */
export function parseWhen(text: string, now: Date): string | undefined {
  const lower = text.toLowerCase();
  if (/\byesterday\b/.test(lower)) return shift(now, -1);
  if (/\blast night\b|\bthis morning\b|\btoday\b/.test(lower)) return isoDate(now);
  if (/\blast week\b/.test(lower)) return shift(now, -7);
  if (/\blast month\b/.test(lower)) return shiftMonths(now, -1);
  const ago = lower.match(/\b(\d+)\s+(day|week|month|year)s?\s+ago\b/);
  if (ago) {
    const n = Number(ago[1]);
    if (ago[2] === "day") return shift(now, -n);
    if (ago[2] === "week") return shift(now, -n * 7);
    if (ago[2] === "month") return shiftMonths(now, -n);
    return shiftMonths(now, -n * 12);
  }
  const year = text.match(/\b((?:19|20)\d{2})\b/);
  if (year) {
    const y = Number(year[1]);
    const month = monthIndex(text);
    const mm = String((month ?? 5) + 1).padStart(2, "0");
    return `${y}-${mm}-15`;
  }
  return undefined;
}

export function monthsBetween(iso: string | undefined, now: Date): number | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  return (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() - month);
}

export function chicagoParts(date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: parts.weekday,
  };
}

/** Convert a Chicago wall-clock time to a UTC Date. */
export function chicagoLocalToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = chicagoParts(guess);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return new Date(guess.getTime() - (asUtc - guess.getTime()));
}

export function formatSlotLabel(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${formatted} CT`;
}
