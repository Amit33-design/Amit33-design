/**
 * Alcohol, measured in US standard drinks (14 g of ethanol).
 *
 * The onboarding form used to ask for "units per week" and explained that
 * "1 unit = 1 small beer or glass of wine". That is wrong by 2-3x: a UK unit
 * is 8 g of ethanol, and a pint of 5% beer is ~2.8 units, a large glass of
 * wine ~2.1. Anyone counting drinks rather than units was undercounted, and
 * the number never reached the engine anyway. So the user now picks what
 * they actually drink, in real container sizes, and we do the arithmetic.
 *
 * Sizes include the common Indian servings (650 ml beer bottle, 30/60 ml
 * pegs) as well as US ones, because this app's default user is Indian and a
 * picker without their sizes would recreate the undercount it exists to fix.
 */

export const ETHANOL_G_PER_ML = 0.789;
export const GRAMS_PER_STANDARD_DRINK = 14;
/** A UK unit is 10 ml of ethanol, i.e. ~8 g. Used to migrate old entries. */
export const GRAMS_PER_UK_UNIT = 8;
const KCAL_PER_G_ETHANOL = 7;

export type DrinkType =
  | "beer_can"
  | "beer_pint"
  | "beer_large"
  | "wine_glass"
  | "spirit_shot"
  | "spirit_peg_small"
  | "spirit_peg_large";

export interface DrinkSpec {
  label: string;
  ml: number;
  /** default strength, % ABV */
  abv: number;
  /** carbohydrate per serving — beer carries real carbs, spirits none */
  carbs_g: number;
}

export const DRINK_TYPES: Record<DrinkType, DrinkSpec> = {
  beer_can:         { label: "Beer — can or small bottle", ml: 355, abv: 5,  carbs_g: 13 },
  beer_pint:        { label: "Beer — pint",                ml: 473, abv: 5,  carbs_g: 17 },
  beer_large:       { label: "Beer — large bottle",        ml: 650, abv: 5,  carbs_g: 24 },
  wine_glass:       { label: "Wine — glass",               ml: 150, abv: 12, carbs_g: 4 },
  spirit_shot:      { label: "Spirits — shot",             ml: 44,  abv: 40, carbs_g: 0 },
  spirit_peg_small: { label: "Spirits — small peg",        ml: 30,  abv: 40, carbs_g: 0 },
  spirit_peg_large: { label: "Spirits — large peg",        ml: 60,  abv: 40, carbs_g: 0 },
};

export interface DrinkEntry {
  type: DrinkType;
  /** servings per week */
  count: number;
  /** optional override, % ABV — craft beer and fortified wine vary a lot */
  abv?: number;
}

/** Standard drinks in one serving of `ml` at `abvPct` % alcohol. */
export function standardDrinks(ml: number, abvPct: number): number {
  return (ml * (abvPct / 100) * ETHANOL_G_PER_ML) / GRAMS_PER_STANDARD_DRINK;
}

export interface WeeklyAlcohol {
  drinks: number;
  ethanol_g: number;
  /** energy from alcohol AND beer's carbohydrate */
  kcal: number;
  carbs_g: number;
}

export function weeklyAlcohol(entries: DrinkEntry[]): WeeklyAlcohol {
  let ethanol = 0;
  let carbs = 0;
  for (const e of entries) {
    const spec = DRINK_TYPES[e.type];
    if (!spec || !(e.count > 0)) continue;
    const abv = e.abv && e.abv > 0 ? e.abv : spec.abv;
    ethanol += spec.ml * (abv / 100) * ETHANOL_G_PER_ML * e.count;
    carbs += spec.carbs_g * e.count;
  }
  return {
    drinks: round1(ethanol / GRAMS_PER_STANDARD_DRINK),
    ethanol_g: Math.round(ethanol),
    kcal: Math.round(ethanol * KCAL_PER_G_ETHANOL + carbs * 4),
    carbs_g: Math.round(carbs),
  };
}

/**
 * Old profiles stored `alcohol_units_week`. Treat those as UK units (8 g),
 * which is what the field's label claimed to mean: drinks = units x 8/14.
 */
export function legacyUnitsToDrinks(units: number): number {
  if (!(units > 0)) return 0;
  return round1((units * GRAMS_PER_UK_UNIT) / GRAMS_PER_STANDARD_DRINK);
}

/** Conditions where alcohol does specific harm, so the limit tightens. */
const ALCOHOL_SENSITIVE = ["HYPERTRIGLYCERIDEMIA", "PREDIABETES", "T2D"];

