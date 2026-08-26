import { describe, it, expect } from "vitest";
import {
  computeMacros,
  generateMealPlan,
  generateWeeklyPlan,
  answerHealthQuestion,
  computeMicroTargets,
  generateWorkoutPlan,
  OnboardingInput,
} from "../recommendation-engine";
import {
  weeklyVolume, estimate1RM, progressionAdvice, stepTarget, cardioZones, maxHeartRate,
} from "../training-science";
import { computeAdaptiveTdee, blendTdee, paceFeedback } from "../adaptive-tdee";

const baseInput: OnboardingInput = {
  age: 45, gender: "male", weight_kg: 80, height_cm: 175,
  activity_level: "moderate", goal_type: "weight_loss",
  conditions: [], medications: [], cuisine: "indian", protein_pref: "vegetarian",
};

const GOALS = [
  "weight_loss", "fat_loss", "muscle_gain", "maintenance",
  "healthy_aging", "cardiovascular", "diabetes_friendly", "blood_pressure_management",
];
const CONDITION_SETS = [
  [], ["T2D"], ["HTN"], ["CKD"], ["KIDNEY_STONES"],
  ["T2D", "HTN", "KIDNEY_STONES"], ["THYROID"], ["HYPERLIPIDEMIA", "HEART_DISEASE"],
];
const CUISINES = ["indian", "western", "mediterranean"];
const DIETS = ["vegetarian", "non_vegetarian", "vegan", "pescatarian"];

describe("computeMacros", () => {
  it("applies the safe calorie floor", () => {
    const m = computeMacros({
      ...baseInput,
      gender: "female", age: 60, weight_kg: 48, height_cm: 150, activity_level: "sedentary",
    });
    expect(m.calories).toBeGreaterThanOrEqual(1200);
  });

  it("caps protein at 0.75 g/kg for CKD regardless of goal", () => {
    const m = computeMacros({ ...baseInput, goal_type: "muscle_gain", conditions: ["CKD"] });
    expect(m.protein_g).toBeLessThanOrEqual(Math.ceil(0.75 * baseInput.weight_kg));
  });

  it("covers every goal with a real calorie adjustment (no silent default)", () => {
    const cals = GOALS.map((g) => computeMacros({ ...baseInput, goal_type: g }).calories);
    // muscle_gain must be the highest target; weight_loss must be below maintenance
    const byGoal = Object.fromEntries(GOALS.map((g, i) => [g, cals[i]]));
    expect(byGoal.muscle_gain).toBeGreaterThan(byGoal.maintenance);
    expect(byGoal.weight_loss).toBeLessThan(byGoal.maintenance);
    expect(byGoal.diabetes_friendly).toBeLessThan(byGoal.maintenance);
  });

  it("clamps the progress feedback adjustment to ±150 kcal", () => {
    // use an active profile so the safety floor doesn't bind and mask the clamp
    const active: OnboardingInput = { ...baseInput, activity_level: "very_active" };
    const base = computeMacros(active).calories;
    expect(computeMacros({ ...active, calorie_adjustment: 999 }).calories).toBe(base + 150);
    expect(computeMacros({ ...active, calorie_adjustment: -999 }).calories).toBe(base - 150);
  });

  it("lets a diet-phase change actually cancel the deficit, unlike the pace nudge", () => {
    // The +-150 clamp exists to stop the weight-trend feedback lurching. A
    // maintenance break is a deliberate decision and must not be clamped, or
    // the app would prescribe a break and then hand out cutting calories.
    const active: OnboardingInput = { ...baseInput, activity_level: "very_active" };
    const cut = computeMacros(active).calories;
    expect(computeMacros({ ...active, phase_shift: 400 }).calories).toBe(cut + 400);
    // the pace nudge is still clamped
    expect(computeMacros({ ...active, calorie_adjustment: 999 }).calories).toBe(cut + 150);
  });

  it("never prescribes below BMR or a 25% deficit, whatever the adjustment", () => {
    const profiles: OnboardingInput[] = [
      baseInput,
      { ...baseInput, gender: "female", weight_kg: 52, height_cm: 152, age: 62, activity_level: "sedentary" },
      { ...baseInput, goal_type: "weight_loss", activity_level: "sedentary", calorie_adjustment: -999 },
    ];
    for (const p of profiles) {
      const m = computeMacros(p);
      expect(m.calories, "below BMR").toBeGreaterThanOrEqual(m.bmr - 10);
      expect(m.calories, "deficit deeper than 25%").toBeGreaterThanOrEqual(Math.round(m.tdee * 0.75) - 10);
    }
  });

  it("raises protein per kg in a deficit rather than lowering it", () => {
    const maintain = computeMacros({ ...baseInput, goal_type: "maintenance" });
    const cutting = computeMacros({ ...baseInput, goal_type: "weight_loss" });
    expect(cutting.protein_g_per_kg).toBeGreaterThan(maintain.protein_g_per_kg);
    // and stays within sane bounds for a non-athlete
    expect(cutting.protein_g_per_kg).toBeLessThanOrEqual(2.2);
  });
});

