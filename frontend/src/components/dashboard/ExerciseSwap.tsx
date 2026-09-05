"use client";
import { useEffect, useState } from "react";
import {
  substituteExercise, EQUIPMENT_LABEL, Equipment, Limitation,
} from "@/lib/training-science";
import { getTrainingPrefs, setExerciseSwap } from "@/lib/local-store";
import { cn } from "@/lib/utils";

interface Props {
  exercise: string;
  /** called with the effective exercise name after a swap */
  onSwap?: (name: string) => void;
}

export function ExerciseSwap({ exercise, onSwap }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(exercise);
  const [equipment, setEquipment] = useState<Equipment[]>(["bodyweight"]);
  const [limitations, setLimitations] = useState<Limitation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = getTrainingPrefs();
    setEquipment(p.equipment as Equipment[]);
    setLimitations(p.limitations as Limitation[]);
    setCurrent(p.swaps[exercise] || exercise);
    setReady(true);
  }, [exercise]);

  if (!ready) return null;

  const { blocked, options } = substituteExercise(exercise, { equipment, limitations });
  const swapped = current !== exercise;

  const choose = (name: string | null) => {
    setExerciseSwap(exercise, name);
    const effective = name || exercise;
    setCurrent(effective);
    setOpen(false);
    onSwap?.(effective);
  };

  // Nothing to say: the prescribed movement is fine and nothing was swapped.
  if (!blocked && !swapped && options.length === 0) return null;

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-2">
        {blocked && !swapped && (
          <span className={cn(
            "text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
            blocked === "equipment" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
          )}>
            {blocked === "equipment" ? "needs kit you don't have" : "may aggravate your injury"}
          </span>
        )}
        {swapped && (
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
            swapped → {current}
          </span>
        )}
        {options.length > 0 && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 min-h-[44px] inline-flex items-center py-2"
          >
            ⇄ {open ? "Close" : swapped ? "Change swap" : "Swap exercise"}
          </button>
        )}
        {swapped && (
          <button onClick={() => choose(null)} className="text-xs text-gray-500 hover:text-gray-600 font-medium">
            undo
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-1.5 animate-fade-in">
          <div className="text-[11px] font-bold text-sky-800 mb-1">
            Alternatives that train the same muscles with your equipment:
          </div>
          {options.map((o) => (
            <button
              key={o.name}
              onClick={() => choose(o.name)}
              className={cn(
                "w-full text-left rounded-lg border px-3 py-2 transition-all",
                o.name === current
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-200 bg-white hover:border-sky-300"
              )}
            >
              <div className="text-sm font-semibold text-gray-900">{o.name}</div>
              <div className="text-[11px] text-gray-500">{o.reason}</div>
              {o.note && <div className="text-[11px] text-gray-500 mt-0.5">{o.note}</div>}
            </button>
          ))}
          <div className="text-[11px] text-gray-500 pt-1">
            Showing options for: {equipment.map((e) => EQUIPMENT_LABEL[e]).join(", ")}
            {limitations.length > 0 && ` · working around ${limitations.length} limitation${limitations.length > 1 ? "s" : ""}`}
          </div>
        </div>
      )}
    </div>
  );
}
