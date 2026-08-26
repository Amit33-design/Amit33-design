/**
 * Diet phases — knowing when to stop cutting.
 *
 * Almost every tracker assumes you diet in a straight line until you hit a
 * number. Bodies don't work that way. Sustained restriction produces genuine
 * metabolic adaptation: expenditure drifts below what the equations predict,
 * hunger climbs, adherence frays, and the same deficit stops producing the
 * same result. Continuing to grind is the point at which most people quit
 * altogether.
 *
 * Because this app now *measures* expenditure from logged intake and weight
 * rather than predicting it, adaptation is something we can observe instead of
 * assume: when measured expenditure sits well below the formula estimate after
 * weeks of dieting, that is the signal.
 *
 * Honest framing on the two contested ideas here:
 *  - Diet breaks: a planned return to maintenance for a couple of weeks. The
 *    trial evidence suggests intermittent restriction preserves more expenditure
 *    than a continuous grind, though the literature is not large. The stronger
 *    argument is adherence — most people can sustain a plan with breaks in it.
 *  - Reverse dieting: raising calories gradually after a cut. There is no good
 *    evidence it "repairs metabolism". What it does do is return you to
 *    maintenance in a controlled way instead of overshooting, which is a
 *    perfectly good reason to do it — so that is how it is described.
 */

export type DietPhase = "cut" | "maintenance" | "reverse" | "bulk";

export const PHASE_LABEL: Record<DietPhase, string> = {
  cut: "Fat loss", maintenance: "Maintenance", reverse: "Easing back up", bulk: "Building",
};

export interface PhaseState {
  phase: DietPhase;
  /** ISO date the current phase began */
  started: string;
}

export interface PhaseAssessment {
  phase: DietPhase;
  weeks_in_phase: number;
  /** measured expenditure as a share of the formula estimate, when known */
  adaptation_ratio: number | null;
  /** true when expenditure has drifted meaningfully below prediction */
  adaptation_detected: boolean;
  recommend: DietPhase | null;
  headline: string;
  detail: string;
  severity: "ok" | "suggest" | "urge";
}

const WEEK = 7 * 86400000;

/** Weeks between an ISO date and today. */
function weeksSince(iso: string): number {
  const then = new Date(iso + "T00:00:00").getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / WEEK));
}

export function phaseForGoal(goal: string): DietPhase {
  if (goal === "muscle_gain") return "bulk";
  if (["weight_loss", "fat_loss", "diabetes_friendly"].includes(goal)) return "cut";
  return "maintenance";
}

/**
 * Decide whether the user should stay in their current phase or move on.
 *
 * `measuredTdee` and `formulaTdee` come from the adaptive engine; when there
 * isn't enough logged data yet the recommendation falls back to elapsed time
 * alone, which is weaker but still worth saying.
 */
