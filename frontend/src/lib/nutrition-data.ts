/**
 * Micronutrient database — per SERVING (matching each food's `qty` in the engine).
 *
 * Why this exists: tracking only calories and macros is what every consumer app
 * does, and it is exactly what dietitians criticise. Clinical quality needs
 * milligram-level minerals (a DASH sodium cap is meaningless as "low/med/high"),
 * and the deficiencies that actually bite in this app's target population —
 * Indian and vegetarian eaters — are B12, iron, vitamin D, calcium and omega-3.
 *
 * Values are per-serving estimates compiled from IFCT 2017 (Indian Food
 * Composition Tables) and USDA FoodData Central, rounded to sensible precision
 * and adjusted for typical home preparation (added salt/oil in cooked dishes).
 *
 * Tuple order (kept compact so the table stays readable):
 *   [ sodium_mg, potassium_mg, calcium_mg, iron_mg, b12_ug,
 *     vitaminD_ug, magnesium_mg, omega3_g, satfat_g, sugar_g, nova ]
 *
 * nova = NOVA processing class: 1 unprocessed/minimally processed,
 *        2 culinary ingredient, 3 processed, 4 ultra-processed.
 */

export type NutrientTuple = [
  number, number, number, number, number,
  number, number, number, number, number, number
];

export interface Micros {
  sodium_mg: number;
  potassium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  b12_ug: number;
  vitamin_d_ug: number;
  magnesium_mg: number;
  omega3_g: number;
  satfat_g: number;
  sugar_g: number;
  nova: number;
}

