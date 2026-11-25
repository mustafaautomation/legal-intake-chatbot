import type { PracticeArea } from "./types";

export const PORTFOLIO_LINE =
  "Portfolio demo by Quvantic - fictional brand, not a real business / not client work";

export const FIRM = {
  name: "Harlow & Pierce LLP",
  short: "Harlow & Pierce",
  city: "Ashford",
  established: 1998,
  address: "400 Harbor Street, Suite 1200, Ashford",
  phone: "(555) 014-2200",
  hours: "Monday–Friday, 8:30 a.m. to 5:30 p.m. CT",
  subdomain: "legal-chat",
} as const;

export const DISCLAIMER =
  "This is not legal advice and does not create an attorney-client relationship.";

export const CONFIDENTIALITY_NOTICE =
  "This chat is not privileged. It is an intake note for a fictional firm, not a confidential lawyer consultation.";

export const PRACTICE_LABEL: Record<PracticeArea, string> = {
  personal_injury: "Personal injury",
  employment: "Employment",
  family: "Family",
  immigration: "Immigration",
  out_of_scope: "Outside the firm’s work",
};

export const ATTORNEYS: Record<
  Exclude<PracticeArea, "out_of_scope">,
  { name: string; title: string; focus: string }
> = {
  personal_injury: {
    name: "Elena Harlow",
    title: "Partner",
    focus: "Collision, premises, and serious-injury intake",
  },
  employment: {
    name: "Julian Pierce",
    title: "Partner",
    focus: "Terminations, wages, and workplace harassment",
  },
  family: {
    name: "Priya Shah",
    title: "Partner",
    focus: "Divorce, custody, and support",
  },
  immigration: {
    name: "Mateo Alvarez",
    title: "Counsel",
    focus: "Family petitions, removal defense, and naturalization",
  },
};

export const TOOL_LABELS: Record<string, string> = {
  classify_matter: "Classified the matter",
  run_conflict_check: "Screened conflicts",
  collect_intake: "Updated the intake form",
  score_case: "Scored qualification",
  schedule_consultation: "Booked a consultation",
  create_crm_matter: "Opened a CRM matter",
  search_kb: "Searched the firm notes",
};

export function attorneyFor(area: PracticeArea | null) {
  if (!area || area === "out_of_scope") return null;
  return ATTORNEYS[area];
}
