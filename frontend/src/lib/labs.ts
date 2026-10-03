/**
 * Blood-test results the user can optionally record.
 *
 * Conditions in this app are self-declared. Lab values let the app SUGGEST a
 * condition the numbers point to — never apply one: the user always confirms,
 * and anything in a diagnostic range is framed as "confirm with your doctor".
 *
 * Values are stored in one canonical unit per marker (mg/dL for lipids and
 * glucose, % for HbA1c, U/L for ALT). Labs outside India and the US report
 * lipids and glucose in mmol/L and HbA1c in mmol/mol, and a triglyceride of
 * 1.8 mmol/L typed into a mg/dL box would read as perfectly normal — so the
 * entry form offers the other unit and converts on the way in.
 */

export type LabMarker = "tg" | "hdl" | "ldl" | "total_chol" | "a1c" | "fasting_glucose" | "alt" | "potassium" | "phosphate";

export interface LabUnit {
  label: string;
  /** multiply an entered value by this to get the canonical unit */
  toCanonical: (v: number) => number;
}

export interface LabMarkerSpec {
  label: string;
  unit: string; // canonical
  altUnits?: LabUnit[];
  /** reference band for charts: good range in the canonical unit */
  band: { min: number; max: number };
  /** true when the value depends on whether the draw was fasting */
  fastingMatters: boolean;
  /** plausible range in the canonical unit — outside it, the entry is refused */
  plausible: { min: number; max: number };
  note: string;
}

const mmolLipid = (v: number) => v * 38.67;   // cholesterol, mmol/L -> mg/dL
const mmolTG = (v: number) => v * 88.57;      // triglycerides
const mmolGlucose = (v: number) => v * 18.016;
const ifccToPct = (v: number) => v / 10.929 + 2.15; // HbA1c mmol/mol -> %

export const LAB_MARKERS: Record<LabMarker, LabMarkerSpec> = {
  tg: {
    label: "Triglycerides", unit: "mg/dL",
    altUnits: [{ label: "mmol/L", toCanonical: mmolTG }],
    band: { min: 0, max: 150 }, fastingMatters: true, plausible: { min: 20, max: 5000 },
    note: "Under 150 mg/dL fasting is healthy. Non-fasting results read higher.",
  },
  ldl: {
    label: "LDL cholesterol", unit: "mg/dL",
    altUnits: [{ label: "mmol/L", toCanonical: mmolLipid }],
    band: { min: 0, max: 100 }, fastingMatters: false, plausible: { min: 20, max: 500 },
    note: "Under 100 mg/dL is optimal; 130 or above is raised.",
  },
  hdl: {
    label: "HDL cholesterol", unit: "mg/dL",
    altUnits: [{ label: "mmol/L", toCanonical: mmolLipid }],
    band: { min: 50, max: 100 }, fastingMatters: false, plausible: { min: 10, max: 150 },
    note: "Higher is better — above 40 mg/dL for men and 50 for women.",
  },
  total_chol: {
    label: "Total cholesterol", unit: "mg/dL",
    altUnits: [{ label: "mmol/L", toCanonical: mmolLipid }],
    band: { min: 0, max: 200 }, fastingMatters: false, plausible: { min: 60, max: 700 },
    note: "Under 200 mg/dL is desirable.",
  },
  a1c: {
    label: "HbA1c", unit: "%",
    altUnits: [{ label: "mmol/mol", toCanonical: ifccToPct }],
    band: { min: 4, max: 5.7 }, fastingMatters: false, plausible: { min: 3, max: 20 },
    note: "Your average blood sugar over about 3 months. 5.7-6.4% is the prediabetes range.",
  },
  fasting_glucose: {
    label: "Fasting glucose", unit: "mg/dL",
    altUnits: [{ label: "mmol/L", toCanonical: mmolGlucose }],
    band: { min: 70, max: 100 }, fastingMatters: true, plausible: { min: 30, max: 600 },
    note: "Under 100 mg/dL is normal; 100-125 is the prediabetes range.",
  },
  alt: {
    label: "ALT (liver enzyme)", unit: "U/L",
    band: { min: 0, max: 40 }, fastingMatters: false, plausible: { min: 1, max: 2000 },
    note: "Upper limits vary by lab (often 33-40 U/L). Raised ALT is common with fatty liver.",
  },
  potassium: {
    label: "Potassium (blood)", unit: "mmol/L",
    // mEq/L is numerically identical for potassium
    altUnits: [{ label: "mEq/L", toCanonical: (v) => v }],
    band: { min: 3.5, max: 5.0 }, fastingMatters: false, plausible: { min: 1.5, max: 9 },
    note: "3.5-5.0 is normal. With kidney disease this result sets how much potassium your plan allows.",
  },
  phosphate: {
    label: "Phosphate (blood)", unit: "mg/dL",
    altUnits: [{ label: "mmol/L", toCanonical: (v) => v * 3.097 }],
    band: { min: 2.5, max: 4.5 }, fastingMatters: false, plausible: { min: 0.5, max: 15 },
    note: "2.5-4.5 mg/dL is normal. With kidney disease this result sets how much phosphorus your plan allows.",
  },
};

