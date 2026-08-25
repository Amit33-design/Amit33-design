const PROGRESS_KEY = "health-copilot-progress";

export interface ProgressEntry {
  log_date: string;
  weight_kg?: number | null;
  calories_consumed?: number | null;
  steps_count?: number | null;
  sleep_hours?: number | null;
  mood_score?: number | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  blood_sugar_fasting?: number | null;
  blood_sugar_post_meal?: number | null;
  notes?: string | null;
}

function readLogs(): ProgressEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? (JSON.parse(stored) as ProgressEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: ProgressEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(logs));
}

export function saveProgressEntry(entry: ProgressEntry): void {
  const logs = readLogs();
  // Strip null/empty values before merging so we don't overwrite good data with nulls
  const clean = Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v !== null && v !== undefined && v !== "")
  ) as ProgressEntry;

  const idx = logs.findIndex((l) => l.log_date === entry.log_date);
  if (idx >= 0) {
    logs[idx] = { ...logs[idx], ...clean };
  } else {
    logs.push(clean);
    logs.sort((a, b) => a.log_date.localeCompare(b.log_date));
  }
  writeLogs(logs);
}

export function getLocalProgressHistory(days = 30): { logs: ProgressEntry[] } {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const logs = readLogs()
    .filter((l) => l.log_date >= cutoffStr)
    .sort((a, b) => b.log_date.localeCompare(a.log_date)); // newest first for table

  return { logs };
}

export function hasLocalProgress(): boolean {
  return readLogs().length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Medication tracking (daily check-off) + reminder settings — device-local
// ─────────────────────────────────────────────────────────────────────────────
const MED_LOG_KEY = "health-copilot-med-log"; // { [date]: string[] of med codes taken }
const MED_REMINDER_KEY = "health-copilot-med-reminders"; // MedReminderSettings
const MED_FIRED_KEY = "health-copilot-med-fired"; // dedupe for fired reminders

export interface MedReminderSettings {
  enabled: boolean;
  times: Record<string, string>; // med code -> "HH:MM"
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

/** Medication codes the user selected during onboarding. */
export function getUserMedications(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("health-copilot-onboarding");
    const meds = stored ? JSON.parse(stored)?.state?.medications : [];
    return Array.isArray(meds) ? meds.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function getMedsTaken(date: string): string[] {
  return readJson<Record<string, string[]>>(MED_LOG_KEY, {})[date] || [];
}

export function toggleMedTaken(date: string, med: string): string[] {
  const log = readJson<Record<string, string[]>>(MED_LOG_KEY, {});
  const day = new Set(log[date] || []);
  if (day.has(med)) day.delete(med); else day.add(med);
  log[date] = [...day];
  writeJson(MED_LOG_KEY, log);
  return log[date];
}

/** Last N days of medication adherence, oldest first. */
export function getMedAdherence(days = 7): { date: string; taken: string[] }[] {
  const log = readJson<Record<string, string[]>>(MED_LOG_KEY, {});
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, taken: log[date] || [] };
  });
}

export function getMedReminderSettings(): MedReminderSettings {
  return readJson<MedReminderSettings>(MED_REMINDER_KEY, { enabled: false, times: {} });
}

export function saveMedReminderSettings(settings: MedReminderSettings): void {
  writeJson(MED_REMINDER_KEY, settings);
}

/** Returns true the first time a given date+time+med reminder fires (then dedupes). */
export function markReminderFired(date: string, time: string, med: string): boolean {
  const fired = readJson<Record<string, boolean>>(MED_FIRED_KEY, {});
  const key = `${date}|${time}|${med}`;
  if (fired[key]) return false;
  // keep the map small: only retain today's entries
  const todayPrefix = `${date}|`;
  const next: Record<string, boolean> = {};
  for (const k of Object.keys(fired)) if (k.startsWith(todayPrefix)) next[k] = true;
  next[key] = true;
  writeJson(MED_FIRED_KEY, next);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Strength logging — weight and reps per exercise, device-local
//
// This is what turns a workout list into progressive overload: without a record
// of what you lifted last time, an app can only ever repeat the same session.
// ─────────────────────────────────────────────────────────────────────────────
const LIFT_LOG_KEY = "health-copilot-lift-log";

export interface LiftSet {
  /** ISO date the set was performed */
  date: string;
  exercise: string;
  weight_kg: number;
  reps: number;
}

export interface ExerciseHistory {
  exercise: string;
  sessions: { date: string; best_weight: number; best_reps: number; sets: number }[];
  /** heaviest set most recently performed */
  last?: { date: string; weight_kg: number; reps: number };
  /** consecutive sessions at the same top weight — drives the deload trigger */
  weeks_at_same_load: number;
}

function readLifts(): LiftSet[] {
  return readJson<LiftSet[]>(LIFT_LOG_KEY, []);
}

export function logLiftSet(entry: LiftSet): void {
  const all = readLifts();
  all.push(entry);
  // keep the store bounded — a year of training is plenty of history
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  writeJson(LIFT_LOG_KEY, all.filter((s) => s.date >= cutoffStr));
}

export function removeLastLiftSet(exercise: string, date: string): void {
  const all = readLifts();
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].exercise === exercise && all[i].date === date) {
      all.splice(i, 1);
      break;
    }
  }
  writeJson(LIFT_LOG_KEY, all);
}

export function getSetsFor(exercise: string, date: string): LiftSet[] {
  return readLifts().filter((s) => s.exercise === exercise && s.date === date);
}

/** Per-session bests for one exercise, newest first. */
export function getExerciseHistory(exercise: string): ExerciseHistory {
  const sets = readLifts().filter((s) => s.exercise === exercise);
  const byDate = new Map<string, LiftSet[]>();
  for (const s of sets) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  const sessions = [...byDate.entries()]
    .map(([date, rows]) => {
      // "best" set is the heaviest; ties broken by reps
      const best = rows.reduce((a, b) =>
        b.weight_kg > a.weight_kg || (b.weight_kg === a.weight_kg && b.reps > a.reps) ? b : a
      );
      return { date, best_weight: best.weight_kg, best_reps: best.reps, sets: rows.length };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  let weeksAtSameLoad = 0;
  if (sessions.length) {
    const topWeight = sessions[0].best_weight;
    for (const s of sessions) {
      if (s.best_weight === topWeight) weeksAtSameLoad += 1;
      else break;
    }
  }

  const last = sessions.length
    ? { date: sessions[0].date, weight_kg: sessions[0].best_weight, reps: sessions[0].best_reps }
    : undefined;

  return { exercise, sessions, last, weeks_at_same_load: weeksAtSameLoad };
}

/** Every exercise the user has ever logged, most recently trained first. */
export function loggedExercises(): string[] {
  const seen = new Map<string, string>();
  for (const s of readLifts()) {
    const prev = seen.get(s.exercise);
    if (!prev || s.date > prev) seen.set(s.exercise, s.date);
  }
  return [...seen.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([e]) => e);
}

export function hasLiftLog(): boolean {
  return readLifts().length > 0;
}
