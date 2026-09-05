import { describe, it, expect } from "vitest";
import { generateMealPlan, generateWeeklyPlan, OnboardingInput } from "../recommendation-engine";

/**
 * Whole-space invariant sweep.
 *
 * Twice now a real defect survived because a test checked one profile on one
 * day: a dish served seven days running showed up only on the vegan menu, and
 * main meals silently lost their vegetable only when a particular dish won the
 * anchor slot. Both were invisible to spot checks and obvious the moment the
 * sweep widened.
 *
 * So this file asserts the clinical and composition invariants across the
 * whole profile space rather than a sample, and reports every violation at
 * once instead of dying on the first — a failure here should tell you the
 * shape of the problem, not just one instance of it.
 */

const CUISINES = ["indian", "western", "mediterranean"];
const DIETS = ["vegetarian", "non_vegetarian", "vegan", "pescatarian"];
const GOALS = ["weight_loss", "muscle_gain", "maintenance", "healthy_aging", "diabetes_friendly"];
const CONDITIONS: string[][] = [[], ["T2D"], ["HTN"], ["CKD"], ["HYPERLIPIDEMIA", "HEART_DISEASE"]];

const BODIES: Partial<OnboardingInput>[] = [
  { age: 28, gender: "male", weight_kg: 88, height_cm: 183, activity_level: "active" },
  { age: 45, gender: "female", weight_kg: 62, height_cm: 160, activity_level: "moderate" },
  { age: 68, gender: "female", weight_kg: 55, height_cm: 152, activity_level: "sedentary" },
  { age: 35, gender: "male", weight_kg: 75, height_cm: 175, activity_level: "light" },
];

const base: OnboardingInput = {
  age: 40, gender: "male", weight_kg: 75, height_cm: 175,
  activity_level: "moderate", goal_type: "weight_loss",
  conditions: [], medications: [], cuisine: "indian", protein_pref: "vegetarian",
};

/** Every profile worth checking, as a flat list. */
function profiles(): OnboardingInput[] {
  const out: OnboardingInput[] = [];
  let i = 0;
  for (const cuisine of CUISINES)
    for (const protein_pref of DIETS)
      for (const goal_type of GOALS)
        for (const conditions of CONDITIONS) {
          out.push({ ...base, ...BODIES[i % BODIES.length], cuisine, protein_pref, goal_type, conditions });
          i += 1;
        }
  return out;
}

/** Collect violations rather than throwing on the first. */
function sweep(check: (p: OnboardingInput, day: number) => string | null, dayCount = 3): string[] {
  const bad: string[] = [];
  for (const p of profiles()) {
    for (let d = 0; d < dayCount; d++) {
      const msg = check(p, d);
      if (msg) bad.push(`${p.cuisine}/${p.protein_pref}/${p.goal_type}[${p.conditions.join("+") || "none"}] d${d}: ${msg}`);
    }
  }
  return bad;
}

const report = (bad: string[]) =>
  `${bad.length} violation(s):\n${bad.slice(0, 12).join("\n")}${bad.length > 12 ? `\n… and ${bad.length - 12} more` : ""}`;

