"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const TODAY_DAY = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

export default function WorkoutsPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [selectedDay, setSelectedDay] = useState(TODAY_DAY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("health-copilot-user-id");
    if (!id) { router.push("/onboarding/profile"); return; }
    api.getWorkoutPlan(id).then((p) => { setPlan(p as Record<string, unknown>); setLoading(false); });
  }, [router]);

  const days = (plan?.days as unknown[]) || [];
  const selectedDayData = days.find((d) => (d as Record<string, unknown>).day === selectedDay) as Record<string, unknown> | undefined;

  const FITNESS_BADGE_COLORS: Record<string, string> = {
    beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
    intermediate: "bg-sky-50 text-sky-700 border-sky-200",
    advanced: "bg-violet-50 text-violet-700 border-violet-200",
    older_adult: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Weekly Workout Plan</h1>
        {plan && (
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("metric-chip border", FITNESS_BADGE_COLORS[plan.fitness_level as string] || "bg-gray-50 text-gray-600 border-gray-200")}>
              {String(plan.fitness_level || "beginner").replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} Level
            </span>
            <span className="text-xs text-gray-400">Condition-safe template selection</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Week calendar */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const d = day as Record<string, unknown>;
              const dayName = String(d.day);
              const isToday = dayName === TODAY_DAY;
              const isSelected = dayName === selectedDay;
              const isRest = d.is_rest_day as boolean;

              return (
                <button
                  key={dayName}
                  onClick={() => setSelectedDay(dayName)}
                  className={cn(
                    "flex flex-col items-center py-3 px-1 rounded-xl border-2 transition-all text-center",
                    isSelected ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300",
                    isToday && !isSelected ? "border-emerald-400 bg-emerald-50" : ""
                  )}
                >
                  <div className={cn("text-xs font-bold", isSelected ? "text-sky-700" : isToday ? "text-emerald-700" : "text-gray-500")}>
                    {DAY_LABELS[dayName]}
                  </div>
                  <div className="text-xl mt-1">{isRest ? "😴" : "💪"}</div>
                  {isToday && <div className="text-xs text-emerald-600 font-bold mt-0.5">Today</div>}
                </button>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selectedDayData && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                {selectedDay} — {(selectedDayData.is_rest_day as boolean) ? "Rest Day" : "Training Day"}
              </h2>

              {(selectedDayData.is_rest_day as boolean) ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-3">😴</div>
                  <div className="font-bold text-emerald-800 text-xl mb-2">Rest & Recovery</div>
                  <div className="text-emerald-600 text-sm max-w-md mx-auto">
                    Active recovery promotes muscle repair and prevents overtraining.
                    Light stretching, yoga, or a gentle walk is encouraged.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {((selectedDayData.templates as unknown[]) || []).map((t: unknown) => {
                    const template = t as Record<string, unknown>;
                    const instructions = template.instructions as Record<string, unknown[]> | undefined;
                    return (
                      <div key={String(template.id)} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{String(template.name)}</h3>
                              <p className="text-sm text-gray-500 mt-1">{String(template.description || "")}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="metric-chip metric-chip-blue">{String(template.duration_min || 30)} min</span>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {((template.equipment as string[]) || []).map((eq: string) => (
                                  <span key={eq} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{eq}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {instructions && (
                          <div className="p-6 space-y-4">
                            {["warmup", "main_circuit", "cooldown"].map((section) => {
                              const exercises = instructions[section];
                              if (!exercises?.length) return null;
                              const sectionLabels: Record<string, string> = {
                                warmup: "🔥 Warm-up", main_circuit: "💪 Main Circuit", cooldown: "🧘 Cool-down"
                              };
                              return (
                                <div key={section}>
                                  <div className="text-sm font-bold text-gray-700 mb-2">{sectionLabels[section]}</div>
                                  <div className="space-y-2">
                                    {exercises.map((ex: unknown, i: number) => {
                                      const exercise = ex as Record<string, unknown>;
                                      return (
                                        <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl text-sm">
                                          <span className="font-medium text-gray-900">{String(exercise.exercise)}</span>
                                          <span className="text-gray-500 text-xs">
                                            {exercise.sets && exercise.reps ? `${exercise.sets}×${exercise.reps}` : ""}
                                            {exercise.duration_sec ? `${exercise.duration_sec}s` : ""}
                                            {exercise.rest_sec ? ` · ${exercise.rest_sec}s rest` : ""}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
