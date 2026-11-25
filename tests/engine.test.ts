import { describe, expect, it } from "vitest";
import { classifyMatter } from "../lib/classify";
import { runConflictCheck } from "../lib/conflict";
import { extractFacts } from "../lib/extract";
import { searchKb } from "../lib/rag";
import { matchSlot, openSlots } from "../lib/slots";
import { detectUrgency } from "../lib/urgency";
import { evaluateScenario, NOW, SCENARIOS } from "../evals/scenarios";

describe("intake scenarios", () => {
  for (const scenario of SCENARIOS) {
    it(scenario.id, () => {
      const result = evaluateScenario(scenario);
      expect(result.failures).toEqual([]);
    });
  }
});

describe("tools", () => {
  it("does not treat a car crash as a domestic emergency", () => {
    expect(detectUrgency("The other driver hit me in a car accident").immediate).toBe(false);
  });

  it("classifies a firing as employment", () => {
    expect(classifyMatter("I was fired last month").practiceArea).toBe("employment");
  });

  it("matches only the full client name", () => {
    expect(runConflictCheck(["Dana Whitfield"]).clear).toBe(false);
    expect(runConflictCheck(["Dana"]).clear).toBe(true);
    expect(runConflictCheck(["Northwind Couriers"]).clear).toBe(true);
  });

  it("pulls the injury facts used in the main flow", () => {
    const facts = extractFacts(
      "I was rear-ended last month on Harbor Avenue in Ashford. I've been treating with an orthopedist. The other driver was Marcus Bell from Northwind Couriers.",
      NOW,
    );
    expect(facts.incidentDate).toBe("2026-10-25");
    expect(facts.location).toContain("Ashford");
    expect(facts.treatment).toMatch(/Medical/);
    expect(facts.opposingParties).toEqual(expect.arrayContaining(["Marcus Bell", "Northwind Couriers"]));
  });

  it("retrieves the contingency note for a fee question", () => {
    const [top] = searchKb("What are your fees for a personal injury matter?");
    expect(top.chunk.title).toMatch(/Contingency/);
  });

  it("offers weekday morning slots in Chicago", () => {
    const slots = openSlots(NOW, "personal_injury", []);
    const [first, second] = slots;
    expect(first.label).toContain("10:00 AM");
    expect(first.label).toContain("Thu");
    expect(first.attorney).toBe("Elena Harlow");
    expect(matchSlot(second.label, slots)?.id).toBe(second.id);
  });
});
