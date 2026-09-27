import { describe, it, expect } from "vitest";
import { potassiumPlan, serumBand, KidneyStage } from "../kidney-potassium";
import { suggestFromLabs, toCanonical } from "../labs";

const ckd = (kidney_stage?: KidneyStage | "", serum_potassium?: number | null) =>
  potassiumPlan({ conditions: ["CKD"], gender: "male", kidney_stage, serum_potassium });

describe("potassium by kind of kidney disease", () => {
  it("does not restrict people without kidney disease", () => {
    const p = potassiumPlan({ conditions: ["HTN"], gender: "female" });
    expect(p.restricted).toBe(false);
    expect(p.target).toBe(2600);
  });

  it("does not restrict early CKD, peritoneal dialysis or transplant by default", () => {
    // KDOQI 2020 / KDIGO 2024: restriction follows a high blood result
    for (const stage of ["early", "peritoneal", "transplant"] as KidneyStage[]) {
      const p = ckd(stage);
      expect(p.restricted, stage).toBe(false);
      expect(p.limit, stage).toBeNull();
      expect(p.alert, stage).toBeNull();
    }
  });

  it("limits advanced CKD to 3000 mg (eGFR under 30)", () => {
    expect(ckd("advanced").limit).toBe(3000);
  });

  it("keeps haemodialysis at the cautious 2000 mg end until a normal blood result", () => {
    expect(ckd("hemodialysis").limit).toBe(2000);
    expect(ckd("hemodialysis", 4.6).limit).toBe(3000);
  });

  it("uses a moderate 3000 mg placeholder when the stage is unknown, and says so", () => {
    const p = ckd("");
    expect(p.limit).toBe(3000);
    expect(p.basis).toBe("stage_unknown");
    expect(p.why).toMatch(/add your kidney stage/);
  });

  it("a high blood result overrides every stage — including dialysis and transplant", () => {
    for (const stage of ["", "early", "advanced", "hemodialysis", "peritoneal", "transplant"] as const) {
      expect(ckd(stage, 5.7).limit, stage).toBe(2000);
      expect(ckd(stage, 6.3).alert?.headline, stage).toMatch(/today/);
    }
  });

  it("mild hyperkalaemia tightens to 2500 mg but never loosens a stricter stage limit", () => {
    expect(ckd("early", 5.2).limit).toBe(2500);
    expect(ckd("hemodialysis", 5.2).limit).toBe(2000);
  });

  it("never restricts potassium when blood potassium is LOW", () => {
    for (const stage of ["", "advanced", "hemodialysis", "peritoneal"] as const) {
      const p = ckd(stage, 3.1);
      expect(p.restricted, stage).toBe(false);
      expect(p.alert?.severity, stage).toBe("critical");
    }
    expect(ckd("peritoneal", 3.1).alert?.detail).toMatch(/peritoneal dialysis/);
  });

  it("bands blood potassium at the standard thresholds", () => {
    expect([3.4, 3.5, 5.0, 5.1, 5.5, 6.0].map(serumBand)).toEqual(
      ["low", "normal", "normal", "mildly_high", "high", "urgent"]);
  });
});

describe("blood potassium in lab results", () => {
  const today = new Date().toISOString().slice(0, 10);
  const lab = (value: number, date = today) => [{ id: "1", marker: "potassium" as const, value, date, fasting: null }];

  it("accepts mmol/L and mEq/L and refuses impossible values", () => {
    expect(toCanonical("potassium", 4.2)).toBe(4.2);
    expect(toCanonical("potassium", 4.2, "mEq/L")).toBe(4.2);
    expect(toCanonical("potassium", 42)).toBeNull();
  });

  it("tells the user to act on dangerous values, and never suggests a condition", () => {
    const urgent = suggestFromLabs(lab(6.4), ["CKD"]);
    expect(urgent[0].detail).toMatch(/today/);
    expect(urgent.every((s) => s.condition === null)).toBe(true);
    expect(suggestFromLabs(lab(3.0))[0].headline).toMatch(/3/);
    expect(suggestFromLabs(lab(4.4))).toEqual([]);
  });

  it("ignores an old result", () => {
    expect(suggestFromLabs(lab(6.4, "2020-01-01"))).toEqual([]);
  });
});