export interface LabResult {
  id: string;
  marker: LabMarker;
  /** canonical unit */
  value: number;
  /** YYYY-MM-DD */
  date: string;
  /** null when the user did not say */
  fasting: boolean | null;
}

/** Convert an entered value to the canonical unit, refusing implausible ones. */
export function toCanonical(marker: LabMarker, value: number, unitLabel?: string): number | null {
  const spec = LAB_MARKERS[marker];
  if (!(value > 0)) return null;
  const alt = spec.altUnits?.find((u) => u.label === unitLabel);
  const v = alt ? alt.toCanonical(value) : value;
  if (v < spec.plausible.min || v > spec.plausible.max) return null;
  return Math.round(v * 10) / 10;
}

/** The most recent result for each marker. */
export function latestByMarker(results: LabResult[]): Partial<Record<LabMarker, LabResult>> {
  const out: Partial<Record<LabMarker, LabResult>> = {};
  for (const r of results) {
    const cur = out[r.marker];
    if (!cur || r.date > cur.date) out[r.marker] = r;
  }
  return out;
}

const daysApart = (a: string, b: string) =>
  Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;

export interface DerivedLabs {
  /** total cholesterol minus HDL — everything that can clog an artery */
  non_hdl: number | null;
  /** triglycerides / HDL (both mg/dL); above ~3.5 hints at insulin resistance */
  tg_hdl_ratio: number | null;
}

/**
 * Derived values only combine results from roughly the same blood draw:
 * pairing a year-old HDL with this month's cholesterol means nothing.
 */
export function deriveLabs(results: LabResult[]): DerivedLabs {
  const l = latestByMarker(results);
  const sameDraw = (a?: LabResult, b?: LabResult) => !!a && !!b && daysApart(a.date, b.date) <= 30;
  return {
    non_hdl: sameDraw(l.total_chol, l.hdl) ? Math.round(l.total_chol!.value - l.hdl!.value) : null,
    tg_hdl_ratio:
      sameDraw(l.tg, l.hdl) && l.tg!.fasting !== false
        ? Math.round((l.tg!.value / l.hdl!.value) * 10) / 10
        : null,
  };
}

export interface LabSuggestion {
  /** condition code to offer, or null for advice that is not a condition */
  condition: string | null;
  headline: string;
  detail: string;
  /** diagnostic-range results say so explicitly */
  confirmWithDoctor: boolean;
}

/**
 * What the latest results point to. SUGGESTIONS ONLY — the UI offers an
 * "add" button and nothing changes until the user presses it. Conditions the
 * user already has are not re-suggested.
 */