export const NUTRIENTS: Record<string, NutrientTuple> = {
  // ── Eggs & dairy ──────────────────────────────────────────────────────────
  "egg-boiled":        [124, 126,  50, 1.2, 1.1, 2.2, 10, 0.10,  3.3, 1.1, 1],
  "egg-bhurji":        [420, 190,  75, 2.0, 1.6, 3.0, 18, 0.15,  5.5, 2.0, 3],
  "egg-omelette":      [400, 260,  85, 2.3, 1.8, 3.3, 24, 0.18,  5.0, 2.5, 3],
  "greek-yogurt":      [ 65, 240, 200, 0.1, 1.3, 0.1, 20, 0.02,  2.4, 6.5, 1],
  "low-fat-curd":      [ 70, 260, 200, 0.1, 0.6, 0.1, 18, 0.01,  1.2, 7.5, 1],
  "paneer":            [ 40, 110, 480, 0.2, 0.9, 0.3, 22, 0.05,  8.0, 2.0, 2],
  "paneer-bhurji":     [430, 220, 500, 1.0, 0.9, 0.3, 32, 0.10, 11.0, 3.5, 3],
  "turmeric-milk":     [110, 380, 300, 0.2, 1.1, 2.5, 30, 0.02,  3.0,13.0, 3],
  "buttermilk":        [260, 300, 220, 0.1, 0.5, 0.1, 20, 0.01,  1.0, 8.0, 2],
  "cottage-cheese":    [370, 160, 120, 0.2, 0.9, 0.1, 12, 0.02,  2.8, 5.0, 2],
  "yogurt-parfait":    [ 70, 300, 210, 0.5, 1.2, 0.1, 28, 0.05,  2.2,11.0, 2],
  "fruit-yogurt":      [ 60, 320, 180, 0.5, 0.7, 0.1, 30, 0.10,  2.0,13.0, 2],
  "kadhi":             [520, 400, 260, 1.8, 0.5, 0.1, 55, 0.05,  2.5, 6.0, 3],
  "palak-paneer":      [480, 640, 520, 3.6, 0.8, 0.3, 80, 0.10,  8.5, 3.5, 3],
  "stuffed-paratha":   [450, 240, 320, 2.4, 0.6, 0.2, 45, 0.10,  5.5, 2.5, 3],
  "paneer-rice-bowl":  [520, 460, 500, 2.8, 0.9, 0.3, 90, 0.12,  7.0, 4.0, 3],
  "granola-yogurt":    [ 95, 420, 230, 2.2, 1.2, 0.1, 70, 0.15,  3.5,20.0, 3],
  "banana-pb-smoothie":[150, 780, 300, 1.4, 1.2, 2.5, 85, 0.05,  3.2,28.0, 3],
  "muesli-yogurt":     [ 90, 430, 220, 2.0, 0.8, 0.1, 65, 0.12,  2.5,16.0, 3],
  "yogurt-herb-salad": [180, 420, 190, 1.2, 0.5, 0.1, 35, 0.05,  2.0, 6.0, 2],
  "yogurt-pepper-cashew":[140, 380, 150, 1.5, 0.4, 0.1, 55, 0.05, 2.5, 7.0, 2],

  // ── Nuts & seeds ──────────────────────────────────────────────────────────
  "almonds":           [  0, 185,  66, 0.9, 0.0, 0.0, 68, 0.00,  1.0, 1.1, 1],
  "soaked-almonds":    [  0, 185,  66, 0.9, 0.0, 0.0, 68, 0.00,  1.0, 1.1, 1],
  "walnuts":           [  0,  88,  20, 0.6, 0.0, 0.0, 32, 1.85,  1.2, 0.5, 1],
  "pumpkin-seeds":     [  4, 160,  10, 1.7, 0.0, 0.0,110, 0.03,  1.6, 0.3, 1],
  "chia":              [  2,  49,  75, 0.9, 0.0, 0.0, 40, 2.10,  0.4, 0.0, 1],
  "flax":              [  6, 163,  51, 1.1, 0.0, 0.0, 78, 4.60,  0.8, 0.3, 1],
  "trail-mix":         [ 25, 220,  55, 1.4, 0.0, 0.0, 85, 0.55,  1.8, 3.0, 2],
  "olives-nuts":       [340, 130,  40, 0.9, 0.0, 0.0, 45, 0.10,  1.9, 0.8, 3],
  "almond-butter":     [180, 230,  95, 1.5, 0.0, 0.0, 75, 0.02,  1.4, 3.0, 3],
  "dried-fruit-mix":   [ 12, 420,  70, 1.6, 0.0, 0.0, 80, 0.45,  1.7,14.0, 2],
  "dates-nut-laddoo":  [  8, 380,  55, 1.4, 0.0, 0.0, 60, 0.30,  2.0,22.0, 2],
  "makhana":           [  6, 100,  18, 0.5, 0.0, 0.0, 25, 0.00,  0.3, 0.2, 2],

  // ── Fruit ─────────────────────────────────────────────────────────────────
  "berries":           [  1, 155,  25, 0.5, 0.0, 0.0, 18, 0.06,  0.0, 8.0, 1],
  "guava":             [  2, 500,  22, 0.3, 0.0, 0.0, 26, 0.13,  0.3, 9.0, 1],
  "apple":             [  2, 160,   9, 0.2, 0.0, 0.0,  8, 0.02,  0.1,16.0, 1],
  "banana":            [  1, 430,   6, 0.3, 0.0, 0.0, 32, 0.03,  0.1,14.0, 1],
  "orange":            [  0, 240,  52, 0.1, 0.0, 0.0, 13, 0.01,  0.0,12.0, 1],
  "papaya":            [  12, 270,  30, 0.4, 0.0, 0.0, 32, 0.04,  0.1,12.0, 1],
  "pear":              [  2, 175,  14, 0.3, 0.0, 0.0, 10, 0.00,  0.0,15.0, 1],
  "pomegranate":       [  3, 236,  10, 0.3, 0.0, 0.0, 12, 0.08,  0.1,14.0, 1],
  "mango":             [  2, 250,  17, 0.2, 0.0, 0.0, 15, 0.06,  0.1,20.0, 1],
  "figs-dates":        [  2, 280,  40, 0.5, 0.0, 0.0, 22, 0.00,  0.1,11.0, 1],

  // ── Fish, poultry, meat ───────────────────────────────────────────────────
  "chicken":           [130, 380,  15, 1.1, 0.5, 0.2, 40, 0.05,  1.4, 0.0, 1],
  "salmon":            [115, 640,  18, 0.7, 4.5,17.0, 44, 3.20,  3.1, 0.0, 1],
  "surmai":            [140, 520,  30, 1.0, 2.4, 8.0, 48, 0.90,  1.4, 0.0, 1],
  "seabass":           [120, 480,  20, 0.5, 2.8, 6.0, 45, 0.85,  1.3, 0.0, 1],
  "fish-curry":        [520, 560,  60, 1.8, 2.0, 6.0, 55, 0.80,  6.5, 2.5, 3],
  "tandoori-chicken":  [480, 400,  40, 1.4, 0.6, 0.2, 42, 0.06,  2.2, 1.5, 3],
  "grilled-prawns":    [340, 290,  90, 0.6, 1.6, 0.2, 48, 0.35,  1.0, 0.0, 2],
  "tuna-salad":        [380, 620, 110, 3.0, 2.2, 2.5, 75, 0.60,  1.4, 2.0, 3],
  "turkey-wrap":       [620, 620,  90, 2.4, 0.9, 0.3, 60, 0.10,  2.6, 3.0, 3],
  "chicken-quinoa-bowl":[300, 700,  70, 3.2, 0.5, 0.2,120, 0.10, 1.9, 3.0, 2],
  "egg-curry":         [500, 340,  90, 2.6, 1.2, 2.2, 32, 0.15,  5.5, 3.5, 3],
  "shakshuka":         [460, 520,  90, 2.8, 1.0, 1.8, 40, 0.15,  3.6, 6.0, 3],

  // ── Legumes & pulses ──────────────────────────────────────────────────────
  "masoor-dal":        [420, 730,  50, 4.6, 0.0, 0.0, 72, 0.14,  0.2, 3.0, 3],
  "moong-dal":         [360, 540,  40, 2.6, 0.0, 0.0, 66, 0.10,  0.2, 2.5, 3],
  "rajma":             [340, 520,  55, 2.8, 0.0, 0.0, 60, 0.13,  0.2, 1.5, 3],
  "chana-salad":       [180, 300,  50, 2.2, 0.0, 0.0, 52, 0.05,  0.9, 4.0, 2],
  "chole-palak":       [400, 620, 130, 3.8, 0.0, 0.0, 78, 0.10,  0.9, 4.0, 3],
  "sprouts":           [  8, 180,  22, 1.3, 0.0, 0.0, 30, 0.02,  0.1, 1.5, 1],
  "roasted-chana":     [ 20, 290,  45, 1.9, 0.0, 0.0, 48, 0.04,  0.6, 1.0, 2],
  "dhokla":            [420, 250,  35, 1.8, 0.0, 0.0, 45, 0.03,  0.5, 2.0, 3],
  "lauki-chana":       [380, 480,  60, 2.6, 0.0, 0.0, 62, 0.08,  0.5, 3.5, 3],
  "sambar-rice":       [560, 620,  80, 3.2, 0.0, 0.0, 85, 0.10,  0.6, 4.0, 3],
  "lentil-soup":       [380, 620,  50, 3.4, 0.0, 0.0, 70, 0.12,  1.1, 3.0, 3],
  "minestrone":        [480, 700, 100, 3.0, 0.0, 0.0, 72, 0.10,  0.7, 6.0, 3],
  "falafel":           [400, 430,  70, 2.8, 0.0, 0.0, 62, 0.08,  1.4, 1.5, 3],
  "hummus-veg":        [240, 260,  45, 1.4, 0.0, 0.0, 38, 0.06,  1.0, 3.0, 3],
  "pita-hummus":       [380, 230,  60, 1.9, 0.0, 0.0, 48, 0.05,  0.9, 2.0, 3],
  "hummus-falafel-platter":[520, 720, 120, 4.2, 0.0, 0.0, 95, 0.12, 2.0, 5.0, 3],
  "edamame":           [  6, 440,  63, 2.3, 0.0, 0.0, 62, 0.36,  0.6, 2.5, 1],
  "chickpea-tofu-salad":[260, 560, 240, 3.6, 0.0, 0.0, 85, 0.30,  1.3, 4.0, 2],
  "couscous-chickpea": [340, 480, 100, 3.2, 0.0, 0.0, 80, 0.10,  1.2, 4.0, 3],
  "sprout-avocado-bowl":[ 90, 620,  50, 2.2, 0.0, 0.0, 62, 0.20,  1.8, 2.5, 1],

  // ── Soy & tofu ────────────────────────────────────────────────────────────
  "soya-chunks":       [520, 760, 350,10.0, 0.0, 0.0,180, 0.35,  0.3, 3.0, 3],
  "tofu-palak":        [280, 560, 420, 4.2, 0.0, 0.0, 85, 0.30,  1.1, 1.5, 2],
  "tofu-bhurji":       [320, 300, 380, 3.2, 0.0, 0.0, 70, 0.32,  1.4, 1.5, 3],
  "tofu-veg-stirfry":  [380, 620, 400, 4.0, 0.0, 0.0, 95, 0.38,  1.7, 4.0, 3],

  // ── Grains & breads ───────────────────────────────────────────────────────
  "oats-steel":        [  4, 250,  32, 2.4, 0.0, 0.0, 96, 0.07,  0.8, 0.7, 1],
  "rolled-oats":       [ 50, 280, 150, 2.0, 0.4, 1.0, 80, 0.06,  1.2, 6.0, 2],
  "poha":              [340, 180,  20, 2.6, 0.0, 0.0, 30, 0.03,  0.5, 2.0, 3],
  "idli":              [480, 220,  40, 1.6, 0.0, 0.0, 42, 0.04,  0.4, 2.0, 3],
  "brown-rice":        [  5, 130,  20, 0.8, 0.0, 0.0, 65, 0.02,  0.4, 0.4, 1],
  "roti":              [  6, 180,  40, 2.4, 0.0, 0.0, 70, 0.05,  0.9, 0.8, 1],
  "bajra-roti":        [  5, 220,  25, 3.0, 0.0, 0.0,105, 0.06,  0.5, 0.6, 1],
  "khichdi":           [420, 380,  45, 2.8, 0.0, 0.0, 68, 0.08,  0.7, 2.0, 3],
  "quinoa":            [  9, 340,  40, 2.6, 0.0, 0.0,110, 0.14,  0.4, 1.5, 1],
  "ragi-dosa":         [320, 250, 240, 2.8, 0.0, 0.0, 95, 0.05,  0.6, 1.5, 3],
  "upma":              [380, 180,  30, 1.6, 0.0, 0.0, 32, 0.04,  1.1, 2.0, 3],
  "dalia":             [280, 260,  35, 2.2, 0.0, 0.0, 75, 0.05,  0.5, 2.5, 2],
  "thepla":            [340, 260,  90, 3.2, 0.0, 0.0, 68, 0.08,  1.2, 1.5, 3],
  "veg-pulao":         [420, 380,  50, 2.4, 0.0, 0.0, 78, 0.08,  0.9, 3.5, 3],
  "veg-biryani-brown": [620, 540,  70, 3.0, 0.0, 0.0, 95, 0.10,  1.8, 5.0, 3],
  "ww-pasta":          [280, 520,  70, 3.4, 0.0, 0.0,105, 0.10,  1.5, 6.0, 3],
  "tabbouleh":         [220, 300,  50, 1.8, 0.0, 0.0, 60, 0.10,  0.6, 2.0, 2],
  "stuffed-peppers":   [300, 620,  60, 2.8, 0.0, 0.0, 95, 0.12,  1.1, 8.0, 2],
  "grilled-veg-quinoa":[280, 720,  70, 3.2, 0.0, 0.0,120, 0.14,  1.3, 7.0, 2],
  "avocado-toast":     [340, 620,  60, 2.2, 0.0, 0.0, 70, 0.15,  2.0, 2.5, 3],
  "pb-banana-toast":   [300, 620,  70, 2.4, 0.0, 0.0, 90, 0.05,  3.0,14.0, 3],
  "smoothie-bowl":     [110, 620, 250, 2.8, 0.6, 0.5, 95, 0.90,  1.8,18.0, 3],
  "besan-chilla":      [360, 420,  50, 2.8, 0.0, 0.0, 70, 0.06,  0.9, 2.0, 3],
  "moong-chilla":      [320, 460,  45, 2.6, 0.0, 0.0, 68, 0.06,  0.7, 1.5, 3],
  "sweet-corn-chaat":  [280, 400,  15, 1.0, 0.0, 0.0, 62, 0.03,  0.5, 8.0, 2],

  // ── Vegetables ────────────────────────────────────────────────────────────
  "bitter-gourd":      [180, 250,  30, 0.9, 0.0, 0.0, 24, 0.02,  0.5, 1.0, 3],
  "cauliflower":       [240, 320,  35, 0.7, 0.0, 0.0, 24, 0.03,  0.2, 2.5, 3],
  "broccoli":          [ 60, 380,  55, 0.9, 0.0, 0.0, 26, 0.10,  0.2, 2.0, 2],
  "asparagus":         [  4, 210,  22, 1.8, 0.0, 0.0, 12, 0.02,  0.0, 1.5, 1],
  "sweet-potato":      [ 60, 400,  36, 0.7, 0.0, 0.0, 28, 0.01,  0.1, 7.0, 2],
  "baked-potato":      [180, 950,  90, 1.8, 0.2, 0.1, 70, 0.02,  1.2, 4.0, 2],
  "med-veg":           [180, 480,  40, 0.8, 0.0, 0.0, 32, 0.06,  0.8, 6.0, 2],
  "greek-salad":       [420, 380,  90, 0.9, 0.0, 0.0, 26, 0.08,  1.9, 4.5, 2],
  "veg-soup":          [520, 520,  60, 1.4, 0.0, 0.0, 42, 0.05,  0.7, 6.0, 3],
  "baingan-bharta":    [360, 480,  40, 1.0, 0.0, 0.0, 38, 0.06,  0.9, 6.0, 3],
  "mixed-veg-sabzi":   [380, 460,  60, 1.6, 0.0, 0.0, 42, 0.06,  0.9, 5.0, 3],

  // ── Indian vegetarian mains (added for weekly variety) ────────────────────
  "dal-tadka":         [400, 620,  45, 3.4, 0.0, 0.0, 68, 0.12,  1.4, 3.0, 3],
  "chana-masala":      [460, 640, 110, 4.0, 0.0, 0.0, 82, 0.10,  0.9, 5.0, 3],
  "matar-paneer":      [420, 380, 480, 2.2, 0.8, 0.3, 55, 0.10,  7.5, 5.0, 3],
  "paneer-tikka":      [380, 240, 540, 0.8, 1.0, 0.3, 35, 0.08, 10.0, 3.0, 3],
  "aloo-gobi-matar":   [380, 560,  60, 1.8, 0.0, 0.0, 48, 0.06,  0.7, 5.0, 3],
  "veg-kofta":         [520, 520, 180, 2.4, 0.3, 0.1, 55, 0.08,  3.0, 6.0, 3],
  "soya-keema":        [440, 700, 260, 7.5, 0.0, 0.0,140, 0.25,  1.0, 4.0, 3],
  "curd-rice":         [340, 340, 260, 1.2, 0.6, 0.1, 55, 0.03,  2.0, 6.0, 3],
  "palak-dal":         [380, 780, 180, 5.2, 0.0, 0.0, 90, 0.12,  0.4, 3.0, 3],
  "stuffed-capsicum":  [340, 420, 400, 1.6, 0.7, 0.2, 45, 0.08,  6.0, 6.0, 3],
  "veg-uttapam":       [440, 260,  45, 2.0, 0.0, 0.0, 50, 0.05,  0.8, 3.0, 3],
  "sabudana-khichdi":  [320, 320,  40, 1.4, 0.0, 0.0, 60, 0.04,  1.6, 2.0, 3],
  "masala-oats":       [300, 320,  50, 2.6, 0.0, 0.0, 95, 0.08,  0.9, 3.0, 2],

  "soy-milk":          [ 90, 300, 300, 1.0, 2.4, 2.5, 40, 0.10,  0.5, 5.0, 3],
  "tofu-oats-bowl":    [280, 560, 420, 5.0, 0.0, 0.0,140, 0.20,  1.8, 2.0, 2],

  // ── Mediterranean / Western vegan breakfasts ──────────────────────────────
  "overnight-oats-vegan":[ 30, 380, 160, 2.8, 0.0, 0.0,120, 2.20, 1.0, 9.0, 1],
  "tofu-scramble-med": [280, 480, 400, 4.4, 0.0, 0.0, 90, 0.35,  1.9, 3.0, 2],
  "socca":             [260, 420,  55, 3.0, 0.0, 0.0, 72, 0.08,  1.2, 2.0, 2],
  "hummus-toast":      [360, 340,  70, 2.4, 0.0, 0.0, 62, 0.07,  1.3, 3.0, 3],
  "date-almond-smoothie":[ 60, 820, 180, 1.8, 0.0, 0.0,110, 0.05, 1.0,32.0, 2],
  "avocado-bean-toast":[300, 720, 110, 3.4, 0.0, 0.0, 88, 0.14,  2.0, 2.5, 2],

  // ── Beverages ─────────────────────────────────────────────────────────────
  "green-tea":         [  4,  20,   0, 0.0, 0.0, 0.0,  2, 0.00,  0.0, 0.0, 1],
};