import { phosphatePlan, renalProtein } from "../kidney-potassium";
import { phosphorusFor } from "../nutrition-data";

describe("phosphorus by kidney stage and blood phosphate", () => {
  const ckd = (kidney_stage?: KidneyStage | "", serum_phosphate?: number | null) =>
    phosphatePlan({ conditions: ["CKD"], kidney_stage, serum_phosphate })!;

  it("has no phosphorus rule without kidney disease", () => {
    expect(phosphatePlan({ conditions: ["T2D"] })).toBeNull();
  });

  it("restricts only on dialysis or with a high blood result (KDIGO 2017)", () => {
    for (const stage of ["", "early", "advanced", "transplant"] as const) expect(ckd(stage).restricted, stage).toBe(false);
    expect(ckd("hemodialysis").limit).toBe(1000);
    expect(ckd("peritoneal").limit).toBe(1000);
  });

  it("a high blood phosphate tightens every stage to 800 mg; a low one lifts any limit", () => {
    for (const stage of ["", "early", "hemodialysis", "transplant"] as const) {
      expect(ckd(stage, 5.6).limit, stage).toBe(800);
      expect(ckd(stage, 5.6).alert?.severity, stage).toBe("critical");
      expect(ckd(stage, 2.1).restricted, stage).toBe(false);
    }
  });

  it("dialysis protein is never traded away for phosphorus", () => {
    expect(renalProtein({ conditions: ["CKD"], kidney_stage: "hemodialysis" })!.min_g_per_kg).toBe(1.0);
  });
});

describe("phosphorus estimates", () => {
  // USDA FoodData Central reference values for the same portions
  it("lands within 25% of reference values for staple foods", () => {
    const cases: [string, string, number, number][] = [
      ["masoor-dal", "legumes", 18, 360],   // 200 g cooked lentils
      ["chicken", "protein", 47, 340],      // 150 g cooked breast
      ["turmeric-milk", "dairy", 7, 190],   // ~200 ml milk
      ["roti", "grains", 8, 230],           // 2 whole-wheat rotis
      ["egg-boiled", "protein", 13, 200],   // 2 eggs
    ];
    for (const [id, group, protein, ref] of cases) {
      const mg = phosphorusFor(id, group, protein).mg;
      expect(Math.abs(mg - ref) / ref, `${id}: ${mg} vs ${ref}`).toBeLessThan(0.25);
    }
  });

  it("counts plant phosphorus as less absorbed than animal", () => {
    const dal = phosphorusFor("masoor-dal", "legumes", 18);
    const chicken = phosphorusFor("chicken", "protein", 47);
    expect(dal.absorbed / dal.mg).toBeLessThan(chicken.absorbed / chicken.mg);
  });

  it("flags a high or low blood phosphate in lab results, and never suggests a condition", () => {
    const today = new Date().toISOString().slice(0, 10);
    const lab = (value: number) => [{ id: "p", marker: "phosphate" as const, value, date: today, fasting: null }];
    expect(suggestFromLabs(lab(6.1), ["CKD"])[0].detail).toMatch(/800 mg/);
    expect(suggestFromLabs(lab(2.0))[0].headline).toMatch(/2/);
    expect(suggestFromLabs(lab(3.6))).toEqual([]);
    expect(suggestFromLabs(lab(6.1)).every((x) => x.condition === null)).toBe(true);
  });

  it("reads blood phosphate in mg/dL or mmol/L", () => {
    expect(toCanonical("phosphate", 1.45, "mmol/L")).toBeCloseTo(4.5, 1);
    expect(toCanonical("phosphate", 40)).toBeNull();
  });
});