export function suggestFromLabs(results: LabResult[], existingConditions: string[] = []): LabSuggestion[] {
  const l = latestByMarker(results);
  const d = deriveLabs(results);
  const has = (c: string) => existingConditions.includes(c);
  const out: LabSuggestion[] = [];

  if (l.tg) {
    if (l.tg.value >= 150 && l.tg.fasting === true && !has("HYPERTRIGLYCERIDEMIA")) {
      out.push({ condition: "HYPERTRIGLYCERIDEMIA", confirmWithDoctor: false,
        headline: `Fasting triglycerides of ${l.tg.value} mg/dL`,
        detail: "150 mg/dL or above is high. Adding High Triglycerides tailors your plan to bring it down — less sugar and refined carbs, more omega-3." });
    } else if (l.tg.value >= 175 && l.tg.fasting !== true) {
      // A non-fasting draw reads higher after a meal, so it is not enough to
      // suggest a condition — only to suggest checking properly.
      out.push({ condition: null, confirmWithDoctor: false,
        headline: `Triglycerides of ${l.tg.value} mg/dL${l.tg.fasting === false ? " (not fasting)" : ""}`,
        detail: "That's raised, but triglycerides climb after eating. A fasting test (8-12 hours without food) would show whether it is really high." });
    }
  }

  const a1c = l.a1c?.value;
  const fg = l.fasting_glucose && l.fasting_glucose.fasting !== false ? l.fasting_glucose.value : undefined;
  const diabetesRange = (a1c !== undefined && a1c >= 6.5) || (fg !== undefined && fg >= 126);
  const prediabetesRange =
    (a1c !== undefined && a1c >= 5.7 && a1c < 6.5) || (fg !== undefined && fg >= 100 && fg < 126);
  if (diabetesRange && !has("T2D")) {
    out.push({ condition: "T2D", confirmWithDoctor: true,
      headline: a1c !== undefined && a1c >= 6.5 ? `HbA1c of ${a1c}%` : `Fasting glucose of ${fg} mg/dL`,
      detail: "This is in the diabetes range. A diagnosis needs a doctor, usually with a repeat test — please book one. Adding Type 2 Diabetes now tailors your plan to blood-sugar control in the meantime." });
  } else if (prediabetesRange && !has("PREDIABETES") && !has("T2D")) {
    out.push({ condition: "PREDIABETES", confirmWithDoctor: false,
      headline: a1c !== undefined && a1c >= 5.7 ? `HbA1c of ${a1c}%` : `Fasting glucose of ${fg} mg/dL`,
      detail: "This is in the prediabetes range — the stage where diet and activity changes work best. Adding Prediabetes focuses your plan on steady blood sugar." });
  }

  const ldlHigh = l.ldl && l.ldl.value >= 130;
  const nonHdlHigh = d.non_hdl !== null && d.non_hdl >= 160;
  if ((ldlHigh || nonHdlHigh) && !has("HYPERLIPIDEMIA")) {
    out.push({ condition: "HYPERLIPIDEMIA", confirmWithDoctor: false,
      headline: ldlHigh ? `LDL cholesterol of ${l.ldl!.value} mg/dL` : `Non-HDL cholesterol of ${d.non_hdl} mg/dL`,
      detail: "That's raised. Adding High Cholesterol cuts saturated fat and adds soluble fibre, the dietary changes that lower LDL most." });
  }

  // Blood potassium. The plan acts on it by itself (see kidney-potassium), so
  // there is no condition to add — but a dangerous value must be said here
  // too, where the user has just typed it.
  if (l.potassium && daysApart(l.potassium.date, new Date().toISOString().slice(0, 10)) <= 90) {
    const k = l.potassium.value;
    if (k >= 6.0) {
      out.push({ condition: null, confirmWithDoctor: true,
        headline: `Blood potassium of ${k} mmol/L`,
        detail: "6.0 or above can affect the heart rhythm. Please contact your doctor or kidney unit today; if you have palpitations, weakness or feel faint, seek urgent care." });
    } else if (k >= 5.5) {
      out.push({ condition: null, confirmWithDoctor: true,
        headline: `Blood potassium of ${k} mmol/L`,
        detail: "That's high. Let your doctor know — they will usually repeat it and review medicines that raise potassium." + (has("CKD") ? " Your meal plan now uses a strict potassium limit." : "") });
    } else if (k < 3.5) {
      out.push({ condition: null, confirmWithDoctor: true,
        headline: `Blood potassium of ${k} mmol/L`,
        detail: "That's low. Ask your doctor whether you need a supplement — don't start one on your own." + (has("CKD") ? " Your meal plan will not restrict potassium while it is low." : "") });
    }
  }

  if (l.phosphate && daysApart(l.phosphate.date, new Date().toISOString().slice(0, 10)) <= 90) {
    const p = l.phosphate.value;
    if (p > 4.5) {
      out.push({ condition: null, confirmWithDoctor: true,
        headline: `Blood phosphate of ${p} mg/dL`,
        detail: "That's high. Let your doctor or kidney team know." + (has("CKD") ? " Your meal plan now limits phosphorus to 800 mg — cutting packaged foods with phosphate additives matters most." : "") });
    } else if (p < 2.5) {
      out.push({ condition: null, confirmWithDoctor: true,
        headline: `Blood phosphate of ${p} mg/dL`,
        detail: "That's low. Ask your doctor whether you need more phosphorus in your diet or a supplement." });
    }
  }

  if (d.tg_hdl_ratio !== null && d.tg_hdl_ratio > 3.5) {
    out.push({ condition: null, confirmWithDoctor: false,
      headline: `Triglyceride-to-HDL ratio of ${d.tg_hdl_ratio}`,
      detail: "A ratio above about 3.5 often goes with insulin resistance. It's worth raising with your doctor alongside your blood sugar." });
  }

  return out;
}

