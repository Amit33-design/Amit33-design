// Run the test suite under several simulated dates.
//
// Meal plans are seeded by the date, so a test that passes today can fail on
// a date whose menu hits an edge case. That broke CI on main twice (round 25):
// a sweep of 12 dates found the previous commit failing on every one of them.
// This runs the next few days — so a break shows up BEFORE its date arrives —
// plus dates that exposed real defects before.
import { spawnSync } from "node:child_process";

const DAY = 86_400_000;
const upcoming = [1, 2, 3, 5].map((n) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10));
const known = ["2026-10-07", "2026-10-26", "2026-11-15", "2026-12-01"];
const dates = [...new Set([...upcoming, ...known])];

let failed = [];
for (const date of dates) {
  const r = spawnSync("npx", ["vitest", "run", "--config", "vitest.dates.config.mts", "--reporter=dot"], {
    env: { ...process.env, FAKE_DATE: date },
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  const summary = (r.stdout.match(/Tests\s+.*$/m) || ["(no summary)"])[0];
  console.log(`${date}  ${summary.trim()}`);
  if (r.status !== 0) {
    failed.push(date);
    console.log(r.stdout.split("\n").filter((l) => /FAIL|AssertionError|×/.test(l)).slice(0, 12).join("\n"));
  }
}
if (failed.length) {
  console.error(`\nFailed on ${failed.length} date(s): ${failed.join(", ")}`);
  process.exit(1);
}
