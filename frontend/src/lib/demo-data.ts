/**
 * Demo data for static GitHub Pages deployment (no backend).
 * Simulates a real user with Type 2 Diabetes + Hypertension so the
 * deployed showcase is fully interactive without a running API.
 */

export const DEMO_USER_ID = "demo-user";

export const demoSummary = {
  user_id: DEMO_USER_ID,
  name: "Demo User",
  age: 42,
  gender: "male",
  weight_kg: 82,
  height_cm: 178,
  activity_level: "moderate",
  primary_goal: "weight_loss",
  condition_codes: ["T2D", "HTN"],
  diet_type: "indian",
  lifestyle: { sleep_hours: 6.5, stress_level: "medium", water_liters_day: 2.0 },
};

export const demoMacros = {
  calories: 1955,
  protein_g: 147,
  carbs_g: 196,
  fat_g: 65,
  fiber_g: 27,
  protein_g_per_kg: 1.79,
};

const mealItem = (
  id: string,
  name: string,
  nameLocal: string | null,
  qty: number,
  cals: number,
  p: number,
  c: number,
  f: number,
  tags: string[],
  gi?: number
) => ({
  id,
  food: {
    id: `food-${id}`,
    name,
    name_local: nameLocal,
    food_group: "grains",
    calories: cals,
    protein_g: p,
    carbs_g: c,
    fat_g: f,
    fiber_g: 4,
    glycemic_index: gi,
    is_low_gi: gi ? gi < 55 : false,
    is_high_fiber: true,
  },
  meal_slot: "",
  quantity_g: qty,
  reason_tags: tags,
  ai_reason: null,
  calories: cals,
  protein_g: p,
  carbs_g: c,
  fat_g: f,
});

export const demoMealPlan = {
  id: "demo-plan",
  plan_date: new Date().toISOString().slice(0, 10),
  total_calories: 1942,
  total_protein_g: 144,
  total_carbs_g: 191,
  total_fat_g: 63,
  total_fiber_g: 29,
  ai_summary:
    "Today's plan is built around your Type 2 Diabetes and Hypertension. Every carbohydrate source is low-glycemic (steel-cut oats, brown rice, lentils) to keep blood sugar stable, and sodium is held well under 1500mg following the DASH protocol. Protein is kept high to preserve muscle during your weight-loss phase, drawn largely from plant sources like masoor dal and low-fat paneer that won't strain your cardiovascular system. A practical tip: take a 15-minute walk after lunch — it meaningfully blunts your post-meal glucose spike.",
  meals: [
    {
      slot: "breakfast",
      slot_calories: 420,
      slot_protein_g: 22,
      items: [
        mealItem("b1", "Steel-Cut Oats", null, 60, 225, 8, 40, 4, ["Low GI", "High Fiber", "Diabetes Friendly"], 55),
        mealItem("b2", "Low-Fat Yogurt (Curd)", "Dahi", 150, 82, 7, 10, 2, ["Low Sodium", "Probiotic"], 35),
        mealItem("b3", "Flaxseeds (Ground)", "Alsi", 20, 110, 4, 6, 9, ["Omega-3", "Heart Healthy"]),
      ],
    },
    {
      slot: "mid_morning",
      slot_calories: 95,
      slot_protein_g: 1,
      items: [mealItem("m1", "Guava", "Amrood", 140, 95, 2, 20, 1, ["Low GI", "High Fiber", "Vitamin C"], 12)],
    },
    {
      slot: "lunch",
      slot_calories: 620,
      slot_protein_g: 42,
      items: [
        mealItem("l1", "Brown Rice", null, 150, 215, 5, 45, 2, ["Low GI", "High Fiber"], 50),
        mealItem("l2", "Masoor Dal", "Masoor", 200, 230, 18, 40, 1, ["Low GI", "High Fiber", "Plant Protein"], 29),
        mealItem("l3", "Bitter Gourd Sabzi", "Karela", 100, 80, 4, 7, 4, ["Diabetes Friendly", "Low Sodium"], 18),
      ],
    },
    {
      slot: "evening_snack",
      slot_calories: 130,
      slot_protein_g: 8,
      items: [mealItem("e1", "Buttermilk", "Chaas", 240, 98, 8, 12, 2, ["Probiotic", "Hydrating"], 35)],
    },
    {
      slot: "dinner",
      slot_calories: 510,
      slot_protein_g: 38,
      items: [
        mealItem("d1", "Whole Wheat Roti", null, 80, 240, 8, 44, 5, ["High Fiber", "Whole Grain"], 62),
        mealItem("d2", "Low-Fat Paneer", "Paneer", 100, 200, 18, 2, 13, ["Low Sodium", "Vegetarian Protein"]),
        mealItem("d3", "Cauliflower", "Gobi", 150, 70, 3, 8, 1, ["Low GI", "Low Sodium"], 15),
      ],
    },
  ],
  macro_targets: demoMacros,
};