/** Food-group fallbacks (per 100 kcal) for any food missing an explicit row. */
const GROUP_FALLBACK: Record<string, NutrientTuple> = {
  protein:   [150, 220, 30, 1.0, 0.4, 0.3, 30, 0.10, 1.5, 1.0, 2],
  dairy:     [120, 200, 220, 0.3, 0.7, 0.3, 25, 0.03, 2.5, 6.0, 2],
  legumes:   [220, 380, 50, 2.2, 0.0, 0.0, 55, 0.08, 0.5, 2.5, 2],
  grains:    [180, 200, 35, 1.6, 0.0, 0.0, 55, 0.05, 0.7, 2.0, 2],
  vegetable: [250, 400, 45, 1.0, 0.0, 0.0, 32, 0.05, 0.6, 4.0, 2],
  fruit:     [  2, 250, 20, 0.3, 0.0, 0.0, 18, 0.03, 0.1,13.0, 1],
  nuts:      [ 10, 180, 55, 1.0, 0.0, 0.0, 65, 0.30, 1.4, 2.0, 1],
  seeds:     [  5, 140, 50, 1.1, 0.0, 0.0, 70, 1.50, 0.8, 0.5, 1],
  beverage:  [  5,  30,  5, 0.0, 0.0, 0.0,  3, 0.00, 0.0, 1.0, 1],
};

