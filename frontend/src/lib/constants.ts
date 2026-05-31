export const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "/api/v1";

export const GOALS = [
  { value: "weight_loss",               label: "Weight Loss",              icon: "⚖️", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "fat_loss",                  label: "Fat Loss",                 icon: "🔥", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "muscle_gain",               label: "Muscle Gain",              icon: "💪", color: "text-violet-600 bg-violet-50 border-violet-200" },
  { value: "maintenance",               label: "Maintain Weight",          icon: "🎯", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "healthy_aging",             label: "Healthy Aging",            icon: "🌿", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "cardiovascular",            label: "Improve Heart Health",     icon: "❤️", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "diabetes_friendly",         label: "Diabetes-Friendly",        icon: "🩺", color: "text-teal-600 bg-teal-50 border-teal-200" },
  { value: "blood_pressure_management", label: "Blood Pressure Control",   icon: "💊", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
];

export const CONDITIONS = [
  { code: "T2D",           label: "Type 2 Diabetes",       icon: "🩸", impact: "Adjusts carb sources to low-GI, fiber-rich foods" },
  { code: "PREDIABETES",   label: "Prediabetes",            icon: "⚠️", impact: "Eliminates sugary beverages, favors whole grains" },
  { code: "HTN",           label: "Hypertension",           icon: "💓", impact: "DASH protocol: sodium < 1500mg/day, high potassium" },
  { code: "HYPERLIPIDEMIA",label: "High Cholesterol",       icon: "🫀", impact: "Removes trans fats, limits saturated fat, adds fiber" },
  { code: "KIDNEY_STONES", label: "Kidney Stones",          icon: "🫁", impact: "Avoids high-oxalate foods, increases hydration" },
  { code: "CKD",           label: "Chronic Kidney Disease", icon: "🏥", impact: "Caps protein at 0.75g/kg, limits phosphorus & potassium" },
  { code: "HEART_DISEASE", label: "Heart Disease",          icon: "❤️", impact: "Sodium < 1500mg, no trans fats, omega-3 priority" },
  { code: "THYROID",       label: "Thyroid Disorder",       icon: "🦋", impact: "Limits raw cruciferous vegetables, iodine-rich foods" },
];

export const ACTIVITY_LEVELS = [
  { value: "sedentary",   label: "Sedentary",        description: "Little or no exercise, desk job" },
  { value: "light",       label: "Lightly Active",   description: "Light exercise 1-3 days/week" },
  { value: "moderate",    label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
  { value: "active",      label: "Very Active",       description: "Hard exercise 6-7 days/week" },
  { value: "very_active", label: "Extra Active",      description: "Very hard exercise, physical job" },
];

export const CUISINE_TYPES = [
  { value: "indian",        label: "Indian",         icon: "🍛", description: "Dal, roti, rice, sabzi" },
  { value: "western",       label: "Western",        icon: "🥗", description: "Salads, grills, bowls" },
  { value: "mediterranean", label: "Mediterranean",  icon: "🫒", description: "Olive oil, legumes, fish" },
];

export const PROTEIN_PREFERENCES = [
  { value: "vegetarian",     label: "Vegetarian",     icon: "🥦", description: "Dairy, paneer, tofu, soy (eggs only in Western/Med cuisine)" },
  { value: "non_vegetarian", label: "Non-Vegetarian", icon: "🍗", description: "Chicken, fish, eggs, meat" },
  { value: "vegan",          label: "Vegan",          icon: "🌱", description: "100% plant-based" },
  { value: "pescatarian",    label: "Pescatarian",    icon: "🐟", description: "Fish & seafood, no meat" },
];

export const MEAL_SLOT_LABELS: Record<string, string> = {
  breakfast:     "Breakfast",
  mid_morning:   "Mid Morning",
  lunch:         "Lunch",
  evening_snack: "Evening Snack",
  dinner:        "Dinner",
};

export const MEAL_SLOT_ICONS: Record<string, string> = {
  breakfast:     "🌅",
  mid_morning:   "🍎",
  lunch:         "☀️",
  evening_snack: "🍵",
  dinner:        "🌙",
};

export const MACRO_COLORS = {
  protein: "#8b5cf6",
  carbs:   "#0ea5e9",
  fat:     "#f97316",
  fiber:   "#10b981",
};

export const CONDITION_COLORS: Record<string, string> = {
  T2D:           "bg-teal-100 text-teal-800 border-teal-200",
  PREDIABETES:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  HTN:           "bg-blue-100 text-blue-800 border-blue-200",
  HYPERLIPIDEMIA:"bg-indigo-100 text-indigo-800 border-indigo-200",
  KIDNEY_STONES: "bg-purple-100 text-purple-800 border-purple-200",
  CKD:           "bg-red-100 text-red-800 border-red-200",
  HEART_DISEASE: "bg-rose-100 text-rose-800 border-rose-200",
  THYROID:       "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const MEDICATIONS = [
  { value: "insulin_fast",    label: "Fast-Acting Insulin",    icon: "💉", note: "Humalog, NovoLog — meal carb timing critical" },
  { value: "insulin_long",    label: "Long-Acting Insulin",    icon: "💉", note: "Lantus, Tresiba — consistent carb distribution" },
  { value: "metformin",       label: "Metformin",              icon: "💊", note: "Take with food; avoid excessive alcohol" },
  { value: "blood_thinners",  label: "Blood Thinners",         icon: "🩸", note: "Warfarin/Eliquis — keep vitamin K intake consistent" },
  { value: "statins",         label: "Statins",                icon: "💊", note: "Atorvastatin/Rosuvastatin — avoid grapefruit" },
  { value: "thyroid_meds",    label: "Thyroid Medication",     icon: "🦋", note: "Levothyroxine — take on empty stomach, 30–60 min before food" },
  { value: "beta_blockers",   label: "Beta-Blockers",          icon: "💊", note: "Metoprolol/Atenolol — avoid sudden potassium changes" },
  { value: "ace_arb",         label: "BP Medication (ACE/ARB)", icon: "💊", note: "Lisinopril/Losartan — monitor potassium-rich foods" },
  { value: "calcium_channel", label: "Calcium Channel Blockers",icon: "💊", note: "Amlodipine — avoid grapefruit" },
  { value: "diuretics",       label: "Diuretics / Water Pills", icon: "💧", note: "Furosemide/HCTZ — extra hydration; replenish potassium" },
];
