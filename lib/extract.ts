import { parseWhen } from "./dates";
import type { IntakeAnswers } from "./types";

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = value.replace(/[.,;]+$/, "").replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

export function extractFacts(text: string, now: Date): Partial<IntakeAnswers> {
  const facts: Partial<IntakeAnswers> = {};
  const name = text.match(/\b(?:my name is|this is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/i);
  if (name) facts.clientName = name[1];

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (email) facts.email = email[0];

  const phone = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
  if (phone) facts.phone = phone[0];

  const when = parseWhen(text, now);
  if (when) facts.incidentDate = when;

  const streets = [...text.matchAll(/\bon\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:Avenue|Street|Road|Boulevard))\b/g)].map(
    (match) => match[1],
  );
  const cities = [...text.matchAll(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g)]
    .map((match) => match[1])
    .filter((city) => !/^(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(city));
  const location = [...streets, ...cities];
  if (location.length > 0) facts.location = location.join(", ");

  if (/\b(never (saw|seen) a doctor|no medical treatment|did not see a doctor|didn't see a doctor)\b/i.test(text)) {
    facts.treatment = "No medical treatment described";
  } else if (/\b(orthoped|doctor|physician|emergency room|hospital|physical therapy|surgery|treating|treatment|chiropract|\ber\b)\b/i.test(text)) {
    facts.treatment = "Medical treatment described";
  }

  const partyPatterns = [
    /\bother driver (?:was|is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/,
    /\bstore (?:was|is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
    /\bemployer (?:was|is)\s+([A-Z][A-Za-z.&]+(?:\s+[A-Z][A-Za-z.&]+){0,3})/,
    /\b(?:fired|terminated|laid off)(?:\s+\w+){0,4}\s+(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/,
    /\bwork(?:ed|s)? (?:at|for)\s+([A-Z][A-Za-z.&]+(?:\s+[A-Z][A-Za-z.&]+){0,3})/,
    /\bmy (?:spouse|husband|wife|ex) (?:is|was|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
  ];
  const parties: string[] = [];
  for (const pattern of partyPatterns) {
    const match = text.match(pattern);
    if (match) parties.push(match[1]);
  }
  for (const match of text.matchAll(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(LLC|Inc|Couriers|Logistics|Group|Hospital|Mart)\b/g)) {
    parties.push(`${match[1]} ${match[2]}`);
  }
  if (/\b(hit and run|don't know (?:his|her|their) name|do not know the name|unknown|no other party)\b/i.test(text)) {
    parties.push("unknown");
  }
  if (parties.length > 0) facts.opposingParties = unique(parties);

  const employer =
    text.match(/\bemployer (?:was|is)\s+([A-Z][A-Za-z.&]+(?:\s+[A-Z][A-Za-z.&]+){0,3})/) ??
    text.match(/\b(?:fired|terminated|laid off)(?:\s+\w+){0,4}\s+(?:by|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/) ??
    text.match(/\bwork(?:ed|s)? (?:at|for)\s+([A-Z][A-Za-z.&]+(?:\s+[A-Z][A-Za-z.&]+){0,3})/);
  if (employer) facts.employer = employer[1].replace(/[.,;]+$/, "");

  if (/\b(fired|terminated|laid off|let me go)\b/i.test(text)) facts.stillEmployed = "no";
  if (/\bstill (work|employed)\b/i.test(text)) facts.stillEmployed = "yes";
  if (/\b(fired|terminat|laid off)\b/i.test(text)) facts.adverseAction = "Termination described";
  else if (/\b(harassment|discriminat|unpaid|overtime|wages)\b/i.test(text)) facts.adverseAction = "Workplace issue described";

  if (/\b(no kids|no children)\b/i.test(text)) facts.children = "none";
  else if (/\b(kids|children|son|daughter)\b/i.test(text)) facts.children = "children mentioned";

  const county = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+County\b/);
  if (county) facts.county = `${county[1]} County`;

  if (/\bno (existing )?(court )?orders?\b/i.test(text)) facts.existingOrders = "no";
  else if (/\b(court order|existing order|parenting plan)\b/i.test(text)) facts.existingOrders = "yes";

  const citizenship = text.match(/\b(?:citizen of|citizenship is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (citizenship) facts.citizenship = citizenship[1];

  if (/\basylum\b/i.test(text)) facts.immigrationProcess = "asylum";
  else if (/\b(naturalization|citizenship application)\b/i.test(text)) facts.immigrationProcess = "naturalization";
  else if (/\b(removal|deportation)\b/i.test(text)) facts.immigrationProcess = "removal";
  else if (/\b(green card|family petition|i-130)\b/i.test(text)) facts.immigrationProcess = "family petition";
  else if (/\b(h-1b|work visa|employment visa)\b/i.test(text)) facts.immigrationProcess = "employment visa";

  return facts;
}
