import { describe, it, expect } from "vitest";
import { toCanonical, deriveLabs, suggestFromLabs, latestByMarker, type LabResult } from "../labs";

const r = (marker: LabResult["marker"], value: number, date = "2026-09-01", fasting: boolean | null = true): LabResult =>
  ({ id: `${marker}-${date}-${value}`, marker, value, date, fasting });

describe("lab units", () => {
  it("converts mmol/L and mmol/mol to the canonical unit", () => {
    expect(toCanonical("tg", 1.7, "mmol/L")).toBeCloseTo(150.6, 0);      // the 150 mg/dL cutoff
    expect(toCanonical("ldl", 3.4, "mmol/L")).toBeCloseTo(131.5, 0);
    expect(toCanonical("fasting_glucose", 7.0, "mmol/L")).toBeCloseTo(126.1, 0);
    expect(toCanonical("a1c", 48, "mmol/mol")).toBeCloseTo(6.5, 1);      // diabetes threshold in IFCC
  });

  it("refuses values that are implausible in the chosen unit", () => {
    // 1.8 typed as mg/dL is almost certainly a mmol/L result — refuse it
    // rather than silently reading it as a normal triglyceride
    expect(toCanonical("tg", 1.8)).toBeNull();
    expect(toCanonical("a1c", 48)).toBeNull(); // 48 % is not an HbA1c
    expect(toCanonical("ldl", 0)).toBeNull();
  });
});

describe("derived values", () => {
  it("computes non-HDL and TG/HDL from the same draw", () => {
    const d = deriveLabs([r("total_chol", 220), r("hdl", 40), r("tg", 180)]);
    expect(d.non_hdl).toBe(180);
    expect(d.tg_hdl_ratio).toBe(4.5);
  });

  it("will not combine results from different blood draws", () => {
    const d = deriveLabs([r("total_chol", 220, "2026-09-01"), r("hdl", 40, "2025-06-01")]);
    expect(d.non_hdl).toBeNull();
  });

  it("uses the most recent result per marker", () => {
    const l = latestByMarker([r("ldl", 160, "2026-01-01"), r("ldl", 118, "2026-09-01")]);
    expect(l.ldl?.value).toBe(118);
  });
});

describe("condition suggestions", () => {
  const codes = (s: ReturnType<typeof suggestFromLabs>) => s.map((x) => x.condition);

  it("suggests High Triglycerides only from a FASTING result", () => {
    expect(codes(suggestFromLabs([r("tg", 180, "2026-09-01", true)]))).toContain("HYPERTRIGLYCERIDEMIA");
    const nonFasting = suggestFromLabs([r("tg", 220, "2026-09-01", false)]);
    expect(codes(nonFasting)).not.toContain("HYPERTRIGLYCERIDEMIA");
    expect(nonFasting[0].detail).toMatch(/fasting test/);
  });

  it("maps HbA1c to prediabetes, and the diabetes range to a doctor", () => {
    expect(codes(suggestFromLabs([r("a1c", 6.0)]))).toEqual(["PREDIABETES"]);
    const t2 = suggestFromLabs([r("a1c", 6.8)]);
    expect(codes(t2)).toEqual(["T2D"]);
    expect(t2[0].confirmWithDoctor).toBe(true);
    expect(t2[0].detail).toMatch(/doctor/);
  });

  it("flags LDL or non-HDL for High Cholesterol", () => {
    expect(codes(suggestFromLabs([r("ldl", 145)]))).toContain("HYPERLIPIDEMIA");
    expect(codes(suggestFromLabs([r("total_chol", 240), r("hdl", 45)]))).toContain("HYPERLIPIDEMIA"); // non-HDL 195
    expect(codes(suggestFromLabs([r("ldl", 95)]))).not.toContain("HYPERLIPIDEMIA");
  });

  it("never re-suggests a condition the user already has", () => {
    expect(codes(suggestFromLabs([r("tg", 250)], ["HYPERTRIGLYCERIDEMIA"]))).not.toContain("HYPERTRIGLYCERIDEMIA");
    expect(codes(suggestFromLabs([r("a1c", 6.0)], ["T2D"]))).not.toContain("PREDIABETES");
  });

  it("suggests nothing for healthy results", () => {
    expect(suggestFromLabs([r("tg", 110), r("ldl", 90), r("hdl", 55), r("a1c", 5.2)])).toEqual([]);
  });
});
