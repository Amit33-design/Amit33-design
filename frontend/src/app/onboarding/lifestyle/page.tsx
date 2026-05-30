"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { api } from "@/lib/api-client";
import { setStoredUserId } from "@/store/onboarding-store";
import { cn } from "@/lib/utils";

const STRESS_LEVELS = [
  { value: "low",    label: "Low",    icon: "😌", color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  { value: "medium", label: "Medium", icon: "😐", color: "border-yellow-400 bg-yellow-50 text-yellow-700" },
  { value: "high",   label: "High",   icon: "😰", color: "border-red-400 bg-red-50 text-red-700" },
];

const SMOKING_STATUS = [
  { value: "never",   label: "Never Smoked" },
  { value: "former",  label: "Former Smoker" },
  { value: "current", label: "Current Smoker" },
];

export default function LifestylePage() {
  const router = useRouter();
  const { lifestyle, setLifestyle, profile, activity, goals, conditions, diet, setUserId } = useOnboardingStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        profile: {
          name: profile.name || null,
          email: profile.email || null,
          age: Number(profile.age),
          gender: profile.gender,
          height_cm: Number(profile.height_cm),
          weight_kg: Number(profile.weight_kg),
        },
        activity: { activity_level: activity.activity_level },
        goals: goals.map((g) => ({ goal_type: g.goal_type, is_primary: g.is_primary })),
        conditions: conditions.map((c) => ({ condition_code: c.condition_code })),
        dietary_preferences: {
          diet_type: diet.diet_type || null,
          allergies: diet.allergies,
          intolerances: diet.intolerances,
        },
        lifestyle: {
          sleep_hours: lifestyle.sleep_hours ? Number(lifestyle.sleep_hours) : null,
          stress_level: lifestyle.stress_level || null,
          smoking_status: lifestyle.smoking_status || null,
          alcohol_units_week: lifestyle.alcohol_units_week ? Number(lifestyle.alcohol_units_week) : null,
          water_liters_day: lifestyle.water_liters_day ? Number(lifestyle.water_liters_day) : null,
        },
      };

      const response = await api.onboard(payload) as { user_id: string };
      setUserId(response.user_id);
      setStoredUserId(response.user_id);
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      currentStep={6}
      title="Lifestyle factors"
      subtitle="Sleep, stress, and habits complete your health profile. These influence lifestyle recommendations from your copilot."
    >
      <div className="space-y-6">
        {/* Sleep */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Average Sleep Hours per Night</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={3}
              max={12}
              step={0.5}
              value={lifestyle.sleep_hours || 7}
              onChange={(e) => setLifestyle({ sleep_hours: Number(e.target.value) })}
              className="flex-1 accent-sky-500"
            />
            <span className="w-16 text-center text-xl font-bold text-gray-900">
              {lifestyle.sleep_hours || 7}h
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-400">Recommended: 7–9 hours for adults</div>
        </div>

        {/* Stress */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Current Stress Level</label>
          <div className="flex gap-3">
            {STRESS_LEVELS.map((s) => (
              <button
                key={s.value}
                onClick={() => setLifestyle({ stress_level: s.value })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all",
                  lifestyle.stress_level === s.value ? s.color : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Smoking */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Smoking Status</label>
          <div className="flex flex-wrap gap-3">
            {SMOKING_STATUS.map((s) => (
              <button
                key={s.value}
                onClick={() => setLifestyle({ smoking_status: s.value })}
                className={cn(
                  "px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                  lifestyle.smoking_status === s.value
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alcohol */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Alcohol Consumption (units/week)</label>
          <input
            type="number"
            min={0}
            max={50}
            value={lifestyle.alcohol_units_week}
            onChange={(e) => setLifestyle({ alcohol_units_week: Number(e.target.value) })}
            placeholder="0"
            className="w-full md:w-40 px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-gray-900"
          />
          <div className="text-xs text-gray-400 mt-1">Safe limit: 14 units/week. 1 unit = 1 small beer or glass of wine.</div>
        </div>

        {/* Water */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Water Intake (liters)</label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.25}
            value={lifestyle.water_liters_day}
            onChange={(e) => setLifestyle({ water_liters_day: Number(e.target.value) })}
            placeholder="2.0"
            className="w-full md:w-40 px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-gray-900"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">← Back</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-lg transition-all",
              !submitting
                ? "bg-gradient-to-r from-emerald-500 to-sky-600 text-white hover:scale-105 shadow-glow-green"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Building your plan...
              </span>
            ) : (
              "🚀 Build My Health Plan"
            )}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
