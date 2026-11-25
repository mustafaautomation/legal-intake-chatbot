import { monthsBetween } from "./dates";
import type { IntakeAnswers, PracticeArea, ScoreResult } from "./types";

function clamp(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export function scoreCase(area: PracticeArea, intake: IntakeAnswers, now: Date): ScoreResult {
  if (area === "out_of_scope") {
    return {
      score: 0,
      qualified: false,
      reasons: ["The described work is outside the firm’s practice areas."],
    };
  }
  let score = 40;
  const reasons = ["The matter is inside a practice area the firm accepts."];
  if (intake.clientName && intake.phone && intake.email) {
    score += 10;
    reasons.push("Contact details are complete enough to open a file.");
  }
  const months = monthsBetween(intake.incidentDate, now);
  if (area === "personal_injury") {
    if (months !== null && months <= 18) {
      score += 20;
      reasons.push("The incident date is inside the firm’s general 18-month intake window.");
    } else if (months !== null && months > 36) {
      score -= 45;
      reasons.push(
        "The incident date is outside the general multi-year filter the firm uses before offering a consult. This is not a ruling that a claim is barred.",
      );
    }
    if (intake.treatment === "Medical treatment described") {
      score += 15;
      reasons.push("Medical treatment was described.");
    } else if (intake.treatment === "No medical treatment described") {
      score -= 20;
      reasons.push("No medical treatment was described.");
    }
    if (intake.opposingParties.some((party) => party.toLowerCase() !== "unknown")) {
      score += 10;
      reasons.push("Another party was named for the conflict screen.");
    }
  }
  if (area === "employment") {
    if (months !== null && months <= 12) {
      score += 20;
      reasons.push("The adverse action is inside the firm’s general one-year intake window.");
    } else if (months !== null && months > 24) {
      score -= 40;
      reasons.push(
        "The adverse action is outside the general filter the firm uses before offering a consult. This is not a ruling that a charge is time-barred.",
      );
    }
    if (intake.employer) {
      score += 15;
      reasons.push("An employer was named.");
    }
    if (intake.adverseAction) {
      score += 10;
      reasons.push("The workplace event was described well enough to sort.");
    }
  }
  if (area === "family") {
    score += 20;
    reasons.push("The family facts needed for a screening consult are present.");
    if (intake.county) {
      score += 10;
      reasons.push(`County noted: ${intake.county}.`);
    }
  }
  if (area === "immigration") {
    score += 25;
    reasons.push(`The described process is one the firm screens: ${intake.immigrationProcess ?? "immigration"}.`);
  }
  const finalScore = clamp(score);
  return {
    score: finalScore,
    qualified: finalScore >= 60,
    reasons,
  };
}
