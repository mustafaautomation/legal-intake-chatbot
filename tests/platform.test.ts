import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { parseMessenger, parseWhatsApp, verifyChallenge } from "../lib/channels";
import { answerMessenger, answerWhatsApp } from "../lib/channel-handler";
import { redact } from "../lib/redact";
import { assertToolInput } from "../lib/tool-schemas";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "intake-"));
process.env.DATA_PATH = path.join(dir, "intake.json");
process.env.LLM_PROVIDER = "demo";

afterEach(() => {
  process.env.LLM_PROVIDER = "demo";
});

describe("redaction", () => {
  it("masks email and phone numbers in logs", () => {
    const masked = redact("Reach jordan.hale@example.com or 555-014-2288 today");
    expect(masked).not.toContain("jordan.hale@example.com");
    expect(masked).not.toContain("555-014-2288");
    expect(masked).toContain("[email]");
    expect(masked).toContain("[phone]");
  });
});

describe("tool schemas", () => {
  it("rejects a conflict check without party names", () => {
    expect(() => assertToolInput("run_conflict_check", { parties: "Dana" })).toThrow(/Invalid/);
  });
});

describe("channel adapters", () => {
  it("verifies the WhatsApp hub challenge", () => {
    const params = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "demo-verify-token", "hub.challenge": "abc123" });
    expect(verifyChallenge(params, "demo-verify-token")).toBe("abc123");
    expect(verifyChallenge(params, "wrong")).toBeNull();
  });

  it("maps a WhatsApp payload through the intake agent", async () => {
    const result = await answerWhatsApp({
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "15550142200",
                    id: "wamid.1",
                    type: "text",
                    text: { body: "What are your fees for a personal injury matter?" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(parseWhatsApp({ entry: [] })).toBeNull();
    expect(result?.reply.toLowerCase()).toContain("contingency");
    expect(result?.outbound).toMatchObject({ messaging_product: "whatsapp", to: "15550142200" });
    const audit = fs.readFileSync(path.join(dir, "audit.log"), "utf8");
    expect(audit).not.toContain("555-014-2288");
  });

  it("maps a Messenger payload and refuses legal advice", async () => {
    const payload = {
      entry: [{ messaging: [{ sender: { id: "psid-9" }, message: { mid: "m1", text: "Should I accept the insurance company's settlement offer?" } }] }],
    };
    expect(parseMessenger(payload)?.text).toMatch(/accept/i);
    const result = await answerMessenger(payload);
    expect(result?.reply).toMatch(/not legal advice/i);
    expect(result?.reply).not.toMatch(/you should accept/i);
    expect(result?.outbound).toMatchObject({ recipient: { id: "psid-9" } });
  });
});
