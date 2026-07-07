"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, resolveUserId } from "@/lib/api-client";
import { MEAL_SLOT_LABELS, MEAL_SLOT_ICONS } from "@/lib/constants";
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
interface GroceryItem { name: string; local: string | null; total_qty_g: number; times: number }
interface WeeklyPlan {
  week_start: string;
  week_end: string;
  avg_fit: number;
  days: WeekDay[];
  grocery: { label: string; items: GroceryItem[] }[];
}

export default function WeeklyPlanPage() {
  const router = useRouter();
  const [week, setWeek] = useState<WeeklyPlan | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(new Set());
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
      for (const it of g.items) lines.push(`  □ ${it.name}${it.local ? ` (${it.local})` : ""} — ~${it.total_qty_g}g for the week`);
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
          <Link href="/dashboard/nutrition" className="text-sm text-sky-600 font-semibold hover:text-sky-700">← Today&apos;s plan</Link>
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
                    ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white border-transparent shadow-lg shadow-violet-500/25"
                    : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                )}
              >
                <div>{i === 0 ? "Today" : d.weekday_short}</div>
                <div className={cn("text-xs font-medium", i === activeDay ? "text-white/80" : "text-gray-400")}>
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
                      <div className="text-xs text-gray-400">{meal.slot_calories} kcal</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {meal.items.map((item) => (
                        <div key={item.food.id + meal.slot} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-gray-800 font-medium">
                            {item.food.name}
                            {item.food.name_local && <span className="text-gray-400 font-normal"> ({item.food.name_local})</span>}
                          </span>
                          <span className="text-gray-400 text-xs shrink-0">{item.quantity_g}g · {item.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grocery list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-gray-900">🛒 Grocery List for the Week</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {totalGroceryItems} items across {week.grocery.length} categories — quantities cover all 7 days
                </div>
              </div>
              <button
                onClick={copyList}
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 text-gray-700 hover:border-violet-300 transition-all"
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
                      return (
                        <button
                          key={key}
                          onClick={() => toggleChecked(key)}
                          className="w-full flex items-center gap-2.5 text-left py-1 group"
                        >
                          <span className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center text-white text-xs shrink-0 transition-all",
                            done ? "bg-emerald-500 border-emerald-500" : "border-gray-300 group-hover:border-violet-400"
                          )}>
                            {done && "✓"}
                          </span>
                          <span className={cn("text-sm flex-1", done ? "text-gray-300 line-through" : "text-gray-700")}>
                            {item.name}
                            {item.local && <span className="text-gray-400"> ({item.local})</span>}
                          </span>
                          <span className={cn("text-xs shrink-0", done ? "text-gray-300" : "text-gray-400")}>
                            ~{item.total_qty_g}g · {item.times}×
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                💡 Quantities are the total for the week based on your tuned portions. Composite dishes (curries, bowls) list the
                prepared amount — check each recipe on the Recipes page for exact ingredients.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
