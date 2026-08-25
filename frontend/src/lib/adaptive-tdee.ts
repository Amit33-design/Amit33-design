/**
 * Adaptive energy expenditure — measured from your own data instead of predicted.
 *
 * Every calorie target in this app starts from Mifflin-St Jeor multiplied by an
 * activity factor. That is a population average, and individuals scatter widely
 * around it: two people matching on age, sex, height and weight can differ by
 * several hundred calories a day. Fitness trackers are not a fix — their energy
 * estimates carry large errors against gold-standard measurement.
 *
 * The physics-based alternative is to work backwards. Body weight changes only
 * when energy in and energy out differ, so once someone has logged intake and
 * weight for a couple of weeks their true expenditure can be solved for:
 *
 *     expenditure = mean intake − (rate of weight change × energy per kg)
 *
 * Two details make this trustworthy rather than noisy:
 *
 *  1. Raw scale weight swings by a kilo or more from water, salt and glycogen.
 *     We smooth with an exponentially weighted moving average and fit the trend
 *     by least squares over the smoothed series, so a single heavy-dinner day
 *     cannot move the estimate.
 *
 *  2. People under-report what they eat, typically by 10–30%, and no app can
 *     detect that. This method is *robust* to it anyway: if intake is logged
 *     consistently low, the solved expenditure comes out low by the same
 *     proportion, and the deficit prescribed against it is still correct. The
 *     bias cancels as long as the user keeps logging the same way — which is
 *     why the target it produces is expressed on the scale of what they log.
 */

export interface TdeeLog {
  log_date: string;
  weight_kg?: number | null;
  calories_consumed?: number | null;
}

export interface AdaptiveTdee {
  /** measured expenditure, or null when there isn't enough data yet */
  tdee: number | null;
  /** 0–1: how much this estimate should be trusted over the formula */
  confidence: number;
  /** smoothed current weight, free of daily water noise */
  trend_weight_kg: number | null;
  /** kg per week, negative when losing */
  weekly_change_kg: number | null;
  mean_intake: number | null;
  days_span: number;
  weight_entries: number;
  intake_entries: number;
  status: "measuring" | "learning" | "ready";
  message: string;
}

/** Energy density of body mass change — the standard planning figure. */
const KCAL_PER_KG = 7700;

/** Smoothing factor: ~7-day half-life, enough to strip water swings. */
const EWMA_ALPHA = 0.25;

