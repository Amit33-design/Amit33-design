"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { CONDITIONS, MEDICATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function ConditionsPage() {
  const router = useRouter();
  const { conditions, setConditions, medications, setMedications } = useOnboardingStore();
  const [expandedCondition, setExpandedCondition] = useState<string | null>(null);

  const toggleMed = (value: string) => {
    setMedications(
      medications.includes(value) ? medications.filter((m) => m !== value) : [...medications, value]
    );
  };

  const selected = new Set(conditions.map((c) => c.condition_code));

  const toggleCondition = (code: string) => {
    if (selected.has(code)) {
      setConditions(conditions.filter((c) => c.condition_code !== code));
    } else {
      setConditions([...conditions, { condition_code: code }]);
    }
  };

  return (
    <OnboardingShell
      currentStep={4}
      title="Do you have any health conditions?"
      subtitle="Each condition you select adds clinical constraints to your plan. You can skip this if you have no diagnosed conditions."
    >
      <div className="space-y-4">
        {/* Info banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <span className="text-xl">⚠️</span>
          <div className="text-sm text-amber-800">
            <strong>Important:</strong> These selections add evidence-based safety rules to your plan.
            A user with all three conditions gets recommendations that simultaneously satisfy all constraints.
            This is your personal policy engine.
          </div>
        </div>

        {/* Multi-constraint visualization */}
        {conditions.length >= 2 && (
          <div className="p-4 bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-200 rounded-xl animate-fade-in">
            <div className="text-sm font-semibold text-violet-800 mb-2">🔧 Multi-Constraint Mode Active</div>
            <div className="text-sm text-gray-600">
              {conditions.length} conditions detected. The engine will apply Most Restrictive Wins
              for conflicting nutrient thresholds (e.g., if HTN says Na &lt; 2300mg and CKD says Na &lt; 1500mg,
              the stricter 1500mg cap applies).
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONDITIONS.map((cond) => {
            const isSelected = selected.has(cond.code);
            return (
              <div key={cond.code} className={cn(
                "rounded-2xl border-2 overflow-hidden transition-all",
                isSelected ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white hover:border-gray-300"
              )}>
                <button
                  onClick={() => toggleCondition(cond.code)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <div className="text-2xl">{cond.icon}</div>
                  <div className="flex-1">
                    <div className={cn("font-bold", isSelected ? "text-violet-900" : "text-gray-900")}>
                      {cond.label}
                    </div>
                    {isSelected && (
                      <div className="text-xs text-violet-600 mt-0.5 animate-fade-in">
                        {cond.impact}
                      </div>
                    )}
                  </div>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected ? "bg-violet-500 border-violet-500" : "border-gray-300"
                    )}
                  >
                    {isSelected && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Medications */}
        <div className="pt-2">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <span>💊</span> Are you taking any medications?
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            We use this to flag food interactions and time meals correctly — e.g. insulin users need evenly distributed carbs; warfarin users need consistent vitamin K.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MEDICATIONS.map((med) => {
              const on = medications.includes(med.value);
              return (
                <button
                  key={med.value}
                  onClick={() => toggleMed(med.value)}
                  className={cn(
                    "text-left rounded-xl border-2 p-4 transition-all",
                    on ? "border-sky-500 bg-sky-50" : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{med.icon}</span>
                    <div className="flex-1">
                      <div className={cn("font-semibold text-sm", on ? "text-sky-900" : "text-gray-900")}>
                        {med.label}
                      </div>
                      {on && (
                        <div className="text-xs text-sky-600 mt-0.5 animate-fade-in">{med.note}</div>
                      )}
                    </div>
                    <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5", on ? "bg-sky-500 border-sky-500" : "border-gray-300")}>
                      {on && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">← Back</button>
          <button
            onClick={() => router.push("/onboarding/diet")}
            className="flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:scale-105 transition-all shadow-glow-blue"
          >
            {conditions.length === 0 && medications.length === 0 ? "Skip" : `Continue →`}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
