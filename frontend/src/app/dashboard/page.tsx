"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { MacroRing } from "@/components/dashboard/MacroRing";
import { MealCard } from "@/components/dashboard/MealCard";
import { CONDITIONS, CONDITION_COLORS } from "@/lib/constants";
import { cn, formatCalories } from "@/lib/utils";

function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-2xl", className)} />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [mealPlan, setMealPlan] = useState<Record<string, unknown> | null>(null);
  const [workout, setWorkout] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("health-copilot-user-id");
    if (!id) {
      router.push("/onboarding/profile");
      return;
    }
    setUserId(id);

    Promise.all([
      api.getUserSummary(id),
      api.getMealPlan(id),
      api.getTodayWorkout(id),
    ])
      .then(([s, m, w]) => {
        setSummary(s as Record<string, unknown>);
        setMealPlan(m as Record<string, unknown>);
        setWorkout(w as Record<string, unknown>);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <SkeletonCard className="h-32" />
        <div className="grid md:grid-cols-3 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64 md:col-span-2" />
        </div>
        {[1,2,3].map((i) => <SkeletonCard key={i} className="h-20" />)}
      </div>
    );
  }

  const conditions = (summary?.condition_codes as string[]) || [];
  const macroTargets = mealPlan?.macro_targets as Record<string, number> | undefined;
  const meals = (mealPlan?.meals as unknown[]) || [];
  const todayDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-sm text-gray-400 font-medium">{todayDate}</div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            {summary?.name ? `Welcome back, ${summary.name}` : "Your Health Dashboard"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ask" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-sky-600 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            🤖 Ask AI
          </Link>
          {userId && (
            <button
              onClick={() => api.regeneratePlan(userId).then(() => window.location.reload())}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              🔄 Regenerate Plan
            </button>
          )}
        </div>
      </div>

      {/* Condition Banner */}
      {conditions.length > 0 && (
        <div className="bg-gradient-to-r from-violet-900 to-slate-900 text-white rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <div className="font-bold mb-1">Policy Engine Active — Multi-Constraint Mode</div>
              <div className="text-sm text-violet-200 mb-3">
                Your plan simultaneously satisfies all {conditions.length} condition constraint{conditions.length > 1 ? "s" : ""}.
                Most Restrictive Wins logic applied.
              </div>
              <div className="flex flex-wrap gap-2">
                {conditions.map((code) => {
                  const cond = CONDITIONS.find((c) => c.code === code);
                  return (
                    <span key={code} className={cn("metric-chip text-xs border", CONDITION_COLORS[code] || "bg-gray-100 text-gray-600 border-gray-200")}>
                      {cond?.icon} {cond?.label || code}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Calorie Target",  value: macroTargets ? `${formatCalories(macroTargets.calories)} kcal` : "—", icon: "🔥", color: "text-orange-600" },
          { label: "Protein Target",  value: macroTargets ? `${Math.round(macroTargets.protein_g)}g` : "—",        icon: "💪", color: "text-violet-600" },
          { label: "Carb Target",     value: macroTargets ? `${Math.round(macroTargets.carbs_g)}g` : "—",          icon: "🌾", color: "text-sky-600" },
          { label: "Goal",            value: summary?.primary_goal ? String(summary.primary_goal).replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "—", icon: "🎯", color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={cn("text-xl font-black", stat.color)}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Macro Ring */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="font-bold text-gray-900 mb-1">Today&apos;s Nutrition</div>
          <div className="text-xs text-gray-400 mb-5">Plan vs Target</div>
          {mealPlan ? (
            <MacroRing
              calories={(mealPlan.total_calories as number) || 0}
              targetCalories={macroTargets?.calories || 2000}
              protein={(mealPlan.total_protein_g as number) || 0}
              carbs={(mealPlan.total_carbs_g as number) || 0}
              fat={(mealPlan.total_fat_g as number) || 0}
              targetProtein={macroTargets?.protein_g}
              targetCarbs={macroTargets?.carbs_g}
              targetFat={macroTargets?.fat_g}
            />
          ) : (
            <div className="h-48 shimmer rounded-xl" />
          )}
        </div>

        {/* Today's Workout */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-gray-900">Today&apos;s Workout</div>
              <div className="text-xs text-gray-400">{new Date().toLocaleDateString("en-US", { weekday: "long" })}</div>
            </div>
            <Link href="/dashboard/workouts" className="text-sm text-sky-600 font-semibold hover:text-sky-700">
              Full plan →
            </Link>
          </div>

          {workout ? (
            (workout.is_rest_day as boolean) ? (
              <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-4xl">😴</span>
                <div>
                  <div className="font-bold text-emerald-800">Rest Day</div>
                  <div className="text-sm text-emerald-600">Recovery is part of training. Light stretching is encouraged.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {((workout.templates as unknown[]) || []).map((t: unknown) => {
                  const template = t as Record<string, unknown>;
                  return (
                    <div key={String(template.id)} className="p-4 bg-gradient-to-r from-sky-50 to-violet-50 rounded-2xl border border-sky-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-gray-900">{String(template.name)}</div>
                        <span className="metric-chip metric-chip-blue">{String(template.duration_min || 30)} min</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{String(template.description || "")}</div>
                      <div className="flex flex-wrap gap-1">
                        {((template.equipment as string[]) || []).map((eq: string) => (
                          <span key={eq} className="text-xs bg-white px-2 py-1 rounded-lg border border-gray-200 text-gray-600">{eq}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="h-32 shimmer rounded-xl" />
          )}
        </div>
      </div>

      {/* Meal Plan */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Today&apos;s Meal Plan</h2>
            <p className="text-sm text-gray-400">Condition-aware · Explainable · AI-optimized</p>
          </div>
          <Link href="/dashboard/nutrition" className="text-sm text-sky-600 font-semibold hover:text-sky-700">
            Full nutrition →
          </Link>
        </div>

        {meals.length > 0 ? (
          <div className="space-y-3">
            {meals.map((meal) => (
              <MealCard
                key={(meal as Record<string, unknown>).slot as string}
                mealSlot={meal as Parameters<typeof MealCard>[0]["mealSlot"]}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="text-4xl mb-3">🥗</div>
            <div className="font-bold text-gray-900 mb-1">Generating your meal plan...</div>
            <div className="text-gray-500 text-sm">The engine is applying your health constraints.</div>
          </div>
        )}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/dashboard/lifestyle", label: "Lifestyle Tips",  icon: "🌿", desc: "Sleep, hydration, stress" },
          { href: "/dashboard/progress",  label: "Log Progress",    icon: "📊", desc: "Track your metrics" },
          { href: "/dashboard/ask",       label: "AI Copilot",      icon: "🤖", desc: "Ask health questions" },
          { href: "/dashboard/workouts",  label: "Full Workout Plan",icon: "💪", desc: "Week schedule" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
            <div className="font-bold text-gray-900 text-sm">{item.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
