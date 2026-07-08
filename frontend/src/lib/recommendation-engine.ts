/**
 * Client-side recommendation engine for demo mode (static GitHub Pages build).
 *
 * Everything is generated DYNAMICALLY from the user's onboarding selections —
 * age, gender, weight, activity level, primary goal, medical conditions,
 * cuisine and protein preference. A large food + exercise library combined with
 * date-seeded rotation yields hundreds of distinct plan combinations rather than
 * a handful of hard-coded ones.
 *
 * Clinical logic mirrors the backend engines:
 *   - Mifflin-St Jeor BMR → TDEE → goal-adjusted calorie target
 *   - Goal-based macro splits, with a CKD protein cap override
 *   - Strictest health rule wins when multiple conditions conflict
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type Diet = "vegan" | "vegetarian" | "pescatarian" | "nonveg";
export type Slot = "breakfast" | "mid_morning" | "lunch" | "evening_snack" | "dinner";

interface Food {
  id: string;
  name: string;
  local?: string;
  group: string;
  cuisines: string[]; // indian | western | mediterranean (universal = all three)
  diet: Diet; // most restrictive diet that may eat it
  slots: Slot[];
  qty: number; // serving grams (or ml)
  cal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
  gi?: number;
  sodium: "low" | "med" | "high";
  oxalate: "low" | "high";
  satfat: "low" | "med" | "high";
  goitrogen?: boolean; // raw cruciferous (thyroid)
  highK?: boolean; // high potassium / phosphorus (CKD)
  anchor?: boolean; // primary protein source
  egg?: boolean; // contains egg — treated as non-veg in Indian cuisine
  tags: string[];
}

export interface OnboardingInput {
  age: number;
  gender: string;
  weight_kg: number;
  height_cm: number;
  activity_level: string;
  goal_type: string;
  conditions: string[];
  medications: string[];
  cuisine: string;
  protein_pref: string;
  name?: string;
  lifestyle?: { sleep_hours?: number; stress_level?: string; water_liters_day?: number };
  /** kcal nudge derived from the user's logged weight trend (progress feedback loop) */
  calorie_adjustment?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Food library  (~90 foods across cuisines / diets / slots)
// ─────────────────────────────────────────────────────────────────────────────
const ALL: string[] = ["indian", "western", "mediterranean"];

