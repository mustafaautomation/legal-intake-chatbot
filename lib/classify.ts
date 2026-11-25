import type { Classification, PracticeArea } from "./types";

const LEXICON: Record<Exclude<PracticeArea, "out_of_scope">, string[]> = {
  personal_injury: [
    "rear-end",
    "rear ended",
    "car accident",
    "crash",
    "collision",
    "slip",
    "slipped",
    "fell",
    "whiplash",
    "herniated",
    "injured",
    "injury",
    "orthoped",
    "fracture",
  ],
  employment: [
    "fired",
    "terminated",
    "termination",
    "wages",
    "overtime",
    "harassment",
    "employer",
    "discrimination",
    "wrongful",
    "boss",
    "paycheck",
    "retaliation",
    "laid off",
  ],
  family: [
    "divorce",
    "custody",
    "child support",
    "parenting",
    "visitation",
    "spouse",
    "husband",
    "wife",
    "dissolution",
    "protective order",
    "restraining order",
  ],
  immigration: [
    "visa",
    "green card",
    "asylum",
    "deportation",
    "detention",
    "citizenship",
    "uscis",
    "removal",
    "naturalization",
    "immigration",
  ],
};

function hits(text: string, phrases: string[]): string[] {
  const lower = text.toLowerCase();
  return phrases.filter((phrase) => lower.includes(phrase));
}

export function classifyMatter(description: string): Classification {
  const found = {
    personal_injury: hits(description, LEXICON.personal_injury),
    employment: hits(description, LEXICON.employment),
    family: hits(description, LEXICON.family),
    immigration: hits(description, LEXICON.immigration),
  };
  const outOfScope = hits(description, ["dui", "criminal defense", "arrested", "bankruptcy", "patent", "tax fraud"]);
  if (outOfScope.length > 0 && found.personal_injury.length + found.employment.length + found.immigration.length === 0) {
    return {
      practiceArea: "out_of_scope",
      urgency: "routine",
      confidence: 0.9,
      reasons: [`Described work the firm does not take (${outOfScope.join(", ")}).`],
    };
  }
  const ranked = (Object.keys(found) as Array<keyof typeof found>).sort((a, b) => found[b].length - found[a].length);
  const best = ranked[0];
  const bestCount = found[best].length;
  if (bestCount === 0) {
    return {
      practiceArea: null,
      urgency: "routine",
      confidence: 0,
      reasons: ["No practice-area facts yet."],
    };
  }
  let area: PracticeArea = best;
  if (found.personal_injury.length === found.employment.length && found.employment.length > 0 && /\b(work|job|employer)\b/i.test(description)) {
    area = "employment";
  }
  const matched = found[area as keyof typeof found];
  return {
    practiceArea: area,
    urgency: "routine",
    confidence: Math.min(0.95, 0.55 + matched.length * 0.15),
    reasons: [`Matched intake language: ${matched.join(", ")}.`],
  };
}
