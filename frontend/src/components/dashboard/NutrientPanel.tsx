"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface NutrientRow {
  key: string;
  label: string;
  unit: string;
  actual: number;
  target: number;
  percent: number;
  isLimit: boolean;
  status: "low" | "good" | "over";
  why: string;
}

export interface NutrientActionRow {
  nutrient: string;
  severity: "critical" | "watch" | "tip";
  headline: string;
  detail: string;
}

interface Props {
  nutrients: NutrientRow[];
  actions: NutrientActionRow[];
  glycemicLoad?: { value: number; band: string; note: string };
  naK?: { ratio: number; status: string };
  proteinDistribution?: {
    per_meal_target_g: number;
    meals: { slot: string; protein_g: number; meets: boolean }[];
    meals_meeting: number;
    main_meals: number;
    verdict: string;
  };
  proteinQuality?: {
    total_protein_g: number;
    usable_protein_g: number;
    quality_score: number;
    meals_triggering: number;
    main_meals: number;
    headline: string;
    advice: string | null;
    meals: { slot: string; leucine_g: number; triggers_synthesis: boolean; complementary: boolean }[];
  };
}

const SEVERITY = {
  critical: { chip: "bg-red-100 text-red-700", card: "border-red-200 bg-red-50/60", icon: "🚨" },
  watch: { chip: "bg-amber-100 text-amber-700", card: "border-amber-200 bg-amber-50/60", icon: "⚠️" },
  tip: { chip: "bg-sky-100 text-sky-700", card: "border-sky-200 bg-sky-50/60", icon: "💡" },
} as const;

const SLOT_SHORT: Record<string, string> = {
  breakfast: "Breakfast", mid_morning: "Mid-AM", lunch: "Lunch",
  evening_snack: "Snack", dinner: "Dinner",
};

export function NutrientPanel({ nutrients, actions, glycemicLoad, naK, proteinDistribution, proteinQuality }: Props) {
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  if (!nutrients?.length) return null;

  const onTarget = nutrients.filter((n) => n.status === "good").length;

  return (
    <div className="space-y-4">
      {/* Nutrient adequacy */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔬</span>
            <span className="font-bold text-gray-900 text-sm">Nutrient Adequacy</span>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-black",
            onTarget === nutrients.length ? "bg-emerald-100 text-emerald-700"
              : onTarget >= nutrients.length - 2 ? "bg-amber-100 text-amber-700"
              : "bg-orange-100 text-orange-700"
          )}>
            {onTarget}/{nutrients.length} on target
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Vitamins and minerals — the layer most calorie apps leave out. Targets are set from your age, sex, diet and conditions.
        </p>

        <div className="space-y-2.5">
          {nutrients.map((n) => {
            const width = Math.max(3, Math.min(100, n.isLimit ? n.percent : Math.min(n.percent, 100)));
            const bar = n.status === "low" ? "bg-orange-400"
              : n.status === "over" ? "bg-red-400" : "bg-emerald-500";
            return (
              <div key={n.key}>
                <button
                  onClick={() => setOpenWhy(openWhy === n.key ? null : n.key)}
                  className="w-full text-left group py-2 -my-0.5"
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs mb-1">
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                      {n.label}
                      {n.isLimit && <span className="text-gray-500 font-normal">(limit)</span>}
                      <span className="text-gray-500 group-hover:text-violet-700 transition-colors">ⓘ</span>
                    </span>
                    <span className={cn(
                      "font-bold tabular-nums",
                      n.status === "low" ? "text-orange-700" : n.status === "over" ? "text-red-600" : "text-gray-700"
                    )}>
                      {n.actual}<span className="text-gray-500 font-normal"> / {n.target} {n.unit}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${width}%` }} />
                  </div>
                </button>
                {openWhy === n.key && (
                  <div className="mt-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 animate-fade-in">
                    {n.why}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Protein timing + glycemic load + Na:K */}
      <div className="grid sm:grid-cols-2 gap-4">
        {proteinDistribution && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💪</span>
              <span className="font-bold text-gray-900 text-sm">Protein Timing</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Muscle responds to protein per meal, not per day — aim for ~{proteinDistribution.per_meal_target_g}g in each main meal.
            </p>
            <div className="flex gap-1.5 mb-3">
              {proteinDistribution.meals.map((m) => (
                <div key={m.slot} className="flex-1 text-center">
                  <div className={cn(
                    "rounded-lg py-1.5 text-xs font-bold",
                    m.meets ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {m.protein_g}g
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">{SLOT_SHORT[m.slot] || m.slot}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{proteinDistribution.verdict}</p>

            {proteinQuality && proteinQuality.total_protein_g > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-700">Protein your body can use</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-xs font-black",
                    proteinQuality.quality_score >= 85 ? "bg-emerald-100 text-emerald-700"
                      : proteinQuality.quality_score >= 70 ? "bg-amber-100 text-amber-700"
                      : "bg-orange-100 text-orange-700"
                  )}>
                    {proteinQuality.usable_protein_g}g of {proteinQuality.total_protein_g}g
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, proteinQuality.quality_score)}%` }} />
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {proteinQuality.meals
                    .filter((m) => ["breakfast", "lunch", "dinner"].includes(m.slot))
                    .map((m) => (
                      <span key={m.slot} className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                        m.triggers_synthesis ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {SLOT_SHORT[m.slot] || m.slot} {m.leucine_g}g leucine{m.complementary ? " · paired" : ""}
                      </span>
                    ))}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Grams of protein aren&apos;t equal — the body can only build with what supplies every essential amino
                  acid, and each meal needs about 2.5g of leucine to switch muscle repair on.
                </p>
                {proteinQuality.advice && (
                  <p className="text-[11px] text-violet-800 bg-violet-50 border border-violet-100 rounded-lg p-2 mt-2 leading-relaxed">
                    {proteinQuality.advice}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
          {glycemicLoad && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span className="text-lg">🩸</span> Glycemic Load
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-xs font-black capitalize",
                  glycemicLoad.band === "low" ? "bg-emerald-100 text-emerald-700"
                    : glycemicLoad.band === "moderate" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                )}>
                  {glycemicLoad.value} · {glycemicLoad.band}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{glycemicLoad.note}</p>
            </div>
          )}
          {naK && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span className="text-lg">⚖️</span> Sodium : Potassium
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-xs font-black",
                  naK.status === "good" ? "bg-emerald-100 text-emerald-700"
                    : naK.status === "watch" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                )}>
                  {naK.ratio} : 1
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                This balance predicts blood pressure more reliably than sodium alone — potassium actively counteracts
                sodium. Aim for 1.0 or below.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dietitian actions */}
      {actions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🩺</span>
            <span className="font-bold text-gray-900 text-sm">What To Do About It</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Specific, actionable steps for the gaps found in today&apos;s plan.</p>
          <div className="space-y-2.5">
            {actions.map((a) => {
              const s = SEVERITY[a.severity];
              return (
                <div key={a.nutrient + a.headline} className={cn("rounded-xl border p-3.5", s.card)}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-base leading-none mt-0.5">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{a.headline}</span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide", s.chip)}>
                          {a.nutrient}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{a.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
