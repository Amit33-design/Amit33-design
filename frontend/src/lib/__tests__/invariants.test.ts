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
const CONDITIONS: string[][] = [[], ["T2D"], ["HTN"], ["CKD"], ["HYPERLIPIDEMIA", "HEART_DISEASE"], ["HYPERTRIGLYCERIDEMIA"]];

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
          for (const item of meal.items) {
            // Cooking fats are exempt from the variety cap by design — a
            // drizzle of oil is a cooking medium, not a dish, and it is the
            // only energy a renal plan can add without protein.
            if (item.food.food_group === "fats") continue;
            counts.set(item.food.name, (counts.get(item.food.name) ?? 0) + 1);
          }
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
              // Cooking fats are deliberately exempt from the variety cap —
              // a drizzle of oil is a cooking medium, not a dish, and real
              // meals use one most days.
              if (item.food.food_group === "fats") continue;
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

  // The plan has to actually DELIVER the calories it prescribes. Nothing
  // checked this: the macro test asserts the TARGET clears BMR, and the CKD
  // test asserts protein stays under the renal cap — so a renal plan that met
  // both while serving 869 kcal against a 2460 kcal prescription passed
  // everything. Under-eating on a protein-restricted diet burns lean tissue
  // and raises urea, which is precisely what the cap exists to prevent.
  it("delivers the calories it prescribes, or says why it cannot", () => {
    const bad = sweep((p, d) => {
      const plan = generateMealPlan(p, d);
      const ratio = plan.total_calories / plan.macro_targets.calories;
      if (ratio >= 0.85) return null;
      // A renal cap and a full energy target can genuinely conflict. That is
      // allowed — going quiet about it is not.
      const flagged = (plan.nutrient_actions ?? []).some((a) => a.nutrient === "Energy");
      if (p.conditions.includes("CKD") && flagged) return null;
      return `delivers ${Math.round(plan.total_calories)} of ${plan.macro_targets.calories} kcal (${Math.round(ratio * 100)}%)${flagged ? "" : " with no shortfall warning"}`;
    });
    expect(bad, report(bad)).toEqual([]);
  });

  // Free sugars means added sugar, honey/syrups and blended fruit — NOT the
  // sugars in vegetables, milk or whole grain. The engine used to count a
  // dish's total sugar for everything except fruit and three named dairy
  // items, so roasted vegetables and a yogurt dressing scored as added sugar
  // and 214 of 300 plans reported breaching a limit they were nowhere near.
  it("counts only genuinely-added sugars as free sugars", () => {
    const SWEETENED = ["smoothie", "granola", "parfait", "muesli", "laddoo", "turmeric-milk", "overnight-oats", "fruit-yogurt", "soy-milk"];
    const bad = sweep((p, d) => {
      const plan = generateMealPlan(p, d);
      const sugar = plan.nutrients.find((n) => n.key === "sugar_g");
      if (!sugar || sugar.actual === 0) return null;
      // any free sugar on the plate must be traceable to a dish that has some
      const carriers = plan.meals
        .flatMap((m) => m.items)
        .filter((i) => SWEETENED.some((k) => i.food.id.includes(k)));
      return carriers.length === 0
        ? `${sugar.actual} g free sugars but no dish on the plate contains added or blended sugar`
        : null;
    }, 2);
    expect(bad, report(bad)).toEqual([]);
  });

  // ── Carb ceiling (diabetes / prediabetes) ─────────────────────────────────
  // computeMacros capped carbs at 40% of calories, but Phase 2 had no carb
  // lever and refilled calories from starch, so 788 of 1,008 carb-controlled
  // days ran above 44% — the worst at 64% — while the AI Copilot told these
  // users their carbs were "capped at 40%". Measured against the ceiling the
  // diabetes rule is about, not the arithmetic remainder in carbs_g, which
  // for a small high-protein plan sits below 40% on its own.
  const carbProfiles = (): OnboardingInput[] => {
    const out: OnboardingInput[] = [];
    for (const body of BODIES) for (const cuisine of CUISINES) for (const protein_pref of DIETS)
      for (const conditions of [["PREDIABETES"], ["T2D"], ["PREDIABETES", "HYPERLIPIDEMIA"]])
        out.push({ ...base, ...body, cuisine, protein_pref, goal_type: "diabetes_friendly", conditions });
    return out;
  };

  it("holds carb-controlled plans near the 40% carbohydrate ceiling", () => {
    let days = 0, within = 0;
    const flagless: string[] = [];
    for (const p of carbProfiles()) {
      for (let d = 0; d < 3; d++) {
        const plan = generateMealPlan(p, d);
        const share = (plan.total_carbs_g * 4) / plan.total_calories;
        days++;
        if (share <= 0.44) { within++; continue; }
        // anything over must at least tell the user, with what to do about it
        const flagged = plan.nutrient_actions.some((a) => a.nutrient === "Carbohydrate");
        if (!flagged) flagless.push(`${p.cuisine}/${p.protein_pref}/${p.age}${p.gender[0]} d${d}: ${Math.round(share * 100)}% carbs, no warning`);
      }
    }
    expect(flagless, report(flagless)).toEqual([]);
    // HEAD was 22% within 1.10x of the ceiling; now ~93%. Held at 88% so a
    // date seed cannot flake it, while still failing loudly on a regression.
    expect(within / days, `only ${Math.round((within / days) * 100)}% of carb-controlled days within 44% carbs`).toBeGreaterThanOrEqual(0.88);
  });

  it("never serves a meat-inclusive carb-controlled day above 48% carbohydrate", () => {
    // The residual over-ceiling days are plant-based (pulses are 55-65% carb).
    // With animal protein available there is no excuse.
    const bad: string[] = [];
    for (const p of carbProfiles()) {
      if (p.protein_pref === "vegan" || p.protein_pref === "vegetarian") continue;
      for (let d = 0; d < 3; d++) {
        const plan = generateMealPlan(p, d);
        const share = (plan.total_carbs_g * 4) / plan.total_calories;
        if (share > 0.48) bad.push(`${p.cuisine}/${p.protein_pref}/${p.age}${p.gender[0]} d${d}: ${Math.round(share * 100)}%`);
      }
    }
    expect(bad, report(bad)).toEqual([]);
  });

  it("never serves a high-GI food to a user who chose the diabetes-friendly goal", () => {
    // The high-GI exclusion keyed off a DIAGNOSIS, so choosing the goal
    // without one still allowed white rice (GI 73).
    const bad = sweep((p, d) => {
      const plan = generateMealPlan({ ...p, goal_type: "diabetes_friendly" }, d);
      const hits = plan.meals.flatMap((m) => m.items).filter((i) => (i.food.glycemic_index ?? 0) >= 70);
      return hits.length ? `high-GI: ${hits.map((i) => i.food.name).join(", ")}` : null;
    }, 1);
    expect(bad, report(bad)).toEqual([]);
  });

  it("keeps protein above the clinical floor while cutting carbs", () => {
    // The carb passes swap and drop starch-led dishes, which on a plant plan
    // carry much of the protein. The first version pushed 20 days under
    // 1.0 g/kg, most of them a 68-year-old — the muscle-loss threshold.
    const bad: string[] = [];
    for (const p of carbProfiles()) {
      const floor = p.weight_kg * (p.age >= 65 ? 1.1 : 1.0);
      for (let d = 0; d < 3; d++) {
        const plan = generateMealPlan(p, d);
        if (plan.total_protein_g < floor - 1)
          bad.push(`${p.protein_pref}/${p.age}${p.gender[0]} d${d}: ${plan.total_protein_g} g protein, floor ${Math.round(floor)} g`);
      }
    }
    expect(bad, report(bad)).toEqual([]);
  });

  // ── Saturated fat (cholesterol / heart) ───────────────────────────────────
  // The 6%-of-calories limit was computed and displayed but never enforced:
  // the food-level exclusion only caught dishes labelled "high", "med" dishes
  // stacked, and half of these days ran over, the worst at 3.5x.
  it("holds cholesterol and heart plans under the saturated-fat limit", () => {
    let days = 0, within = 0;
    const unflagged: string[] = [];
    for (const body of BODIES) for (const cuisine of CUISINES) for (const protein_pref of DIETS)
      for (const [goal_type, conditions] of [
        ["diabetes_friendly", ["PREDIABETES", "HYPERLIPIDEMIA"]],
        ["maintenance", ["HYPERLIPIDEMIA"]],
        ["weight_loss", ["HEART_DISEASE"]],
      ] as [string, string[]][]) {
        const p = { ...base, ...body, cuisine, protein_pref, goal_type, conditions };
        for (let d = 0; d < 3; d++) {
          const plan = generateMealPlan(p, d);
          const sf = plan.nutrients.find((n) => n.key === "satfat_g")!;
          days++;
          if (sf.actual <= sf.target * 1.10) { within++; continue; }
          if (!plan.nutrient_actions.some((a) => a.nutrient === "Saturated Fat"))
            unflagged.push(`${cuisine}/${protein_pref}/${conditions.join("+")} d${d}: ${sf.actual}/${sf.target} g, no warning`);
        }
      }
    expect(unflagged, report(unflagged)).toEqual([]);
    // HEAD was 56% within 1.10x; now ~95%. Held at 92% for date-seed margin.
    expect(within / days, `only ${Math.round((within / days) * 100)}% within 1.10x of the sat-fat limit`).toBeGreaterThanOrEqual(0.92);
  });

  it("labels every food's saturated fat consistently with its grams", async () => {
    // paneer (8 g) was "high" while paneer tikka (10 g) and palak paneer
    // (8.5 g) were "med" — so the cholesterol exclusion missed exactly the
    // dishes it exists to catch. The label must agree with the data.
    const { getMicros } = await import("../nutrition-data");
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const p of profiles()) {
      for (const meal of generateMealPlan(p, 0).meals) {
        for (const item of [...meal.items, ...meal.alternatives]) {
          const id = item.food.id.replace(/^food-/, "");
          if (seen.has(id)) continue;
          seen.add(id);
          const grams = getMicros(id, item.food.food_group, item.food.calories).satfat_g;
          if (grams >= 6 && item.food.satfat_level !== "high") bad.push(`${id}: ${grams} g labelled "${item.food.satfat_level}"`);
        }
      }
    }
    expect(bad, report(bad)).toEqual([]);
  });

  // ── High triglycerides ────────────────────────────────────────────────────
  // Triglycerides respond to sugar, refined carbs, alcohol and omega-3 — not
  // the LDL levers "High Cholesterol" used — so the condition has its own
  // rules. Free sugar is the most direct lever: one date smoothie carries
  // 28 g against a 25 g daily limit.
  it("keeps triglyceride plans under 25 g free sugar and free of high-GI food, every day", () => {
    const bad: string[] = [];
    for (const body of BODIES) for (const cuisine of CUISINES) for (const protein_pref of DIETS)
      for (const goal_type of ["weight_loss", "maintenance", "healthy_aging"]) {
        const p = { ...base, ...body, cuisine, protein_pref, goal_type, conditions: ["HYPERTRIGLYCERIDEMIA"] };
        for (let d = 0; d < 3; d++) {
          const plan = generateMealPlan(p, d);
          const sugar = plan.nutrients.find((n) => n.key === "sugar_g")!;
          if (sugar.actual > 25) bad.push(`${cuisine}/${protein_pref}/${goal_type} d${d}: ${sugar.actual} g free sugar`);
          const hi = plan.meals.flatMap((m) => m.items).filter((i) => (i.food.glycemic_index ?? 0) >= 70);
          if (hi.length) bad.push(`${cuisine}/${protein_pref}/${goal_type} d${d}: high-GI ${hi.map((i) => i.food.name).join(", ")}`);
          const share = (plan.total_carbs_g * 4) / plan.total_calories;
          if (share > 0.44 && !plan.nutrient_actions.some((a) => a.nutrient === "Carbohydrate"))
            bad.push(`${cuisine}/${protein_pref}/${goal_type} d${d}: ${Math.round(share * 100)}% carbs, no warning`);
        }
      }
    expect(bad, report(bad)).toEqual([]);
  });

  it("answers triglyceride questions instead of falling through to the overview", async () => {
    const { answerHealthQuestion } = await import("../recommendation-engine");
    const withTG = answerHealthQuestion({ ...base, conditions: ["HYPERTRIGLYCERIDEMIA"] }, "how do I lower my triglycerides?");
    expect(withTG).toMatch(/alcohol/i);
    expect(withTG).toMatch(/omega-3/i);
    const without = answerHealthQuestion(base, "what are triglycerides?");
    expect(without).toMatch(/150 mg\/dL/);
  });

  // ── Omega-3 ───────────────────────────────────────────────────────────────
  // Selection never asked for an omega-3 source: flax, chia and walnuts won a
  // slot only when their score happened to beat a dish, so only about half
  // of days carried one and plant plans missed the target on 16-22% of days.
  // The bar is 95%, not the 90% first proposed: the carb work alone had
  // already lifted plant plans to ~90% (its swaps pull in nuts and seeds), so
  // a 90% bar could not tell whether the daily guarantee exists. With it: ~99%.
  it("meets the omega-3 target on plant-based plans at least 95% of the time", () => {
    let days = 0, met = 0;
    for (const body of BODIES) for (const cuisine of CUISINES) for (const protein_pref of ["vegetarian", "vegan"])
      for (const goal_type of GOALS) for (const conditions of CONDITIONS) {
        if (conditions.includes("CKD")) continue; // renal plans restrict nuts and seeds by design
        const p = { ...base, ...body, cuisine, protein_pref, goal_type, conditions };
        const plan = generateMealPlan(p, 0);
        const o3 = plan.nutrients.find((n) => n.key === "omega3_g")!;
        days++;
        if (o3.actual >= o3.target) met++;
      }
    expect(met / days, `omega-3 met on only ${Math.round((met / days) * 100)}% of plant-based days`).toBeGreaterThanOrEqual(0.95);
  });

  it("tells plant eaters that ALA is not EPA/DHA, even when the number is met", () => {
    // Like B12: a plant diet can hit the ALA target and still carry little of
    // the EPA/DHA the heart uses. Framed as a question for their doctor.
    const plan = generateMealPlan({ ...base, protein_pref: "vegan" }, 0);
    const note = plan.nutrient_actions.find((a) => a.nutrient === "Omega-3");
    expect(note?.detail).toMatch(/EPA and DHA/);
    expect(note?.detail).toMatch(/ask your doctor/i);
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