export function assessPhase(opts: {
  state: PhaseState;
  goal: string;
  measuredTdee: number | null;
  formulaTdee: number;
  tdeeConfidence: number;
  weeklyChangeKg: number | null;
}): PhaseAssessment {
  const { state, measuredTdee, formulaTdee, tdeeConfidence, weeklyChangeKg } = opts;
  const phase = state.phase;
  const weeks = weeksSince(state.started);

  const ratio =
    measuredTdee !== null && formulaTdee > 0 && tdeeConfidence >= 0.5
      ? Math.round((measuredTdee / formulaTdee) * 100) / 100
      : null;
  // Below ~92% of predicted, after weeks of dieting, is the adaptation signal.
  const adapted = ratio !== null && ratio < 0.92 && phase === "cut" && weeks >= 6;

  const base = { phase, weeks_in_phase: weeks, adaptation_ratio: ratio, adaptation_detected: adapted };

  if (phase === "cut") {
    if (adapted) {
      return {
        ...base, recommend: "maintenance", severity: "urge",
        headline: `Your body has adapted — time for a break from dieting`,
        detail: `After ${weeks} weeks of cutting, you're burning about ${Math.round((1 - ratio!) * 100)}% less than your size and activity predict. That's normal and reversible, but it means the same deficit no longer buys the same loss. Eat at maintenance for two weeks — not a write-off, a deliberate part of the plan. Most people come back losing faster than they were, and far more likely to still be here in six months.`,
      };
    }
    if (weeks >= 12) {
      return {
        ...base, recommend: "maintenance", severity: "urge",
        headline: `${weeks} weeks is a long time to be dieting`,
        detail: `Long uninterrupted cuts wear down both metabolism and willpower, and quitting altogether usually starts here. Take two weeks at maintenance, then decide whether to resume. You will not undo your progress — a planned pause is how people finish what they started.`,
      };
    }
    if (weeks >= 8) {
      return {
        ...base, recommend: "maintenance", severity: "suggest",
        headline: `You've been cutting for ${weeks} weeks — a break is worth planning`,
        detail: `Nothing is wrong yet. But scheduling a two-week maintenance break somewhere in the next month tends to protect both your results and your patience, and is easier to follow than deciding on the day you finally snap.`,
      };
    }
    if (weeklyChangeKg !== null && weeklyChangeKg > -0.05 && weeks >= 4) {
      return {
        ...base, recommend: null, severity: "suggest",
        headline: "Weight has stalled",
        detail: `Your calorie target has already been trimmed to compensate. If the scale still hasn't moved in another fortnight, a two-week maintenance break usually restarts progress better than cutting further does — there is a floor below which eating less simply stops working.`,
      };
    }
    return {
      ...base, recommend: null, severity: "ok",
      headline: `Week ${weeks + 1} of fat loss — on track`,
      detail: "Progress looks steady. Keep going; we'll flag it when a break becomes worthwhile.",
    };
  }

  if (phase === "maintenance") {
    const cutting = ["weight_loss", "fat_loss", "diabetes_friendly"].includes(opts.goal);
    if (weeks >= 2 && cutting) {
      return {
        ...base, recommend: "cut", severity: "suggest",
        headline: "Break done — ready to resume fat loss",
        detail: "Two weeks at maintenance is enough to recover both appetite hormones and enthusiasm. Your expenditure is being re-measured from your logs, so the next deficit starts from where you actually are rather than where a formula guesses.",
      };
    }
    return {
      ...base, recommend: null, severity: "ok",
      headline: weeks < 2 ? `Maintenance break, week ${weeks + 1} of 2` : "Holding at maintenance",
      detail: weeks < 2
        ? "Eating at maintenance on purpose. This is part of the plan, not a lapse — the point is to come back to dieting with your metabolism and patience intact."
        : "Weight is being held steady, which is a real skill in itself and the thing that keeps results.",
    };
  }

  if (phase === "reverse") {
    if (weeks >= 4) {
      return {
        ...base, recommend: "maintenance", severity: "suggest",
        headline: "You're back at maintenance",
        detail: "Calories have been walked back up gradually and your weight has held. Settle here for a while before deciding on the next phase.",
      };
    }
    return {
      ...base, recommend: null, severity: "ok",
      headline: `Easing calories back up — week ${weeks + 1}`,
      detail: "Raising intake in steps rather than all at once. This isn't about repairing your metabolism — there's no good evidence food alone does that — it's about returning to maintenance without overshooting straight back into a surplus.",
    };
  }

  // bulk
  if (weeklyChangeKg !== null && weeklyChangeKg > 0.5) {
    return {
      ...base, recommend: null, severity: "suggest",
      headline: "Gaining faster than muscle can be built",
      detail: "Above roughly half a kilo a week, the extra is mostly fat, and it all has to come off later. Your calorie target has been trimmed to keep the gain leaner.",
    };
  }
  if (weeks >= 16) {
    return {
      ...base, recommend: "maintenance", severity: "suggest",
      headline: `${weeks} weeks of building — consider consolidating`,
      detail: "A long surplus accumulates more fat than muscle past a point. A spell at maintenance lets you keep what you've built before deciding whether to lean out or push on.",
    };
  }
  return {
    ...base, recommend: null, severity: "ok",
    headline: `Week ${weeks + 1} of building`,
    detail: "Gaining at a controlled rate. Keep the protein up and the training progressing.",
  };
}

/** Calorie adjustment implied by a phase, applied on top of the goal target. */
export function phaseCalorieShift(phase: DietPhase, goal: string): number {
  const goalPhase = phaseForGoal(goal);
  if (phase === goalPhase) return 0;
  // a maintenance break cancels the goal's deficit or surplus
  if (phase === "maintenance") return goalPhase === "cut" ? 400 : goalPhase === "bulk" ? -300 : 0;
  if (phase === "reverse") return goalPhase === "cut" ? 250 : 0;
  return 0;
}
