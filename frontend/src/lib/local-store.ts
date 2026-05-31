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
