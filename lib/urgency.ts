import type { UrgencyKind } from "./types";

export interface UrgencyHit {
  immediate: boolean;
  kind: UrgencyKind | null;
  kinds: UrgencyKind[];
}

export function detectUrgency(text: string): UrgencyHit {
  const kinds: UrgencyKind[] = [];
  const vehicle = /\b(car|driver|vehicle|accident|rear-end|rear ended|crash|collision)\b/i.test(text);
  const domesticRelation = /\b(husband|wife|spouse|partner|boyfriend|girlfriend|ex-husband|ex-wife|domestic)\b/i.test(
    text,
  );
  const violence = /\b(hit|beat|hurt|afraid|scared|chok|strangl|threaten|abusive|abuse|protective order|restraining order)\b/i.test(
    text,
  );
  if (/\b(domestic violence|protective order|restraining order)\b/i.test(text)) {
    kinds.push("domestic_violence");
  } else if (domesticRelation && violence && !vehicle) {
    kinds.push("domestic_violence");
  }
  if (/\b(immigration detention|in detention|ice custody|detained by ice)\b/i.test(text) || (/\bdetained\b/i.test(text) && /\b(ice|immigration)\b/i.test(text))) {
    kinds.push("detention");
  }
  if (/\b(court|hearing|trial)\b/i.test(text) && /\btomorrow\b/i.test(text)) {
    kinds.push("court");
  }
  const kind = kinds[0] ?? null;
  return { immediate: kinds.length > 0, kind, kinds };
}
