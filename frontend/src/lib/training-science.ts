/**
 * Training prescription: volume, progression and cardio dosing.
 *
 * Static workout templates tell you what to do once. What actually drives
 * results is the dose over time — how many hard sets each muscle gets per
 * week, and whether the load goes up. This module adds that layer.
 *
 * Evidence notes, and the places we deliberately diverge from popular apps:
 *  - Hypertrophy follows a diminishing-returns curve against weekly sets per
 *    muscle, and training frequency stops mattering once volume is equated.
 *    So we prescribe weekly set ranges, not a "personal maximum" — no app can
 *    actually measure that number.
 *  - Estimated 1RM from a working set is accurate to a few percent between
 *    about 2 and 10 reps and degrades badly above that, so we only show it in
 *    range and say when we can't.
 *  - Scheduled calendar deloads are not free: a controlled trial found a
 *    mid-programme deload week blunted strength gains. We trigger a deload on
 *    stalled progress instead of every fourth week.
 *  - Zone 2 is not magic. Reviews find it isn't superior to higher intensities
 *    for aerobic adaptation, so we prescribe a weekly easy/hard distribution.
 *  - The 10,000-step target came from a 1960s pedometer name, not research;
 *    mortality benefit plateaus around 7,000–9,000, earlier for older adults.
 */

export type Muscle =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "quads" | "hamstrings" | "glutes" | "calves" | "core";

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", quads: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves", core: "Core",
};

/**
 * Which muscles an exercise trains. Secondary movers get half credit — a row
 * builds biceps, but not as much as a curl does, and counting it as a full set
 * would overstate arm volume.
 */
interface MuscleMap { primary: Muscle[]; secondary?: Muscle[] }

const EXERCISE_MUSCLES: Record<string, MuscleMap> = {
  // push
  "push-up": { primary: ["chest"], secondary: ["triceps", "shoulders", "core"] },
  "wall push-up": { primary: ["chest"], secondary: ["triceps", "shoulders"] },
  "dumbbell bench press": { primary: ["chest"], secondary: ["triceps", "shoulders"] },
  "chest press": { primary: ["chest"], secondary: ["triceps", "shoulders"] },
  "overhead press": { primary: ["shoulders"], secondary: ["triceps", "core"] },
  "shoulder press": { primary: ["shoulders"], secondary: ["triceps"] },
  "lateral raise": { primary: ["shoulders"] },
  "triceps extension": { primary: ["triceps"] },
  "dips": { primary: ["triceps"], secondary: ["chest", "shoulders"] },
  // pull
  "dumbbell row": { primary: ["back"], secondary: ["biceps"] },
  "resistance band row": { primary: ["back"], secondary: ["biceps"] },
  "seated band row": { primary: ["back"], secondary: ["biceps"] },
  "bent-over row": { primary: ["back"], secondary: ["biceps"] },
  "lat pulldown": { primary: ["back"], secondary: ["biceps"] },
  "pull-up": { primary: ["back"], secondary: ["biceps", "core"] },
  "bicep curl": { primary: ["biceps"] },
  "face pull": { primary: ["shoulders"], secondary: ["back"] },
  // legs
  "bodyweight squat": { primary: ["quads"], secondary: ["glutes", "core"] },
  "goblet squat": { primary: ["quads"], secondary: ["glutes", "core"] },
  "barbell squat": { primary: ["quads"], secondary: ["glutes", "core"] },
  "leg press": { primary: ["quads"], secondary: ["glutes"] },
  "reverse lunges": { primary: ["quads"], secondary: ["glutes", "hamstrings"] },
  "lunges": { primary: ["quads"], secondary: ["glutes", "hamstrings"] },
  "step-up": { primary: ["quads"], secondary: ["glutes"] },
  "romanian deadlift": { primary: ["hamstrings"], secondary: ["glutes", "back"] },
  "deadlift": { primary: ["hamstrings"], secondary: ["glutes", "back", "core"] },
  "glute bridge": { primary: ["glutes"], secondary: ["hamstrings"] },
  "hip thrust": { primary: ["glutes"], secondary: ["hamstrings"] },
  "chair-supported sit-to-stand": { primary: ["quads"], secondary: ["glutes"] },
  "seated leg extension": { primary: ["quads"] },
  "calf raise": { primary: ["calves"] },
  // core
  "plank hold": { primary: ["core"] },
  "plank": { primary: ["core"] },
  "dead bug": { primary: ["core"] },
  "bird dog": { primary: ["core"], secondary: ["back"] },
  "russian twist": { primary: ["core"] },
};

