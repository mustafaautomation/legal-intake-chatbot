import type { IntakeAnswers, PracticeArea } from "./types";

const QUESTIONS: Record<string, string> = {
  opposingParties: "Who else is involved? I need a person or company name for the conflict screen. If you do not know, say unknown.",
  clientName: "What name should I put on the intake file?",
  phone: "What phone number should the intake team use?",
  email: "What email should the intake team use?",
  incidentDate: "About when did this happen? A month and year, or “last month,” is enough.",
  location: "Where did this happen? A city is enough.",
  treatment: "Did you get medical treatment? Yes or no is enough, and you can name the kind of provider if you want.",
  employer: "What is the employer’s name?",
  adverseAction: "What happened at work — a firing, wages, harassment, or something else?",
  children: "Are there children involved? Yes or no is enough.",
  county: "Which county is the family matter in?",
  existingOrders: "Are there any existing court orders? Yes or no is enough.",
  citizenship: "What is your country of citizenship?",
  immigrationProcess: "Which process is this about: a family petition, asylum, removal, naturalization, or an employment visa?",
};

const REQUIRED: Record<Exclude<PracticeArea, "out_of_scope">, string[]> = {
  personal_injury: ["opposingParties", "clientName", "phone", "email", "incidentDate", "location", "treatment"],
  employment: ["opposingParties", "clientName", "phone", "email", "employer", "adverseAction", "incidentDate", "location"],
  family: ["opposingParties", "clientName", "phone", "email", "children", "county", "existingOrders"],
  immigration: ["opposingParties", "clientName", "phone", "email", "citizenship", "immigrationProcess"],
};

function missingField(field: string, intake: IntakeAnswers): boolean {
  if (field === "opposingParties") return intake.opposingParties.length === 0;
  const value = intake[field as keyof IntakeAnswers];
  return typeof value !== "string" || value.trim().length === 0;
}

export function intakeProgress(area: PracticeArea | null, intake: IntakeAnswers): {
  missing: string[];
  question: string | null;
  complete: boolean;
} {
  if (!area || area === "out_of_scope") return { missing: [], question: null, complete: false };
  const missing = REQUIRED[area].filter((field) => missingField(field, intake));
  if (missing.length === 0) return { missing, question: null, complete: true };
  if (missing[0] === "opposingParties") {
    return { missing, question: QUESTIONS.opposingParties, complete: false };
  }
  const contact = ["clientName", "phone", "email"].filter((field) => missing.includes(field));
  if (contact.length === 3) {
    return {
      missing,
      question: "What name, phone number, and email should I put on the intake file?",
      complete: false,
    };
  }
  if (contact.length === 2 && contact.includes("phone") && contact.includes("email")) {
    return { missing, question: "What phone number and email should I use to reach you?", complete: false };
  }
  return { missing, question: QUESTIONS[missing[0]] ?? "Tell me a bit more.", complete: false };
}
