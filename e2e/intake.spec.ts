import fs from "fs";
import path from "path";
import { expect, test } from "@playwright/test";

const shots = path.join(process.cwd(), "docs", "screenshots");
fs.mkdirSync(shots, { recursive: true });

test("landing explains the desk", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /will not tell you what the law requires/i })).toBeVisible();
  await expect(page.getByText("Portfolio demo by Quvantic - fictional brand, not a real business / not client work")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What’s under the hood" })).toBeVisible();
  await page.screenshot({ path: path.join(shots, "landing.png"), fullPage: true });
});

test("widget opens and a knowledge question shows a citation", async ({ page }) => {
  await page.goto("/embed-demo");
  const launcher = page.getByRole("button", { name: /Open Harlow and Pierce intake chat/i });
  await expect(launcher).toBeVisible();
  await launcher.click();
  const frame = page.frameLocator("iframe[title='Harlow and Pierce intake chat']");
  await expect(frame.getByText(/not legal advice/i).first()).toBeVisible();
  await frame.getByRole("button", { name: "What are your fees?" }).click();
  await expect(frame.getByText("Firm note: Contingency fees")).toBeVisible();
  await page.screenshot({ path: path.join(shots, "widget.png") });
});

test("injury intake books a consultation", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "Rear-end injury" }).click();
  await expect(page.getByText(/personal injury inquiry/i)).toBeVisible();
  await page.getByLabel("Message the intake desk").fill("My name is Jordan Hale. You can reach me at 555-014-2299 or jordan.ui@example.com.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/meets the firm’s criteria/i)).toBeVisible();
  await page.getByRole("button", { name: /10:00 AM/ }).first().click();
  await expect(page.getByText(/Matter HP-/)).toBeVisible();
  await expect(page.getByText(/not an engagement letter/i)).toBeVisible();
  await page.screenshot({ path: path.join(shots, "chat-booked.png"), fullPage: true });
});

test("asking for a person opens a handoff", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "Talk to a person" }).click();
  await expect(page.getByText(/opened a handoff/i)).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  await expect(page.getByText("Avery Cole")).toBeVisible();
  await page.screenshot({ path: path.join(shots, "pipeline.png"), fullPage: true });
});

test("mobile chat keeps the composer on screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/chat");
  await expect(page.getByLabel("Message the intake desk")).toBeVisible();
  await expect(page.getByRole("button", { name: "What are your fees?" })).toBeVisible();
  await page.screenshot({ path: path.join(shots, "chat-mobile.png") });
});
