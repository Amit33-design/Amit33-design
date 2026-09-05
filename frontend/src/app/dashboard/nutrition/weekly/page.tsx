"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, resolveUserId } from "@/lib/api-client";
import { MEAL_SLOT_LABELS, MEAL_SLOT_ICONS } from "@/lib/constants";
import { RECIPES } from "@/lib/recipes-data";
import { cn } from "@/lib/utils";

interface WeekItem {
  food: { id: string; name: string; name_local: string | null };
  quantity_g: number;
  calories: number;
  protein_g: number;
}
interface WeekMeal { slot: string; slot_calories: number; items: WeekItem[] }
interface WeekDay {
  day_offset: number;
  date: string;
  weekday: string;
  weekday_short: string;
  plan: { meals: WeekMeal[]; total_calories: number; total_protein_g: number; fit: { overall: number } };
}
interface GroceryItem { food_id: string; name: string; local: string | null; total_qty_g: number; times: number }
interface ConsistencyRow {
  key: string; label: string; unit: string; isLimit: boolean; target: number;
  average: number; days_off: number; days_total: number;
  pattern: "consistent" | "occasional" | "fine"; message: string;
}
interface WeeklyPlan {
  week_start: string;
  week_end: string;
  avg_fit: number;
  days: WeekDay[];
  grocery: { label: string; items: GroceryItem[] }[];
  nutrient_consistency: ConsistencyRow[];
}