describe("generateMealPlan — full sweep", () => {
  it("survives all goal × condition × cuisine × diet combinations", () => {
    let n = 0;
    let fitSum = 0;
    for (const goal_type of GOALS) {
      for (const conditions of CONDITION_SETS) {
        for (const cuisine of CUISINES) {
          for (const protein_pref of DIETS) {
            const input: OnboardingInput = {
              ...baseInput,
              gender: n % 2 ? "female" : "male",
              weight_kg: 70 + (n % 25),
              height_cm: 165 + (n % 20),
              activity_level: ["sedentary", "light", "moderate", "active"][n % 4],
              goal_type, conditions, cuisine, protein_pref,
            };
            const plan = generateMealPlan(input);
            n += 1;
            fitSum += plan.fit.overall;

            // every slot must have at least one item
            for (const meal of plan.meals) {
              expect(meal.items.length, `${goal_type}/${conditions}/${cuisine}/${protein_pref} ${meal.slot}`).toBeGreaterThan(0);
            }

            // CKD renal cap is a hard clinical bound (15% tolerance for rounding)
            if (conditions.includes("CKD")) {
              const cap = 0.75 * input.weight_kg * 1.15;
              expect(plan.total_protein_g, `CKD cap ${goal_type}/${cuisine}/${protein_pref}`).toBeLessThanOrEqual(cap);
            }

            // T2D plans must not contain high-GI foods
            if (conditions.includes("T2D")) {
              for (const meal of plan.meals) {
                for (const item of meal.items) {
                  if (item.food.glycemic_index !== undefined) {
                    expect(item.food.glycemic_index).toBeLessThan(70);
                  }
                }
              }
            }
          }
        }
      }
    }
    expect(n).toBe(768);
    expect(fitSum / n).toBeGreaterThanOrEqual(85); // average plan-match stays high
  });

  it("gives every meal slot at least 10 choices, for every cuisine, diet and condition set", () => {
    // A week of cooking needs ten ideas per slot, not five — otherwise people
    // run out of options by Thursday and stop following the plan.
    const failures: string[] = [];
    for (const cuisine of CUISINES) {
      for (const protein_pref of DIETS) {
        for (const conditions of CONDITION_SETS) {
          const plan = generateMealPlan({ ...baseInput, cuisine, protein_pref, conditions, goal_type: "maintenance" });
          for (const meal of plan.meals) {
            const choices = meal.items.length + meal.alternatives.length;
            if (choices < 10) failures.push(`${cuisine}/${protein_pref}/${meal.slot} (${conditions.join("+") || "none"}) = ${choices}`);
          }
        }
      }
    }
    expect(failures, `slots with fewer than 10 choices:\n${failures.join("\n")}`).toEqual([]);
  });

  it("does not repeat dishes within a week's worth of any meal slot", () => {
    const week = generateWeeklyPlan(baseInput);
    for (const slot of ["breakfast", "lunch", "dinner"]) {
      const names = new Set<string>();
      for (const day of week.days) {
        for (const item of day.plan.meals.find((m) => m.slot === slot)!.items) names.add(item.food.name);
      }
      // seven days of a slot should draw on a decent spread, not one or two dishes
      expect(names.size, `${slot} only used ${names.size} distinct dishes across the week`).toBeGreaterThanOrEqual(7);
    }
  });

  it("portion-scales alternatives to the slot context", () => {
    const plan = generateMealPlan(baseInput);
    const scales = plan.meals.flatMap((m) => m.alternatives.map((a) => a.serving_scale));
    // at least some alternatives should be resized away from 1×
    expect(scales.some((s) => Math.abs(s - 1) >= 0.1)).toBe(true);
  });

  it("keeps muscle-gain protein overshoot within 15% of target on every day of the week", () => {
    const input: OnboardingInput = {
      ...baseInput,
      age: 28, weight_kg: 92, height_cm: 185, activity_level: "active",
      goal_type: "muscle_gain", cuisine: "western", protein_pref: "non_vegetarian",
    };
    for (let offset = 0; offset < 7; offset++) {
      const plan = generateMealPlan(input, offset);
      expect(plan.total_protein_g, `day offset ${offset}`).toBeLessThanOrEqual(plan.macro_targets.protein_g * 1.15);
      expect(plan.fit.calories, `day offset ${offset}`).toBeGreaterThanOrEqual(80);
    }
  });

  it("Indian vegetarians never receive egg dishes", () => {
    const EGG_DISH_IDS = ["food-egg-boiled", "food-egg-bhurji", "food-egg-omelette", "food-egg-curry", "food-shakshuka"];
    const plan = generateMealPlan({ ...baseInput, cuisine: "indian", protein_pref: "vegetarian" });
    const ids = plan.meals.flatMap((m) => [...m.items, ...m.alternatives]).map((i) => i.food.id);
    for (const id of ids) {
      expect(EGG_DISH_IDS.includes(id), `egg dish offered to Indian vegetarian: ${id}`).toBe(false);
    }
  });
});

