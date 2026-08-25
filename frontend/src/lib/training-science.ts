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

/** Kit someone might actually own. `bodyweight` means none at all. */
export type Equipment =
  | "bodyweight" | "dumbbells" | "barbell" | "bench" | "resistance_band"
  | "chair" | "yoga_mat" | "pull_up_bar" | "kettlebell";

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  bodyweight: "No equipment", dumbbells: "Dumbbells", barbell: "Barbell",
  bench: "Bench", resistance_band: "Resistance band", chair: "Sturdy chair",
  yoga_mat: "Yoga mat", pull_up_bar: "Pull-up bar", kettlebell: "Kettlebell",
};

/** Joints and areas people commonly need to work around. */
export type Limitation = "knee" | "shoulder" | "lower_back" | "wrist" | "hip" | "neck" | "balance";

export const LIMITATION_LABEL: Record<Limitation, string> = {
  knee: "Knee pain", shoulder: "Shoulder pain", lower_back: "Lower-back pain",
  wrist: "Wrist pain", hip: "Hip pain", neck: "Neck pain", balance: "Poor balance / fall risk",
};

export interface ExerciseDef {
  name: string;
  primary: Muscle[];
  secondary?: Muscle[];
  /** every item must be available for the exercise to be offered */
  equipment: Equipment[];
  /** limitations that make this movement a poor choice */
  avoid?: Limitation[];
  /** shown when this is offered as a swap */
  note?: string;
}

/**
 * Exercise library with the kit each movement needs and the joints it tends to
 * aggravate. This is what makes a plan usable in a real home: a prescription
 * for a barbell squat is worthless to someone with a mat and a chair, and
 * telling a person with knee pain to do jump squats is worse than worthless.
 */
