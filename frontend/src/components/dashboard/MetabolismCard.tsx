"use client";
import { cn } from "@/lib/utils";
import type { AdaptiveTdee } from "@/lib/adaptive-tdee";

interface Props {
  adaptive: AdaptiveTdee;
  formulaTdee?: number;
  paceMessage?: string;
  paceVerdict?: "too_fast" | "on_track" | "too_slow" | "unknown";
}

const VERDICT_STYLE = {
  too_fast: "border-amber-200 bg-amber-50/70 text-amber-900",
  too_slow: "border-sky-200 bg-sky-50/70 text-sky-900",
  on_track: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
  unknown: "border-gray-200 bg-gray-50 text-gray-700",
} as const;

export function MetabolismCard({ adaptive, formulaTdee, paceMessage, paceVerdict }: Props) {
  const { status, confidence, tdee, trend_weight_kg, weekly_change_kg, days_span, message } = adaptive;
  const pct = Math.round(confidence * 100);
  const measured = status === "ready" && tdee !== null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="font-bold text-gray-900 text-sm">Your Metabolism</span>
        </div>
        <span className={cn(
          "px-2.5 py-1 rounded-lg text-xs font-black",
          measured ? "bg-emerald-100 text-emerald-700"
            : status === "learning" ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-600"
        )}>
          {measured ? "Measured from your data" : status === "learning" ? "Learning" : "Collecting data"}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Standard formulas are population averages — real people vary by hundreds of calories a day. Once you log
        enough, your target comes from your own results instead.
      </p>

      {tdee !== null && (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
          <div>
            <div className="text-3xl font-black bg-gradient-to-r from-sky-700 to-violet-700 bg-clip-text text-transparent">
              {tdee.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 font-semibold">kcal burned per day</div>
          </div>
          {formulaTdee !== undefined && (
            <div>
              <div className="text-lg font-bold text-gray-500 line-through decoration-gray-300">
                {formulaTdee.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">formula estimate</div>
            </div>
          )}
          {trend_weight_kg !== null && (
            <div>
              <div className="text-lg font-bold text-gray-800">{trend_weight_kg} kg</div>
              <div className="text-xs text-gray-500">
                trend weight{weekly_change_kg !== null && ` · ${weekly_change_kg >= 0 ? "+" : ""}${weekly_change_kg} kg/wk`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* confidence */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-semibold text-gray-600">
            Confidence {days_span > 0 && <span className="text-gray-500 font-normal">· {days_span} days of logs</span>}
          </span>
          <span className="font-bold text-gray-700">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", measured ? "bg-emerald-500" : "bg-amber-400")}
            style={{ width: `${Math.max(3, pct)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">{message}</p>

      {paceMessage && paceVerdict && paceVerdict !== "unknown" && (
        <div className={cn("mt-3 rounded-xl border p-3 text-xs leading-relaxed", VERDICT_STYLE[paceVerdict])}>
          {paceVerdict === "on_track" ? "✅ " : "📈 "}{paceMessage}
        </div>
      )}

      {!measured && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
          💡 Log your weight and what you ate on the Progress page. Most people underestimate what they eat — that&apos;s
          fine here. As long as you log the same way each day, the maths still lands on the right target for you.
        </div>
      )}
    </div>
  );
}