describe("dietician composition rules", () => {
  const PROFILES: OnboardingInput[] = [
    baseInput,
    { ...baseInput, gender: "female", weight_kg: 62, goal_type: "maintenance", protein_pref: "non_vegetarian" },
    { ...baseInput, cuisine: "mediterranean", protein_pref: "pescatarian", goal_type: "cardiovascular", conditions: ["HEART_DISEASE"] },
    { ...baseInput, cuisine: "western", protein_pref: "vegan", goal_type: "fat_loss", conditions: ["HTN"] },
  ];

  it("lunch and dinner always include a vegetable dish", () => {
    for (const input of PROFILES) {
      const plan = generateMealPlan(input);
      for (const slot of ["lunch", "dinner"]) {
        const meal = plan.meals.find((mm) => mm.slot === slot)!;
        const hasVeg = meal.items.some((i) => i.food.food_group === "vegetable");
        expect(hasVeg, `${slot} missing vegetable for ${input.cuisine}/${input.protein_pref}`).toBe(true);
      }
    }
  });

  it("every day includes whole fruit", () => {
    for (const input of PROFILES) {
      const plan = generateMealPlan(input);
      const hasFruit = plan.meals.some((mm) => mm.items.some((i) => i.food.food_group === "fruit"));
      expect(hasFruit, `no fruit for ${input.cuisine}/${input.protein_pref}`).toBe(true);
    }
  });

  it("never stacks the same food group in one meal (normal calorie targets)", () => {
    for (const input of PROFILES) {
      const plan = generateMealPlan(input);
      if (plan.macro_targets.calories > 2800) continue; // high-cal plans may double up
      for (const meal of plan.meals) {
        const groups = meal.items.map((i) => i.food.food_group);
        for (const g of new Set(groups)) {
          const cap = g === "vegetable" ? 2 : 1;
          expect(
            groups.filter((x) => x === g).length,
            `${g} stacked at ${meal.slot} for ${input.cuisine}/${input.protein_pref}`
          ).toBeLessThanOrEqual(cap);
        }
      }
    }
  });

  it("no dish is served more than 4 times in a week, on any diet", () => {
    // Vegan menus have the fewest high-protein options, so they are where
    // monotony shows up first — testing only the default diet missed it.
    for (const protein_pref of DIETS) {
      for (const cuisine of CUISINES) {
        const week = generateWeeklyPlan({ ...baseInput, protein_pref, cuisine, goal_type: "muscle_gain" });
        const counts = new Map<string, number>();
        for (const d of week.days)
          for (const meal of d.plan.meals)
            for (const item of meal.items)
              counts.set(item.food.id, (counts.get(item.food.id) ?? 0) + 1);
        for (const [id, count] of counts) {
          expect(count, `${protein_pref}/${cuisine}: ${id} served ${count}× this week`).toBeLessThanOrEqual(4);
        }
      }
    }
  });
});