export const EXERCISE_LIBRARY: ExerciseDef[] = [
  // ── Chest / push ──────────────────────────────────────────────────────────
  { name: "Wall push-up", primary: ["chest"], secondary: ["triceps", "shoulders"], equipment: ["bodyweight"], note: "Gentlest push-up progression — upright against a wall." },
  { name: "Incline push-up", primary: ["chest"], secondary: ["triceps", "shoulders"], equipment: ["bodyweight"], avoid: ["wrist"], note: "Hands on a counter or sturdy chair; easier than the floor." },
  { name: "Push-up", primary: ["chest"], secondary: ["triceps", "shoulders", "core"], equipment: ["bodyweight"], avoid: ["wrist", "shoulder"] },
  { name: "Knee push-up", primary: ["chest"], secondary: ["triceps", "shoulders"], equipment: ["bodyweight"], avoid: ["wrist", "knee"] },
  { name: "Dumbbell bench press", primary: ["chest"], secondary: ["triceps", "shoulders"], equipment: ["dumbbells", "bench"], avoid: ["shoulder"] },
  { name: "Dumbbell chest press (floor)", primary: ["chest"], secondary: ["triceps", "shoulders"], equipment: ["dumbbells"], note: "Floor limits how far the shoulder travels — kinder than a bench press." },
  { name: "Resistance band chest press", primary: ["chest"], secondary: ["triceps", "shoulders"], equipment: ["resistance_band"], note: "Can be done seated; easy on the joints." },

  // ── Back / pull ───────────────────────────────────────────────────────────
  { name: "Resistance band row", primary: ["back"], secondary: ["biceps"], equipment: ["resistance_band"], note: "Anchor the band at door height, or sit and loop it round your feet." },
  { name: "Seated band row", primary: ["back"], secondary: ["biceps"], equipment: ["resistance_band", "chair"], avoid: [], note: "Fully seated — no load on the lower back." },
  { name: "Dumbbell row", primary: ["back"], secondary: ["biceps"], equipment: ["dumbbells"], avoid: ["lower_back"] },
  { name: "Dumbbell row (supported on chair)", primary: ["back"], secondary: ["biceps"], equipment: ["dumbbells", "chair"], note: "One hand braced on the chair takes the strain off your back." },
  { name: "Bent-over dumbbell row", primary: ["back"], secondary: ["biceps"], equipment: ["dumbbells"], avoid: ["lower_back"] },
  { name: "Pull-up", primary: ["back"], secondary: ["biceps", "core"], equipment: ["pull_up_bar"], avoid: ["shoulder"] },
  { name: "Superman hold", primary: ["back"], secondary: ["glutes"], equipment: ["yoga_mat"], avoid: ["lower_back"], note: "No equipment beyond a mat." },
  { name: "Towel row (isometric)", primary: ["back"], secondary: ["biceps"], equipment: ["bodyweight"], note: "Pull a towel apart hard against itself — surprisingly effective with nothing at all." },

  // ── Shoulders / arms ──────────────────────────────────────────────────────
  { name: "Overhead press", primary: ["shoulders"], secondary: ["triceps", "core"], equipment: ["dumbbells"], avoid: ["shoulder", "neck"] },
  { name: "Overhead press (light dumbbells, seated)", primary: ["shoulders"], secondary: ["triceps"], equipment: ["dumbbells", "chair"], avoid: ["shoulder"] },
  { name: "Band overhead press", primary: ["shoulders"], secondary: ["triceps"], equipment: ["resistance_band"], avoid: ["shoulder"] },
  { name: "Lateral raise", primary: ["shoulders"], equipment: ["dumbbells"], avoid: ["shoulder"] },
  { name: "Front raise (water bottles)", primary: ["shoulders"], equipment: ["bodyweight"], note: "Two filled bottles work perfectly well as light weights." },
  { name: "Pike push-up", primary: ["shoulders"], secondary: ["triceps"], equipment: ["bodyweight"], avoid: ["wrist", "shoulder"] },
  { name: "Bicep curl", primary: ["biceps"], equipment: ["dumbbells"] },
  { name: "Band bicep curl", primary: ["biceps"], equipment: ["resistance_band"] },
  { name: "Triceps extension", primary: ["triceps"], equipment: ["dumbbells"], avoid: ["shoulder", "wrist"] },
  { name: "Chair dips", primary: ["triceps"], secondary: ["chest", "shoulders"], equipment: ["chair"], avoid: ["shoulder", "wrist"] },

  // ── Quads / squat pattern ─────────────────────────────────────────────────
  { name: "Sit-to-stand (chair squat)", primary: ["quads"], secondary: ["glutes"], equipment: ["chair"], note: "Safest squat pattern — the chair is there if you need it." },
  { name: "Bodyweight squat", primary: ["quads"], secondary: ["glutes", "core"], equipment: ["bodyweight"], avoid: ["knee"] },
  { name: "Wall sit", primary: ["quads"], equipment: ["bodyweight"], note: "Static hold — no knee bending under load, easier on sore joints." },
  { name: "Goblet squat", primary: ["quads"], secondary: ["glutes", "core"], equipment: ["dumbbells"], avoid: ["knee"] },
  { name: "Barbell squat", primary: ["quads"], secondary: ["glutes", "core"], equipment: ["barbell"], avoid: ["knee", "lower_back"] },
  { name: "Reverse lunge", primary: ["quads"], secondary: ["glutes", "hamstrings"], equipment: ["bodyweight"], avoid: ["knee", "balance"] },
  { name: "Step-up", primary: ["quads"], secondary: ["glutes"], equipment: ["chair"], avoid: ["knee", "balance"] },
  { name: "Seated leg extension", primary: ["quads"], equipment: ["chair"], note: "Fully seated and gentle — a good knee-friendly option." },

  // ── Hamstrings / glutes / hinge ───────────────────────────────────────────
  { name: "Glute bridge", primary: ["glutes"], secondary: ["hamstrings"], equipment: ["yoga_mat"], note: "Lying on your back — no balance or joint loading required." },
  { name: "Single-leg glute bridge", primary: ["glutes"], secondary: ["hamstrings"], equipment: ["yoga_mat"] },
  { name: "Hip thrust", primary: ["glutes"], secondary: ["hamstrings"], equipment: ["bench"] },
  { name: "Romanian deadlift", primary: ["hamstrings"], secondary: ["glutes", "back"], equipment: ["dumbbells"], avoid: ["lower_back"] },
  { name: "Dumbbell deadlift", primary: ["hamstrings"], secondary: ["glutes", "back"], equipment: ["dumbbells"], avoid: ["lower_back"] },
  { name: "Standing hamstring curl", primary: ["hamstrings"], equipment: ["bodyweight"], note: "Hold a chair for balance; no load on the spine." },
  { name: "Band leg curl", primary: ["hamstrings"], equipment: ["resistance_band"] },

  // ── Calves ────────────────────────────────────────────────────────────────
  { name: "Calf raise (holding chair back)", primary: ["calves"], equipment: ["chair"] },
  { name: "Calf raise", primary: ["calves"], equipment: ["bodyweight"], avoid: ["balance"] },
  { name: "Seated calf raise", primary: ["calves"], equipment: ["chair"], note: "Seated version for anyone unsteady on their feet." },

  // ── Core ──────────────────────────────────────────────────────────────────
  { name: "Plank hold", primary: ["core"], equipment: ["yoga_mat"], avoid: ["wrist", "lower_back"] },
  { name: "Dead bug", primary: ["core"], equipment: ["yoga_mat"], note: "Back stays flat on the floor throughout — very lower-back friendly." },
  { name: "Bird dog", primary: ["core"], secondary: ["back"], equipment: ["yoga_mat"], avoid: ["wrist"] },
  { name: "Seated march", primary: ["core"], equipment: ["chair"], note: "Core work you can do sitting down." },
  { name: "Standing side bend", primary: ["core"], equipment: ["bodyweight"] },
];

