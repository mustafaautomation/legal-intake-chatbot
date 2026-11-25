import fs from "fs";
import path from "path";
import { evaluateScenario, SCENARIOS } from "./scenarios";

const results = SCENARIOS.map((scenario) => {
  const result = evaluateScenario(scenario);
  return { id: scenario.id, ...result };
});

const lines = [
  "# Intake eval scorecard",
  "",
  `Ran ${results.length} scenarios against the deterministic intake engine.`,
  "",
  "| Scenario | Result | Notes |",
  "| --- | --- | --- |",
  ...results.map((result) => `| ${result.id} | ${result.pass ? "pass" : "fail"} | ${result.failures.join("; ") || ""} |`),
  "",
];

const outDir = path.join(process.cwd(), "evals", "out");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "scorecard.md"), lines.join("\n"));
fs.writeFileSync(path.join(outDir, "scorecard.json"), JSON.stringify({ passed: results.filter((result) => result.pass).length, total: results.length, results }, null, 2));

for (const line of lines) console.log(line);
const failed = results.filter((result) => !result.pass);
if (failed.length > 0) {
  process.exitCode = 1;
}
