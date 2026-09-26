import { describe, it, expect } from "vitest";
import {
  standardDrinks, weeklyAlcohol, legacyUnitsToDrinks, assessAlcohol, DRINK_TYPES,
} from "../alcohol";

/**
 * The old form asked for "units" and said "1 unit = 1 small beer or glass of
 * wine" — wrong by 2-3x, and the number never reached the engine. These pin
 * the arithmetic and the thresholds that replace it.
 */
describe("alcohol conversion", () => {
  it("converts real servings to US standard drinks (14 g ethanol)", () => {
    expect(standardDrinks(473, 5)).toBeCloseTo(1.35, 1);  // US pint of 5% beer
    expect(standardDrinks(44, 40)).toBeCloseTo(1.0, 1);   // 44 ml shot of 40% spirit
    expect(standardDrinks(150, 12)).toBeCloseTo(1.0, 1);  // 150 ml glass of 12% wine
    expect(standardDrinks(650, 5)).toBeCloseTo(1.83, 1);  // Indian large beer bottle
  });

  it("shows why the old label undercounted", () => {
    // "1 unit = 1 small beer": a UK pint of 5% beer is really ~2.8 UK units
    const ukPintUnits = (568 * 0.05 * 0.789) / 8;
    expect(ukPintUnits).toBeGreaterThan(2.7);
    expect(ukPintUnits).toBeLessThan(2.9);
  });

  it("totals a week, counting beer's carbohydrate in the calories", () => {
    const w = weeklyAlcohol([{ type: "beer_can", count: 4 }, { type: "spirit_peg_large", count: 2 }]);
    expect(w.drinks).toBeCloseTo(4 * standardDrinks(355, 5) + 2 * standardDrinks(60, 40), 1);
    expect(w.carbs_g).toBe(4 * DRINK_TYPES.beer_can.carbs_g);
    expect(w.kcal).toBeGreaterThan(w.ethanol_g * 7);  // carbs add on top of ethanol
  });

  it("honours an ABV override for strong beer", () => {
    const normal = weeklyAlcohol([{ type: "beer_large", count: 1 }]).drinks;
    const strong = weeklyAlcohol([{ type: "beer_large", count: 1, abv: 8 }]).drinks;
    expect(strong).toBeGreaterThan(normal * 1.5);
  });

  it("migrates legacy UK units at 8 g each", () => {
    expect(legacyUnitsToDrinks(14)).toBeCloseTo(8.0, 1); // 14 x 8/14
    expect(legacyUnitsToDrinks(0)).toBe(0);
  });
});

describe("alcohol assessment", () => {
  it("flags 8 pints a week for someone with high triglycerides", () => {
    const drinks = weeklyAlcohol([{ type: "beer_pint", count: 8 }]).drinks;
    expect(drinks).toBeGreaterThan(10.5);
    expect(drinks).toBeLessThan(11);
    const a = assessAlcohol({ drinks_week: drinks, gender: "male", conditions: ["HYPERTRIGLYCERIDEMIA"] });
    expect(a.level).toBe("above");
    expect(a.limit_week).toBe(7);
    expect(a.detail).toMatch(/triglycerides/);
    expect(a.tips.join(" ")).toMatch(/alcohol-free days/);
  });

  it("uses the general limits without a sensitive condition", () => {
    expect(assessAlcohol({ drinks_week: 10, gender: "male" }).level).toBe("within");
    expect(assessAlcohol({ drinks_week: 10, gender: "female" }).level).toBe("above");
  });

  it("catches heavy drinking days even when the weekly total is fine", () => {
    const a = assessAlcohol({ drinks_week: 10, drinking_days: 2, gender: "male" });
    expect(a.level).toBe("above");
    expect(a.per_drinking_day).toBe(5);
  });

  it("warns about medication interactions only when the user drinks", () => {
    const drinking = assessAlcohol({ drinks_week: 3, medications: ["insulin_long", "blood_thinners"] });
    expect(drinking.medication_interactions.join(" ")).toMatch(/blood sugar/);
    expect(drinking.medication_interactions.join(" ")).toMatch(/blood thinners/);
    expect(assessAlcohol({ drinks_week: 0, medications: ["insulin_long"] }).medication_interactions).toEqual([]);
  });
});
