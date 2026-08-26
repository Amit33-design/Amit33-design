"use client";
import { useState } from "react";
import { PHASE_LABEL, DietPhase } from "@/lib/diet-phase";
import { cn } from "@/lib/utils";

interface Assessment {
  phase: DietPhase;
  weeks_in_phase: number;
  adaptation_ratio: number | null;
  adaptation_detected: boolean;
  recommend: DietPhase | null;
  headline: string;
  detail: string;
  severity: "ok" | "suggest" | "urge";
}

interface Props {
  assessment: Assessment;
  onSetPhase: (phase: DietPhase) => void;
}

const PHASE_STYLE: Record<DietPhase, string> = {
  cut: "bg-orange-100 text-orange-700",
  maintenance: "bg-emerald-100 text-emerald-700",
  reverse: "bg-sky-100 text-sky-700",
  bulk: "bg-violet-100 text-violet-700",
};

const SEVERITY_STYLE = {
  ok: "border-gray-200 bg-gray-50",
  suggest: "border-sky-200 bg-sky-50/70",
  urge: "border-amber-200 bg-amber-50/70",
} as const;

const PHASES: DietPhase[] = ["cut", "maintenance", "reverse", "bulk"];

export function DietPhaseCard({ assessment, onSetPhase }: Props) {
  const [picking, setPicking] = useState(false);
  const { phase, weeks_in_phase, adaptation_ratio, adaptation_detected, recommend, headline, detail, severity } = assessment;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <span className="font-bold text-gray-900 text-sm">Where You Are In The Cycle</span>
        </div>
        <span className={cn("px-2.5 py-1 rounded-lg text-xs font-black", PHASE_STYLE[phase])}>
          {PHASE_LABEL[phase]} · week {weeks_in_phase + 1}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Dieting in a straight line until you hit a number is how most attempts end. Phases are planned, not a failure of will.
      </p>

      {adaptation_ratio !== null && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-gray-600">Burn vs predicted</span>
            <span className={cn("font-bold", adaptation_detected ? "text-amber-600" : "text-gray-700")}>
              {Math.round(adaptation_ratio * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", adaptation_detected ? "bg-amber-500" : "bg-emerald-500")}
              style={{ width: `${Math.max(5, Math.min(100, adaptation_ratio * 100))}%` }}
            />
          </div>
        </div>
      )}

      <div className={cn("rounded-xl border p-3", SEVERITY_STYLE[severity])}>
        <div className="text-sm font-bold text-gray-900 mb-1">
          {severity === "urge" ? "⚠️ " : severity === "suggest" ? "💡 " : "✅ "}{headline}
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">{detail}</p>
        {recommend && (
          <button
            onClick={() => onSetPhase(recommend)}
            className="mt-2.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:opacity-90 transition-all"
          >
            Switch to {PHASE_LABEL[recommend].toLowerCase()} →
          </button>
        )}
      </div>

      <div className="mt-3">
        <button onClick={() => setPicking((p) => !p)} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">
          {picking ? "Close" : "Change phase manually"}
        </button>
        {picking && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PHASES.map((p) => (
              <button
                key={p}
                onClick={() => { onSetPhase(p); setPicking(false); }}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  p === phase ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                )}
              >
                {PHASE_LABEL[p]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
