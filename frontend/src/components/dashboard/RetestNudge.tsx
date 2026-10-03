"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { retestReminders, type RetestReminder } from "@/lib/labs";
import { getLabResults } from "@/lib/local-store";
import { useOnboardingStore } from "@/store/onboarding-store";

/** A one-line nudge on the dashboard when a blood test is overdue. Renders nothing otherwise. */
export function RetestNudge() {
  const { conditions } = useOnboardingStore();
  const [overdue, setOverdue] = useState<RetestReminder[]>([]);
  useEffect(() => {
    const codes = conditions.map((c) => c.condition_code);
    const stage = conditions.find((c) => c.condition_code === "CKD")?.stage;
    setOverdue(retestReminders(getLabResults(), { conditions: codes, kidney_stage: stage }).filter((r) => r.days_overdue > 0));
  }, [conditions]);
  if (!overdue.length) return null;
  const names = overdue.map((r) => r.label);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return (
    <Link href="/dashboard/progress"
      className="flex items-center gap-3 p-4 rounded-2xl border border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 transition-colors">
      <span className="text-xl" aria-hidden="true">🗓️</span>
      <span className="text-sm">
        <strong>Time to recheck:</strong> {list} {overdue.length > 1 ? "are" : "is"} overdue. Add the new results under Progress → Lab results.
      </span>
    </Link>
  );
}
