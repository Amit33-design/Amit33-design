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
| `lib/protein-quality.ts` | DIAAS + leucine per source; `analyseMealProtein` credits grain+pulse complementarity, flags meals under the ~2.5g leucine threshold; `analyseDayProtein` gives usable-protein score + diet-aware advice. |
| `lib/nutrition-data.ts` | Per-serving micronutrients for all 137 foods (Na, K, Ca, Fe, B12, vit D, Mg, omega-3, satfat, sugar, NOVA). `getMicros(id, group, cal)` falls back to group profile if a food is missing. |
| `lib/diet-phase.ts` | cut/maintenance/reverse/bulk state machine. `assessPhase` uses measured-vs-formula TDEE (<92% after 6+ weeks) to detect real metabolic adaptation and urge a break; `phaseCalorieShift` cancels the deficit during a break. Phase stored in `health-copilot-diet-phase`. |
| `lib/adaptive-tdee.ts` | Solves real expenditure from logged intake + weight trend. OLS slope on RAW weights (EWMA only for display — fitting the smoothed series biases slope toward zero and inflates targets), `blendTdee` confidence-weights vs formula, `paceFeedback` nudges. |
| `lib/training-science.ts` | Exercise dose layer: `EXERCISE_LIBRARY` (single source of truth — name/primary/secondary/equipment/avoid; `EXERCISE_MUSCLES` + `musclesFor` derive from it, `ALIASES` maps template names to canonical movements), `substituteExercise` (equipment+injury-aware swaps), exercise→muscle map, weekly set volume, e1RM (Brzycki/Epley), progression + stall-triggered deload, HR zones (Tanaka), step target. |
| `lib/recipes-data.ts` | 116 recipes keyed by food id **without** `food-` prefix. 19 ready-to-eat whole foods (fruit/nuts/curd/tea) intentionally have none — they render the green "no cooking needed" card. |
| `lib/local-store.ts` | localStorage: progress (`health-copilot-progress`), medications (`-med-log`/`-med-reminders`), **strength sets** (`-lift-log`: `logLiftSet`/`getExerciseHistory`/`weeks_at_same_load`) |
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
83 tests (5 files) covering: adaptive TDEE (simulated users with known true expenditure — recovers within 10%, under-reporting cancels in the final target, refuses impossible values, stays silent under ~2 weeks of data), 768-combo sweep (0 crashes, 0 empty slots, CKD cap, avg fit >= 85%, no GI>=70 for T2D),
macro safety (BMR floor, 25% max deficit, protein RISES in deficit, +-150 kcal clamp — use an active profile
so the floor doesn't mask the clamp), dietician composition rules, micronutrients (DASH 1500mg cap, iron raised
for plant/menstruating, no false "over" for omega-3/plant iron, vegan B12 -> supplement advice, free sugars
exclude whole fruit, protein-per-meal spread, GL band), training dose (no untrained muscle except calves,
half-credit secondary movers, 1RM refused >10 reps, deload on stall not calendar, step target <= 8000,
HTN cardio caution, Tanaka HRmax), and strength logging (`lift-log.test.ts` — stub localStorage via a MemoryStorage on BOTH `globalThis.window` and `globalThis.localStorage`, since the store guards on `typeof window`), and exercise substitution (`exercise-swap.test.ts` — equipment blocking, injury blocking, same-muscle alternatives, every muscle has a home-friendly option, alias resolution), and **choice coverage** (every cuisine x diet x condition x slot must offer >=10 choices; >=7 distinct dishes per slot across a week; **no dish auto-served >4x/week on ANY diet x cuisine** — testing only the default diet hid a 7x vegan repeat), and protein quality (`protein-quality.test.ts` — dal < paneer usability, complementarity beats either alone, leucine threshold, real plans >=70% usable), and diet phases (`diet-phase.test.ts` — adaptation detection needs 6+ weeks AND confidence >=0.5, long-cut urging, 2-week break return, honest reverse-diet framing, phase shift cancels deficit).

## How the meal engine works (current design)

