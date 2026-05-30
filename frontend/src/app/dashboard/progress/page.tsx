"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
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
}

export default function ProgressPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    weight_kg: "", calories_consumed: "", sleep_hours: "", steps_count: "", mood_score: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const userId = typeof window !== "undefined" ? localStorage.getItem("health-copilot-user-id") : null;

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
        notes: form.notes || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      const r = await api.getProgressHistory(userId, 30) as Record<string, unknown>;
      setLogs((r.logs as ProgressLog[]) || []);
      setForm({ weight_kg: "", calories_consumed: "", sleep_hours: "", steps_count: "", mood_score: "", notes: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const chartData = [...logs].reverse().map((l) => ({
    date: l.log_date,
    weight: l.weight_kg,
    sleep: l.sleep_hours,
    calories: l.calories_consumed,
    steps: l.steps_count,
  }));

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Progress Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Log your daily metrics and see trends over time</p>
      </div>

      {/* Log form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
        <h2 className="font-bold text-gray-900 mb-4">Log Today&apos;s Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {[
            { key: "weight_kg",        label: "Weight (kg)",       placeholder: "75.0",  type: "number", step: "0.1" },
            { key: "calories_consumed",label: "Calories Consumed",  placeholder: "1800",  type: "number" },
            { key: "sleep_hours",      label: "Sleep (hours)",      placeholder: "7.5",   type: "number", step: "0.5" },
            { key: "steps_count",      label: "Steps Today",        placeholder: "8000",  type: "number" },
            { key: "mood_score",       label: "Mood (1-5)",         placeholder: "4",     type: "number", min: "1", max: "5" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                step={(field as Record<string, string>).step}
                min={(field as Record<string, string>).min}
                max={(field as Record<string, string>).max}
                value={(form as Record<string, string>)[field.key]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none text-sm text-gray-900"
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
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">Weight</th>
                  <th className="px-5 py-3 text-right">Calories</th>
                  <th className="px-5 py-3 text-right">Sleep</th>
                  <th className="px-5 py-3 text-right">Steps</th>
                  <th className="px-5 py-3 text-right">Mood</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.slice(0, 10).map((log) => (
                  <tr key={log.log_date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{log.log_date}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{log.weight_kg ? `${log.weight_kg} kg` : "—"}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{log.calories_consumed ? `${log.calories_consumed} kcal` : "—"}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{log.sleep_hours ? `${log.sleep_hours}h` : "—"}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{log.steps_count ? log.steps_count.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {log.mood_score ? (
                        <span>{["", "😞", "😕", "😐", "🙂", "😄"][log.mood_score]}</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-card">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-bold text-gray-900 mb-1">No data yet</div>
          <div className="text-gray-500 text-sm">Log your first metrics above to start tracking trends.</div>
        </div>
      )}
    </div>
  );
}
