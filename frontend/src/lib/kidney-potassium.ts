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

/**
 * Daily protein for kidney disease, by stage.
 *
 * Every CKD profile used to be capped at 0.75 g/kg — a number from neither
 * guideline, and the WRONG DIRECTION for dialysis, where protein and amino
 * acids are lost into the dialysate and protein-energy wasting is one of the
 * strongest predictors of death.
 *
 *  - Not on dialysis (stage 1-5): KDIGO 2024 — keep protein at 0.8 g/kg/day
 *    and avoid more than 1.3. KDOQI 2020 goes lower (0.55-0.6, or 0.6-0.8 with
 *    diabetes) but only for metabolically stable patients under CLOSE
 *    dietitian supervision, which an app cannot provide — so 0.8 is the
 *    ceiling here and the copy says a kidney team may prescribe less.
 *  - Haemodialysis and peritoneal dialysis: KDOQI 2020 — 1.0-1.2 g/kg/day,
 *    with or without diabetes. A floor, not a ceiling.
 *  - Transplant: no formal guideline target; long-term practice is
 *    ~0.8-1.0 g/kg (higher, ~1.3-1.5, for the first weeks after surgery —
 *    the transplant team sets that).
 *  - Stage unknown: the non-dialysis 0.8 ceiling, with copy asking dialysis
 *    patients to say so, because they need more.
 */
export interface RenalProtein {
  /** clamp the goal's g/kg into [min, max] */
  min_g_per_kg: number;
  max_g_per_kg: number;
  /** true when max is a clinical CEILING the plan must not exceed */
  capped: boolean;
  dialysis: boolean;
  /** one sentence for the summary and the Copilot */
  why: string;
}

export function renalProtein(input: { conditions: string[]; kidney_stage?: KidneyStage | "" }): RenalProtein | null {
  if (!input.conditions.includes("CKD")) return null;
  switch (input.kidney_stage || "") {
    case "hemodialysis":
    case "peritoneal":
      return { min_g_per_kg: 1.0, max_g_per_kg: 1.2, capped: false, dialysis: true,
        why: "Dialysis removes protein from your blood every session, so you need MORE protein than before dialysis — 1.0-1.2 g per kg a day (KDOQI 2020). Eating too little is one of the biggest risks on dialysis." };
    case "transplant":
      return { min_g_per_kg: 0.8, max_g_per_kg: 1.0, capped: true, dialysis: false,
        why: "With a working transplant, protein is kept moderate at 0.8-1.0 g per kg a day. In the first weeks after surgery you need more — follow your transplant team then." };
    case "early":
    case "advanced":
      return { min_g_per_kg: 0, max_g_per_kg: 0.8, capped: true, dialysis: false,
        why: "Before dialysis, protein is kept at 0.8 g per kg a day (KDIGO 2024) to ease the load on your kidneys. Your kidney team may prescribe less, but a very-low-protein diet needs a dietitian's supervision." };
    default:
      return { min_g_per_kg: 0, max_g_per_kg: 0.8, capped: true, dialysis: false,
        why: "Protein is kept at 0.8 g per kg a day, the level for kidney disease before dialysis (KDIGO 2024). If you are ON dialysis, add that in your profile — dialysis needs more protein, not less." };
  }
}

/**
 * Daily phosphorus for kidney disease.
 *
 *  - KDIGO 2017 (CKD-MBD, G3a-G5D): limit dietary phosphate to TREAT high
 *    blood phosphate — not preventively — and consider the source (animal,
 *    plant, additive).
 *  - KDOQI 2020: adjust phosphorus to keep blood phosphate in the normal range
 *    (2.5-4.5 mg/dL, 0.81-1.45 mmol/L); the usual restricted intake is
 *    800-1000 mg/day; cut phosphate additives, which are ~90% absorbed against
 *    ~40% for plant (phytate) phosphorus.
 *
 * So: on dialysis, where high phosphate is the rule rather than the exception,
 * 1000 mg (the top of the range, since binders do part of the work). With a
 * high blood result, 800 mg for anyone. With a low one, never restricted.
 * Otherwise no limit — but everyone with CKD hears about additives, because
 * that advice costs nothing and helps at every stage.
 */
export interface PhosphatePlan {
  limit: number | null;
  restricted: boolean;
  basis: "stage" | "blood_test" | "none";
  why: string;
  alert: { severity: "critical" | "watch"; headline: string; detail: string } | null;
}

/** mg/dL; 1 mmol/L = 3.097 mg/dL */
export const PHOSPHATE_NORMAL = { min: 2.5, max: 4.5 };

export function phosphatePlan(input: { conditions: string[]; kidney_stage?: KidneyStage | ""; serum_phosphate?: number | null }): PhosphatePlan | null {
  if (!input.conditions.includes("CKD")) return null;
  const dialysis = input.kidney_stage === "hemodialysis" || input.kidney_stage === "peritoneal";
  const p = input.serum_phosphate != null && input.serum_phosphate > 0 ? input.serum_phosphate : null;
  if (p !== null && p > PHOSPHATE_NORMAL.max) {
    return { limit: 800, restricted: true, basis: "blood_test",
      why: `Limited to 800 mg because of your blood phosphate of ${p} mg/dL`,
      alert: { severity: "critical", headline: `Blood phosphate of ${p} mg/dL is high`,
        detail: "Over 4.5 mg/dL is high. Over time it pulls calcium out of bones and into blood vessels. Your plan now uses an 800 mg limit. The biggest single step is avoiding packaged foods with phosphate additives (look for \"phos\" in the ingredients — colas, processed cheese, many breads, ready meals and some meats are injected with it), because that phosphate is almost fully absorbed. If you've been prescribed phosphate binders, take them WITH meals, not after. Please tell your kidney team." } };
  }
  if (p !== null && p < PHOSPHATE_NORMAL.min) {
    return { limit: null, restricted: false, basis: "blood_test",
      why: `Not restricted — your blood phosphate of ${p} mg/dL is low`,
      alert: { severity: "watch", headline: `Blood phosphate of ${p} mg/dL is low`,
        detail: "Under 2.5 mg/dL is low. This can happen after a kidney transplant or with poor appetite. Your plan does not restrict phosphorus; ask your kidney team whether you need more." } };
  }
  if (dialysis) {
    return { limit: 1000, restricted: true, basis: "stage",
      why: "Dialysis removes little phosphate, so intake is kept to the top of the usual 800-1000 mg range",
      alert: null };
  }
  return { limit: null, restricted: false, basis: p !== null ? "blood_test" : "none",
    why: p !== null
      ? `Not restricted — your blood phosphate of ${p} mg/dL is normal`
      : "Not restricted unless a blood test shows phosphate running high (KDIGO 2017)",
    alert: null };
}