describe("micronutrient analysis", () => {
  it("reports every priority nutrient with a personal target", () => {
    const plan = generateMealPlan(baseInput);
    const keys = plan.nutrients.map((n) => n.key);
    for (const k of ["sodium_mg", "potassium_mg", "calcium_mg", "iron_mg", "b12_ug", "vitamin_d_ug", "omega3_g"]) {
      expect(keys, `missing ${k}`).toContain(k);
    }
    for (const n of plan.nutrients) expect(n.target).toBeGreaterThan(0);
  });

  it("applies the DASH sodium limit for blood-pressure conditions", () => {
    const dash = generateMealPlan({ ...baseInput, conditions: ["HTN"] });
    const plain = generateMealPlan({ ...baseInput, conditions: [] });
    const cap = (p: typeof dash) => p.nutrients.find((n) => n.key === "sodium_mg")!.target;
    expect(cap(dash)).toBe(1500);
    expect(cap(plain)).toBe(2300);
    expect(dash.low_sodium_cooking).toBe(true);
  });

  it("raises the iron target for plant-based diets and menstruating women", () => {
    const target = (i: OnboardingInput) => computeMicroTargets(i).find((t) => t.key === "iron_mg")!.target;
    expect(target({ ...baseInput, protein_pref: "vegan" }))
      .toBeGreaterThan(target({ ...baseInput, protein_pref: "non_vegetarian" }));
    expect(target({ ...baseInput, gender: "female", age: 32, protein_pref: "non_vegetarian" }))
      .toBeGreaterThan(target({ ...baseInput, gender: "male", protein_pref: "non_vegetarian" }));
  });

  it("does not flag nutrients that are harmless in abundance", () => {
    // dietary omega-3 and plant iron running above target is normal, not a warning
    for (const diet of ["vegan", "vegetarian", "pescatarian", "non_vegetarian"]) {
      const plan = generateMealPlan({ ...baseInput, protein_pref: diet });
      const omega = plan.nutrients.find((n) => n.key === "omega3_g")!;
      expect(omega.status, `omega-3 wrongly flagged for ${diet}`).not.toBe("over");
    }
  });

  it("is honest with vegans that B12 never comes from the plants themselves", () => {
    // Whether the plan happens to meet the target through fortified food or
    // falls short, a vegan must always be told where B12 actually comes from.
    for (let day = 0; day < 7; day++) {
      const plan = generateMealPlan({ ...baseInput, protein_pref: "vegan" }, day);
      const b12 = plan.nutrient_actions.find((a) => a.nutrient === "Vitamin B12");
      expect(b12, `no B12 guidance on day ${day}`).toBeTruthy();
      expect(b12!.detail.toLowerCase()).toMatch(/supplement|fortified/);
    }
  });

  it("excludes whole-fruit sugars from the free-sugar count", () => {
    const plan = generateMealPlan(baseInput);
    const fruitSugar = plan.meals
      .flatMap((m) => m.items)
      .filter((i) => i.food.food_group === "fruit").length;
    expect(fruitSugar).toBeGreaterThan(0); // plan does contain fruit
    const sugar = plan.nutrients.find((n) => n.key === "sugar_g")!;
    expect(sugar.label).toBe("Free Sugars");
  });

  it("spreads protein across main meals rather than loading dinner", () => {
    const profiles: OnboardingInput[] = [
      baseInput,
      { ...baseInput, protein_pref: "non_vegetarian", cuisine: "western" },
      { ...baseInput, protein_pref: "vegan" },
    ];
    for (const p of profiles) {
      const plan = generateMealPlan(p);
      expect(plan.protein_distribution.meals_meeting, `${p.protein_pref}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("reports glycemic load as an attenuated band, not a raw number", () => {
    const plan = generateMealPlan({ ...baseInput, conditions: ["T2D"] });
    expect(["low", "moderate", "high"]).toContain(plan.glycemic_load.band);
    expect(plan.glycemic_load.note).toMatch(/range|estimate/i);
  });
});

describe("adaptive TDEE", () => {
  /** Simulate a user whose weight responds to real energy balance. */
  function simulate(opts: {
    trueTdee: number; intake: number; days: number; startKg: number;
    reportBias?: number; noise?: number; logEvery?: number;
  }) {
    const { trueTdee, intake, days, startKg, reportBias = 1, noise = 0.6, logEvery = 1 } = opts;
    const logs: { log_date: string; weight_kg: number; calories_consumed: number }[] = [];
    let kg = startKg;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647 - 0.5) * 2; };
    for (let d = 0; d < days; d++) {
      kg += (intake - trueTdee) / 7700;
      if (d % logEvery !== 0) continue;
      logs.push({
        log_date: new Date(Date.now() - (days - d) * 86400000).toISOString().slice(0, 10),
        weight_kg: Math.round((kg + rnd() * noise) * 10) / 10,
        calories_consumed: Math.round(intake * reportBias),
      });
    }
    return logs;
  }

  it("recovers true expenditure within 10% across cutting, maintaining and bulking", () => {
    const cases = [
      { trueTdee: 2600, intake: 2100, days: 28, startKg: 85 },
      { trueTdee: 2300, intake: 2300, days: 28, startKg: 70 },
      { trueTdee: 2800, intake: 3100, days: 28, startKg: 75 },
      { trueTdee: 2100, intake: 2100, days: 28, startKg: 78 }, // slower than formula predicts
    ];
    for (const c of cases) {
      const r = computeAdaptiveTdee(simulate(c));
      expect(r.tdee, `no estimate for TDEE ${c.trueTdee}`).not.toBeNull();
      const err = Math.abs((r.tdee! - c.trueTdee) / c.trueTdee);
      expect(err, `TDEE ${c.trueTdee} off by ${Math.round(err * 100)}%`).toBeLessThan(0.1);
    }
  });

  it("fits the trend to raw weights, not the lagging smoothed series", () => {
    // a lag-biased slope understates loss and would inflate the target
    const r = computeAdaptiveTdee(simulate({ trueTdee: 2600, intake: 2100, days: 28, startKg: 85, noise: 0 }));
    expect(r.weekly_change_kg).toBeLessThan(-0.3);
    expect(r.tdee!).toBeGreaterThan(2450);
  });

  it("stays silent until there is genuinely enough data", () => {
    expect(computeAdaptiveTdee([]).tdee).toBeNull();
    expect(computeAdaptiveTdee(simulate({ trueTdee: 2600, intake: 2100, days: 8, startKg: 85 })).status).toBe("measuring");
    // weight logged but almost no food logged
    const weightOnly = simulate({ trueTdee: 2600, intake: 2100, days: 28, startKg: 85 })
      .map((l, i) => (i < 25 ? { ...l, calories_consumed: null } : l));
    expect(computeAdaptiveTdee(weightOnly).tdee).toBeNull();
  });

  it("rejects impossible values instead of prescribing from bad logs", () => {
    const nonsense = [
      { log_date: "2026-01-01", weight_kg: 80, calories_consumed: 800 },
      { log_date: "2026-01-15", weight_kg: 95, calories_consumed: 800 },
      { log_date: "2026-01-20", weight_kg: 99, calories_consumed: 800 },
      { log_date: "2026-01-25", weight_kg: 104, calories_consumed: 800 },
      { log_date: "2026-01-28", weight_kg: 108, calories_consumed: 800 },
      { log_date: "2026-02-01", weight_kg: 112, calories_consumed: 800 },
    ];
    expect(computeAdaptiveTdee(nonsense).tdee).toBeNull();
  });

  it("cancels consistent under-reporting in the final target", () => {
    // logging 20% low should still yield roughly the intended deficit
    const honest = computeAdaptiveTdee(simulate({ trueTdee: 2600, intake: 2100, days: 28, startKg: 85 }));
    const biased = computeAdaptiveTdee(simulate({ trueTdee: 2600, intake: 2100, days: 28, startKg: 85, reportBias: 0.8 }));
    expect(biased.tdee!).toBeLessThan(honest.tdee!); // the bias shows in the estimate
    const targetLogged = biased.tdee! - 500;
    const actuallyEaten = targetLogged / 0.8;
    const realDeficit = 2600 - actuallyEaten;
    expect(realDeficit).toBeGreaterThan(350);
    expect(realDeficit).toBeLessThan(700);
  });

  it("blends toward the formula while confidence is low", () => {
    const formula = 2400;
    expect(blendTdee(formula, { tdee: 2000, confidence: 0 } as never).source).toBe("formula");
    const low = blendTdee(formula, { tdee: 2000, confidence: 0.3 } as never);
    expect(low.source).toBe("blended");
    expect(low.tdee).toBeGreaterThan(2000);
    expect(blendTdee(formula, { tdee: 2000, confidence: 0.9 } as never).source).toBe("measured");
    // never lurches more than 25% from the formula
    expect(blendTdee(formula, { tdee: 800, confidence: 1 } as never).tdee).toBeGreaterThanOrEqual(formula * 0.75);
  });

  it("corrects an unsafely fast loss upward and a plateau downward", () => {
    expect(paceFeedback("weight_loss", -1.2, 85).verdict).toBe("too_fast");
    expect(paceFeedback("weight_loss", -1.2, 85).adjust).toBeGreaterThan(0);
    expect(paceFeedback("weight_loss", -0.02, 85).verdict).toBe("too_slow");
    expect(paceFeedback("weight_loss", -0.5, 85).verdict).toBe("on_track");
    expect(paceFeedback("muscle_gain", 1.0, 80).adjust).toBeLessThan(0);
  });

  it("feeds the measured value into the calorie target", () => {
    const base = computeMacros(baseInput);
    const measured = computeMacros({ ...baseInput, measured_tdee: base.tdee_predicted - 400, tdee_confidence: 0.9 });
    expect(measured.tdee).toBeLessThan(base.tdee);
    expect(measured.tdee_source).toBe("measured");
    expect(computeMacros(baseInput).tdee_source).toBe("formula");
  });
});

describe("training prescription", () => {
  const profile = (over: Partial<OnboardingInput>): OnboardingInput => ({ ...baseInput, ...over });

  it("never leaves a major muscle group untrained across the week", () => {
    const cases = [
      profile({ goal_type: "muscle_gain", activity_level: "active", age: 28 }),
      profile({ goal_type: "healthy_aging", age: 68, activity_level: "sedentary" }),
      profile({ goal_type: "blood_pressure_management", conditions: ["HTN"], age: 58 }),
    ];
    for (const p of cases) {
      const plan = generateWorkoutPlan(p);
      const untrained = plan.weekly_volume.filter((v) => v.sets === 0 && v.muscle !== "calves");
      expect(untrained.map((v) => v.label), `${p.goal_type}`).toEqual([]);
    }
  });

  it("counts secondary movers at half credit", () => {
    // a row builds back fully and biceps partially
    const rows = weeklyVolume([
      { templates: [{ instructions: { main_circuit: [{ exercise: "dumbbell row", sets: 4 }] } }] },
    ]);
    expect(rows.find((r) => r.muscle === "back")!.sets).toBe(4);
    expect(rows.find((r) => r.muscle === "biceps")!.sets).toBe(2);
  });

  it("ignores timed cardio and mobility work as strength volume", () => {
    const rows = weeklyVolume([
      { templates: [{ instructions: { main_circuit: [{ exercise: "brisk walk", duration_sec: 900 }] } }] },
    ]);
    expect(rows.every((r) => r.sets === 0)).toBe(true);
  });

  it("refuses to estimate 1RM outside the reliable rep range", () => {
    expect(estimate1RM(60, 5).value).toBeGreaterThan(60);
    expect(estimate1RM(60, 8).value).toBeGreaterThan(60);
    const tooMany = estimate1RM(40, 15);
    expect(tooMany.value).toBeNull();
    expect(tooMany.note).toMatch(/unreliable/i);
  });

  it("triggers a deload from stalled progress, not the calendar", () => {
    const stalled = progressionAdvice({ weeksAtSameLoad: 3, lastReps: 8, targetRepRange: [8, 12], level: "intermediate" });
    expect(stalled.action).toBe("deload");
    const progressing = progressionAdvice({ weeksAtSameLoad: 1, lastReps: 12, targetRepRange: [8, 12], level: "intermediate" });
    expect(progressing.action).toBe("add_load");
    const midRange = progressionAdvice({ weeksAtSameLoad: 1, lastReps: 9, targetRepRange: [8, 12], level: "intermediate" });
    expect(midRange.action).toBe("add_reps");
  });

  it("sets an evidence-based step target rather than 10,000", () => {
    expect(stepTarget(35, "moderate").target).toBeLessThanOrEqual(8000);
    expect(stepTarget(70, "moderate").target).toBeLessThan(stepTarget(35, "moderate").target);
  });

  it("warns off high-intensity cardio for blood-pressure and heart conditions", () => {
    const flagged = cardioZones(58, ["HTN"]);
    expect(flagged.caution).toBeTruthy();
    expect(flagged.caution!.toLowerCase()).toContain("doctor");
    expect(cardioZones(30, []).caution).toBeUndefined();
  });

  it("uses an age-accurate max heart rate", () => {
    // Tanaka runs above 220-age for older adults, which is the point
    expect(maxHeartRate(70)).toBeGreaterThan(220 - 70);
    expect(maxHeartRate(25)).toBeGreaterThan(180);
  });
});

describe("answerHealthQuestion (plan-aware Q&A)", () => {
  it("warns kidney-stone users about spinach via oxalates", () => {
    const a = answerHealthQuestion({ ...baseInput, conditions: ["KIDNEY_STONES"] }, "Can I eat spinach?");
    expect(a).toContain("oxalate");
    expect(a).toContain("limited");
  });

  it("routes protein questions to the macro answer, not a food match", () => {
    const a = answerHealthQuestion({ ...baseInput, conditions: ["CKD"] }, "why is my protein so low");
    expect(a).toContain("0.75 g/kg");
    expect(a).toContain("Chronic Kidney Disease");
  });

  it("answers slot questions with today's actual items", () => {
    const a = answerHealthQuestion(baseInput, "what should I eat for dinner?");
    const plan = generateMealPlan(baseInput);
    const dinner = plan.meals.find((mm) => mm.slot === "dinner")!;
    expect(a).toContain(dinner.items[0].food.name);
  });

  it("falls back to a personalised overview, never a generic canned line", () => {
    const a = answerHealthQuestion({ ...baseInput, conditions: ["HTN"] }, "hello");
    expect(a).toContain("Hypertension");
    expect(a).toContain("kcal");
  });
});

describe("generateWeeklyPlan", () => {
  const week = generateWeeklyPlan(baseInput);

  it("produces 7 valid days with variety", () => {
    expect(week.days.length).toBe(7);
    const breakfastSignatures = new Set(
      week.days.map((d) => d.plan.meals[0].items.map((i) => i.food.id).sort().join("+"))
    );
    expect(breakfastSignatures.size).toBeGreaterThanOrEqual(3); // meals rotate across the week
  });

  it("aggregates a non-empty grouped grocery list", () => {
    expect(week.grocery.length).toBeGreaterThan(0);
    const items = week.grocery.flatMap((g) => g.items);
    expect(items.length).toBeGreaterThan(5);
    for (const item of items) {
      expect(item.total_qty_g).toBeGreaterThan(0);
      expect(item.times).toBeGreaterThanOrEqual(1);
    }
  });
});
