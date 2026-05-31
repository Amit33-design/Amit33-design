"use client";
import { useState } from "react";
import { ExplainBadge } from "@/components/shared/ExplainBadge";
import { MEAL_SLOT_LABELS, MEAL_SLOT_ICONS } from "@/lib/constants";
import { formatCalories, formatQuantity, cn } from "@/lib/utils";

interface FoodItem {
  id: string;
  name: string;
  name_local?: string;
  food_group?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  glycemic_index?: number;
  is_low_gi?: boolean;
  is_high_fiber?: boolean;
}

interface MealItemData {
  id: string;
  food: FoodItem;
  meal_slot: string;
  quantity_g: number;
  reason_tags: string[];
  ai_reason?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface MealSlot {
  slot: string;
  items: MealItemData[];
  slot_calories: number;
  slot_protein_g: number;
  alternatives?: MealItemData[];
}

interface MealCardProps {
  mealSlot: MealSlot;
  onExplainFood?: (foodId: string) => void;
  expanded?: boolean;
}

export function MealCard({ mealSlot, onExplainFood, expanded: defaultExpanded = false }: MealCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [items, setItems] = useState<MealItemData[]>(mealSlot.items);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const label = MEAL_SLOT_LABELS[mealSlot.slot] || mealSlot.slot;
  const icon = MEAL_SLOT_ICONS[mealSlot.slot] || "🍽️";

  const alternatives = mealSlot.alternatives || [];
  // Alternatives still available to swap in (not already on the plate).
  const shownIds = new Set(items.map((i) => i.food.id));
  const availableAlts = alternatives.filter((a) => !shownIds.has(a.food.id));

  const slotCalories = items.reduce((s, i) => s + i.calories, 0);
  const slotProtein = items.reduce((s, i) => s + i.protein_g, 0);

  function swapItem(targetIndex: number, alt: MealItemData) {
    setItems((prev) => prev.map((it, i) => (i === targetIndex ? alt : it)));
    setSwapIndex(null);
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-violet-100 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <div className="font-bold text-gray-900">{label}</div>
            <div className="text-sm text-gray-500">
              {items.length} item{items.length > 1 ? "s" : ""} · {formatCalories(slotCalories)} kcal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-3 text-sm text-gray-400">
            <span className="text-violet-600 font-semibold">{Math.round(slotProtein)}g protein</span>
          </div>
          <div className={cn("text-gray-400 transition-transform", expanded && "rotate-180")}>▼</div>
        </div>
      </button>

      {/* Food items */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50 animate-fade-in">
          {items.map((item, index) => (
            <div key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{item.food.name}</span>
                    {item.food.name_local && (
                      <span className="text-sm text-gray-400">({item.food.name_local})</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {formatQuantity(item.quantity_g)} · {formatCalories(item.calories)} kcal
                  </div>
                </div>
                <div className="text-right text-sm shrink-0">
                  <div className="text-violet-600 font-bold">{Math.round(item.protein_g)}g P</div>
                  <div className="text-sky-600 font-bold">{Math.round(item.carbs_g)}g C</div>
                  <div className="text-orange-500 font-bold">{Math.round(item.fat_g)}g F</div>
                </div>
              </div>

              {/* Explanation badges */}
              {item.reason_tags && item.reason_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.reason_tags.map((tag) => (
                    <ExplainBadge key={tag} text={tag} variant="positive" />
                  ))}
                  {item.food.is_low_gi && <ExplainBadge text="Low GI" variant="positive" />}
                  {item.food.is_high_fiber && <ExplainBadge text="High Fiber" variant="positive" />}
                  {item.food.glycemic_index && (
                    <ExplainBadge text={`GI: ${item.food.glycemic_index}`} variant="neutral" />
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-1">
                {/* AI reason or explain button */}
                {item.ai_reason ? (
                  <div className="text-xs text-gray-500 bg-violet-50 rounded-lg px-3 py-2 border border-violet-100">
                    🤖 {item.ai_reason}
                  </div>
                ) : onExplainFood && (
                  <button
                    onClick={() => onExplainFood(item.food.id)}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1"
                  >
                    🤖 Ask AI why this was recommended →
                  </button>
                )}

                {availableAlts.length > 0 && (
                  <button
                    onClick={() => setSwapIndex(swapIndex === index ? null : index)}
                    className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                  >
                    ⇄ {swapIndex === index ? "Close options" : "Swap / more options"}
                  </button>
                )}
              </div>

              {/* Swap picker — alternative foods that fit this profile */}
              {swapIndex === index && availableAlts.length > 0 && (
                <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3 animate-fade-in">
                  <div className="text-xs font-semibold text-sky-800 mb-2">
                    Swap “{item.food.name}” for another {label.toLowerCase()} option — all safe for your profile:
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {availableAlts.map((alt) => (
                      <button
                        key={alt.food.id}
                        onClick={() => swapItem(index, alt)}
                        className="text-left bg-white rounded-lg border border-gray-100 hover:border-sky-300 hover:shadow-sm transition-all p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{alt.food.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">{formatCalories(alt.calories)} kcal</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {Math.round(alt.protein_g)}g P · {Math.round(alt.carbs_g)}g C · {Math.round(alt.fat_g)}g F
                        </div>
                        {alt.reason_tags?.length > 0 && (
                          <div className="text-[11px] text-emerald-600 mt-1 truncate">
                            {alt.reason_tags.slice(0, 3).join(" · ")}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
