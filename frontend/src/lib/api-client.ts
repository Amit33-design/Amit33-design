import { API_BASE } from "./constants";
import { DEMO_USER_ID } from "./demo-data";
import {
  OnboardingInput, buildUserSummary, computeMacros, generateMealPlan,
  generateWeeklyPlan, generateWorkoutPlan, generateTodayWorkout, generateLifestyle,
  askHealthCopilot,
} from "./recommendation-engine";
import { saveProgressEntry, getLocalProgressHistory, getDietPhase, setDietPhase } from "./local-store";
import { computeAdaptiveTdee, paceFeedback, AdaptiveTdee } from "./adaptive-tdee";
import { assessPhase, phaseForGoal, phaseCalorieShift, DietPhase } from "./diet-phase";

// Demo mode: static GitHub Pages build has no backend. Set at build time.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reads the persisted Zustand onboarding state from localStorage and maps it
 * to the engine's OnboardingInput. Sensible defaults are used for any field the
 * user hasn't filled in, so the demo never crashes on a fresh profile.
 */
function getOnboardingInput(): OnboardingInput {
  const fallback: OnboardingInput = {
    age: 40, gender: "male", weight_kg: 75, height_cm: 172,
    activity_level: "moderate", goal_type: "weight_loss", conditions: [], medications: [],
    cuisine: "indian", protein_pref: "vegetarian", name: "You",
    lifestyle: { sleep_hours: 6.5, stress_level: "medium", water_liters_day: 2.0 },
  };
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem("health-copilot-onboarding");
    if (!stored) return fallback;
    const s = JSON.parse(stored)?.state || {};
    const p = s.profile || {};
    const num = (v: unknown, d: number) => (v === "" || v == null ? d : Number(v));
    const goal_type = s.goals?.[0]?.goal_type || fallback.goal_type;
    return {
      age: num(p.age, fallback.age),
      gender: p.gender || fallback.gender,
      weight_kg: num(p.weight_kg, fallback.weight_kg),
      height_cm: num(p.height_cm, fallback.height_cm),
      activity_level: s.activity?.activity_level || fallback.activity_level,
      goal_type,
      ...(() => {
        const sig = progressSignals(goal_type, num(p.weight_kg, fallback.weight_kg));
        // A maintenance break or reverse phase overrides the goal's deficit,
        // otherwise the app would prescribe a break and then hand out cutting
        // calories anyway.
        const stored = getDietPhase(phaseForGoal(goal_type));
        const shift = phaseCalorieShift(stored.phase as DietPhase, goal_type);
        return {
          calorie_adjustment: sig.calorie_adjustment,
          phase_shift: shift,
          measured_tdee: sig.measured_tdee,
          tdee_confidence: sig.tdee_confidence,
        };
      })(),
      conditions: (s.conditions || []).map((c: { condition_code: string }) => c.condition_code).filter(Boolean),
      medications: (s.medications || []).filter(Boolean),
      cuisine: s.diet?.cuisine_type || fallback.cuisine,
      protein_pref: s.diet?.protein_preference || fallback.protein_pref,
      name: p.name || fallback.name,
      lifestyle: {
        sleep_hours: num(s.lifestyle?.sleep_hours, 6.5),
        stress_level: s.lifestyle?.stress_level || "medium",
        water_liters_day: num(s.lifestyle?.water_liters_day, 2.0),
      },
    };
  } catch {
    return fallback;
  }
}

/**
 * Measure the user's real energy expenditure from their own logs, falling back
 * to the standard formula until there is enough data. Also returns the pace
 * nudge, so a plateau or an unsafely fast loss still gets corrected.
 */
function progressSignals(goal: string, bodyWeightKg: number): {
  calorie_adjustment: number;
  measured_tdee: number | null;
  tdee_confidence: number;
  adaptive: AdaptiveTdee | null;
} {
  try {
    const { logs } = getLocalProgressHistory(60);
    const adaptive = computeAdaptiveTdee(logs);
    const pace = paceFeedback(goal, adaptive.weekly_change_kg, bodyWeightKg);
    return {
      calorie_adjustment: pace.adjust,
      measured_tdee: adaptive.tdee,
      tdee_confidence: adaptive.confidence,
      adaptive,
    };
  } catch {
    return { calorie_adjustment: 0, measured_tdee: null, tdee_confidence: 0, adaptive: null };
  }
}