/** Best-effort muscle lookup — exercise names vary across templates. */
export function musclesFor(exercise: string): MuscleMap | null {
  const key = exercise.toLowerCase().trim();
  if (EXERCISE_MUSCLES[key]) return EXERCISE_MUSCLES[key];
  for (const [name, map] of Object.entries(EXERCISE_MUSCLES)) {
    if (key.includes(name) || name.includes(key)) return map;
  }
  return null;
}

export interface VolumeRow {
  muscle: Muscle;
  label: string;
  sets: number;
  min: number;
  max: number;
  status: "under" | "good" | "high";
}

/**
 * Weekly hard sets per muscle group. The ranges below are the commonly used
 * planning heuristic: roughly 10 sets a week to grow, with most people doing
 * well between 10 and 20. They are a starting scaffold, not a measured
 * personal limit.
 */
const VOLUME_RANGE: Record<Muscle, [number, number]> = {
  chest: [8, 18], back: [10, 20], shoulders: [8, 18], biceps: [6, 16],
  triceps: [6, 16], quads: [8, 18], hamstrings: [6, 16], glutes: [6, 16],
  calves: [6, 14], core: [6, 16],
};

export function weeklyVolume(
  days: { is_rest_day?: boolean; templates?: { instructions?: { main_circuit?: { exercise: string; sets?: number }[] } }[] }[]
): VolumeRow[] {
  const tally = {} as Record<Muscle, number>;
  for (const day of days) {
    if (day.is_rest_day) continue;
    for (const tmpl of day.templates || []) {
      for (const move of tmpl.instructions?.main_circuit || []) {
        const sets = move.sets ?? 0;
        if (!sets) continue; // timed cardio/mobility work isn't a strength set
        const map = musclesFor(move.exercise);
        if (!map) continue;
        for (const m of map.primary) tally[m] = (tally[m] ?? 0) + sets;
        for (const m of map.secondary || []) tally[m] = (tally[m] ?? 0) + sets * 0.5;
      }
    }
  }
  return (Object.keys(VOLUME_RANGE) as Muscle[])
    .map((muscle) => {
      const sets = Math.round((tally[muscle] ?? 0) * 10) / 10;
      const [min, max] = VOLUME_RANGE[muscle];
      const status: VolumeRow["status"] = sets < min ? "under" : sets > max ? "high" : "good";
      return { muscle, label: MUSCLE_LABEL[muscle], sets, min, max, status };
    })
    .filter((r) => r.sets > 0 || r.min > 0);
}

/**
 * Estimated one-rep max from a working set.
 * Brzycki is the better fit at low reps, Epley from about six reps up; both
 * lose accuracy past ten, so we refuse to guess rather than print a number
 * the user might load a barbell with.
 */
export function estimate1RM(weightKg: number, reps: number): { value: number | null; formula: string; note?: string } {
  if (!weightKg || reps < 1) return { value: null, formula: "—", note: "Log a weight and reps to estimate." };
  if (reps === 1) return { value: Math.round(weightKg * 10) / 10, formula: "actual" };
  if (reps > 10) {
    return { value: null, formula: "—", note: "Estimates are unreliable above 10 reps — use a heavier set of 3–8 reps to gauge your max." };
  }
  const value = reps <= 6
    ? weightKg * (36 / (37 - reps))            // Brzycki
    : weightKg * (1 + reps / 30);              // Epley
  return { value: Math.round(value * 10) / 10, formula: reps <= 6 ? "Brzycki" : "Epley" };
}

/** Working load for a target rep range, as a share of estimated 1RM. */
export function loadForReps(oneRM: number, reps: number): number {
  const pct = 1 / (1 + reps / 30); // Epley inverted
  return Math.round(oneRM * pct * 2) / 2; // nearest 0.5 kg
}

export interface ProgressionAdvice {
  action: "add_load" | "add_reps" | "hold" | "deload";
  headline: string;
  detail: string;
}

/**
 * Double progression: add reps within the target range first, then add load
 * and drop back to the bottom of the range. A deload is offered when progress
 * has genuinely stalled, rather than imposed on a fixed calendar.
 */
