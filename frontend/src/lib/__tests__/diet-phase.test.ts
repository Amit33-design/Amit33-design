import { describe, it, expect } from "vitest";
import { assessPhase, phaseForGoal, phaseCalorieShift, DietPhase } from "../diet-phase";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const state = (phase: DietPhase, weeksAgo: number) => ({ phase, started: daysAgo(weeksAgo * 7) });

const cutting = (over: Partial<Parameters<typeof assessPhase>[0]> = {}) =>
  assessPhase({
    state: state("cut", 4), goal: "weight_loss",
    measuredTdee: 2500, formulaTdee: 2600, tdeeConfidence: 0.9, weeklyChangeKg: -0.5,
    ...over,
  });

describe("diet phases", () => {
  it("maps goals onto a starting phase", () => {
    expect(phaseForGoal("weight_loss")).toBe("cut");
    expect(phaseForGoal("muscle_gain")).toBe("bulk");
    expect(phaseForGoal("maintenance")).toBe("maintenance");
  });

  it("leaves a healthy cut alone", () => {
    const a = cutting();
    expect(a.recommend).toBeNull();
    expect(a.severity).toBe("ok");
    expect(a.adaptation_detected).toBe(false);
  });

  it("detects metabolic adaptation from measured expenditure and urges a break", () => {
    const a = cutting({ state: state("cut", 9), measuredTdee: 2250, formulaTdee: 2600 });
    expect(a.adaptation_detected).toBe(true);
    expect(a.recommend).toBe("maintenance");
    expect(a.severity).toBe("urge");
    expect(a.detail).toMatch(/maintenance|break/i);
  });

  it("does not cry adaptation on thin data", () => {
    // low confidence in the measurement means no ratio and no claim
    const a = cutting({ state: state("cut", 9), measuredTdee: 2250, tdeeConfidence: 0.2 });
    expect(a.adaptation_ratio).toBeNull();
    expect(a.adaptation_detected).toBe(false);
  });

  it("does not call it adaptation two weeks into a cut", () => {
    const a = cutting({ state: state("cut", 2), measuredTdee: 2200, formulaTdee: 2600 });
    expect(a.adaptation_detected).toBe(false);
  });

  it("urges a break after a very long cut even without an adaptation signal", () => {
    const a = cutting({ state: state("cut", 13), measuredTdee: null, tdeeConfidence: 0 });
    expect(a.recommend).toBe("maintenance");
    expect(a.severity).toBe("urge");
  });

  it("suggests planning a break before it becomes urgent", () => {
    const a = cutting({ state: state("cut", 9), measuredTdee: 2550, formulaTdee: 2600 });
    expect(a.severity).toBe("suggest");
    expect(a.recommend).toBe("maintenance");
  });

  it("returns a dieter to cutting after a two-week break", () => {
    const a = assessPhase({
      state: state("maintenance", 2), goal: "weight_loss",
      measuredTdee: 2500, formulaTdee: 2600, tdeeConfidence: 0.9, weeklyChangeKg: 0,
    });
    expect(a.recommend).toBe("cut");
  });

  it("holds a maintenance break for its full two weeks", () => {
    const a = assessPhase({
      state: state("maintenance", 1), goal: "weight_loss",
      measuredTdee: 2500, formulaTdee: 2600, tdeeConfidence: 0.9, weeklyChangeKg: 0,
    });
    expect(a.recommend).toBeNull();
    expect(a.headline).toMatch(/week/i);
  });

  it("flags gaining too fast during a bulk", () => {
    const a = assessPhase({
      state: state("bulk", 3), goal: "muscle_gain",
      measuredTdee: 3000, formulaTdee: 3000, tdeeConfidence: 0.9, weeklyChangeKg: 0.9,
    });
    expect(a.severity).toBe("suggest");
    expect(a.detail).toMatch(/fat/i);
  });

  it("is honest that reverse dieting is about control, not metabolism repair", () => {
    const a = assessPhase({
      state: state("reverse", 1), goal: "weight_loss",
      measuredTdee: 2400, formulaTdee: 2600, tdeeConfidence: 0.9, weeklyChangeKg: 0,
    });
    expect(a.detail.toLowerCase()).toContain("no good evidence");
  });

  it("cancels the deficit while on a maintenance break", () => {
    expect(phaseCalorieShift("maintenance", "weight_loss")).toBeGreaterThan(0);
    expect(phaseCalorieShift("maintenance", "muscle_gain")).toBeLessThan(0);
    expect(phaseCalorieShift("cut", "weight_loss")).toBe(0);
    expect(phaseCalorieShift("reverse", "weight_loss")).toBeGreaterThan(0);
  });
});
