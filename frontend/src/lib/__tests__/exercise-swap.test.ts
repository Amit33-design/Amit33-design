import { describe, it, expect } from "vitest";
import { substituteExercise, exerciseDef, EXERCISE_LIBRARY, Equipment, Limitation } from "../training-science";

describe("exercise substitution", () => {
  it("flags an exercise needing kit the user doesn't own", () => {
    const r = substituteExercise("Dumbbell bench press", { equipment: ["bodyweight"] });
    expect(r.blocked).toBe("equipment");
    expect(r.options.length).toBeGreaterThan(0);
    // every offered option must be doable with nothing
    for (const o of r.options) expect(o.equipment).toEqual(["bodyweight"]);
  });

  it("does not flag an exercise the user can actually do", () => {
    const r = substituteExercise("Dumbbell bench press", { equipment: ["dumbbells", "bench"] });
    expect(r.blocked).toBeNull();
  });

  it("flags a movement that would aggravate a declared injury", () => {
    const r = substituteExercise("Bodyweight squat", { equipment: ["bodyweight", "chair"], limitations: ["knee"] });
    expect(r.blocked).toBe("limitation");
    // and never offers another knee-aggravating movement as the fix
    for (const o of r.options) {
      const def = exerciseDef(o.name)!;
      expect(def.avoid ?? [], `${o.name} still avoids knee`).not.toContain("knee");
    }
  });

  it("offers alternatives that train the same primary muscle", () => {
    const original = exerciseDef("Dumbbell row")!;
    const r = substituteExercise("Dumbbell row", { equipment: ["resistance_band"] });
    expect(r.options.length).toBeGreaterThan(0);
    for (const o of r.options) {
      const def = exerciseDef(o.name)!;
      const shares = def.primary.some((m) => original.primary.includes(m))
        || (def.secondary ?? []).some((m) => original.primary.includes(m));
      expect(shares, `${o.name} shares no muscle with a row`).toBe(true);
    }
  });

  it("prefers the simplest equipment when ranking", () => {
    const r = substituteExercise("Barbell squat", { equipment: ["bodyweight", "chair", "dumbbells", "barbell"] });
    const first = exerciseDef(r.options[0].name)!;
    const kit = (n: string) => exerciseDef(n)!.equipment.filter((q) => q !== "bodyweight").length;
    expect(kit(first.name)).toBeLessThanOrEqual(kit(r.options[r.options.length - 1].name));
  });

  it("always has a bodyweight path for every muscle group", () => {
    const muscles = ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "calves", "core"] as const;
    for (const m of muscles) {
      const doable = EXERCISE_LIBRARY.filter(
        (e) => e.primary.includes(m) && e.equipment.every((q) => q === "bodyweight" || q === "chair" || q === "yoga_mat")
      );
      expect(doable.length, `no home-friendly option for ${m}`).toBeGreaterThan(0);
    }
  });

  it("resolves template aliases to the canonical movement", () => {
    expect(exerciseDef("Push-ups (knee or full)")!.primary).toContain("chest");
    expect(exerciseDef("Chair-supported sit-to-stand")!.primary).toContain("quads");
    expect(exerciseDef("Glute bridge (floor or bed)")!.primary).toContain("glutes");
  });

  it("respects several limitations at once", () => {
    const limitations: Limitation[] = ["knee", "wrist", "lower_back"];
    const equipment: Equipment[] = ["bodyweight", "chair", "yoga_mat"];
    const r = substituteExercise("Push-up", { equipment, limitations });
    for (const o of r.options) {
      const def = exerciseDef(o.name)!;
      for (const bad of limitations) expect(def.avoid ?? []).not.toContain(bad);
    }
  });
});
