"use client";
import { LabResults } from "@/components/dashboard/LabResults";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { CONDITIONS, MEDICATIONS } from "@/lib/constants";
import { KIDNEY_STAGES } from "@/lib/kidney-potassium";
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
  const kidneyStage = conditions.find((c) => c.condition_code === "CKD")?.stage ?? "";
  const setKidneyStage = (stage: string) =>
    setConditions(conditions.map((c) => (c.condition_code === "CKD" ? { ...c, stage } : c)));

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
            <strong>Important:</strong> These selections add clinical safety rules to your plan.
            If you have multiple conditions, we make sure every recommendation is safe for all of them at the same time.
          </div>
        </div>

        {/* Multi-constraint visualization */}
        {conditions.length >= 2 && (
          <div className="p-4 bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-200 rounded-xl animate-fade-in">
            <div className="text-sm font-semibold text-violet-800 mb-2">🩺 Multiple Conditions Detected</div>
            <div className="text-sm text-gray-600">
              {conditions.length} conditions selected. Where rules conflict, we always follow the stricter one
              to keep you safe (e.g. if one condition allows 2300mg sodium and another allows only 1500mg, we use 1500mg).
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
                {/* Kidney disease is not one condition for diet purposes: dialysis,
                    transplant and early CKD need very different potassium limits. */}
                {cond.code === "CKD" && isSelected && (
                  <fieldset className="px-5 pb-5 -mt-1 animate-fade-in">
                    <legend className="text-sm font-semibold text-violet-900 mb-1">Which describes you?</legend>
                    <p className="text-xs text-gray-700 mb-2">This sets your potassium limit. If you're unsure, ask your kidney team for your stage or eGFR.</p>
                    <div className="space-y-1.5">
                      {[...KIDNEY_STAGES, { code: "", label: "Not sure", detail: "We'll use a moderate 3000 mg limit until you know" }].map((st) => (
                        <label key={st.code || "unsure"} className={cn(
                          "flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer min-h-[44px]",
                          kidneyStage === st.code ? "border-violet-500 bg-white" : "border-violet-200 bg-violet-50/50"
                        )}>
                          <input type="radio" name="kidney-stage" value={st.code} checked={kidneyStage === st.code}
                            onChange={() => setKidneyStage(st.code)} className="mt-1 accent-violet-600" />
                          <span>
                            <span className="block text-sm font-semibold text-gray-900">{st.label}</span>
                            <span className="block text-xs text-gray-700">{st.detail}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
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
                        <div className="text-xs text-sky-700 mt-0.5 animate-fade-in">{med.note}</div>
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

        {/* Optional: labs can suggest conditions the user did not know to pick.
            Collapsed by default — most people will not have a report to hand,
            and this step must stay quick to skip. */}
        <details className="rounded-2xl border border-gray-200 bg-white p-4">
          <summary className="cursor-pointer min-h-[40px] flex items-center font-semibold text-gray-800">
            🧪 Have a recent blood test? Add results (optional)
          </summary>
          <div className="mt-3">
            <LabResults compact />
          </div>
        </details>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">← Back</button>
          <button
            onClick={() => router.push("/onboarding/diet")}
            className="flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-sky-700 to-violet-700 text-white hover:scale-105 transition-all shadow-glow-blue"
          >
            {conditions.length === 0 && medications.length === 0 ? "Skip" : `Continue →`}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