export default function WeeklyPlanPage() {
  const router = useRouter();
  const [week, setWeek] = useState<WeeklyPlan | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [openIngredients, setOpenIngredients] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = resolveUserId();
    if (!id) { router.push("/onboarding/profile"); return; }
    api.getWeeklyPlan(id).then((w) => setWeek(w as WeeklyPlan));
  }, [router]);

  const day = week?.days[activeDay];
  const totalGroceryItems = useMemo(
    () => (week ? week.grocery.reduce((s, g) => s + g.items.length, 0) : 0),
    [week]
  );

  const toggleChecked = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const copyList = async () => {
    if (!week) return;
    const lines: string[] = [`Grocery list ${week.week_start} → ${week.week_end}`, ""];
    for (const g of week.grocery) {
      lines.push(`${g.label}:`);
      for (const it of g.items) {
        lines.push(`  □ ${it.name}${it.local ? ` (${it.local})` : ""} — ~${it.total_qty_g}g for the week (${it.times}×)`);
        const recipe = RECIPES[it.food_id];
        if (recipe) {
          for (const ing of recipe.ingredients) lines.push(`      · ${ing}`);
        }
      }
      lines.push("");
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/nutrition" className="text-sm text-sky-700 font-semibold hover:text-sky-900 inline-flex items-center min-h-[44px] px-1">← Today&apos;s plan</Link>
          <h1 className="text-2xl font-black text-gray-900 mt-1">7-Day Meal Plan</h1>
          <p className="text-gray-500 text-sm mt-1">
            {week ? `${week.week_start} → ${week.week_end} · meals rotate daily so your week stays varied` : "Building your week..."}
          </p>
        </div>
        {week && (
          <span className={cn(
            "px-3 py-1.5 rounded-xl text-sm font-black",
            week.avg_fit >= 85 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          )}>
            🎯 {week.avg_fit}% avg match
          </span>
        )}
      </div>

      {!week ? (
        <div className="space-y-4">
          <div className="h-12 shimmer rounded-2xl" />
          <div className="h-96 shimmer rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Day selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {week.days.map((d, i) => (
              <button
                key={d.date}
                onClick={() => setActiveDay(i)}
                className={cn(
                  "shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all",
                  i === activeDay
                    ? "bg-gradient-to-r from-sky-700 to-violet-700 text-white border-transparent shadow-lg shadow-violet-500/25"
                    : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                )}
              >
                <div>{i === 0 ? "Today" : d.weekday_short}</div>
                <div className={cn("text-xs font-medium", i === activeDay ? "text-white/90" : "text-gray-500")}>
                  {d.date.slice(5)}
                </div>
              </button>
            ))}
          </div>

          {/* Selected day */}
          {day && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-gray-900">{day.weekday}, {day.date}</div>
                <div className="text-sm text-gray-500">
                  {day.plan.total_calories} kcal · {Math.round(day.plan.total_protein_g)}g protein ·{" "}
                  <span className="font-semibold text-violet-600">{day.plan.fit.overall}% match</span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {day.plan.meals.map((meal) => (
                  <div key={meal.slot} className="p-5 flex gap-4">
                    <div className="shrink-0 w-28">
                      <div className="text-lg">{MEAL_SLOT_ICONS[meal.slot] || "🍽"}</div>
                      <div className="text-sm font-bold text-gray-900">{MEAL_SLOT_LABELS[meal.slot] || meal.slot}</div>
                      <div className="text-xs text-gray-500">{meal.slot_calories} kcal</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {meal.items.map((item) => (
                        <div key={item.food.id + meal.slot} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-gray-800 font-medium">
                            {item.food.name}
                            {item.food.name_local && <span className="text-gray-500 font-normal"> ({item.food.name_local})</span>}
                          </span>
                          <span className="text-gray-500 text-xs shrink-0">{item.quantity_g}g · {item.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrient patterns across the week */}
          {week.nutrient_consistency?.length ? (() => {
            const flagged = week.nutrient_consistency.filter((n) => n.pattern !== "fine");
            const steady = week.nutrient_consistency.length - flagged.length;
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    <span className="font-bold text-gray-900 text-sm">Nutrient Patterns This Week</span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-black",
                    flagged.length === 0 ? "bg-emerald-100 text-emerald-700"
                      : flagged.some((n) => n.pattern === "consistent") ? "bg-orange-100 text-orange-700"
                      : "bg-amber-100 text-amber-700"
                  )}>
                    {steady}/{week.nutrient_consistency.length} steady
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  One low day is noise — your body buffers day to day. A nutrient that&apos;s short most of the week is
                  the pattern that actually shows up in bloodwork.
                </p>

                {flagged.length === 0 ? (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    ✅ Every nutrient stayed on target across all seven days.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {flagged.map((n) => (
                      <div
                        key={n.key}
                        className={cn(
                          "rounded-xl border p-3",
                          n.pattern === "consistent" ? "border-orange-200 bg-orange-50/60" : "border-amber-200 bg-amber-50/50"
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className="text-sm font-bold text-gray-900">
                            {n.pattern === "consistent" ? "🔴" : "🟡"} {n.label}
                          </span>
                          <span className="text-xs font-bold text-gray-600 tabular-nums whitespace-nowrap">
                            avg {n.average}{n.unit} vs {n.target}{n.unit}
                          </span>
                        </div>
                        <div className="flex gap-1 my-1.5">
                          {Array.from({ length: n.days_total }).map((_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "h-1.5 flex-1 rounded-full",
                                i < n.days_off
                                  ? n.pattern === "consistent" ? "bg-orange-400" : "bg-amber-400"
                                  : "bg-emerald-400"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : null}

          {/* Grocery list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-gray-900">🛒 Grocery List for the Week</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {totalGroceryItems} items across {week.grocery.length} categories — quantities cover all 7 days
                </div>
              </div>
              <button
                onClick={copyList}
                className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 text-gray-700 hover:border-violet-300 transition-all"
              >
                {copied ? "✓ Copied!" : "📋 Copy list"}
              </button>
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-6">
              {week.grocery.map((group) => (
                <div key={group.label}>
                  <div className="text-sm font-bold text-gray-900 mb-2">{group.label}</div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const key = `${group.label}:${item.name}`;
                      const done = checked.has(key);
                      const recipe = RECIPES[item.food_id];
                      const showingIngredients = openIngredients.has(key);
                      return (
                        <div key={key}>
                          <div className="w-full flex items-center gap-2.5 py-1 group">
                            <button
                              onClick={() => toggleChecked(key)}
                              className="flex items-center gap-2.5 flex-1 min-w-0 text-left py-2 min-h-[40px]"
                            >
                              <span className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center text-white text-xs shrink-0 transition-all",
                                done ? "bg-emerald-500 border-emerald-500" : "border-gray-300 group-hover:border-violet-400"
                              )}>
                                {done && "✓"}
                              </span>
                              <span className={cn("text-sm flex-1 min-w-0", done ? "text-gray-500 line-through" : "text-gray-700")}>
                                {item.name}
                                {item.local && <span className="text-gray-500"> ({item.local})</span>}
                              </span>
                            </button>
                            <span className="text-xs shrink-0 text-gray-500">
                              ~{item.total_qty_g}g · {item.times}×
                            </span>
                            {recipe && (
                              <button
                                onClick={() =>
                                  setOpenIngredients((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(key)) next.delete(key); else next.add(key);
                                    return next;
                                  })
                                }
                                className={cn(
                                  "text-xs shrink-0 px-2.5 min-w-[40px] min-h-[40px] rounded-md font-semibold transition-all",
                                  showingIngredients ? "bg-violet-100 text-violet-700" : "bg-gray-50 text-gray-600 hover:text-violet-700"
                                )}
                                title="Show shopping ingredients for this dish"
                              >
                                🧾
                              </button>
                            )}
                          </div>
                          {recipe && showingIngredients && (
                            <div className="ml-6 mb-2 mt-1 p-3 bg-violet-50/60 border border-violet-100 rounded-xl">
                              <div className="text-xs font-bold text-violet-800 mb-1.5">
                                To buy — you&apos;ll make this {item.times}× this week (recipe makes {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}):
                              </div>
                              <ul className="space-y-0.5">
                                {recipe.ingredients.map((ing) => (
                                  <li key={ing} className="text-xs text-gray-600 flex gap-1.5">
                                    <span className="text-violet-700 shrink-0">•</span>
                                    <span>{ing}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                💡 Quantities are the total for the week based on your tuned portions. For cooked dishes, tap 🧾 to see the raw
                ingredients to buy — the copied list includes them automatically.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
