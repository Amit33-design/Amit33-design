import { describe, it, expect } from "vitest";
import {
  computeMacros,
  generateMealPlan,
  generateWeeklyPlan,
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

  it("keeps muscle-gain protein overshoot within 15% of target", () => {
    const plan = generateMealPlan({
      ...baseInput,
      age: 28, weight_kg: 92, height_cm: 185, activity_level: "active",
      goal_type: "muscle_gain", cuisine: "western", protein_pref: "non_vegetarian",
    });
    expect(plan.total_protein_g).toBeLessThanOrEqual(plan.macro_targets.protein_g * 1.15);
    expect(plan.fit.calories).toBeGreaterThanOrEqual(85);
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
