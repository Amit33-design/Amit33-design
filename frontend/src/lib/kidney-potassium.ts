/**
 * Daily potassium for kidney disease — set by the KIND of kidney disease and
 * the user's own blood potassium, not one number for everyone.
 *
 * The app used to give every "Chronic Kidney Disease" profile the same
 * 2000 mg ceiling. Current guidance does not support a single number:
 *
 *  - KDOQI 2020 (nutrition in CKD 3-5D and transplant): potassium intake should
 *    be adjusted to keep SERUM potassium normal, based on the person's needs
 *    and clinician judgement; look for non-dietary causes of high potassium
 *    before cutting food. Potassium in fruit, vegetables, whole grains, pulses
 *    and nuts is absorbed less than once assumed, and those foods have other
 *    benefits for people with CKD.
 *  - KDIGO 2024 (CKD evaluation and management): limit foods rich in
 *    BIOAVAILABLE potassium (processed foods, potassium additives) in CKD
 *    G3-G5 with a history of high potassium, or when the risk is high;
 *    otherwise favour diverse, plant-rich, minimally processed diets.
 *  - Cupisti & Kovesdy, Kidney Int 2022 ("time to be more flexible"): limit
 *    to under ~3 g/day when eGFR is under 30, and earlier only if high
 *    potassium keeps recurring.
 *  - Haemodialysis: a typical diet for managing high potassium is
 *    2,000-3,000 mg/day (National Kidney Foundation). Potassium builds up
 *    between sessions, so this group carries the most risk.
 *  - Peritoneal dialysis: dialysis runs every day and removes potassium
 *    continuously; low potassium is common (about 38% under 4.0 mmol/L in a
 *    2024 meta-analysis) and is linked to peritonitis and death, so routine
 *    restriction does more harm than good.
 *  - Kidney transplant: no routine restriction; tacrolimus and similar drugs
 *    raise potassium in a quarter to 44% of recipients, so a restriction
 *    follows a high blood result, not the transplant itself.
 *
 * Blood thresholds follow standard practice: normal 3.5-5.0 mmol/L; 5.1-5.4
 * mildly high; 5.5 or more high; 6.0 or more needs the care team the same day.
 *
 * This module is pure. It never loosens a limit for someone whose blood test
 * says potassium is high, and for anyone who has not told us their stage and
 * has no blood result it uses 3000 mg — the ceiling for advanced CKD and the
 * top of the dialysis range — and asks them to fill the gap.
 */

export type KidneyStage = "early" | "advanced" | "hemodialysis" | "peritoneal" | "transplant";

export const KIDNEY_STAGES: { code: KidneyStage; label: string; detail: string }[] = [
  { code: "early", label: "Stage 1-3 (not on dialysis)", detail: "eGFR 30 or above" },
  { code: "advanced", label: "Stage 4-5 (not on dialysis)", detail: "eGFR under 30" },
  { code: "hemodialysis", label: "Haemodialysis", detail: "Dialysis at a centre or at home, usually 3 times a week" },
  { code: "peritoneal", label: "Peritoneal dialysis", detail: "Daily dialysis through the belly (CAPD / APD)" },
  { code: "transplant", label: "Kidney transplant", detail: "Living with a transplanted kidney" },
];

/** A blood potassium this old no longer describes the user's current state. */
export const SERUM_POTASSIUM_MAX_AGE_DAYS = 90;

export interface PotassiumInput {
  conditions: string[];
  gender?: string;
  kidney_stage?: KidneyStage | "";
  /** latest blood potassium in mmol/L (= mEq/L), only if recent */
  serum_potassium?: number | null;
}

export type SerumBand = "low" | "normal" | "mildly_high" | "high" | "urgent";

export interface PotassiumPlan {
  /** mg/day ceiling, or null when potassium should NOT be restricted */
  limit: number | null;
  /** what the nutrient panel shows — the ceiling, or the general intake goal */
  target: number;
  /** true when high-potassium foods are excluded and the renal kitchen is assumed */
  restricted: boolean;
  /** what set the number, so the copy can say so */
  basis: "not_kidney" | "stage" | "blood_test" | "stage_unknown";
  serum_band: SerumBand | null;
  /** one line for the nutrient panel's "why" */
  why: string;
  /** a blood result that needs the user's attention, if any */
  alert: { severity: "critical" | "watch"; headline: string; detail: string } | null;
}

export function serumBand(k: number): SerumBand {
  if (k < 3.5) return "low";
  if (k <= 5.0) return "normal";
  if (k < 5.5) return "mildly_high";
  if (k < 6.0) return "high";
  return "urgent";
}

/** Adequate intake for adults without a kidney reason to restrict (NASEM 2019). */
export function generalPotassiumTarget(gender?: string): number {
  return gender === "female" ? 2600 : 3400;
}

