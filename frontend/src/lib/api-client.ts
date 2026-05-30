import { API_BASE } from "./constants";
import {
  DEMO_USER_ID, demoSummary, demoMacros, demoMealPlan, demoTodayWorkout,
  demoWorkoutPlan, demoLifestyle, demoProgressHistory, getDemoChatResponse,
} from "./demo-data";

// Demo mode: static GitHub Pages build has no backend. Set at build time.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    DEMO_MODE ? Promise.resolve(demoSummary) : apiFetch(`/users/${userId}`),

  getUserSummary: (userId: string) =>
    DEMO_MODE ? Promise.resolve(demoSummary) : apiFetch(`/users/${userId}/summary`),

  getMealPlan: (userId: string, date?: string) =>
    DEMO_MODE ? Promise.resolve(demoMealPlan) : apiFetch(`/nutrition/${userId}/plan${date ? `?plan_date=${date}` : ""}`),

  getMacros: (userId: string) =>
    DEMO_MODE ? Promise.resolve(demoMacros) : apiFetch(`/nutrition/${userId}/macros`),

  regeneratePlan: (userId: string) =>
    DEMO_MODE ? Promise.resolve({ message: "demo", plan_id: "demo-plan" }) : apiFetch(`/nutrition/${userId}/plan/regenerate`, { method: "POST" }),

  checkFood: (userId: string, foodId: string) =>
    DEMO_MODE ? Promise.resolve({ is_safe: true }) : apiFetch(`/nutrition/${userId}/food-check`, { method: "POST", body: JSON.stringify({ food_id: foodId }) }),

  searchFoods: (q: string, userId?: string) =>
    DEMO_MODE ? Promise.resolve({ foods: [], total: 0 }) : apiFetch(`/nutrition/foods/search?q=${encodeURIComponent(q)}${userId ? `&user_id=${userId}` : ""}`),

  getWorkoutPlan: (userId: string) =>
    DEMO_MODE ? Promise.resolve(demoWorkoutPlan) : apiFetch(`/workouts/${userId}/plan`),

  getTodayWorkout: (userId: string) =>
    DEMO_MODE ? Promise.resolve(demoTodayWorkout) : apiFetch(`/workouts/${userId}/today`),

  getLifestyleRecs: (userId: string) =>
    DEMO_MODE ? Promise.resolve(demoLifestyle) : apiFetch(`/lifestyle/${userId}/recommendations`),

  logProgress: async (userId: string, data: unknown) => {
    if (DEMO_MODE) { await delay(400); return { id: "demo", ...(data as object) }; }
    return apiFetch(`/progress/${userId}/log`, { method: "POST", body: JSON.stringify(data) });
  },

  getProgressHistory: (userId: string, days = 30) =>
    DEMO_MODE ? Promise.resolve(demoProgressHistory) : apiFetch(`/progress/${userId}/history?days=${days}`),

  getProgressTrends: (userId: string) =>
    DEMO_MODE ? Promise.resolve({}) : apiFetch(`/progress/${userId}/trends`),

  chat: async (userId: string, message: string, sessionId?: string) => {
    if (DEMO_MODE) {
      await delay(900);
      return { session_id: sessionId || "demo-session", response: getDemoChatResponse(message), suggested_questions: [] };
    }
    return apiFetch(`/ai/${userId}/chat`, { method: "POST", body: JSON.stringify({ message, session_id: sessionId }) });
  },

  explainPlan: (userId: string, planId: string) =>
    DEMO_MODE ? Promise.resolve({ explanation: demoMealPlan.ai_summary }) : apiFetch(`/ai/${userId}/explain/meal/${planId}`, { method: "POST" }),

  explainFood: (userId: string, foodId: string) =>
    DEMO_MODE ? Promise.resolve({ food_name: "", explanation: "Demo mode", reason_tags: [] }) : apiFetch(`/ai/${userId}/explain/food/${foodId}`, { method: "POST" }),
};
