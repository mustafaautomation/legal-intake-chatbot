import type { LucideIcon } from "lucide-react";
import { Briefcase, Car, Headphones, Receipt } from "lucide-react";
import type { Suggestion } from "./types";

export const BOT = {
  name: "Intake desk",
  brand: "Harlow & Pierce",
  subtitle: "AI agent · Not legal advice",
  humanName: "Elena Harlow",
  humanRole: "human specialist",
} as const;

export const TEASER = "Rear-ended or let go? I can open an intake and book a consult.";

export const NUDGES: Suggestion[] = [
  { id: "nudge-intake", label: "Start an intake", send: "I want to start an intake for a new matter." },
  { id: "nudge-consult", label: "Book a consult", send: "I want to book a screening consultation." },
];

export const STARTER_ICONS: Record<string, LucideIcon> = {
  injury: Car,
  fired: Briefcase,
  fees: Receipt,
  human: Headphones,
};

export const METRICS = [
  { value: "26", label: "KB guides" },
  { value: "24", label: "Evals in CI" },
  { value: "8", label: "Tools" },
  { value: "Seconds", label: "Replies in" },
] as const;

export const FEE_TABLES = {
  contingency: {
    title: "Personal injury contingency",
    rows: [
      { label: "Before a lawsuit", amount: "33%" },
      { label: "After filing", amount: "40%" },
      { label: "If there is no recovery", amount: "$0 fee" },
    ],
    total: "33–40%",
    note: "Sample range for this demo, not a bill. Not an engagement letter. Costs are separate.",
  },
  hourly: {
    title: "Hourly screening",
    rows: [
      { label: "Employment", amount: "$350–$475" },
      { label: "Family", amount: "$325–$450" },
      { label: "Family retainer from", amount: "$3,500" },
    ],
    total: "Consult free",
    note: "Sample range for this demo, not a bill. Not an engagement letter. Screening consults for these areas are free.",
  },
  flat: {
    title: "Flat fees",
    rows: [
      { label: "Immigration screening", amount: "$150" },
      { label: "Credited if retained", amount: "Yes" },
    ],
    total: "$150",
    note: "Sample range for this demo, not a bill. Not an engagement letter.",
  },
} as const;

export const PLACEHOLDER = "Ask about fees, a consult, or what happened…";

export const GREETING = [
  "I can sort an injury, a job, a family matter, or an immigration question, then book a screening consult when it fits.",
  "I do not give legal advice, and this chat does not create an attorney-client relationship.",
].join(" ");