const KEYS: (keyof Micros)[] = [
  "sodium_mg", "potassium_mg", "calcium_mg", "iron_mg", "b12_ug",
  "vitamin_d_ug", "magnesium_mg", "omega3_g", "satfat_g", "sugar_g", "nova",
];

function toMicros(t: NutrientTuple): Micros {
  const out = {} as Micros;
  KEYS.forEach((k, i) => { out[k] = t[i]; });
  return out;
}

/**
 * Micronutrients for one serving of a food. Falls back to a food-group profile
 * scaled by the serving's calories when no explicit row exists, so the totals
 * are never silently zero (which would read as "no sodium" — worse than an
 * estimate).
 */
export function getMicros(foodId: string, group: string, calories: number): Micros {
  const explicit = NUTRIENTS[foodId];
  if (explicit) return toMicros(explicit);

  const fb = GROUP_FALLBACK[group] || GROUP_FALLBACK.grains;
  const factor = Math.max(0.2, calories / 100);
  const scaled = fb.map((v, i) => (KEYS[i] === "nova" ? v : Math.round(v * factor * 100) / 100)) as NutrientTuple;
  return toMicros(scaled);
}

/** True when the food has hand-verified data rather than a group estimate. */
export function hasVerifiedNutrients(foodId: string): boolean {
  return foodId in NUTRIENTS;
}
