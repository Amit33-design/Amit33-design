"use client";
import { useEffect, useId, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, CartesianGrid } from "recharts";
import { LAB_MARKERS, toCanonical, latestByMarker, deriveLabs, suggestFromLabs, type LabMarker, type LabResult } from "@/lib/labs";
import { getLabResults, addLabResult, deleteLabResult } from "@/lib/local-store";
import { useOnboardingStore } from "@/store/onboarding-store";
import { CONDITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MARKER_ORDER: LabMarker[] = ["tg", "ldl", "hdl", "total_chol", "a1c", "fasting_glucose", "alt"];
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Optional blood-test results. Suggests conditions the numbers point to but
 * never applies one — the user presses "Add" or nothing changes.
 * `compact` drops the trend charts, for use inside onboarding.
 */
export function LabResults({ compact = false }: { compact?: boolean }) {
  const { conditions, setConditions } = useOnboardingStore();
  const [results, setResults] = useState<LabResult[]>([]);
  const [marker, setMarker] = useState<LabMarker>("tg");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<string>(LAB_MARKERS.tg.unit);
  const [date, setDate] = useState(today());
  const [fasting, setFasting] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  // explicit label/control pairing: wrapping a <select> in its <label> gave it
  // an accessible name built from its option text
  const uid = useId();

  useEffect(() => { setResults(getLabResults()); }, []);

  const spec = LAB_MARKERS[marker];
  const unitOptions = [spec.unit, ...(spec.altUnits?.map((u) => u.label) ?? [])];
  const conditionCodes = conditions.map((c) => c.condition_code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const suggestions = useMemo(() => suggestFromLabs(results, conditionCodes), [results, conditions]);
  const latest = useMemo(() => latestByMarker(results), [results]);
  const derived = useMemo(() => deriveLabs(results), [results]);

  const chooseMarker = (m: LabMarker) => {
    setMarker(m);
    setUnit(LAB_MARKERS[m].unit);
    setFasting(null);
    setError(null);
  };

  const save = () => {
    const canonical = toCanonical(marker, Number(value), unit === spec.unit ? undefined : unit);
    if (canonical === null) {
      setError(`That doesn't look like a ${spec.label.toLowerCase()} result in ${unit}. Check the number and the unit your report uses.`);
      return;
    }
    setResults(addLabResult({ marker, value: canonical, date, fasting: spec.fastingMatters ? fasting : null }));
    setValue("");
    setError(null);
  };

  const addCondition = (code: string) => {
    if (conditionCodes.includes(code)) return;
    setConditions([...conditions, { condition_code: code }]);
    setAdded(CONDITIONS.find((c) => c.code === code)?.label ?? code);
  };

  return (
    <div className={cn(!compact && "bg-white rounded-2xl border border-gray-100 shadow-card p-6")}>
      {!compact && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl" aria-hidden="true">🧪</span>
          <h2 className="font-bold text-gray-900">Blood test results</h2>
          <span className="ml-auto text-xs text-gray-600">Optional · saved on this device</span>
        </div>
      )}
      <p className="text-sm text-gray-600 mb-4">
        Add numbers from a recent report and we&apos;ll point out anything worth adding to your profile. You decide — nothing changes unless you tap &ldquo;Add&rdquo;.
      </p>

      {/* Entry */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${uid}-test`} className="text-xs font-semibold text-gray-700">Test</label>
          <select id={`${uid}-test`} value={marker} onChange={(e) => chooseMarker(e.target.value as LabMarker)}
            className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white">
            {MARKER_ORDER.map((m) => <option key={m} value={m}>{LAB_MARKERS[m].label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-value`} className="text-xs font-semibold text-gray-700">Result</label>
          <input id={`${uid}-value`} type="number" inputMode="decimal" step="any" value={value} onChange={(e) => setValue(e.target.value)}
            className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-gray-900" />
        </div>
        <div>
          <label htmlFor={`${uid}-unit`} className="text-xs font-semibold text-gray-700">Unit</label>
          <select id={`${uid}-unit`} value={unit} onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white">
            {unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-date`} className="text-xs font-semibold text-gray-700">Date of test</label>
          <input id={`${uid}-date`} type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-gray-900" />
        </div>
      </div>

      {spec.fastingMatters && (
        <fieldset className="mt-3">
          <legend className="text-xs font-semibold text-gray-700 mb-1">Were you fasting (8-12 hours without food)?</legend>
          <div className="flex gap-2">
            {([["Yes", true], ["No", false], ["Not sure", null]] as const).map(([label, v]) => (
              <button key={label} type="button" aria-pressed={fasting === v} onClick={() => setFasting(v)}
                className={cn("min-h-[40px] px-4 rounded-xl border-2 text-sm font-semibold",
                  fasting === v ? "border-sky-600 bg-sky-50 text-sky-800" : "border-gray-200 text-gray-600")}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={save} disabled={!value}
          className="min-h-[44px] px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-700 to-violet-700 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-600">
          Save result
        </button>
        <span className="text-xs text-gray-600">{spec.note}</span>
      </div>

      <div aria-live="polite">
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {added && <p className="mt-2 text-sm text-emerald-800">Added {added} — your plan now accounts for it.</p>}
      </div>

      {/* Suggestions — never applied without the user */}
      {suggestions.length > 0 && (
        <div className="mt-5 space-y-2" aria-live="polite">
          <div className="text-sm font-bold text-gray-900">What your results suggest</div>
          {suggestions.map((s) => (
            <div key={s.headline} className={cn("p-3 rounded-xl border", s.confirmWithDoctor ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
              <div className="text-sm font-semibold text-gray-900">{s.headline}</div>
              <p className="text-sm text-gray-700 mt-0.5">{s.detail}</p>
              {s.condition && (
                <button type="button" onClick={() => addCondition(s.condition!)}
                  className="mt-2 min-h-[40px] px-4 rounded-xl text-sm font-semibold border-2 border-sky-600 text-sky-800 bg-white">
                  Add {CONDITIONS.find((c) => c.code === s.condition)?.label} to my profile
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Latest values + derived */}
      {!compact && results.length > 0 && (
        <div className="mt-5">
          <div className="text-sm font-bold text-gray-900 mb-2">Latest results</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {MARKER_ORDER.filter((m) => latest[m]).map((m) => {
              const r = latest[m]!;
              const s = LAB_MARKERS[m];
              const good = m === "hdl" ? r.value >= s.band.min : r.value <= s.band.max;
              return (
                <div key={m} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{s.label}</div>
                    <div className="text-xs text-gray-600">{r.date}{r.fasting === false ? " · not fasting" : r.fasting === true ? " · fasting" : ""}</div>
                  </div>
                  <div className={cn("text-sm font-bold", good ? "text-emerald-800" : "text-amber-800")}>{r.value} {s.unit}</div>
                </div>
              );
            })}
          </div>
          {(derived.non_hdl !== null || derived.tg_hdl_ratio !== null) && (
            <div className="mt-2 text-sm text-gray-700">
              {derived.non_hdl !== null && <span className="mr-4">Non-HDL cholesterol: <strong>{derived.non_hdl} mg/dL</strong> <span className="text-gray-600">(under 130 is good)</span></span>}
              {derived.tg_hdl_ratio !== null && <span>Triglyceride/HDL ratio: <strong>{derived.tg_hdl_ratio}</strong> <span className="text-gray-600">(under 3.5 is good)</span></span>}
            </div>
          )}
        </div>
      )}

      {/* Trends — one small chart per marker with two or more results */}
      {!compact && (
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          {MARKER_ORDER.map((m) => {
            const series = results.filter((r) => r.marker === m).sort((a, b) => a.date.localeCompare(b.date));
            if (series.length < 2) return null;
            const s = LAB_MARKERS[m];
            // The healthy edge must be on the chart. Auto-scaling hid it exactly
            // when it mattered: every reading above 150 put the "under 150" band
            // off the bottom of the axis. HDL is the one where higher is better.
            const higherBetter = m === "hdl";
            const edge = higherBetter ? s.band.min : s.band.max;
            const vals = series.map((r) => r.value);
            const lo = Math.floor(Math.min(...vals, edge) * 0.9);
            const hi = Math.ceil(Math.max(...vals, edge) * 1.08);
            return (
              <div key={m} className="p-3 rounded-xl border border-gray-100">
                <div className="text-sm font-semibold text-gray-800 mb-1">{s.label} <span className="text-xs text-gray-600">({s.unit})</span></div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <ReferenceArea y1={s.band.min} y2={s.band.max} fill="#10b981" fillOpacity={0.08} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#4b5563" }} tickFormatter={(v) => v?.slice(2)} />
                    <YAxis tick={{ fontSize: 10, fill: "#4b5563" }} domain={[lo, hi]} width={36} />
                    <ReferenceLine y={edge} stroke="#047857" strokeDasharray="4 3"
                      label={{ value: higherBetter ? `healthy above ${edge}` : `healthy under ${edge}`, position: "insideBottomRight", fontSize: 10, fill: "#047857" }} />
                    <Tooltip formatter={(v) => [`${v} ${s.unit}`, s.label]} />
                    <Line type="monotone" dataKey="value" stroke="#6d28d9" strokeWidth={2}
                      // non-fasting draws read higher, so they are drawn hollow
                      dot={(p: { cx?: number; cy?: number; payload?: LabResult }) => (
                        <circle key={`${p.cx}-${p.cy}`} cx={p.cx} cy={p.cy} r={4} stroke="#6d28d9" strokeWidth={2}
                          fill={p.payload?.fasting === false ? "#ffffff" : "#6d28d9"} />
                      )} />
                  </LineChart>
                </ResponsiveContainer>
                {s.fastingMatters && series.some((r) => r.fasting === false) && (
                  <div className="text-xs text-gray-600">○ hollow points were not fasting and read higher</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recorded entries, deletable */}
      {!compact && results.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer min-h-[40px] flex items-center">All recorded results ({results.length})</summary>
          <ul className="mt-2 divide-y divide-gray-100">
            {[...results].reverse().map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{r.date} · {LAB_MARKERS[r.marker].label}: <strong>{r.value} {LAB_MARKERS[r.marker].unit}</strong>{r.fasting === false ? " (not fasting)" : ""}</span>
                <button type="button" onClick={() => setResults(deleteLabResult(r.id))}
                  aria-label={`Delete ${LAB_MARKERS[r.marker].label} result from ${r.date}`}
                  className="min-h-[40px] px-3 text-sm text-red-700">Delete</button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-4 text-xs text-gray-600">
        ⚠️ Not medical advice. Reference ranges vary between labs — your doctor interprets your results.
      </p>
    </div>
  );
}
