import { describe, it, expect } from "vitest";
import { analyseMealProtein, analyseDayProtein, proteinQuality } from "../protein-quality";
import { generateMealPlan, OnboardingInput } from "../recommendation-engine";

const item = (id: string, group: string, protein_g: number) => ({
  food: { id: `food-${id}`, food_group: group }, protein_g,
});

const base: OnboardingInput = {
  age: 35, gender: "male", weight_kg: 75, height_cm: 175,
  activity_level: "moderate", goal_type: "muscle_gain",
  conditions: [], medications: [], cuisine: "indian", protein_pref: "vegetarian",
};

describe("protein quality", () => {
  it("scores animal and soy protein above other plant sources", () => {
    expect(proteinQuality("paneer", "dairy").diaas).toBeGreaterThan(1);
    expect(proteinQuality("soya-chunks", "protein").diaas).toBeGreaterThanOrEqual(0.9);
    expect(proteinQuality("masoor-dal", "legumes").diaas).toBeLessThan(0.75);
    expect(proteinQuality("roti", "grains").diaas).toBeLessThan(0.6);
  });

  it("counts dal protein as less usable than paneer protein", () => {
    const dal = analyseMealProtein("lunch", [item("masoor-dal", "legumes", 30)]);
    const paneer = analyseMealProtein("lunch", [item("paneer", "dairy", 30)]);
    expect(dal.protein_g).toBe(paneer.protein_g);
    expect(dal.usable_protein_g).toBeLessThan(paneer.usable_protein_g);
  });

  it("credits grain-and-pulse pairing for covering each other's weak amino acid", () => {
    const dalOnly = analyseMealProtein("lunch", [item("masoor-dal", "legumes", 20)]);
    const riceOnly = analyseMealProtein("lunch", [item("brown-rice", "grains", 20)]);
    const together = analyseMealProtein("lunch", [
      item("masoor-dal", "legumes", 20), item("brown-rice", "grains", 20),
    ]);
    expect(together.complementary).toBe(true);
    // the blend beats the average of the two eaten separately
    const separateScore = (dalOnly.quality_score + riceOnly.quality_score) / 2;
    expect(together.quality_score).toBeGreaterThan(separateScore);
  });

  it("does not claim complementarity from a token amount", () => {
    const meal = analyseMealProtein("lunch", [
      item("brown-rice", "grains", 20), item("masoor-dal", "legumes", 1),
    ]);
    expect(meal.complementary).toBe(false);
  });

  it("never reports more usable protein than was eaten", () => {
    const meal = analyseMealProtein("lunch", [
      item("paneer", "dairy", 40), item("brown-rice", "grains", 20), item("masoor-dal", "legumes", 20),
    ]);
    expect(meal.usable_protein_g).toBeLessThanOrEqual(meal.protein_g);
  });

  it("flags a meal below the leucine threshold that triggers muscle repair", () => {
    const small = analyseMealProtein("breakfast", [item("brown-rice", "grains", 10)]);
    expect(small.triggers_synthesis).toBe(false);
    const solid = analyseMealProtein("breakfast", [item("paneer", "dairy", 35)]);
    expect(solid.triggers_synthesis).toBe(true);
  });

  it("gives plant-based eaters the complementarity explanation, not just a low score", () => {
    const poor = analyseDayProtein(
      [{ slot: "lunch", items: [item("brown-rice", "grains", 25)] }],
      "vegan"
    );
    expect(poor.quality_score).toBeLessThan(75);
    expect(poor.advice).toBeTruthy();
    expect(poor.advice!.toLowerCase()).toMatch(/lysine|methionine|dal|pair/);
  });

  it("real generated plans deliver usable protein and trigger repair at main meals", () => {
    for (const protein_pref of ["vegetarian", "vegan", "pescatarian", "non_vegetarian"]) {
      for (let day = 0; day < 7; day++) {
        const plan = generateMealPlan({ ...base, protein_pref, cuisine: protein_pref === "non_vegetarian" ? "western" : "indian" }, day);
        const q = plan.protein_quality;
        expect(q.usable_protein_g, `${protein_pref} d${day}`).toBeLessThanOrEqual(q.total_protein_g);
        expect(q.quality_score, `${protein_pref} d${day} usable share too low`).toBeGreaterThanOrEqual(70);
        expect(q.meals_triggering, `${protein_pref} d${day} too few meals trigger repair`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
