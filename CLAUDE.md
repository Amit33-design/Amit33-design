# healthCopilot — Project Memory File

> **READ THIS FIRST every session.** It replaces re-exploring the codebase and saves tokens.
> After finishing any work: update the **Changelog** and **Improvement Backlog** sections below, then commit.

## ⛔ Critical constraints — never violate

- **NEVER touch the other Vercel project**: `project-pk174` / repo `Network-Automation` / `netdesignai.com` is a separate LIVE website. Do not modify, deploy, or configure anything there.
- Work happens on branch **`main`** of `Amit33-design/Amit33-design` (pushing `main` auto-deploys to Vercel → https://amit33-design.vercel.app).
- No user-facing networking jargon ("intent-based networking", "policy engine", "constraint graph", "Most Restrictive Wins") — user explicitly asked for plain health language everywhere.
- Medical disclaimer must remain on dashboard/report surfaces.

## What this is

AI-powered personal health platform (demo mode, no backend): condition-aware meal plans, workouts, recipes, lifestyle tips, progress tracking, email/PDF report. Next.js 15.5 static export, all logic client-side.

- `frontend/` — the whole app. Build: `cd frontend && npm run build` (run `npm install` first if node_modules is missing — container resets wipe it).
- `NEXT_PUBLIC_DEMO_MODE=true` in `.env.production` → everything generated client-side by the recommendation engine.
- Email report needs EmailJS env vars in Vercel (`NEXT_PUBLIC_EMAILJS_SERVICE_ID/TEMPLATE_ID/PUBLIC_KEY`) — placeholders in `.env.production`; PDF download works without setup (html2canvas + jspdf, dynamic imports).

## Key files (all under `frontend/src/`)

| File | What it is |
|---|---|
| `lib/recommendation-engine.ts` (~1200 lines) | THE core: ~95-food library, condition rules, Mifflin-St Jeor macros, 3-phase meal generator (select → portion-scale → materialise), workout templates |
| `lib/recipes-data.ts` | 45+ recipes keyed by food id **without** `food-` prefix |
| `lib/local-store.ts` | localStorage progress persistence (`health-copilot-progress`) |
| `lib/api-client.ts` | demo-mode router → engine + local-store |
| `lib/constants.ts` | goals, conditions, activity levels, cuisines, diets, medications |
| `app/dashboard/*` | overview, nutrition, workouts, lifestyle, recipes, progress, report, ask |
| `store/onboarding-store.ts` | Zustand onboarding state (localStorage `health-copilot-onboarding`) |

## Data-shape gotchas (caused real bugs before)

- Meal plan has `plan.meals[]` (NOT `plan.slots[]`); items have `item.food.id` (prefixed `food-`) and `item.food.name` (NOT `item.food_id` / `item.name`).
- Recipe lookup: strip prefix → `foodId.replace(/^food-/, "")`.
- Diet values: `vegetarian | non_vegetarian | vegan | pescatarian`; Indian vegetarian = NO eggs (handled by `eggAllowed()`).
- Goals include `diabetes_friendly` and `blood_pressure_management` — any new `Record<goal, …>` map must cover all 8 goals in `constants.ts`.
- CKD is a HARD clinical cap: total plan protein must never exceed 0.75 g/kg after any scaling change. The sweep test checks this.

## Engine verification harness (use after ANY engine change)

```bash
cd frontend
SCRATCH=<scratchpad dir>
npx esbuild src/lib/recommendation-engine.ts --bundle --format=esm --platform=node --outfile="$SCRATCH/engine.mjs"
# then run a sweep over goals × conditions × cuisines × diets asserting:
# 0 crashes, 0 empty meal slots, 0 CKD protein-cap violations, avg fit ≥ ~90%
```
(Recreate `sweep.mjs`/`run-test.mjs` from the pattern in the 2026-07-07 session if scratchpad was wiped: 768 combos, checks `plan.fit`, meal item counts, CKD `total_protein_g ≤ 0.75*kg*1.15`.)

## How the meal engine works (current design)

1. **computeMacros**: BMR → TDEE → goal calorie adj (+ safe floor 1200♀/1500♂) → goal protein g/kg (CKD override 0.75) → goal fat% → carbs remainder (≤40% cal for diabetes).
2. **Phase 1 select**: per slot, filter safe foods (diet, cuisine w/ fallback, egg rule, condition excludes), rank by preferenceScore + seeded daily jitter, pick anchor-first.
3. **Phase 2 portion-scale**: decoupled levers — protein-dense items steered to protein target, energy items to remaining calories, within per-group `scaleBounds`; drop items for very low targets; final CKD trim/drop pass.
4. **Phase 3 materialise**: `toMealItem(food, slot, scale)` → scaled qty/macros + `serving_scale`; plan returns `fit` {calories, protein, carbs, fat, overall %} shown as "Plan Match" strip on nutrition page.

## Changelog (newest first)

- **2026-07-07 (3)** Medication-aware meal summary: `buildSummary` now weaves up to 2 medication guidance lines (insulin carb spread, metformin with meals, levothyroxine before breakfast, warfarin vitamin-K consistency, diuretic potassium) into `ai_summary` — shows on nutrition page + report. Lifestyle page already had full `medication_notes` tips.
- **2026-07-07 (2)** Backlog items 1–3 shipped: +12 calorie-dense healthy foods (pb-banana-toast, granola-yogurt, banana-pb-smoothie, dates-nut-laddoo, dried-fruit-mix, mango, sweet-corn-chaat, veg-biryani-brown, ww-pasta, couscous-chickpea, baked-potato, paneer-rice-bowl) + engine adds one extra item/slot when target > 2800 kcal → muscle-gain fit 72%→91-98%. Recipe coverage: 97 recipes, all cooked dishes covered; remaining 19 are ready-to-eat whole foods with a green "no cooking needed" fallback card. UI: "portion tuned for you" hint in MealCard (serving_scale ≥ ±10%), Plan Match % chip on dashboard overview.
- **2026-07-07** Portion-scaling engine rewrite: goal coverage complete, safe calorie floor, goal fat splits + diabetes carb ceiling, decoupled protein/energy scaling, hard CKD enforcement, `fit` score + Plan Match UI. Sweep: 768 combos, 0 crashes/violations, ~90% avg fit.
- **2026-07-07** Report page: EmailJS direct send + html2canvas/jsPDF colored PDF; env placeholders added.
- **Earlier** localStorage progress + CSV export; Recipes page; 5 strength-training templates; Daily Wellness Habits dashboard section; jargon removal + contrast fixes; purple gradient stat cards.

## Improvement Backlog (next iterations — keep updated)

1. **Weekly view** — 7-day rotating plan (daySeed already supports per-day variation) + grocery list generation.
2. **Progress-aware feedback loop** — use logged weight trend to auto-adjust calorie target (e.g. ±100 kcal if losing too fast/slow).
3. **Medication-aware food selection** — summary notes + lifestyle tips done; deeper step would be engine-level effects (e.g. enforce steady leafy-green servings for warfarin users, cap potassium foods with ACE/ARB).
4. **Alternatives portion-scaling** — swap options currently shown at 1× serving; scale them to slot context on swap.
5. **Unit tests in repo** — move the ad-hoc sweep into `frontend/src/lib/__tests__/` with vitest so CI can run it.
6. **Muscle-gain protein overshoot** — 3650 kcal case lands P 230 vs 202 target (86% fit); could trim protein scales when calories are satisfied but protein is over.
7. **Cross-device sync** — would need real backend/login; localStorage is single-device (documented on Progress page).
8. **EmailJS setup** — user still needs to add the 3 env vars in Vercel for email sending to go live.

### Done (moved from backlog)
- ~~Expand food library for high-calorie targets~~ ✓ 2026-07-07 (2)
- ~~Plan Match on dashboard + portion-tuned hint~~ ✓ 2026-07-07 (2)
- ~~Recipes for newer foods~~ ✓ 2026-07-07 (2) — verify with coverage script when adding foods: every cooked dish needs a recipe; ready-to-eat foods fall back to the green card.

## Session-start checklist

1. Read this file (you just did). 2. `git checkout main && git pull origin main` (work landed on `main`, feature branch `claude/health-platform-research-moSzh` is stale/behind). 3. `cd frontend && npm install` if node_modules missing. 4. Build + verify before every push; update Changelog/Backlog here after every change.
