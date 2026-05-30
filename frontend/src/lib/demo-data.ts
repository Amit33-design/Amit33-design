/**
 * Demo data for static GitHub Pages deployment (no backend).
 * Supports multiple goal + cuisine + protein-preference combinations.
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
  cuisine_type: "indian",
  protein_preference: "vegetarian",
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

// ─── Plan: Weight Loss · Indian · Vegetarian (default) ────────────────────────
const weightLossIndianVegPlan = {
  id: "demo-plan-wl",
  plan_date: new Date().toISOString().slice(0, 10),
  total_calories: 1942,
  total_protein_g: 144,
  total_carbs_g: 191,
  total_fat_g: 63,
  total_fiber_g: 29,
  ai_summary:
    "Today's plan is built around your Type 2 Diabetes and Hypertension. Every carbohydrate source is low-glycemic (steel-cut oats, brown rice, lentils) to keep blood sugar stable, and sodium is held well under 1500 mg following the DASH protocol. Protein is kept high to preserve muscle during your weight-loss phase, drawn largely from plant sources like masoor dal and low-fat paneer that won't strain your cardiovascular system.",
  meals: [
    {
      slot: "breakfast", slot_calories: 420, slot_protein_g: 22,
      items: [
        mealItem("b1", "Steel-Cut Oats", null, 60, 225, 8, 40, 4, ["Low GI", "High Fiber", "Diabetes Friendly"], 55),
        mealItem("b2", "Low-Fat Yogurt (Curd)", "Dahi", 150, 82, 7, 10, 2, ["Low Sodium", "Probiotic"], 35),
        mealItem("b3", "Ground Flaxseeds", "Alsi", 20, 110, 4, 6, 9, ["Omega-3", "Heart Healthy"]),
      ],
    },
    {
      slot: "mid_morning", slot_calories: 145, slot_protein_g: 5,
      items: [
        mealItem("m1", "Guava", "Amrood", 100, 68, 1, 14, 1, ["Low GI", "High Fiber", "Vitamin C"], 12),
        mealItem("m2", "Mixed Berries (Blueberry + Strawberry)", null, 80, 45, 1, 11, 2, ["Antioxidant", "Anti-Inflammatory", "Low GI"], 25),
        mealItem("m3", "Chia Seeds", null, 10, 49, 2, 4, 3, ["Omega-3", "High Fiber", "Hydrophilic"]),
      ],
    },
    {
      slot: "lunch", slot_calories: 720, slot_protein_g: 52,
      items: [
        mealItem("l1", "Brown Rice", null, 150, 215, 5, 45, 2, ["Low GI", "High Fiber"], 50),
        mealItem("l2", "Masoor Dal", "Masoor", 200, 230, 18, 40, 1, ["Low GI", "High Fiber", "Plant Protein"], 29),
        mealItem("l3", "Chickpea Salad", "Kala Chana", 100, 164, 9, 27, 8, ["High Fiber", "Plant Protein", "Diabetes Friendly"], 28),
        mealItem("l4", "Bitter Gourd Sabzi", "Karela", 80, 64, 3, 6, 3, ["Diabetes Friendly", "Low Sodium"], 18),
      ],
    },
    {
      slot: "evening_snack", slot_calories: 155, slot_protein_g: 12,
      items: [
        mealItem("e1", "Buttermilk", "Chaas", 200, 82, 6, 10, 2, ["Probiotic", "Hydrating"], 35),
        mealItem("e2", "Moong Sprouts", "Ankurit Moong", 60, 60, 5, 8, 2, ["Plant Protein", "Digestive Enzymes", "High Fiber"]),
      ],
    },
    {
      slot: "dinner", slot_calories: 510, slot_protein_g: 38,
      items: [
        mealItem("d1", "Whole Wheat Roti", null, 80, 240, 8, 44, 5, ["High Fiber", "Whole Grain"], 62),
        mealItem("d2", "Low-Fat Paneer", "Paneer", 100, 200, 18, 2, 13, ["Low Sodium", "Vegetarian Protein"]),
        mealItem("d3", "Cauliflower Sabzi", "Gobi", 150, 70, 3, 8, 1, ["Low GI", "Low Sodium"], 15),
      ],
    },
  ],
  macro_targets: demoMacros,
};

// ─── Plan: Muscle Gain · Indian · Non-Vegetarian ──────────────────────────────
const muscleGainIndianNonVegPlan = {
  id: "demo-plan-mg-nv",
  plan_date: new Date().toISOString().slice(0, 10),
  total_calories: 2460,
  total_protein_g: 188,
  total_carbs_g: 248,
  total_fat_g: 82,
  total_fiber_g: 28,
  ai_summary:
    "Muscle gain requires a ~300 kcal surplus with 35% of calories from protein. Today's plan uses high-quality complete proteins — egg bhurji at breakfast, chicken breast at lunch, and grilled surmai at dinner — timed around your workouts for optimal muscle protein synthesis. Carbohydrates are kept complex and timed for pre- and post-workout energy. Sodium remains under 1700 mg given your Hypertension, and every carb source is low-to-medium GI to manage blood sugar.",
  meals: [
    {
      slot: "breakfast", slot_calories: 610, slot_protein_g: 40,
      items: [
        mealItem("mg-b1", "Egg Bhurji (3 eggs)", "Anda Bhurji", 150, 240, 18, 3, 18, ["Complete Protein", "Muscle Recovery"]),
        mealItem("mg-b2", "Whole Milk", "Doodh", 250, 150, 8, 12, 8, ["High Protein", "Calcium", "IGF-1"], 40),
        mealItem("mg-b3", "Multigrain Roti", null, 80, 220, 7, 40, 4, ["Complex Carbs", "High Fiber"], 58),
      ],
    },
    {
      slot: "mid_morning", slot_calories: 280, slot_protein_g: 10,
      items: [
        mealItem("mg-m1", "Banana", "Kela", 120, 107, 1, 27, 0, ["Pre-workout Fuel", "Potassium"], 51),
        mealItem("mg-m2", "Almonds", "Badam", 25, 145, 5, 5, 13, ["Healthy Fats", "Vitamin E"]),
        mealItem("mg-m3", "Mixed Berries", null, 80, 45, 1, 11, 2, ["Antioxidant", "Anti-Inflammatory", "Low GI"], 25),
      ],
    },
    {
      slot: "lunch", slot_calories: 840, slot_protein_g: 68,
      items: [
        mealItem("mg-l1", "Chicken Breast (grilled)", "Murgh", 180, 297, 56, 0, 6, ["Lean Protein", "Muscle Gain", "Low Sodium"]),
        mealItem("mg-l2", "Brown Rice", null, 150, 215, 5, 45, 2, ["Low GI", "Complex Carbs"], 50),
        mealItem("mg-l3", "Moong Dal", "Moong", 150, 175, 12, 30, 1, ["Plant Protein", "Digestive Health"], 25),
        mealItem("mg-l4", "Chickpea & Cucumber Salad", "Kala Chana Salad", 80, 130, 7, 22, 6, ["High Fiber", "Plant Protein", "Hydrating"], 28),
      ],
    },
    {
      slot: "evening_snack", slot_calories: 220, slot_protein_g: 25,
      items: [
        mealItem("mg-e1", "Boiled Eggs (2)", "Uble Ande", 100, 155, 13, 1, 11, ["Complete Protein", "Post-workout"]),
        mealItem("mg-e2", "Edamame (steamed)", null, 80, 94, 9, 7, 4, ["Complete Amino", "High Protein", "High Fiber"]),
        mealItem("mg-e3", "Green Tea", "Hari Chai", 240, 2, 0, 0, 0, ["Antioxidant", "Metabolism"]),
      ],
    },
    {
      slot: "dinner", slot_calories: 640, slot_protein_g: 58,
      items: [
        mealItem("mg-d1", "Grilled Surmai (King Fish)", "Surmai", 150, 215, 40, 0, 6, ["Omega-3", "Lean Protein", "Heart Healthy"]),
        mealItem("mg-d2", "Whole Wheat Roti", null, 80, 240, 8, 44, 5, ["High Fiber", "Whole Grain"], 62),
        mealItem("mg-d3", "Spinach & Tomato Sabzi", "Palak Tamatar", 150, 72, 4, 8, 3, ["Iron", "Antioxidant", "Low Sodium"], 15),
      ],
    },
  ],
  macro_targets: { calories: 2460, protein_g: 188, carbs_g: 248, fat_g: 82, fiber_g: 28, protein_g_per_kg: 2.29 },
};

// ─── Plan: Muscle Gain · Indian · Vegetarian ─────────────────────────────────
const muscleGainIndianVegPlan = {
  id: "demo-plan-mg-v",
  plan_date: new Date().toISOString().slice(0, 10),
  total_calories: 2380,
  total_protein_g: 172,
  total_carbs_g: 252,
  total_fat_g: 78,
  total_fiber_g: 32,
  ai_summary:
    "Building muscle on a vegetarian diet is absolutely achievable — it just requires strategic protein stacking. Today's plan combines complementary proteins (rajma + rice = complete amino acid profile) and maximises high-protein vegetarian staples: paneer bhurji at breakfast, soya chunks at lunch, and tofu at dinner. Total protein hits 172 g (2.1 g/kg), sufficient for hypertrophy. Carbohydrates are timed around meals to fuel training and replenish glycogen.",
  meals: [
    {
      slot: "breakfast", slot_calories: 580, slot_protein_g: 38,
      items: [
        mealItem("mgv-b1", "Paneer Bhurji", "Paneer Bhurji", 150, 290, 22, 6, 20, ["High Protein", "Complete Amino", "Vegetarian"]),
        mealItem("mgv-b2", "Steel-Cut Oats with Milk", null, 80, 220, 10, 38, 4, ["Complex Carbs", "High Fiber", "Slow Release"], 52),
        mealItem("mgv-b3", "Pumpkin Seeds", "Kaddu Beej", 20, 113, 6, 4, 9, ["Zinc", "Muscle Recovery"]),
      ],
    },
    {
      slot: "mid_morning", slot_calories: 250, slot_protein_g: 15,
      items: [
        mealItem("mgv-m1", "Greek Yogurt (Hung Curd)", "Chakka Dahi", 150, 132, 12, 8, 4, ["High Protein", "Probiotic"], 14),
        mealItem("mgv-m2", "Mixed Berries + Flaxseeds", null, 90, 60, 2, 14, 3, ["Antioxidant", "Omega-3", "Low GI"], 25),
        mealItem("mgv-m3", "Pumpkin Seeds", "Kaddu Beej", 15, 83, 4, 3, 7, ["Zinc", "Magnesium", "Muscle Recovery"]),
      ],
    },
    {
      slot: "lunch", slot_calories: 820, slot_protein_g: 62,
      items: [
        mealItem("mgv-l1", "Soya Chunks Curry", "Soya Chaap", 100, 345, 35, 33, 1, ["Complete Protein", "Muscle Gain", "High Fiber"]),
        mealItem("mgv-l2", "Brown Rice", null, 150, 215, 5, 45, 2, ["Low GI", "Complex Carbs"], 50),
        mealItem("mgv-l3", "Rajma (Kidney Beans)", "Rajma", 120, 140, 10, 25, 1, ["Plant Protein", "Fiber", "Iron"], 24),
        mealItem("mgv-l4", "Tofu & Spinach Stir-fry", "Tofu Palak", 80, 88, 10, 4, 5, ["Plant Protein", "Iron", "Calcium"]),
      ],
    },
    {
      slot: "evening_snack", slot_calories: 200, slot_protein_g: 20,
      items: [
        mealItem("mgv-e1", "Roasted Chana", "Bhuna Chana", 40, 145, 8, 15, 5, ["Plant Protein", "Fiber", "Post-workout"]),
        mealItem("mgv-e2", "Edamame (steamed)", null, 80, 94, 9, 7, 4, ["Complete Amino", "High Protein", "High Fiber"]),
        mealItem("mgv-e3", "Low-Fat Milk", "Doodh", 150, 75, 5, 8, 2, ["Casein Protein", "Calcium"]),
      ],
    },
    {
      slot: "dinner", slot_calories: 670, slot_protein_g: 52,
      items: [
        mealItem("mgv-d1", "Tofu Bhurji", "Tofu", 150, 165, 18, 5, 9, ["Complete Protein", "Plant-Based", "Low Carb"]),
        mealItem("mgv-d2", "Whole Wheat Roti", null, 80, 240, 8, 44, 5, ["High Fiber", "Whole Grain"], 62),
        mealItem("mgv-d3", "Palak (Spinach) Dal", "Dal Palak", 200, 220, 14, 32, 4, ["Iron", "Plant Protein", "Folate"], 22),
      ],
    },
  ],
  macro_targets: { calories: 2380, protein_g: 172, carbs_g: 252, fat_g: 78, fiber_g: 32, protein_g_per_kg: 2.1 },
};

// ─── Plan: Healthy Aging · Indian · Vegetarian ────────────────────────────────
const healthyAgingIndianVegPlan = {
  id: "demo-plan-ha",
  plan_date: new Date().toISOString().slice(0, 10),
  total_calories: 1820,
  total_protein_g: 112,
  total_carbs_g: 215,
  total_fat_g: 58,
  total_fiber_g: 36,
  ai_summary:
    "Healthy aging prioritises anti-inflammatory nutrients, bone density, cognitive function, and digestive ease. Today's plan leads with turmeric (curcumin for inflammation), walnuts (omega-3 for brain health), and moong dal khichdi (easy to digest, joint-friendly). Calories are moderate at 1820 kcal, protein is set at 1.4 g/kg to combat age-related muscle loss (sarcopenia), and fiber is elevated to 36 g to support gut health and cholesterol. Sodium stays under 1500 mg for your Hypertension.",
  meals: [
    {
      slot: "breakfast", slot_calories: 390, slot_protein_g: 20,
      items: [
        mealItem("ha-b1", "Vegetable Poha", "Poha", 120, 200, 6, 38, 3, ["Light", "Iron", "Complex Carbs"], 55),
        mealItem("ha-b2", "Turmeric Milk", "Haldi Doodh", 250, 130, 7, 14, 5, ["Anti-Inflammatory", "Bone Health", "Curcumin"]),
        mealItem("ha-b3", "Walnuts", "Akhrot", 20, 131, 3, 3, 13, ["Omega-3", "Brain Health", "Anti-Inflammatory"]),
      ],
    },
    {
      slot: "mid_morning", slot_calories: 130, slot_protein_g: 4,
      items: [
        mealItem("ha-m1", "Amla (Indian Gooseberry)", "Amla", 60, 33, 1, 8, 0, ["Vitamin C", "Antioxidant", "Immunity"], 20),
        mealItem("ha-m2", "Mixed Berries", null, 80, 45, 1, 11, 2, ["Antioxidant", "Anti-Inflammatory", "Brain Health"], 25),
        mealItem("ha-m3", "Chia Seeds in Water", null, 10, 49, 2, 4, 3, ["Omega-3", "High Fiber", "Joint Health"]),
      ],
    },
    {
      slot: "lunch", slot_calories: 660, slot_protein_g: 42,
      items: [
        mealItem("ha-l1", "Moong Dal Khichdi", "Khichdi", 200, 235, 11, 40, 3, ["Digestive Ease", "Complete Protein", "Joint Friendly"], 35),
        mealItem("ha-l2", "Chickpea & Spinach Curry", "Chole Palak", 120, 196, 10, 33, 10, ["High Fiber", "Plant Protein", "Iron", "Anti-Inflammatory"], 28),
        mealItem("ha-l3", "Seasonal Vegetable Sabzi", null, 100, 60, 2, 9, 2, ["Antioxidant", "Fiber", "Low Sodium"]),
        mealItem("ha-l4", "Low-Fat Dahi", "Dahi", 100, 61, 5, 7, 2, ["Probiotic", "Calcium", "Bone Health"], 35),
      ],
    },
    {
      slot: "evening_snack", slot_calories: 140, slot_protein_g: 6,
      items: [
        mealItem("ha-e1", "Walnuts + Almonds Mix", "Dry Fruits", 20, 131, 4, 4, 12, ["Brain Health", "Omega-3", "Healthy Fats"]),
        mealItem("ha-e2", "Roasted Pumpkin Seeds", "Kaddu Beej", 15, 83, 4, 3, 7, ["Zinc", "Bone Health", "Anti-Inflammatory"]),
        mealItem("ha-e3", "Tulsi Ginger Tea", "Kadha", 200, 8, 0, 2, 0, ["Anti-Inflammatory", "Immunity", "Digestive"]),
      ],
    },
    {
      slot: "dinner", slot_calories: 450, slot_protein_g: 28,
      items: [
        mealItem("ha-d1", "Mixed Vegetable Soup", "Sabzi Ka Shorba", 300, 120, 5, 18, 4, ["Low Calorie", "Hydrating", "Digestive Ease"]),
        mealItem("ha-d2", "Bajra Roti", null, 60, 175, 5, 35, 3, ["Bone Health", "Magnesium", "Whole Grain"], 55),
        mealItem("ha-d3", "Masoor Dal", "Masoor", 150, 173, 14, 30, 1, ["Plant Protein", "Folate", "Iron"], 29),
      ],
    },
  ],
  macro_targets: { calories: 1820, protein_g: 112, carbs_g: 215, fat_g: 58, fiber_g: 36, protein_g_per_kg: 1.37 },
};

// ─── Plan: Weight Loss · Western · Non-Vegetarian ────────────────────────────
const weightLossWesternNonVegPlan = {
  id: "demo-plan-wl-w",
  plan_date: new Date().toISOString().slice(0, 10),
  total_calories: 1920,
  total_protein_g: 155,
  total_carbs_g: 185,
  total_fat_g: 60,
  total_fiber_g: 30,
  ai_summary:
    "Today's plan follows a high-protein Western eating pattern calibrated for weight loss with Hypertension and Type 2 Diabetes. Grilled proteins (chicken, salmon) are naturally low in sodium, and complex carbohydrates like quinoa and sweet potato keep blood sugar stable. Olive oil provides heart-healthy monounsaturated fats. Sodium is restricted to under 1500 mg per DASH protocol.",
  meals: [
    {
      slot: "breakfast", slot_calories: 420, slot_protein_g: 30,
      items: [
        mealItem("ww-b1", "Greek Yogurt", null, 200, 200, 20, 10, 5, ["High Protein", "Probiotic", "Calcium"], 14),
        mealItem("ww-b2", "Mixed Berries", null, 100, 57, 1, 14, 2, ["Antioxidant", "Low GI", "Vitamin C"], 25),
        mealItem("ww-b3", "Rolled Oats", null, 50, 188, 7, 32, 4, ["Low GI", "High Fiber", "Beta-Glucan"], 55),
      ],
    },
    {
      slot: "mid_morning", slot_calories: 150, slot_protein_g: 4,
      items: [
        mealItem("ww-m1", "Apple", null, 150, 78, 0, 21, 0, ["Low GI", "Fiber", "Quercetin"], 38),
        mealItem("ww-m2", "Almond Butter", null, 15, 96, 3, 3, 9, ["Healthy Fats", "Vitamin E"]),
      ],
    },
    {
      slot: "lunch", slot_calories: 730, slot_protein_g: 60,
      items: [
        mealItem("ww-l1", "Grilled Chicken Breast", null, 150, 248, 47, 0, 5, ["Lean Protein", "Low Sodium", "Muscle Preservation"]),
        mealItem("ww-l2", "Chickpea & Tofu Salad", null, 120, 196, 14, 22, 7, ["High Fiber", "Plant Protein", "Complete Amino", "Diabetes Friendly"], 28),
        mealItem("ww-l3", "Quinoa", null, 80, 178, 6, 31, 3, ["Complete Protein", "Low GI", "Gluten Free"], 53),
        mealItem("ww-l4", "Roasted Broccoli & Peppers", null, 100, 43, 3, 8, 1, ["Antioxidant", "Low Carb", "Vitamin C"]),
      ],
    },
    {
      slot: "evening_snack", slot_calories: 130, slot_protein_g: 16,
      items: [
        mealItem("ww-e1", "Hard-Boiled Egg", null, 50, 78, 6, 1, 5, ["Complete Protein", "Low Calorie"]),
        mealItem("ww-e2", "Mixed Berries", null, 100, 57, 1, 14, 2, ["Antioxidant", "Low GI", "Vitamin C"], 25),
        mealItem("ww-e3", "Celery + Hummus", null, 60, 62, 3, 7, 3, ["High Fiber", "Plant Protein", "Hydrating"]),
      ],
    },
    {
      slot: "dinner", slot_calories: 580, slot_protein_g: 46,
      items: [
        mealItem("ww-d1", "Baked Salmon", null, 150, 310, 34, 0, 19, ["Omega-3", "Heart Healthy", "Lean Protein"]),
        mealItem("ww-d2", "Sweet Potato", null, 120, 103, 2, 24, 0, ["Low GI", "Beta-Carotene", "Potassium"], 44),
        mealItem("ww-d3", "Steamed Asparagus", null, 100, 20, 2, 4, 0, ["Low Calorie", "Folate", "Anti-Inflammatory"]),
      ],
    },
  ],
  macro_targets: { calories: 1920, protein_g: 155, carbs_g: 185, fat_g: 60, fiber_g: 30, protein_g_per_kg: 1.89 },
};

// ─── Plan: Weight Loss · Mediterranean · Vegetarian ──────────────────────────
const mediterraneanVegPlan = {
  id: "demo-plan-med",
  plan_date: new Date().toISOString().slice(0, 10),
  total_calories: 1940,
  total_protein_g: 132,
  total_carbs_g: 198,
  total_fat_g: 70,
  total_fiber_g: 38,
  ai_summary:
    "The Mediterranean diet is one of the most clinically validated eating patterns for cardiovascular health and blood sugar management. Today's plan centres on chickpeas, tofu, berries, olive oil, and omega-3-rich walnuts. The diet's naturally high fiber (38 g) and polyphenol content directly support DASH protocol for Hypertension and glycemic control for Type 2 Diabetes. Olive oil replaces saturated fats, and legumes replace refined carbohydrates — a proven combination for reducing LDL and systolic blood pressure.",
  meals: [
    {
      slot: "breakfast", slot_calories: 410, slot_protein_g: 24,
      items: [
        mealItem("med-b1", "Greek Yogurt Parfait", null, 180, 180, 18, 10, 4, ["High Protein", "Probiotic", "Calcium"], 14),
        mealItem("med-b2", "Mixed Berries (Blueberry, Strawberry, Raspberry)", null, 120, 68, 1, 16, 4, ["Antioxidant", "Anti-Inflammatory", "Low GI"], 25),
        mealItem("med-b3", "Walnuts", null, 20, 131, 3, 3, 13, ["Omega-3", "Brain Health", "Heart Healthy"]),
        mealItem("med-b4", "Whole Grain Toast", null, 30, 82, 3, 15, 2, ["Complex Carbs", "High Fiber"], 51),
      ],
    },
    {
      slot: "mid_morning", slot_calories: 155, slot_protein_g: 8,
      items: [
        mealItem("med-m1", "Hummus", null, 60, 107, 5, 12, 6, ["Plant Protein", "High Fiber", "Healthy Fats"]),
        mealItem("med-m2", "Whole Grain Crackers", null, 20, 80, 2, 14, 1, ["Complex Carbs", "Fiber"], 50),
        mealItem("med-m3", "Cherry Tomatoes + Cucumber", null, 100, 28, 1, 6, 1, ["Lycopene", "Hydrating", "Low Calorie"]),
      ],
    },
    {
      slot: "lunch", slot_calories: 650, slot_protein_g: 40,
      items: [
        mealItem("med-l1", "Chickpea & Tofu Salad", null, 150, 246, 18, 28, 9, ["Plant Protein", "High Fiber", "Complete Amino", "Diabetes Friendly"], 28),
        mealItem("med-l2", "Quinoa", null, 90, 200, 7, 35, 3, ["Complete Protein", "Low GI", "Gluten Free"], 53),
        mealItem("med-l3", "Roasted Eggplant & Zucchini (Olive Oil)", null, 150, 95, 3, 14, 5, ["Antioxidant", "Heart Healthy", "Low Sodium"]),
        mealItem("med-l4", "Lemon Tahini Dressing", null, 20, 60, 2, 2, 5, ["Calcium", "Healthy Fats", "Sesame"]),
      ],
    },
    {
      slot: "evening_snack", slot_calories: 140, slot_protein_g: 8,
      items: [
        mealItem("med-e1", "Mixed Nuts (Almond, Pistachio, Cashew)", null, 25, 145, 5, 6, 12, ["Healthy Fats", "Plant Protein", "Heart Healthy"]),
        mealItem("med-e2", "Fresh Figs or Dates (1–2)", null, 40, 47, 1, 12, 1, ["Natural Sweetness", "Fiber", "Iron"]),
        mealItem("med-e3", "Herbal Tea", null, 240, 4, 0, 1, 0, ["Antioxidant", "Anti-Inflammatory"]),
      ],
    },
    {
      slot: "dinner", slot_calories: 540, slot_protein_g: 36,
      items: [
        mealItem("med-d1", "Baked Sea Bass with Herbs", null, 150, 180, 30, 0, 6, ["Omega-3", "Lean Protein", "Heart Healthy"]),
        mealItem("med-d2", "Lentil Soup (Red Lentils)", null, 200, 175, 13, 30, 8, ["High Fiber", "Plant Protein", "Iron"], 21),
        mealItem("med-d3", "Greek Salad (Tomato, Olive, Cucumber, Herbs)", null, 120, 75, 2, 8, 5, ["Antioxidant", "Lycopene", "Low Sodium"]),
        mealItem("med-d4", "Whole Grain Pita (½)", null, 30, 83, 3, 16, 2, ["Complex Carbs", "Fiber"], 55),
      ],
    },
  ],
  macro_targets: { calories: 1940, protein_g: 132, carbs_g: 198, fat_g: 70, fiber_g: 38, protein_g_per_kg: 1.61 },
};

// ─── Selector ──────────────────────────────────────────────────────────────────
export function getDemoMealPlan(
  goalType: string,
  cuisineType: string,
  proteinPref: string
) {
  if (goalType === "muscle_gain" || goalType === "fat_loss") {
    if (proteinPref === "non_vegetarian" || proteinPref === "pescatarian") return muscleGainIndianNonVegPlan;
    return muscleGainIndianVegPlan;
  }
  if (goalType === "healthy_aging" || goalType === "cardiovascular") {
    return healthyAgingIndianVegPlan;
  }
  if (cuisineType === "mediterranean") return mediterraneanVegPlan;
  if (cuisineType === "western" && (proteinPref === "non_vegetarian" || proteinPref === "pescatarian")) {
    return weightLossWesternNonVegPlan;
  }
  return weightLossIndianVegPlan;
}

// backward-compat default export used by api-client when no onboarding data is present
export const demoMealPlan = weightLossIndianVegPlan;

// ─── Workout data ──────────────────────────────────────────────────────────────
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
    { day: "monday",    is_rest_day: false, templates: demoTodayWorkout.templates },
    { day: "tuesday",   is_rest_day: true,  templates: [] },
    { day: "wednesday", is_rest_day: false, templates: demoTodayWorkout.templates },
    { day: "thursday",  is_rest_day: true,  templates: [] },
    { day: "friday",    is_rest_day: false, templates: demoTodayWorkout.templates },
    { day: "saturday",  is_rest_day: true,  templates: [] },
    { day: "sunday",    is_rest_day: true,  templates: [] },
  ],
};

// ─── Lifestyle ─────────────────────────────────────────────────────────────────
export const demoLifestyle = {
  hydration: {
    target_liters: 2.9,
    glasses_8oz: 12,
    reason: "Based on your weight (82 kg) and moderate activity level.",
    tips: [
      "Start your day with a glass of water before coffee",
      "Carry a 1 L reusable bottle — refill twice",
      "Set hourly hydration reminders on your phone",
      "Drink a glass of water 30 min before each meal",
    ],
  },
  sleep: {
    target_hours: "7–9",
    current_hours: 6.5,
    gap_message: "You're getting 6.5 h — aim for at least 7 h to support blood sugar regulation",
    tips: [
      "Keep a consistent sleep and wake time — even weekends",
      "Avoid screens 1 hour before bed (blue light disrupts melatonin)",
      "Keep bedroom temperature at 65–68 °F (18–20 °C)",
      "Avoid caffeine after 2 PM",
    ],
  },
  stress: {
    current_level: "medium",
    clinical_note: "Chronic stress raises cortisol, which elevates both blood pressure and blood glucose. Daily relaxation is as important as medication.",
    techniques: [
      { name: "Box Breathing", duration: "5 min", description: "Inhale 4 s → Hold 4 s → Exhale 4 s → Hold 4 s. Used clinically to activate the parasympathetic nervous system." },
      { name: "Nature Walk", duration: "20–30 min", description: "Brisk outdoor walking reduces cortisol by up to 18% in a single session." },
      { name: "Journalling", duration: "10 min", description: "Write 3 things you're grateful for each evening — shown to lower perceived stress scores." },
    ],
  },
  meditation: {
    recommended_minutes: 10,
    best_time: "Morning (before breakfast) or evening (before bed)",
    clinical_note: "Regular meditation reduces cortisol by up to 31% and lowers systolic blood pressure by 4–5 mmHg — meaningful numbers for Hypertension management.",
    practices: [
      {
        name: "4-7-8 Breathing",
        duration: "5 min",
        icon: "🫁",
        level: "Beginner",
        description: "Inhale through nose for 4 s → Hold for 7 s → Exhale through mouth for 8 s. Repeat 4–8 cycles. Rapidly activates the rest-and-digest response.",
      },
      {
        name: "Body Scan Meditation",
        duration: "10 min",
        icon: "🧘",
        level: "Beginner",
        description: "Lie down, close your eyes. Slowly move attention from toes to crown, releasing tension in each body part. Excellent for sleep quality and chronic pain.",
      },
      {
        name: "Mindful Eating",
        duration: "Per meal",
        icon: "🍽️",
        level: "Easy",
        description: "Eat without screens, chew each bite 20–30 times. Mindful eating reduces post-meal glucose spikes and prevents overeating by improving satiety signalling.",
      },
      {
        name: "Guided Visualisation",
        duration: "10 min",
        icon: "🌊",
        level: "Intermediate",
        description: "Visualise a calm place in detail — sights, sounds, sensations. Reduces anxiety and supports immune function. Try Insight Timer (free app).",
      },
    ],
    apps: [
      { name: "Insight Timer", note: "Free — 100k+ guided meditations" },
      { name: "Headspace", note: "Structured beginner programs" },
      { name: "Calm", note: "Sleep stories + breathing exercises" },
    ],
  },
  condition_specific: [
    { condition: "Diabetes", tip: "A 15-minute walk after each meal significantly improves post-meal blood sugar control — reducing glucose spikes by up to 22%." },
    { condition: "Hypertension", tip: "Limit sodium to < 1500 mg/day, increase potassium-rich foods (banana, curd, dal), and practice daily relaxation to support blood pressure management." },
  ],
};

// ─── Chat responses ────────────────────────────────────────────────────────────
const DEMO_CHAT_RESPONSES: Record<string, string> = {
  default:
    "Great question! Based on your profile (Type 2 Diabetes + Hypertension), I prioritise low-glycemic, low-sodium foods. This is a **demo response** — connect the live backend with an Anthropic API key for fully personalised AI answers.\n\n---\n*This is educational information, not medical advice. Consult your healthcare provider.*",
  spinach:
    "Spinach is very high in **oxalates**, which can contribute to calcium-oxalate kidney stone formation in susceptible individuals. For most people with diabetes and hypertension it's actually beneficial (low GI, high potassium) — but if you have a kidney-stone history, the engine swaps it for low-oxalate greens like cauliflower.\n\n---\n*This is educational information, not medical advice.*",
  oats:
    "Oats were recommended because they're **low glycemic index (GI 55)** and **high in soluble fiber (beta-glucan)**, which slows glucose absorption — directly supporting your blood sugar control for Type 2 Diabetes. They're also naturally low in sodium, fitting your DASH protocol for Hypertension.\n\n---\n*This is educational information, not medical advice.*",
  protein:
    "Your protein target is set based on your weight, goal, and conditions. For weight loss, higher protein (1.6–1.8 g/kg) preserves muscle mass during a calorie deficit and keeps you satiated. For muscle gain it goes up to 2.1–2.3 g/kg. I draw it mainly from plant sources (dal, paneer, soya) or lean meats (chicken, fish) depending on your protein preference.\n\n---\n*This is educational information, not medical advice.*",
  meditation:
    "Meditation is a powerful clinical tool for your conditions. Regular practice **reduces cortisol by up to 31%** — and since cortisol raises both blood pressure and blood glucose, this has direct therapeutic value. Start with **4-7-8 breathing** (5 min, 3× per day) and progress to a 10-minute body scan at bedtime. Insight Timer is free and excellent.\n\n---\n*This is educational information, not medical advice.*",
  muscle:
    "For muscle gain, I target **2.1–2.3 g protein per kg** body weight. The key is distributing protein across all 5 meals (not just loading at dinner) and including post-workout protein within 30–60 minutes. For vegetarians, I combine complementary plant proteins (e.g., rajma + rice) to ensure a complete amino acid profile. Soya chunks, paneer, and Greek yoghurt are your highest-protein vegetarian staples.\n\n---\n*This is educational information, not medical advice.*",
  aging:
    "Healthy aging nutrition focuses on **four pillars**: (1) Adequate protein (1.3–1.5 g/kg) to prevent sarcopenia — age-related muscle loss; (2) Anti-inflammatory foods — turmeric, walnuts, berries, fatty fish; (3) Bone density — calcium, vitamin D, magnesium from dahi, ragi, sesame; (4) Gut health — high fiber (30+ g/day), fermented foods. Khichdi is a near-perfect healthy-aging meal: easy to digest, complete protein, and anti-inflammatory.\n\n---\n*This is educational information, not medical advice.*",
};

export function getDemoChatResponse(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("spinach")) return DEMO_CHAT_RESPONSES.spinach;
  if (m.includes("oat")) return DEMO_CHAT_RESPONSES.oats;
  if (m.includes("protein")) return DEMO_CHAT_RESPONSES.protein;
  if (m.includes("meditat") || m.includes("breath") || m.includes("calm")) return DEMO_CHAT_RESPONSES.meditation;
  if (m.includes("muscle") || m.includes("gain") || m.includes("bulk")) return DEMO_CHAT_RESPONSES.muscle;
  if (m.includes("aging") || m.includes("ageing") || m.includes("elder") || m.includes("senior")) return DEMO_CHAT_RESPONSES.aging;
  return DEMO_CHAT_RESPONSES.default;
}

// ─── Progress history ──────────────────────────────────────────────────────────
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
