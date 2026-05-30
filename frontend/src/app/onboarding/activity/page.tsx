"use client";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ACTIVITY_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TDEE_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

export default function ActivityPage() {
  const router = useRouter();
  const { activity, setActivity, profile } = useOnboardingStore();

  const bmr = profile.weight_kg && profile.height_cm && profile.age && profile.gender
    ? (() => {
        const base = 10 * Number(profile.weight_kg) + 6.25 * Number(profile.height_cm) - 5 * Number(profile.age);
        return profile.gender === "male" ? base + 5 : profile.gender === "female" ? base - 161 : base - 78;
      })()
    : null;

  const tdee = bmr && activity.activity_level
    ? Math.round(bmr * TDEE_MULTIPLIERS[activity.activity_level])
    : null;

  return (
    <OnboardingShell
      currentStep={2}
      title="How active are you?"
      subtitle="Your activity level multiplies your BMR to get your Total Daily Energy Expenditure (TDEE)."
    >
      <div className="space-y-4">
        {ACTIVITY_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => setActivity({ activity_level: level.value })}
            className={cn(
              "w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
              activity.activity_level === level.value
                ? "border-sky-500 bg-sky-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                activity.activity_level === level.value
                  ? "border-sky-500 bg-sky-500"
                  : "border-gray-300"
              )}
            >
              {activity.activity_level === level.value && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900">{level.label}</div>
              <div className="text-sm text-gray-500">{level.description}</div>
            </div>
            {activity.activity_level === level.value && bmr && (
              <div className="text-right">
                <div className="text-lg font-black text-sky-600">
                  {Math.round(bmr * TDEE_MULTIPLIERS[level.value])} kcal
                </div>
                <div className="text-xs text-gray-400">TDEE</div>
              </div>
            )}
          </button>
        ))}

        {tdee && (
          <div className="p-5 bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-200 rounded-2xl animate-fade-in">
            <div className="text-sm text-gray-500 mb-1">Your estimated daily energy need</div>
            <div className="text-4xl font-black text-sky-700">{tdee.toLocaleString()} <span className="text-xl font-normal">kcal/day</span></div>
            <div className="text-sm text-gray-400 mt-1">The engine will adjust this based on your goal (deficit/surplus)</div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
            ← Back
          </button>
          <button
            onClick={() => activity.activity_level && router.push("/onboarding/goals")}
            disabled={!activity.activity_level}
            className={cn(
              "flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-lg transition-all",
              activity.activity_level
                ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:scale-105 shadow-glow-blue"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Continue to Goals →
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
