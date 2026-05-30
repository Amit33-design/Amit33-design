"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function LifestylePage() {
  const router = useRouter();
  const [recs, setRecs] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("health-copilot-user-id");
    if (!id) { router.push("/onboarding/profile"); return; }
    api.getLifestyleRecs(id).then((r) => { setRecs(r as Record<string, unknown>); setLoading(false); });
  }, [router]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
      </div>
    );
  }

  const hydration = recs?.hydration as Record<string, unknown> | undefined;
  const sleep = recs?.sleep as Record<string, unknown> | undefined;
  const stress = recs?.stress as Record<string, unknown> | undefined;
  const conditionNotes = (recs?.condition_specific as unknown[]) || [];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Lifestyle Recommendations</h1>
        <p className="text-gray-400 text-sm mt-1">Personalized for your health profile and conditions</p>
      </div>

      {/* Condition-specific notes */}
      {conditionNotes.length > 0 && (
        <div className="space-y-3">
          {conditionNotes.map((note: unknown) => {
            const n = note as Record<string, unknown>;
            return (
              <div key={String(n.condition)} className="flex gap-3 p-4 bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-200 rounded-2xl">
                <span className="text-2xl">🩺</span>
                <div>
                  <div className="font-bold text-violet-800 text-sm">{String(n.condition)} Specific</div>
                  <div className="text-sm text-gray-700 mt-0.5">{String(n.tip)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hydration */}
      {hydration && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-xl">💧</div>
            <div>
              <div className="font-bold text-gray-900">Daily Hydration Target</div>
              <div className="text-3xl font-black text-sky-600">{String(hydration.target_liters)}L</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-4">{String(hydration.reason)}</div>
          <div className="grid grid-cols-2 gap-2">
            {((hydration.tips as string[]) || []).map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-sky-50 rounded-xl p-3">
                <span className="text-sky-400 mt-0.5">→</span> {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep */}
      {sleep && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">🌙</div>
            <div>
              <div className="font-bold text-gray-900">Sleep Target</div>
              <div className="text-3xl font-black text-indigo-600">{String(sleep.target_hours)} hrs</div>
            </div>
          </div>
          {sleep.gap_message && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-800 font-medium">
              ⚠️ {String(sleep.gap_message)}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {((sleep.tips as string[]) || []).map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-indigo-50 rounded-xl p-3">
                <span className="text-indigo-400 mt-0.5">→</span> {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stress */}
      {stress && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-xl">🧘</div>
            <div>
              <div className="font-bold text-gray-900">Stress Management</div>
              <div className={cn(
                "text-sm font-semibold px-3 py-1 rounded-lg inline-block mt-1",
                stress.current_level === "low" ? "bg-emerald-50 text-emerald-700" :
                stress.current_level === "medium" ? "bg-yellow-50 text-yellow-700" :
                "bg-red-50 text-red-700"
              )}>
                {String(stress.current_level || "medium").charAt(0).toUpperCase() + String(stress.current_level || "medium").slice(1)} Stress Level
              </div>
            </div>
          </div>
          {stress.clinical_note && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4 text-sm text-rose-800">
              🩺 {String(stress.clinical_note)}
            </div>
          )}
          <div className="space-y-3">
            {((stress.techniques as unknown[]) || []).map((tech: unknown, i: number) => {
              const t = tech as Record<string, unknown>;
              return (
                <div key={i} className="flex gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-rose-600 flex-shrink-0">
                    {String(t.duration)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{String(t.name)}</div>
                    <div className="text-sm text-gray-600 mt-0.5">{String(t.description)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
