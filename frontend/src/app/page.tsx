"use client";
import Link from "next/link";
import { CONDITIONS, GOALS } from "@/lib/constants";

const FEATURES = [
  {
    icon: "🎯",
    title: "Policy-Driven Engine",
    description:
      "Tell us your health goals, conditions, and food preferences — and we build a plan that's personalised to your body, not a one-size-fits-all template.",
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
  },
  {
    icon: "🧬",
    title: "Multi-Condition Optimizer",
    description:
      "Managing multiple conditions? We handle all of them together — one plan that respects every health rule at the same time, with no contradictions.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
  },
  {
    icon: "💡",
    title: "Explainable AI",
    description:
      "Every recommendation comes with a reason. \"Oats recommended: ✓ Low GI ✓ High Fiber ✓ Diabetes Friendly\" — not a black box.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
  },
  {
    icon: "🩺",
    title: "Clinically Aware",
    description:
      "Built on evidence-based guidelines: DASH protocol for HTN, KDOQI for CKD, ADA standards for diabetes — not generic advice.",
    color: "from-rose-500 to-red-600",
    bg: "bg-rose-50",
  },
  {
    icon: "🤖",
    title: "AI healthCopilot",
    description:
      "Chat with your personal health AI. Ask \"Why should I avoid spinach?\" and get a contextual, condition-specific answer.",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
  },
  {
    icon: "📊",
    title: "Progress Intelligence",
    description:
      "Track weight, sleep, calories, and health metrics. Get trend analysis and motivational coaching powered by AI.",
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
  },
];

