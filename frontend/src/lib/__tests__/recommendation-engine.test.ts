import { describe, it, expect } from "vitest";
import {
  computeMacros,
  generateMealPlan,
  generateWeeklyPlan,
  answerHealthQuestion,
  OnboardingInput,
} from "../recommendation-engine";

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
    const base = computeMacros(baseInput).calories;
    expect(computeMacros({ ...baseInput, calorie_adjustment: 999 }).calories).toBe(base + 150);
    expect(computeMacros({ ...baseInput, calorie_adjustment: -999 }).calories).toBe(base - 150);
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

  it("offers at least 5 swap alternatives for main meals", () => {
    const plan = generateMealPlan(baseInput);
    for (const meal of plan.meals) {
      if (["breakfast", "lunch", "dinner"].includes(meal.slot)) {
        expect(meal.alternatives.length).toBeGreaterThanOrEqual(5);
      }
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

  it("no dish is served more than 4 times in a week", () => {
    const week = generateWeeklyPlan(baseInput);
    const counts = new Map<string, number>();
    for (const d of week.days)
      for (const meal of d.plan.meals)
        for (const item of meal.items)
          counts.set(item.food.id, (counts.get(item.food.id) ?? 0) + 1);
    for (const [id, count] of counts) {
      expect(count, `${id} served ${count}× this week`).toBeLessThanOrEqual(4);
    }
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
