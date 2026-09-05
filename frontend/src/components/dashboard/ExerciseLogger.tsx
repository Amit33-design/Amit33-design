"use client";
import { useEffect, useState } from "react";
import {
  logLiftSet, removeLastLiftSet, getSetsFor, getExerciseHistory,
  LiftSet, ExerciseHistory,
} from "@/lib/local-store";
import { estimate1RM, progressionAdvice, loadForReps } from "@/lib/training-science";
import { cn } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

const ACTION_STYLE = {
  add_load: "border-emerald-200 bg-emerald-50/70",
  add_reps: "border-sky-200 bg-sky-50/70",
  hold: "border-gray-200 bg-gray-50",
  deload: "border-amber-200 bg-amber-50/70",
} as const;

const ACTION_ICON = {
  add_load: "⬆️", add_reps: "➕", hold: "⏸️", deload: "🔄",
} as const;

interface Props {
  exercise: string;
  targetSets?: number;
  targetReps?: number;
  level: string;
}

export function ExerciseLogger({ exercise, targetSets, targetReps, level }: Props) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [todaySets, setTodaySets] = useState<LiftSet[]>([]);
  const [history, setHistory] = useState<ExerciseHistory | null>(null);

  const refresh = () => {
    setTodaySets(getSetsFor(exercise, today()));
    setHistory(getExerciseHistory(exercise));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [exercise]);

  // prefill from the last session so logging is one tap when nothing changed
  useEffect(() => {
    if (open && !weight && history?.last) {
      setWeight(String(history.last.weight_kg));
      setReps(String(targetReps ?? history.last.reps));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [open, history]);

  const addSet = () => {
    const w = Number(weight);
    const r = Number(reps);
    if (!w || !r || r < 1) return;
    logLiftSet({ date: today(), exercise, weight_kg: w, reps: r });
    refresh();
  };

  const undo = () => { removeLastLiftSet(exercise, today()); refresh(); };

  const last = history?.last;
  const repRange: [number, number] = targetReps
    ? [Math.max(1, targetReps - 2), targetReps + 2]
    : [8, 12];

  const advice = last
    ? progressionAdvice({
        weeksAtSameLoad: history!.weeks_at_same_load,
        lastReps: last.reps,
        targetRepRange: repRange,
        level,
      })
    : null;

  const oneRM = last ? estimate1RM(last.weight_kg, last.reps) : null;
  const suggested = oneRM?.value ? loadForReps(oneRM.value, targetReps ?? 10) : null;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px] inline-flex items-center py-2",
          todaySets.length ? "text-emerald-700 hover:text-emerald-700" : "text-violet-600 hover:text-violet-700"
        )}
      >
        {todaySets.length ? `✓ ${todaySets.length} set${todaySets.length > 1 ? "s" : ""} logged` : "🏋️ Log weight & reps"}
        {last && !open && (
          <span className="text-gray-500 font-normal">· last {last.weight_kg}kg × {last.reps}</span>
        )}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3 animate-fade-in space-y-3">
          {/* today's sets */}
          {todaySets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {todaySets.map((s, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-bold text-emerald-700">
                  {s.weight_kg}kg × {s.reps}
                </span>
              ))}
              <button onClick={undo} className="text-xs text-gray-500 hover:text-red-500 font-semibold px-1">
                undo
              </button>
            </div>
          )}

          {/* entry */}
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Weight (kg)</span>
              <input
                type="number" inputMode="decimal" step="0.5" min="0" value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={suggested ? String(suggested) : "20"}
                className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
              />
            </label>
            <label className="flex-1">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Reps</span>
              <input
                type="number" inputMode="numeric" min="1" value={reps}
                onChange={(e) => setReps(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSet()}
                placeholder={String(targetReps ?? 10)}
                className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
              />
            </label>
            <button
              onClick={addSet}
              disabled={!weight || !reps}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-bold transition-all shrink-0",
                weight && reps
                  ? "bg-gradient-to-r from-sky-700 to-violet-700 text-white hover:opacity-90"
                  : "bg-gray-100 text-gray-500 cursor-not-allowed"
              )}
            >
              Add set
            </button>
          </div>
          {targetSets && (
            <div className="text-[11px] text-gray-500">
              Target this session: {targetSets} × {targetReps} reps
              {todaySets.length >= targetSets && <span className="text-emerald-700 font-semibold"> · all sets done ✓</span>}
            </div>
          )}

          {/* estimated max */}
          {oneRM && (
            <div className="text-[11px] text-gray-600 bg-white rounded-lg border border-gray-100 px-2.5 py-2">
              {oneRM.value !== null ? (
                <>
                  <span className="font-bold text-gray-800">Estimated 1-rep max: {oneRM.value} kg</span>
                  <span className="text-gray-500"> · {oneRM.formula} formula, from {last!.weight_kg}kg × {last!.reps}</span>
                </>
              ) : (
                <span className="text-gray-500">{oneRM.note}</span>
              )}
            </div>
          )}

          {/* progression prescription */}
          {advice && (
            <div className={cn("rounded-lg border p-2.5", ACTION_STYLE[advice.action])}>
              <div className="text-xs font-bold text-gray-900 mb-0.5">
                {ACTION_ICON[advice.action]} {advice.headline}
              </div>
              <div className="text-[11px] text-gray-700 leading-relaxed">{advice.detail}</div>
            </div>
          )}

          {/* recent sessions */}
          {history && history.sessions.length > 1 && (
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Recent sessions</div>
              <div className="flex flex-wrap gap-1.5">
                {history.sessions.slice(0, 6).map((s) => (
                  <span key={s.date} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px] text-gray-600">
                    <span className="font-semibold text-gray-800">{s.best_weight}kg×{s.best_reps}</span>
                    <span className="text-gray-500"> {s.date.slice(5)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
