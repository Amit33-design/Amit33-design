"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, resolveUserId } from "@/lib/api-client";
import { hasLocalProgress } from "@/lib/local-store";
import { MedicationTracker } from "@/components/dashboard/MedicationTracker";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

interface ProgressLog {
  log_date: string;
  weight_kg?: number;
  calories_consumed?: number;
  sleep_hours?: number;
  steps_count?: number;
  mood_score?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  blood_sugar_fasting?: number;
  blood_sugar_post_meal?: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    weight_kg: "", calories_consumed: "", sleep_hours: "", steps_count: "", mood_score: "",
    bp_systolic: "", bp_diastolic: "", blood_sugar_fasting: "", blood_sugar_post_meal: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const userId = resolveUserId();

  useEffect(() => {
    if (!userId) { router.push("/onboarding/profile"); return; }
    api.getProgressHistory(userId, 30).then((r) => {
      setLogs(((r as Record<string, unknown>).logs as ProgressLog[]) || []);
      setLoading(false);
    });
  }, [router, userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await api.logProgress(userId, {
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        calories_consumed: form.calories_consumed ? Number(form.calories_consumed) : null,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        steps_count: form.steps_count ? Number(form.steps_count) : null,
        mood_score: form.mood_score ? Number(form.mood_score) : null,
        bp_systolic: form.bp_systolic ? Number(form.bp_systolic) : null,
        bp_diastolic: form.bp_diastolic ? Number(form.bp_diastolic) : null,
        blood_sugar_fasting: form.blood_sugar_fasting ? Number(form.blood_sugar_fasting) : null,
        blood_sugar_post_meal: form.blood_sugar_post_meal ? Number(form.blood_sugar_post_meal) : null,
        notes: form.notes || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      const r = await api.getProgressHistory(userId, 30) as Record<string, unknown>;
      setLogs((r.logs as ProgressLog[]) || []);
      setForm({ weight_kg: "", calories_consumed: "", sleep_hours: "", steps_count: "", mood_score: "", bp_systolic: "", bp_diastolic: "", blood_sugar_fasting: "", blood_sugar_post_meal: "", notes: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Weight (kg)", "Calories", "Sleep (h)", "Steps", "Mood", "BP Systolic", "BP Diastolic", "Sugar Fasting", "Sugar Post-Meal", "Notes"];
    const rows = [...logs].reverse().map((l) => [
      l.log_date, l.weight_kg ?? "", l.calories_consumed ?? "", l.sleep_hours ?? "",
      l.steps_count ?? "", l.mood_score ?? "", l.bp_systolic ?? "", l.bp_diastolic ?? "",
      l.blood_sugar_fasting ?? "", l.blood_sugar_post_meal ?? "",
      (l as unknown as Record<string, unknown>).notes ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `healthcopilot-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = [...logs].reverse().map((l) => ({
    date: l.log_date,
    weight: l.weight_kg,
    sleep: l.sleep_hours,
    calories: l.calories_consumed,
    steps: l.steps_count,
    bp_systolic: l.bp_systolic,
    bp_diastolic: l.bp_diastolic,
    sugar_fasting: l.blood_sugar_fasting,
    sugar_post: l.blood_sugar_post_meal,
  }));

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Progress Tracker</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-gray-400 text-sm">Log your daily metrics and see trends over time</p>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-medium">
              🔒 Saved on this device
            </span>
          </div>
        </div>
        {hasLocalProgress() && (
          <button
            onClick={exportCSV}
            className="text-xs px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold flex items-center gap-1.5 flex-shrink-0"
          >
            ↓ Export CSV
          </button>
        )}
      </div>

      {/* Log form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Log Today&apos;s Metrics</h2>

        {/* Body metrics */}
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Body & Activity</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          {[
            { key: "weight_kg",         label: "Weight (kg)",       placeholder: "75.0", step: "0.1" },
            { key: "calories_consumed", label: "Calories Consumed",  placeholder: "1800" },
            { key: "sleep_hours",       label: "Sleep (hours)",      placeholder: "7.5",  step: "0.5" },
            { key: "steps_count",       label: "Steps Today",        placeholder: "8000" },
            { key: "mood_score",        label: "Mood (1–5)",         placeholder: "4", min: "1", max: "5" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
              <input
                type="number"
                placeholder={field.placeholder}
                step={(field as unknown as Record<string, string>).step}
                min={(field as unknown as Record<string, string>).min}
                max={(field as unknown as Record<string, string>).max}
                value={(form as Record<string, string>)[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm text-gray-900"
              />
            </div>
          ))}
        </div>

        {/* Live health readings */}
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Live Health Readings</div>
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 mb-3">
          Log your daily BP and blood sugar readings — these help track how well your conditions are controlled over time.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { key: "bp_systolic",         label: "BP Systolic (mmHg)",   placeholder: "120", icon: "💓" },
            { key: "bp_diastolic",        label: "BP Diastolic (mmHg)",  placeholder: "80",  icon: "💓" },
            { key: "blood_sugar_fasting", label: "Sugar Fasting (mg/dL)", placeholder: "95",  icon: "🩸" },
            { key: "blood_sugar_post_meal",label: "Sugar Post-Meal (mg/dL)", placeholder: "140", icon: "🩸" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {field.icon} {field.label}
              </label>
              <input
                type="number"
                placeholder={field.placeholder}
                value={(form as Record<string, string>)[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm text-gray-900"
              />
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
          <input
            type="text"
            placeholder="How are you feeling today?"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm text-gray-900"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "px-6 py-3 rounded-xl font-bold text-sm transition-all",
            saved ? "bg-emerald-500 text-white" :
            !saving ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:opacity-90" :
            "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {saved ? "✓ Saved!" : saving ? "Saving..." : "Log Today's Data"}
        </button>
      </div>

      {/* Medication tracker + reminders */}
      <MedicationTracker />

      {/* Charts */}
      {chartData.length > 1 && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Weight Trend (30 days)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                  labelFormatter={(v) => `Date: ${v}`}
                  formatter={(v) => [`${v} kg`, "Weight"]}
                />
                <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h2 className="font-bold text-gray-900 mb-4">Sleep (hours)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} domain={[4, 10]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} formatter={(v) => [`${v}h`, "Sleep"]} />
                  <Line type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h2 className="font-bold text-gray-900 mb-4">Daily Steps</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} formatter={(v) => [`${v?.toLocaleString()} steps`, "Steps"]} />
                  <Line type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health readings charts — only shown if the user has logged them */}
          {chartData.some((d) => d.bp_systolic) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h2 className="font-bold text-gray-900 mb-1">Blood Pressure Trend 💓</h2>
              <p className="text-xs text-gray-400 mb-4">Normal: &lt;120/80 mmHg · High: &gt;130/80 mmHg</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} domain={[50, 200]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} formatter={(v, name) => [`${v} mmHg`, name === "bp_systolic" ? "Systolic" : "Diastolic"]} />
                  <Line type="monotone" dataKey="bp_systolic" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Systolic" />
                  <Line type="monotone" dataKey="bp_diastolic" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Diastolic" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartData.some((d) => d.sugar_fasting) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h2 className="font-bold text-gray-900 mb-1">Blood Sugar Trend 🩸</h2>
              <p className="text-xs text-gray-400 mb-4">Fasting normal: 70–99 mg/dL · Post-meal normal: &lt;140 mg/dL</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} tickFormatter={(v) => v?.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} domain={[60, 300]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} formatter={(v, name) => [`${v} mg/dL`, name === "sugar_fasting" ? "Fasting" : "Post-Meal"]} />
                  <Line type="monotone" dataKey="sugar_fasting" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Fasting" />
                  <Line type="monotone" dataKey="sugar_post" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Post-Meal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* History table */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Weight</th>
                  <th className="px-4 py-3 text-right">BP</th>
                  <th className="px-4 py-3 text-right">Sugar (F/PM)</th>
                  <th className="px-4 py-3 text-right">Sleep</th>
                  <th className="px-4 py-3 text-right">Steps</th>
                  <th className="px-4 py-3 text-right">Mood</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.slice(0, 10).map((log) => {
                  const bpOk = log.bp_systolic && log.bp_systolic > 0;
                  const bpHigh = bpOk && (log.bp_systolic! > 130 || log.bp_diastolic! > 80);
                  const sugarHighF = log.blood_sugar_fasting && log.blood_sugar_fasting > 99;
                  const sugarHighP = log.blood_sugar_post_meal && log.blood_sugar_post_meal > 140;
                  return (
                    <tr key={log.log_date} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{log.log_date}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{log.weight_kg ? `${log.weight_kg} kg` : "—"}</td>
                      <td className={cn("px-4 py-3 text-right font-semibold text-sm", bpOk ? (bpHigh ? "text-rose-600" : "text-emerald-600") : "text-gray-400")}>
                        {bpOk ? `${log.bp_systolic}/${log.bp_diastolic}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <span className={log.blood_sugar_fasting ? (sugarHighF ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold") : "text-gray-400"}>
                          {log.blood_sugar_fasting || "—"}
                        </span>
                        {" / "}
                        <span className={log.blood_sugar_post_meal ? (sugarHighP ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold") : "text-gray-400"}>
                          {log.blood_sugar_post_meal || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{log.sleep_hours ? `${log.sleep_hours}h` : "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{log.steps_count ? log.steps_count.toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {log.mood_score ? <span>{["", "😞", "😕", "😐", "🙂", "😄"][log.mood_score]}</span> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-card">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-bold text-gray-900 mb-1">Start your health journal</div>
          <div className="text-gray-500 text-sm max-w-sm mx-auto">
            Log today&apos;s metrics above — weight, BP, blood sugar, sleep. Charts appear after 2+ entries. Your data stays on this device, no account needed.
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
            <span className="px-3 py-1 bg-gray-50 rounded-full">🔒 Stored locally on your device</span>
            <span className="px-3 py-1 bg-gray-50 rounded-full">📵 Works offline</span>
            <span className="px-3 py-1 bg-gray-50 rounded-full">🚫 No login required</span>
          </div>
        </div>
      )}
    </div>
  );
}
