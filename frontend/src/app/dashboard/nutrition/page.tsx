"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, resolveUserId } from "@/lib/api-client";
import { MealCard } from "@/components/dashboard/MealCard";
import { MacroRing } from "@/components/dashboard/MacroRing";
import { formatCalories } from "@/lib/utils";

export default function NutritionPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = resolveUserId();
    if (!id) { router.push("/onboarding/profile"); return; }
    api.getMealPlan(id).then((p) => { setPlan(p as Record<string, unknown>); setLoading(false); });
  }, [router]);

  const macros = plan?.macro_targets as Record<string, number> | undefined;
  const meals = (plan?.meals as unknown[]) || [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Nutrition Plan</h1>
        <p className="text-gray-400 text-sm mt-1">Condition-aware · Constraint-optimized · Explainable</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map((i) => <div key={i} className="h-64 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Macro summary */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 flex flex-col items-center">
              <MacroRing
                calories={(plan?.total_calories as number) || 0}
                targetCalories={macros?.calories || 2000}
                protein={(plan?.total_protein_g as number) || 0}
                carbs={(plan?.total_carbs_g as number) || 0}
                fat={(plan?.total_fat_g as number) || 0}
                targetProtein={macros?.protein_g}
                targetCarbs={macros?.carbs_g}
                targetFat={macros?.fat_g}
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4 content-start">
              {macros && [
                { label: "Calorie Target",  value: `${formatCalories(macros.calories)} kcal`, sub: "Daily goal",       color: "bg-orange-500",  icon: "🔥" },
                { label: "Protein",         value: `${Math.round(macros.protein_g)}g`,         sub: `${macros.protein_g_per_kg}g/kg body`,  color: "bg-violet-500", icon: "💪" },
                { label: "Carbohydrates",   value: `${Math.round(macros.carbs_g)}g`,           sub: "Daily target",     color: "bg-sky-500",    icon: "🌾" },
                { label: "Fat",             value: `${Math.round(macros.fat_g)}g`,             sub: "Healthy fats",     color: "bg-amber-500",  icon: "🫒" },
                { label: "Fiber",           value: `${Math.round(macros.fiber_g)}g`,           sub: "Minimum target",   color: "bg-emerald-500",icon: "🥦" },
                { label: "Plan Calories",   value: `${formatCalories((plan?.total_calories as number) || 0)} kcal`, sub: "Generated plan", color: "bg-indigo-500", icon: "📋" },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
                  <div className={`w-8 h-8 ${m.color} rounded-xl flex items-center justify-center text-sm mb-3`}>{m.icon}</div>
                  <div className="text-xl font-black text-gray-900">{m.value}</div>
                  <div className="text-sm font-semibold text-gray-700">{m.label}</div>
                  <div className="text-xs text-gray-400">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          {plan?.ai_summary && (
            <div className="bg-gradient-to-br from-violet-50 to-sky-50 border border-violet-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <span className="font-bold text-violet-800">AI Plan Explanation</span>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {String(plan.ai_summary)}
              </div>
            </div>
          )}

          {/* Meal plan */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Today&apos;s Meals</h2>
            <div className="space-y-3">
              {meals.map((meal) => (
                <MealCard
                  key={(meal as Record<string, unknown>).slot as string}
                  mealSlot={meal as Parameters<typeof MealCard>[0]["mealSlot"]}
                  expanded
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
