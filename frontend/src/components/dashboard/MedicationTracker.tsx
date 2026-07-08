"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MEDICATIONS, MED_DEFAULT_TIMES } from "@/lib/constants";
import {
  getUserMedications, getMedsTaken, toggleMedTaken, getMedAdherence,
  getMedReminderSettings, saveMedReminderSettings, MedReminderSettings,
} from "@/lib/local-store";
import { cn } from "@/lib/utils";

const todayStr = () => new Date().toISOString().slice(0, 10);

export function MedicationTracker() {
  const [meds, setMeds] = useState<string[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [adherence, setAdherence] = useState<{ date: string; taken: string[] }[]>([]);
  const [reminders, setReminders] = useState<MedReminderSettings>({ enabled: false, times: {} });
  const [permission, setPermission] = useState<string>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const userMeds = getUserMedications();
    setMeds(userMeds);
    setTaken(getMedsTaken(todayStr()));
    setAdherence(getMedAdherence(7));
    const stored = getMedReminderSettings();
    // seed missing times with clinically sensible defaults
    const times = { ...stored.times };
    for (const m of userMeds) if (!times[m]) times[m] = MED_DEFAULT_TIMES[m] || "08:00";
    setReminders({ ...stored, times });
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (meds.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
        <div className="font-bold text-gray-900 mb-1">💊 Medication Tracker</div>
        <p className="text-sm text-gray-500">
          You haven&apos;t added any medications to your profile. Add them in{" "}
          <Link href="/onboarding/conditions" className="text-sky-600 font-semibold hover:text-sky-700">
            your health profile
          </Link>{" "}
          to track daily doses and get reminders here.
        </p>
      </div>
    );
  }

  const medInfo = (code: string) => MEDICATIONS.find((m) => m.value === code);

  const handleToggle = (code: string) => {
    setTaken(toggleMedTaken(todayStr(), code));
    setAdherence(getMedAdherence(7));
  };

  const saveReminders = (next: MedReminderSettings) => {
    setReminders(next);
    saveMedReminderSettings(next);
  };

  const handleEnableReminders = async () => {
    if (reminders.enabled) {
      saveReminders({ ...reminders, enabled: false });
      return;
    }
    if (typeof Notification === "undefined") return;
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      saveReminders({ ...reminders, enabled: true });
      new Notification("💊 healthCopilot reminders on", {
        body: "You'll get a notification at each medication time while the app is open.",
      });
    }
  };

  const allDone = meds.every((m) => taken.includes(m));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-gray-900">💊 Medication Tracker</div>
          <div className="text-xs text-gray-400 mt-0.5">Check off each dose — saved on this device</div>
        </div>
        {allDone ? (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">✓ All taken today</span>
        ) : (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">
            {taken.length}/{meds.length} taken today
          </span>
        )}
      </div>

      {/* Today's checklist */}
      <div className="px-6 pb-4 space-y-2">
        {meds.map((code) => {
          const info = medInfo(code);
          const done = taken.includes(code);
          return (
            <button
              key={code}
              onClick={() => handleToggle(code)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                done ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200 hover:border-violet-300"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-md border flex items-center justify-center text-white text-xs shrink-0 transition-all",
                done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
              )}>
                {done && "✓"}
              </span>
              <span className="text-lg shrink-0">{info?.icon || "💊"}</span>
              <span className="flex-1 min-w-0">
                <span className={cn("block text-sm font-semibold", done ? "text-emerald-800" : "text-gray-900")}>
                  {info?.label || code}
                </span>
                <span className="block text-xs text-gray-400 truncate">{info?.note}</span>
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                ⏰ {reminders.times[code] || MED_DEFAULT_TIMES[code] || "08:00"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 7-day adherence */}
      <div className="px-6 pb-4">
        <div className="text-xs font-semibold text-gray-500 mb-2">Last 7 days</div>
        <div className="flex gap-2">
          {adherence.map((day) => {
            const ratio = meds.length ? day.taken.filter((t) => meds.includes(t)).length / meds.length : 0;
            const isToday = day.date === todayStr();
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    ratio >= 1 ? "bg-emerald-500 text-white"
                      : ratio > 0 ? "bg-amber-200 text-amber-800"
                      : "bg-gray-100 text-gray-400",
                    isToday && "ring-2 ring-violet-400"
                  )}
                  title={`${day.date}: ${Math.round(ratio * 100)}%`}
                >
                  {ratio >= 1 ? "✓" : ratio > 0 ? Math.round(ratio * 100) + "%" : "–"}
                </div>
                <span className="text-[10px] text-gray-400">
                  {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reminder settings */}
      <div className="px-6 py-4 bg-gradient-to-r from-violet-50/60 to-sky-50/60 border-t border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="text-sm font-bold text-gray-900">🔔 Reminder notifications</div>
            <div className="text-xs text-gray-500">
              Browser notification at each medication&apos;s time while healthCopilot is open.
            </div>
          </div>
          <button
            onClick={handleEnableReminders}
            className={cn(
              "relative w-12 h-6 rounded-full transition-all shrink-0",
              reminders.enabled ? "bg-emerald-500" : "bg-gray-300"
            )}
            aria-label="Toggle medication reminders"
          >
            <span className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
              reminders.enabled ? "left-6" : "left-0.5"
            )} />
          </button>
        </div>

        {permission === "denied" && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 mb-2">
            Notifications are blocked for this site. Enable them in your browser&apos;s site settings, then toggle reminders again.
          </div>
        )}

        {reminders.enabled && (
          <div className="grid sm:grid-cols-2 gap-2 mt-3">
            {meds.map((code) => {
              const info = medInfo(code);
              return (
                <label key={code} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                  <span className="text-xs font-semibold text-gray-700 flex-1 truncate">
                    {info?.icon} {info?.label || code}
                  </span>
                  <input
                    type="time"
                    value={reminders.times[code] || MED_DEFAULT_TIMES[code] || "08:00"}
                    onChange={(e) =>
                      saveReminders({ ...reminders, times: { ...reminders.times, [code]: e.target.value } })
                    }
                    className="text-xs font-mono text-gray-700 border border-gray-200 rounded-md px-1.5 py-1"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-gray-100">
        <div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
          ⚠️ Tracking is a memory aid, not medical advice. Take medications exactly as your doctor prescribed.
        </div>
      </div>
    </div>
  );
}
