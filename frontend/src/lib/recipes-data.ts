export interface Recipe {
  prep: number;    // minutes
  cook: number;    // minutes
  servings: number;
  difficulty: "easy" | "medium";
  ingredients: string[];
  steps: string[];
  tip?: string;
}

export const RECIPES: Record<string, Recipe> = {

  // ── BREAKFASTS ─────────────────────────────────────────────────────────────

  "moong-chilla": {
    prep: 10, cook: 15, servings: 1, difficulty: "easy",
    ingredients: [
      "½ cup moong dal (split green gram), soaked 4–6 hours",
      "¼ cup water (for grinding)",
      "½ tsp cumin seeds",
      "1 small onion, finely chopped",
      "1 green chilli, finely chopped",
      "1 tsp grated ginger",
      "2 tbsp fresh coriander, chopped",
      "¼ tsp turmeric",
      "Salt to taste",
      "1 tsp oil per chilla",
    ],
    steps: [
      "Drain soaked moong dal. Blend with ¼ cup water to a smooth, thick batter — should coat the back of a spoon.",
      "Stir in onion, green chilli, ginger, coriander, cumin seeds, turmeric and salt.",
      "Heat a non-stick tawa on medium. Lightly grease with ½ tsp oil.",
      "Pour a ladleful of batter and spread into a thin round (~18 cm) using the back of the ladle.",
      "Drizzle ½ tsp oil around the edges. Cook 2–3 min until the bottom turns golden.",
      "Flip and cook 1–2 min more. Serve hot with green chutney or low-fat curd.",
    ],
    tip: "Soaking makes dal easier to digest and slightly reduces phytic acid. Moong is one of the lowest-GI protein sources — ideal for diabetes management.",
  },

  "besan-chilla": {
    prep: 8, cook: 12, servings: 1, difficulty: "easy",
    ingredients: [
      "½ cup besan (chickpea flour)",
      "⅓ cup water",
      "½ small onion, finely chopped",
      "½ small tomato, finely chopped",
      "1 green chilli, chopped",
      "2 tbsp coriander leaves",
      "¼ tsp turmeric, ¼ tsp ajwain (carom seeds)",
      "Salt to taste",
      "1 tsp oil per chilla",
    ],
    steps: [
      "Whisk besan with water to a lump-free batter, slightly thinner than pancake batter.",
      "Fold in onion, tomato, green chilli, coriander, turmeric, ajwain and salt. Rest 5 min.",
      "Heat a non-stick tawa, grease lightly. Pour batter and spread thin.",
      "Drizzle oil edges. Cook 2 min until bubbles form and edges crisp. Flip, cook 1 min.",
      "Serve with mint chutney or a side of low-fat curd.",
    ],
    tip: "Besan is high in protein and soluble fiber — both help keep blood sugar steady post-meal.",
  },

  "poha": {
    prep: 5, cook: 12, servings: 1, difficulty: "easy",
    ingredients: [
      "1 cup thick poha (flattened rice)",
      "1 small onion, thinly sliced",
      "½ cup mixed veggies (peas, carrot, capsicum), finely chopped",
      "1 tsp mustard seeds",
      "8–10 curry leaves",
      "1 green chilli",
      "½ tsp turmeric",
      "½ tsp lemon juice",
      "Salt to taste",
      "1 tsp oil",
      "2 tbsp coriander + 1 tbsp pomegranate (garnish)",
    ],
    steps: [
      "Rinse poha in a sieve under running water for 30 sec. Gently toss, drain, set aside 5 min — it will soften.",
      "Heat oil in a pan. Add mustard seeds; let them splutter. Add curry leaves and green chilli.",
      "Add onion; sauté 2 min until translucent. Add veggies; cook 3 min on medium.",
      "Add turmeric and salt, then the softened poha. Gently fold to combine — don't mash.",
      "Cook 2 min, sprinkle lemon juice, garnish with coriander and pomegranate. Serve immediately.",
    ],
    tip: "Poha is a good source of iron — the lemon juice boosts iron absorption by up to 67%.",
  },

  "idli": {
    prep: 20, cook: 15, servings: 1, difficulty: "medium",
    ingredients: [
      "1 cup idli batter (store-bought or homemade fermented urad-rice batter)",
      "For sambar: ½ cup cooked toor dal, 1 tomato, 1 drumstick, small piece of tamarind",
      "1 tsp sambar powder, ¼ tsp mustard seeds, curry leaves, asafoetida",
      "Salt to taste",
    ],
    steps: [
      "Idli: Grease idli moulds. Pour batter into each. Steam in a pressure cooker (without weight) or steamer for 12–15 min.",
      "Insert a toothpick — if it comes out clean, idlis are done. Rest 2 min before un-moulding.",
      "Sambar: Mash cooked toor dal. Cook tomato + drumstick in 1.5 cups water with tamarind pulp for 8 min.",
      "Add mashed dal and sambar powder. Simmer 5 min. Temper with mustard seeds, curry leaves, asafoetida in ½ tsp oil.",
      "Serve 3 idlis per serving with sambar and coconut chutney.",
    ],
    tip: "Fermentation of idli batter increases B-vitamin content and bioavailability. The combination with sambar makes it a complete protein.",
  },

  "oats-steel": {
    prep: 2, cook: 15, servings: 1, difficulty: "easy",
    ingredients: [
      "60g steel-cut oats",
      "250ml water + 100ml low-fat milk",
      "1 tsp chia seeds",
      "½ banana or 5 strawberries",
      "1 tbsp walnuts, roughly chopped",
      "½ tsp cinnamon",
      "Pinch of salt",
    ],
    steps: [
      "Bring water to a boil in a small saucepan. Add oats and a pinch of salt.",
      "Reduce heat to low. Cook 12–15 min, stirring occasionally, until thick and creamy.",
      "Stir in milk and cinnamon; cook 2 more min.",
      "Pour into a bowl. Top with chia seeds, fruit, and walnuts.",
      "Add a drizzle of honey if needed — though ripe banana makes it naturally sweet.",
    ],
    tip: "Steel-cut oats have a significantly lower GI (42–55) than instant oats (66+). The beta-glucan fiber lowers LDL cholesterol.",
  },

  "rolled-oats": {
    prep: 2, cook: 8, servings: 1, difficulty: "easy",
    ingredients: [
      "50g rolled oats",
      "200ml low-fat milk (or oat milk)",
      "1 tsp ground flaxseeds",
      "1 tbsp berries or sliced apple",
      "½ tsp cinnamon",
      "5 almonds, slivered",
    ],
    steps: [
      "Combine oats and milk in a saucepan over medium heat.",
      "Cook 5–7 min, stirring, until oats are soft and creamy.",
      "Stir in flaxseeds and cinnamon.",
      "Serve topped with berries or apple and slivered almonds.",
    ],
    tip: "Add flaxseeds after cooking — heat can reduce their omega-3 content.",
  },

  "dalia": {
    prep: 5, cook: 20, servings: 1, difficulty: "easy",
    ingredients: [
      "⅓ cup broken wheat (dalia)",
      "½ cup mixed veggies (carrot, beans, peas)",
      "1 small onion, chopped",
      "1 tomato, chopped",
      "½ tsp mustard seeds, ¼ tsp turmeric",
      "¼ tsp cumin, salt to taste",
      "1 tsp ghee or olive oil",
      "2.5 cups water",
    ],
    steps: [
      "Dry-roast dalia in a pot on medium heat for 2–3 min until lightly golden and nutty. Remove and set aside.",
      "Heat ghee in the same pot. Add mustard seeds — let them pop. Add cumin.",
      "Add onion; sauté 2 min. Add tomato; cook until soft. Add veggies and turmeric.",
      "Add roasted dalia and water. Season with salt. Bring to a boil.",
      "Reduce heat, cover and cook 15–18 min until dalia is fully cooked and water absorbed.",
      "Fluff with a fork. Garnish with coriander. Serve with a side of curd.",
    ],
    tip: "Broken wheat has a GI of 41–50 — much lower than refined wheat. Roasting it first adds a nutty flavour without extra fat.",
  },

  "upma": {
    prep: 5, cook: 15, servings: 1, difficulty: "easy",
    ingredients: [
      "⅓ cup semolina (suji/rava)",
      "½ cup mixed veggies (carrot, peas, beans)",
      "1 small onion, chopped",
      "1 green chilli",
      "1 tsp mustard seeds",
      "10 curry leaves",
      "2 tsp lemon juice",
      "Salt to taste",
      "1 tsp oil",
      "1.5 cups water",
    ],
    steps: [
      "Dry-roast suji in a pan on low heat 3–4 min until light golden and fragrant. Remove.",
      "Heat oil; add mustard seeds. Once they splutter, add curry leaves and green chilli.",
      "Add onion; sauté 2 min. Add veggies; cook 3 min.",
      "Pour 1.5 cups water, add salt. Bring to a boil.",
      "Reduce heat to low. Add roasted suji in a slow stream while stirring continuously.",
      "Stir until water is absorbed (~2 min). Cover and rest 2 min.",
      "Add lemon juice, stir gently. Serve with coconut chutney.",
    ],
    tip: "Roasting suji before cooking reduces its effective GI and prevents clumping. Lemon juice adds vitamin C which aids iron absorption.",
  },

  "ragi-dosa": {
    prep: 10, cook: 15, servings: 1, difficulty: "medium",
    ingredients: [
      "½ cup ragi (finger millet) flour",
      "2 tbsp urad dal flour or regular dosa batter base",
      "Water to make a thin batter",
      "½ tsp cumin seeds",
      "1 green chilli, finely chopped",
      "1 tbsp onion, finely chopped",
      "Salt to taste",
      "1 tsp oil per dosa",
    ],
    steps: [
      "Mix ragi flour and urad dal flour. Add water gradually, whisking until you get a thin, pourable batter.",
      "Add cumin, green chilli, onion and salt. Mix well. Rest 5 min.",
      "Heat a cast-iron or non-stick tawa on medium-high. Lightly grease.",
      "Pour a ladleful of batter and quickly spread in circles from the centre outward.",
      "Drizzle oil on edges. Cook 2–3 min until crisp on the bottom. Fold and serve.",
      "Pair with sambar or coconut chutney.",
    ],
    tip: "Ragi has one of the highest calcium contents of any cereal — good for bone health. Its high fiber (3.6%) slows glucose release.",
  },

  "thepla": {
    prep: 15, cook: 15, servings: 1, difficulty: "medium",
    ingredients: [
      "½ cup whole wheat flour",
      "1 cup fenugreek (methi) leaves, finely chopped",
      "2 tbsp besan (chickpea flour)",
      "¼ tsp turmeric, ¼ tsp red chilli powder",
      "½ tsp cumin seeds",
      "1 tsp ginger-garlic paste",
      "2 tbsp low-fat curd",
      "Salt to taste",
      "1 tsp oil per thepla",
    ],
    steps: [
      "Combine whole wheat flour, besan, methi leaves, turmeric, chilli, cumin, ginger-garlic paste and salt.",
      "Add curd and mix. Knead into a soft dough, adding a little water if needed. Rest 5 min.",
      "Divide into 2 equal portions. Roll each into a thin round (2–3mm).",
      "Cook on a medium-hot tawa for 2 min per side. Apply a few drops of oil and press gently.",
      "Cook until golden spots appear on both sides. Serve with curd or green chutney.",
    ],
    tip: "Fenugreek (methi) leaves contain 4-hydroxyisoleucine — a compound that directly stimulates insulin secretion. Excellent for blood sugar management.",
  },

  "stuffed-paratha": {
    prep: 15, cook: 15, servings: 1, difficulty: "medium",
    ingredients: [
      "For dough: ½ cup whole wheat flour, water to knead",
      "Filling: 80g low-fat paneer, grated",
      "¼ tsp cumin powder, ¼ tsp red chilli",
      "1 tbsp coriander, chopped",
      "½ tsp chaat masala",
      "Salt to taste",
      "1 tsp ghee (for cooking)",
    ],
    steps: [
      "Knead flour with water into a soft, smooth dough. Rest 10 min.",
      "Mix grated paneer with cumin, chilli, coriander, chaat masala and salt.",
      "Divide dough into 2 balls. Roll one ball into a small round. Place half the filling in the centre.",
      "Bring the edges together, pinch to seal. Gently roll out into a thicker round without tearing.",
      "Cook on a medium-hot tawa. Apply a little ghee, flip when golden spots appear. Cook both sides.",
      "Serve with low-fat curd and a sliced cucumber.",
    ],
    tip: "Whole wheat paratha has significantly more fiber than maida. Using low-fat paneer keeps protein high while reducing saturated fat.",
  },

  "smoothie-bowl": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "100g Greek yogurt (or plain curd)",
      "80g mixed berries (frozen works well)",
      "1 tbsp chia seeds",
      "1 tbsp ground flaxseeds",
      "½ banana, sliced",
      "1 tbsp pumpkin seeds",
      "½ tsp vanilla extract (optional)",
      "1 tsp honey (optional)",
    ],
    steps: [
      "Blend Greek yogurt with berries and banana until smooth and thick — it should be scoopable, not drinkable.",
      "Pour into a bowl.",
      "Arrange toppings: chia seeds, flaxseeds, extra berries, banana slices, pumpkin seeds.",
      "Drizzle honey if using. Eat immediately — toppings soften quickly.",
    ],
    tip: "Serve in a chilled bowl for better texture. The combination of yogurt protein + berry antioxidants + chia omega-3 makes this one of the most nutrient-dense breakfasts.",
  },

  "paneer-bhurji": {
    prep: 5, cook: 12, servings: 1, difficulty: "easy",
    ingredients: [
      "150g low-fat paneer, crumbled",
      "1 small onion, finely chopped",
      "1 small tomato, finely chopped",
      "1 capsicum, finely chopped",
      "1 green chilli",
      "¼ tsp turmeric",
      "½ tsp cumin seeds",
      "¼ tsp garam masala",
      "1 tbsp coriander",
      "Salt to taste",
      "1 tsp oil",
    ],
    steps: [
      "Heat oil in a pan. Add cumin seeds — let them sizzle.",
      "Add onion and green chilli; sauté 3 min until translucent.",
      "Add tomato and capsicum; cook 4 min until tomatoes soften.",
      "Add turmeric and salt. Stir in crumbled paneer.",
      "Cook on medium 2–3 min, stirring gently. Add garam masala.",
      "Garnish with coriander. Serve with 1 whole wheat roti or as a filling for a wrap.",
    ],
    tip: "Low-fat paneer retains all the calcium and protein of full-fat paneer while cutting saturated fat by ~50%.",
  },

  "tofu-bhurji": {
    prep: 5, cook: 10, servings: 1, difficulty: "easy",
    ingredients: [
      "150g firm tofu, pressed and crumbled",
      "1 small onion, chopped",
      "1 tomato, chopped",
      "½ capsicum, chopped",
      "¼ tsp turmeric",
      "¼ tsp cumin powder",
      "¼ tsp nutritional yeast (optional, adds B12)",
      "1 tsp soy sauce (low sodium)",
      "1 tbsp coriander",
      "Salt to taste, 1 tsp oil",
    ],
    steps: [
      "Press tofu between paper towels for 5 min to remove excess moisture. Crumble into small pieces.",
      "Heat oil. Sauté onion 2 min. Add tomato and capsicum; cook 3 min.",
      "Add turmeric, cumin, and crumbled tofu. Mix well.",
      "Stir in soy sauce and nutritional yeast. Cook 3 min until any moisture evaporates.",
      "Garnish with coriander. Serve with roti or toast.",
    ],
    tip: "Pressing tofu gives it a firmer, egg-like texture. Firm tofu is ~17g protein per 100g — one of the best plant protein sources.",
  },

  "turmeric-milk": {
    prep: 2, cook: 5, servings: 1, difficulty: "easy",
    ingredients: [
      "250ml low-fat milk",
      "1 tsp turmeric powder",
      "¼ tsp black pepper (crucial — enhances curcumin absorption 20x)",
      "½ tsp cinnamon",
      "½ tsp grated ginger (or ¼ tsp dry ginger powder)",
      "½ tsp honey or a few drops of stevia (optional)",
    ],
    steps: [
      "Warm milk in a small saucepan over medium heat — don't boil.",
      "Add turmeric, black pepper, cinnamon and ginger. Whisk well until fully combined.",
      "Simmer gently for 3 min to let the spices infuse.",
      "Pour into a mug. Add honey if using. Drink warm.",
    ],
    tip: "Black pepper is non-negotiable — piperine increases curcumin bioavailability by up to 2000%. Without it, most curcumin passes through unabsorbed.",
  },

  "egg-bhurji": {
    prep: 5, cook: 8, servings: 1, difficulty: "easy",
    ingredients: [
      "3 eggs",
      "1 small onion, finely chopped",
      "1 tomato, finely chopped",
      "1 capsicum, finely chopped",
      "1 green chilli",
      "¼ tsp turmeric",
      "¼ tsp cumin powder",
      "1 tbsp coriander",
      "Salt to taste",
      "1 tsp oil or butter",
    ],
    steps: [
      "Beat eggs lightly — don't over-beat. Season with salt.",
      "Heat oil in a pan. Sauté onion and green chilli 2 min.",
      "Add tomato and capsicum; cook 2 min until soft.",
      "Add turmeric and cumin. Pour in beaten eggs.",
      "Stir gently on medium-low — keep the egg in soft folds, not fully dry.",
      "Garnish with coriander. Serve with whole wheat toast or roti.",
    ],
    tip: "Cooking eggs soft (not fully scrambled dry) preserves more of the fat-soluble vitamins A, D and E.",
  },

  "egg-omelette": {
    prep: 5, cook: 7, servings: 1, difficulty: "easy",
    ingredients: [
      "3 eggs",
      "¼ cup capsicum, finely chopped",
      "¼ cup onion, finely chopped",
      "¼ cup tomato, finely chopped",
      "1 tbsp spinach or kale, chopped",
      "Salt and pepper to taste",
      "1 tsp olive oil or butter",
    ],
    steps: [
      "Beat eggs with salt and pepper until just combined.",
      "Heat oil in a non-stick pan over medium. Add onion and capsicum; sauté 1 min.",
      "Add tomato and spinach; stir 30 sec. Spread veggies evenly.",
      "Pour eggs over the veggies. Tilt the pan to spread the egg evenly.",
      "As edges set, lift them gently with a spatula and let liquid egg flow underneath.",
      "When surface is just set (not runny), fold omelette in half. Slide onto plate.",
    ],
    tip: "Keep the heat medium — a high-heat omelette turns rubbery. The folding technique preserves more moisture and tenderness.",
  },

  // ── LUNCH & DINNER ─────────────────────────────────────────────────────────

  "masoor-dal": {
    prep: 5, cook: 25, servings: 2, difficulty: "easy",
    ingredients: [
      "½ cup masoor dal (red lentils)",
      "1 tomato, chopped",
      "1 onion, chopped",
      "½ tsp ginger-garlic paste",
      "¼ tsp turmeric",
      "½ tsp cumin seeds",
      "½ tsp coriander powder",
      "¼ tsp red chilli powder",
      "1 tbsp coriander leaves",
      "Salt to taste",
      "1 tsp ghee or oil",
      "2.5 cups water",
    ],
    steps: [
      "Rinse dal 3 times. Add to a pressure cooker with 2.5 cups water and turmeric. Cook 2–3 whistles.",
      "Heat ghee in a pan. Add cumin seeds — let them splutter.",
      "Add onion; cook 4 min until golden. Add ginger-garlic paste; cook 1 min.",
      "Add tomato and all dry spices. Cook until tomato turns mushy (~4 min).",
      "Add cooked dal. Mix well, adjust consistency with water. Simmer 5 min.",
      "Garnish with coriander and a squeeze of lemon. Serve with roti or brown rice.",
    ],
    tip: "Masoor dal has one of the highest iron contents among dals. The lemon squeeze at the end converts non-heme iron to a more absorbable form.",
  },

  "moong-dal": {
    prep: 5, cook: 20, servings: 2, difficulty: "easy",
    ingredients: [
      "½ cup split moong dal (yellow)",
      "¼ tsp turmeric",
      "1 tomato, chopped",
      "1 tsp ginger, grated",
      "½ tsp cumin seeds",
      "1 dried red chilli",
      "Pinch of asafoetida",
      "1 tbsp coriander",
      "Salt to taste",
      "1 tsp ghee",
    ],
    steps: [
      "Rinse dal. Cook in 2 cups water with turmeric until soft — 15 min in a regular pot, or 1 whistle in pressure cooker.",
      "Mash the cooked dal lightly with the back of a ladle.",
      "Heat ghee. Add cumin seeds, red chilli and asafoetida — 30 sec.",
      "Add ginger and tomato. Cook 3 min until soft.",
      "Pour the tempering over dal. Add salt, stir, simmer 5 min.",
      "Garnish with coriander. Pair with roti for a complete protein.",
    ],
    tip: "Moong dal (GI 25) is the lightest of all dals on the digestive system — traditionally used in Ayurvedic recovery diets and recommended post-surgery.",
  },

  "khichdi": {
    prep: 5, cook: 25, servings: 2, difficulty: "easy",
    ingredients: [
      "¼ cup moong dal",
      "¼ cup brown rice",
      "½ cup mixed veggies (carrot, peas, beans)",
      "1 tsp ghee",
      "¼ tsp turmeric",
      "½ tsp cumin seeds",
      "Pinch of asafoetida",
      "Salt to taste",
      "3 cups water",
    ],
    steps: [
      "Rinse dal and rice together. Soak 15 min if time allows.",
      "Heat ghee in a pressure cooker. Add cumin and asafoetida — 30 sec.",
      "Add veggies; sauté 1 min. Add rinsed dal+rice, turmeric and salt.",
      "Add 3 cups water. Pressure cook 3–4 whistles on medium.",
      "Once pressure releases, open and stir. Adjust water for desired consistency — khichdi should be porridge-like.",
      "Serve hot with a side of curd and a teaspoon of ghee on top.",
    ],
    tip: "Khichdi is a complete protein (rice amino acids complement dal's). The ghee on top isn't just flavour — it lowers the overall GI of the meal.",
  },

  "rajma": {
    prep: 10, cook: 40, servings: 2, difficulty: "medium",
    ingredients: [
      "½ cup rajma (kidney beans), soaked overnight",
      "2 tomatoes, blended",
      "1 large onion, blended",
      "1 tsp ginger-garlic paste",
      "½ tsp cumin seeds",
      "1 tsp coriander powder",
      "½ tsp cumin powder",
      "¼ tsp garam masala",
      "¼ tsp red chilli",
      "Salt to taste",
      "1 tsp oil",
    ],
    steps: [
      "Pressure cook soaked rajma with 2 cups water: 6–8 whistles. Reserve the cooking water.",
      "Heat oil. Add cumin seeds. Add blended onion; cook on medium 8–10 min until golden and oil separates.",
      "Add ginger-garlic paste; cook 2 min. Add tomato purée and all dry spices. Cook 8 min until thick.",
      "Add cooked rajma with its water. Mash a few beans against the pot sides to thicken the gravy.",
      "Simmer 10 min until thick and flavours meld. Add garam masala at end.",
      "Garnish with coriander. Serve with brown rice.",
    ],
    tip: "Soaking rajma overnight removes oligosaccharides that cause gas. Discarding soak water and using fresh water to cook reduces them further.",
  },

  "chole-palak": {
    prep: 10, cook: 30, servings: 2, difficulty: "medium",
    ingredients: [
      "1 can (400g) chickpeas, drained — or ½ cup dried, soaked overnight and boiled",
      "2 cups fresh spinach (palak), chopped",
      "2 tomatoes, blended",
      "1 onion, finely chopped",
      "1 tsp ginger-garlic paste",
      "1 tsp chole masala or coriander-cumin powder",
      "½ tsp turmeric, ¼ tsp red chilli",
      "1 tsp oil, salt to taste",
    ],
    steps: [
      "Heat oil. Sauté onion 5 min until golden. Add ginger-garlic paste; cook 1 min.",
      "Add blended tomato and all dry spices. Cook 8 min, stirring, until oil separates.",
      "Add chickpeas. Mix well. Cook 5 min.",
      "Add spinach and ½ cup water. Cover and cook 5 min until spinach wilts.",
      "Mash a few chickpeas for a thicker gravy. Adjust seasoning.",
      "Serve with bajra roti or brown rice.",
    ],
    tip: "Combining chickpeas (iron) with spinach (vitamin C) in the same meal significantly boosts non-heme iron absorption.",
  },

  "soya-chunks": {
    prep: 15, cook: 20, servings: 2, difficulty: "easy",
    ingredients: [
      "80g soya chunks (dry weight)",
      "1 onion, blended",
      "2 tomatoes, blended",
      "1 tsp ginger-garlic paste",
      "½ tsp cumin seeds",
      "1 tsp coriander powder, ½ tsp cumin powder",
      "¼ tsp garam masala",
      "Salt to taste, 1 tsp oil",
    ],
    steps: [
      "Soak soya chunks in hot water 10 min. They will double in size. Drain and gently squeeze out water.",
      "Heat oil. Add cumin. Sauté blended onion 8 min until golden.",
      "Add ginger-garlic paste; cook 2 min. Add tomato and dry spices. Cook 5 min until oil separates.",
      "Add soya chunks. Mix well. Add ½ cup water. Cover and cook 8–10 min.",
      "Add garam masala, stir. Garnish with coriander. Serve with roti.",
    ],
    tip: "Soya is one of the few complete plant proteins — all essential amino acids present. Squeezing out soaking water removes enzyme inhibitors.",
  },

  "tofu-veg-stirfry": {
    prep: 10, cook: 12, servings: 1, difficulty: "easy",
    ingredients: [
      "150g firm tofu, cubed",
      "1 cup mixed veggies (broccoli, capsicum, snap peas, carrot), chopped",
      "1 tbsp low-sodium soy sauce",
      "1 tsp sesame oil (or olive oil)",
      "1 tsp grated ginger",
      "2 garlic cloves, minced",
      "½ tsp chilli flakes (optional)",
      "1 tsp cornflour in 3 tbsp water",
    ],
    steps: [
      "Press tofu cubes between paper towels 5 min. Pan-fry in ½ tsp oil on high heat 2 min per side until golden. Remove.",
      "In the same pan/wok, heat remaining oil on high. Add garlic and ginger; stir 30 sec.",
      "Add harder veggies first (carrot, broccoli); stir-fry 3 min on high heat.",
      "Add capsicum and snap peas; stir-fry 2 more min — veggies should remain crisp.",
      "Add soy sauce, tofu, and cornflour slurry. Toss until sauce coats everything.",
      "Serve immediately over brown rice or with roti.",
    ],
    tip: "High heat is essential for stir-fry — it caramelises veggies instead of steaming them. Have everything prepped before you start cooking.",
  },

  "tofu-palak": {
    prep: 10, cook: 20, servings: 2, difficulty: "medium",
    ingredients: [
      "120g firm tofu, cubed",
      "3 cups fresh spinach, blanched",
      "1 onion, chopped",
      "1 tomato, chopped",
      "1 tsp ginger-garlic paste",
      "¼ tsp turmeric, ½ tsp cumin",
      "¼ tsp garam masala",
      "2 tbsp low-fat cream or cashew paste (optional)",
      "Salt to taste, 1 tsp oil",
    ],
    steps: [
      "Blanch spinach in boiling water 1 min. Drain, cool, and blend to a smooth purée.",
      "Heat oil. Sauté onion 4 min. Add ginger-garlic paste; cook 1 min. Add tomato; cook 3 min.",
      "Add turmeric and cumin. Add spinach purée and ½ cup water. Simmer 5 min.",
      "Add tofu cubes. Simmer gently 5 min — don't stir too hard or tofu breaks.",
      "Add garam masala and cream if using. Adjust salt.",
      "Serve with whole wheat roti.",
    ],
    tip: "Blanching spinach before blending reduces oxalate content by up to 40% — important for anyone prone to kidney stones.",
  },

  "chana-salad": {
    prep: 10, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "1 can (120g drained) chickpeas — or home-cooked",
      "1 cucumber, diced",
      "1 tomato, diced",
      "¼ red onion, finely chopped",
      "1 tbsp fresh coriander",
      "1 tbsp lemon juice",
      "½ tsp chaat masala",
      "¼ tsp roasted cumin powder",
      "Salt to taste",
    ],
    steps: [
      "Drain and rinse chickpeas.",
      "Combine chickpeas, cucumber, tomato, and red onion in a bowl.",
      "Dress with lemon juice, chaat masala, cumin and salt. Toss well.",
      "Garnish with coriander. Can be refrigerated up to 1 day (keep dressing separate).",
    ],
    tip: "This no-cook salad takes 10 minutes and delivers 9g protein + 8g fiber per serving. Eat as a snack or side — the chickpeas are already cooked.",
  },

  "sprout-avocado-bowl": {
    prep: 10, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "60g moong sprouts (or mixed sprouts)",
      "½ avocado, cubed",
      "½ cucumber, diced",
      "6 cherry tomatoes, halved",
      "1 tbsp lemon juice",
      "¼ tsp black pepper",
      "Pinch of rock salt",
      "Few mint leaves",
    ],
    steps: [
      "Steam sprouts lightly 3 min if preferred, or use raw (raw has more enzymes).",
      "Combine sprouts, avocado, cucumber and tomatoes in a bowl.",
      "Drizzle lemon juice. Add pepper, salt and mint.",
      "Toss gently — avocado breaks if you over-mix. Eat immediately.",
    ],
    tip: "Avocado's monounsaturated fats help absorb fat-soluble vitamins from the sprouts and veggies. Don't skip the lemon — it also prevents avocado browning.",
  },

  "yogurt-herb-salad": {
    prep: 10, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "Salad: 2 cups mixed greens, 1 cucumber, 1 tomato, ¼ red onion, 4–5 cherry tomatoes",
      "Dressing: 3 tbsp low-fat curd (yogurt)",
      "1 tbsp fresh coriander, finely chopped",
      "1 tbsp fresh mint, finely chopped",
      "1 tsp lemon juice",
      "¼ tsp roasted cumin powder",
      "1 small garlic clove, minced (optional)",
      "Salt and pepper to taste",
    ],
    steps: [
      "Chop all salad vegetables and place in a large bowl.",
      "Make dressing: whisk curd with coriander, mint, lemon juice, cumin and garlic. Season with salt and pepper.",
      "Pour dressing over salad just before serving — the curd dressing can make greens wilt if left too long.",
      "Toss gently. Serve immediately with grilled protein or as a starter.",
    ],
    tip: "This probiotic dressing replaces mayo or processed dressings. The herbs are rich in antioxidants — mint has particularly strong antibacterial properties.",
  },

  "yogurt-pepper-cashew": {
    prep: 15, cook: 15, servings: 1, difficulty: "easy",
    ingredients: [
      "2 medium capsicums (any colour), halved, seeds removed",
      "3 tbsp Greek yogurt",
      "8–10 cashews, roasted",
      "1 tsp olive oil",
      "½ tsp dried oregano or mixed herbs",
      "Salt and pepper to taste",
      "Fresh mint to garnish",
    ],
    steps: [
      "Brush capsicum halves with olive oil. Roast at 200°C (or in a tawa on open flame) until charred and soft.",
      "Cool 5 min. Peel the charred skin off (or leave it on for smokiness).",
      "Place capsicum on a plate. Dollop yogurt over it.",
      "Scatter roasted cashews. Season with herbs, salt and pepper.",
      "Garnish with mint. Serve as a side or snack.",
    ],
    tip: "Roasted red capsicum has more vitamin C than raw — it concentrates as water evaporates. Yogurt adds protein and probiotics to what's otherwise just a vegetable.",
  },

  "veg-soup": {
    prep: 10, cook: 20, servings: 2, difficulty: "easy",
    ingredients: [
      "1 cup mixed veggies (carrot, beans, celery, tomato, peas, onion)",
      "2 garlic cloves, minced",
      "½ tsp black pepper",
      "1 tsp mixed herbs or cumin",
      "4 cups vegetable stock or water",
      "1 tsp olive oil",
      "Salt to taste",
      "Fresh coriander or parsley to garnish",
    ],
    steps: [
      "Heat olive oil in a pot. Sauté garlic 1 min. Add onion; cook 2 min.",
      "Add all remaining vegetables. Stir and cook 3 min.",
      "Add stock/water, herbs and pepper. Bring to boil.",
      "Reduce heat. Simmer 15 min until veggies are tender.",
      "For a thicker soup, blend 1–2 cups of the soup and stir back in.",
      "Adjust salt. Garnish with herbs. Serve hot.",
    ],
    tip: "Start dinner with a bowl of clear vegetable soup — studies show it reduces total meal calorie intake by 15–20% by creating early satiety.",
  },

  "lentil-soup": {
    prep: 5, cook: 25, servings: 2, difficulty: "easy",
    ingredients: [
      "½ cup red lentils (masoor dal)",
      "1 large tomato, chopped",
      "1 carrot, diced",
      "1 onion, chopped",
      "3 garlic cloves, minced",
      "1 tsp cumin seeds or cumin powder",
      "½ tsp turmeric",
      "½ tsp smoked paprika",
      "3 cups vegetable stock",
      "1 tbsp lemon juice",
      "1 tbsp olive oil",
    ],
    steps: [
      "Heat olive oil. Sauté onion 3 min. Add garlic and cumin; cook 1 min.",
      "Add carrot; stir 2 min. Add lentils, tomato, turmeric and paprika.",
      "Pour in stock. Bring to boil, then reduce to simmer.",
      "Cook 20 min until lentils fully dissolve and soup thickens naturally.",
      "Blend half the soup for a creamier texture if desired.",
      "Finish with lemon juice. Adjust salt. Serve with whole grain bread or pita.",
    ],
    tip: "Red lentils (GI 21) are one of the lowest GI foods. They don't need soaking and cook to a creamy texture in under 20 minutes.",
  },

  "hummus-falafel-platter": {
    prep: 20, cook: 20, servings: 2, difficulty: "medium",
    ingredients: [
      "Falafel: 1 can chickpeas (drained), ½ onion, 2 garlic cloves, 2 tbsp fresh coriander+parsley, 1 tsp cumin, 2 tbsp whole wheat flour, salt",
      "Hummus: ½ can chickpeas, 2 tbsp tahini, 1 lemon (juice), 1 garlic clove, 2 tbsp olive oil, salt",
      "Platter: 1 roasted capsicum, 1 carrot (sticks), 1 cucumber, a few olives, pita bread",
    ],
    steps: [
      "Hummus: Blend chickpeas, tahini, lemon juice, garlic, olive oil and 3 tbsp water until very smooth. Season with salt. Refrigerate.",
      "Falafel: Pulse chickpeas, onion, garlic, herbs, cumin and flour in a food processor — rough texture, not a paste. Season with salt. Rest 15 min in fridge.",
      "Shape into small patties or balls. Bake at 200°C for 20 min, flipping halfway. Or shallow-fry 3 min per side.",
      "Assemble: Spread hummus on a plate. Place falafel alongside roasted peppers, carrot sticks, cucumber and olives.",
      "Serve with warm whole grain pita.",
    ],
    tip: "Baked falafel has ~60% less fat than deep-fried, with no compromise on protein or fiber. The platter format ensures a balanced macronutrient meal.",
  },

  "greek-salad": {
    prep: 10, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "2 tomatoes, cubed",
      "1 cucumber, cubed",
      "½ red onion, thinly sliced",
      "10 Kalamata olives",
      "50g low-fat feta (optional — skip for lower sodium)",
      "Dressing: 1 tbsp extra-virgin olive oil, 1 tbsp red wine vinegar",
      "½ tsp dried oregano, salt and pepper",
    ],
    steps: [
      "Combine tomatoes, cucumber, onion and olives in a bowl.",
      "Crumble feta over the top.",
      "Whisk olive oil, vinegar, oregano, salt and pepper.",
      "Drizzle dressing. Toss gently. Serve immediately or within 30 min.",
    ],
    tip: "Extra-virgin olive oil is rich in oleocanthal — a natural anti-inflammatory with effects similar to low-dose ibuprofen. It's the key fat in the Mediterranean diet's heart benefits.",
  },

  "falafel": {
    prep: 20, cook: 20, servings: 2, difficulty: "medium",
    ingredients: [
      "1 can (400g) chickpeas, drained",
      "½ onion",
      "3 garlic cloves",
      "3 tbsp fresh parsley + coriander",
      "1 tsp cumin, ½ tsp coriander powder",
      "2 tbsp whole wheat flour",
      "½ tsp baking powder",
      "Salt and pepper",
      "1 tbsp olive oil (for brushing)",
    ],
    steps: [
      "Pulse chickpeas, onion, garlic, herbs and spices in a food processor until crumbly — not smooth.",
      "Add flour and baking powder. Mix. Refrigerate 30 min for firmer falafels.",
      "Shape into 8 small patties. Place on a lined baking tray.",
      "Brush with olive oil. Bake at 200°C for 12 min. Flip. Bake 8 more min until golden.",
      "Serve in whole wheat pita with hummus, cucumber and tomato.",
    ],
    tip: "Resting the mix in the fridge prevents falafels from falling apart and allows the flour to hydrate properly.",
  },

  "tabbouleh": {
    prep: 15, cook: 10, servings: 2, difficulty: "easy",
    ingredients: [
      "⅓ cup bulgur wheat",
      "1 large bunch flat-leaf parsley, finely chopped",
      "¼ cup fresh mint, finely chopped",
      "2 tomatoes, finely diced",
      "¼ cucumber, finely diced",
      "2 spring onions, sliced",
      "Dressing: 3 tbsp lemon juice, 2 tbsp olive oil, salt",
    ],
    steps: [
      "Cook bulgur: pour ½ cup boiling water over bulgur. Cover and rest 10 min. Fluff and cool.",
      "Finely chop parsley and mint — this is a herb salad, not a grain salad. Herbs should dominate.",
      "Combine parsley, mint, tomato, cucumber and spring onion in a bowl.",
      "Add cooled bulgur. Dress with lemon juice, olive oil and salt.",
      "Toss. Refrigerate 15 min before serving for flavours to meld.",
    ],
    tip: "Authentic tabbouleh uses far more parsley than bulgur. Parsley is exceptionally high in vitamin K, vitamin C and folate.",
  },

  "yogurt-parfait": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "180g Greek yogurt",
      "¼ cup rolled oats (raw) or granola (low-sugar)",
      "½ cup mixed berries (strawberry, blueberry, raspberry)",
      "1 tbsp honey",
      "1 tbsp chia seeds",
      "5 almonds, slivered",
    ],
    steps: [
      "In a glass or bowl, layer: ½ the Greek yogurt at the bottom.",
      "Add half the oats/granola. Add half the berries.",
      "Repeat the layers — yogurt, oats, berries.",
      "Top with honey, chia seeds and slivered almonds.",
      "Eat immediately or refrigerate overnight (oats soak up moisture and soften).",
    ],
    tip: "Using raw oats (not granola) cuts sugar significantly. The overnight soak softens oats naturally without cooking, also reducing phytic acid.",
  },

  // ── SNACKS ─────────────────────────────────────────────────────────────────

  "soaked-almonds": {
    prep: 0, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "20–25 raw almonds",
      "Enough water to cover",
    ],
    steps: [
      "The night before: place almonds in a small bowl. Cover with water. Cover the bowl.",
      "Morning: drain and peel the skin off (it should slip off easily).",
      "Eat as is, or with a piece of fruit.",
    ],
    tip: "Soaking neutralises enzyme inhibitors in the almond skin, making the nut easier to digest and increasing the bioavailability of vitamin E, magnesium and iron by ~25%.",
  },

  "sprouts": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "60g fresh moong sprouts",
      "¼ cucumber, diced",
      "1 tbsp lemon juice",
      "¼ tsp chaat masala",
      "Few leaves of coriander",
      "Salt to taste",
    ],
    steps: [
      "Rinse sprouts well under running water.",
      "Lightly steam for 3 min if you prefer — raw is fine too.",
      "Toss with cucumber, lemon juice, chaat masala, coriander and salt.",
      "Eat immediately.",
    ],
    tip: "Sprouting increases the protein content of moong by ~10% and creates digestive enzymes that make it easier on the gut than cooked dal.",
  },

  "roasted-chana": {
    prep: 2, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "40g roasted chana (dry roasted black chickpeas)",
      "Pinch of rock salt",
      "¼ tsp cumin powder",
      "Squeeze of lemon (optional)",
    ],
    steps: [
      "Buy pre-roasted chana from any Indian grocery store — no cooking required.",
      "Toss with rock salt and cumin powder.",
      "Squeeze lemon if desired. Eat as a standalone snack.",
    ],
    tip: "Roasted chana has a GI of 28 and delivers 8g protein per 40g serving — one of the most efficient high-protein, low-GI snacks. Perfect between meals to prevent blood sugar dips.",
  },

  "hummus-veg": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "Crudités: 2 celery sticks, 1 carrot, ½ cucumber (sliced into sticks)",
      "Hummus: 3 tbsp store-bought or homemade (blend chickpeas + tahini + lemon + garlic + olive oil)",
    ],
    steps: [
      "Wash and cut veggies into sticks.",
      "Serve hummus in a small bowl alongside the vegetable sticks.",
      "Dip and eat.",
    ],
    tip: "The fibre in vegetables + protein in hummus creates a combination that keeps you full for 2–3 hours without a blood sugar spike.",
  },

  "brown-rice": {
    prep: 2, cook: 35, servings: 2, difficulty: "easy",
    ingredients: [
      "1 cup brown rice",
      "2.5 cups water",
      "Pinch of salt",
    ],
    steps: [
      "Rinse rice 2–3 times. Optional: soak 30 min to reduce cooking time.",
      "Bring water to a boil with salt. Add rinsed rice.",
      "Reduce heat to lowest setting. Cover tightly. Cook 35 min without opening.",
      "Remove from heat. Let stand covered 10 min. Fluff with a fork.",
    ],
    tip: "Never stir brown rice while cooking — it releases starch and makes it gummy. The resting step is essential for a fluffy result.",
  },

  "roti": {
    prep: 10, cook: 10, servings: 1, difficulty: "easy",
    ingredients: [
      "½ cup whole wheat flour (atta)",
      "Water to knead (approx. ¼ cup)",
      "Pinch of salt",
      "½ tsp ghee (to apply after cooking)",
    ],
    steps: [
      "Mix flour and salt. Add water gradually, kneading into a soft, smooth dough. It should not stick to your hands.",
      "Rest dough 10 min covered with a damp cloth.",
      "Divide into 2 small balls. Dust with flour. Roll into thin rounds (~20 cm).",
      "Cook on a hot tawa 1–2 min until bubbles appear. Flip.",
      "Press gently with a cloth — it will puff up. Cook 1 min. Apply a few drops of ghee.",
      "Serve immediately with dal or sabzi.",
    ],
    tip: "Whole wheat atta has 3x more fiber than maida. The small amount of ghee on top actually slows glucose absorption — a functional fat benefit.",
  },

  "chicken": {
    prep: 10, cook: 18, servings: 1, difficulty: "easy",
    ingredients: [
      "150g chicken breast",
      "1 tsp olive oil",
      "½ tsp garlic powder",
      "½ tsp smoked paprika",
      "¼ tsp black pepper",
      "½ tsp dried oregano or mixed herbs",
      "Juice of ½ lemon",
      "Salt to taste",
    ],
    steps: [
      "Pat chicken dry. Pound to even thickness (~2cm) if thick — ensures uniform cooking.",
      "Combine all spices, oil and lemon juice. Coat chicken on both sides. Marinate 10–30 min if possible.",
      "Heat a grill pan or skillet on medium-high until hot.",
      "Cook chicken 6–7 min per side — don't move it so it gets good sear marks.",
      "Rest 3 min before slicing — this keeps the juices inside.",
      "Slice and serve with a salad and brown rice.",
    ],
    tip: "Resting chicken after cooking is critical. Cutting it immediately causes all the juices to run out, making it dry. 3 minutes is enough.",
  },

  "salmon": {
    prep: 5, cook: 15, servings: 1, difficulty: "easy",
    ingredients: [
      "150g salmon fillet (skin on)",
      "1 tsp olive oil",
      "1 lemon (juice and zest)",
      "1 garlic clove, minced",
      "½ tsp dried dill or parsley",
      "Salt and black pepper to taste",
    ],
    steps: [
      "Preheat oven to 200°C. Line a tray with foil.",
      "Mix olive oil, lemon juice, lemon zest, garlic, dill, salt and pepper.",
      "Place salmon on foil. Spoon marinade over it.",
      "Bake 12–15 min depending on thickness — it should flake easily when pressed with a fork.",
      "Serve with steamed broccoli and a lemon wedge.",
    ],
    tip: "Salmon is one of the best sources of EPA and DHA omega-3 (2–3g per 150g serving) — these specific forms are directly anti-inflammatory and cardioprotective.",
  },

  "fish-curry": {
    prep: 10, cook: 20, servings: 2, difficulty: "medium",
    ingredients: [
      "300g firm white fish (surmai, rohu, or tilapia), cubed",
      "1 onion, blended",
      "2 tomatoes, blended",
      "1 tsp ginger-garlic paste",
      "¼ tsp turmeric",
      "1 tsp coriander powder",
      "½ tsp cumin powder",
      "½ tsp red chilli",
      "½ tsp garam masala",
      "1 tbsp coriander leaves",
      "Salt, 1 tsp oil",
    ],
    steps: [
      "Heat oil in a wide pan. Sauté onion purée 6–8 min on medium until light golden.",
      "Add ginger-garlic paste; cook 2 min. Add tomato purée and all dry spices except garam masala.",
      "Cook 6 min until oil separates from the masala.",
      "Gently slide fish pieces in. Don't stir — shake the pan instead to avoid breaking fish.",
      "Cover and cook 8–10 min on medium-low until fish is cooked through.",
      "Add garam masala and coriander. Serve with brown rice.",
    ],
    tip: "Adding fish to the masala rather than frying first keeps it tender and reduces oil. Surmai (king fish) is one of the best Indian fish for omega-3 content.",
  },

  "surmai": {
    prep: 5, cook: 15, servings: 1, difficulty: "easy",
    ingredients: [
      "150g surmai (king fish) steaks",
      "½ tsp turmeric",
      "½ tsp red chilli powder",
      "1 tsp lemon juice",
      "Salt to taste",
      "1 tsp oil (to brush the grill)",
    ],
    steps: [
      "Mix turmeric, chilli, lemon juice and salt into a paste. Coat fish steaks on both sides.",
      "Marinate 15 min at room temperature (or up to 1 hour refrigerated).",
      "Heat a grill pan on high. Brush with oil.",
      "Grill fish 5–6 min per side — it should have golden grill marks and flake easily.",
      "Serve with a wedge of lemon and a side salad.",
    ],
    tip: "Surmai is low in saturated fat and high in omega-3. The turmeric marinade adds curcumin's anti-inflammatory benefit directly into the fish.",
  },

  "paneer": {
    prep: 5, cook: 20, servings: 2, difficulty: "easy",
    ingredients: [
      "100g low-fat paneer, cubed",
      "1 cup spinach, chopped (or capsicum for matar paneer variant)",
      "1 onion, finely chopped",
      "2 tomatoes, blended",
      "1 tsp ginger-garlic paste",
      "½ tsp cumin, ¼ tsp turmeric, ½ tsp coriander powder",
      "¼ tsp garam masala",
      "Salt, 1 tsp oil",
    ],
    steps: [
      "Heat oil. Add cumin. Sauté onion 4 min. Add ginger-garlic paste; cook 1 min.",
      "Add tomato purée and dry spices. Cook 6–8 min until oil separates.",
      "Add spinach; cook 3 min until wilted. Add paneer cubes.",
      "Cook gently 3–4 min. Add ½ cup water for a gravy. Add garam masala.",
      "Serve with 2 whole wheat rotis.",
    ],
    tip: "Low-fat paneer has ~18g protein per 100g — same as full-fat. Pairing it with spinach provides both calcium and iron in one dish.",
  },

  "shakshuka": {
    prep: 8, cook: 15, servings: 1, difficulty: "easy",
    ingredients: [
      "2 large eggs",
      "1 can (200g) crushed tomatoes or 2 fresh tomatoes blended",
      "½ onion, finely chopped",
      "1 garlic clove, minced",
      "½ red capsicum, diced",
      "½ tsp cumin, ¼ tsp smoked paprika, pinch of chilli flakes",
      "Salt and pepper",
      "1 tsp olive oil",
      "Fresh parsley or coriander",
    ],
    steps: [
      "Heat olive oil in a skillet. Sauté onion and capsicum 4 min.",
      "Add garlic, cumin, paprika and chilli. Cook 1 min.",
      "Pour in crushed tomatoes. Season. Simmer 5 min until sauce thickens slightly.",
      "Make 2 wells in the sauce. Crack one egg into each well.",
      "Cover and cook on medium-low 5–7 min until whites set but yolks remain runny.",
      "Garnish with herbs. Serve directly from the pan with whole grain bread.",
    ],
    tip: "Shakshuka is a one-pan meal. Lycopene in cooked tomatoes (the red pigment) is better absorbed than in raw tomatoes — cooking tomatoes in oil increases bioavailability by ~4x.",
  },

  "cottage-cheese": {
    prep: 3, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "150g low-fat cottage cheese",
      "½ cup cucumber, diced",
      "¼ cup cherry tomatoes, halved",
      "1 tbsp fresh herbs (mint, chives or dill)",
      "¼ tsp black pepper",
      "½ tsp lemon juice",
      "Salt to taste",
    ],
    steps: [
      "Spoon cottage cheese into a bowl.",
      "Top with cucumber, cherry tomatoes and herbs.",
      "Drizzle lemon juice. Season with pepper and salt.",
      "Eat as a breakfast bowl or post-workout snack.",
    ],
    tip: "Cottage cheese is rich in casein — a slow-digesting protein that keeps you full longer than whey. 150g provides ~20g protein at only 160 calories.",
  },

  // ── CALORIE-DENSE HEALTHY OPTIONS ──────────────────────────────────────────

  "pb-banana-toast": {
    prep: 5, cook: 3, servings: 1, difficulty: "easy",
    ingredients: [
      "2 slices whole grain bread",
      "2 tbsp natural peanut butter (no added sugar)",
      "1 ripe banana, sliced",
      "½ tsp chia or flax seeds (optional)",
      "Pinch of cinnamon",
    ],
    steps: [
      "Toast the bread until golden and crisp.",
      "Spread 1 tbsp peanut butter on each slice while warm.",
      "Arrange banana slices on top.",
      "Sprinkle with seeds and cinnamon. Serve immediately.",
    ],
    tip: "A perfect pre-workout meal 60–90 minutes before training — the banana gives quick fuel while peanut butter and whole grains release energy slowly.",
  },

  "granola-yogurt": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "¾ cup thick Greek yogurt",
      "½ cup low-sugar granola (oats, nuts, seeds)",
      "1 tsp honey",
      "¼ cup berries or chopped fruit",
    ],
    steps: [
      "Spoon half the yogurt into a bowl or glass.",
      "Layer with half the granola and fruit.",
      "Repeat the layers, drizzle honey on top.",
      "Serve immediately so the granola stays crunchy.",
    ],
    tip: "Choose granola with less than 8g sugar per serving — or toast your own oats with nuts and a little olive oil for full control.",
  },

  "banana-pb-smoothie": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "1 ripe banana (frozen for a thicker shake)",
      "1½ tbsp peanut butter",
      "1 cup milk (or soy milk)",
      "2 tbsp Greek yogurt",
      "½ tsp cocoa powder (optional)",
      "3–4 ice cubes",
    ],
    steps: [
      "Add all ingredients to a blender.",
      "Blend 45–60 seconds until completely smooth.",
      "Pour into a tall glass and drink fresh.",
    ],
    tip: "Great post-workout: ~380 kcal with 16g protein, potassium for muscle recovery, and carbs to refill glycogen.",
  },

  "dates-nut-laddoo": {
    prep: 15, cook: 0, servings: 4, difficulty: "easy",
    ingredients: [
      "1 cup soft dates (khajur), pitted",
      "½ cup mixed nuts (almonds, walnuts, cashews)",
      "2 tbsp desiccated coconut",
      "1 tbsp sesame seeds",
      "¼ tsp cardamom powder",
    ],
    steps: [
      "Pulse nuts in a food processor until coarsely ground. Remove.",
      "Blend dates to a sticky paste.",
      "Knead dates, nuts, sesame and cardamom together.",
      "Roll into 8 small balls; coat with coconut.",
      "Store refrigerated up to 2 weeks. Serving = 2 balls.",
    ],
    tip: "No added sugar — dates provide natural sweetness plus iron and fiber. Ideal healthy replacement for store-bought sweets.",
  },

  "dried-fruit-mix": {
    prep: 5, cook: 0, servings: 6, difficulty: "easy",
    ingredients: [
      "¼ cup almonds",
      "¼ cup walnuts",
      "2 tbsp cashews",
      "2 tbsp raisins",
      "2 dried apricots or figs, chopped",
      "1 tbsp pumpkin seeds",
    ],
    steps: [
      "Mix everything in a jar and shake well.",
      "Portion ~45g (a small handful) per serving.",
      "Store airtight up to a month.",
    ],
    tip: "Pre-portion into small containers — dried fruit and nuts are healthy but calorie-dense, so a measured handful keeps it intentional.",
  },

  "mango": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: [
      "1 medium ripe mango (aam)",
      "Squeeze of lime (optional)",
      "Pinch of chaat masala (optional)",
    ],
    steps: [
      "Wash, peel and slice the mango off the seed.",
      "Cube the flesh and chill 10 minutes.",
      "Finish with lime or a tiny pinch of chaat masala.",
    ],
    tip: "Mango is rich in vitamin A and C. GI is moderate (~51) — enjoy a measured portion mid-morning rather than after a heavy meal.",
  },

  "sweet-corn-chaat": {
    prep: 10, cook: 5, servings: 1, difficulty: "easy",
    ingredients: [
      "1 cup sweet corn kernels (boiled or steamed)",
      "¼ cup cucumber, finely diced",
      "¼ cup tomato, finely diced",
      "1 tbsp onion, finely chopped",
      "½ tsp chaat masala",
      "1 tsp lemon juice",
      "Fresh coriander",
    ],
    steps: [
      "Boil or steam corn kernels 4–5 minutes; drain.",
      "Toss warm corn with cucumber, tomato and onion.",
      "Season with chaat masala and lemon juice.",
      "Garnish with coriander and serve warm.",
    ],
    tip: "A street-food favourite made healthy — no butter needed; lemon and chaat masala carry all the flavour.",
  },

  "veg-biryani-brown": {
    prep: 20, cook: 30, servings: 2, difficulty: "medium",
    ingredients: [
      "1 cup brown basmati rice, soaked 30 min",
      "1½ cups mixed vegetables (carrot, beans, peas, cauliflower)",
      "1 onion, sliced",
      "1 tbsp ginger-garlic paste",
      "2 tbsp low-fat yogurt",
      "1 tsp biryani masala, ½ tsp turmeric",
      "Whole spices: 1 bay leaf, 2 cloves, 1 cardamom",
      "2 tsp oil, fresh mint & coriander",
    ],
    steps: [
      "Par-cook soaked rice 12–15 min until 80% done; drain.",
      "Sauté whole spices and onion in oil until golden.",
      "Add ginger-garlic paste, vegetables, masala and turmeric; cook 5 min.",
      "Stir in yogurt. Layer rice over the vegetables.",
      "Cover tightly and steam on lowest heat 12–15 min (dum).",
      "Fluff gently, garnish with mint and coriander.",
    ],
    tip: "Brown basmati keeps the GI moderate and fiber high while still delivering the energy a training day needs.",
  },

  "ww-pasta": {
    prep: 10, cook: 15, servings: 2, difficulty: "easy",
    ingredients: [
      "150g whole wheat penne or fusilli",
      "2 cups mixed vegetables (zucchini, bell pepper, broccoli, cherry tomatoes)",
      "2 cloves garlic, sliced",
      "1½ tbsp olive oil",
      "½ tsp chilli flakes, dried oregano",
      "2 tbsp grated parmesan (optional)",
    ],
    steps: [
      "Cook pasta al dente per packet; reserve ½ cup pasta water.",
      "Sauté garlic in olive oil 30 seconds; add vegetables, cook 4–5 min.",
      "Toss in pasta with a splash of pasta water to coat.",
      "Season with chilli flakes, oregano, salt and pepper.",
      "Finish with parmesan if using.",
    ],
    tip: "Whole wheat pasta has ~3x the fiber of white pasta and a GI of ~48 — a smart high-carb fuel for active days.",
  },

  "couscous-chickpea": {
    prep: 10, cook: 10, servings: 2, difficulty: "easy",
    ingredients: [
      "¾ cup whole wheat couscous",
      "1 cup cooked chickpeas",
      "1 cup boiling vegetable stock or water",
      "½ cup cucumber & tomato, diced",
      "2 tbsp olive oil, 1 tbsp lemon juice",
      "2 tbsp fresh parsley/mint, ¼ tsp cumin",
    ],
    steps: [
      "Pour boiling stock over couscous, cover 5 minutes, fluff with a fork.",
      "Whisk olive oil, lemon juice and cumin into a dressing.",
      "Toss couscous with chickpeas, vegetables and herbs.",
      "Season and serve warm or at room temperature.",
    ],
    tip: "Chickpeas add plant protein and drop the overall glycemic load of the bowl. Great make-ahead lunch — keeps 3 days refrigerated.",
  },

  "baked-potato": {
    prep: 5, cook: 45, servings: 1, difficulty: "easy",
    ingredients: [
      "1 large potato (skin on), scrubbed",
      "3 tbsp thick low-fat yogurt",
      "1 tbsp chives or spring onion, chopped",
      "½ tsp olive oil, salt & black pepper",
    ],
    steps: [
      "Prick the potato, rub with oil and a little salt.",
      "Bake at 200°C for 45–55 min until a knife slides in easily (or microwave 8–10 min).",
      "Split open, fluff the inside with a fork.",
      "Top with herbed yogurt, chives and black pepper.",
    ],
    tip: "Keeping the skin on doubles the fiber and holds most of the potassium. Yogurt replaces butter/sour cream at a fraction of the saturated fat.",
  },

  "paneer-rice-bowl": {
    prep: 10, cook: 20, servings: 1, difficulty: "easy",
    ingredients: [
      "100g low-fat paneer, cubed",
      "¾ cup cooked brown rice",
      "1 cup mixed vegetables (peas, carrot, capsicum)",
      "1 tsp oil, ½ tsp cumin seeds",
      "¼ tsp turmeric, ½ tsp garam masala",
      "1 tbsp coriander, squeeze of lemon",
    ],
    steps: [
      "Sauté cumin in oil; add vegetables and cook 4–5 min.",
      "Add turmeric, garam masala and paneer; toss gently 2 min.",
      "Serve over warm brown rice.",
      "Finish with coriander and lemon.",
    ],
    tip: "A complete one-bowl meal: ~22g protein plus complex carbs — ideal for lunch on strength-training days.",
  },

  // ── QUICK RECIPES (compact) ─────────────────────────────────────────────────

  "egg-boiled": {
    prep: 1, cook: 10, servings: 1, difficulty: "easy",
    ingredients: ["2 eggs", "Water", "Pinch of salt & pepper"],
    steps: [
      "Place eggs in a pan, cover with cold water, bring to a boil.",
      "Simmer 8–9 min for fully set yolks (6 min for jammy).",
      "Cool in cold water 2 min, peel, season and eat.",
    ],
    tip: "Boil a batch for the week — they keep 5 days refrigerated in the shell.",
  },

  "seabass": {
    prep: 5, cook: 15, servings: 1, difficulty: "easy",
    ingredients: ["150g sea bass fillet", "1 tsp olive oil", "Lemon, garlic, fresh herbs (thyme/parsley)", "Salt & pepper"],
    steps: [
      "Pat fish dry, rub with oil, garlic, salt and pepper.",
      "Bake at 200°C for 12–15 min until flaky.",
      "Finish with lemon juice and herbs.",
    ],
    tip: "Skin-on fillets stay juicier — crisp the skin side first if pan-searing.",
  },

  "bajra-roti": {
    prep: 10, cook: 10, servings: 2, difficulty: "medium",
    ingredients: ["1 cup bajra (pearl millet) flour", "Warm water", "Pinch of salt"],
    steps: [
      "Knead flour with warm water and salt into a soft dough.",
      "Pat each ball flat between palms (bajra has no gluten — go gently).",
      "Cook on a hot tawa ~2 min per side until spotted; finish over open flame.",
    ],
    tip: "Bajra is rich in magnesium and iron — a warming whole grain, great with sabzi and curd.",
  },

  "bitter-gourd": {
    prep: 15, cook: 15, servings: 2, difficulty: "medium",
    ingredients: ["2 bitter gourds (karela), sliced", "1 onion, sliced", "½ tsp turmeric, 1 tsp fennel", "1 tbsp oil, salt"],
    steps: [
      "Salt karela slices 10 min, squeeze out juice (cuts bitterness).",
      "Sauté onion in oil, add karela, turmeric and fennel.",
      "Cook covered on low 10–12 min until tender.",
    ],
    tip: "Compounds in karela (charantin, polypeptide-p) are studied for blood-sugar support — a classic diabetes-friendly sabzi.",
  },

  "cauliflower": {
    prep: 10, cook: 15, servings: 2, difficulty: "easy",
    ingredients: ["½ head cauliflower florets", "1 tsp cumin, ½ tsp turmeric", "1 tomato, chopped", "1 tbsp oil, coriander"],
    steps: [
      "Sauté cumin in oil, add tomato and spices.",
      "Add florets, toss, cover and cook 10–12 min.",
      "Garnish with coriander.",
    ],
    tip: "Cooking cruciferous vegetables reduces goitrogens — relevant if you have a thyroid condition.",
  },

  "quinoa": {
    prep: 2, cook: 15, servings: 2, difficulty: "easy",
    ingredients: ["1 cup quinoa, rinsed", "2 cups water or stock", "Pinch of salt"],
    steps: [
      "Rinse quinoa well (removes bitter saponins).",
      "Simmer covered 15 min until water is absorbed.",
      "Rest 5 min off heat, fluff with a fork.",
    ],
    tip: "One of the few plant foods with all nine essential amino acids.",
  },

  "sweet-potato": {
    prep: 5, cook: 25, servings: 1, difficulty: "easy",
    ingredients: ["1 medium sweet potato, cubed", "1 tsp olive oil", "Paprika, salt, pepper"],
    steps: [
      "Toss cubes with oil and seasoning.",
      "Roast at 200°C for 22–25 min, turning once, until caramelised.",
    ],
    tip: "Lower GI than white potato and packed with beta-carotene.",
  },

  "chickpea-tofu-salad": {
    prep: 10, cook: 5, servings: 1, difficulty: "easy",
    ingredients: ["¾ cup cooked chickpeas", "100g firm tofu, cubed & pan-toasted", "Cucumber, tomato, red onion", "Lemon-olive oil dressing"],
    steps: [
      "Toast tofu cubes in a dry pan until golden.",
      "Toss with chickpeas, vegetables and dressing.",
    ],
    tip: "Two plant proteins together give a complete amino-acid profile.",
  },

  "broccoli": {
    prep: 5, cook: 12, servings: 2, difficulty: "easy",
    ingredients: ["1 head broccoli + 1 bell pepper, chopped", "1 tsp olive oil", "Garlic, chilli flakes, salt"],
    steps: [
      "Toss vegetables with oil, garlic and seasoning.",
      "Roast at 210°C for 10–12 min until edges char slightly.",
    ],
    tip: "Roasting keeps more vitamin C than boiling.",
  },

  "asparagus": {
    prep: 3, cook: 5, servings: 1, difficulty: "easy",
    ingredients: ["1 bunch asparagus, woody ends snapped", "½ tsp olive oil, lemon, salt"],
    steps: [
      "Steam or sauté 4–5 min until tender-crisp.",
      "Finish with lemon and a little salt.",
    ],
    tip: "Very low calorie and one of the best natural sources of folate.",
  },

  "turkey-wrap": {
    prep: 8, cook: 0, servings: 1, difficulty: "easy",
    ingredients: ["1 whole wheat tortilla", "100g sliced turkey breast", "½ avocado, lettuce, tomato", "1 tsp mustard or yogurt spread"],
    steps: [
      "Spread the tortilla, layer turkey, avocado and veg.",
      "Roll tightly, slice in half.",
    ],
    tip: "Choose low-sodium deli turkey or use home-roasted leftovers.",
  },

  "med-veg": {
    prep: 10, cook: 25, servings: 2, difficulty: "easy",
    ingredients: ["1 eggplant + 2 zucchini, sliced", "1½ tbsp olive oil", "Garlic, oregano, salt, pepper"],
    steps: [
      "Toss slices with oil and seasoning.",
      "Roast at 200°C for 22–25 min until soft and golden.",
    ],
    tip: "Olive oil helps absorb the fat-soluble antioxidants in the vegetables.",
  },

  "pita-hummus": {
    prep: 10, cook: 0, servings: 2, difficulty: "easy",
    ingredients: ["1 whole grain pita", "1 cup cooked chickpeas", "1 tbsp tahini, lemon, garlic, olive oil"],
    steps: [
      "Blend chickpeas, tahini, lemon, garlic and a splash of water until creamy.",
      "Warm the pita, cut into wedges, serve with hummus.",
    ],
    tip: "Homemade hummus has a fraction of the sodium of store-bought.",
  },

  "avocado-toast": {
    prep: 5, cook: 3, servings: 1, difficulty: "easy",
    ingredients: ["2 slices whole grain bread", "½ ripe avocado", "Lemon, chilli flakes, salt"],
    steps: [
      "Toast the bread. Mash avocado with lemon and salt.",
      "Spread thickly, finish with chilli flakes.",
    ],
    tip: "Add a boiled egg or hemp seeds to turn it into a complete-protein breakfast.",
  },

  "muesli-yogurt": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: ["½ cup rolled oats", "¾ cup yogurt", "Grated apple, cinnamon, chopped nuts"],
    steps: [
      "Mix oats into yogurt with grated apple and cinnamon.",
      "Rest 10 min (or overnight) so oats soften; top with nuts.",
    ],
    tip: "Overnight soaking makes the oats easier to digest and the texture creamier.",
  },

  "makhana": {
    prep: 1, cook: 8, servings: 2, difficulty: "easy",
    ingredients: ["2 cups makhana (fox nuts)", "1 tsp ghee or oil", "Salt, black pepper or peri-peri"],
    steps: [
      "Dry-roast makhana with ghee on low 6–8 min until crisp.",
      "Season while warm.",
    ],
    tip: "A light, high-magnesium snack — far better crunch-for-calories than chips.",
  },

  "edamame": {
    prep: 1, cook: 5, servings: 1, difficulty: "easy",
    ingredients: ["1 cup edamame pods", "Sea salt"],
    steps: [
      "Boil or steam pods 4–5 min.",
      "Drain, sprinkle with salt, pop beans from pods to eat.",
    ],
    tip: "A complete plant protein — 11g per cup.",
  },

  "dhokla": {
    prep: 10, cook: 20, servings: 2, difficulty: "medium",
    ingredients: ["1 cup besan (gram flour)", "¾ cup water + 1 tbsp lemon juice", "1 tsp Eno / fruit salt", "Mustard seeds, curry leaves, green chilli for tempering"],
    steps: [
      "Whisk besan, water, lemon and a pinch of salt into a smooth batter.",
      "Stir in Eno, pour into a greased tin, steam 15–18 min.",
      "Temper mustard seeds, curry leaves and chilli in 1 tsp oil; pour over.",
      "Cut into squares and serve.",
    ],
    tip: "Steamed, not fried — one of the lightest high-protein Indian snacks.",
  },

  "tandoori-chicken": {
    prep: 15, cook: 25, servings: 2, difficulty: "medium",
    ingredients: ["300g chicken (skinless, bone-in or breast)", "3 tbsp thick yogurt", "1 tbsp ginger-garlic paste", "1 tsp each: tandoori masala, chilli, turmeric; lemon"],
    steps: [
      "Slash the chicken, marinate in yogurt + spices 30 min (or overnight).",
      "Roast at 220°C for 20–25 min (or grill) until charred at the edges.",
      "Rest 5 min, squeeze lemon over.",
    ],
    tip: "Yogurt tenderises without any cream — restaurant flavour at a fraction of the fat.",
  },

  "egg-curry": {
    prep: 10, cook: 20, servings: 2, difficulty: "easy",
    ingredients: ["4 boiled eggs, halved", "2 onions + 2 tomatoes, pureed", "1 tsp each: ginger-garlic, garam masala, turmeric", "1 tbsp oil"],
    steps: [
      "Sauté onion puree until golden, add ginger-garlic and spices.",
      "Add tomato puree, cook until oil separates; add ½ cup water.",
      "Slide in the eggs, simmer 5 min.",
    ],
    tip: "Simmering halved eggs cut-side up lets the gravy soak into the yolk.",
  },

  "kadhi": {
    prep: 5, cook: 25, servings: 2, difficulty: "medium",
    ingredients: ["1 cup low-fat yogurt + 3 tbsp besan", "2½ cups water", "Mustard seeds, cumin, curry leaves, turmeric", "1 tsp oil"],
    steps: [
      "Whisk yogurt, besan, turmeric and water until lump-free.",
      "Simmer on low 15–20 min, stirring, until it thickens.",
      "Temper mustard, cumin and curry leaves in oil; pour over.",
      "Serve with brown rice.",
    ],
    tip: "Skip the fried pakoras — the kadhi itself is the light, probiotic-friendly part.",
  },

  "palak-paneer": {
    prep: 10, cook: 20, servings: 2, difficulty: "medium",
    ingredients: ["200g spinach, blanched & pureed", "150g low-fat paneer, cubed", "1 onion + 1 tomato, chopped", "Ginger-garlic, cumin, garam masala, 1 tbsp oil"],
    steps: [
      "Blanch spinach 2 min, refresh in cold water, puree.",
      "Sauté onion, ginger-garlic, then tomato and spices.",
      "Add spinach puree, simmer 5 min; fold in paneer.",
    ],
    tip: "Blanching + cold water keeps the spinach bright green and preserves folate.",
  },

  "veg-pulao": {
    prep: 10, cook: 25, servings: 2, difficulty: "easy",
    ingredients: ["1 cup brown basmati, soaked", "1½ cups mixed vegetables", "Whole spices (bay, clove, cinnamon), cumin", "2 tsp oil"],
    steps: [
      "Sauté whole spices and cumin in oil; add vegetables 3 min.",
      "Add rice and 2 cups water; simmer covered 20–22 min.",
      "Rest 5 min, fluff.",
    ],
    tip: "A one-pot meal — add a bowl of curd or dal for protein.",
  },

  "sambar-rice": {
    prep: 10, cook: 30, servings: 2, difficulty: "medium",
    ingredients: ["½ cup toor dal", "1½ cups mixed vegetables (drumstick, pumpkin, okra)", "2 tbsp sambar powder, tamarind", "1 cup cooked brown rice, mustard-curry leaf tempering"],
    steps: [
      "Pressure-cook dal until soft; mash.",
      "Simmer vegetables with sambar powder and tamarind water 10 min.",
      "Add dal, simmer 5 min; temper and pour over.",
      "Serve hot over brown rice.",
    ],
    tip: "Dal + rice together form a complete protein — a South Indian staple for good reason.",
  },

  "lauki-chana": {
    prep: 10, cook: 25, servings: 2, difficulty: "easy",
    ingredients: ["½ cup chana dal, soaked 1 hr", "2 cups lauki (bottle gourd), cubed", "1 tomato, cumin, turmeric, 1 tsp oil"],
    steps: [
      "Sauté cumin, add tomato and spices.",
      "Add dal, lauki and 1½ cups water.",
      "Pressure-cook 3 whistles (or simmer 25 min) until soft.",
    ],
    tip: "Lauki is >90% water — this curry is filling, hydrating and very light.",
  },

  "baingan-bharta": {
    prep: 10, cook: 30, servings: 2, difficulty: "medium",
    ingredients: ["1 large eggplant", "1 onion + 2 tomatoes, chopped", "Garlic, cumin, chilli, coriander", "1 tbsp oil"],
    steps: [
      "Roast the whole eggplant over flame or at 220°C until collapsed; peel and mash.",
      "Sauté onion, garlic, then tomatoes and spices.",
      "Fold in mashed eggplant, cook 5 min; garnish with coriander.",
    ],
    tip: "Flame-roasting gives the signature smokiness — pierce the skin first.",
  },

  "mixed-veg-sabzi": {
    prep: 10, cook: 15, servings: 2, difficulty: "easy",
    ingredients: ["3 cups mixed vegetables (beans, carrot, peas, capsicum)", "Cumin, turmeric, coriander powder", "1 tomato, 1 tbsp oil"],
    steps: [
      "Sauté cumin, add tomato and spices.",
      "Add vegetables, toss, cover and cook 10–12 min.",
    ],
    tip: "Cut everything the same size so it cooks evenly — no mushy carrots, no raw beans.",
  },

  "grilled-prawns": {
    prep: 10, cook: 6, servings: 1, difficulty: "easy",
    ingredients: ["150g prawns, cleaned", "2 cloves garlic, minced", "1 tsp olive oil, lemon, paprika, parsley"],
    steps: [
      "Toss prawns with garlic, oil and paprika.",
      "Grill or pan-sear 2–3 min per side until pink.",
      "Finish with lemon and parsley.",
    ],
    tip: "Prawns cook fast — pull them the moment they curl into a loose 'C'.",
  },

  "tuna-salad": {
    prep: 10, cook: 0, servings: 1, difficulty: "easy",
    ingredients: ["1 can tuna in water, drained", "¾ cup cooked white beans", "Red onion, cherry tomatoes, rocket", "Olive oil + lemon dressing"],
    steps: [
      "Flake tuna into a bowl with beans and vegetables.",
      "Dress with olive oil, lemon, salt and pepper; toss gently.",
    ],
    tip: "Choose pole-and-line tuna in water — same protein, far less sodium than brined.",
  },

  "stuffed-peppers": {
    prep: 15, cook: 30, servings: 2, difficulty: "medium",
    ingredients: ["2 large bell peppers, halved & deseeded", "1 cup cooked quinoa", "½ cup corn/beans, onion, herbs", "2 tbsp grated cheese (optional)"],
    steps: [
      "Mix quinoa with sautéed onion, corn/beans and herbs.",
      "Fill pepper halves, top with cheese if using.",
      "Bake at 190°C for 25–30 min until peppers soften.",
    ],
    tip: "Make extra filling — it doubles as tomorrow's grain bowl base.",
  },

  "minestrone": {
    prep: 10, cook: 25, servings: 2, difficulty: "easy",
    ingredients: ["1 cup mixed beans (cooked)", "2 cups chopped vegetables (carrot, celery, zucchini, tomato)", "Garlic, oregano, 3 cups stock", "1 tbsp olive oil"],
    steps: [
      "Sauté garlic and hard vegetables in oil 4 min.",
      "Add stock, tomatoes and oregano; simmer 15 min.",
      "Add beans, simmer 5 more; season.",
    ],
    tip: "A big pot keeps 4 days — it tastes better on day two.",
  },

  "grilled-veg-quinoa": {
    prep: 10, cook: 20, servings: 1, difficulty: "easy",
    ingredients: ["¾ cup cooked quinoa", "1½ cups vegetables (zucchini, peppers, onion), grilled", "Olive oil, lemon, herbs"],
    steps: [
      "Grill or roast vegetables with a little oil until charred.",
      "Serve over warm quinoa; dress with lemon, oil and herbs.",
    ],
    tip: "Char = flavour without salt. Great warm or as a packed lunch.",
  },

  "chicken-quinoa-bowl": {
    prep: 10, cook: 20, servings: 1, difficulty: "easy",
    ingredients: ["150g chicken breast", "¾ cup cooked quinoa", "Roasted vegetables or salad", "Olive oil, lemon, paprika"],
    steps: [
      "Season chicken with paprika, grill 6–7 min per side; rest and slice.",
      "Assemble over quinoa with vegetables.",
      "Dress with lemon and olive oil.",
    ],
    tip: "Resting the chicken 5 minutes keeps it juicy when sliced.",
  },

  "almond-butter": {
    prep: 3, cook: 2, servings: 1, difficulty: "easy",
    ingredients: ["1 slice whole grain bread", "1 tbsp almond butter", "Banana slices or berries (optional)"],
    steps: [
      "Toast the bread.",
      "Spread almond butter, top with fruit.",
    ],
    tip: "Check the label: good almond butter has one ingredient — almonds.",
  },

  "trail-mix": {
    prep: 5, cook: 0, servings: 6, difficulty: "easy",
    ingredients: ["Almonds, walnuts, cashews (¼ cup each)", "Pumpkin & sunflower seeds (2 tbsp each)", "A few dark chocolate chips (optional)"],
    steps: [
      "Combine in a jar, shake, portion ~30g per serving.",
    ],
    tip: "Portioning ahead is the difference between a snack and an accidental meal.",
  },

  "fruit-yogurt": {
    prep: 5, cook: 0, servings: 1, difficulty: "easy",
    ingredients: ["¾ cup plain yogurt", "½ cup chopped seasonal fruit", "1 tbsp chopped nuts"],
    steps: [
      "Layer yogurt with fruit and nuts. Done.",
    ],
    tip: "Plain yogurt + real fruit skips the ~3 tsp of sugar in flavoured cups.",
  },

};