/**
 * When each test is due again.
 *
 * Intervals follow the guidelines for how often to MONITOR, not a guess:
 *  - HbA1c (ADA Standards of Care): every 3 months when not at goal or after
 *    a change in treatment, every 6 months when at goal; yearly in the
 *    prediabetes range.
 *  - Lipids (ACC/AHA; ADA): recheck 4-12 weeks after a change, then yearly.
 *    A raised result is assumed to have prompted a change, so 12 weeks.
 *  - Phosphate / potassium in CKD (KDIGO 2017 CKD-MBD): every 6-12 months in
 *    stage 3, 3-6 months in stage 4, 1-3 months in stage 5 and on dialysis —
 *    the short end of each range is used. An out-of-range result is usually
 *    repeated within weeks.
 *
 * It also matters for the plan itself: a blood potassium or phosphate result
 * stops steering the meal plan after 90 days, so a stale result silently
 * hands the limit back to the stage default unless someone says so.
 *
 * Markers with a normal result and no condition that calls for monitoring
 * get no reminder — nagging healthy people to retest is noise.
 */
export interface RetestReminder {
  marker: LabMarker;
  label: string;
  last_date: string;
  due_date: string;
  /** negative = days until due, positive = days overdue */
  days_overdue: number;
  reason: string;
}

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function retestReminders(
  results: LabResult[],
  ctx: { conditions?: string[]; kidney_stage?: string; today?: string } = {},
): RetestReminder[] {
  const conditions = ctx.conditions || [];
  const today = ctx.today || new Date().toISOString().slice(0, 10);
  const has = (c: string) => conditions.includes(c);
  const ckd = has("CKD");
  const stage = ctx.kidney_stage || "";
  const dialysis = stage === "hemodialysis" || stage === "peritoneal";
  const renalInterval = dialysis ? 30 : stage === "early" ? 180 : 90;
  const renalWhy = dialysis ? "on dialysis these are usually checked monthly"
    : stage === "early" ? "with stage 1-3 kidney disease, every 6-12 months"
    : "with kidney disease at this stage, every 3 months";
  const lipidCondition = has("HYPERLIPIDEMIA") || has("HEART_DISEASE") || has("HYPERTRIGLYCERIDEMIA");

  const out: RetestReminder[] = [];
  const add = (r: LabResult, days: number, reason: string) => {
    const due = addDays(r.date, days);
    out.push({ marker: r.marker, label: LAB_MARKERS[r.marker].label, last_date: r.date, due_date: due,
      days_overdue: Math.round(daysApart(due, today) * (due <= today ? 1 : -1)), reason });
  };

  for (const r of Object.values(latestByMarker(results)) as LabResult[]) {
    const v = r.value;
    switch (r.marker) {
      case "a1c":
        if (has("T2D")) add(r, v >= 7 ? 90 : 182, v >= 7 ? "above the usual 7% goal — recheck every 3 months" : "at goal — recheck every 6 months");
        else if (v >= 5.7 || has("PREDIABETES")) add(r, v >= 6.5 ? 90 : 365, v >= 6.5 ? "in the diabetes range — your doctor will want to confirm it" : "in the prediabetes range — recheck yearly");
        break;
      case "fasting_glucose":
        if (v >= 126) add(r, 90, "in the diabetes range — your doctor will want to confirm it");
        else if (v >= 100 || has("PREDIABETES")) add(r, 365, "in the prediabetes range — recheck yearly");
        break;
      case "tg": case "ldl": case "hdl": case "total_chol": {
        const spec = LAB_MARKERS[r.marker];
        const outOfRange = r.marker === "hdl" ? v < 40 : v > spec.band.max;
        if (outOfRange) add(r, 84, "out of range — recheck 4-12 weeks after changing diet or treatment");
        else if (lipidCondition) add(r, 365, "on target — recheck yearly");
        break;
      }
      case "potassium": case "phosphate": {
        const spec = LAB_MARKERS[r.marker];
        const outOfRange = v < spec.band.min || v > spec.band.max;
        if (outOfRange) add(r, ckd ? 14 : 30, "out of the normal range — usually repeated within weeks");
        else if (ckd) add(r, renalInterval, renalWhy);
        break;
      }
      case "alt":
        if (v > LAB_MARKERS.alt.band.max) add(r, 180, "raised — ask your doctor when to recheck");
        break;
    }
  }
  return out.sort((a, b) => b.days_overdue - a.days_overdue);
}
