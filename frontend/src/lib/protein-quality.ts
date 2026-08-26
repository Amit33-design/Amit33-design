/**
 * Protein quality — how much of what you eat your body can actually use.
 *
 * Every app that tracks protein counts grams. Grams are not equivalent: the
 * body can only build with a protein that supplies enough of each essential
 * amino acid, and plant proteins are typically short of one. Cereals run low
 * on lysine, pulses run low on methionine. So 30 g of dal protein does less
 * work than 30 g of paneer protein — a distinction that matters enormously for
 * the vegetarian and vegan eaters this app is built for, and one that no
 * mainstream tracker makes.
 *
 * Two measures are used here:
 *
 *  - DIAAS scores a protein source against human requirements. Above 1.0 is
 *    excellent (dairy, egg, meat), 0.75–1.0 good (soy), below 0.75 means the
 *    source alone is limiting.
 *
 *  - Leucine specifically triggers muscle protein synthesis. A meal needs
 *    roughly 2.5 g of it to switch that process on; below the threshold the
 *    protein is largely used for maintenance rather than building. Plant
 *    proteins carry less leucine per gram, so plant eaters need a somewhat
 *    larger serving to cross the same line.
 *
 * The important, hopeful part: cereals and pulses are limiting in *different*
 * amino acids, so eaten together they cover each other. Dal with rice, rajma
 * with roti, hummus with pita — the traditional pairings are not an accident.
 * A blended meal scores far better than either component alone, and this
 * module rewards that rather than just telling plant eaters their protein is
 * second-rate.
 */

export interface ProteinSource {
  /** DIAAS-style digestibility score for this food group */
  diaas: number;
  /** grams of leucine per gram of protein */
  leucine: number;
  /** the amino acid this source runs short of, if any */
  limiting: "lysine" | "methionine" | null;
}

/** Quality by food group, with specific foods overridden below. */
const GROUP_QUALITY: Record<string, ProteinSource> = {
  dairy: { diaas: 1.10, leucine: 0.095, limiting: null },
  protein: { diaas: 1.05, leucine: 0.085, limiting: null }, // eggs, fish, poultry, soy
  legumes: { diaas: 0.65, leucine: 0.075, limiting: "methionine" },
  grains: { diaas: 0.45, leucine: 0.082, limiting: "lysine" },
  nuts: { diaas: 0.45, leucine: 0.068, limiting: "lysine" },
  seeds: { diaas: 0.50, leucine: 0.070, limiting: "lysine" },
  vegetable: { diaas: 0.55, leucine: 0.065, limiting: "methionine" },
  fruit: { diaas: 0.50, leucine: 0.060, limiting: null },
  beverage: { diaas: 0.50, leucine: 0.060, limiting: null },
};

/**
 * Foods whose quality differs from their group. Soy is the standout — the one
 * plant protein that stands on its own — while paneer and curd score above the
 * general dairy figure.
 */
const FOOD_QUALITY: Record<string, ProteinSource> = {
  "soya-chunks": { diaas: 0.90, leucine: 0.078, limiting: null },
  "soya-keema": { diaas: 0.90, leucine: 0.078, limiting: null },
  "tofu-palak": { diaas: 0.90, leucine: 0.078, limiting: null },
  "tofu-bhurji": { diaas: 0.90, leucine: 0.078, limiting: null },
  "tofu-veg-stirfry": { diaas: 0.90, leucine: 0.078, limiting: null },
  "tofu-scramble-med": { diaas: 0.90, leucine: 0.078, limiting: null },
  "edamame": { diaas: 0.90, leucine: 0.078, limiting: null },
  "chickpea-tofu-salad": { diaas: 0.80, leucine: 0.077, limiting: null },
  paneer: { diaas: 1.15, leucine: 0.098, limiting: null },
  "paneer-tikka": { diaas: 1.15, leucine: 0.098, limiting: null },
  "greek-yogurt": { diaas: 1.10, leucine: 0.096, limiting: null },
  "cottage-cheese": { diaas: 1.15, leucine: 0.098, limiting: null },
  quinoa: { diaas: 0.75, leucine: 0.072, limiting: null }, // unusually complete for a grain
  "egg-boiled": { diaas: 1.13, leucine: 0.086, limiting: null },
};

export function proteinQuality(foodId: string, group: string): ProteinSource {
  return FOOD_QUALITY[foodId] ?? GROUP_QUALITY[group] ?? GROUP_QUALITY.grains;
}

export interface MealProteinQuality {
  slot: string;
  protein_g: number;
  /** protein weighted by how well the body can use it */
  usable_protein_g: number;
  leucine_g: number;
  /** true when the meal clears the ~2.5 g leucine trigger */
  triggers_synthesis: boolean;
  /** cereal + pulse eaten together, covering each other's weak amino acid */
  complementary: boolean;
  quality_score: number;
  note: string;
}

const LEUCINE_THRESHOLD = 2.5;

/**
 * Score one meal. When a cereal and a pulse both contribute real protein, the
 * blend is credited with covering the gaps — this is the mechanism behind
 * dal-chawal, rajma-roti and hummus with pita.
 */