1. **computeMacros**: BMR → TDEE → goal calorie adj (+ safe floor 1200♀/1500♂) → goal protein g/kg (CKD override 0.75) → goal fat% → carbs remainder (≤40% cal for diabetes).
2. **Phase 1 select**: per slot, filter safe foods (diet, cuisine w/ fallback, egg rule, condition excludes), rank by preferenceScore + seeded daily jitter, pick anchor-first.
3. **Phase 2 portion-scale**: decoupled levers — protein-dense items steered to protein target, energy items to remaining calories, within per-group `scaleBounds`; drop items for very low targets; final CKD trim/drop pass.
4. **Phase 3 materialise**: `toMealItem(food, slot, scale)` → scaled qty/macros + `serving_scale`; plan returns `fit` {calories, protein, carbs, fat, overall %} shown as "Plan Match" strip on nutrition page.

## Changelog (newest first)

- **2026-07-08 (9)** Diet-phase state machine (last substantive backlog item). `diet-phase.ts`: cut → maintenance → reverse → bulk. Because adaptive TDEE now MEASURES expenditure, adaptation is **observed not assumed** — `measuredTdee/formulaTdee < 0.92` after 6+ weeks cutting (and confidence >=0.5) triggers an urgent "take a break" with the actual % shortfall. Also urges at 12 weeks, suggests at 8, flags 4-week stalls. Maintenance returns to cut after 2 weeks. `DietPhaseCard` on Progress page shows burn-vs-predicted bar + one-tap phase switch; phase + history in `health-copilot-diet-phase`.
  **BUG FOUND & FIXED:** the phase shift (+400 for a maintenance break) was being squashed by the ±150 `calorie_adjustment` clamp meant for the gentle weight-trend nudge — so the app would prescribe a break then hand out near-cutting calories (1850→2000 instead of 2250). Added a SEPARATE `phase_shift` input applied outside the clamp. Test locks both behaviours.
  Honest framing kept in copy: reverse dieting says "no good evidence food repairs metabolism — this is about not overshooting"; diet-break rationale leans on adherence as much as the (small) trial literature.

- **2026-07-08 (8)** Protein QUALITY for plant eaters (backlog #2). New `protein-quality.ts`: DIAAS + leucine per source (dairy 1.10-1.15, soy 0.90, legumes 0.65, grains 0.45), `analyseMealProtein` credits **grain+pulse complementarity** (each >=3g protein → paired portion re-scored 0.55→0.80, the dal-chawal mechanism) and flags meals under the ~2.5g leucine threshold for muscle protein synthesis. Measured: Indian vegan 79% usable vs vegetarian 93% — the plant penalty is real. Vegan breakfasts sat at 2.26-2.48g leucine, JUST under threshold. **Fix that worked: added `soy-milk` (fortified) + `tofu-oats-bowl`** → vegan usable 79→85%, repair-triggering meals 16/21→21/21, AND B12 0→2.3µg (fixed the critical deficiency too). A DIAAS scoring boost in `preferenceScore` was tried and REMOVED — it changed nothing (composition/complementarity dominates); plant per-meal protein target ×1.1 kept instead.
  THREE VARIETY BUGS this exposed: (1) anchor selection hard-filtered `p >= perMealProtein*0.55` then took [0] — where one food cleared the bar it was served 7/7 days (Med veg egg-omelette) regardless of penalty; now a +6 score bonus, not a gate. (2) linear weekly penalty → escalating `pow(usage,1.7)*3.5`. (3) Added a HARD `WEEKLY_AUTO_CAP = 4` filter on `ranked` — tuning coefficients could never guarantee it where a slot has few eligible foods. Capped dishes stay as swap options. Result: most-repeated dish 7x → 2-4x, 54-79 distinct dishes/week. Also: vegan B12 action now fires even when the target is MET, explaining it comes from fortification not plants.

- **2026-07-08 (7)** Meal variety — user reported Indian veg dinner showed only 5 options. ROOT CAUSE was not the food library (raw eligibility was already 11-33 per combo) but the alternatives cap: `Math.max(5, 8 - picked.length)` in Phase 1. Raised to a flat 10. Then measured all 84 profile x 5 slot combos and found the one genuine library gap: **Mediterranean/Western vegan breakfast** (7-9 options). Added 19 foods + full nutrient rows + 19 recipes: 13 Indian veg mains (dal-tadka, chana-masala, matar-paneer, paneer-tikka, aloo-gobi-matar, veg-kofta, soya-keema, curd-rice, palak-dal, stuffed-capsicum, veg-uttapam, sabudana-khichdi, masala-oats) and 6 med/western vegan breakfasts (overnight-oats-vegan, tofu-scramble-med, socca, hummus-toast, date-almond-smoothie, avocado-bean-toast). Now 135 foods / 135 nutrient rows / 116 recipes; **every slot in every profile offers >=10 choices** (min was 5). Weekly distinct for Indian veg: breakfast 13, lunch 20, dinner 16. Locked by 2 new tests. GOTCHA when appending to recipes-data.ts with a script: the file ends `},\n};` — stripping `};` and re-adding leaves `},,`.

- **2026-07-08 (6)** Equipment- and injury-aware exercise substitution (research: highest-leverage exercise feature for adherence). `EXERCISE_LIBRARY` in `training-science.ts` is now the single source of truth — 45 movements with `equipment[]` and `avoid[]` (knee/shoulder/lower_back/wrist/hip/neck/balance); `EXERCISE_MUSCLES` derives from it and `ALIASES` maps template names ("Push-ups (knee or full)" → "push-up") so volume counting still resolves. `substituteExercise(name, {equipment, limitations})` returns `blocked` ("equipment"|"limitation"|null) + ranked alternatives sharing primary muscles, preferring least kit. Prefs in `local-store` (`health-copilot-training-prefs`: equipment/limitations/swaps). UI: `TrainingSetup` chips panel + `ExerciseSwap` inline flag & picker; `ExerciseRow` wrapper keys `ExerciseLogger` to the *swapped* name so lift history doesn't split across two names. GOTCHA: stricter matching after the refactor exposed senior templates had Core 0 sets/week (warm-ups don't count as volume) — added Seated march + Dead bug to the main circuits.

