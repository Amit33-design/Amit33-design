import { describe, it, expect, beforeEach } from "vitest";
import {
  logLiftSet, removeLastLiftSet, getSetsFor, getExerciseHistory, loggedExercises, hasLiftLog,
} from "../local-store";
import { estimate1RM, progressionAdvice, loadForReps } from "../training-science";

/** Minimal localStorage stand-in so the store can be exercised under node. */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const TODAY = daysAgo(0);

beforeEach(() => {
  const storage = new MemoryStorage();
  // the store guards on `typeof window`, so both must be present
  (globalThis as unknown as { window: unknown }).window = { localStorage: storage };
  (globalThis as unknown as { localStorage: unknown }).localStorage = storage;
});

describe("strength logging", () => {
  it("records sets and reads them back for the day", () => {
    expect(hasLiftLog()).toBe(false);
    logLiftSet({ date: TODAY, exercise: "Goblet squat", weight_kg: 24, reps: 10 });
    logLiftSet({ date: TODAY, exercise: "Goblet squat", weight_kg: 24, reps: 9 });
    const sets = getSetsFor("Goblet squat", TODAY);
    expect(sets).toHaveLength(2);
    expect(sets[0].weight_kg).toBe(24);
    expect(hasLiftLog()).toBe(true);
  });

  it("keeps exercises separate", () => {
    logLiftSet({ date: TODAY, exercise: "Goblet squat", weight_kg: 24, reps: 10 });
    logLiftSet({ date: TODAY, exercise: "Dumbbell row", weight_kg: 20, reps: 12 });
    expect(getSetsFor("Goblet squat", TODAY)).toHaveLength(1);
    expect(getSetsFor("Dumbbell row", TODAY)).toHaveLength(1);
    expect(loggedExercises()).toContain("Dumbbell row");
  });

  it("undo removes only the most recent set", () => {
    logLiftSet({ date: TODAY, exercise: "Bench", weight_kg: 60, reps: 8 });
    logLiftSet({ date: TODAY, exercise: "Bench", weight_kg: 60, reps: 6 });
    removeLastLiftSet("Bench", TODAY);
    const sets = getSetsFor("Bench", TODAY);
    expect(sets).toHaveLength(1);
    expect(sets[0].reps).toBe(8);
  });

  it("summarises each session by its heaviest set", () => {
    logLiftSet({ date: TODAY, exercise: "Bench", weight_kg: 50, reps: 12 });
    logLiftSet({ date: TODAY, exercise: "Bench", weight_kg: 65, reps: 5 });
    logLiftSet({ date: TODAY, exercise: "Bench", weight_kg: 60, reps: 8 });
    const h = getExerciseHistory("Bench");
    expect(h.last!.weight_kg).toBe(65);
    expect(h.sessions[0].sets).toBe(3);
  });

  it("counts consecutive sessions at the same load for the deload trigger", () => {
    for (const d of [21, 14, 7]) {
      logLiftSet({ date: daysAgo(d), exercise: "Bench", weight_kg: 60, reps: 8 });
    }
    expect(getExerciseHistory("Bench").weeks_at_same_load).toBe(3);

    // adding a heavier session resets the stall counter
    logLiftSet({ date: TODAY, exercise: "Bench", weight_kg: 65, reps: 8 });
    expect(getExerciseHistory("Bench").weeks_at_same_load).toBe(1);
  });

  it("drives the progression prescription from real logged history", () => {
    for (const d of [21, 14, 7]) {
      logLiftSet({ date: daysAgo(d), exercise: "Bench", weight_kg: 60, reps: 8 });
    }
    const h = getExerciseHistory("Bench");
    const advice = progressionAdvice({
      weeksAtSameLoad: h.weeks_at_same_load,
      lastReps: h.last!.reps,
      targetRepRange: [8, 12],
      level: "intermediate",
    });
    expect(advice.action).toBe("deload");

    // a session at the top of the range should call for more load instead
    const topOfRange = progressionAdvice({
      weeksAtSameLoad: 1, lastReps: 12, targetRepRange: [8, 12], level: "intermediate",
    });
    expect(topOfRange.action).toBe("add_load");
  });

  it("suggests a working load consistent with the estimated max", () => {
    const oneRM = estimate1RM(60, 10).value!;
    expect(oneRM).toBeCloseTo(80, 0); // Epley: 60 x (1 + 10/30)
    const working = loadForReps(oneRM, 10);
    expect(working).toBeCloseTo(60, 0); // round-trips back to the logged weight
    expect(loadForReps(oneRM, 5)).toBeGreaterThan(working); // fewer reps, heavier
  });

  it("returns empty history for an exercise never logged", () => {
    const h = getExerciseHistory("Never done");
    expect(h.sessions).toHaveLength(0);
    expect(h.last).toBeUndefined();
    expect(h.weeks_at_same_load).toBe(0);
  });
});
