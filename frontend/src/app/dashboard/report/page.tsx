"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, resolveUserId } from "@/lib/api-client";
import { getLocalProgressHistory } from "@/lib/local-store";
import { CONDITIONS } from "@/lib/constants";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function cap(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

/* ─── types ────────────────────────────────────────────────────────────────── */
interface MealSlot { slot: string; slot_calories: number; slot_protein_g: number; items: { food: { name: string } }[]; }

/* ─── email HTML builder ───────────────────────────────────────────────────── */
interface WeeklyLite {
  days: { date: string; weekday_short: string; plan: { meals: MealSlot[] } }[];
  grocery: { label: string; items: { name: string; times: number }[] }[];
}

function buildEmailHtml(opts: {
  name: string; goal: string; conditionLabels: string[];
  cal: number; protein: number; carbs: number; fat: number;
  meals: MealSlot[]; logs: ReturnType<typeof getLocalProgressHistory>["logs"];
  date: string; weekly: WeeklyLite | null;
}) {
  const { name, goal, conditionLabels, cal, protein, carbs, fat, meals, logs, date, weekly } = opts;
  const slotIcons: Record<string, string> = { breakfast: "🌅", mid_morning: "🍎", lunch: "☀️", evening_snack: "🌤", dinner: "🌙" };

  const mainsOf = (dayMeals: MealSlot[], slot: string) =>
    dayMeals.find((mm) => mm.slot === slot)?.items.slice(0, 2).map((i) => i.food?.name).filter(Boolean).join(", ") || "—";

  const weeklySection = weekly
    ? `
    <!-- Week at a glance -->
    <div style="padding:0 32px 24px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">📅 &nbsp;Week at a Glance</h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">Day</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">🌅 Breakfast</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">☀️ Lunch</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">🌙 Dinner</th>
          </tr>
        </thead>
        <tbody>
          ${weekly.days.map((d) => `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-weight:700;color:#1e293b">${d.weekday_short}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;color:#374151">${mainsOf(d.plan.meals, "breakfast")}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;color:#374151">${mainsOf(d.plan.meals, "lunch")}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;color:#374151">${mainsOf(d.plan.meals, "dinner")}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <div style="background:#f0fdf4;border-radius:12px;padding:14px 16px;margin-top:14px">
        <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:6px">🛒 Grocery list for the week</div>
        ${weekly.grocery.map((g) => `
        <div style="font-size:12px;color:#374151;margin-bottom:4px">
          <strong style="color:#166534">${g.label}:</strong> ${g.items.map((it) => it.name).join(", ")}
        </div>`).join("")}
      </div>
    </div>`
    : "";

  const mealRows = meals.map((m) =>
    `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;">
        <span style="font-size:18px;margin-right:8px">${slotIcons[m.slot] || "🍽"}</span>
        <strong style="color:#1e293b;text-transform:capitalize">${m.slot.replace(/_/g," ")}</strong>
        <span style="color:#94a3b8;font-size:12px;margin-left:8px">${Math.round(m.slot_calories)} kcal · ${Math.round(m.slot_protein_g)}g protein</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px">
        ${m.items.map((i) => i.food?.name).filter(Boolean).join(" &nbsp;·&nbsp; ")}
      </td>
    </tr>`
  ).join("");

  const logRows = logs.length > 0 ? logs.map((l) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${l.log_date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center">${l.weight_kg ?? "—"} kg</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:${l.bp_systolic && l.bp_systolic > 130 ? "#ef4444" : "#10b981"}">${l.bp_systolic ? `${l.bp_systolic}/${l.bp_diastolic}` : "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:#374151">${l.blood_sugar_fasting ?? "—"} / ${l.blood_sugar_post_meal ?? "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:#374151">${l.sleep_hours ? `${l.sleep_hours}h` : "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:#374151">${l.steps_count?.toLocaleString() ?? "—"}</td>
    </tr>`
  ).join("") : `<tr><td colspan="6" style="padding:16px;text-align:center;color:#94a3b8">No progress data logged yet — start tracking in the Progress section.</td></tr>`;

  const conditionPills = conditionLabels.length > 0
    ? conditionLabels.map((l) => `<span style="display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:999px;padding:4px 14px;font-size:13px;margin:3px 4px 3px 0;font-weight:600">${l}</span>`).join("")
    : `<span style="color:#94a3b8;font-size:14px">None selected</span>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#0ea5e9 100%);padding:36px 32px;text-align:center">
      <div style="font-size:36px;margin-bottom:8px">💚</div>
      <h1 style="margin:0;color:white;font-size:26px;font-weight:800;letter-spacing:-0.5px">Your Health Report</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Generated by healthCopilot &nbsp;·&nbsp; ${date}</p>
    </div>

    <!-- Greeting -->
    <div style="padding:28px 32px 0">
      <p style="margin:0;font-size:16px;color:#374151">Hi <strong>${name}</strong> 👋</p>
      <p style="margin:8px 0 0;font-size:14px;color:#6b7280;line-height:1.6">
        Here's your personalised health report based on your profile and activity. All recommendations are tailored specifically for your health goals and conditions.
      </p>
    </div>

    <!-- Profile -->
    <div style="padding:24px 32px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:8px">👤 &nbsp;Your Profile</h2>
      <div style="background:#f8fafc;border-radius:14px;padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Goal</div><div style="font-size:15px;font-weight:700;color:#1e293b;margin-top:3px">${cap(goal)}</div></div>
        <div><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Report Date</div><div style="font-size:15px;font-weight:700;color:#1e293b;margin-top:3px">${date}</div></div>
      </div>
      ${conditionLabels.length > 0 ? `
      <div style="margin-top:14px">
        <div style="font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🩺 Health Conditions</div>
        ${conditionPills}
      </div>` : ""}
    </div>

    <!-- Nutrition Targets -->
    <div style="padding:0 32px 24px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">🔥 &nbsp;Daily Nutrition Targets</h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center">
        <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:14px;padding:16px 8px">
          <div style="font-size:22px;font-weight:800;color:#ea580c">${cal}</div>
          <div style="font-size:11px;color:#9a3412;font-weight:600;margin-top:2px">kcal</div>
        </div>
        <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:14px;padding:16px 8px">
          <div style="font-size:22px;font-weight:800;color:#7c3aed">${protein}g</div>
          <div style="font-size:11px;color:#5b21b6;font-weight:600;margin-top:2px">Protein</div>
        </div>
        <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:14px;padding:16px 8px">
          <div style="font-size:22px;font-weight:800;color:#0284c7">${carbs}g</div>
          <div style="font-size:11px;color:#075985;font-weight:600;margin-top:2px">Carbs</div>
        </div>
        <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;padding:16px 8px">
          <div style="font-size:22px;font-weight:800;color:#16a34a">${fat}g</div>
          <div style="font-size:11px;color:#14532d;font-weight:600;margin-top:2px">Fat</div>
        </div>
      </div>
    </div>

    <!-- Meal Plan -->
    <div style="padding:0 32px 24px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">🥗 &nbsp;Today's Meal Plan</h2>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:14px;overflow:hidden">
        <tbody>${mealRows}</tbody>
      </table>
    </div>

    ${weeklySection}

    <!-- Progress -->
    <div style="padding:0 32px 24px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">📊 &nbsp;Recent Progress (last 7 days)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">Date</th>
            <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">Weight</th>
            <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">BP</th>
            <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">Sugar F/PM</th>
            <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">Sleep</th>
            <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase">Steps</th>
          </tr>
        </thead>
        <tbody>${logRows}</tbody>
      </table>
    </div>

    <!-- Wellness Tips -->
    <div style="padding:0 32px 28px">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b">🌟 &nbsp;Daily Wellness Reminders</h2>
      <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;padding:22px 24px">
        ${[
          ["🚶","Walk 30 min daily — reduces heart disease risk by 35%"],
          ["🏋️","Strength train 2–3×/week — lowers blood sugar & builds metabolism"],
          ["🥗","Eat protein at every meal — keeps you full and protects muscle"],
          ["💧","Drink water before meals — reduces hunger naturally"],
          ["😴","7–8 hours sleep — regulates hunger hormones and insulin sensitivity"],
          ["🧘","10 min meditation daily — lowers cortisol and blood pressure"],
          ["🥦","Half your plate = vegetables — fibre, vitamins, minimal calories"],
          ["⏰","Consistent meal timings — prevents blood sugar swings throughout the day"],
        ].map(([icon, tip]) =>
          `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;font-size:13px;color:#e2e8f0;line-height:1.5">
            <span style="font-size:16px;flex-shrink:0;margin-top:1px">${icon}</span>
            <span>${tip}</span>
          </div>`
        ).join("")}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
        ⚕️ This report is for personal wellness tracking only and is not a substitute for medical advice.<br>
        Always consult your doctor before making changes to diet, exercise or medications.<br><br>
        <strong style="color:#7c3aed">healthCopilot</strong> &nbsp;·&nbsp; Your personal health companion
      </p>
    </div>

  </div>
</body>
</html>`;
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function ReportPage() {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary]   = useState<Record<string, unknown> | null>(null);
  const [mealPlan, setMealPlan] = useState<Record<string, unknown> | null>(null);
  const [macros, setMacros]     = useState<Record<string, unknown> | null>(null);
  const [weekly, setWeekly]     = useState<WeeklyLite | null>(null);
  const [loading, setLoading]   = useState(true);

  const [email, setEmail]         = useState("");
  const [sending, setSending]     = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sent" | "error" | "no-config">("idle");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const id = resolveUserId();
    if (!id) { router.push("/onboarding/profile"); return; }
    Promise.all([
      api.getUserSummary(id),
      api.getMealPlan(id),
      api.getMacros(id),
      api.getWeeklyPlan(id),
    ]).then(([s, m, mx, w]) => {
      setSummary(s as Record<string, unknown>);
      setMealPlan(m as Record<string, unknown>);
      setMacros(mx as Record<string, unknown>);
      setWeekly(w as WeeklyLite);
      setLoading(false);
    });
  }, [router]);

  const progressHistory = getLocalProgressHistory(30);
  const recentLogs = progressHistory.logs.slice(0, 7);

  const conditions     = (summary?.condition_codes as string[]) || [];
  const conditionLabels = conditions.map((code) => {
    const c = CONDITIONS.find((x) => x.code === code);
    return c ? `${c.icon} ${c.label}` : code;
  });

  const cal     = Math.round((macros as Record<string, number>)?.calories   || 0);
  const protein = Math.round((macros as Record<string, number>)?.protein_g  || 0);
  const carbs   = Math.round((macros as Record<string, number>)?.carbs_g    || 0);
  const fat     = Math.round((macros as Record<string, number>)?.fat_g      || 0);
  const meals   = (mealPlan?.meals as MealSlot[]) || [];
  const date    = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const name    = String(summary?.name || "User");
  const goal    = String(summary?.primary_goal || "—");

  /* ── Send email via EmailJS ─────────────────────────────────────────────── */
  const handleSendEmail = async () => {
    if (!email) return;
    const serviceId  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey ||
        serviceId === "YOUR_SERVICE_ID") {
      setEmailStatus("no-config");
      return;
    }

    setSending(true);
    setEmailStatus("idle");
    try {
      const emailjs = (await import("@emailjs/browser")).default;
      const html = buildEmailHtml({ name, goal, conditionLabels, cal, protein, carbs, fat, meals, logs: recentLogs, date, weekly });
      await emailjs.send(serviceId, templateId, {
        to_email:     email,
        to_name:      name,
        subject:      `Your healthCopilot Health Report — ${date}`,
        message_html: html,
        reply_to:     email,
      }, publicKey);
      setEmailStatus("sent");
      setTimeout(() => setEmailStatus("idle"), 5000);
    } catch {
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 5000);
    } finally {
      setSending(false);
    }
  };

  /* ── Download PDF via html2canvas + jsPDF ───────────────────────────────── */
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF       = (await import("jspdf")).default;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData  = canvas.toDataURL("image/png");
      const pdf      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW    = pdf.internal.pageSize.getWidth();
      const pageH    = pdf.internal.pageSize.getHeight();
      const imgW     = pageW;
      const imgH     = (canvas.height * imgW) / canvas.width;

      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -y, imgW, imgH);
        y += pageH;
      }

      pdf.save(`healthCopilot-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        {[1,2,3,4].map((i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
      </div>
    );
  }

  const slotIcons: Record<string, string> = {
    breakfast: "🌅", mid_morning: "🍎", lunch: "☀️", evening_snack: "🌤", dinner: "🌙",
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* ── Action bar (not printed) ──────────────────────────────────────── */}
      <div className="no-print space-y-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Health Report</h1>
          <p className="text-gray-400 text-sm mt-1">{date}</p>
        </div>

        {/* Email card */}
        <div className="bg-gradient-to-br from-violet-50 to-sky-50 border border-violet-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📧</span>
            <div className="font-bold text-gray-900">Email Report Directly</div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Enter your email and we'll send a beautifully formatted HTML report — no extra steps needed.
          </p>
          <div className="flex gap-3 flex-wrap">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-sm"
            />
            <button
              onClick={handleSendEmail}
              disabled={!email || sending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending...</>
              ) : "Send Report →"}
            </button>
          </div>
          {emailStatus === "sent"      && <p className="mt-3 text-sm text-emerald-600 font-semibold">✓ Report sent to {email}!</p>}
          {emailStatus === "error"     && <p className="mt-3 text-sm text-rose-600 font-semibold">✗ Failed to send. Please check your email address and try again.</p>}
          {emailStatus === "no-config" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <strong>Email not configured yet.</strong> To enable direct email sending, create a free account at{" "}
              <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="underline">emailjs.com</a>,
              create a service + template, then add <code>NEXT_PUBLIC_EMAILJS_SERVICE_ID</code>,{" "}
              <code>NEXT_PUBLIC_EMAILJS_TEMPLATE_ID</code> and <code>NEXT_PUBLIC_EMAILJS_PUBLIC_KEY</code>{" "}
              to your Vercel environment variables.
            </div>
          )}
        </div>

        {/* PDF download */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {downloading ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating PDF...</>
          ) : (
            <><span className="text-xl">📄</span> Download PDF Report</>
          )}
        </button>
      </div>

      {/* ── PRINTABLE / CAPTURABLE REPORT ─────────────────────────────────── */}
      <div
        ref={reportRef}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {/* Header gradient */}
        <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%)" }} className="px-8 py-10 text-center text-white">
          <div className="text-5xl mb-3">💚</div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Your Health Report</h1>
          <p className="text-white/80 text-sm">Generated by healthCopilot &nbsp;·&nbsp; {date}</p>
        </div>

        <div className="p-8 space-y-8">

          {/* Profile */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-lg">👤</div>
              <h2 className="text-lg font-black text-slate-900">Profile</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Name",      value: name },
                { label: "Goal",      value: cap(goal) },
                { label: "Date",      value: date },
              ].map((f) => (
                <div key={f.label} style={{ background: "#f8fafc" }} className="rounded-2xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{f.label}</div>
                  <div className="text-base font-black text-slate-800 mt-1">{f.value}</div>
                </div>
              ))}
            </div>
            {conditionLabels.length > 0 && (
              <div className="mt-3 p-4 rounded-2xl" style={{ background: "#f5f3ff" }}>
                <div className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">🩺 Health Conditions</div>
                <div className="flex flex-wrap gap-2">
                  {conditionLabels.map((l) => (
                    <span key={l} className="text-sm px-3 py-1 rounded-full font-semibold" style={{ background: "#ede9fe", color: "#6d28d9" }}>{l}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Nutrition targets */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🔥</div>
              <h2 className="text-lg font-black text-slate-900">Daily Nutrition Targets</h2>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { v: `${cal}`,      u: "kcal",    bg: "#fff7ed", c: "#ea580c" },
                { v: `${protein}g`, u: "Protein",  bg: "#f5f3ff", c: "#7c3aed" },
                { v: `${carbs}g`,   u: "Carbs",    bg: "#f0f9ff", c: "#0284c7" },
                { v: `${fat}g`,     u: "Fat",      bg: "#f0fdf4", c: "#16a34a" },
              ].map((m) => (
                <div key={m.u} className="rounded-2xl py-5 px-2" style={{ background: m.bg }}>
                  <div className="text-2xl font-black" style={{ color: m.c }}>{m.v}</div>
                  <div className="text-xs font-bold mt-1" style={{ color: m.c, opacity: 0.75 }}>{m.u}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Meal plan */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">🥗</div>
              <h2 className="text-lg font-black text-slate-900">Today&apos;s Meal Plan</h2>
            </div>
            <div className="space-y-2">
              {meals.map((m) => (
                <div key={m.slot} className="flex gap-4 p-4 rounded-2xl" style={{ background: "#f8fafc" }}>
                  <div className="text-2xl flex-shrink-0">{slotIcons[m.slot] || "🍽"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-slate-900 capitalize">{m.slot.replace(/_/g," ")}</span>
                      <span className="text-xs text-slate-400">{Math.round(m.slot_calories)} kcal · {Math.round(m.slot_protein_g)}g protein</span>
                    </div>
                    <div className="text-sm text-slate-600">{m.items.map((i) => i.food?.name).filter(Boolean).join("  ·  ")}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Week at a glance + grocery */}
          {weekly && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-lg">📅</div>
                <h2 className="text-lg font-black text-slate-900">Week at a Glance</h2>
              </div>
              <div className="overflow-x-auto rounded-2xl mb-4" style={{ background: "#f8fafc" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      {["Day", "🌅 Breakfast", "☀️ Lunch", "🌙 Dinner"].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weekly.days.map((d) => {
                      const mains = (slot: string) =>
                        d.plan.meals.find((mm) => mm.slot === slot)?.items.slice(0, 2).map((i) => i.food?.name).filter(Boolean).join(", ") || "—";
                      return (
                        <tr key={d.date} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-bold text-slate-900 whitespace-nowrap">{d.weekday_short}</td>
                          <td className="px-3 py-2 text-slate-600">{mains("breakfast")}</td>
                          <td className="px-3 py-2 text-slate-600">{mains("lunch")}</td>
                          <td className="px-3 py-2 text-slate-600">{mains("dinner")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "#f0fdf4" }}>
                <div className="text-sm font-bold text-emerald-800 mb-2">🛒 Grocery List for the Week</div>
                <div className="space-y-1">
                  {weekly.grocery.map((g) => (
                    <div key={g.label} className="text-xs text-slate-600">
                      <span className="font-bold text-emerald-700">{g.label}:</span>{" "}
                      {g.items.map((it) => it.name).join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Progress */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-lg">📊</div>
              <h2 className="text-lg font-black text-slate-900">Recent Progress</h2>
            </div>
            {recentLogs.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl" style={{ background: "#f8fafc" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      {["Date","Weight","BP (mmHg)","Sugar F/PM","Sleep","Steps"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((l) => {
                      const bpHigh = l.bp_systolic && l.bp_systolic > 130;
                      const sHigh  = l.blood_sugar_fasting && l.blood_sugar_fasting > 99;
                      return (
                        <tr key={l.log_date} style={{ borderTop: "1px solid #e2e8f0" }}>
                          <td className="px-4 py-3 font-semibold text-slate-800">{l.log_date}</td>
                          <td className="px-4 py-3 text-slate-600">{l.weight_kg ? `${l.weight_kg} kg` : "—"}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: bpHigh ? "#ef4444" : "#10b981" }}>
                            {l.bp_systolic ? `${l.bp_systolic}/${l.bp_diastolic}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold" style={{ color: sHigh ? "#ef4444" : "#10b981" }}>
                            {l.blood_sugar_fasting ?? "—"} / {l.blood_sugar_post_meal ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{l.sleep_hours ? `${l.sleep_hours}h` : "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{l.steps_count?.toLocaleString() ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 rounded-2xl" style={{ background: "#f8fafc" }}>
                No progress data yet — start tracking in the Progress section.
              </div>
            )}
          </section>

          {/* Wellness reminders */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center text-lg">🌟</div>
              <h2 className="text-lg font-black text-slate-900">Daily Wellness Reminders</h2>
            </div>
            <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)" }} className="rounded-2xl p-6 grid md:grid-cols-2 gap-3">
              {[
                ["🚶","Walk 30 min daily — reduces heart disease risk by 35%"],
                ["🏋️","Strength train 2–3×/week — lowers blood sugar & builds metabolism"],
                ["🥗","Eat protein at every meal — keeps you full and protects muscle"],
                ["💧","Drink water before meals — reduces hunger naturally"],
                ["😴","7–8 hours sleep — regulates hunger hormones and insulin"],
                ["🧘","10 min meditation daily — lowers cortisol and blood pressure"],
                ["🥦","Half your plate = vegetables — fibre, vitamins, minimal calories"],
                ["⏰","Consistent meal timings — prevents blood sugar swings"],
              ].map(([icon, tip]) => (
                <div key={tip} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="flex-shrink-0 mt-0.5">{icon}</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-2 pb-2">
            <div className="text-xs text-slate-400 leading-relaxed">
              ⚕️ This report is for personal wellness tracking only and is not a substitute for medical advice.<br />
              Always consult your doctor before making changes to diet, exercise or medications.<br /><br />
              <span className="font-bold text-violet-600">healthCopilot</span> &nbsp;·&nbsp; Your personal health companion
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