- **2026-07-08 (5)** Per-exercise strength logging — activates the progression engine that was written but dormant. `local-store.ts` gains `logLiftSet`/`removeLastLiftSet`/`getSetsFor`/`getExerciseHistory`/`loggedExercises` (key `health-copilot-lift-log`, pruned to 365 days). `getExerciseHistory` returns per-session bests (heaviest set, ties broken by reps) plus `weeks_at_same_load`, which is what feeds `progressionAdvice`'s stall-triggered deload. New `ExerciseLogger` component renders inline under each **main-circuit exercise that has sets AND reps** (timed cardio/stretches get no logger — nothing to progress); it prefills from last session, shows e1RM, the progression prescription, and a recent-sessions strip. Verified in browser: 60kg x 10 -> 80kg e1RM (Epley), and a seeded 3-session stall correctly prescribes the deload. GOTCHA: workout templates are date-seeded, so a browser test must read the rendered exercise name before seeding history for it.

- **2026-07-08 (4)** Adaptive TDEE (research P0 #1) — expenditure measured from the user's own logs instead of Mifflin-St Jeor. `computeAdaptiveTdee(logs)`: EWMA for *display* trend weight, **OLS slope on raw weights** for the rate (fitting the lagging EWMA under-states loss → inflates the target; simulation caught this as a −7% systematic error, fixed to −2%). `TDEE = meanIntake − kgPerDay×7700`. Confidence from span (28d) × density (14 logs); `blendTdee` weights measured vs formula and caps movement at ±25%. Rejects results outside 900–6000 kcal. Replaces the old crude ±100 nudge; `paceFeedback` now handles pace separately. KEY INSIGHT (in code comments + UI): self-report under-reporting of 10–30% **cancels** — a consistently low log yields a proportionally low expenditure and the prescribed deficit is still right; verified by test. New `MetabolismCard` on Progress page shows measured vs formula, trend weight, confidence, pace verdict.

- **2026-07-08 (3)** Competitive benchmark (Cronometer/MacroFactor/MFP/Zoe/Fitbod/January AI/HealthifyMe) → built the clinical layer they lack.
  NUTRITION: `nutrition-data.ts` (116 foods x 11 micronutrients). `computeMicroTargets` personalises by age/sex/diet/condition (DASH 1500mg; iron x1.8 plant, higher for menstruating women; CKD K restriction; satfat 6% for hyperlipidemia). Sodium now in **mg not categorical** — this exposed that our own HTN plans ran 70% over the DASH limit we claimed; fixed via mg-level scoring penalty + explicit low-sodium-cooking model (nova>=3 dishes get 62.5% of listed Na, surfaced to user). `atRiskNutrients()` drives bounded micro boosts in `preferenceScore` (caps matter — uncapped omega-3 boost made flax appear 6x/week and broke the variety test). Free sugars exclude whole fruit/plain dairy. "over" only fires against real ULs (omega-3/plant iron have none). Protein/kg RISES in deficit (capped 1.9 general / 2.2 active), BMR + 25%-deficit floors. Per-meal protein spread (~0.4g/kg) — fixing breakfast anchors took main meals meeting threshold 5/12 -> 10/12. GL attenuated for protein/fat, reported as band. Na:K ratio. `nutrient_actions` gives dietitian advice incl. honest "supplement B12" for vegans.
  EXERCISE: `training-science.ts`. Weekly sets/muscle with half-credit secondaries revealed **muscle-gain plans trained Back 0 sets/week** — fixed by replacing random template rotation with greedy coverage-aware selection (Back 0->12). Senior templates gained glute bridge + calf raise (posterior chain matters for falls). e1RM refuses >10 reps. Deload triggers on 3-week stall, NOT calendar (scheduled deloads can blunt strength). Cardio = weekly easy/hard distribution, not "zone 2 is magic". Step target 7-8k, not 10k.
  UI: `NutrientPanel` (nutrition page), `TrainingDosePanel` (workouts page). 37 tests, browser-verified.

- **2026-07-08 (2)** Report weekly section + Q&A follow-up chips + date-seed robustness: report page (screen + PDF + email HTML) gains "Week at a Glance" table (day × breakfast/lunch/dinner mains) + grocery categories; `askHealthCopilot(input, msg)` wraps answerHealthQuestion returning `{response, suggested_questions}` (intent-based, personalised with a food from the user's own alternatives) — ask page chips refresh after every answer ("Ask next:"). Engine: protein-overshoot trim now drops smallest protein dish when portion floors bottom out, then last-resort half-portion trim guarantees ≤1.15× on ANY date seed (date rollover had flaked CI at 1.153×); muscle test now sweeps all 7 day offsets. GOTCHA: engine tests are date-seeded — new dates rotate different foods, so bounds must hold across offsets, not just today.
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

1. **Calves under-trained in ~8% of profiles** — minor; add a calf movement to more templates if it matters.
2. **Cross-device sync** — needs a real backend; localStorage is single-device.
3. **EmailJS setup** — user still needs the 3 env vars in Vercel for email sending to go live.

### Explicitly do NOT build (research-backed)
- **n-6:n-3 ratio as a target** — the ratio hypothesis is being dismantled; track absolute EPA+DHA instead.
- **CGM for non-diabetics** — 2026 evidence synthesis found no health benefit; Zoe dropped its glucose test in Sept 2025.
- **Calorie-density-only food colours (Noom-style)** — misclassifies nuts, olive oil, avocado, oily fish.
- **Adding wearable "calories burned" back to the eating budget** — 15–52% error erases the whole deficit.
- **Claiming to compute a personal MRV** — no app can measure it; use volume ranges.

### Done (moved from backlog)
- ~~Diet-phase state machine (cut/maintenance/reverse/bulk + adaptation-triggered breaks)~~ ✓ 2026-07-08 (9)
- ~~Leucine/DIAAS protein quality for plant eaters~~ ✓ 2026-07-08 (8)
- ~~Equipment/injury-aware exercise substitution~~ ✓ 2026-07-08 (6)
- ~~Per-exercise logging + progressive overload UI~~ ✓ 2026-07-08 (5)
- ~~Adaptive TDEE from logged data~~ ✓ 2026-07-08 (4)
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