export function progressionAdvice(opts: {
  weeksAtSameLoad: number;
  lastReps: number;
  targetRepRange: [number, number];
  level: string;
}): ProgressionAdvice {
  const { weeksAtSameLoad, lastReps, targetRepRange, level } = opts;
  const [lo, hi] = targetRepRange;
  const jump = level === "beginner" || level === "older_adult" ? "1–2 kg" : "2.5–5 kg";

  if (weeksAtSameLoad >= 3 && lastReps < hi) {
    return {
      action: "deload",
      headline: "Progress has stalled — take a lighter week",
      detail: "Three weeks at the same load without adding reps usually means accumulated fatigue rather than a hard ceiling. Drop to about 60% of your working weight for one week, keep the same movements, then return to your previous load. This is triggered by your actual progress, not a fixed schedule — routine deload weeks can cost you strength when you're still progressing.",
    };
  }
  if (lastReps >= hi) {
    return {
      action: "add_load",
      headline: `Add ${jump} next session`,
      detail: `You reached the top of your ${lo}–${hi} rep range, so the load is no longer challenging enough to drive adaptation. Increase the weight and expect to drop back near ${lo} reps — that's the progression working, not a step backwards.`,
    };
  }
  if (lastReps >= lo) {
    return {
      action: "add_reps",
      headline: "Add one rep per set",
      detail: `Stay at this weight and work up toward ${hi} reps before increasing the load. Adding reps first builds control at the new effort level and keeps form intact.`,
    };
  }
  return {
    action: "hold",
    headline: "Hold this load and build quality reps",
    detail: `You're below the ${lo}-rep floor for this range, so the weight is currently too heavy for productive volume. Keep it steady — or drop slightly — until you can complete ${lo} clean reps on every set.`,
  };
}

/** Age-predicted maximum heart rate. Tanaka is more accurate than 220 − age,
 *  which systematically underestimates older adults' true maximum. */
export function maxHeartRate(age: number): number {
  return Math.round(208 - 0.7 * age);
}

export interface CardioZone {
  name: string;
  bpmLow: number;
  bpmHigh: number;
  share: string;
  feel: string;
  purpose: string;
}

/**
 * Weekly cardio intensity distribution rather than a single "fat-burning
 * zone". Roughly four-fifths easy and one-fifth hard is the best-supported
 * split; the popular claim that a moderate zone is uniquely effective doesn't
 * hold up when training time is limited.
 */
export function cardioZones(age: number, conditions: string[] = []): { zones: CardioZone[]; caution?: string } {
  const hrMax = maxHeartRate(age);
  const pct = (lo: number, hi: number) => [Math.round(hrMax * lo), Math.round(hrMax * hi)] as const;
  const [easyLo, easyHi] = pct(0.6, 0.7);
  const [modLo, modHi] = pct(0.7, 0.8);
  const [hardLo, hardHi] = pct(0.8, 0.9);

  const avoidHard = conditions.some((c) => ["HEART_DISEASE", "HTN"].includes(c));
  const zones: CardioZone[] = [
    { name: "Easy", bpmLow: easyLo, bpmHigh: easyHi, share: "~80% of your cardio time",
      feel: "Comfortable — you can hold a full conversation",
      purpose: "Builds the aerobic base that everything else rests on, with little fatigue cost." },
    { name: "Moderate", bpmLow: modLo, bpmHigh: modHi, share: "Use sparingly",
      feel: "Breathing harder; short sentences only",
      purpose: "Useful but the least efficient per minute — easy to overuse and end up tired without being fitter." },
    { name: "Hard", bpmLow: hardLo, bpmHigh: hardHi, share: avoidHard ? "Only with medical clearance" : "~20% of your cardio time",
      feel: "Hard effort, a few words at a time",
      purpose: "Drives most of the improvement in peak fitness, in short intervals." },
  ];
  return {
    zones,
    caution: avoidHard
      ? "With your blood-pressure or heart condition, stay in the easy and moderate ranges and check with your doctor before any high-intensity work. Avoid holding your breath under load — breathe out on the effort."
      : undefined,
  };
}

/**
 * Daily step target. Mortality benefit rises steeply to around 7,000–8,000
 * steps and then flattens, with the plateau arriving earlier for older adults,
 * so a realistic target beats an aspirational round number.
 */
export function stepTarget(age: number, activityLevel: string): { target: number; rationale: string } {
  const base = age >= 60 ? 7000 : 8000;
  const target = activityLevel === "sedentary" ? base - 1000 : base;
  return {
    target,
    rationale: `Health benefits rise sharply up to about ${target.toLocaleString()} steps a day and then level off${age >= 60 ? ", and the plateau comes earlier after 60" : ""}. The familiar 10,000 figure came from a 1960s pedometer's brand name, not from research — a target you actually hit beats one you don't.`,
  };
}
