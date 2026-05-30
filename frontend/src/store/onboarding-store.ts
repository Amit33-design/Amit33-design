import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OnboardingProfile {
  name: string;
  email: string;
  age: number | "";
  gender: "male" | "female" | "other" | "";
  height_cm: number | "";
  weight_kg: number | "";
}

export interface OnboardingActivity {
  activity_level: string;
}

export interface OnboardingGoal {
  goal_type: string;
  is_primary: boolean;
  target_weight_kg?: number | "";
}

export interface OnboardingCondition {
  condition_code: string;
  severity?: string;
}

export interface OnboardingDiet {
  diet_type: string;
  allergies: string[];
  intolerances: string[];
}

export interface OnboardingLifestyle {
  sleep_hours: number | "";
  stress_level: string;
  smoking_status: string;
  alcohol_units_week: number | "";
  water_liters_day: number | "";
}

interface OnboardingState {
  step: number;
  userId: string | null;
  profile: OnboardingProfile;
  activity: OnboardingActivity;
  goals: OnboardingGoal[];
  conditions: OnboardingCondition[];
  diet: OnboardingDiet;
  lifestyle: OnboardingLifestyle;

  setStep: (step: number) => void;
  setUserId: (id: string) => void;
  setProfile: (p: Partial<OnboardingProfile>) => void;
  setActivity: (a: Partial<OnboardingActivity>) => void;
  setGoals: (g: OnboardingGoal[]) => void;
  setConditions: (c: OnboardingCondition[]) => void;
  setDiet: (d: Partial<OnboardingDiet>) => void;
  setLifestyle: (l: Partial<OnboardingLifestyle>) => void;
  reset: () => void;
}

const defaultProfile: OnboardingProfile = {
  name: "", email: "", age: "", gender: "", height_cm: "", weight_kg: "",
};
const defaultActivity: OnboardingActivity = { activity_level: "" };
const defaultDiet: OnboardingDiet = { diet_type: "", allergies: [], intolerances: [] };
const defaultLifestyle: OnboardingLifestyle = {
  sleep_hours: "", stress_level: "", smoking_status: "", alcohol_units_week: "", water_liters_day: "",
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 1,
      userId: null,
      profile: defaultProfile,
      activity: defaultActivity,
      goals: [],
      conditions: [],
      diet: defaultDiet,
      lifestyle: defaultLifestyle,

      setStep: (step) => set({ step }),
      setUserId: (userId) => set({ userId }),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setActivity: (a) => set((s) => ({ activity: { ...s.activity, ...a } })),
      setGoals: (goals) => set({ goals }),
      setConditions: (conditions) => set({ conditions }),
      setDiet: (d) => set((s) => ({ diet: { ...s.diet, ...d } })),
      setLifestyle: (l) => set((s) => ({ lifestyle: { ...s.lifestyle, ...l } })),
      reset: () => set({
        step: 1, userId: null, profile: defaultProfile, activity: defaultActivity,
        goals: [], conditions: [], diet: defaultDiet, lifestyle: defaultLifestyle,
      }),
    }),
    { name: "health-copilot-onboarding" }
  )
);

export const useUserId = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("health-copilot-user-id");
    return stored;
  }
  return null;
};

export const setStoredUserId = (id: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("health-copilot-user-id", id);
  }
};
