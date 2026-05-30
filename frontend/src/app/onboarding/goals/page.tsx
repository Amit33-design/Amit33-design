"use client";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { GOALS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function GoalsPage() {
  const router = useRouter();
  const { goals, setGoals } = useOnboardingStore();

  const primaryGoal = goals.find((g) => g.is_primary)?.goal_type;

  const toggleGoal = (goalType: string) => {
    if (primaryGoal === goalType) return; // Already primary, deselect not allowed
    setGoals([{ goal_type: goalType, is_primary: true }]);
  };

  return (
    <OnboardingShell
      currentStep={3}
      title="What's your primary health goal?"
      subtitle="Your goal sets the calorie adjustment and macro split. The engine will optimize everything else around this."
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GOALS.map((goal) => (
            <button
              key={goal.value}
              onClick={() => toggleGoal(goal.value)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all group",
                primaryGoal === goal.value
                  ? "border-sky-500 bg-sky-50 shadow-glow-blue"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
              )}
            >
              <div className="text-3xl">{goal.icon}</div>
              <div className="flex-1">
                <div className={cn("font-bold", primaryGoal === goal.value ? "text-sky-800" : "text-gray-900")}>
                  {goal.label}
                </div>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                  primaryGoal === goal.value ? "border-sky-500 bg-sky-500" : "border-gray-300"
                )}
              >
                {primaryGoal === goal.value && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>

        {primaryGoal && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200 rounded-2xl animate-fade-in">
            <div className="text-sm font-semibold text-emerald-800 mb-1">
              Engine Configuration Preview
            </div>
            <div className="text-sm text-gray-600">
              {primaryGoal === "weight_loss"   && "Calorie target: TDEE − 500 kcal. Macro: 30% protein / 40% carbs / 30% fat"}
              {primaryGoal === "fat_loss"       && "Calorie target: TDEE − 300 kcal. Macro: 35% protein / 35% carbs / 30% fat"}
              {primaryGoal === "muscle_gain"    && "Calorie target: TDEE + 300 kcal. Macro: 35% protein / 45% carbs / 20% fat"}
              {primaryGoal === "maintenance"    && "Calorie target: TDEE. Macro: 25% protein / 50% carbs / 25% fat"}
              {primaryGoal === "healthy_aging"  && "Calorie target: TDEE − 100 kcal. Macro: 30% protein / 45% carbs / 25% fat"}
              {primaryGoal === "cardiovascular" && "Calorie target: TDEE − 200 kcal. DASH protocol — high fiber, low sodium"}
              {primaryGoal === "diabetes_friendly" && "Calorie target: TDEE − 300 kcal. Low-GI carb priority, 35% carbs cap"}
              {primaryGoal === "blood_pressure_management" && "Calorie target: TDEE. DASH protocol — sodium < 1500mg, high potassium"}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">← Back</button>
          <button
            onClick={() => primaryGoal && router.push("/onboarding/conditions")}
            disabled={!primaryGoal}
            className={cn(
              "flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-lg transition-all",
              primaryGoal
                ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:scale-105 shadow-glow-blue"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Continue to Conditions →
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