export const demoTodayWorkout = {
  day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
  is_rest_day: false,
  templates: [
    {
      id: "demo-w1",
      name: "Diabetes-Friendly Walk + Resistance",
      fitness_level: "intermediate",
      goal_type: "diabetes_friendly",
      duration_min: 35,
      equipment: ["bodyweight", "resistance_band"],
      description:
        "Post-meal walking combined with light resistance training to improve insulin sensitivity and support blood-pressure management.",
      instructions: {
        warmup: [{ exercise: "Brisk walk", duration_sec: 300 }],
        main_circuit: [
          { exercise: "Bodyweight squat", sets: 3, reps: 12, rest_sec: 60 },
          { exercise: "Resistance band row", sets: 3, reps: 15, rest_sec: 60 },
          { exercise: "Wall push-up", sets: 3, reps: 12, rest_sec: 45 },
          { exercise: "Post-meal walk", duration_sec: 900 },
        ],
        cooldown: [{ exercise: "Box breathing (4-4-4-4)", duration_sec: 120 }],
      },
    },
  ],
};

export const demoWorkoutPlan = {
  week_start: new Date().toISOString().slice(0, 10),
  fitness_level: "intermediate",
  ai_summary: null,
  days: [
    { day: "monday", is_rest_day: false, templates: demoTodayWorkout.templates },
    { day: "tuesday", is_rest_day: true, templates: [] },
    { day: "wednesday", is_rest_day: false, templates: demoTodayWorkout.templates },
    { day: "thursday", is_rest_day: true, templates: [] },
    { day: "friday", is_rest_day: false, templates: demoTodayWorkout.templates },
    { day: "saturday", is_rest_day: true, templates: [] },
    { day: "sunday", is_rest_day: true, templates: [] },
  ],
};

export const demoLifestyle = {
  hydration: {
    target_liters: 2.9,
    glasses_8oz: 12,
    reason: "Based on your weight and moderate activity level.",
    tips: [
      "Start your day with a glass of water",
      "Carry a reusable water bottle",
      "Set hourly hydration reminders",
    ],
  },
  sleep: {
    target_hours: "7–9",
    current_hours: 6.5,
    gap_message: "You're getting 6.5h — aim for 7–9h",
    tips: [
      "Maintain a consistent sleep-wake schedule",
      "Avoid screens 1 hour before bed",
      "Keep bedroom temperature between 65–68°F",
      "Avoid caffeine after 2 PM",
    ],
  },
  stress: {
    current_level: "medium",
    clinical_note: "Chronic stress elevates blood pressure. Prioritize daily relaxation practices.",
    techniques: [
      { name: "Box Breathing", duration: "5 min", description: "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s" },
      { name: "Daily Walk", duration: "20-30 min", description: "Brisk walking reduces cortisol levels" },
      { name: "Meditation", duration: "10 min", description: "Mindfulness apps like Headspace or Calm" },
    ],
  },
  condition_specific: [
    { condition: "Diabetes", tip: "A 15-minute walk after each meal significantly improves post-meal blood sugar control." },
    { condition: "Hypertension", tip: "Limit sodium to < 1500mg/day and practice daily relaxation to support blood pressure management." },
  ],
};

const DEMO_CHAT_RESPONSES: Record<string, string> = {
  default:
    "Great question! Based on your profile (Type 2 Diabetes + Hypertension), I prioritize low-glycemic, low-sodium foods. This is a **demo response** — connect the live backend with an Anthropic API key for fully personalized AI answers.\n\n---\n*This is educational information, not medical advice. Consult your healthcare provider.*",
  spinach:
    "Spinach is very high in **oxalates**, which can contribute to calcium-oxalate kidney stone formation in susceptible individuals. For most people with diabetes and hypertension it's actually beneficial (low GI, high potassium) — but if you have a kidney-stone history, the engine swaps it for low-oxalate greens like cauliflower.\n\n---\n*This is educational information, not medical advice.*",
  oats:
    "Oats were recommended because they're **low glycemic index (GI 55)** and **high in soluble fiber**, which slows glucose absorption — directly supporting your blood sugar control for Type 2 Diabetes. They're also naturally low in sodium, fitting your DASH protocol for hypertension.\n\n---\n*This is educational information, not medical advice.*",
  protein:
    "Your protein target is **147g/day (1.79g/kg)**. Since your goal is weight loss, higher protein preserves muscle mass during a calorie deficit and keeps you full. I draw it mainly from plant sources (dal, paneer) that are gentler on your cardiovascular system than red meat.\n\n---\n*This is educational information, not medical advice.*",
};

export function getDemoChatResponse(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("spinach")) return DEMO_CHAT_RESPONSES.spinach;
  if (m.includes("oat")) return DEMO_CHAT_RESPONSES.oats;
  if (m.includes("protein")) return DEMO_CHAT_RESPONSES.protein;
  return DEMO_CHAT_RESPONSES.default;
}

export const demoProgressHistory = {
  logs: Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      log_date: d.toISOString().slice(0, 10),
      weight_kg: Math.round((84 - i * 0.15) * 10) / 10,
      calories_consumed: 1850 + Math.round(Math.sin(i) * 120),
      sleep_hours: Math.round((6.5 + Math.sin(i / 2) * 0.8) * 10) / 10,
      steps_count: 6500 + Math.round(Math.cos(i) * 2000),
      mood_score: 3 + (i % 3 === 0 ? 1 : 0),
    };
  }),
};