describe("invariants across the whole profile space", () => {
  it("never produces an empty meal slot", () => {
    const bad = sweep((p, d) => {
      const plan = generateMealPlan(p, d);
      const empty = plan.meals.filter((m) => m.items.length === 0).map((m) => m.slot);
      return empty.length ? `empty ${empty.join(",")}` : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("keeps every main meal supplied with vegetables", () => {
    const bad = sweep((p, d) => {
      const plan = generateMealPlan(p, d);
      const missing = ["lunch", "dinner"].filter(
        (slot) => !plan.meals.find((m) => m.slot === slot)!.items.some((i) => i.food.has_veg)
      );
      return missing.length ? `no vegetable at ${missing.join(",")}` : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("never exceeds the renal protein cap for CKD", () => {
    const bad = sweep((p, d) => {
      if (!p.conditions.includes("CKD")) return null;
      const plan = generateMealPlan(p, d);
      const cap = 0.75 * p.weight_kg * 1.15;
      return plan.total_protein_g > cap
        ? `protein ${plan.total_protein_g}g over renal cap ${Math.round(cap)}g`
        : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("never serves a high-GI food to someone managing blood sugar", () => {
    const bad = sweep((p, d) => {
      if (!p.conditions.includes("T2D")) return null;
      const plan = generateMealPlan(p, d);
      const hits = plan.meals
        .flatMap((m) => m.items)
        .filter((i) => (i.food.glycemic_index ?? 0) >= 70)
        .map((i) => i.food.name);
      return hits.length ? `high-GI: ${hits.join(", ")}` : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("never prescribes calories below resting metabolic rate", () => {
    const bad = sweep((p, d) => {
      const m = generateMealPlan(p, d).macro_targets;
      return m.calories < m.bmr - 10 ? `${m.calories} kcal below BMR ${m.bmr}` : null;
    }, 1);
    expect(bad, report(bad)).toEqual([]);
  });

  it("always offers at least ten choices in every meal slot", () => {
    const bad = sweep((p, d) => {
      const plan = generateMealPlan(p, d);
      const thin = plan.meals
        .filter((m) => m.items.length + m.alternatives.length < 10)
        .map((m) => `${m.slot}=${m.items.length + m.alternatives.length}`);
      return thin.length ? `too few choices: ${thin.join(",")}` : null;
    }, 1);
    expect(bad, report(bad)).toEqual([]);
  });

  it("never offers an egg dish to an Indian vegetarian or any vegan", () => {
    const EGGS = ["food-egg-boiled", "food-egg-bhurji", "food-egg-omelette", "food-egg-curry", "food-shakshuka"];
    const bad = sweep((p, d) => {
      const veganOrIndianVeg =
        p.protein_pref === "vegan" || (p.protein_pref === "vegetarian" && p.cuisine === "indian");
      if (!veganOrIndianVeg) return null;
      const plan = generateMealPlan(p, d);
      const hits = plan.meals
        .flatMap((m) => [...m.items, ...m.alternatives])
        .filter((i) => EGGS.includes(i.food.id))
        .map((i) => i.food.name);
      return hits.length ? `egg dish offered: ${[...new Set(hits)].join(", ")}` : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("never serves any dish more than four times in a week", () => {
    const bad: string[] = [];
    for (const p of profiles().filter((_, i) => i % 4 === 0)) {
      const week = generateWeeklyPlan(p);
      const counts = new Map<string, number>();
      for (const day of week.days)
        for (const meal of day.plan.meals)
          for (const item of meal.items) counts.set(item.food.name, (counts.get(item.food.name) ?? 0) + 1);
      for (const [name, n] of counts) {
        if (n > 4) bad.push(`${p.cuisine}/${p.protein_pref}: ${name} served ${n}×`);
      }
    }
    expect(bad, report(bad)).toEqual([]);
  });

  // generateWeeklyPlan always starts at today, so the check above only ever
  // exercises one of the engine's date seeds. A dish served twice in a single
  // day (the vegetable guarantee relaxes the same-day dedupe) counted once
  // against the weekly cap, so a dish sitting at 3 uses could finish the week
  // at 5 — invisible until the calendar happened to line up, which is how it
  // shipped. Rebuilding the week from a sliding start date makes the guard
  // hold whatever day the suite runs on. Vegan and vegetarian menus are the
  // narrow ones, so that is where the cap gets stressed.
  it("holds the weekly repetition cap from any start date", () => {
    const tight: OnboardingInput[] = [];
    for (const cuisine of CUISINES)
      for (const protein_pref of ["vegan", "vegetarian"])
        for (const goal_type of ["weight_loss", "muscle_gain"])
          for (const conditions of [[], ["CKD"], ["T2D"]])
            tight.push({ ...base, cuisine, protein_pref, goal_type, conditions });

    const bad: string[] = [];
    for (const p of tight) {
      for (let start = 0; start < 14; start++) {
        const usage = new Map<string, number>();
        const counts = new Map<string, number>();
        for (let d = 0; d < 7; d++) {
          for (const meal of generateMealPlan(p, start + d, usage).meals)
            for (const item of meal.items) {
              const id = item.food.id.replace(/^food-/, "");
              usage.set(id, (usage.get(id) ?? 0) + 1);
              counts.set(item.food.name, (counts.get(item.food.name) ?? 0) + 1);
            }
        }
        for (const [name, n] of counts) {
          if (n > 4) bad.push(`${p.cuisine}/${p.protein_pref}/${p.goal_type} from day ${start}: ${name} served ${n}×`);
        }
      }
    }
    expect(bad, report(bad)).toEqual([]);
  });

  it("reports nutrient patterns for every weekly plan", () => {
    const bad: string[] = [];
    for (const p of profiles().filter((_, i) => i % 8 === 0)) {
      const week = generateWeeklyPlan(p);
      if (!week.nutrient_consistency?.length) bad.push(`${p.cuisine}/${p.protein_pref}: no consistency data`);
      for (const n of week.nutrient_consistency ?? []) {
        if (n.days_off > n.days_total) bad.push(`${p.cuisine}/${p.protein_pref}: ${n.label} days_off ${n.days_off} > ${n.days_total}`);
      }
    }
    expect(bad, report(bad)).toEqual([]);
  });

  it("honours every hard condition exclusion", () => {
    // These are the rules that make the app safe to follow with a diagnosis.
    // Each was implemented once and never verified across the whole space.
    const RULES: { cond: string; label: string; unsafe: (f: Record<string, unknown>) => boolean }[] = [
      { cond: "HTN", label: "high-sodium", unsafe: (f) => f.sodium_level === "high" },
      { cond: "HEART_DISEASE", label: "high-sodium", unsafe: (f) => f.sodium_level === "high" },
      { cond: "KIDNEY_STONES", label: "high-oxalate", unsafe: (f) => f.oxalate_level === "high" },
      { cond: "HYPERLIPIDEMIA", label: "high-saturated-fat", unsafe: (f) => f.satfat_level === "high" },
      { cond: "HEART_DISEASE", label: "high-saturated-fat", unsafe: (f) => f.satfat_level === "high" },
      { cond: "THYROID", label: "goitrogenic", unsafe: (f) => f.is_goitrogenic === true },
      { cond: "CKD", label: "high-potassium", unsafe: (f) => f.is_high_potassium === true },
    ];
    const bad = sweep((p, d) => {
      const active = RULES.filter((r) => p.conditions.includes(r.cond));
      if (!active.length) return null;
      const plan = generateMealPlan(p, d);
      const hits: string[] = [];
      for (const meal of plan.meals) {
        // alternatives are offered to the user too, so they must be safe as well
        for (const item of [...meal.items, ...meal.alternatives]) {
          for (const r of active) {
            if (r.unsafe(item.food as unknown as Record<string, unknown>)) {
              hits.push(`${item.food.name} (${r.label}, ${r.cond})`);
            }
          }
        }
      }
      return hits.length ? [...new Set(hits)].join("; ") : null;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  it("keeps potassium-rich foods off the plate for ACE/ARB users", () => {
    // Not a hard exclusion — a soft ranking penalty — so this asserts the
    // steering actually bites rather than demanding zero.
    const withMed = { ...base, conditions: ["HTN"], medications: ["ace_arb"], protein_pref: "vegetarian" };
    const without = { ...base, conditions: ["HTN"], medications: [], protein_pref: "vegetarian" };
    let medCount = 0;
    let plainCount = 0;
    for (let d = 0; d < 7; d++) {
      const countK = (p: OnboardingInput) =>
        generateMealPlan(p, d).meals.flatMap((m) => m.items).filter((i) => i.food.is_high_potassium).length;
      medCount += countK(withMed);
      plainCount += countK(without);
    }
    expect(medCount, `ACE/ARB ${medCount} vs plain ${plainCount} high-potassium servings`).toBeLessThanOrEqual(plainCount);
  });

  it("never reports more usable protein than was actually eaten", () => {
    const bad = sweep((p, d) => {
      const q = generateMealPlan(p, d).protein_quality;
      return q.usable_protein_g > q.total_protein_g
        ? `usable ${q.usable_protein_g}g > total ${q.total_protein_g}g`
        : null;
    }, 2);
    expect(bad, report(bad)).toEqual([]);
  });
});