export function analyseMealProtein(
  slot: string,
  items: { food: { id: string; food_group: string }; protein_g: number }[]
): MealProteinQuality {
  let protein = 0;
  let usable = 0;
  let leucine = 0;
  let cerealProtein = 0;
  let pulseProtein = 0;

  for (const item of items) {
    const id = item.food.id.replace(/^food-/, "");
    const q = proteinQuality(id, item.food.food_group);
    const p = item.protein_g;
    protein += p;
    usable += p * q.diaas;
    leucine += p * q.leucine;
    if (q.limiting === "lysine") cerealProtein += p;
    if (q.limiting === "methionine") pulseProtein += p;
  }

  // Complementarity needs both sides present in meaningful amounts — a token
  // spoonful of dal alongside rice doesn't rescue the meal.
  const complementary = cerealProtein >= 3 && pulseProtein >= 3;
  if (complementary) {
    // the paired protein is credited at roughly a good-quality plant blend
    const paired = Math.min(cerealProtein, pulseProtein) * 2;
    const pairedUsableBefore = paired * 0.55;
    const pairedUsableAfter = paired * 0.80;
    usable += pairedUsableAfter - pairedUsableBefore;
  }

  usable = Math.min(usable, protein); // can never use more than you ate
  const score = protein > 0 ? Math.round((usable / protein) * 100) : 0;
  const triggers = leucine >= LEUCINE_THRESHOLD;

  let note: string;
  if (protein < 5) note = "Little protein in this meal — that's fine for a light snack.";
  else if (complementary && triggers)
    note = "Grain and pulse together here cover each other's weak amino acid, and there's enough leucine to switch on muscle repair.";
  else if (complementary)
    note = "Grain and pulse together lift the quality of this meal's protein. A little more of it would cross the threshold that triggers muscle repair.";
  else if (triggers)
    note = "Enough leucine to trigger muscle repair.";
  else if (score >= 85)
    note = "High-quality protein, but the portion is too small to trigger muscle repair on its own.";
  else
    note = "Adding a pulse to a grain meal — or a grain to a pulse meal — would noticeably improve how much of this protein you can use.";

  return {
    slot,
    protein_g: Math.round(protein * 10) / 10,
    usable_protein_g: Math.round(usable * 10) / 10,
    leucine_g: Math.round(leucine * 100) / 100,
    triggers_synthesis: triggers,
    complementary,
    quality_score: score,
    note,
  };
}

export interface DayProteinQuality {
  meals: MealProteinQuality[];
  total_protein_g: number;
  usable_protein_g: number;
  quality_score: number;
  meals_triggering: number;
  main_meals: number;
  headline: string;
  advice: string | null;
}

/** Whole-day protein quality, with advice pitched at the user's diet. */
export function analyseDayProtein(
  meals: { slot: string; items: { food: { id: string; food_group: string }; protein_g: number }[] }[],
  diet: string
): DayProteinQuality {
  const rows = meals.map((m) => analyseMealProtein(m.slot, m.items));
  const MAIN = ["breakfast", "lunch", "dinner"];
  const mains = rows.filter((r) => MAIN.includes(r.slot));
  const total = rows.reduce((s, r) => s + r.protein_g, 0);
  const usable = rows.reduce((s, r) => s + r.usable_protein_g, 0);
  const score = total > 0 ? Math.round((usable / total) * 100) : 0;
  const triggering = mains.filter((r) => r.triggers_synthesis).length;
  const plantOnly = diet === "vegan" || diet === "vegetarian";

  const headline =
    score >= 85
      ? `Your body can use about ${Math.round(usable)}g of today's ${Math.round(total)}g of protein — excellent quality.`
      : score >= 70
        ? `About ${Math.round(usable)}g of today's ${Math.round(total)}g of protein is in a form your body can readily use.`
        : `Only about ${Math.round(usable)}g of today's ${Math.round(total)}g of protein is in a readily usable form.`;

  let advice: string | null = null;
  if (score < 75 && plantOnly) {
    advice =
      "Plant proteins each run short of one essential amino acid — grains lack lysine, pulses lack methionine — so on their own the body can't use all of what you eat. Eaten in the same meal they cover each other, which is exactly why dal-chawal, rajma-roti and khichdi have endured. Pairing them, or adding soy, paneer or curd, lifts the usable share substantially.";
  } else if (triggering < 2) {
    advice = plantOnly
      ? `Only ${triggering} of your main meals carries enough leucine to switch on muscle repair. Plant proteins are lower in leucine, so a slightly bigger serving of dal, soy, paneer or curd at breakfast is usually the easiest fix.`
      : `Only ${triggering} of your main meals carries enough leucine to switch on muscle repair. Shifting some protein to breakfast usually fixes this without eating any more overall.`;
  } else if (score < 75) {
    advice = "Adding a complete protein — dairy, soy, egg or fish — to one more meal would raise how much of your protein is usable.";
  }

  return {
    meals: rows,
    total_protein_g: Math.round(total),
    usable_protein_g: Math.round(usable),
    quality_score: score,
    meals_triggering: triggering,
    main_meals: mains.length,
    headline,
    advice,
  };
}