/** Fast lookup built from the library above, so there is one source of truth. */
const EXERCISE_MUSCLES: Record<string, MuscleMap> = Object.fromEntries(
  EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), { primary: e.primary, secondary: e.secondary }])
);

// Aliases for names that appear in workout templates but describe a movement
// already in the library, so volume counting and swapping both still resolve.
const ALIASES: Record<string, string> = {
  "push-ups (knee or full)": "push-up",
  "push-up (any variation)": "push-up",
  "push-up (incline / standard / decline)": "push-up",
  "push-up + shoulder tap": "push-up",
  "plank + shoulder tap": "plank hold",
  "plank": "plank hold",
  "core: dead bug": "dead bug",
  "chair-supported sit-to-stand": "sit-to-stand (chair squat)",
  "bodyweight squat (slow 3-sec descent)": "bodyweight squat",
  "barbell / db squat": "goblet squat",
  "dumbbell squat to press": "goblet squat",
  "jump squats (20 s on / 10 s off)": "bodyweight squat",
  "reverse lunges": "reverse lunge",
  "reverse lunge (alternating)": "reverse lunge",
  "walking lunges": "reverse lunge",
  "dumbbell row (alternating)": "dumbbell row",
  "resistance band chest press (seated)": "resistance band chest press",
  "romanian deadlift (light)": "romanian deadlift",
  "leg curl (or nordic curl)": "standing hamstring curl",
  "calf raises (weighted)": "calf raise",
  "glute bridge (floor)": "glute bridge",
  "glute bridge (floor or bed)": "glute bridge",
  "setu bandhasana (bridge pose)": "glute bridge",
  "bridge pose (hip opener)": "glute bridge",
  "shoulder press (seated)": "overhead press (light dumbbells, seated)",
  "superman hold (back)": "superman hold",
  "pike push-up (shoulders)": "pike push-up",
};

function canonical(exercise: string): string {
  const key = exercise.toLowerCase().trim();
  return ALIASES[key] ?? key;
}

/** The library entry for an exercise name, if we know the movement. */
export function exerciseDef(exercise: string): ExerciseDef | null {
  const key = canonical(exercise);
  const exact = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === key);
  if (exact) return exact;
  return EXERCISE_LIBRARY.find((e) => key.includes(e.name.toLowerCase())) ?? null;
}

export interface Substitution {
  name: string;
  reason: string;
  equipment: Equipment[];
  note?: string;
}

/**
 * Alternatives that train the same muscles with the kit someone actually owns
 * and without aggravating the joints they've flagged. Ranked so the closest
 * match to the original movement comes first, then the simplest kit.
 */
export function substituteExercise(
  exercise: string,
  opts: { equipment?: Equipment[]; limitations?: Limitation[]; limit?: number } = {}
): { original: ExerciseDef | null; blocked: "equipment" | "limitation" | null; options: Substitution[] } {
  const owned = new Set<Equipment>(opts.equipment?.length ? opts.equipment : ["bodyweight"]);
  owned.add("bodyweight"); // you always have your own body
  const limits = new Set<Limitation>(opts.limitations ?? []);
  const original = exerciseDef(exercise);

  const hasKit = (e: ExerciseDef) => e.equipment.every((q) => owned.has(q));
  const isSafe = (e: ExerciseDef) => !(e.avoid ?? []).some((a) => limits.has(a));

  let blocked: "equipment" | "limitation" | null = null;
  if (original) {
    if (!hasKit(original)) blocked = "equipment";
    else if (!isSafe(original)) blocked = "limitation";
  }

  const targets = new Set(original?.primary ?? []);
  const options = EXERCISE_LIBRARY
    .filter((e) => e.name !== original?.name && hasKit(e) && isSafe(e))
    .map((e) => {
      const overlap = e.primary.filter((m) => targets.has(m)).length;
      const assists = (e.secondary ?? []).filter((m) => targets.has(m)).length;
      // prefer same primary muscle, then the least equipment needed
      const score = overlap * 10 + assists * 3 - e.equipment.filter((q) => q !== "bodyweight").length;
      return { e, overlap, score };
    })
    .filter((r) => r.overlap > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 4)
    .map(({ e }) => ({
      name: e.name,
      equipment: e.equipment,
      note: e.note,
      reason: `Works ${e.primary.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(" and ")}${
        e.equipment.every((q) => q === "bodyweight") ? ", no equipment needed" : ` using ${e.equipment.map((q) => EQUIPMENT_LABEL[q].toLowerCase()).join(" + ")}`
      }`,
    }));

  return { original, blocked, options };
}

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
  days: { is_rest_day?: boolean; templates?: { instructions?: { main_circuit?: { exercise: string; sets?: number; duration_sec?: number }[] } }[] }[]
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
