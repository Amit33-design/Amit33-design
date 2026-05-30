"use client";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { CUISINE_TYPES, PROTEIN_PREFERENCES } from "@/lib/constants";
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

  const canContinue = !!diet.cuisine_type && !!diet.protein_preference;

  return (
    <OnboardingShell
      currentStep={5}
      title="Dietary preferences & restrictions"
      subtitle="Choose your cuisine style and protein preference — both shape your meal plan independently."
    >
      <div className="space-y-7">
        {/* Cuisine preference */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Cuisine Style <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">Sets the food culture your meal plan is drawn from.</p>
          <div className="grid grid-cols-3 gap-3">
            {CUISINE_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setDiet({ cuisine_type: ct.value })}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-sm font-semibold transition-all",
                  diet.cuisine_type === ct.value
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                )}
              >
                <span className="text-2xl">{ct.icon}</span>
                <span>{ct.label}</span>
                <span className="text-xs font-normal text-gray-400 text-center">{ct.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Protein preference */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Protein Preference <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">Determines which protein sources appear in your meals.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROTEIN_PREFERENCES.map((pp) => (
              <button
                key={pp.value}
                onClick={() => setDiet({ protein_preference: pp.value })}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-sm font-semibold transition-all",
                  diet.protein_preference === pp.value
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
                )}
              >
                <span className="text-2xl">{pp.icon}</span>
                <span>{pp.label}</span>
                <span className="text-xs font-normal text-gray-400 text-center">{pp.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
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
            disabled={!canContinue}
            onClick={() => router.push("/onboarding/lifestyle")}
            className={cn(
              "flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-lg transition-all",
              canContinue
                ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:scale-105 shadow-glow-blue"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Continue to Lifestyle →
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
