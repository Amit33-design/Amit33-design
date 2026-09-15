import { describe, it, expect } from "vitest";
import { generateWorkoutPlan, OnboardingInput } from "../recommendation-engine";

/**
 * Whole-space sweep for TRAINING, the counterpart to invariants.test.ts.
 *
 * The meal engine had four rounds of whole-space measurement; the workout side
 * had only spot checks, and a sweep immediately found two defects they had all
 * missed. Both were invisible one profile at a time:
 *
 *  • 96 of 240 profiles were handed the SAME session three times a week. Older
 *    adults had exactly one template carrying sets, and the weekly planner
 *    picks by set-coverage, so that one session won every training day — a
 *    68-year-old choosing "healthy aging" got an identical workout all week and
 *    the goal made no difference at all.
 *  • 24 profiles trained calves zero times a week, including sessions calling
 *    themselves full-body.
 *
 * Add new training invariants here rather than as one-off checks.
 */

const GOALS = ["weight_loss", "muscle_gain", "maintenance", "healthy_aging", "diabetes_friendly", "blood_pressure_management"];
const CONDITIONS: string[][] = [[], ["T2D"], ["HTN"], ["HEART_DISEASE"], ["ARTHRITIS"], ["OBESITY"], ["CKD"], ["THYROID"]];
const BODIES: Partial<OnboardingInput>[] = [
  { age: 22, gender: "male", weight_kg: 70, height_cm: 178, activity_level: "active" },
  { age: 35, gender: "female", weight_kg: 62, height_cm: 160, activity_level: "moderate" },
  { age: 55, gender: "male", weight_kg: 95, height_cm: 172, activity_level: "sedentary" },
  { age: 68, gender: "female", weight_kg: 55, height_cm: 152, activity_level: "sedentary" },
  { age: 78, gender: "male", weight_kg: 68, height_cm: 168, activity_level: "light" },
];

const base: OnboardingInput = {
  age: 40, gender: "male", weight_kg: 75, height_cm: 175,
  activity_level: "moderate", goal_type: "weight_loss",
  conditions: [], medications: [], cuisine: "indian", protein_pref: "vegetarian",
};

function profiles(): OnboardingInput[] {
  const out: OnboardingInput[] = [];
  for (const goal_type of GOALS)
    for (const conditions of CONDITIONS)
      for (const body of BODIES) out.push({ ...base, ...body, goal_type, conditions });
  return out;
}

const tag = (p: OnboardingInput) =>
  `${p.goal_type}[${p.conditions.join("+") || "none"}] ${p.age}${p.gender[0]}`;

const report = (bad: string[]) =>
  `${bad.length} violation(s):\n${bad.slice(0, 10).join("\n")}${bad.length > 10 ? `\n… and ${bad.length - 10} more` : ""}`;

function sweep(check: (p: OnboardingInput) => string | null): string[] {
  const bad: string[] = [];
  for (const p of profiles()) {
    const msg = check(p);
    if (msg) bad.push(`${tag(p)}: ${msg}`);
  }
  return bad;
}

describe("training invariants across the whole profile space", () => {
  it("never repeats one session three times in a week", () => {
    const bad = sweep((p) => {
      const names = generateWorkoutPlan(p).days
        .filter((d) => !d.is_rest_day)
        .flatMap((d) => d.templates.map((t) => t.name));
      const counts = new Map<string, number>();
      for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
      const worst = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      return worst && worst[1] >= 3 ? `"${worst[0]}" ${worst[1]}x of ${names.length} sessions` : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("trains every major muscle at least once a week", () => {
    const bad = sweep((p) => {
      const zero = generateWorkoutPlan(p).weekly_volume.filter((v) => v.sets === 0).map((v) => v.label);
      return zero.length ? `0 sets/week: ${zero.join(", ")}` : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("gives every plan training days, rest days and no four-day block", () => {
    const bad = sweep((p) => {
      const days = generateWorkoutPlan(p).days;
      const training = days.filter((d) => !d.is_rest_day);
      if (!training.length) return "no training days";
      if (!days.some((d) => d.is_rest_day)) return "no rest days";
      let run = 0, worst = 0;
      for (const d of days) { run = d.is_rest_day ? 0 : run + 1; worst = Math.max(worst, run); }
      return worst >= 4 ? `${worst} training days in a row` : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("never prescribes an empty or implausible session", () => {
    const bad = sweep((p) => {
      for (const day of generateWorkoutPlan(p).days) {
        if (day.is_rest_day) continue;
        if (!day.templates.length) return `${day.day} is a training day with no session`;
        for (const t of day.templates) {
          if (!t.instructions?.main_circuit?.length) return `${day.day} "${t.name}" has an empty main circuit`;
          if (!t.duration_min || t.duration_min < 10 || t.duration_min > 120)
            return `"${t.name}" runs ${t.duration_min} min`;
        }
      }
      return null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("always returns cardio guidance and a step target", () => {
    const bad = sweep((p) => {
      const plan = generateWorkoutPlan(p);
      if (!plan.cardio_zones?.length) return "no cardio zones";
      if (!plan.step_target) return "no step target";
      return null;
    });
    expect(bad, report(bad)).toEqual([]);
  });
});