/** Returns the active user id. In demo mode, always the demo user. */
export function resolveUserId(): string | null {
  if (DEMO_MODE) return DEMO_USER_ID;
  if (typeof window !== "undefined") return localStorage.getItem("health-copilot-user-id");
  return null;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  onboard: async (data: unknown) => {
    if (DEMO_MODE) {
      await delay(800);
      return { user_id: DEMO_USER_ID, message: "Demo profile created" };
    }
    return apiFetch("/users/onboard", { method: "POST", body: JSON.stringify(data) });
  },

  getUser: (userId: string) =>
    DEMO_MODE ? Promise.resolve(buildUserSummary(getOnboardingInput(), userId)) : apiFetch(`/users/${userId}`),

  getUserSummary: (userId: string) =>
    DEMO_MODE ? Promise.resolve(buildUserSummary(getOnboardingInput(), userId)) : apiFetch(`/users/${userId}/summary`),

  getMealPlan: (userId: string, date?: string) =>
    DEMO_MODE
      ? Promise.resolve(generateMealPlan(getOnboardingInput()))
      : apiFetch(`/nutrition/${userId}/plan${date ? `?plan_date=${date}` : ""}`),

  getWeeklyPlan: (userId: string) =>
    DEMO_MODE
      ? Promise.resolve(generateWeeklyPlan(getOnboardingInput()))
      : apiFetch(`/nutrition/${userId}/plan/weekly`),

  getMacros: (userId: string) =>
    DEMO_MODE ? Promise.resolve(computeMacros(getOnboardingInput())) : apiFetch(`/nutrition/${userId}/macros`),

  regeneratePlan: (userId: string) =>
    DEMO_MODE ? Promise.resolve({ message: "demo", plan_id: "demo-plan" }) : apiFetch(`/nutrition/${userId}/plan/regenerate`, { method: "POST" }),

  checkFood: (userId: string, foodId: string) =>
    DEMO_MODE ? Promise.resolve({ is_safe: true }) : apiFetch(`/nutrition/${userId}/food-check`, { method: "POST", body: JSON.stringify({ food_id: foodId }) }),

  searchFoods: (q: string, userId?: string) =>
    DEMO_MODE ? Promise.resolve({ foods: [], total: 0 }) : apiFetch(`/nutrition/foods/search?q=${encodeURIComponent(q)}${userId ? `&user_id=${userId}` : ""}`),

  getWorkoutPlan: (userId: string) =>
    DEMO_MODE ? Promise.resolve(generateWorkoutPlan(getOnboardingInput())) : apiFetch(`/workouts/${userId}/plan`),

  getTodayWorkout: (userId: string) =>
    DEMO_MODE ? Promise.resolve(generateTodayWorkout(getOnboardingInput())) : apiFetch(`/workouts/${userId}/today`),

  getLifestyleRecs: (userId: string) =>
    DEMO_MODE ? Promise.resolve(generateLifestyle(getOnboardingInput())) : apiFetch(`/lifestyle/${userId}/recommendations`),

  logProgress: async (userId: string, data: unknown) => {
    if (DEMO_MODE) {
      const today = new Date().toISOString().slice(0, 10);
      saveProgressEntry({ log_date: today, ...(data as object) });
      return { id: today, ...(data as object) };
    }
    return apiFetch(`/progress/${userId}/log`, { method: "POST", body: JSON.stringify(data) });
  },

  getProgressHistory: (userId: string, days = 30) =>
    DEMO_MODE
      ? Promise.resolve(getLocalProgressHistory(days))
      : apiFetch(`/progress/${userId}/history?days=${days}`),

  getProgressTrends: (userId: string) =>
    DEMO_MODE ? Promise.resolve({}) : apiFetch(`/progress/${userId}/trends`),

  /** Which part of the diet cycle the user is in, and whether to move on. */
  getDietPhase: (userId: string) => {
    if (!DEMO_MODE) return apiFetch(`/progress/${userId}/phase`);
    const input = getOnboardingInput();
    const { logs } = getLocalProgressHistory(120);
    const adaptive = computeAdaptiveTdee(logs);
    const macros = computeMacros(input);
    const state = getDietPhase(phaseForGoal(input.goal_type));
    const assessment = assessPhase({
      state: { phase: state.phase as DietPhase, started: state.started },
      goal: input.goal_type,
      measuredTdee: adaptive.tdee,
      formulaTdee: macros.tdee_predicted,
      tdeeConfidence: adaptive.confidence,
      weeklyChangeKg: adaptive.weekly_change_kg,
    });
    return Promise.resolve({ state, assessment });
  },

  setDietPhase: (userId: string, phase: string) =>
    DEMO_MODE
      ? Promise.resolve(setDietPhase(phase))
      : apiFetch(`/progress/${userId}/phase`, { method: "POST", body: JSON.stringify({ phase }) }),

  /** Expenditure measured from the user's own logs, plus pace feedback. */
  getMetabolism: (userId: string) => {
    if (!DEMO_MODE) return apiFetch(`/progress/${userId}/metabolism`);
    const input = getOnboardingInput();
    const { logs } = getLocalProgressHistory(60);
    const adaptive = computeAdaptiveTdee(logs);
    const pace = paceFeedback(input.goal_type, adaptive.weekly_change_kg, input.weight_kg);
    const macros = computeMacros(input);
    return Promise.resolve({
      adaptive,
      formula_tdee: macros.tdee_predicted,
      pace_message: pace.message,
      pace_verdict: pace.verdict,
    });
  },

  chat: async (userId: string, message: string, sessionId?: string) => {
    if (DEMO_MODE) {
      await delay(900);
      const { response, suggested_questions } = askHealthCopilot(getOnboardingInput(), message);
      return { session_id: sessionId || "demo-session", response, suggested_questions };
    }
    return apiFetch(`/ai/${userId}/chat`, { method: "POST", body: JSON.stringify({ message, session_id: sessionId }) });
  },

  explainPlan: (userId: string, planId: string) =>
    DEMO_MODE ? Promise.resolve({ explanation: generateMealPlan(getOnboardingInput()).ai_summary }) : apiFetch(`/ai/${userId}/explain/meal/${planId}`, { method: "POST" }),

  explainFood: (userId: string, foodId: string) =>
    DEMO_MODE ? Promise.resolve({ food_name: "", explanation: "Demo mode", reason_tags: [] }) : apiFetch(`/ai/${userId}/explain/food/${foodId}`, { method: "POST" }),
};