const STATS = [
  { value: "8",    label: "Health Conditions Supported", icon: "🏥" },
  { value: "70+",  label: "Clinical Safety Rules",        icon: "📋" },
  { value: "200+", label: "Foods with Full Profiles",     icon: "🥗" },
  { value: "100%", label: "Explainable Recommendations",  icon: "💡" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <span className="text-xl font-bold text-gray-900">healthCopilot</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-gray-500">Personal Health AI Platform</span>
            <Link
              href="/onboarding/profile"
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-glow-blue"
            >
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-violet-950 text-white">
        {/* Decorative orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            Policy-Driven AI Recommendation Engine
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight max-w-5xl mb-6">
            Your Personal
            <br />
            <span className="gradient-text">healthCopilot</span>
          </h1>

          <p className="text-xl md:text-2xl text-sky-100/80 max-w-3xl mb-10 leading-relaxed font-light">
            Tell us your health goals, conditions, and food preferences — and we build a plan that works for <em>your</em> body. Not a generic template. Yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/onboarding/profile"
              className="px-8 py-4 bg-gradient-to-r from-sky-400 to-violet-500 text-white font-bold rounded-2xl text-lg hover:scale-105 transition-transform shadow-2xl shadow-sky-500/30 text-center"
            >
              Build My Health Plan →
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl text-lg hover:bg-white/20 transition-colors text-center backdrop-blur-sm"
            >
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl p-5 bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg shadow-violet-500/30">
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white font-semibold">{stat.icon} {stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POLICY ENGINE EXPLAINER */}
      <section id="how-it-works" className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-700 rounded-full text-sm font-semibold border border-sky-200 mb-4">
              ✨ How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              You → Your Conditions → Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You tell us what you want and what your body deals with — we do the thinking. Every meal, workout, and lifestyle tip is calculated to satisfy all your conditions at once.
            </p>
          </div>

          {/* Flow diagram */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-16">
            {[
              { label: "Your Profile",    desc: "Goals, conditions, preferences",     icon: "👤", bg: "bg-sky-500" },
              { label: "→", desc: "", icon: "", bg: "" },
              { label: "Smart Engine",   desc: "Builds rules for your health",        icon: "⚙️", bg: "bg-violet-500" },
              { label: "→", desc: "", icon: "", bg: "" },
              { label: "Your Plan",      desc: "Meals, workouts & lifestyle tips",    icon: "✅", bg: "bg-emerald-500" },
            ].map((step, i) =>
              step.label === "→" ? (
                <div key={i} className="text-center text-3xl text-gray-300 hidden md:block">→</div>
              ) : (
                <div key={step.label} className="rounded-2xl p-6 bg-white border border-gray-100 shadow-card text-center">
                  <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3`}>
                    {step.icon}
                  </div>
                  <div className="font-bold text-gray-900 mb-1">{step.label}</div>
                  <div className="text-sm text-gray-600">{step.desc}</div>
                </div>
              )
            )}
          </div>

          {/* Multi-constraint example */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white">
            <div className="text-sm font-semibold text-sky-400 mb-4">REAL EXAMPLE — Multi-Constraint Optimization</div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-sky-300 font-bold uppercase tracking-wider mb-3">User Profile</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm"><span className="text-violet-400">Goal:</span> Muscle Gain</div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-red-400">Condition:</span> Type 2 Diabetes</div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-red-400">Condition:</span> Kidney Stones</div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-red-400">Condition:</span> Hypertension</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-sky-300 font-bold uppercase tracking-wider mb-3">Applied Constraints</div>
                <div className="space-y-2">
                  {[
                    { type: "ENFORCE", text: "Low GI foods only (T2D)" },
                    { type: "ENFORCE", text: "Oxalate < 10mg/serving (Stones)" },
                    { type: "ENFORCE", text: "Sodium < 1500mg/day (HTN)" },
                    { type: "LIMIT",   text: "Protein 0.75g/kg (not excess)" },
                    { type: "PREFER",  text: "High fiber, potassium-rich" },
                  ].map((c) => (
                    <div key={c.text} className={`policy-badge text-xs ${
                      c.type === "ENFORCE" ? "policy-badge-enforce" :
                      c.type === "LIMIT"   ? "policy-badge-limit" : "policy-badge-prefer"
                    }`}>
                      {c.type === "ENFORCE" ? "🚫" : c.type === "LIMIT" ? "⚠️" : "✓"} {c.text}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-sky-300 font-bold uppercase tracking-wider mb-3">Optimized Output</div>
                <div className="space-y-2 text-sm text-emerald-300">
                  <div>✓ Masoor Dal over chicken (lower oxalate, low GI)</div>
                  <div>✓ Brown rice over white (low GI, high fiber)</div>
                  <div>✓ No spinach (high oxalate)</div>
                  <div>✓ Low-sodium paneer preparation</div>
                  <div>✓ Post-meal walks for glucose control</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Enterprise-Grade Health Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for people with complex health needs — not generic calorie counters.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl p-7 border border-gray-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONDITIONS */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Supports 8 Chronic Conditions</h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Each condition adds clinical constraints to your personal recommendation engine.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CONDITIONS.map((c) => (
              <div key={c.code} className="rounded-2xl p-5 bg-white border border-gray-100 shadow-card hover:shadow-card-hover transition-all cursor-default">
                <div className="text-3xl mb-3">{c.icon}</div>
                <div className="font-bold text-gray-900 text-sm mb-1">{c.label}</div>
                <div className="text-xs text-gray-600 leading-relaxed">{c.impact}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOALS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">8 Supported Health Goals</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {GOALS.map((g) => (
              <div key={g.value} className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold ${g.color}`}>
                <span>{g.icon}</span>{g.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-sky-600 via-violet-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Ready to meet your<br />healthCopilot?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
            Onboard in 5 minutes. Get a condition-aware, AI-explained health plan
            that no generic app can match.
          </p>
          <Link
            href="/onboarding/profile"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-violet-700 font-black rounded-2xl text-xl hover:scale-105 transition-transform shadow-2xl"
          >
            Build My Plan — Free
            <span className="text-2xl">→</span>
          </Link>
          <p className="mt-6 text-sm text-white/80">
            Not medical advice. Always consult your healthcare provider for clinical decisions.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center font-bold">H</div>
            <span className="font-bold">healthCopilot</span>
          </div>
          <p className="text-sm text-slate-400">
            AI-powered health recommendations. Educational use only — not a substitute for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
