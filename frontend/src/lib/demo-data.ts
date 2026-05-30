/**
 * Static demo helpers for the GitHub Pages build (no backend).
 *
 * Meal plans, macros, workouts, lifestyle and the user summary are all generated
 * dynamically from the user's onboarding selections — see recommendation-engine.ts.
 * This file only holds the few pieces that don't depend on the live profile:
 * the demo user id, the AI chat fallbacks, and sample progress history.
 */

export const DEMO_USER_ID = "demo-user";

// ─── Chat responses ────────────────────────────────────────────────────────────
const DEMO_CHAT_RESPONSES: Record<string, string> = {
  default:
    "Great question! Your plan is generated from the profile you entered during onboarding — your age, goal, medical conditions, cuisine and protein preference all shape what's recommended. This is a **demo response**; connect the live backend with an Anthropic API key for fully personalised AI answers.\n\n---\n*This is educational information, not medical advice. Consult your healthcare provider.*",
  spinach:
    "Spinach is very high in **oxalates**, which can contribute to calcium-oxalate kidney stone formation in susceptible individuals. If you selected a kidney-stone history during onboarding, the engine automatically swaps it for low-oxalate greens like cauliflower. For most other profiles it's beneficial (low GI, high potassium).\n\n---\n*This is educational information, not medical advice.*",
  oats:
    "Oats are **low glycemic index (GI 55)** and rich in **soluble fiber (beta-glucan)**, which slows glucose absorption — ideal if your profile includes Type 2 Diabetes or Prediabetes. They're also naturally low in sodium, fitting the DASH protocol for Hypertension.\n\n---\n*This is educational information, not medical advice.*",
  protein:
    "Your protein target is computed from your weight, goal and conditions using the Mifflin-St Jeor equation. Weight loss uses ~1.8 g/kg to preserve muscle in a deficit; muscle gain goes up to ~2.2 g/kg. If you selected Chronic Kidney Disease, protein is capped near 0.75 g/kg to protect kidney function. Sources adapt to your protein preference — plant proteins for vegetarians/vegans, fish for pescatarians, lean meat for non-vegetarians.\n\n---\n*This is educational information, not medical advice.*",
  meditation:
    "Meditation is a powerful clinical tool. Regular practice **reduces cortisol by up to 31%** — and since cortisol raises both blood pressure and blood glucose, it has direct therapeutic value if you have Hypertension or Diabetes. Start with **4-7-8 breathing** (5 min, 3× per day) and progress to a 10-minute body scan at bedtime.\n\n---\n*This is educational information, not medical advice.*",
  muscle:
    "For muscle gain I target **~2.2 g protein per kg** of body weight, spread across all five meals (not just dinner) with post-workout protein within 30–60 minutes. For vegetarians I combine complementary plant proteins (rajma + rice) for a complete amino profile; soya chunks, paneer, tofu and Greek yoghurt are the highest-protein vegetarian staples.\n\n---\n*This is educational information, not medical advice.*",
  aging:
    "Healthy-aging nutrition rests on four pillars: (1) adequate protein (~1.4 g/kg) to prevent sarcopenia; (2) anti-inflammatory foods — turmeric, walnuts, berries, fatty fish; (3) bone density — calcium, vitamin D, magnesium; (4) gut health — 30+ g fiber and fermented foods. The plan also schedules joint-friendly chair yoga and balance work.\n\n---\n*This is educational information, not medical advice.*",
};

export function getDemoChatResponse(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("spinach")) return DEMO_CHAT_RESPONSES.spinach;
  if (m.includes("oat")) return DEMO_CHAT_RESPONSES.oats;
  if (m.includes("protein")) return DEMO_CHAT_RESPONSES.protein;
  if (m.includes("meditat") || m.includes("breath") || m.includes("calm")) return DEMO_CHAT_RESPONSES.meditation;
  if (m.includes("muscle") || m.includes("gain") || m.includes("bulk")) return DEMO_CHAT_RESPONSES.muscle;
  if (m.includes("aging") || m.includes("ageing") || m.includes("elder") || m.includes("senior")) return DEMO_CHAT_RESPONSES.aging;
  return DEMO_CHAT_RESPONSES.default;
}

// ─── Progress history (sample trend data) ───────────────────────────────────────
export const demoProgressHistory = {
  logs: Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      log_date: d.toISOString().slice(0, 10),
      weight_kg: Math.round((84 - i * 0.15) * 10) / 10,
      calories_consumed: 1850 + Math.round(Math.sin(i) * 120),
      sleep_hours: Math.round((6.5 + Math.sin(i / 2) * 0.8) * 10) / 10,
      steps_count: 6500 + Math.round(Math.cos(i) * 2000),
      mood_score: 3 + (i % 3 === 0 ? 1 : 0),
    };
  }),
};
