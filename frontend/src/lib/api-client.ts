import { API_BASE } from "./constants";

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
  onboard: (data: unknown) =>
    apiFetch("/users/onboard", { method: "POST", body: JSON.stringify(data) }),

  getUser: (userId: string) =>
    apiFetch(`/users/${userId}`),

  getUserSummary: (userId: string) =>
    apiFetch(`/users/${userId}/summary`),

  getMealPlan: (userId: string, date?: string) =>
    apiFetch(`/nutrition/${userId}/plan${date ? `?plan_date=${date}` : ""}`),

  getMacros: (userId: string) =>
    apiFetch(`/nutrition/${userId}/macros`),

  regeneratePlan: (userId: string) =>
    apiFetch(`/nutrition/${userId}/plan/regenerate`, { method: "POST" }),

  checkFood: (userId: string, foodId: string) =>
    apiFetch(`/nutrition/${userId}/food-check`, { method: "POST", body: JSON.stringify({ food_id: foodId }) }),

  searchFoods: (q: string, userId?: string) =>
    apiFetch(`/nutrition/foods/search?q=${encodeURIComponent(q)}${userId ? `&user_id=${userId}` : ""}`),

  getWorkoutPlan: (userId: string) =>
    apiFetch(`/workouts/${userId}/plan`),

  getTodayWorkout: (userId: string) =>
    apiFetch(`/workouts/${userId}/today`),

  getLifestyleRecs: (userId: string) =>
    apiFetch(`/lifestyle/${userId}/recommendations`),

  logProgress: (userId: string, data: unknown) =>
    apiFetch(`/progress/${userId}/log`, { method: "POST", body: JSON.stringify(data) }),

  getProgressHistory: (userId: string, days = 30) =>
    apiFetch(`/progress/${userId}/history?days=${days}`),

  getProgressTrends: (userId: string) =>
    apiFetch(`/progress/${userId}/trends`),

  chat: (userId: string, message: string, sessionId?: string) =>
    apiFetch(`/ai/${userId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message, session_id: sessionId }),
    }),

  explainPlan: (userId: string, planId: string) =>
    apiFetch(`/ai/${userId}/explain/meal/${planId}`, { method: "POST" }),

  explainFood: (userId: string, foodId: string) =>
    apiFetch(`/ai/${userId}/explain/food/${foodId}`, { method: "POST" }),
};
