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
}

interface MealCardProps {
  mealSlot: MealSlot;
  onExplainFood?: (foodId: string) => void;
}

export function MealCard({ mealSlot, onExplainFood }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const label = MEAL_SLOT_LABELS[mealSlot.slot] || mealSlot.slot;
  const icon = MEAL_SLOT_ICONS[mealSlot.slot] || "🍽️";

  if (mealSlot.items.length === 0) return null;

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
              {mealSlot.items.length} item{mealSlot.items.length > 1 ? "s" : ""} · {formatCalories(mealSlot.slot_calories)} kcal
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-3 text-sm text-gray-400">
            <span className="text-violet-600 font-semibold">{Math.round(mealSlot.slot_protein_g)}g protein</span>
          </div>
          <div className={cn("text-gray-400 transition-transform", expanded && "rotate-180")}>▼</div>
        </div>
      </button>

      {/* Food items */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50 animate-fade-in">
          {mealSlot.items.map((item) => (
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

              {/* AI reason or explain button */}
              {item.ai_reason ? (
                <div className="text-xs text-gray-500 bg-violet-50 rounded-lg px-3 py-2 border border-violet-100">
                  🤖 {item.ai_reason}
                </div>
              ) : onExplainFood && (
                <button
                  onClick={() => onExplainFood(item.food.id)}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 mt-1"
                >
                  🤖 Ask AI why this was recommended →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