export interface AlcoholAssessment {
  drinks_week: number;
  kcal_week: number;
  drinking_days: number | null;
  limit_week: number;
  /** average on a drinking day, when drinking days are known */
  per_drinking_day: number | null;
  level: "none" | "within" | "above";
  headline: string;
  detail: string;
  tips: string[];
  medication_interactions: string[];
}

export function assessAlcohol(args: {
  drinks_week: number;
  /** full weekly energy incl. beer carbs, from weeklyAlcohol(); ethanol-only if absent */
  kcal_week?: number;
  drinking_days?: number | null;
  gender?: string;
  conditions?: string[];
  medications?: string[];
}): AlcoholAssessment {
  const drinks = Math.max(0, args.drinks_week || 0);
  const female = args.gender === "female";
  const conditions = args.conditions || [];
  const medications = args.medications || [];
  const sensitive = conditions.filter((c) => ALCOHOL_SENSITIVE.includes(c));
  // NIAAA heavy-drinking thresholds; tighter where a condition is involved
  const generalLimit = female ? 7 : 14;
  const dayLimit = female ? 3 : 4;
  const limit = sensitive.length ? Math.min(7, generalLimit) : generalLimit;
  const days = args.drinking_days && args.drinking_days > 0 ? Math.min(7, args.drinking_days) : null;
  const perDay = days ? round1(drinks / days) : null;
  const kcal = Math.round(args.kcal_week ?? drinks * GRAMS_PER_STANDARD_DRINK * KCAL_PER_G_ETHANOL);

  const meds: string[] = [];
  if (drinks > 0) {
    if (medications.includes("insulin_fast") || medications.includes("insulin_long"))
      meds.push("With insulin, alcohol can drop blood sugar dangerously low hours later — overnight included. Never drink on an empty stomach, and check your sugar before bed.");
    if (medications.includes("metformin"))
      meds.push("With metformin, heavy or binge drinking raises the risk of lactic acidosis, a rare but serious reaction. Keep intake low and never drink heavily in one sitting.");
    if (medications.includes("blood_thinners"))
      meds.push("Alcohol strengthens the effect of blood thinners and can make your INR swing. Keep amounts small and steady, and tell your doctor how much you drink.");
  }

  if (drinks === 0) {
    return {
      drinks_week: 0, kcal_week: 0, drinking_days: days, limit_week: limit, per_drinking_day: null,
      level: "none",
      headline: "No alcohol reported",
      detail: "Nothing to change here. If that shifts, add it in your profile so your plan can account for it.",
      tips: [], medication_interactions: meds,
    };
  }

  const overWeek = drinks > limit;
  const overDay = perDay !== null && perDay > dayLimit;
  const tips: string[] = [];
  const reasons: string[] = [];
  if (conditions.includes("HYPERTRIGLYCERIDEMIA")) reasons.push("alcohol raises triglycerides more directly than almost any food");
  if (conditions.includes("T2D") || conditions.includes("PREDIABETES")) reasons.push("it disrupts blood-sugar control, and sweet mixers add sugar on top");

  if (sensitive.length) {
    tips.push("Keep at least 3 alcohol-free days every week.");
    tips.push("Measure pours — a home 'glass' or 'peg' is often double the standard size.");
    tips.push("Skip sugary mixers: use soda water, diet tonic or fresh lime instead.");
    tips.push("Non-alcoholic beer is a good swap on social occasions.");
  } else {
    tips.push("Keep several alcohol-free days each week.");
    tips.push("Alternate each drink with a glass of water.");
  }
  if (overDay) tips.unshift(`You average about ${perDay} drinks on a drinking day — spreading the same amount across more days is less harmful than drinking it at once.`);

  const why = reasons.length ? ` For you it matters more than usual: ${reasons.join("; ")}.` : "";
  return {
    drinks_week: round1(drinks),
    kcal_week: kcal,
    drinking_days: days,
    limit_week: limit,
    per_drinking_day: perDay,
    level: overWeek || overDay ? "above" : "within",
    headline: overWeek
      ? `About ${round1(drinks)} drinks a week — above the ${limit} we'd suggest for you`
      : overDay
        ? "Your weekly total is fine, but drinking days run heavy"
        : `About ${round1(drinks)} drinks a week — within a sensible limit`,
    detail:
      `That is roughly ${kcal} calories a week from drinks, on top of your meals.${why}` +
      (overWeek ? ` Bringing it to ${limit} or fewer a week would help.` : ""),
    tips,
    medication_interactions: meds,
  };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
