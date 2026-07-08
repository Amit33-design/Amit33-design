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
cd frontend && npm test   # vitest — src/lib/__tests__/recommendation-engine.test.ts
```
11 tests: 768-combo sweep (0 crashes, 0 empty slots, CKD cap ≤ 0.75g/kg×1.15, avg fit ≥ 85%, no GI≥70 for T2D), safe calorie floor, ±150 kcal adjustment clamp, goal coverage, ≥5 alternatives, alt portion-scaling, muscle-gain protein ≤ 1.15× target, no egg dishes for Indian vegetarians, weekly variety + grocery aggregation.

## How the meal engine works (current design)

1. **computeMacros**: BMR → TDEE → goal calorie adj (+ safe floor 1200♀/1500♂) → goal protein g/kg (CKD override 0.75) → goal fat% → carbs remainder (≤40% cal for diabetes).
2. **Phase 1 select**: per slot, filter safe foods (diet, cuisine w/ fallback, egg rule, condition excludes), rank by preferenceScore + seeded daily jitter, pick anchor-first.
3. **Phase 2 portion-scale**: decoupled levers — protein-dense items steered to protein target, energy items to remaining calories, within per-group `scaleBounds`; drop items for very low targets; final CKD trim/drop pass.
4. **Phase 3 materialise**: `toMealItem(food, slot, scale)` → scaled qty/macros + `serving_scale`; plan returns `fit` {calories, protein, carbs, fat, overall %} shown as "Plan Match" strip on nutrition page.

## Changelog (newest first)

- **2026-07-08** Medication tracker + reminders on Progress page: `local-store.ts` med APIs (getUserMedications reads onboarding store, getMedsTaken/toggleMedTaken per-date log `health-copilot-med-log`, getMedAdherence, reminder settings `health-copilot-med-reminders`, markReminderFired dedupe). `MedicationTracker` component (checklist w/ icons+notes, 7-day adherence dots, reminder toggle w/ Notification permission, per-med time inputs seeded from `MED_DEFAULT_TIMES` in constants — clinical defaults e.g. levothyroxine 06:30, statins 21:00). `MedicationReminders` invisible runner in dashboard layout fires browser notifications (30s poll, fires up to 3h late, skips taken doses). Notifications only fire while app is open (no backend/service worker). Playwright-verified end-to-end.
- **2026-07-07 (7)** Dietician composition rules: `SLOT_GROUP_CAPS` (1 dish/group/meal, vegetables 2; `HIGH_CAL_BONUS_GROUPS` +1 for grains/dairy/nuts/protein when >2800 kcal), lunch+dinner get guaranteed vegetable pre-add, mid-morning leads with whole fruit, drop-pass never removes a main meal's last vegetable, `generateMealPlan(input, dayOffset, weeklyUsage?)` ranks heavily-served dishes lower (−1.5/use) → weekly max repetition 7×→4×. Audit found & fixed: dal+rajma same lunch, salmon+prawns same meal, no-fruit days, missing sabzi. 19 vitest tests (4 new composition tests). Fits held: muscle 95-97%, sweep 89.3%.
- **2026-07-07 (6)** Shoppable grocery + plan-aware AI Copilot: grocery items carry `food_id` (recipe key); weekly page 🧾 toggle shows raw recipe ingredients per cooked dish ("you'll make it N×"), copy-list includes them. New `answerHealthQuestion(input, message)` in engine replaces canned demo chat: food-safety answers matched from the food library (token match, STOP_WORDS incl. macro words like "protein" so target questions don't hit foods), slot questions return today's actual items, macro/water/sleep/weight/workout intents answered from computeMacros/generateLifestyle, fallback = personalised overview. 15 vitest tests now (added 4 Q&A tests).
- **2026-07-07 (5)** Engine refinements + vitest: protein-overshoot trim (calories on target but protein >1.08× → shrink biggest protein contributors, re-steer energy; muscle-gain 3650 kcal now 96% overall, was 83%), alternatives portion-scaled to slot context (sized toward mean picked-item calories), medication-aware scoring (ACE/ARB → −3 on high-K foods, diuretics → +2). Ad-hoc sweep moved into repo: `npm test` runs 11 vitest tests incl. full 768-combo sweep. Test gotcha: don't substring-match "egg" (matches "V*egg*ies") — use egg-dish id list.
- **2026-07-07 (4)** Weekly plan + feedback loop: `generateWeeklyPlan` (7 × `generateMealPlan(input, dayOffset)` via offset-aware `daySeed`) returns days[] + grouped grocery list (aggregated `quantity_g`, `times` count) + avg_fit; new page `/dashboard/nutrition/weekly` (day tabs, compact meals, checkable grocery list, copy-to-clipboard) linked from nutrition header. Progress feedback loop: `progressCalorieAdjustment(goal)` in api-client reads 21-day weight trend from local logs (needs 2 entries ≥7 days apart) → ±100 kcal nudge via `input.calorie_adjustment` (engine clamps ±150, goal-aware explanation in ai_summary). NOTE: `getLocalProgressHistory` returns `{ logs: [...] }` not an array.
- **2026-07-07 (3)** Medication-aware meal summary: `buildSummary` now weaves up to 2 medication guidance lines (insulin carb spread, metformin with meals, levothyroxine before breakfast, warfarin vitamin-K consistency, diuretic potassium) into `ai_summary` — shows on nutrition page + report. Lifestyle page already had full `medication_notes` tips.
- **2026-07-07 (2)** Backlog items 1–3 shipped: +12 calorie-dense healthy foods (pb-banana-toast, granola-yogurt, banana-pb-smoothie, dates-nut-laddoo, dried-fruit-mix, mango, sweet-corn-chaat, veg-biryani-brown, ww-pasta, couscous-chickpea, baked-potato, paneer-rice-bowl) + engine adds one extra item/slot when target > 2800 kcal → muscle-gain fit 72%→91-98%. Recipe coverage: 97 recipes, all cooked dishes covered; remaining 19 are ready-to-eat whole foods with a green "no cooking needed" fallback card. UI: "portion tuned for you" hint in MealCard (serving_scale ≥ ±10%), Plan Match % chip on dashboard overview.
- **2026-07-07** Portion-scaling engine rewrite: goal coverage complete, safe calorie floor, goal fat splits + diabetes carb ceiling, decoupled protein/energy scaling, hard CKD enforcement, `fit` score + Plan Match UI. Sweep: 768 combos, 0 crashes/violations, ~90% avg fit.
- **2026-07-07** Report page: EmailJS direct send + html2canvas/jsPDF colored PDF; env placeholders added.
- **Earlier** localStorage progress + CSV export; Recipes page; 5 strength-training templates; Daily Wellness Habits dashboard section; jargon removal + contrast fixes; purple gradient stat cards.

## Improvement Backlog (next iterations — keep updated)

1. **Report/email weekly section** — the report page could include the 7-day overview + grocery list (PDF captures reportRef div; email HTML built separately in buildEmailHtml).
2. **Warfarin leafy-green consistency** — would need week-level coordination (same greens portion daily); day-seeded generation makes this non-trivial. Summary note exists.
3. **Cross-device sync** — would need real backend/login; localStorage is single-device (documented on Progress page).
4. **EmailJS setup** — user still needs to add the 3 env vars in Vercel for email sending to go live.
5. **Q&A follow-ups** — answerHealthQuestion could suggest dynamic follow-up chips (api response has suggested_questions field the ask page may not render yet).

### Done (moved from backlog)
- ~~Grocery raw-ingredient decomposition (🧾 per dish via recipes data)~~ ✓ 2026-07-07 (6)
- ~~Plan-aware AI Copilot (answerHealthQuestion)~~ ✓ 2026-07-07 (6)
- ~~CI hook (.github/workflows/ci.yml: npm ci + test + build on push/PR)~~ ✓ 2026-07-07 (5)
- ~~Medication-aware food selection (ACE/ARB high-K penalty, diuretic boost)~~ ✓ 2026-07-07 (5)
- ~~Alternatives portion-scaling~~ ✓ 2026-07-07 (5)
- ~~Unit tests in repo (vitest, `npm test`)~~ ✓ 2026-07-07 (5)
- ~~Muscle-gain protein overshoot trim~~ ✓ 2026-07-07 (5)
- ~~Weekly view + grocery list~~ ✓ 2026-07-07 (4)
- ~~Progress-aware feedback loop~~ ✓ 2026-07-07 (4)
- ~~Expand food library for high-calorie targets~~ ✓ 2026-07-07 (2)
- ~~Plan Match on dashboard + portion-tuned hint~~ ✓ 2026-07-07 (2)
- ~~Recipes for newer foods~~ ✓ 2026-07-07 (2) — verify with coverage script when adding foods: every cooked dish needs a recipe; ready-to-eat foods fall back to the green card.

## Session-start checklist

1. Read this file (you just did). 2. `git checkout main && git pull origin main` (work landed on `main`, feature branch `claude/health-platform-research-moSzh` is stale/behind). 3. `cd frontend && npm install` if node_modules missing. 4. `npm test` + `npm run build` before every push; update Changelog/Backlog here after every change.
