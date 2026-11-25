import { chicagoLocalToUtc, chicagoParts, formatSlotLabel } from "./dates";
import type { Consultation, PracticeArea } from "./types";
import { attorneyFor } from "./firm";

export interface OpenSlot {
  id: string;
  startsAt: string;
  label: string;
  attorney: string;
}

export function openSlots(now: Date, area: PracticeArea | null, taken: string[], count = 4): OpenSlot[] {
  const attorney = attorneyFor(area)?.name ?? "Intake coordinator";
  const slots: OpenSlot[] = [];
  const cursor = new Date(now.getTime());
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  for (let guard = 0; guard < 21 && slots.length < count; guard += 1) {
    const parts = chicagoParts(cursor);
    const probe = chicagoLocalToUtc(parts.year, parts.month, parts.day, 12, 0);
    const weekday = chicagoParts(probe).weekday;
    if (weekday !== "Sat" && weekday !== "Sun") {
      for (const hour of [10, 14]) {
        if (slots.length >= count) break;
        const start = chicagoLocalToUtc(parts.year, parts.month, parts.day, hour, 0);
        const id = `slot-${start.toISOString()}`;
        if (taken.includes(id)) continue;
        slots.push({
          id,
          startsAt: start.toISOString(),
          label: formatSlotLabel(start),
          attorney,
        });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return slots;
}

export function matchSlot(message: string, slots: OpenSlot[]): OpenSlot | null {
  const book = message.trim().match(/^book:(slot-.+)$/);
  if (book) return slots.find((slot) => slot.id === book[1]) ?? null;
  if (/\b(first|earliest)\b/i.test(message)) return slots[0] ?? null;
  const lowered = message.toLowerCase();
  return (
    slots.find((slot) => lowered.includes(slot.label.toLowerCase().slice(0, 12))) ??
    slots.find((slot) => {
      const day = slot.label.split(",")[0]?.toLowerCase();
      const time = slot.label.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0].toLowerCase();
      return Boolean(day && time && lowered.includes(day) && lowered.includes(time.replace(/\s+/g, " ")));
    }) ??
    null
  );
}

export function toConsultation(slot: OpenSlot): Consultation {
  return {
    slotId: slot.id,
    startsAt: slot.startsAt,
    label: slot.label,
    attorney: slot.attorney,
    mode: "Video or 400 Harbor Street, Suite 1200",
  };
}
