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
