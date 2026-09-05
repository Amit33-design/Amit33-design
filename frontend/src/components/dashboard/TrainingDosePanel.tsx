"use client";
import { cn } from "@/lib/utils";

interface VolumeRow {
  muscle: string;
  label: string;
  sets: number;
  min: number;
  max: number;
  status: "under" | "good" | "high";
}

interface Zone {
  name: string;
  bpmLow: number;
  bpmHigh: number;
  share: string;
  feel: string;
  purpose: string;
}

interface Props {
  volume: VolumeRow[];
  volumeNote?: string;
  zones?: Zone[];
  caution?: string;
  stepTarget?: number;
  stepRationale?: string;
}

export function TrainingDosePanel({ volume, volumeNote, zones, caution, stepTarget, stepRationale }: Props) {
  if (!volume?.length) return null;
  const inRange = volume.filter((v) => v.status === "good").length;

  return (
    <div className="space-y-4">
      {/* Weekly volume per muscle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-bold text-gray-900 text-sm">Weekly Training Dose</span>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-black",
            inRange >= 8 ? "bg-emerald-100 text-emerald-700" : inRange >= 5 ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"
          )}>
            {inRange}/{volume.length} in range
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Hard sets per muscle each week — the dose that actually drives strength and muscle. Compound lifts count half
          for the muscles they assist.
        </p>

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {volume.map((v) => {
            const pct = Math.max(3, Math.min(100, (v.sets / v.max) * 100));
            const bar = v.status === "under" ? "bg-orange-400" : v.status === "high" ? "bg-violet-400" : "bg-emerald-500";
            return (
              <div key={v.muscle}>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">{v.label}</span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    v.status === "under" ? "text-orange-700" : "text-gray-700"
                  )}>
                    {v.sets}<span className="text-gray-500 font-normal"> sets · target {v.min}–{v.max}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {volumeNote && (
          <p className="text-xs text-gray-600 leading-relaxed mt-4 bg-gray-50 rounded-xl p-3">{volumeNote}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Cardio intensity distribution */}
        {zones && zones.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">❤️</span>
              <span className="font-bold text-gray-900 text-sm">Cardio Intensity</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              How to split your cardio time — mostly easy, a little hard. There is no single magic zone.
            </p>
            <div className="space-y-2">
              {zones.map((z) => (
                <div key={z.name} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">{z.name}</span>
                    <span className="text-xs font-bold text-violet-600 tabular-nums">{z.bpmLow}–{z.bpmHigh} bpm</span>
                  </div>
                  <div className="text-[11px] font-semibold text-sky-700 mb-1">{z.share}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{z.feel}. {z.purpose}</div>
                </div>
              ))}
            </div>
            {caution && (
              <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                ⚠️ {caution}
              </div>
            )}
          </div>
        )}

        {/* Step target */}
        {stepTarget && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🚶</span>
              <span className="font-bold text-gray-900 text-sm">Daily Steps</span>
            </div>
            <div className="text-3xl font-black bg-gradient-to-r from-sky-700 to-violet-700 bg-clip-text text-transparent my-3">
              {stepTarget.toLocaleString()}
            </div>
            {stepRationale && <p className="text-xs text-gray-600 leading-relaxed">{stepRationale}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
