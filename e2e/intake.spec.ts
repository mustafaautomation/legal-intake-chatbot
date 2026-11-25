import fs from "fs";
import path from "path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const shots = path.join(process.cwd(), "docs", "screenshots");
fs.mkdirSync(path.join(shots, "visual"), { recursive: true });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.documentElement.dataset.visualTest = "1";
    localStorage.removeItem("hp-teaser-dismissed");
  });
});

test("landing shows the teaser, trust panel, and live chat", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /happened/i })).toBeVisible();
  await expect(page.getByText("Portfolio demo by Quvantic - fictional brand, not a real business / not client work").first()).toBeVisible();
  await expect(page.getByText(/under the hood/i)).toBeVisible();
  await expect(page.getByTestId("metrics-strip")).toBeVisible();
  await expect(page.getByTestId("trust-panel")).toBeVisible();
  await expect(page.getByTestId("landing-hero-chat").getByTestId("composer-input")).toBeVisible();
  await expect(page.getByTestId("launcher-teaser")).toBeVisible();
  await expect(page.getByTestId("launcher-nudge").filter({ hasText: "Start an intake" })).toBeVisible();
  await expect(page.getByTestId("launcher-nudge").filter({ hasText: "Book a consult" })).toBeVisible();
  await expect(page.getByTestId("mode-pill").first()).toHaveText("Demo mode");
  await page.screenshot({ path: path.join(shots, "landing.png"), fullPage: true });
  await page.screenshot({ path: path.join(shots, "visual", "launcher-closed.png") });
});

test("widget empty state and a fee citation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/chat");
  await expect(page.getByTestId("chat-widget").getByTestId("starter").first()).toBeVisible();
  await expect(page.getByTestId("mode-pill")).toHaveText("Demo mode");
  await page.screenshot({ path: path.join(shots, "visual", "widget-open-empty.png") });
  await page.getByRole("button", { name: "What does a consult cost?" }).click();
  await expect(page.getByTestId("phase-indicator")).toBeVisible();
  await expect(page.getByTestId("composer-stop")).toBeVisible();
  await expect(page.getByTestId("citation-chip").filter({ hasText: "Contingency fees" })).toBeVisible();
  await page.getByTestId("citation-chip").first().focus();
  await expect(page.getByTestId("citation-preview")).toBeVisible();
  await expect(page.getByTestId("card-quote")).toBeVisible();
  await expect(page.getByTestId("quick-reply").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" }).first()).toBeVisible();
  await page.screenshot({ path: path.join(shots, "widget.png") });
});

test("injury intake shows slot chips and books", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "I was rear-ended last month" }).click();
  await expect(page.getByText(/personal injury inquiry/i)).toBeVisible();
  await page.getByLabel("Message the intake desk").fill("My name is Jordan Hale. You can reach me at 555-014-2299 or jordan.ui@example.com.");
  await page.getByTestId("composer-send").click();
  await expect(page.getByTestId("card-booking")).toBeVisible();
  await expect(page.getByText("Only times the booking system returned")).toBeVisible();
  await page.getByTestId("slot-chip").first().click();
  await expect(page.getByText(/Matter HP-/)).toBeVisible();
  await expect(page.getByText(/not an engagement letter/i)).toBeVisible();
  await expect(page.getByTestId("card-confirm")).toBeVisible();
  await page.screenshot({ path: path.join(shots, "chat-booked.png"), fullPage: true });
  await page.screenshot({ path: path.join(shots, "visual", "rich-card.png") });
});

test("handoff reaches admin and the bot can resume", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "Talk to a person" }).click();
  await expect(page.getByText(/opened a handoff/i)).toBeVisible();
  await expect(page.getByTestId("handoff-banner")).toContainText(/team member|Elena Harlow/);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  await expect(page.getByText("Avery Cole", { exact: true })).toBeVisible();
  await page.getByTestId("resume-bot").click();
  await expect(page.getByText("The intake desk is back on this chat.", { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(shots, "pipeline.png"), fullPage: true });
});

test("lead card and mobile widget", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByTestId("chat-launcher").click();
  const widget = page.getByTestId("chat-widget");
  await expect(widget).toBeVisible();
  const box = await widget.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(360);
  await expect(widget.getByRole("button", { name: "Close chat" })).toBeVisible();
  await widget.getByTestId("lead-link").click();
  await expect(widget.getByTestId("card-lead")).toBeVisible();
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375 + 1);
  await page.screenshot({ path: path.join(shots, "visual", "widget-mobile.png") });
  await page.screenshot({ path: path.join(shots, "chat-mobile.png") });
});

test("dark mode widget", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/chat");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.getByTestId("mode-pill")).toBeVisible();
  await page.screenshot({ path: path.join(shots, "visual", "widget-dark.png") });
});

test("embed demo loads the widget script", async ({ page }) => {
  await page.goto("/embed-demo");
  const frame = page.frameLocator("iframe[title='Harlow and Pierce intake chat']");
  await expect(frame.getByTestId("chat-launcher")).toBeVisible();
  await frame.getByTestId("chat-launcher").click();
  await expect(frame.getByTestId("chat-widget")).toBeVisible();
  await expect(frame.getByText(/not legal advice/i).first()).toBeVisible();
});

test("axe finds no serious issues on the landing page", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  const bad = results.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
  expect(bad.map((item) => item.id)).toEqual([]);
});