/** The ceiling each stage gets while blood potassium is normal or unknown. */
function stageLimit(stage: KidneyStage | undefined, serum: SerumBand | null): number | null {
  switch (stage) {
    case "early":
    case "peritoneal":
    case "transplant":
      return null;
    case "advanced":
      return 3000;
    case "hemodialysis":
      // with a normal result on the current diet, the top of the usual
      // 2,000-3,000 mg range; without one, the cautious end
      return serum === "normal" ? 3000 : 2000;
    default:
      return 3000;
  }
}

const STAGE_WORDS: Record<KidneyStage, string> = {
  early: "stage 1-3 kidney disease",
  advanced: "stage 4-5 kidney disease",
  hemodialysis: "haemodialysis",
  peritoneal: "peritoneal dialysis",
  transplant: "a kidney transplant",
};

export function potassiumPlan(input: PotassiumInput): PotassiumPlan {
  const general = generalPotassiumTarget(input.gender);
  if (!input.conditions.includes("CKD")) {
    return {
      limit: null, target: general, restricted: false, basis: "not_kidney", serum_band: null,
      why: "Counteracts sodium and relaxes blood vessel walls", alert: null,
    };
  }

  const stage = input.kidney_stage || undefined;
  const k = input.serum_potassium != null && input.serum_potassium > 0 ? input.serum_potassium : null;
  const band = k !== null ? serumBand(k) : null;
  const stageText = stage ? STAGE_WORDS[stage] : "kidney disease";

  let limit = stageLimit(stage, band);
  let basis: PotassiumPlan["basis"] = stage ? "stage" : "stage_unknown";
  let alert: PotassiumPlan["alert"] = null;

  if (band === "urgent" || band === "high") {
    // A high result overrides every stage default — including dialysis and
    // transplant, where restriction is otherwise not routine.
    limit = 2000;
    basis = "blood_test";
    alert = band === "urgent"
      ? { severity: "critical", headline: `Blood potassium of ${k} mmol/L — contact your kidney team today`,
          detail: "6.0 or above can upset the heart rhythm. Please call your doctor or kidney unit today rather than relying on diet changes; if you have palpitations, muscle weakness or feel faint, seek urgent care. Your plan is set to the strict 2000 mg limit in the meantime. A sample that sat too long before testing can read falsely high, so a repeat test is common." }
      : { severity: "critical", headline: `Blood potassium of ${k} mmol/L is high`,
          detail: "5.5 or above is high. Your plan now uses the strict 2000 mg limit. Please let your kidney team know — they will usually repeat the test and check medicines that raise potassium (ACE inhibitors, ARBs, spironolactone, some painkillers) before relying on diet alone." };
  } else if (band === "mildly_high") {
    limit = Math.min(limit ?? Infinity, 2500);
    basis = "blood_test";
    alert = { severity: "watch", headline: `Blood potassium of ${k} mmol/L is slightly high`,
      detail: "5.1-5.4 is mildly raised. Your plan is limited to 2500 mg a day or less, cutting processed foods with potassium additives and salt substitutes first — that potassium is absorbed almost completely — and keeping fruit and vegetables in modest portions rather than removing them." };
  } else if (band === "low") {
    // Low potassium is its own danger, and the usual one on peritoneal
    // dialysis. Restricting food here would make it worse.
    limit = null;
    basis = "blood_test";
    alert = { severity: "critical", headline: `Blood potassium of ${k} mmol/L is low`,
      detail: `Under 3.5 is low${stage === "peritoneal" ? ", which is common on peritoneal dialysis because potassium is removed every day" : ""}. Your plan does NOT restrict potassium: fruit, vegetables, dal and curd are all welcome. Ask your kidney team whether you need a supplement — do not start one on your own.` };
  } else if (band === "normal") {
    basis = "blood_test";
  }

  const restricted = limit !== null;
  let why: string;
  if (restricted && basis === "blood_test") {
    why = `Limited to ${limit} mg because of your blood potassium of ${k} mmol/L`;
  } else if (restricted && basis === "stage_unknown") {
    why = "Limited to 3000 mg until you add your kidney stage or a blood potassium result — your real limit may be higher or lower";
  } else if (restricted) {
    why = stage === "hemodialysis"
      ? band === "normal"
        ? "Haemodialysis with a normal blood potassium — the top of the usual 2000-3000 mg dialysis range"
        : "Haemodialysis — potassium builds up between sessions, so the cautious 2000 mg end of the range until a blood result says otherwise"
      : `Limited to ${limit} mg for ${stageText}, where the kidneys clear potassium poorly`;
  } else if (band === "low") {
    why = "Not restricted — your blood potassium is low";
  } else {
    why = `Not restricted for ${stageText}${band === "normal" ? " with a normal blood potassium" : ""} — whole plant foods protect the heart and kidneys. A restriction only follows a high blood test.`;
  }

  return {
    limit, target: limit ?? general, restricted, basis, serum_band: band, why, alert,
  };
}
