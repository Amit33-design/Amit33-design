"use client";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { DIET_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const COMMON_ALLERGIES = ["Gluten", "Dairy", "Nuts", "Shellfish", "Eggs", "Soy"];

export default function DietPage() {
  const router = useRouter();
  const { diet, setDiet } = useOnboardingStore();

  const toggleAllergy = (a: string) => {
    const lower = a.toLowerCase();
    if (diet.allergies.includes(lower)) {
      setDiet({ allergies: diet.allergies.filter((x) => x !== lower) });
    } else {
      setDiet({ allergies: [...diet.allergies, lower] });
    }
  };

  return (
    <OnboardingShell
      currentStep={5}
      title="Dietary preferences & restrictions"
      subtitle="Your diet type and allergies are added to the constraint graph — safe foods are filtered accordingly."
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Diet Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DIET_TYPES.map((dt) => (
              <button
                key={dt.value}
                onClick={() => setDiet({ diet_type: dt.value })}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-sm font-semibold transition-all",
                  diet.diet_type === dt.value
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                )}
              >
                <span className="text-2xl">{dt.icon}</span>
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Allergies & Intolerances</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((a) => {
              const isSelected = diet.allergies.includes(a.toLowerCase());
              return (
                <button
                  key={a}
                  onClick={() => toggleAllergy(a)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                    isSelected
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                  )}
                >
                  {isSelected ? "✓ " : ""}{a}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">Selected allergies will be excluded from all meal plans.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">← Back</button>
          <button
            onClick={() => router.push("/onboarding/lifestyle")}
            className="flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:scale-105 transition-all shadow-glow-blue"
          >
            Continue to Lifestyle →
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
