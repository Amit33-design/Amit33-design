"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { api } from "@/lib/api-client";
import { setStoredUserId } from "@/store/onboarding-store";
import { cn } from "@/lib/utils";
import { DRINK_TYPES, weeklyAlcohol, standardDrinks, legacyUnitsToDrinks, type DrinkEntry, type DrinkType } from "@/lib/alcohol";

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

  // An old profile only has the legacy "units" number; show it as drinks
  // until the user picks real servings, which then replace it.
  const entries: DrinkEntry[] = lifestyle.alcohol_entries ?? [];
  const legacyDrinks = entries.length ? 0 : legacyUnitsToDrinks(Number(lifestyle.alcohol_units_week) || 0);
  const alcoholTotals = entries.length
    ? weeklyAlcohol(entries)
    : { drinks: legacyDrinks, kcal: Math.round(legacyDrinks * 14 * 7), ethanol_g: 0, carbs_g: 0 };
  const countOf = (t: DrinkType) => entries.find((e) => e.type === t)?.count ?? 0;
  const abvOf = (t: DrinkType) => entries.find((e) => e.type === t)?.abv;
  const setDrink = (t: DrinkType, patch: Partial<DrinkEntry>) => {
    const next = [...entries.filter((e) => e.type !== t)];
    const cur = entries.find((e) => e.type === t) ?? { type: t, count: 0 };
    const merged = { ...cur, ...patch };
    if (merged.count > 0) next.push(merged);
    setLifestyle({ alcohol_entries: next, alcohol_units_week: "" });
  };

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
          diet_type: [diet.cuisine_type, diet.protein_preference].filter(Boolean).join("_") || null,
          allergies: diet.allergies,
          intolerances: diet.intolerances,
        },
        lifestyle: {
          sleep_hours: lifestyle.sleep_hours ? Number(lifestyle.sleep_hours) : null,
          stress_level: lifestyle.stress_level || null,
          smoking_status: lifestyle.smoking_status || null,
          // The backend still speaks UK units; send it a CORRECT figure
          // (drinks x 14/8) alongside the standard-drink count.
          alcohol_units_week: alcoholTotals.drinks > 0 ? Math.round((alcoholTotals.drinks * 14) / 8 * 10) / 10 : null,
          alcohol_drinks_week: alcoholTotals.drinks > 0 ? alcoholTotals.drinks : null,
          drinking_days_week: lifestyle.drinking_days_week ? Number(lifestyle.drinking_days_week) : null,
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
          <label htmlFor="lifestyle-sleep" className="block text-sm font-semibold text-gray-700 mb-2">Average Sleep Hours per Night</label>
          <div className="flex items-center gap-3">
            <input
              id="lifestyle-sleep"
              type="range"
              min={3}
              max={12}
              step={0.5}
              value={lifestyle.sleep_hours || 7}
              onChange={(e) => setLifestyle({ sleep_hours: Number(e.target.value) })}
              className="flex-1 h-11 accent-sky-700 cursor-pointer"
            />
            <span className="w-16 text-center text-xl font-bold text-gray-900">
              {lifestyle.sleep_hours || 7}h
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">Recommended: 7–9 hours for adults</div>
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

        {/* Alcohol — what you actually drink, in real sizes */}
        <div>
          <div className="block text-sm font-semibold text-gray-700 mb-1">Alcohol — a typical week</div>
          <p className="text-xs text-gray-600 mb-3">
            Tap in what you usually drink. Sizes are shown so nothing gets under-counted — a home &ldquo;peg&rdquo; or glass is often bigger than you&apos;d think.
          </p>
          <div className="space-y-2">
            {(Object.keys(DRINK_TYPES) as DrinkType[]).map((t) => {
              const spec = DRINK_TYPES[t];
              const n = countOf(t);
              return (
                <div key={t} className={cn("rounded-xl border px-3 py-2", n > 0 ? "border-sky-300 bg-sky-50/50" : "border-gray-200")}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">{spec.label}</div>
                      <div className="text-xs text-gray-600">{spec.ml} ml · {spec.abv}% · {standardDrinks(spec.ml, abvOf(t) ?? spec.abv).toFixed(1)} standard drinks each</div>
                    </div>
                    <button type="button" aria-label={`Remove one ${spec.label}`} disabled={n === 0}
                      onClick={() => setDrink(t, { count: Math.max(0, n - 1) })}
                      className="w-10 h-10 rounded-lg border border-gray-300 text-lg font-bold text-gray-700 disabled:opacity-40">−</button>
                    <span className="w-8 text-center font-bold text-gray-900 tabular-nums" aria-label={`${n} per week`}>{n}</span>
                    <button type="button" aria-label={`Add one ${spec.label}`}
                      onClick={() => setDrink(t, { count: Math.min(60, n + 1) })}
                      className="w-10 h-10 rounded-lg border border-gray-300 text-lg font-bold text-gray-700">+</button>
                  </div>
                  {n > 0 && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      Stronger or weaker than {spec.abv}%?
                      <input type="number" min={0.5} max={70} step={0.5} inputMode="decimal"
                        value={abvOf(t) ?? ""} placeholder={String(spec.abv)}
                        onChange={(e) => setDrink(t, { abv: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 text-gray-900" aria-label={`Strength of ${spec.label}, percent ABV`} />
                      % ABV
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          {alcoholTotals.drinks > 0 && (
            <div className="mt-3">
              <div className="text-sm font-semibold text-gray-700 mb-2">On how many days a week?</div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button key={d} type="button" onClick={() => setLifestyle({ drinking_days_week: d })}
                    aria-pressed={Number(lifestyle.drinking_days_week) === d}
                    className={cn("w-11 h-11 rounded-xl border-2 text-sm font-semibold",
                      Number(lifestyle.drinking_days_week) === d ? "border-sky-600 bg-sky-50 text-sky-800" : "border-gray-200 text-gray-600")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-sm text-gray-700" aria-live="polite">
            {alcoholTotals.drinks > 0
              ? <>≈ <strong>{alcoholTotals.drinks}</strong> standard drinks a week · about <strong>{alcoholTotals.kcal}</strong> kcal from drinks.
                  {!entries.length && <span className="text-gray-600"> (converted from your earlier entry — pick your drinks above to be exact)</span>}</>
              : "None — that's fine, leave it empty."}
          </div>
          <div className="text-xs text-gray-600 mt-1">A standard drink is 14 g of alcohol — about a 355 ml beer, a 150 ml glass of wine, or a 44 ml shot.</div>
        </div>

        {/* Water */}
        <div>
          <label htmlFor="lifestyle-water" className="block text-sm font-semibold text-gray-700 mb-2">Daily Water Intake (liters)</label>
          <input
            id="lifestyle-water"
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
                ? "bg-gradient-to-r from-emerald-700 to-sky-700 text-white hover:scale-105 shadow-glow-green"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
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
