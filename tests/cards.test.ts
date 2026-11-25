import { describe, expect, it } from "vitest";
import { checklistFor, deriveCards } from "../lib/cards";
import { createSession } from "../lib/agent";
import type { ChatMessage, Session } from "../lib/types";

const now = new Date("2026-11-25T18:00:00.000Z");

function message(partial: Partial<ChatMessage>): ChatMessage {
  return {
    id: "m1",
    role: "assistant",
    content: "Noted.",
    createdAt: now.toISOString(),
    ...partial,
  };
}

describe("card payloads", () => {
  it("maps a clear conflict screen and a checklist", () => {
    const session = createSession(now, "s1");
    session.practiceArea = "personal_injury";
    session.intake.narrative = "Rear-ended on Harbor Avenue.";
    session.intake.opposingParties = ["Marcus Bell"];
    const cards = deriveCards(
      message({
        tools: [
          {
            name: "run_conflict_check",
            input: { parties: ["Marcus Bell"] },
            output: { clear: true, parties: ["Marcus Bell"], matches: [], note: "Preliminary screen." },
          },
          {
            name: "classify_matter",
            input: { description: "rear-end" },
            output: { practiceArea: "personal_injury", urgency: "routine", confidence: 0.9, reasons: [] },
          },
        ],
      }),
      session,
      true,
    );
    expect(cards.some((card) => card.type === "conflict" && card.clear)).toBe(true);
    expect(cards.some((card) => card.type === "matter")).toBe(true);
    expect(checklistFor(session).items.find((item) => item.label === "Other party named")?.done).toBe(true);
    expect(checklistFor(session).items.find((item) => item.label === "Name, phone, and email")?.done).toBe(false);
  });

  it("turns slot suggestions into a booking card", () => {
    const session = createSession(now, "s2") as Session;
    session.stage = "scheduling";
    const cards = deriveCards(
      message({
        suggestions: [{ id: "slot-1", label: "Thu, Nov 27, 10:00 AM CT", send: "Thu, Nov 27, 10:00 AM CT" }],
      }),
      session,
      true,
    );
    expect(cards.find((card) => card.type === "booking")?.slots).toHaveLength(1);
  });
});
