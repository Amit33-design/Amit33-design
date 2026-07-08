"use client";
import { useEffect } from "react";
import { MEDICATIONS, MED_DEFAULT_TIMES } from "@/lib/constants";
import {
  getUserMedications, getMedsTaken, getMedReminderSettings, markReminderFired,
} from "@/lib/local-store";

/**
 * Invisible runner mounted in the dashboard layout. While the app is open it
 * checks twice a minute whether any medication reminder is due (time reached,
 * dose not checked off yet, not already notified) and fires a browser
 * notification. All state lives in localStorage — no backend needed.
 */
export function MedicationReminders() {
  useEffect(() => {
    const check = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const settings = getMedReminderSettings();
      if (!settings.enabled) return;
      const meds = getUserMedications();
      if (!meds.length) return;

      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const taken = getMedsTaken(date);

      for (const code of meds) {
        if (taken.includes(code)) continue;
        const time = settings.times[code] || MED_DEFAULT_TIMES[code] || "08:00";
        const [h, m] = time.split(":").map(Number);
        const dueMinutes = h * 60 + m;
        // fire once when due; still fire if the app was opened up to 3h late
        if (nowMinutes >= dueMinutes && nowMinutes <= dueMinutes + 180) {
          if (markReminderFired(date, time, code)) {
            const info = MEDICATIONS.find((x) => x.value === code);
            new Notification(`💊 Time for ${info?.label || code}`, {
              body: `${info?.note || "As prescribed by your doctor."}\nCheck it off on the Progress page once taken.`,
              tag: `med-${code}-${date}`,
            });
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