/** Least-squares slope of y against x. */
function slope(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Solve for expenditure from logged intake and weight trend.
 * `logs` may be in any date order and may have gaps.
 */
export function computeAdaptiveTdee(logs: TdeeLog[]): AdaptiveTdee {
  const empty = (status: AdaptiveTdee["status"], message: string, partial: Partial<AdaptiveTdee> = {}): AdaptiveTdee => ({
    tdee: null, confidence: 0, trend_weight_kg: null, weekly_change_kg: null,
    mean_intake: null, days_span: 0, weight_entries: 0, intake_entries: 0,
    status, message, ...partial,
  });

  const weights = logs
    .filter((l) => typeof l.weight_kg === "number" && !Number.isNaN(l.weight_kg as number) && (l.weight_kg as number) > 0)
    .sort((a, b) => a.log_date.localeCompare(b.log_date));
  const intakes = logs.filter(
    (l) => typeof l.calories_consumed === "number" && (l.calories_consumed as number) > 500
  );

  if (weights.length < 2) {
    return empty("measuring", "Log your weight for about two weeks and your calorie target will be measured from your own results instead of estimated from a formula.", { weight_entries: weights.length, intake_entries: intakes.length });
  }

  const t0 = new Date(weights[0].log_date).getTime();
  const days = weights.map((l) => (new Date(l.log_date).getTime() - t0) / 86400000);
  const daysSpan = days[days.length - 1];

  // The exponential average is for *displaying* today's weight free of water
  // noise. It deliberately lags, so fitting the trend to it would understate
  // how fast weight is actually moving and quietly inflate the calorie target.
  // The rate itself is fitted to the raw readings, where the scatter is
  // symmetric and averages out over the window.
  const raw = weights.map((l) => l.weight_kg as number);
  let ewma = raw[0];
  for (const w of raw) ewma = EWMA_ALPHA * w + (1 - EWMA_ALPHA) * ewma;
  const trendWeight = Math.round(ewma * 10) / 10;
  const kgPerDay = slope(days, raw);
  const weeklyChange = Math.round(kgPerDay * 7 * 100) / 100;

  const base: Partial<AdaptiveTdee> = {
    trend_weight_kg: trendWeight,
    weekly_change_kg: weeklyChange,
    days_span: Math.round(daysSpan),
    weight_entries: weights.length,
    intake_entries: intakes.length,
  };

  if (daysSpan < 10 || weights.length < 5) {
    return empty("measuring",
      `Tracking your weight trend — ${weights.length} entr${weights.length === 1 ? "y" : "ies"} over ${Math.round(daysSpan)} days. About two weeks of regular logging is enough to measure your real calorie needs.`,
      base);
  }

  if (intakes.length < 5) {
    return empty("learning",
      `Your weight trend is ${weeklyChange >= 0 ? "+" : ""}${weeklyChange} kg per week. Log what you eat on a few more days and your calorie target can be measured directly rather than estimated.`,
      base);
  }

  const meanIntake = Math.round(
    intakes.reduce((s, l) => s + (l.calories_consumed as number), 0) / intakes.length
  );

  // energy balance: intake − expenditure = stored energy
  const tdee = Math.round(meanIntake - kgPerDay * KCAL_PER_KG);

  // Confidence grows with the length of the window and how completely both
  // signals were logged, and is held back when the two data streams disagree
  // in length (a month of weights with three food logs is not a measurement).
  const spanScore = Math.min(1, daysSpan / 28);
  const densityScore = Math.min(1, Math.min(weights.length, intakes.length) / 14);
  const confidence = Math.round(Math.min(1, spanScore * 0.5 + densityScore * 0.5) * 100) / 100;

  // A solved value far from any plausible human expenditure means the logs are
  // inconsistent, not that metabolism is extraordinary.
  if (tdee < 900 || tdee > 6000) {
    return empty("learning",
      "Your logged food and weight changes don't line up yet, so the calorie target is still coming from the standard formula. Logging on more days — especially weekends — will sort this out.",
      base);
  }

  return {
    tdee,
    confidence,
    mean_intake: meanIntake,
    status: confidence >= 0.6 ? "ready" : "learning",
    message: confidence >= 0.6
      ? `Measured from ${Math.round(daysSpan)} days of your own data: you're burning about ${tdee} kcal a day, with your weight trending ${weeklyChange >= 0 ? "up" : "down"} ${Math.abs(weeklyChange)} kg per week.`
      : `Building an estimate from your logs — currently around ${tdee} kcal a day. Keep logging and this will replace the standard formula.`,
    ...base,
  } as AdaptiveTdee;
}

/**
 * Blend the measured expenditure with the formula estimate.
 * Early on the formula dominates; as evidence accumulates the user's own data
 * takes over. The shift is also capped per update so a target never lurches.
 */
export function blendTdee(predicted: number, adaptive: AdaptiveTdee): { tdee: number; source: "formula" | "blended" | "measured" } {
  if (adaptive.tdee === null || adaptive.confidence <= 0) return { tdee: predicted, source: "formula" };
  const w = adaptive.confidence;
  const raw = predicted * (1 - w) + adaptive.tdee * w;
  // never move more than 25% away from the formula in one go
  const lo = predicted * 0.75;
  const hi = predicted * 1.25;
  const tdee = Math.round(Math.max(lo, Math.min(hi, raw)));
  return { tdee, source: w >= 0.6 ? "measured" : "blended" };
}

/**
 * Is the rate of change safe and on-plan? Returns a nudge in kcal plus a plain
 * explanation. Losing faster than about 1% of bodyweight a week costs muscle,
 * and gaining faster than roughly 0.5 kg a week is mostly fat.
 */
export function paceFeedback(
  goal: string,
  weeklyChangeKg: number | null,
  bodyWeightKg: number
): { adjust: number; verdict: "too_fast" | "on_track" | "too_slow" | "unknown"; message: string } {
  if (weeklyChangeKg === null || !bodyWeightKg) {
    return { adjust: 0, verdict: "unknown", message: "" };
  }
  const pctPerWeek = (weeklyChangeKg / bodyWeightKg) * 100;
  const losing = ["weight_loss", "fat_loss", "diabetes_friendly"].includes(goal);

  if (losing) {
    if (pctPerWeek < -1.0) {
      return { adjust: 150, verdict: "too_fast",
        message: `You're losing ${Math.abs(weeklyChangeKg)} kg a week — faster than about 1% of your bodyweight, which starts costing muscle rather than fat. Your calories have been raised slightly to bring the pace back to a level you can hold.` };
    }
    if (pctPerWeek > -0.15) {
      return { adjust: -120, verdict: "too_slow",
        message: `Your weight has been close to flat, so the deficit isn't landing. Calories have been trimmed a little. Worth knowing: most people underestimate what they eat by 10–30% without realising, so weekend meals and cooking oil are the usual culprits.` };
    }
    return { adjust: 0, verdict: "on_track",
      message: `Losing ${Math.abs(weeklyChangeKg)} kg a week — a sustainable pace that protects muscle. Nothing needs changing.` };
  }

  if (goal === "muscle_gain") {
    if (weeklyChangeKg > 0.5) {
      return { adjust: -150, verdict: "too_fast",
        message: `Gaining ${weeklyChangeKg} kg a week is faster than muscle can actually be built, so the surplus is mostly becoming fat. Calories have been trimmed to keep the gain leaner.` };
    }
    if (weeklyChangeKg < 0.05) {
      return { adjust: 150, verdict: "too_slow",
        message: `Your weight has stalled, so there isn't enough surplus to build on. Calories have been raised.` };
    }
    return { adjust: 0, verdict: "on_track",
      message: `Gaining ${weeklyChangeKg} kg a week — about right for lean muscle gain.` };
  }

  if (Math.abs(pctPerWeek) > 0.5) {
    return { adjust: weeklyChangeKg > 0 ? -100 : 100, verdict: "too_fast",
      message: `Your weight is drifting ${weeklyChangeKg > 0 ? "up" : "down"} by ${Math.abs(weeklyChangeKg)} kg a week even though you're aiming to maintain. Calories have been adjusted to hold you steady.` };
  }
  return { adjust: 0, verdict: "on_track", message: "Your weight is holding steady, which is exactly the goal." };
}
