"use client";
import { useEffect, useState } from "react";
import {
  EQUIPMENT_LABEL, LIMITATION_LABEL, Equipment, Limitation,
} from "@/lib/training-science";
import { getTrainingPrefs, saveTrainingPrefs } from "@/lib/local-store";
import { cn } from "@/lib/utils";

const EQUIPMENT_ORDER: Equipment[] = [
  "bodyweight", "chair", "yoga_mat", "resistance_band",
  "dumbbells", "kettlebell", "barbell", "bench", "pull_up_bar",
];
const LIMITATION_ORDER: Limitation[] = ["knee", "shoulder", "lower_back", "wrist", "hip", "neck", "balance"];

export function TrainingSetup({ onChange }: { onChange?: () => void }) {
  const [open, setOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>(["bodyweight"]);
  const [limitations, setLimitations] = useState<Limitation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = getTrainingPrefs();
    setEquipment(p.equipment as Equipment[]);
    setLimitations(p.limitations as Limitation[]);
    setReady(true);
  }, []);

  if (!ready) return null;

  const persist = (eq: Equipment[], lim: Limitation[]) => {
    const prefs = getTrainingPrefs();
    saveTrainingPrefs({ ...prefs, equipment: eq.length ? eq : ["bodyweight"], limitations: lim });
    onChange?.();
  };

  const toggleEq = (e: Equipment) => {
    const next = equipment.includes(e) ? equipment.filter((x) => x !== e) : [...equipment, e];
    setEquipment(next);
    persist(next, limitations);
  };
  const toggleLim = (l: Limitation) => {
    const next = limitations.includes(l) ? limitations.filter((x) => x !== l) : [...limitations, l];
    setLimitations(next);
    persist(equipment, next);
  };

  const kitCount = equipment.filter((e) => e !== "bodyweight").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎒</span>
            <span className="font-bold text-gray-900 text-sm">Your Equipment &amp; Limitations</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {kitCount === 0 ? "No equipment" : `${kitCount} item${kitCount > 1 ? "s" : ""}`}
            {limitations.length > 0 && ` · working around ${limitations.map((l) => LIMITATION_LABEL[l].toLowerCase()).join(", ")}`}
            {" · tap to change"}
          </div>
        </div>
        <span className={cn("text-gray-400 transition-transform text-sm", open && "rotate-180")}>▼</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 animate-fade-in">
          <p className="text-xs text-gray-500 leading-relaxed">
            Exercises you can&apos;t do are exercises you won&apos;t do. Tell us what you have and what hurts, and every
            movement gets a one-tap alternative that trains the same muscles.
          </p>

          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">What do you have?</div>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_ORDER.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEq(e)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    equipment.includes(e)
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
                  )}
                >
                  {EQUIPMENT_LABEL[e]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
              Anything we should work around?
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIMITATION_ORDER.map((l) => (
                <button
                  key={l}
                  onClick={() => toggleLim(l)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    limitations.includes(l)
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"
                  )}
                >
                  {LIMITATION_LABEL[l]}
                </button>
              ))}
            </div>
            {limitations.length > 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 leading-relaxed">
                ⚠️ These swaps avoid movements that commonly aggravate those areas, but they aren&apos;t a diagnosis.
                Persistent pain is worth getting looked at properly.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