const FOODS: Food[] = [
  // ── Universal: fruits, nuts, seeds, dairy, eggs, lean animal protein ──────────
  { id: "egg-boiled", name: "Boiled Eggs (2)", local: "Uble Ande", group: "protein", cuisines: ALL, diet: "vegetarian", slots: ["breakfast", "evening_snack"], qty: 100, cal: 155, p: 13, c: 1, f: 11, fiber: 0, sodium: "low", oxalate: "low", satfat: "low", anchor: true, egg: true, tags: ["Complete Protein", "Muscle Recovery"] },
  { id: "egg-bhurji", name: "Egg Bhurji (3 eggs)", local: "Anda Bhurji", group: "protein", cuisines: ["indian"], diet: "vegetarian", slots: ["breakfast"], qty: 150, cal: 240, p: 18, c: 3, f: 18, fiber: 1, sodium: "med", oxalate: "low", satfat: "med", anchor: true, egg: true, tags: ["Complete Protein", "High Protein"] },
  { id: "egg-omelette", name: "Veggie Omelette (3 eggs)", group: "protein", cuisines: ALL, diet: "vegetarian", slots: ["breakfast"], qty: 180, cal: 260, p: 20, c: 4, f: 18, fiber: 1, sodium: "med", oxalate: "low", satfat: "med", anchor: true, egg: true, tags: ["Complete Protein", "High Protein", "Muscle Recovery"] },
  { id: "greek-yogurt", name: "Greek Yogurt", local: "Chakka Dahi", group: "dairy", cuisines: ALL, diet: "vegetarian", slots: ["breakfast", "mid_morning", "evening_snack"], qty: 180, cal: 180, p: 18, c: 10, f: 4, fiber: 0, gi: 14, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["High Protein", "Probiotic", "Calcium"] },
  { id: "low-fat-curd", name: "Low-Fat Curd", local: "Dahi", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["breakfast", "lunch", "evening_snack"], qty: 150, cal: 82, p: 7, c: 10, f: 2, fiber: 0, gi: 35, sodium: "low", oxalate: "low", satfat: "low", tags: ["Probiotic", "Low Sodium", "Calcium"] },
  { id: "paneer", name: "Low-Fat Paneer", local: "Paneer", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["lunch", "dinner"], qty: 100, cal: 200, p: 18, c: 2, f: 13, fiber: 0, sodium: "low", oxalate: "low", satfat: "high", anchor: true, tags: ["Vegetarian Protein", "Calcium"] },
  { id: "paneer-bhurji", name: "Paneer Bhurji", local: "Paneer Bhurji", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["breakfast"], qty: 150, cal: 290, p: 22, c: 6, f: 20, fiber: 1, sodium: "low", oxalate: "low", satfat: "high", anchor: true, tags: ["High Protein", "Complete Amino"] },
  { id: "almonds", name: "Almonds", local: "Badam", group: "nuts", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 25, cal: 145, p: 5, c: 5, f: 13, fiber: 3, sodium: "low", oxalate: "high", satfat: "low", tags: ["Healthy Fats", "Vitamin E"] },
  { id: "walnuts", name: "Walnuts", local: "Akhrot", group: "nuts", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack", "breakfast"], qty: 20, cal: 131, p: 3, c: 3, f: 13, fiber: 2, sodium: "low", oxalate: "low", satfat: "low", tags: ["Omega-3", "Brain Health", "Anti-Inflammatory"] },
  { id: "pumpkin-seeds", name: "Roasted Pumpkin Seeds", local: "Kaddu Beej", group: "seeds", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 20, cal: 113, p: 6, c: 4, f: 9, fiber: 2, sodium: "low", oxalate: "low", satfat: "low", tags: ["Zinc", "Magnesium", "Bone Health"] },
  { id: "chia", name: "Chia Seeds", group: "seeds", cuisines: ALL, diet: "vegan", slots: ["breakfast", "mid_morning"], qty: 12, cal: 58, p: 2, c: 5, f: 4, fiber: 4, sodium: "low", oxalate: "low", satfat: "low", tags: ["Omega-3", "High Fiber", "Hydrophilic"] },
  { id: "flax", name: "Ground Flaxseeds", local: "Alsi", group: "seeds", cuisines: ALL, diet: "vegan", slots: ["breakfast", "mid_morning"], qty: 20, cal: 110, p: 4, c: 6, f: 9, fiber: 7, sodium: "low", oxalate: "low", satfat: "low", tags: ["Omega-3", "Heart Healthy", "High Fiber"] },
  { id: "berries", name: "Mixed Berries", group: "fruit", cuisines: ALL, diet: "vegan", slots: ["breakfast", "mid_morning", "evening_snack"], qty: 100, cal: 57, p: 1, c: 14, f: 0, fiber: 4, gi: 25, sodium: "low", oxalate: "low", satfat: "low", tags: ["Antioxidant", "Anti-Inflammatory", "Low GI"] },
  { id: "guava", name: "Guava", local: "Amrood", group: "fruit", cuisines: ["indian"], diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 120, cal: 68, p: 1, c: 14, f: 1, fiber: 5, gi: 12, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low GI", "High Fiber", "Vitamin C"] },
  { id: "apple", name: "Apple", group: "fruit", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 150, cal: 78, p: 0, c: 21, f: 0, fiber: 4, gi: 38, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low GI", "Fiber", "Quercetin"] },
  { id: "banana", name: "Banana", local: "Kela", group: "fruit", cuisines: ALL, diet: "vegan", slots: ["mid_morning"], qty: 120, cal: 107, p: 1, c: 27, f: 0, fiber: 3, gi: 51, sodium: "low", oxalate: "low", satfat: "low", highK: true, tags: ["Pre-workout Fuel", "Potassium"] },
  { id: "orange", name: "Orange", local: "Santra", group: "fruit", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 130, cal: 62, p: 1, c: 15, f: 0, fiber: 3, gi: 43, sodium: "low", oxalate: "low", satfat: "low", tags: ["Vitamin C", "Citrate", "Hydrating"] },
  { id: "chicken", name: "Grilled Chicken Breast", local: "Murgh", group: "protein", cuisines: ALL, diet: "nonveg", slots: ["lunch", "dinner"], qty: 150, cal: 248, p: 47, c: 0, f: 5, fiber: 0, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Lean Protein", "Low Sodium", "Muscle Preservation"] },
  { id: "salmon", name: "Baked Salmon", group: "protein", cuisines: ["western", "mediterranean"], diet: "pescatarian", slots: ["lunch", "dinner"], qty: 150, cal: 310, p: 34, c: 0, f: 19, fiber: 0, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Omega-3", "Heart Healthy", "Lean Protein"] },
  { id: "surmai", name: "Grilled Surmai (King Fish)", local: "Surmai", group: "protein", cuisines: ["indian"], diet: "pescatarian", slots: ["lunch", "dinner"], qty: 150, cal: 215, p: 40, c: 0, f: 6, fiber: 0, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Omega-3", "Lean Protein", "Heart Healthy"] },
  { id: "seabass", name: "Baked Sea Bass with Herbs", group: "protein", cuisines: ["mediterranean"], diet: "pescatarian", slots: ["lunch", "dinner"], qty: 150, cal: 180, p: 30, c: 0, f: 6, fiber: 0, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Omega-3", "Lean Protein", "Heart Healthy"] },
  { id: "green-tea", name: "Green Tea", local: "Hari Chai", group: "beverage", cuisines: ALL, diet: "vegan", slots: ["evening_snack", "mid_morning"], qty: 240, cal: 2, p: 0, c: 0, f: 0, fiber: 0, sodium: "low", oxalate: "low", satfat: "low", tags: ["Antioxidant", "Metabolism"] },

  // ── Indian ───────────────────────────────────────────────────────────────────
  { id: "oats-steel", name: "Steel-Cut Oats", group: "grains", cuisines: ALL, diet: "vegan", slots: ["breakfast"], qty: 60, cal: 225, p: 8, c: 40, f: 4, fiber: 6, gi: 55, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low GI", "High Fiber", "Beta-Glucan"] },
  { id: "poha", name: "Vegetable Poha", local: "Poha", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 120, cal: 200, p: 6, c: 38, f: 3, fiber: 3, gi: 55, sodium: "low", oxalate: "low", satfat: "low", tags: ["Light", "Iron", "Complex Carbs"] },
  { id: "idli", name: "Idli (3) + Sambar", local: "Idli", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 200, cal: 230, p: 9, c: 44, f: 2, fiber: 4, gi: 60, sodium: "med", oxalate: "low", satfat: "low", tags: ["Fermented", "Light", "Plant Protein"] },
  { id: "moong-chilla", name: "Moong Dal Chilla (2)", local: "Chilla", group: "protein", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 150, cal: 210, p: 14, c: 26, f: 5, fiber: 5, gi: 40, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "High Fiber", "Low GI"] },
  { id: "turmeric-milk", name: "Turmeric Milk", local: "Haldi Doodh", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["breakfast", "evening_snack"], qty: 250, cal: 130, p: 7, c: 14, f: 5, fiber: 0, sodium: "low", oxalate: "low", satfat: "med", tags: ["Anti-Inflammatory", "Bone Health", "Curcumin"] },
  { id: "brown-rice", name: "Brown Rice", group: "grains", cuisines: ["indian", "western"], diet: "vegan", slots: ["lunch", "dinner"], qty: 150, cal: 215, p: 5, c: 45, f: 2, fiber: 4, gi: 50, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low GI", "Complex Carbs", "High Fiber"] },
  { id: "roti", name: "Whole Wheat Roti (2)", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 80, cal: 240, p: 8, c: 44, f: 5, fiber: 5, gi: 62, sodium: "low", oxalate: "low", satfat: "low", tags: ["High Fiber", "Whole Grain"] },
  { id: "bajra-roti", name: "Bajra Roti", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 60, cal: 175, p: 5, c: 35, f: 3, fiber: 5, gi: 55, sodium: "low", oxalate: "low", satfat: "low", tags: ["Bone Health", "Magnesium", "Whole Grain"] },
  { id: "masoor-dal", name: "Masoor Dal", local: "Masoor", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 200, cal: 230, p: 18, c: 40, f: 1, fiber: 8, gi: 29, sodium: "low", oxalate: "low", satfat: "low", highK: true, anchor: true, tags: ["Low GI", "High Fiber", "Plant Protein"] },
  { id: "moong-dal", name: "Moong Dal", local: "Moong", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 150, cal: 175, p: 12, c: 30, f: 1, fiber: 6, gi: 25, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "Low GI", "Digestive Health"] },
  { id: "rajma", name: "Rajma (Kidney Beans)", local: "Rajma", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 120, cal: 140, p: 10, c: 25, f: 1, fiber: 7, gi: 24, sodium: "low", oxalate: "high", satfat: "low", highK: true, anchor: true, tags: ["Plant Protein", "Fiber", "Iron"] },
  { id: "chana-salad", name: "Chickpea & Cucumber Salad", local: "Kala Chana", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "evening_snack"], qty: 100, cal: 164, p: 9, c: 27, f: 8, fiber: 8, gi: 28, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["High Fiber", "Plant Protein", "Diabetes Friendly"] },
  { id: "soya-chunks", name: "Soya Chunks Curry", local: "Soya", group: "protein", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 100, cal: 345, p: 35, c: 33, f: 1, fiber: 11, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complete Protein", "Muscle Gain", "High Fiber"] },
  { id: "tofu-palak", name: "Tofu & Spinach Stir-fry", local: "Tofu Palak", group: "protein", cuisines: ["indian", "western"], diet: "vegan", slots: ["lunch", "dinner"], qty: 120, cal: 130, p: 14, c: 5, f: 7, fiber: 3, sodium: "low", oxalate: "high", satfat: "low", anchor: true, tags: ["Plant Protein", "Iron", "Calcium"] },
  { id: "tofu-bhurji", name: "Tofu Bhurji", local: "Tofu", group: "protein", cuisines: ["indian"], diet: "vegan", slots: ["breakfast", "dinner"], qty: 150, cal: 165, p: 18, c: 5, f: 9, fiber: 2, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complete Protein", "Plant-Based", "Low Carb"] },
  { id: "khichdi", name: "Moong Dal Khichdi", local: "Khichdi", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 200, cal: 235, p: 11, c: 40, f: 3, fiber: 5, gi: 35, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Digestive Ease", "Complete Protein", "Joint Friendly"] },
  { id: "bitter-gourd", name: "Bitter Gourd Sabzi", local: "Karela", group: "vegetable", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 80, cal: 64, p: 3, c: 6, f: 3, fiber: 3, gi: 18, sodium: "low", oxalate: "low", satfat: "low", tags: ["Diabetes Friendly", "Low Sodium"] },
  { id: "cauliflower", name: "Cauliflower Sabzi", local: "Gobi", group: "vegetable", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 150, cal: 70, p: 3, c: 8, f: 1, fiber: 3, gi: 15, sodium: "low", oxalate: "low", satfat: "low", goitrogen: true, tags: ["Low GI", "Low Sodium"] },
  { id: "chole-palak", name: "Chickpea & Spinach Curry", local: "Chole Palak", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 120, cal: 196, p: 10, c: 33, f: 6, fiber: 10, gi: 28, sodium: "low", oxalate: "high", satfat: "low", anchor: true, tags: ["High Fiber", "Plant Protein", "Iron"] },
  { id: "buttermilk", name: "Buttermilk", local: "Chaas", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["evening_snack", "lunch"], qty: 200, cal: 82, p: 6, c: 10, f: 2, fiber: 0, gi: 35, sodium: "med", oxalate: "low", satfat: "low", tags: ["Probiotic", "Hydrating"] },
  { id: "sprouts", name: "Moong Sprouts", local: "Ankurit Moong", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["evening_snack", "breakfast"], qty: 60, cal: 60, p: 5, c: 8, f: 2, fiber: 4, sodium: "low", oxalate: "low", satfat: "low", tags: ["Plant Protein", "Digestive Enzymes", "High Fiber"] },
  { id: "roasted-chana", name: "Roasted Chana", local: "Bhuna Chana", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["evening_snack"], qty: 40, cal: 145, p: 8, c: 15, f: 5, fiber: 5, gi: 28, sodium: "low", oxalate: "low", satfat: "low", tags: ["Plant Protein", "Fiber", "Post-workout"] },
  { id: "veg-soup", name: "Mixed Vegetable Soup", local: "Sabzi Shorba", group: "vegetable", cuisines: ["indian", "western"], diet: "vegan", slots: ["dinner", "evening_snack"], qty: 300, cal: 120, p: 5, c: 18, f: 4, fiber: 4, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low Calorie", "Hydrating", "Digestive Ease"] },

  // ── Western ────────────────────────────────────────────────────────────────
  { id: "rolled-oats", name: "Rolled Oats with Milk", group: "grains", cuisines: ["western"], diet: "vegetarian", slots: ["breakfast"], qty: 50, cal: 188, p: 7, c: 32, f: 4, fiber: 5, gi: 55, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low GI", "High Fiber", "Beta-Glucan"] },
  { id: "quinoa", name: "Quinoa", group: "grains", cuisines: ["western", "mediterranean"], diet: "vegan", slots: ["lunch", "dinner"], qty: 90, cal: 200, p: 7, c: 35, f: 3, fiber: 4, gi: 53, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complete Protein", "Low GI", "Gluten Free"] },
  { id: "sweet-potato", name: "Roasted Sweet Potato", group: "vegetable", cuisines: ["western"], diet: "vegan", slots: ["lunch", "dinner"], qty: 120, cal: 103, p: 2, c: 24, f: 0, fiber: 4, gi: 44, sodium: "low", oxalate: "high", satfat: "low", highK: true, tags: ["Low GI", "Beta-Carotene", "Potassium"] },
  { id: "chickpea-tofu-salad", name: "Chickpea & Tofu Salad", group: "legumes", cuisines: ["western", "mediterranean"], diet: "vegan", slots: ["lunch"], qty: 150, cal: 246, p: 18, c: 28, f: 9, fiber: 9, gi: 28, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "High Fiber", "Complete Amino"] },
  { id: "broccoli", name: "Roasted Broccoli & Peppers", group: "vegetable", cuisines: ["western"], diet: "vegan", slots: ["lunch", "dinner"], qty: 100, cal: 43, p: 3, c: 8, f: 1, fiber: 3, gi: 15, sodium: "low", oxalate: "low", satfat: "low", goitrogen: true, tags: ["Antioxidant", "Low Carb", "Vitamin C"] },
  { id: "asparagus", name: "Steamed Asparagus", group: "vegetable", cuisines: ["western"], diet: "vegan", slots: ["dinner"], qty: 100, cal: 20, p: 2, c: 4, f: 0, fiber: 2, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low Calorie", "Folate", "Anti-Inflammatory"] },
  { id: "hummus-veg", name: "Celery & Carrot with Hummus", group: "legumes", cuisines: ["western", "mediterranean"], diet: "vegan", slots: ["evening_snack", "mid_morning"], qty: 80, cal: 120, p: 5, c: 12, f: 7, fiber: 4, sodium: "low", oxalate: "low", satfat: "low", tags: ["High Fiber", "Plant Protein", "Hydrating"] },
  { id: "almond-butter", name: "Almond Butter on Toast", group: "nuts", cuisines: ["western"], diet: "vegan", slots: ["mid_morning", "breakfast"], qty: 40, cal: 180, p: 6, c: 18, f: 11, fiber: 3, gi: 51, sodium: "low", oxalate: "low", satfat: "low", tags: ["Healthy Fats", "Vitamin E", "Complex Carbs"] },
  { id: "turkey-wrap", name: "Turkey & Avocado Wrap", group: "protein", cuisines: ["western"], diet: "nonveg", slots: ["lunch"], qty: 200, cal: 320, p: 30, c: 28, f: 11, fiber: 6, sodium: "med", oxalate: "low", satfat: "low", anchor: true, tags: ["Lean Protein", "Healthy Fats", "High Fiber"] },
  { id: "lentil-soup", name: "Lentil Soup (Red Lentils)", group: "legumes", cuisines: ["western", "mediterranean"], diet: "vegan", slots: ["dinner", "lunch"], qty: 200, cal: 175, p: 13, c: 30, f: 8, fiber: 8, gi: 21, sodium: "low", oxalate: "low", satfat: "low", highK: true, anchor: true, tags: ["High Fiber", "Plant Protein", "Iron"] },
  { id: "cottage-cheese", name: "Cottage Cheese Bowl", group: "dairy", cuisines: ["western"], diet: "vegetarian", slots: ["breakfast", "evening_snack"], qty: 150, cal: 160, p: 20, c: 8, f: 5, fiber: 0, gi: 10, sodium: "med", oxalate: "low", satfat: "low", anchor: true, tags: ["High Protein", "Casein", "Calcium"] },

  // ── Mediterranean ─────────────────────────────────────────────────────────
  { id: "yogurt-parfait", name: "Greek Yogurt Parfait", group: "dairy", cuisines: ["mediterranean"], diet: "vegetarian", slots: ["breakfast"], qty: 180, cal: 200, p: 18, c: 16, f: 4, fiber: 3, gi: 16, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["High Protein", "Probiotic", "Antioxidant"] },
  { id: "shakshuka", name: "Shakshuka (Eggs in Tomato)", group: "protein", cuisines: ["mediterranean"], diet: "vegetarian", slots: ["breakfast"], qty: 200, cal: 250, p: 16, c: 14, f: 14, fiber: 4, sodium: "med", oxalate: "low", satfat: "low", anchor: true, egg: true, tags: ["Complete Protein", "Lycopene", "Heart Healthy"] },
  { id: "med-veg", name: "Roasted Eggplant & Zucchini (Olive Oil)", group: "vegetable", cuisines: ["mediterranean"], diet: "vegan", slots: ["lunch", "dinner"], qty: 150, cal: 95, p: 3, c: 14, f: 5, fiber: 5, sodium: "low", oxalate: "low", satfat: "low", tags: ["Antioxidant", "Heart Healthy", "Low Sodium"] },
  { id: "greek-salad", name: "Greek Salad (Tomato, Olive, Cucumber)", group: "vegetable", cuisines: ["mediterranean"], diet: "vegetarian", slots: ["lunch", "dinner"], qty: 150, cal: 110, p: 4, c: 9, f: 7, fiber: 4, sodium: "med", oxalate: "low", satfat: "low", tags: ["Antioxidant", "Lycopene", "Healthy Fats"] },
  { id: "falafel", name: "Baked Falafel (4)", group: "legumes", cuisines: ["mediterranean"], diet: "vegan", slots: ["lunch", "dinner"], qty: 120, cal: 230, p: 12, c: 26, f: 9, fiber: 7, gi: 35, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "High Fiber", "Iron"] },
  { id: "pita-hummus", name: "Whole Grain Pita & Hummus", group: "grains", cuisines: ["mediterranean"], diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 80, cal: 190, p: 7, c: 28, f: 6, fiber: 5, gi: 55, sodium: "med", oxalate: "low", satfat: "low", tags: ["Complex Carbs", "Plant Protein", "Fiber"] },
  { id: "olives-nuts", name: "Olives & Mixed Nuts", group: "nuts", cuisines: ["mediterranean"], diet: "vegan", slots: ["evening_snack", "mid_morning"], qty: 30, cal: 150, p: 4, c: 6, f: 13, fiber: 2, sodium: "med", oxalate: "low", satfat: "low", tags: ["Healthy Fats", "Heart Healthy", "Antioxidant"] },
  { id: "tabbouleh", name: "Tabbouleh (Bulgur & Herbs)", group: "grains", cuisines: ["mediterranean"], diet: "vegan", slots: ["lunch"], qty: 150, cal: 160, p: 5, c: 28, f: 4, fiber: 6, gi: 48, sodium: "low", oxalate: "low", satfat: "low", tags: ["High Fiber", "Herbs", "Complex Carbs"] },
  { id: "figs-dates", name: "Fresh Figs / Dates (2)", group: "fruit", cuisines: ["mediterranean", "indian"], diet: "vegan", slots: ["evening_snack"], qty: 40, cal: 47, p: 1, c: 12, f: 1, fiber: 2, gi: 50, sodium: "low", oxalate: "low", satfat: "low", tags: ["Natural Sweetness", "Fiber", "Iron"] },

  // ── User-requested additions ─────────────────────────────────────────────────
  { id: "soaked-almonds", name: "Soaked Almonds (overnight)", local: "Bhige Badam", group: "nuts", cuisines: ALL, diet: "vegan", slots: ["breakfast", "mid_morning"], qty: 25, cal: 145, p: 5, c: 5, f: 13, fiber: 3, sodium: "low", oxalate: "high", satfat: "low", tags: ["Healthy Fats", "Vitamin E", "Easier Digestion", "Brain Health"] },
  { id: "sprout-avocado-bowl", name: "Moong Sprout & Avocado Bowl", local: "Ankurit Moong + Avocado", group: "legumes", cuisines: ["indian", "western"], diet: "vegan", slots: ["breakfast", "evening_snack", "mid_morning"], qty: 150, cal: 210, p: 9, c: 18, f: 12, fiber: 8, gi: 25, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "Monounsaturated Fats", "High Fiber", "Heart Healthy"] },
  { id: "yogurt-herb-salad", name: "Garden Salad, Yogurt-Coriander-Mint Dressing", local: "Salad + Dahi Pudina", group: "vegetable", cuisines: ALL, diet: "vegetarian", slots: ["lunch", "dinner"], qty: 180, cal: 130, p: 8, c: 12, f: 6, fiber: 5, gi: 20, sodium: "low", oxalate: "low", satfat: "low", tags: ["Probiotic", "Hydrating", "Homemade Dressing", "Low GI"] },
  { id: "yogurt-pepper-cashew", name: "Yogurt-Roasted Peppers with Cashew", group: "vegetable", cuisines: ["mediterranean", "western"], diet: "vegetarian", slots: ["evening_snack", "lunch"], qty: 120, cal: 165, p: 7, c: 12, f: 10, fiber: 3, sodium: "low", oxalate: "low", satfat: "low", tags: ["Antioxidant", "Probiotic", "Vitamin C", "Healthy Fats"] },
  { id: "tofu-veg-stirfry", name: "Stir-Fry Veggies with Tofu", group: "protein", cuisines: ALL, diet: "vegan", slots: ["lunch", "dinner"], qty: 200, cal: 230, p: 18, c: 16, f: 11, fiber: 6, gi: 30, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complete Protein", "Plant-Based", "High Fiber", "Iron"] },
  { id: "hummus-falafel-platter", name: "Homemade Hummus, Falafel & Roasted Veggie Platter", group: "legumes", cuisines: ["mediterranean", "western"], diet: "vegan", slots: ["lunch", "dinner"], qty: 250, cal: 340, p: 16, c: 38, f: 14, fiber: 11, gi: 35, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "High Fiber", "Heart Healthy", "Homemade"] },

  // ── Expanded library: more breakfasts ────────────────────────────────────────
  { id: "besan-chilla", name: "Besan Chilla (2) with Veggies", local: "Besan Chilla", group: "protein", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 160, cal: 220, p: 13, c: 24, f: 7, fiber: 5, gi: 40, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "Low GI", "High Fiber"] },
  { id: "ragi-dosa", name: "Ragi Dosa (2) with Chutney", local: "Ragi Dosa", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 180, cal: 210, p: 7, c: 38, f: 4, fiber: 6, gi: 52, sodium: "low", oxalate: "low", satfat: "low", tags: ["Calcium", "Whole Grain", "High Fiber"] },
  { id: "upma", name: "Vegetable Upma (Suji)", local: "Upma", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 180, cal: 230, p: 6, c: 40, f: 6, fiber: 4, gi: 58, sodium: "low", oxalate: "low", satfat: "low", tags: ["Light", "Complex Carbs"] },
  { id: "dalia", name: "Vegetable Dalia (Broken Wheat)", local: "Dalia", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 200, cal: 200, p: 7, c: 38, f: 3, fiber: 6, gi: 50, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low GI", "High Fiber", "Whole Grain"] },
  { id: "thepla", name: "Methi Thepla (2)", local: "Thepla", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["breakfast"], qty: 90, cal: 230, p: 7, c: 36, f: 7, fiber: 5, gi: 55, sodium: "low", oxalate: "low", satfat: "low", tags: ["Iron", "Whole Grain", "Fiber"] },
  { id: "stuffed-paratha", name: "Paneer Stuffed Paratha (1)", local: "Paneer Paratha", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["breakfast"], qty: 150, cal: 290, p: 14, c: 34, f: 12, fiber: 4, gi: 58, sodium: "low", oxalate: "low", satfat: "med", anchor: true, tags: ["Vegetarian Protein", "Calcium", "Filling"] },
  { id: "smoothie-bowl", name: "Berry & Seed Protein Smoothie Bowl", group: "fruit", cuisines: ["western", "mediterranean"], diet: "vegetarian", slots: ["breakfast"], qty: 250, cal: 240, p: 16, c: 30, f: 7, fiber: 7, gi: 35, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["High Protein", "Antioxidant", "High Fiber"] },
  { id: "avocado-toast", name: "Avocado Toast on Whole Grain", group: "grains", cuisines: ["western", "mediterranean"], diet: "vegan", slots: ["breakfast"], qty: 150, cal: 260, p: 8, c: 30, f: 13, fiber: 8, gi: 50, sodium: "low", oxalate: "low", satfat: "low", tags: ["Monounsaturated Fats", "High Fiber", "Heart Healthy"] },
  { id: "muesli-yogurt", name: "Bircher Muesli with Yogurt", group: "grains", cuisines: ["western"], diet: "vegetarian", slots: ["breakfast"], qty: 200, cal: 250, p: 12, c: 38, f: 6, fiber: 6, gi: 50, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["High Fiber", "Probiotic", "Complex Carbs"] },

  // ── Expanded library: more mid-morning / snacks ──────────────────────────────
  { id: "papaya", name: "Papaya Bowl", local: "Papita", group: "fruit", cuisines: ["indian"], diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 150, cal: 65, p: 1, c: 16, f: 0, fiber: 3, gi: 38, sodium: "low", oxalate: "low", satfat: "low", tags: ["Digestive Enzymes", "Vitamin C", "Low GI"] },
  { id: "pear", name: "Pear", local: "Nashpati", group: "fruit", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 150, cal: 85, p: 1, c: 22, f: 0, fiber: 5, gi: 38, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low GI", "High Fiber", "Hydrating"] },
  { id: "pomegranate", name: "Pomegranate", local: "Anar", group: "fruit", cuisines: ["indian", "mediterranean"], diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 100, cal: 83, p: 2, c: 19, f: 1, fiber: 4, gi: 35, sodium: "low", oxalate: "low", satfat: "low", tags: ["Antioxidant", "Anti-Inflammatory", "Heart Healthy"] },
  { id: "makhana", name: "Roasted Makhana (Fox Nuts)", local: "Makhana", group: "seeds", cuisines: ["indian"], diet: "vegan", slots: ["evening_snack", "mid_morning"], qty: 30, cal: 105, p: 4, c: 18, f: 2, fiber: 3, gi: 50, sodium: "low", oxalate: "low", satfat: "low", tags: ["Low Calorie", "Magnesium", "Light Snack"] },
  { id: "trail-mix", name: "Nut & Seed Trail Mix", group: "nuts", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 30, cal: 165, p: 5, c: 8, f: 13, fiber: 3, sodium: "low", oxalate: "low", satfat: "low", tags: ["Healthy Fats", "Magnesium", "Energy"] },
  { id: "edamame", name: "Steamed Edamame", group: "legumes", cuisines: ["western"], diet: "vegan", slots: ["evening_snack", "mid_morning"], qty: 100, cal: 122, p: 11, c: 10, f: 5, fiber: 5, gi: 18, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complete Protein", "High Fiber", "Low GI"] },
  { id: "dhokla", name: "Steamed Dhokla (4 pcs)", local: "Dhokla", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["evening_snack", "breakfast"], qty: 120, cal: 160, p: 8, c: 24, f: 3, fiber: 4, gi: 45, sodium: "med", oxalate: "low", satfat: "low", anchor: true, tags: ["Fermented", "Plant Protein", "Steamed"] },
  { id: "fruit-yogurt", name: "Fruit & Nut Yogurt Cup", group: "dairy", cuisines: ALL, diet: "vegetarian", slots: ["evening_snack", "mid_morning"], qty: 150, cal: 150, p: 10, c: 18, f: 4, fiber: 2, gi: 30, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Probiotic", "Calcium", "Protein"] },

  // ── Expanded library: more lunch / dinner mains ──────────────────────────────
  { id: "fish-curry", name: "Coconut Fish Curry", local: "Macchi Curry", group: "protein", cuisines: ["indian"], diet: "pescatarian", slots: ["lunch", "dinner"], qty: 180, cal: 260, p: 28, c: 6, f: 13, fiber: 1, sodium: "low", oxalate: "low", satfat: "med", anchor: true, tags: ["Omega-3", "Lean Protein", "Heart Healthy"] },
  { id: "tandoori-chicken", name: "Tandoori Chicken (Grilled)", local: "Tandoori Murgh", group: "protein", cuisines: ["indian"], diet: "nonveg", slots: ["lunch", "dinner"], qty: 150, cal: 235, p: 38, c: 3, f: 8, fiber: 0, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Lean Protein", "Low Carb", "Muscle Preservation"] },
  { id: "egg-curry", name: "Egg Curry (2 eggs)", local: "Anda Curry", group: "protein", cuisines: ["indian"], diet: "vegetarian", slots: ["lunch", "dinner"], qty: 200, cal: 245, p: 15, c: 8, f: 17, fiber: 2, sodium: "med", oxalate: "low", satfat: "med", anchor: true, egg: true, tags: ["Complete Protein", "Muscle Recovery"] },
  { id: "kadhi", name: "Low-Fat Kadhi with Brown Rice", local: "Kadhi Chawal", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["lunch", "dinner"], qty: 250, cal: 240, p: 10, c: 38, f: 5, fiber: 3, gi: 50, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Probiotic", "Comfort Food", "Plant Protein"] },
  { id: "palak-paneer", name: "Palak Paneer (Low-Fat)", local: "Palak Paneer", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["lunch", "dinner"], qty: 200, cal: 240, p: 16, c: 10, f: 15, fiber: 4, sodium: "low", oxalate: "high", satfat: "med", anchor: true, tags: ["Vegetarian Protein", "Iron", "Calcium"] },
  { id: "veg-pulao", name: "Vegetable Brown Rice Pulao", local: "Pulao", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 220, cal: 250, p: 7, c: 45, f: 5, fiber: 6, gi: 50, sodium: "low", oxalate: "low", satfat: "low", tags: ["Complex Carbs", "High Fiber", "Low GI"] },
  { id: "sambar-rice", name: "Sambar with Brown Rice", local: "Sambar Chawal", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 250, cal: 270, p: 12, c: 48, f: 3, fiber: 8, gi: 48, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "High Fiber", "Low GI"] },
  { id: "lauki-chana", name: "Lauki Chana Dal", local: "Lauki Chana", group: "legumes", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 200, cal: 190, p: 11, c: 28, f: 3, fiber: 8, gi: 30, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Plant Protein", "Low GI", "Light"] },
  { id: "baingan-bharta", name: "Baingan Bharta", local: "Baingan Bharta", group: "vegetable", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 180, cal: 120, p: 4, c: 14, f: 6, fiber: 6, gi: 30, sodium: "low", oxalate: "low", satfat: "low", tags: ["Smoky", "High Fiber", "Low Calorie"] },
  { id: "mixed-veg-sabzi", name: "Mixed Vegetable Sabzi", local: "Mix Veg", group: "vegetable", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 180, cal: 130, p: 5, c: 16, f: 6, fiber: 6, gi: 35, sodium: "low", oxalate: "low", satfat: "low", tags: ["High Fiber", "Antioxidant", "Low Calorie"] },
  { id: "grilled-prawns", name: "Garlic Grilled Prawns", group: "protein", cuisines: ["western", "mediterranean", "indian"], diet: "pescatarian", slots: ["lunch", "dinner"], qty: 150, cal: 170, p: 30, c: 2, f: 5, fiber: 0, sodium: "med", oxalate: "low", satfat: "low", anchor: true, tags: ["Lean Protein", "Low Calorie", "Selenium"] },
  { id: "tuna-salad", name: "Tuna & White Bean Salad", group: "protein", cuisines: ["mediterranean", "western"], diet: "pescatarian", slots: ["lunch", "dinner"], qty: 200, cal: 260, p: 28, c: 18, f: 8, fiber: 6, gi: 30, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Lean Protein", "Omega-3", "High Fiber"] },
  { id: "stuffed-peppers", name: "Quinoa-Stuffed Bell Peppers", group: "grains", cuisines: ["mediterranean", "western"], diet: "vegan", slots: ["lunch", "dinner"], qty: 220, cal: 240, p: 9, c: 38, f: 6, fiber: 7, gi: 48, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complete Protein", "High Fiber", "Antioxidant"] },
  { id: "minestrone", name: "Minestrone Bean Soup", group: "legumes", cuisines: ["mediterranean", "western"], diet: "vegan", slots: ["dinner", "lunch"], qty: 300, cal: 200, p: 11, c: 32, f: 4, fiber: 9, gi: 35, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["High Fiber", "Plant Protein", "Hydrating"] },
  { id: "grilled-veg-quinoa", name: "Grilled Vegetable & Quinoa Bowl", group: "grains", cuisines: ["mediterranean", "western"], diet: "vegan", slots: ["lunch", "dinner"], qty: 250, cal: 290, p: 11, c: 42, f: 9, fiber: 8, gi: 50, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complete Protein", "High Fiber", "Antioxidant"] },
  { id: "chicken-quinoa-bowl", name: "Grilled Chicken Quinoa Bowl", group: "protein", cuisines: ["western", "mediterranean"], diet: "nonveg", slots: ["lunch", "dinner"], qty: 250, cal: 360, p: 38, c: 32, f: 9, fiber: 6, gi: 50, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Lean Protein", "Complete Protein", "High Fiber"] },

  // ── Calorie-dense healthy options (high-calorie / muscle-gain targets) ───────
  { id: "pb-banana-toast", name: "Peanut Butter Banana Toast", group: "grains", cuisines: ALL, diet: "vegan", slots: ["breakfast", "mid_morning"], qty: 120, cal: 340, p: 11, c: 42, f: 15, fiber: 6, gi: 55, sodium: "low", oxalate: "low", satfat: "low", tags: ["High Energy", "Healthy Fats", "Pre-workout Fuel"] },
  { id: "granola-yogurt", name: "Granola with Greek Yogurt & Honey", group: "grains", cuisines: ["western", "mediterranean"], diet: "vegetarian", slots: ["breakfast"], qty: 220, cal: 380, p: 18, c: 48, f: 12, fiber: 5, gi: 55, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["High Energy", "Probiotic", "High Protein"] },
  { id: "banana-pb-smoothie", name: "Banana Peanut Smoothie", group: "dairy", cuisines: ALL, diet: "vegetarian", slots: ["breakfast", "mid_morning"], qty: 350, cal: 380, p: 16, c: 48, f: 13, fiber: 5, gi: 48, sodium: "low", oxalate: "low", satfat: "low", highK: true, anchor: true, tags: ["High Energy", "Muscle Recovery", "Potassium"] },
  { id: "dates-nut-laddoo", name: "Date & Nut Energy Balls (2)", local: "Khajur Laddoo", group: "seeds", cuisines: ["indian", "mediterranean"], diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 60, cal: 220, p: 5, c: 28, f: 10, fiber: 4, gi: 45, sodium: "low", oxalate: "low", satfat: "low", highK: true, tags: ["Natural Sweetness", "High Energy", "Iron"] },
  { id: "dried-fruit-mix", name: "Dried Fruits & Nuts Mix", group: "nuts", cuisines: ALL, diet: "vegan", slots: ["mid_morning", "evening_snack"], qty: 45, cal: 210, p: 5, c: 22, f: 12, fiber: 3, gi: 50, sodium: "low", oxalate: "low", satfat: "low", highK: true, tags: ["High Energy", "Healthy Fats", "Portable"] },
  { id: "mango", name: "Mango", local: "Aam", group: "fruit", cuisines: ["indian"], diet: "vegan", slots: ["mid_morning"], qty: 150, cal: 90, p: 1, c: 22, f: 0, fiber: 2, gi: 51, sodium: "low", oxalate: "low", satfat: "low", tags: ["Vitamin A", "Natural Sweetness", "Seasonal"] },
  { id: "sweet-corn-chaat", name: "Sweet Corn Chaat", local: "Bhutta Chaat", group: "vegetable", cuisines: ["indian"], diet: "vegan", slots: ["evening_snack", "mid_morning"], qty: 150, cal: 180, p: 6, c: 32, f: 3, fiber: 4, gi: 55, sodium: "low", oxalate: "low", satfat: "low", tags: ["High Energy", "Fiber", "Street-Style Healthy"] },
  { id: "veg-biryani-brown", name: "Vegetable Brown Rice Biryani", local: "Veg Biryani", group: "grains", cuisines: ["indian"], diet: "vegan", slots: ["lunch", "dinner"], qty: 280, cal: 380, p: 9, c: 62, f: 10, fiber: 7, gi: 55, sodium: "med", oxalate: "low", satfat: "low", tags: ["High Energy", "Complex Carbs", "High Fiber"] },
  { id: "ww-pasta", name: "Whole Wheat Pasta Primavera", group: "grains", cuisines: ["western", "mediterranean"], diet: "vegan", slots: ["lunch", "dinner"], qty: 250, cal: 380, p: 13, c: 62, f: 9, fiber: 8, gi: 48, sodium: "low", oxalate: "low", satfat: "low", tags: ["Complex Carbs", "High Fiber", "High Energy"] },
  { id: "couscous-chickpea", name: "Couscous & Chickpea Bowl", group: "grains", cuisines: ["mediterranean"], diet: "vegan", slots: ["lunch", "dinner"], qty: 250, cal: 360, p: 13, c: 58, f: 8, fiber: 8, gi: 61, sodium: "low", oxalate: "low", satfat: "low", anchor: true, tags: ["Complex Carbs", "Plant Protein", "High Energy"] },
  { id: "baked-potato", name: "Baked Potato with Herbed Yogurt", group: "vegetable", cuisines: ["western"], diet: "vegetarian", slots: ["lunch", "dinner"], qty: 250, cal: 250, p: 8, c: 46, f: 4, fiber: 5, gi: 65, sodium: "low", oxalate: "low", satfat: "low", highK: true, tags: ["High Energy", "Potassium", "Satisfying"] },
  { id: "paneer-rice-bowl", name: "Paneer & Veg Brown Rice Bowl", local: "Paneer Chawal", group: "dairy", cuisines: ["indian"], diet: "vegetarian", slots: ["lunch", "dinner"], qty: 300, cal: 420, p: 22, c: 52, f: 14, fiber: 6, gi: 52, sodium: "low", oxalate: "low", satfat: "med", anchor: true, tags: ["High Protein", "High Energy", "Complete Meal"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Condition rules  (strictest health rule wins when conditions conflict — hard excludes + soft preferences)
// ─────────────────────────────────────────────────────────────────────────────
function isExcluded(food: Food, conditions: string[]): boolean {
  for (const c of conditions) {
    if ((c === "T2D" || c === "PREDIABETES") && food.gi !== undefined && food.gi >= 70) return true;
    if ((c === "HTN" || c === "HEART_DISEASE") && food.sodium === "high") return true;
    if (c === "KIDNEY_STONES" && food.oxalate === "high") return true;
    if ((c === "HYPERLIPIDEMIA" || c === "HEART_DISEASE") && food.satfat === "high") return true;
    if (c === "CKD" && food.highK) return true;
    if (c === "THYROID" && food.goitrogen) return true;
  }
  return false;
}

/** Soft preference score: higher = better fit for the user's conditions, medications + goal. */
function preferenceScore(food: Food, conditions: string[], goal: string, medications: string[] = []): number {
  let s = 0;
  for (const c of conditions) {
    if ((c === "T2D" || c === "PREDIABETES") && food.gi !== undefined && food.gi < 55) s += 3;
    if ((c === "HTN" || c === "HEART_DISEASE") && food.sodium === "low") s += 2;
    if ((c === "HYPERLIPIDEMIA" || c === "HEART_DISEASE") && food.fiber >= 5) s += 2;
    if (c === "KIDNEY_STONES" && food.oxalate === "low") s += 1;
  }
  // Medication interactions steer food ranking (soft, not hard excludes):
  // ACE/ARB BP meds raise potassium retention → de-prioritise high-potassium foods;
  // diuretics flush potassium → favour them instead.
  if (food.highK) {
    if (medications.includes("ace_arb")) s -= 3;
    else if (medications.includes("diuretics")) s += 2;
  }
  const proteinDensity = food.p / Math.max(food.cal, 1);
  if (goal === "muscle_gain") s += proteinDensity * 20 + (food.anchor ? 2 : 0);
  else if (goal === "weight_loss" || goal === "fat_loss") s += proteinDensity * 12 + food.fiber * 0.4;
  else if (goal === "healthy_aging") {
    if (food.tags.some((t) => /anti-inflammatory|omega|brain|bone|antioxidant/i.test(t))) s += 3;
    s += food.fiber * 0.3;
  }
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic per-day rotation (so plans vary daily but are stable within a day)
// ─────────────────────────────────────────────────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function daySeed(extra = 0, dayOffset = 0): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return now.getFullYear() * 1000 + dayOfYear + dayOffset + extra * 131;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diet compatibility
// ─────────────────────────────────────────────────────────────────────────────
const DIET_RANK: Record<Diet, number> = { vegan: 0, vegetarian: 1, pescatarian: 2, nonveg: 3 };
function prefRank(pref: string): number {
  if (pref === "vegan") return 0;
  if (pref === "vegetarian") return 1;
  if (pref === "pescatarian") return 2;
  return 3; // non_vegetarian
}
function dietAllows(pref: string, food: Food): boolean {
  return DIET_RANK[food.diet] <= prefRank(pref);
}

/**
 * In Indian cuisine, eggs are considered non-vegetarian. So an Indian
 * vegetarian (or vegan) is never offered egg dishes — but dairy, paneer,
 * soy and tofu remain perfectly fine. For Western / Mediterranean cuisines
 * an (ovo-)vegetarian can still have eggs.
 */
function eggAllowed(input: OnboardingInput, food: Food): boolean {
  if (!food.egg) return true;
  const veg = prefRank(input.protein_pref) <= 1; // vegan or vegetarian
  if (veg && (input.cuisine || "indian") === "indian") return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Macro calculation  (Mifflin-St Jeor)
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVITY_MULT: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};
const GOAL_CAL_ADJ: Record<string, number> = {
  weight_loss: -500, fat_loss: -300, muscle_gain: 300, maintenance: 0, healthy_aging: -100,
  cardiovascular: -200, diabetes_friendly: -300, blood_pressure_management: -200,
};
// protein grams per kg of bodyweight, tuned per goal
const GOAL_PROTEIN: Record<string, number> = {
  weight_loss: 1.8, fat_loss: 1.9, muscle_gain: 2.2, maintenance: 1.4, healthy_aging: 1.4,
  cardiovascular: 1.5, diabetes_friendly: 1.6, blood_pressure_management: 1.5,
};
// dietary fat as a share of total calories (remaining calories go to carbs). Lower
// fat + higher carbs for muscle gain; higher fat + fewer carbs for diabetes control.
const GOAL_FAT_PCT: Record<string, number> = {
  muscle_gain: 0.20, weight_loss: 0.30, fat_loss: 0.30, maintenance: 0.28,
  healthy_aging: 0.30, cardiovascular: 0.25, diabetes_friendly: 0.35, blood_pressure_management: 0.27,
};

export function computeMacros(input: OnboardingInput) {
  const w = input.weight_kg || 75;
  const h = input.height_cm || 170;
  const age = input.age || 40;
  const bmr = 10 * w + 6.25 * h - 5 * age + (input.gender === "female" ? -161 : 5);
  const tdee = bmr * (ACTIVITY_MULT[input.activity_level] || 1.4);
  const goal = input.goal_type || "weight_loss";
  // Never prescribe below a clinically safe minimum, even for small/sedentary
  // users where a raw deficit would be dangerously low.
  const safeFloor = input.gender === "female" ? 1200 : 1500;
  // progress feedback: nudge from logged weight trend, clamped to ±150 kcal
  const trendAdj = Math.max(-150, Math.min(150, input.calorie_adjustment ?? 0));
  const calories = Math.max(safeFloor, Math.round((tdee + (GOAL_CAL_ADJ[goal] ?? 0) + trendAdj) / 10) * 10);

  let proteinPerKg = GOAL_PROTEIN[goal] ?? 1.5;
  // CKD override: cap protein at 0.75 g/kg regardless of goal
  const hasCKD = input.conditions.includes("CKD");
  if (hasCKD) proteinPerKg = Math.min(proteinPerKg, 0.75);

  const protein_g = Math.round(proteinPerKg * w);
  const proteinCals = protein_g * 4;
  // fat share is goal-specific; remaining calories become carbs
  const fatPct = GOAL_FAT_PCT[goal] ?? 0.28;
  const fat_g = Math.round((calories * fatPct) / 9);
  const carbs_g = Math.max(0, Math.round((calories - proteinCals - fat_g * 9) / 4));
  // Diabetes / prediabetes: hold carbs to a lower ceiling and route the rest to fat
  let carbsFinal = carbs_g;
  let fatFinal = fat_g;
  const carbControl = goal === "diabetes_friendly" || input.conditions.includes("T2D") || input.conditions.includes("PREDIABETES");
  if (carbControl) {
    const carbCeil = Math.round((calories * 0.40) / 4); // ≤40% of calories from carbs
    if (carbsFinal > carbCeil) {
      const shiftedCals = (carbsFinal - carbCeil) * 4;
      carbsFinal = carbCeil;
      fatFinal = fat_g + Math.round(shiftedCals / 9);
    }
  }
  const fiber_g = Math.max(25, Math.round((calories / 1000) * 14));

  return {
    calories,
    protein_g,
    carbs_g: carbsFinal,
    fat_g: fatFinal,
    fiber_g,
    protein_g_per_kg: Math.round(proteinPerKg * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Meal plan generation
// ─────────────────────────────────────────────────────────────────────────────
const SLOTS: { slot: Slot; share: number; maxItems: number; needsAnchor: boolean }[] = [
  { slot: "breakfast", share: 0.25, maxItems: 3, needsAnchor: true },
  { slot: "mid_morning", share: 0.1, maxItems: 2, needsAnchor: false },
  { slot: "lunch", share: 0.33, maxItems: 4, needsAnchor: true },
  { slot: "evening_snack", share: 0.1, maxItems: 2, needsAnchor: false },
  { slot: "dinner", share: 0.22, maxItems: 3, needsAnchor: true },
];

const SLOT_LABELS: Record<Slot, string> = {
  breakfast: "breakfast", mid_morning: "mid-morning", lunch: "lunch",
  evening_snack: "evening snack", dinner: "dinner",
};

// Snap a scaled portion to a tidy, human-readable number.
function roundQty(q: number): number {
  if (q >= 100) return Math.round(q / 10) * 10;
  if (q >= 30) return Math.round(q / 5) * 5;
  return Math.max(1, Math.round(q));
}

// How far a serving may shrink or grow so portions right-size to the user's
// calorie / protein needs without becoming unrealistic. Calorie-dense foods
// (nuts, seeds) are capped tighter; carbs and proteins get more headroom.
function scaleBounds(food: Food): [number, number] {
  if (food.group === "beverage") return [1, 1];
  switch (food.group) {
    case "nuts":
    case "seeds": return [0.5, 1.25];
    case "fruit": return [0.75, 1.5];
    case "vegetable": return [0.75, 1.75];
    case "grains": return [0.5, 1.75];
    case "protein":
    case "dairy":
    case "legumes": return [0.75, 1.8];
    default: return [0.75, 1.5];
  }
}

function buildFoodObj(food: Food, scale: number) {
  return {
    id: `food-${food.id}`,
    name: food.name,
    name_local: food.local || null,
    food_group: food.group,
    calories: Math.round(food.cal * scale),
    protein_g: Math.round(food.p * scale),
    carbs_g: Math.round(food.c * scale),
    fat_g: Math.round(food.f * scale),
    fiber_g: Math.round(food.fiber * scale * 10) / 10,
    glycemic_index: food.gi,
    is_low_gi: food.gi ? food.gi < 55 : false,
    is_high_fiber: food.fiber * scale >= 5,
  };
}

function toMealItem(food: Food, slot: Slot, scale = 1) {
  return {
    id: `${slot}-${food.id}`,
    food: buildFoodObj(food, scale),
    meal_slot: slot,
    quantity_g: roundQty(food.qty * scale),
    reason_tags: food.tags,
    ai_reason: null,
    calories: Math.round(food.cal * scale),
    protein_g: Math.round(food.p * scale * 10) / 10,
    carbs_g: Math.round(food.c * scale * 10) / 10,
    fat_g: Math.round(food.f * scale * 10) / 10,
    serving_scale: Math.round(scale * 100) / 100,
  };
}

// Dietician composition rule: how many dishes of one food group belong in a
// single meal. Two dals or two fish dishes on one plate is poor meal design —
// variety across groups beats doubling within one.
const SLOT_GROUP_CAPS: Record<string, number> = {
  protein: 1, legumes: 1, grains: 1, dairy: 1, vegetable: 2,
  fruit: 1, nuts: 1, seeds: 1, beverage: 1,
};
// groups allowed one extra dish per meal when the calorie target is very high
const HIGH_CAL_BONUS_GROUPS = new Set(["grains", "dairy", "nuts", "protein"]);

export function generateMealPlan(input: OnboardingInput, dayOffset = 0, weeklyUsage?: Map<string, number>) {
  const macros = computeMacros(input);
  const cuisine = input.cuisine || "indian";
  const conditions = input.conditions || [];
  const goal = input.goal_type || "weight_loss";

  // CKD (or any explicit protein cap) must not be exceeded by the actual food
  // selection, not just the displayed target. Track protein across the whole day.
  const proteinCap = conditions.includes("CKD");
  const proteinCeiling = macros.protein_g * (proteinCap ? 1.1 : 1.6);
  let dayProtein = 0;
  const usedIds = new Set<string>(); // global dedupe → more variety across slots

  // ── Phase 1: SELECT which foods go in each slot (base 1× serving) ──────────
  const selected = SLOTS.map((slotDef, idx) => {
    const rand = seededRandom(daySeed(idx, dayOffset) + hashStr(input.protein_pref + cuisine + goal + conditions.join("")));

    // Every food that is safe & appropriate for this slot given the user's diet,
    // cuisine, egg rule and medical conditions — the full menu they can pick from.
    const slotSafe = (food: Food) =>
      food.slots.includes(slotDef.slot) &&
      dietAllows(input.protein_pref, food) &&
      eggAllowed(input, food) &&
      !isExcluded(food, conditions);

    let eligible = FOODS.filter((food) => slotSafe(food) && (food.cuisines.includes(cuisine) || food.cuisines.length === 3));
    // fallback: if the cuisine filter leaves too few, open up to all cuisines
    if (eligible.length < 6) eligible = FOODS.filter(slotSafe);

    // rank the full eligible menu by preference score + daily jitter for rotation;
    // foods already served several times this week rank lower (weekly variety)
    const rankedAll = eligible
      .map((food) => ({
        food,
        score:
          preferenceScore(food, conditions, goal, input.medications) +
          rand() * 4 -
          (weeklyUsage?.get(food.id) ?? 0) * 1.5,
      }))
      .sort((a, b) => b.score - a.score);

    // for the auto-picked plan, prefer foods not already used in another slot
    const ranked = rankedAll.filter((r) => !usedIds.has(r.food.id));

    const targetCal = macros.calories * slotDef.share;
    // big calorie targets get one extra item per slot — portion scaling alone
    // can't stretch a normal plate to 3000+ kcal
    const highCal = macros.calories > 2800;
    const maxItems = slotDef.maxItems + (highCal ? 1 : 0);
    const picked: Food[] = [];
    let cal = 0;
    const maxAnchors = proteinCap ? 1 : 2;
    let anchors = 0;
    const groupCount: Record<string, number> = {};

    const tryAdd = (food: Food): boolean => {
      if (picked.includes(food)) return false;
      if (food.anchor && anchors >= maxAnchors) return false;
      // meal composition: don't stack the same food group on one plate
      const cap = (SLOT_GROUP_CAPS[food.group] ?? 1) + (highCal && HIGH_CAL_BONUS_GROUPS.has(food.group) ? 1 : 0);
      if ((groupCount[food.group] ?? 0) >= cap) return false;
      // never blow the daily protein ceiling (critical for CKD)
      if (food.p >= 8 && dayProtein + food.p > proteinCeiling) return false;
      picked.push(food);
      usedIds.add(food.id);
      cal += food.cal;
      dayProtein += food.p;
      groupCount[food.group] = (groupCount[food.group] ?? 0) + 1;
      if (food.anchor) anchors += 1;
      return true;
    };

    // ensure a protein anchor first for main meals
    if (slotDef.needsAnchor) {
      const anchor = ranked.find((r) => r.food.anchor);
      if (anchor) tryAdd(anchor.food);
    }
    // dietician plate rules: lunch & dinner get a vegetable dish; the
    // mid-morning snack leads with whole fruit
    if (slotDef.slot === "lunch" || slotDef.slot === "dinner") {
      const veg = ranked.find((r) => r.food.group === "vegetable");
      if (veg) tryAdd(veg.food);
    }
    if (slotDef.slot === "mid_morning") {
      const fruit = ranked.find((r) => r.food.group === "fruit");
      if (fruit) tryAdd(fruit.food);
    }
    for (const r of ranked) {
      if (picked.length >= maxItems) break;
      if (cal >= targetCal * 0.92 && picked.length >= (slotDef.needsAnchor ? 2 : 1)) break;
      tryAdd(r.food);
    }

    const pickedIds = new Set(picked.map((f) => f.id));
    const altFoods = rankedAll
      .filter((r) => !pickedIds.has(r.food.id))
      .slice(0, Math.max(5, 8 - picked.length))
      .map((r) => r.food);

    return { slotDef, picked, altFoods };
  });

  // ── Phase 2: SIZE the portions so day totals converge on the user's targets ─
  // The two macros are steered by *separate* levers so they don't fight:
  //   • protein-dense foods are scaled to hit the protein target
  //   • energy foods (grains, fruit, veg, fats) are scaled to hit the remaining
  //     calories, with the lowest-priority ones dropped if the target is very low.
  // A hard protein ceiling (CKD) is enforced last so scaling can never exceed it.
  type Entry = { food: Food; slotIdx: number; scale: number; role: "protein" | "energy"; dropRank: number };
  const entries: Entry[] = [];
  selected.forEach(({ slotDef, picked }, slotIdx) => {
    picked.forEach((food, i) => {
      const dense = food.p >= 8 && food.p / Math.max(food.cal, 1) >= 0.09;
      entries.push({
        food, slotIdx, scale: 1,
        role: dense || food.anchor ? "protein" : "energy",
        // drop energy items from the smallest slots / last-added first
        dropRank: slotDef.share * 100 - i,
      });
    });
  });

  const proteinItems = entries.filter((e) => e.role === "protein" && e.food.group !== "beverage");
  const energyItems = entries.filter((e) => e.role === "energy" && e.food.group !== "beverage");
  const sumBy = (list: Entry[], fn: (e: Entry) => number) => list.reduce((a, e) => a + fn(e), 0);
  const dayCal = () => sumBy(entries, (e) => e.food.cal * e.scale);
  const dayProt = () => sumBy(entries, (e) => e.food.p * e.scale);

  // Distribute a scale across a list to move a running total toward `target`.
  const steer = (list: Entry[], current: number, target: number, valueOf: (e: Entry) => number) => {
    const base = sumBy(list, (e) => valueOf(e) * e.scale) || 1;
    const rest = current - base; // contribution from items we're NOT scaling here
    const want = Math.max(0, target - rest);
    const factor = want / base;
    for (const e of list) {
      const [lo, hi] = scaleBounds(e.food);
      e.scale = Math.min(hi, Math.max(lo, e.scale * factor));
    }
  };

  // Protein lever — respect the CKD ceiling as a hard target maximum.
  const proteinTarget = proteinCap ? Math.min(macros.protein_g, proteinCeiling) : macros.protein_g;
  steer(proteinItems, dayProt(), proteinTarget, (e) => e.food.p);

  // Calorie lever — fill the remaining calories with the energy foods.
  steer(energyItems, dayCal(), macros.calories, (e) => e.food.cal);

  // If still well over target (very low-calorie plans), drop the lowest-priority
  // energy items until we're within reach, then re-steer.
  let guard = 0;
  while (dayCal() > macros.calories * 1.12 && guard++ < 8) {
    const droppable = energyItems
      .filter((e) => {
        const slotPicked = selected[e.slotIdx].picked;
        const minItems = selected[e.slotIdx].slotDef.needsAnchor ? 2 : 1;
        // never drop a main meal's only vegetable — cut denser items instead
        const isLastVeg =
          e.food.group === "vegetable" &&
          ["lunch", "dinner"].includes(selected[e.slotIdx].slotDef.slot) &&
          slotPicked.filter((f) => f.group === "vegetable").length <= 1;
        return !isLastVeg && slotPicked.length > minItems && slotPicked.includes(e.food);
      })
      .sort((a, b) => a.dropRank - b.dropRank);
    if (!droppable.length) break;
    const victim = droppable[0];
    const sp = selected[victim.slotIdx].picked;
    sp.splice(sp.indexOf(victim.food), 1);
    energyItems.splice(energyItems.indexOf(victim), 1);
    entries.splice(entries.indexOf(victim), 1);
    steer(energyItems, dayCal(), macros.calories, (e) => e.food.cal);
  }

  // Protein overshoot trim: when calories are on target but protein runs well
  // over (common for muscle-gain with many anchor foods), shrink the biggest
  // protein contributors toward the target, then let energy foods refill any
  // calories that were lost. Skipped under a CKD cap (handled separately below).
  if (!proteinCap && dayProt() > proteinTarget * 1.08) {
    const shrink = proteinItems.slice().sort((a, b) => b.food.p * b.scale - a.food.p * a.scale);
    for (const e of shrink) {
      if (dayProt() <= proteinTarget * 1.05) break;
      const [lo] = scaleBounds(e.food);
      const over = dayProt() - proteinTarget * 1.02;
      const cut = Math.min(e.scale - lo, over / Math.max(e.food.p, 1));
      if (cut <= 0.01) continue;
      e.scale -= cut;
    }
    steer(energyItems, dayCal(), macros.calories, (e) => e.food.cal);
  }

  // Final trim: when a plan is still over on calories (common for protein-dense
  // plant plans on a low target) and protein is already met, shrink the protein
  // portions toward their minimum — but never below the protein target itself.
  if (dayCal() > macros.calories * 1.05) {
    const shrink = proteinItems.slice().sort((a, b) => b.food.cal * b.scale - a.food.cal * a.scale);
    for (const e of shrink) {
      const [lo] = scaleBounds(e.food);
      while (e.scale > lo && dayCal() > macros.calories * 1.05 && dayProt() > proteinTarget * 0.97) {
        e.scale = Math.max(lo, e.scale - 0.1);
      }
    }
  }

  // Hard safety (CKD): keep total protein at or under the renal cap. Plant foods
  // carry protein even in "energy" roles, so we trim EVERY protein-bearing item
  // toward its minimum — highest contributor first — and drop protein foods from
  // over-stacked slots if minimum portions still exceed the cap.
  if (proteinCap && dayProt() > proteinTarget) {
    // 1) shrink every protein-bearing item toward its lower bound
    let over = dayProt() - proteinTarget;
    const shrinkable = entries
      .filter((e) => e.food.p > 0 && e.food.group !== "beverage")
      .sort((a, b) => b.food.p * b.scale - a.food.p * a.scale);
    for (const e of shrinkable) {
      if (over <= 0) break;
      const [lo] = scaleBounds(e.food);
      const cut = Math.min(e.scale - lo, over / Math.max(e.food.p, 1));
      if (cut <= 0.01) continue;
      e.scale -= cut;
      over -= cut * e.food.p;
    }
    // 2) if minimum portions still exceed the cap, drop the most protein-dense
    //    items from slots that have more than one item
    let dropGuard = 0;
    while (dayProt() > proteinTarget && dropGuard++ < 12) {
      const cand = entries
        .filter((e) => {
          const s = selected[e.slotIdx];
          return e.food.p >= 6 && s.picked.includes(e.food) && s.picked.length > 1;
        })
        .sort((a, b) => b.food.p * b.scale - a.food.p * a.scale);
      if (!cand.length) break;
      const v = cand[0];
      const sp = selected[v.slotIdx].picked;
      sp.splice(sp.indexOf(v.food), 1);
      entries.splice(entries.indexOf(v), 1);
    }
  }
  const scaleOf = (food: Food) => entries.find((e) => e.food === food)?.scale ?? 1;

  // ── Phase 3: MATERIALISE meals with their tuned portions ───────────────────
  const meals = selected.map(({ slotDef, picked, altFoods }) => {
    const items = picked.map((food) => toMealItem(food, slotDef.slot, scaleOf(food)));
    // Alternatives are portioned to the slot's context too: sized toward the
    // average calories of the picked items so a swap keeps the slot balanced.
    const meanItemCal = items.length ? items.reduce((s, i) => s + i.calories, 0) / items.length : 0;
    const alternatives = altFoods.map((food) => {
      let altScale = 1;
      if (meanItemCal > 0 && food.cal > 0) {
        const [lo, hi] = scaleBounds(food);
        altScale = Math.min(hi, Math.max(lo, meanItemCal / food.cal));
      }
      return toMealItem(food, slotDef.slot, altScale);
    });
    return {
      slot: slotDef.slot,
      slot_calories: items.reduce((s, i) => s + i.calories, 0),
      slot_protein_g: Math.round(items.reduce((s, i) => s + i.protein_g, 0)),
      items,
      alternatives,
    };
  });

  const total_calories = meals.reduce((s, m) => s + m.slot_calories, 0);
  const total_protein_g = Math.round(meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.protein_g, 0), 0));
  const total_carbs_g = Math.round(meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.carbs_g, 0), 0));
  const total_fat_g = Math.round(meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.fat_g, 0), 0));
  const total_fiber_g = Math.round(meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.food.fiber_g, 0), 0));

  // How closely the generated plan lands on each personalised target (0–100).
  const accuracy = (actual: number, target: number) =>
    target <= 0 ? 100 : Math.max(0, Math.round(100 - (Math.abs(actual - target) / target) * 100));
  const fit = {
    calories: accuracy(total_calories, macros.calories),
    protein: accuracy(total_protein_g, macros.protein_g),
    carbs: accuracy(total_carbs_g, macros.carbs_g),
    fat: accuracy(total_fat_g, macros.fat_g),
    overall: Math.round(
      (accuracy(total_calories, macros.calories) + accuracy(total_protein_g, macros.protein_g)) / 2
    ),
  };

  return {
    id: `demo-plan-${goal}-${cuisine}-${input.protein_pref}-d${dayOffset}`,
    plan_date: new Date(Date.now() + dayOffset * 86400000).toISOString().slice(0, 10),
    total_calories,
    total_protein_g,
    total_carbs_g,
    total_fat_g,
    total_fiber_g,
    ai_summary: buildSummary(input, macros),
    meals,
    macro_targets: macros,
    fit,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly plan + grocery list
// ─────────────────────────────────────────────────────────────────────────────
const GROUP_LABEL: Record<string, string> = {
  protein: "Proteins", dairy: "Dairy", legumes: "Legumes & Pulses", grains: "Grains & Breads",
  vegetable: "Vegetables", fruit: "Fruits", nuts: "Nuts", seeds: "Seeds", beverage: "Beverages",
};

export function generateWeeklyPlan(input: OnboardingInput) {
  // Track how often each food is served as the week builds so later days
  // rank heavily-used dishes lower — no dish should appear every single day.
  const weeklyUsage = new Map<string, number>();
  const days = Array.from({ length: 7 }, (_, offset) => {
    const plan = generateMealPlan(input, offset, weeklyUsage);
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        const rawId = item.food.id.replace(/^food-/, "");
        weeklyUsage.set(rawId, (weeklyUsage.get(rawId) ?? 0) + 1);
      }
    }
    const date = new Date(Date.now() + offset * 86400000);
    return {
      day_offset: offset,
      date: plan.plan_date,
      weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
      weekday_short: date.toLocaleDateString("en-US", { weekday: "short" }),
      plan,
    };
  });

  // Aggregate the week's picked items (not alternatives) into a grocery list
  const agg = new Map<string, { food_id: string; name: string; local: string | null; group: string; total_qty_g: number; times: number }>();
  for (const day of days) {
    for (const meal of day.plan.meals) {
      for (const item of meal.items) {
        const key = item.food.id;
        const cur = agg.get(key);
        if (cur) {
          cur.total_qty_g += item.quantity_g;
          cur.times += 1;
        } else {
          agg.set(key, {
            food_id: key.replace(/^food-/, ""),
            name: item.food.name,
            local: item.food.name_local,
            group: item.food.food_group,
            total_qty_g: item.quantity_g,
            times: 1,
          });
        }
      }
    }
  }

  const groupsMap = new Map<string, { label: string; items: { food_id: string; name: string; local: string | null; total_qty_g: number; times: number }[] }>();
  for (const entry of agg.values()) {
    const label = GROUP_LABEL[entry.group] || "Other";
    if (!groupsMap.has(label)) groupsMap.set(label, { label, items: [] });
    groupsMap.get(label)!.items.push({
      food_id: entry.food_id,
      name: entry.name,
      local: entry.local,
      total_qty_g: Math.round(entry.total_qty_g / 10) * 10,
      times: entry.times,
    });
  }
  const grocery = [...groupsMap.values()]
    .map((g) => ({ ...g, items: g.items.sort((a, b) => b.times - a.times) }))
    .sort((a, b) => b.items.length - a.items.length);

  const avgFit = Math.round(days.reduce((s, d) => s + d.plan.fit.overall, 0) / days.length);

  return {
    week_start: days[0].date,
    week_end: days[6].date,
    avg_fit: avgFit,
    days,
    grocery,
  };
}

function buildSummary(input: OnboardingInput, macros: ReturnType<typeof computeMacros>): string {
  const goal = (input.goal_type || "weight_loss").replace(/_/g, " ");
  const condNames = input.conditions.map((c) => CONDITION_LABEL[c] || c).filter(Boolean);
  const condStr = condNames.length ? condNames.join(" and ") : "your general wellness profile";
  const parts: string[] = [];
  parts.push(
    `Today's ${macros.calories} kcal plan is generated for your goal of ${goal} and built around ${condStr}.`
  );
  if (input.conditions.includes("T2D") || input.conditions.includes("PREDIABETES"))
    parts.push("Every carbohydrate source is low-to-medium glycemic index to keep blood sugar stable.");
  if (input.conditions.includes("HTN") || input.conditions.includes("HEART_DISEASE"))
    parts.push("Sodium is kept low following the DASH protocol, with potassium-rich whole foods.");
  if (input.conditions.includes("KIDNEY_STONES"))
    parts.push("High-oxalate foods (spinach, beans, nuts) are swapped for low-oxalate alternatives.");
  if (input.conditions.includes("CKD"))
    parts.push(`Protein is capped at ${macros.protein_g_per_kg} g/kg to protect kidney function.`);
  if (input.conditions.includes("HYPERLIPIDEMIA"))
    parts.push("Saturated fat is minimised and soluble fiber elevated to help lower LDL cholesterol.");
  if (input.goal_type === "muscle_gain")
    parts.push(`Protein is set high at ${macros.protein_g} g (${macros.protein_g_per_kg} g/kg) and spread across all meals to maximise muscle protein synthesis.`);
  else if (input.goal_type === "healthy_aging")
    parts.push("Anti-inflammatory foods, omega-3s and adequate protein are prioritised to combat sarcopenia and support cognition.");
  else
    parts.push(`Protein is held at ${macros.protein_g} g to preserve muscle while in a calorie deficit.`);
  // Progress feedback loop: tell the user when their logged weight trend moved the target
  const adj = input.calorie_adjustment ?? 0;
  const gaining = input.goal_type === "muscle_gain";
  if (adj <= -50)
    parts.push(
      gaining
        ? `Your logged weight is climbing faster than lean gain allows, so today's calorie target was trimmed by ${Math.abs(adj)} kcal to keep gains lean.`
        : `Your logged weight trend shows progress has been slower than planned, so today's calorie target was lowered by ${Math.abs(adj)} kcal.`
    );
  else if (adj >= 50)
    parts.push(
      gaining
        ? `Your logged weight trend shows slower gains than planned, so today's calorie target was raised by ${adj} kcal.`
        : `Your logged weight is dropping faster than is sustainable, so today's calorie target was raised by ${adj} kcal to protect muscle and energy.`
    );
  // Medication-aware guidance woven into the plan explanation (max 2 lines)
  const meds = input.medications || [];
  const medLines: string[] = [];
  if (meds.some((m) => m.startsWith("insulin")))
    medLines.push("Carbohydrates are spread evenly across your meals so they work smoothly with your insulin doses.");
  if (meds.includes("metformin"))
    medLines.push("Pair metformin with the breakfast and dinner in this plan — taking it with food reduces stomach upset.");
  if (meds.includes("thyroid_meds"))
    medLines.push("Take your thyroid medication 30–60 minutes before the breakfast shown here, with water only.");
  if (meds.includes("blood_thinners"))
    medLines.push("Keep leafy-green portions steady from day to day — consistent vitamin K intake matters with blood thinners.");
  if (meds.includes("diuretics"))
    medLines.push("Your plan includes potassium-rich foods to replenish what diuretics flush out — check with your doctor about your target.");
  parts.push(...medLines.slice(0, 2));
  parts.push("Foods rotate daily so your week stays varied.");
  return parts.join(" ");
}

const CONDITION_LABEL: Record<string, string> = {
  T2D: "Type 2 Diabetes", PREDIABETES: "Prediabetes", HTN: "Hypertension",
  HYPERLIPIDEMIA: "High Cholesterol", KIDNEY_STONES: "Kidney Stones", CKD: "Chronic Kidney Disease",
  HEART_DISEASE: "Heart Disease", THYROID: "Hypothyroidism",
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

// ─────────────────────────────────────────────────────────────────────────────
// Workout generation
// ─────────────────────────────────────────────────────────────────────────────
interface ExerciseTemplate {
  id: string;
  name: string;
  goals: string[];
  levels: string[];
  contra: string[]; // condition codes this template avoids
  duration_min: number;
  equipment: string[];
  description: string;
  instructions: {
    warmup: { exercise: string; duration_sec?: number; reps?: number }[];
    main_circuit: { exercise: string; sets?: number; reps?: number; rest_sec?: number; duration_sec?: number }[];
    cooldown: { exercise: string; duration_sec?: number }[];
  };
}

const WORKOUTS: ExerciseTemplate[] = [
  {
    id: "wo-walk-resist", name: "Post-Meal Walk + Resistance Circuit",
    goals: ["weight_loss", "fat_loss", "maintenance", "cardiovascular"], levels: ["beginner", "intermediate"], contra: [],
    duration_min: 35, equipment: ["bodyweight", "resistance_band"],
    description: "Post-meal walking with light resistance to improve insulin sensitivity and support blood pressure.",
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
  {
    id: "wo-ppl", name: "Push-Pull-Legs Strength (Dumbbells)",
    goals: ["muscle_gain"], levels: ["intermediate", "advanced"], contra: [],
    duration_min: 50, equipment: ["dumbbells", "bench"],
    description: "Hypertrophy-focused dumbbell training split across push, pull and legs for progressive overload.",
    instructions: {
      warmup: [{ exercise: "Dynamic stretches + arm circles", duration_sec: 300 }],
      main_circuit: [
        { exercise: "Dumbbell bench press", sets: 4, reps: 10, rest_sec: 90 },
        { exercise: "Dumbbell row", sets: 4, reps: 10, rest_sec: 90 },
        { exercise: "Goblet squat", sets: 4, reps: 12, rest_sec: 90 },
        { exercise: "Romanian deadlift", sets: 3, reps: 12, rest_sec: 90 },
        { exercise: "Overhead press", sets: 3, reps: 10, rest_sec: 75 },
      ],
      cooldown: [{ exercise: "Static stretching", duration_sec: 240 }],
    },
  },
  {
    id: "wo-chair-yoga", name: "Chair Yoga + Balance & Bands",
    goals: ["healthy_aging", "maintenance"], levels: ["older_adult", "beginner"], contra: [],
    duration_min: 30, equipment: ["chair", "resistance_band"],
    description: "Gentle joint-friendly mobility, balance and band resistance to preserve strength and prevent falls.",
    instructions: {
      warmup: [{ exercise: "Seated neck & shoulder rolls", duration_sec: 180 }],
      main_circuit: [
        { exercise: "Chair-supported sit-to-stand", sets: 3, reps: 10, rest_sec: 60 },
        { exercise: "Seated band row", sets: 3, reps: 12, rest_sec: 60 },
        { exercise: "Standing heel-to-toe balance", sets: 2, reps: 10, rest_sec: 45 },
        { exercise: "Seated leg extension", sets: 3, reps: 12, rest_sec: 45 },
      ],
      cooldown: [{ exercise: "Gentle seated stretching + breathing", duration_sec: 180 }],
    },
  },
  {
    id: "wo-cardio-moderate", name: "Moderate Steady-State Cardio",
    goals: ["weight_loss", "fat_loss", "cardiovascular", "maintenance"], levels: ["beginner", "intermediate", "older_adult"], contra: [],
    duration_min: 30, equipment: ["bodyweight"],
    description: "Continuous moderate-intensity cardio that avoids Valsalva strain — safe for blood pressure management.",
    instructions: {
      warmup: [{ exercise: "Easy march in place", duration_sec: 180 }],
      main_circuit: [
        { exercise: "Brisk walk or cycle (RPE 5-6)", duration_sec: 1200 },
        { exercise: "Gentle incline walk", duration_sec: 300 },
      ],
      cooldown: [{ exercise: "Walking cooldown + calf stretch", duration_sec: 240 }],
    },
  },
  {
    id: "wo-full-body", name: "Full-Body Bodyweight Strength",
    goals: ["weight_loss", "muscle_gain", "maintenance"], levels: ["beginner", "intermediate"], contra: [],
    duration_min: 40, equipment: ["bodyweight"],
    description: "Compound bodyweight movements building total-body strength with no equipment.",
    instructions: {
      warmup: [{ exercise: "Jumping jacks + leg swings", duration_sec: 240 }],
      main_circuit: [
        { exercise: "Push-ups (knee or full)", sets: 3, reps: 12, rest_sec: 60 },
        { exercise: "Reverse lunges", sets: 3, reps: 12, rest_sec: 60 },
        { exercise: "Glute bridge", sets: 3, reps: 15, rest_sec: 45 },
        { exercise: "Plank hold", sets: 3, duration_sec: 40, rest_sec: 45 },
      ],
      cooldown: [{ exercise: "Full-body stretch", duration_sec: 240 }],
    },
  },
  {
    id: "wo-yoga-flow", name: "Vinyasa Yoga Flow",
    goals: ["healthy_aging", "maintenance", "weight_loss", "cardiovascular"], levels: ["beginner", "intermediate", "older_adult"], contra: [],
    duration_min: 35, equipment: ["yoga_mat"],
    description: "Flowing yoga that builds flexibility, core strength and lowers stress-driven cortisol and blood pressure.",
    instructions: {
      warmup: [{ exercise: "Cat-cow + child's pose", duration_sec: 240 }],
      main_circuit: [
        { exercise: "Sun salutation A", sets: 4, duration_sec: 120, rest_sec: 30 },
        { exercise: "Warrior II flow", sets: 2, duration_sec: 120, rest_sec: 30 },
        { exercise: "Tree pose balance", sets: 2, duration_sec: 60, rest_sec: 30 },
      ],
      cooldown: [{ exercise: "Savasana + deep breathing", duration_sec: 300 }],
    },
  },
  {
    id: "wo-morning-yoga", name: "Morning Yoga Flow (All Levels)",
    goals: ["healthy_aging", "maintenance", "weight_loss", "cardiovascular", "blood_pressure_management"], levels: ["beginner", "intermediate", "older_adult"], contra: [],
    duration_min: 25, equipment: ["yoga_mat"],
    description: "A gentle yet energising morning flow to wake the body, improve circulation and set a calm tone for the day.",
    instructions: {
      warmup: [{ exercise: "Supine spinal twist (each side)", duration_sec: 120 }],
      main_circuit: [
        { exercise: "Sun Salutation A (slow)", sets: 3, duration_sec: 90, rest_sec: 30 },
        { exercise: "Warrior I + Warrior II flow", sets: 2, duration_sec: 90, rest_sec: 30 },
        { exercise: "Bridge pose (hip opener)", sets: 3, reps: 10, rest_sec: 30 },
        { exercise: "Seated forward fold (hamstrings)", duration_sec: 60 },
      ],
      cooldown: [{ exercise: "Savasana + box breathing", duration_sec: 240 }],
    },
  },
  {
    id: "wo-yoga-diabetes", name: "Yoga for Blood Sugar Balance",
    goals: ["diabetes_friendly", "weight_loss", "maintenance"], levels: ["beginner", "intermediate"], contra: [],
    duration_min: 30, equipment: ["yoga_mat"],
    description: "Evidence-based yoga sequence targeting insulin sensitivity — twisting poses stimulate the pancreas; forward folds activate the parasympathetic system to lower cortisol and blood glucose.",
    instructions: {
      warmup: [{ exercise: "Breath awareness + diaphragmatic breathing", duration_sec: 180 }],
      main_circuit: [
        { exercise: "Ardha Matsyendrasana (Half Spinal Twist)", sets: 2, duration_sec: 60, rest_sec: 20 },
        { exercise: "Paschimottanasana (Seated Forward Bend)", sets: 2, duration_sec: 60, rest_sec: 20 },
        { exercise: "Dhanurasana (Bow Pose)", sets: 3, reps: 5, rest_sec: 30 },
        { exercise: "Setu Bandhasana (Bridge Pose)", sets: 3, reps: 12, rest_sec: 30 },
        { exercise: "Post-meal 10-min slow walk (if possible)", duration_sec: 600 },
      ],
      cooldown: [{ exercise: "Legs-up-the-wall pose (Viparita Karani) + yogic breathing", duration_sec: 300 }],
    },
  },
  {
    id: "wo-pranayama", name: "Pranayama & Breathwork (Stress / BP)",
    goals: ["blood_pressure_management", "cardiovascular", "healthy_aging", "maintenance"], levels: ["beginner", "intermediate", "older_adult"], contra: [],
    duration_min: 20, equipment: ["yoga_mat"],
    description: "Structured breathwork clinically shown to reduce systolic BP by 4–8 mmHg and cortisol by up to 31%. Ideal on high-stress days or as a daily BP management ritual.",
    instructions: {
      warmup: [{ exercise: "Comfortable seated posture + shoulder rolls", duration_sec: 120 }],
      main_circuit: [
        { exercise: "Nadi Shodhana (Alternate Nostril Breathing) — 5 min", duration_sec: 300 },
        { exercise: "Bhramari (Humming Bee Breath) — 10 rounds", duration_sec: 180 },
        { exercise: "4-7-8 Breathing — 8 cycles", duration_sec: 240 },
        { exercise: "Kapalabhati (Skull-Shining Breath) — gentle, 2 min", duration_sec: 120 },
      ],
      cooldown: [{ exercise: "5-min body scan meditation lying down", duration_sec: 300 }],
    },
  },
  {
    id: "wo-restorative-yoga", name: "Restorative Yoga (Hypertension / Recovery)",
    goals: ["blood_pressure_management", "healthy_aging", "maintenance", "cardiovascular"], levels: ["beginner", "older_adult"], contra: [],
    duration_min: 30, equipment: ["yoga_mat", "bolster_or_pillow"],
    description: "Passive, supported poses held for 3–5 minutes activate the parasympathetic nervous system — clinically effective for lowering resting heart rate and blood pressure.",
    instructions: {
      warmup: [{ exercise: "Gentle neck rolls + seated breathing", duration_sec: 180 }],
      main_circuit: [
        { exercise: "Supported Child's Pose (Balasana) — 3 min", duration_sec: 180 },
        { exercise: "Reclined Butterfly (Supta Baddha Konasana) — 4 min", duration_sec: 240 },
        { exercise: "Legs Up the Wall (Viparita Karani) — 5 min", duration_sec: 300 },
        { exercise: "Supported Fish Pose (chest opener) — 3 min", duration_sec: 180 },
      ],
      cooldown: [{ exercise: "Savasana with progressive muscle relaxation — 5 min", duration_sec: 300 }],
    },
  },
  {
    id: "wo-stress-buster", name: "Stress-Buster Interval Circuit",
    goals: ["weight_loss", "fat_loss", "maintenance", "muscle_gain"], levels: ["intermediate", "advanced"], contra: [],
    duration_min: 25, equipment: ["bodyweight"],
    description: "Short, high-energy bursts followed by active recovery — burns cortisol, boosts endorphins, and improves insulin sensitivity in under 30 minutes.",
    instructions: {
      warmup: [{ exercise: "Dynamic stretches + high knees", duration_sec: 180 }],
      main_circuit: [
        { exercise: "Jump squats (20 s on / 10 s off)", sets: 4, duration_sec: 20, rest_sec: 10 },
        { exercise: "Push-up + shoulder tap", sets: 4, duration_sec: 20, rest_sec: 10 },
        { exercise: "Mountain climbers", sets: 4, duration_sec: 20, rest_sec: 10 },
        { exercise: "Burpee (modified if needed)", sets: 3, reps: 8, rest_sec: 45 },
      ],
      cooldown: [{ exercise: "Child's pose + slow diaphragmatic breathing — 3 min", duration_sec: 180 }],
    },
  },
  {
    id: "wo-tai-chi", name: "Tai Chi / Balance Flow (Older Adults)",
    goals: ["healthy_aging", "maintenance", "blood_pressure_management"], levels: ["older_adult", "beginner"], contra: [],
    duration_min: 25, equipment: ["bodyweight"],
    description: "Slow, flowing movements proven to reduce fall risk, lower BP, and improve balance and proprioception — especially important after 60.",
    instructions: {
      warmup: [{ exercise: "Gentle joint rotations (ankles → knees → hips → shoulders)", duration_sec: 240 }],
      main_circuit: [
        { exercise: "Tai Chi Wave Hands Like Clouds (8 reps each side)", sets: 3, reps: 8, rest_sec: 30 },
        { exercise: "Single Leg Stand (10 s each leg)", sets: 3, reps: 10, rest_sec: 20 },
        { exercise: "Tai Chi Brush Knee Push (slow, controlled)", sets: 3, reps: 10, rest_sec: 30 },
        { exercise: "Heel-to-toe walking (balance beam walk) — 10 steps", sets: 4, reps: 10, rest_sec: 30 },
      ],
      cooldown: [{ exercise: "Standing meditation + deep breathing", duration_sec: 180 }],
    },
  },
  // ── Weight Training Templates ─────────────────────────────────────────────
  {
    id: "wo-strength-beginner", name: "Beginner Full-Body Strength (Dumbbells)",
    goals: ["weight_loss", "fat_loss", "muscle_gain", "maintenance", "cardiovascular"], levels: ["beginner"], contra: [],
    duration_min: 40, equipment: ["dumbbells", "bodyweight"],
    description: "3-day/week full-body strength routine using dumbbells. Builds lean muscle, raises metabolism and improves insulin sensitivity — safe for most chronic conditions.",
    instructions: {
      warmup: [{ exercise: "March in place + arm circles", duration_sec: 300 }],
      main_circuit: [
        { exercise: "Goblet squat", sets: 3, reps: 12, rest_sec: 60 },
        { exercise: "Dumbbell chest press (floor)", sets: 3, reps: 10, rest_sec: 60 },
        { exercise: "Bent-over dumbbell row", sets: 3, reps: 12, rest_sec: 60 },
        { exercise: "Romanian deadlift (light)", sets: 3, reps: 10, rest_sec: 75 },
        { exercise: "Shoulder press (seated)", sets: 3, reps: 10, rest_sec: 60 },
        { exercise: "Plank hold", sets: 3, reps: 1, rest_sec: 45 },
      ],
      cooldown: [{ exercise: "Full-body static stretching", duration_sec: 240 }],
    },
  },
  {
    id: "wo-strength-intermediate", name: "Intermediate Strength — Upper / Lower Split",
    goals: ["muscle_gain", "weight_loss", "fat_loss", "healthy_aging"], levels: ["intermediate", "advanced"], contra: [],
    duration_min: 55, equipment: ["dumbbells", "barbell", "bench"],
    description: "4-day upper/lower split for progressive overload. Increases muscle mass, reduces visceral fat and supports bone density — key for metabolic and cardiovascular health.",
    instructions: {
      warmup: [{ exercise: "Dynamic warm-up: leg swings, hip circles, band pull-aparts", duration_sec: 360 }],
      main_circuit: [
        { exercise: "Barbell / DB squat", sets: 4, reps: 8, rest_sec: 90 },
        { exercise: "Romanian deadlift", sets: 4, reps: 10, rest_sec: 90 },
        { exercise: "Walking lunges", sets: 3, reps: 12, rest_sec: 75 },
        { exercise: "Leg curl (or Nordic curl)", sets: 3, reps: 10, rest_sec: 75 },
        { exercise: "Calf raises (weighted)", sets: 3, reps: 15, rest_sec: 45 },
        { exercise: "Core: Dead bug", sets: 3, reps: 10, rest_sec: 45 },
      ],
      cooldown: [{ exercise: "Foam rolling + hip flexor stretch", duration_sec: 300 }],
    },
  },
  {
    id: "wo-strength-senior", name: "Senior Strength & Bone Health",
    goals: ["healthy_aging", "maintenance", "cardiovascular"], levels: ["older_adult"], contra: [],
    duration_min: 35, equipment: ["dumbbells", "resistance_band", "chair"],
    description: "Light-to-moderate weight training for adults 55+. Prevents sarcopenia (muscle loss), improves balance, strengthens bones and reduces fall risk.",
    instructions: {
      warmup: [{ exercise: "Seated marching + shoulder rolls", duration_sec: 300 }],
      main_circuit: [
        { exercise: "Sit-to-stand (chair squat)", sets: 3, reps: 10, rest_sec: 60 },
        { exercise: "Dumbbell bicep curl (light)", sets: 3, reps: 12, rest_sec: 45 },
        { exercise: "Resistance band chest press (seated)", sets: 3, reps: 12, rest_sec: 45 },
        { exercise: "Mini band side steps", sets: 3, reps: 15, rest_sec: 45 },
        { exercise: "Single-leg balance hold (wall support)", sets: 3, reps: 1, rest_sec: 30 },
        { exercise: "Overhead press (light dumbbells, seated)", sets: 3, reps: 10, rest_sec: 45 },
      ],
      cooldown: [{ exercise: "Seated stretching — hip flexors, chest, hamstrings", duration_sec: 240 }],
    },
  },
  {
    id: "wo-strength-metabolic", name: "Metabolic Strength Circuit (Diabetes & Heart Friendly)",
    goals: ["weight_loss", "fat_loss", "cardiovascular", "diabetes_friendly"], levels: ["beginner", "intermediate"], contra: [],
    duration_min: 45, equipment: ["dumbbells", "bodyweight"],
    description: "Resistance + cardio in one efficient session. Compound movements lower blood sugar, improve HDL cholesterol and reduce resting heart rate — evidence-based for T2D, HTN and metabolic syndrome.",
    instructions: {
      warmup: [{ exercise: "5-min brisk walk + dynamic stretches", duration_sec: 300 }],
      main_circuit: [
        { exercise: "Dumbbell squat to press", sets: 3, reps: 12, rest_sec: 45 },
        { exercise: "Push-up (any variation)", sets: 3, reps: 10, rest_sec: 45 },
        { exercise: "Dumbbell row (alternating)", sets: 3, reps: 12, rest_sec: 45 },
        { exercise: "Reverse lunge", sets: 3, reps: 10, rest_sec: 45 },
        { exercise: "Dumbbell deadlift", sets: 3, reps: 12, rest_sec: 60 },
        { exercise: "Mountain climbers (slow pace)", sets: 3, reps: 20, rest_sec: 45 },
        { exercise: "10-min post-circuit walk", duration_sec: 600 },
      ],
      cooldown: [{ exercise: "Box breathing + full-body stretch", duration_sec: 240 }],
    },
  },
  {
    id: "wo-strength-home", name: "No-Equipment Home Strength",
    goals: ["weight_loss", "fat_loss", "muscle_gain", "maintenance"], levels: ["beginner", "intermediate"], contra: [],
    duration_min: 35, equipment: ["bodyweight"],
    description: "Zero equipment strength training using only bodyweight. Progressive loading through tempo, range of motion and volume. Perfect for home, travel or busy days.",
    instructions: {
      warmup: [{ exercise: "Jumping jacks (low-impact step-jacks) + arm swings", duration_sec: 240 }],
      main_circuit: [
        { exercise: "Bodyweight squat (slow 3-sec descent)", sets: 4, reps: 15, rest_sec: 45 },
        { exercise: "Push-up (incline / standard / decline)", sets: 4, reps: 10, rest_sec: 45 },
        { exercise: "Glute bridge", sets: 3, reps: 15, rest_sec: 45 },
        { exercise: "Reverse lunge (alternating)", sets: 3, reps: 12, rest_sec: 45 },
        { exercise: "Pike push-up (shoulders)", sets: 3, reps: 10, rest_sec: 45 },
        { exercise: "Superman hold (back)", sets: 3, reps: 12, rest_sec: 30 },
        { exercise: "Plank + shoulder tap", sets: 3, reps: 16, rest_sec: 45 },
      ],
      cooldown: [{ exercise: "Child's pose, pigeon pose, chest opener — 4 min", duration_sec: 240 }],
    },
  },
  {
    id: "wo-walking-meditation", name: "Mindful Walking + Meditation",
    goals: ["healthy_aging", "maintenance", "cardiovascular", "blood_pressure_management", "weight_loss"], levels: ["beginner", "older_adult", "intermediate"], contra: [],
    duration_min: 30, equipment: ["bodyweight"],
    description: "Combines moderate-intensity walking with mindfulness — reduces cortisol, improves mood, and counts as Zone 2 cardio for metabolic health.",
    instructions: {
      warmup: [{ exercise: "5 slow, deep breaths standing still — focus on body sensations", duration_sec: 120 }],
      main_circuit: [
        { exercise: "Slow mindful walk (count steps, notice 5 senses) — 10 min", duration_sec: 600 },
        { exercise: "Brisk walk (moderate pace, RPE 5-6) — 10 min", duration_sec: 600 },
        { exercise: "Slow mindful walk + gratitude reflection — 5 min", duration_sec: 300 },
      ],
      cooldown: [{ exercise: "Seated breathing: 4 counts in, 6 counts out — 3 min", duration_sec: 180 }],
    },
  },
];

const REST_TEMPLATE = {
  id: "active-recovery", name: "Active Recovery", duration_min: 20, equipment: ["bodyweight"],
  description: "Light mobility, a relaxed walk and stretching to aid recovery.",
  instructions: {
    warmup: [{ exercise: "Easy walk", duration_sec: 300 }],
    main_circuit: [{ exercise: "Gentle full-body mobility", duration_sec: 600 }],
    cooldown: [{ exercise: "Deep breathing", duration_sec: 180 }],
  },
};

function fitnessLevel(input: OnboardingInput): string {
  if (input.age >= 60) return "older_adult";
  if (input.activity_level === "sedentary" || input.activity_level === "light") return "beginner";
  if (input.activity_level === "very_active" || input.activity_level === "active") return "advanced";
  return "intermediate";
}

export function generateWorkoutPlan(input: OnboardingInput) {
  const level = fitnessLevel(input);
  const goal = input.goal_type || "weight_loss";
  const conditions = input.conditions || [];

  let eligible = WORKOUTS.filter(
    (w) =>
      (w.goals.includes(goal) || w.goals.includes("maintenance")) &&
      (w.levels.includes(level) || level === "advanced") &&
      !w.contra.some((c) => conditions.includes(c))
  );
  if (eligible.length === 0) eligible = WORKOUTS.filter((w) => w.levels.includes(level) || w.levels.includes("beginner"));

  // training days depend on goal: muscle gain trains more, healthy aging fewer
  const trainingDays =
    goal === "muscle_gain" ? [true, true, false, true, true, false, false]
      : goal === "healthy_aging" ? [true, false, true, false, true, false, false]
        : [true, false, true, true, false, true, false];

  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const rand = seededRandom(daySeed(7) + hashStr(goal + level + conditions.join("")));
  const rotated = [...eligible].sort(() => rand() - 0.5);

  let ti = 0;
  const days = dayNames.map((day, idx) => {
    if (!trainingDays[idx]) return { day, is_rest_day: true, templates: [] as unknown[] };
    const tmpl = rotated[ti % rotated.length];
    ti += 1;
    return {
      day,
      is_rest_day: false,
      templates: [{
        id: `${tmpl.id}-${idx}`,
        name: tmpl.name,
        fitness_level: level,
        goal_type: goal,
        duration_min: tmpl.duration_min,
        equipment: tmpl.equipment,
        description: tmpl.description,
        instructions: tmpl.instructions,
      }],
    };
  });

  return { week_start: new Date().toISOString().slice(0, 10), fitness_level: level, ai_summary: null, days };
}

export function generateTodayWorkout(input: OnboardingInput) {
  const plan = generateWorkoutPlan(input);
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const today = plan.days.find((d) => d.day === todayName) || plan.days[0];
  if (today.is_rest_day) {
    return {
      day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      is_rest_day: false,
      templates: [REST_TEMPLATE],
    };
  }
  return {
    day: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    is_rest_day: false,
    templates: today.templates,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifestyle generation  (condition-aware)
// ─────────────────────────────────────────────────────────────────────────────
const CONDITION_TIPS: Record<string, { condition: string; tip: string }> = {
  T2D: { condition: "Diabetes", tip: "A 15-minute walk after each meal improves post-meal blood sugar by up to 22%. Keep carbohydrates low-GI and high-fiber." },
  PREDIABETES: { condition: "Prediabetes", tip: "Losing 5–7% of body weight and 150 min/week of activity can cut your progression to diabetes by ~58%." },
  HTN: { condition: "Hypertension", tip: "Limit sodium to < 1500 mg/day, increase potassium-rich foods (banana, curd, dal) and practise daily relaxation (DASH protocol)." },
  HYPERLIPIDEMIA: { condition: "High Cholesterol", tip: "Aim for 10–25 g of soluble fiber daily (oats, beans, flax) and replace saturated fats with olive oil and nuts to lower LDL." },
  KIDNEY_STONES: { condition: "Kidney Stones", tip: "Drink 2.5–3 L of water daily, add citrus (lemon/orange) for citrate, and limit high-oxalate foods like spinach and almonds." },
  CKD: { condition: "Kidney Disease", tip: "Keep protein moderate (~0.75 g/kg), limit phosphorus and potassium, and monitor fluid intake with your nephrologist." },
  HEART_DISEASE: { condition: "Heart Disease", tip: "Prioritise omega-3 rich fish, keep sodium < 1500 mg, avoid trans fats and do moderate cardio while avoiding Valsalva straining." },
  THYROID: { condition: "Hypothyroidism", tip: "Take levothyroxine on an empty stomach, ensure adequate selenium and iodine, and lightly cook cruciferous vegetables to reduce goitrogens." },
};

const MEDICATION_NOTES: Record<string, { label: string; tips: string[] }> = {
  insulin_fast: {
    label: "Fast-Acting Insulin",
    tips: [
      "Eat within 15–20 minutes of injecting fast-acting insulin — never skip a meal after dosing.",
      "Distribute carbohydrates evenly across breakfast, lunch and dinner (aim for consistent carb counts per meal).",
      "Keep a fast-acting glucose source (juice, glucose tablets) on hand in case of hypoglycaemia.",
    ],
  },
  insulin_long: {
    label: "Long-Acting Insulin",
    tips: [
      "Take long-acting insulin at the same time each day for stable overnight glucose levels.",
      "Consistent total daily carbohydrate intake helps prevent unexpected glucose swings.",
      "Your meal plan distributes protein and carbs evenly to complement your basal insulin.",
    ],
  },
  metformin: {
    label: "Metformin",
    tips: [
      "Always take metformin with food or immediately after eating to minimise GI discomfort.",
      "Avoid alcohol — it increases the risk of lactic acidosis when combined with metformin.",
      "Stay well hydrated; adequate water intake supports kidney clearance of the drug.",
    ],
  },
  blood_thinners: {
    label: "Blood Thinners (Warfarin / Anticoagulants)",
    tips: [
      "Keep vitamin K intake consistent day-to-day — do not suddenly increase or decrease leafy greens (spinach, kale, broccoli).",
      "Avoid large amounts of cranberry, grapefruit or pomelo juice — these can amplify bleeding risk.",
      "Alcohol significantly increases anticoagulant effect — limit strictly or avoid completely.",
    ],
  },
  statins: {
    label: "Statins",
    tips: [
      "Avoid grapefruit and grapefruit juice — compounds in it inhibit statin metabolism and can cause muscle damage.",
      "A high-fiber diet (oats, flax, beans) works synergistically with statins to lower LDL further.",
      "Take your statin at the same time each day; many are best absorbed in the evening.",
    ],
  },
  thyroid_meds: {
    label: "Thyroid Medication (Levothyroxine)",
    tips: [
      "Take levothyroxine on a completely empty stomach, 30–60 minutes before breakfast, with plain water only.",
      "Avoid calcium-rich foods (dairy, fortified juice) and iron supplements within 4 hours of your dose — they block absorption.",
      "Coffee, even black, can reduce absorption — wait at least 30 minutes after taking your tablet.",
    ],
  },
  beta_blockers: {
    label: "Beta-Blockers",
    tips: [
      "Avoid sudden large increases in potassium-rich foods (bananas, avocado, dal) as beta-blockers can raise potassium levels.",
      "Beta-blockers can mask low blood sugar symptoms — monitor glucose carefully if you also have diabetes.",
      "Avoid liquorice — it can raise blood pressure and counteract the medication.",
    ],
  },
  ace_arb: {
    label: "ACE Inhibitors / ARBs",
    tips: [
      "Limit high-potassium foods if your doctor has advised it — ACE/ARBs raise potassium levels.",
      "Avoid NSAIDs (ibuprofen, naproxen) — they blunt the BP-lowering effect and stress the kidneys.",
      "Stay well hydrated, especially in hot weather, to prevent low BP episodes.",
    ],
  },
  calcium_channel: {
    label: "Calcium Channel Blockers",
    tips: [
      "Avoid grapefruit and grapefruit juice — it significantly increases drug levels in your bloodstream.",
      "Limit high-sodium foods — excess sodium counteracts the blood pressure benefit.",
      "Consistent meal timing helps maintain stable drug absorption.",
    ],
  },
  diuretics: {
    label: "Diuretics (Water Pills)",
    tips: [
      "Increase water intake to 2.5–3 L/day to compensate for increased urinary losses.",
      "Eat potassium-rich foods daily (banana, curd, dal, tomato) to replenish what's lost — unless your doctor advises otherwise.",
      "Take diuretics in the morning to avoid disrupting sleep with nighttime urination.",
    ],
  },
};

export function generateLifestyle(input: OnboardingInput) {
  const conditions = input.conditions || [];
  const medications = input.medications || [];
  const w = input.weight_kg || 75;
  const ls = input.lifestyle || {};
  const sleepHours = ls.sleep_hours ?? 6.5;
  const stress = ls.stress_level || "medium";

  // hydration: 35 ml/kg, +0.5 L if kidney stones
  let liters = Math.round((w * 0.035 + (conditions.includes("KIDNEY_STONES") ? 0.5 : 0)) * 10) / 10;
  liters = Math.max(2.0, liters);

  const condition_specific = conditions
    .map((c) => CONDITION_TIPS[c])
    .filter(Boolean);

  const hasGlycemic = conditions.includes("T2D") || conditions.includes("PREDIABETES");

  return {
    hydration: {
      target_liters: liters,
      glasses_8oz: Math.round((liters * 1000) / 240),
      reason: `Based on your weight (${w} kg) and ${input.activity_level || "moderate"} activity level${conditions.includes("KIDNEY_STONES") ? ", with an extra 0.5 L to help prevent kidney stones" : ""}.`,
      tips: [
        "Start your day with a glass of water before coffee",
        "Carry a 1 L reusable bottle — refill twice",
        "Drink a glass of water 30 min before each meal",
        conditions.includes("KIDNEY_STONES") ? "Add fresh lemon to water — citrate helps prevent stones" : "Set hourly hydration reminders on your phone",
      ],
    },
    sleep: {
      target_hours: "7–9",
      current_hours: sleepHours,
      gap_message: sleepHours < 7
        ? `You're getting ${sleepHours} h — aim for at least 7 h${hasGlycemic ? " to support blood sugar regulation" : " for recovery and hormone balance"}`
        : null,
      tips: [
        "Keep a consistent sleep and wake time — even on weekends",
        "Avoid screens 1 hour before bed (blue light disrupts melatonin)",
        "Keep your bedroom cool at 65–68 °F (18–20 °C)",
        "Avoid caffeine after 2 PM",
      ],
    },
    stress: {
      current_level: stress,
      clinical_note: conditions.length
        ? "Chronic stress raises cortisol, which elevates both blood pressure and blood glucose. Daily relaxation is as important as medication for your conditions."
        : "Managing stress protects your heart, sleep and metabolism. A few minutes of daily practice compounds over time.",
      techniques: [
        { name: "Box Breathing", duration: "5 min", description: "Inhale 4 s → Hold 4 s → Exhale 4 s → Hold 4 s. Activates the parasympathetic nervous system." },
        { name: "Nature Walk", duration: "20–30 min", description: "Brisk outdoor walking reduces cortisol by up to 18% in a single session." },
        { name: "Journalling", duration: "10 min", description: "Write 3 things you're grateful for each evening — shown to lower perceived stress." },
      ],
    },
    meditation: {
      recommended_minutes: conditions.includes("HTN") || conditions.includes("HEART_DISEASE") ? 15 : 10,
      best_time: "Morning (before breakfast) or evening (before bed)",
      clinical_note: conditions.includes("HTN")
        ? "Regular meditation reduces cortisol by up to 31% and lowers systolic blood pressure by 4–5 mmHg — meaningful for Hypertension management."
        : "Regular meditation reduces cortisol by up to 31%, improving sleep, focus and metabolic health.",
      practices: [
        { name: "4-7-8 Breathing", duration: "5 min", icon: "🫁", level: "Beginner", description: "Inhale 4 s → Hold 7 s → Exhale 8 s. Repeat 4–8 cycles. Rapidly activates the rest-and-digest response." },
        { name: "Body Scan Meditation", duration: "10 min", icon: "🧘", level: "Beginner", description: "Move attention slowly from toes to crown, releasing tension. Excellent for sleep quality." },
        { name: "Mindful Eating", duration: "Per meal", icon: "🍽️", level: "Easy", description: "Eat without screens, chew each bite 20–30 times. Reduces post-meal glucose spikes and overeating." },
        { name: "Guided Visualisation", duration: "10 min", icon: "🌊", level: "Intermediate", description: "Picture a calm place in vivid detail. Reduces anxiety and supports immune function." },
      ],
      apps: [
        { name: "Insight Timer", note: "Free — 100k+ guided meditations" },
        { name: "Headspace", note: "Structured beginner programs" },
        { name: "Calm", note: "Sleep stories + breathing exercises" },
      ],
    },
    condition_specific,
    medication_notes: medications
      .map((m) => MEDICATION_NOTES[m])
      .filter(Boolean),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// User summary
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Plan-aware Q&A for the AI Copilot page (demo mode)
// ─────────────────────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "with", "and", "the", "low", "fat", "whole", "mixed", "fresh", "roasted", "grilled",
  "baked", "steamed", "bowl", "salad", "curry", "soup", "grain", "wheat", "free", "herbs",
  "veg", "vegetable", "veggies", "brown", "white", "sweet", "seeds", "nuts", "milk",
  // macro/nutrient words must never match a food — they route to target questions
  "protein", "energy", "fiber", "calorie", "calories",
]);
const SHORT_FOOD_WORDS = new Set(["dal", "egg", "eggs", "tofu", "oats", "poha", "idli", "rice", "fish", "roti"]);

function foodTokens(food: Food): string[] {
  const words = `${food.name} ${food.local || ""}`.toLowerCase().split(/[^a-z]+/);
  return words.filter((w) => (w.length >= 5 || SHORT_FOOD_WORDS.has(w)) && !STOP_WORDS.has(w));
}

/** Why a specific food is (or isn't) right for this user — grounded in their real profile. */
function explainFoodSafety(term: string, matches: Food[], input: OnboardingInput): string {
  const conditions = input.conditions || [];
  const reasons = new Set<string>();
  for (const f of matches) {
    if ((conditions.includes("T2D") || conditions.includes("PREDIABETES")) && f.gi !== undefined && f.gi >= 70)
      reasons.add(`its **high glycemic index (GI ${f.gi})** can spike blood sugar`);
    if ((conditions.includes("HTN") || conditions.includes("HEART_DISEASE")) && f.sodium === "high")
      reasons.add("its **high sodium** works against your blood-pressure targets");
    if (conditions.includes("KIDNEY_STONES") && f.oxalate === "high")
      reasons.add("it's **high in oxalates**, which can promote calcium-oxalate kidney stones");
    if ((conditions.includes("HYPERLIPIDEMIA") || conditions.includes("HEART_DISEASE")) && f.satfat === "high")
      reasons.add("its **saturated fat** content works against your cholesterol goals");
    if (conditions.includes("CKD") && f.highK)
      reasons.add("it's **high in potassium**, which strained kidneys clear poorly");
    if (conditions.includes("THYROID") && f.goitrogen)
      reasons.add("raw cruciferous vegetables contain **goitrogens** that can interfere with thyroid function");
  }

  const cap = term.charAt(0).toUpperCase() + term.slice(1);
  if (reasons.size > 0) {
    return (
      `**${cap} is limited in your plan.** Based on the conditions you selected, ${[...reasons].join("; and ")}. ` +
      `The engine automatically swaps in safer alternatives with similar nutrition — you'll see them in your meal slots.`
    );
  }

  // safe → describe benefits + where it shows up today
  const plan = generateMealPlan(input);
  const inPlan: string[] = [];
  const inAlts: string[] = [];
  for (const meal of plan.meals) {
    for (const item of meal.items)
      if (matches.some((f) => `food-${f.id}` === item.food.id)) inPlan.push(`${item.food.name} at ${SLOT_LABELS[meal.slot as Slot]} (${item.quantity_g}g, ${item.calories} kcal)`);
    for (const alt of meal.alternatives)
      if (matches.some((f) => `food-${f.id}` === alt.food.id)) inAlts.push(`${alt.food.name} (${SLOT_LABELS[meal.slot as Slot]})`);
  }
  const best = matches[0];
  const perks: string[] = [];
  if (best.gi !== undefined && best.gi < 55) perks.push(`low glycemic index (GI ${best.gi})`);
  if (best.fiber >= 5) perks.push(`high fiber (${best.fiber}g per serving)`);
  if (best.p >= 10) perks.push(`a solid protein source (${best.p}g per serving)`);
  if (best.sodium === "low") perks.push("naturally low in sodium");
  const perkStr = perks.length ? ` It's ${perks.join(", ")}.` : "";

  let where = "";
  if (inPlan.length) where = `\n\n✅ It's already in **today's plan**: ${inPlan.join("; ")}.`;
  else if (inAlts.length) where = `\n\n🔄 It's available as a **swap option** today: ${inAlts.slice(0, 3).join("; ")}.`;
  else where = "\n\nIt's safe for your profile — it rotates through your plan on other days, or find it among the swap alternatives.";

  return `**${cap} is a good fit for your profile.**${perkStr}${where}`;
}

export function answerHealthQuestion(input: OnboardingInput, message: string): string {
  const m = message.toLowerCase();
  const conditions = input.conditions || [];
  const macros = computeMacros(input);
  const goalLabel = (input.goal_type || "weight_loss").replace(/_/g, " ");
  const condStr = conditions.length ? conditions.map((c) => CONDITION_LABEL[c] || c).join(", ") : "no medical conditions";
  const disclaimer = "\n\n---\n*This is educational information, not medical advice. Consult your healthcare provider.*";

  // 1) Food-specific question — match message words against the food library
  const termMatches = new Map<string, Food[]>();
  for (const food of FOODS) {
    for (const token of foodTokens(food)) {
      if (m.includes(token)) {
        if (!termMatches.has(token)) termMatches.set(token, []);
        termMatches.get(token)!.push(food);
      }
    }
  }
  if (termMatches.size > 0) {
    // answer about the longest matched term (most specific)
    const term = [...termMatches.keys()].sort((a, b) => b.length - a.length)[0];
    return explainFoodSafety(term, termMatches.get(term)!, input) + disclaimer;
  }

  // 2) "What should I eat for <slot>?"
  const slotAsk: [RegExp, Slot][] = [
    [/breakfast|morning meal/, "breakfast"],
    [/mid[- ]?morning/, "mid_morning"],
    [/lunch/, "lunch"],
    [/evening snack|snack/, "evening_snack"],
    [/dinner|tonight/, "dinner"],
  ];
  for (const [re, slot] of slotAsk) {
    if (re.test(m) && /eat|meal|have|what|suggest|plan/.test(m)) {
      const plan = generateMealPlan(input);
      const meal = plan.meals.find((x) => x.slot === slot)!;
      const items = meal.items.map((i) => `• **${i.food.name}** — ${i.quantity_g}g, ${i.calories} kcal, ${Math.round(i.protein_g)}g protein`).join("\n");
      return (
        `Here's your **${SLOT_LABELS[slot]}** for today (${meal.slot_calories} kcal, tuned to your ${goalLabel} target):\n\n${items}\n\n` +
        `Not feeling it? There are ${meal.alternatives.length} safe swap options on the Nutrition page — all filtered for ${condStr}.` +
        disclaimer
      );
    }
  }

  // 3) Macro target questions
  if (/protein/.test(m)) {
    const ckd = conditions.includes("CKD");
    return (
      `Your protein target is **${macros.protein_g}g/day (${macros.protein_g_per_kg} g/kg)**.\n\n` +
      (ckd
        ? `Because you selected Chronic Kidney Disease, protein is **capped at 0.75 g/kg** to reduce kidney workload — this overrides your goal's usual target, and the engine trims portions so the day never exceeds it.`
        : `That's tuned for your goal of **${goalLabel}** at your weight of ${input.weight_kg} kg — enough to ${input.goal_type === "muscle_gain" ? "maximise muscle protein synthesis (spread across all 5 meals)" : "preserve lean muscle"}.`) +
      disclaimer
    );
  }
  if (/calorie|kcal|energy target/.test(m)) {
    const adj = input.calorie_adjustment ?? 0;
    return (
      `Your daily target is **${macros.calories} kcal**.\n\nIt's computed from your profile: BMR (Mifflin-St Jeor, from your age ${input.age}, ${input.weight_kg} kg, ${input.height_cm} cm) × your **${(input.activity_level || "moderate").replace(/_/g, " ")}** activity level, then adjusted for your **${goalLabel}** goal.` +
      (adj !== 0 ? ` Your logged weight trend is currently nudging it by **${adj > 0 ? "+" : ""}${adj} kcal**.` : "") +
      ` A safety floor prevents unhealthily low targets.` +
      disclaimer
    );
  }
  if (/carb/.test(m)) {
    const carbControlled = input.goal_type === "diabetes_friendly" || conditions.includes("T2D") || conditions.includes("PREDIABETES");
    return (
      `Your carbohydrate target is **${macros.carbs_g}g/day**.\n\n` +
      (carbControlled
        ? `Because blood-sugar control matters for your profile, carbs are **capped at 40% of calories** and every carb source in your plan is low-to-medium GI.`
        : `Carbs fill the calories left after your protein (${macros.protein_g}g) and fat (${macros.fat_g}g) targets — mostly from whole grains, legumes and fruit.`) +
      disclaimer
    );
  }
  if (/water|hydrat/.test(m)) {
    const ls = generateLifestyle(input);
    return (
      `Your hydration target is **${ls.hydration.target_liters} L/day** (~${ls.hydration.glasses_8oz} glasses). ${ls.hydration.reason}\n\nTips:\n${ls.hydration.tips.map((t: string) => `• ${t}`).join("\n")}` +
      disclaimer
    );
  }
  if (/sleep/.test(m)) {
    const ls = generateLifestyle(input);
    return (
      `Aim for **7–9 hours**. ${ls.sleep.gap_message ? ls.sleep.gap_message + "." : "Your logged sleep looks reasonable — consistency matters most."}\n\n${ls.sleep.tips.map((t: string) => `• ${t}`).join("\n")}` +
      disclaimer
    );
  }
  if (/weight|progress|losing|gaining|plateau/.test(m)) {
    return (
      `Log your weight on the **Progress page** — the engine reads your 3-week trend and automatically nudges your calorie target (±100 kcal) if you're moving too fast or too slow for your ${goalLabel} goal. ` +
      `Healthy pace: **0.5–1% of body weight per week** for loss; **~0.25–0.5 kg/month** of lean gain.` +
      disclaimer
    );
  }
  if (/workout|exercise|training|strength|cardio/.test(m)) {
    return (
      `Your workout plan is filtered for your fitness level, your ${goalLabel} goal and your conditions (${condStr}). ` +
      `Strength training 2–3×/week is included because it improves insulin sensitivity, bone density and resting metabolism — see the **Workouts** page for today's session with sets and reps.` +
      disclaimer
    );
  }

  // Fallback — personalised overview instead of a generic canned line
  const plan = generateMealPlan(input);
  return (
    `I'm answering from your actual profile: goal **${goalLabel}**, conditions **${condStr}**, ${input.cuisine || "indian"} cuisine, ${(input.protein_pref || "vegetarian").replace(/_/g, " ")} diet.\n\n` +
    `Today's plan: **${plan.total_calories} kcal**, ${plan.total_protein_g}g protein across 5 meals (${plan.fit.overall}% match to your targets).\n\n` +
    `Try asking me:\n• "Is banana safe for me?"\n• "What should I eat for dinner?"\n• "Why is my protein target ${macros.protein_g}g?"\n• "How much water should I drink?"` +
    disclaimer
  );
}

export function buildUserSummary(input: OnboardingInput, userId: string) {
  return {
    user_id: userId,
    name: input.name || "You",
    age: input.age,
    gender: input.gender,
    weight_kg: input.weight_kg,
    height_cm: input.height_cm,
    activity_level: input.activity_level,
    primary_goal: input.goal_type,
    condition_codes: input.conditions,
    cuisine_type: input.cuisine,
    protein_preference: input.protein_pref,
    lifestyle: {
      sleep_hours: input.lifestyle?.sleep_hours ?? 6.5,
      stress_level: input.lifestyle?.stress_level ?? "medium",
      water_liters_day: input.lifestyle?.water_liters_day ?? 2.0,
    },
  };
}
