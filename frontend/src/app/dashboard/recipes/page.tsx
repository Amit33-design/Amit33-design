"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, resolveUserId } from "@/lib/api-client";
import { RECIPES, Recipe } from "@/lib/recipes-data";
import { cn } from "@/lib/utils";

interface MealItem {
  food_id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  reason_tags?: string[];
}

interface MealSlot {
  slot: string;
  items: MealItem[];
  alternatives?: MealItem[];
}

interface MealPlan {
  slots: MealSlot[];
}

const SLOT_LABELS: Record<string, { label: string; icon: string; time: string }> = {
  breakfast:      { label: "Breakfast",      icon: "🌅", time: "7–9 AM"   },
  mid_morning:    { label: "Mid-Morning",    icon: "🍎", time: "10–11 AM" },
  lunch:          { label: "Lunch",          icon: "☀️", time: "12–2 PM"  },
  evening_snack:  { label: "Evening Snack",  icon: "🌤", time: "4–6 PM"   },
  dinner:         { label: "Dinner",         icon: "🌙", time: "7–9 PM"   },
};

function RecipeCard({ foodId, name, tags }: { foodId: string; name: string; tags?: string[] }) {
  const [open, setOpen] = useState(false);
  const recipe: Recipe | undefined = RECIPES[foodId];

  if (!recipe) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold text-gray-700 text-sm">{name}</div>
        <div className="text-xs text-gray-400 mt-1">Recipe coming soon</div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border transition-all overflow-hidden",
      open ? "border-violet-200 bg-violet-50/40 shadow-md" : "border-gray-100 bg-white hover:border-violet-200 hover:shadow-sm"
    )}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-sm leading-tight">{name}</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
              🕐 {recipe.prep + recipe.cook} min total
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              recipe.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
              {recipe.difficulty === "easy" ? "Easy" : "Medium"}
            </span>
            <span className="text-xs px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full">
              {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
            </span>
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 3).map((t) => (
                <span key={t} className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-md font-medium">
                  ✓ {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className={cn(
          "text-gray-400 text-sm flex-shrink-0 transition-transform mt-0.5",
          open ? "rotate-180" : ""
        )}>▼</span>
      </button>

      {/* Expanded recipe content */}
      {open && (
        <div className="px-4 pb-5 space-y-4 border-t border-violet-100 pt-4 animate-fade-in">
          {/* Time breakdown */}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Prep: <strong className="text-gray-700">{recipe.prep} min</strong></span>
            <span>Cook: <strong className="text-gray-700">{recipe.cook} min</strong></span>
          </div>

          {/* Ingredients */}
          <div>
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Ingredients</div>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Steps</div>
            <ol className="space-y-2.5">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Health tip */}
          {recipe.tip && (
            <div className="flex gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="flex-shrink-0 text-lg">💡</span>
              <p className="text-xs text-emerald-800 leading-relaxed">{recipe.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecipesPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandSlot, setExpandSlot] = useState<string | null>(null);
  const [showAlts, setShowAlts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = resolveUserId();
    if (!id) { router.push("/onboarding/profile"); return; }
    api.getMealPlan(id).then((r) => {
      setPlan(r as MealPlan);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 shimmer rounded-2xl" />)}
      </div>
    );
  }

  const slots = plan?.slots || [];
  const orderedSlots = ["breakfast", "mid_morning", "lunch", "evening_snack", "dinner"]
    .map((s) => slots.find((sl) => sl.slot === s))
    .filter(Boolean) as MealSlot[];

  // Collect unique food IDs that have recipes, for the "Browse all" count
  const recipesAvailable = Object.keys(RECIPES).length;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Today&apos;s Recipes</h1>
          <p className="text-gray-400 text-sm mt-1">
            How to prepare every meal in your plan — simple, homemade, healthy
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <span className="text-base">📖</span>
          <span><strong className="text-gray-700">{recipesAvailable}</strong> recipes available</span>
        </div>
      </div>

      {/* Quick nav pills */}
      <div className="flex gap-2 flex-wrap">
        {orderedSlots.map((slot) => {
          const meta = SLOT_LABELS[slot.slot];
          return (
            <button
              key={slot.slot}
              onClick={() => {
                setExpandSlot(slot.slot);
                setTimeout(() => document.getElementById(`slot-${slot.slot}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-violet-300 text-xs font-semibold text-gray-600 transition-all"
            >
              {meta?.icon} {meta?.label}
            </button>
          );
        })}
      </div>

      {/* Meal slot sections */}
      {orderedSlots.map((slot) => {
        const meta = SLOT_LABELS[slot.slot] || { label: slot.slot, icon: "🍽", time: "" };
        const allItems = [
          ...slot.items,
          ...(showAlts[slot.slot] ? (slot.alternatives || []) : []),
        ];

        return (
          <div key={slot.slot} id={`slot-${slot.slot}`} className="space-y-3">
            {/* Slot header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-sky-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {meta.icon}
              </div>
              <div>
                <div className="font-black text-gray-900">{meta.label}</div>
                <div className="text-xs text-gray-400">{meta.time}</div>
              </div>
              {slot.alternatives && slot.alternatives.length > 0 && (
                <button
                  onClick={() => setShowAlts((s) => ({ ...s, [slot.slot]: !s[slot.slot] }))}
                  className="ml-auto text-xs px-3 py-1 rounded-full border border-violet-200 text-violet-600 hover:bg-violet-50 font-semibold"
                >
                  {showAlts[slot.slot] ? "Hide alternatives" : `+${slot.alternatives.length} alternatives`}
                </button>
              )}
            </div>

            {/* Recipe cards */}
            <div className="grid gap-3">
              {allItems.map((item, idx) => {
                const isAlt = idx >= slot.items.length;
                return (
                  <div key={item.food_id + idx} className="relative">
                    {isAlt && (
                      <div className="absolute -top-1 left-3 z-10">
                        <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-600 rounded-full font-semibold">
                          Alternative
                        </span>
                      </div>
                    )}
                    <div className={cn(isAlt && "mt-3")}>
                      <RecipeCard
                        foodId={item.food_id}
                        name={item.name}
                        tags={item.reason_tags}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* No slots fallback */}
      {orderedSlots.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-card">
          <div className="text-4xl mb-3">📖</div>
          <div className="font-bold text-gray-900 mb-1">No meal plan yet</div>
          <div className="text-gray-500 text-sm">Complete your health profile to get a personalised meal plan with recipes.</div>
          <button
            onClick={() => router.push("/onboarding/profile")}
            className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 text-white font-bold text-sm hover:opacity-90"
          >
            Set Up My Profile →
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-4">
        ⚕️ Recipes are tailored to your health profile. Serving sizes and ingredients may differ from traditional recipes to meet your nutritional targets. Always consult your doctor or dietician before making significant dietary changes.
      </div>
    </div>
  );
}
