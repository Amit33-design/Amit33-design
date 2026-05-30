"""
Condition-food rules seed data.
~70 rules across 8 conditions, evidence-based.
"""

CONDITIONS = [
    {"code": "T2D",          "name": "Type 2 Diabetes",       "description": "Chronic condition affecting blood sugar regulation"},
    {"code": "PREDIABETES",  "name": "Prediabetes",           "description": "Blood sugar levels higher than normal but not yet diabetic"},
    {"code": "HTN",          "name": "Hypertension",          "description": "Chronically elevated blood pressure (≥130/80 mmHg)"},
    {"code": "HYPERLIPIDEMIA","name": "High Cholesterol",     "description": "Elevated LDL cholesterol or triglycerides"},
    {"code": "KIDNEY_STONES","name": "Kidney Stones",         "description": "Calcium oxalate or other renal calculi"},
    {"code": "CKD",          "name": "Chronic Kidney Disease","description": "Progressive loss of kidney function"},
    {"code": "HEART_DISEASE","name": "Heart Disease",         "description": "Coronary artery disease or other cardiovascular conditions"},
    {"code": "THYROID",      "name": "Thyroid Disorder",      "description": "Hypothyroidism or hyperthyroidism"},
]

# Rules: list of dicts with condition_code, rule_type, scope, target_value, reason, evidence_level, priority
RULES = [

    # ==================== TYPE 2 DIABETES ====================
    {"condition_code": "T2D", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "sugary_beverages"},
     "reason": "Sugar-sweetened drinks cause rapid blood glucose spikes with no nutritional benefit.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "T2D", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "refined_grains"},
     "reason": "White rice, white bread, and refined flour have high glycemic index and cause rapid glucose elevation.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "T2D", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "processed_sweets"},
     "reason": "Pastries, candies, and desserts cause rapid blood sugar spikes.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "T2D", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_low_gi"},
     "reason": "Low glycemic index foods (GI < 55) cause gradual glucose rise, supporting better glycemic control.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "T2D", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_high_fiber"},
     "reason": "Dietary fiber slows glucose absorption, blunting postprandial blood sugar rise.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "T2D", "rule_type": "LIMIT", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "sugar_g", "max_per_day": 25},
     "reason": "WHO recommends limiting added sugar to < 25g/day for metabolic health.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "T2D", "rule_type": "LIMIT", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "carbs_g", "max_per_day": 200},
     "reason": "Moderate carbohydrate intake (130-200g/day) supports glycemic control without excessive restriction.",
     "evidence_level": "moderate", "priority": 3},

    # ==================== PREDIABETES ====================
    {"condition_code": "PREDIABETES", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "sugary_beverages"},
     "reason": "Eliminating sugar-sweetened beverages is the single most impactful dietary change for prediabetes reversal.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "PREDIABETES", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "refined_grains"},
     "reason": "High-GI refined grains accelerate progression from prediabetes to Type 2 Diabetes.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "PREDIABETES", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_low_gi"},
     "reason": "Low-GI foods support blood sugar stabilization and may help reverse prediabetes.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "PREDIABETES", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_high_fiber"},
     "reason": "High fiber intake is associated with reduced risk of T2D progression in prediabetes.",
     "evidence_level": "strong", "priority": 2},

    # ==================== HYPERTENSION ====================
    {"condition_code": "HTN", "rule_type": "NUTRIENT_THRESHOLD", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "sodium_mg", "max_per_day": 1500},
     "reason": "DASH diet protocol: limiting sodium to 1500mg/day can reduce systolic BP by 5-6 mmHg.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "HTN", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "processed_meat"},
     "reason": "Processed meats (bacon, sausage, deli meats) are extremely high in sodium and nitrates, elevating blood pressure.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "HTN", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "fast_food"},
     "reason": "Fast food typically contains 1000-2000mg sodium per meal, far exceeding daily limits.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "HTN", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_low_sodium"},
     "reason": "Low-sodium foods (< 140mg/serving) are essential for DASH diet compliance and blood pressure control.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "HTN", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "full_fat_dairy"},
     "reason": "Full-fat dairy is high in saturated fat, which can contribute to arterial stiffness. Prefer low-fat options.",
     "evidence_level": "moderate", "priority": 4},

    {"condition_code": "HTN", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_high_fiber"},
     "reason": "High dietary fiber is associated with lower blood pressure through improved vascular function.",
     "evidence_level": "moderate", "priority": 3},

    # ==================== HIGH CHOLESTEROL ====================
    {"condition_code": "HYPERLIPIDEMIA", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "trans_fats"},
     "reason": "Trans fats simultaneously raise LDL and lower HDL cholesterol — worst dietary fat for cardiovascular health.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "HYPERLIPIDEMIA", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "full_fat_dairy"},
     "reason": "Saturated fat in full-fat dairy raises LDL cholesterol. Choose low-fat or plant-based alternatives.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "HYPERLIPIDEMIA", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "fatty_red_meat"},
     "reason": "Red meat high in saturated fat raises LDL. Limit to 1-2 servings/week; choose lean cuts.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "HYPERLIPIDEMIA", "rule_type": "LIMIT", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "saturated_fat_g", "max_per_day": 13},
     "reason": "AHA recommends saturated fat < 6% of calories (~13g for 2000 cal diet) to reduce LDL.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "HYPERLIPIDEMIA", "rule_type": "LIMIT", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "cholesterol_mg", "max_per_day": 200},
     "reason": "Dietary cholesterol under 200mg/day supports LDL reduction in hyperlipidemia.",
     "evidence_level": "moderate", "priority": 3},

    {"condition_code": "HYPERLIPIDEMIA", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_high_fiber"},
     "reason": "Soluble fiber (oats, legumes, fruits) binds bile acids, reducing LDL cholesterol by 5-10%.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "HYPERLIPIDEMIA", "rule_type": "RECOMMEND", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "plant_protein"},
     "reason": "Replacing animal protein with plant protein (legumes, tofu, tempeh) reduces LDL and cardiovascular risk.",
     "evidence_level": "strong", "priority": 2},

    # ==================== KIDNEY STONES ====================
    {"condition_code": "KIDNEY_STONES", "rule_type": "AVOID", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_low_oxalate"},
     "reason": "High-oxalate foods (spinach, beets, nuts in excess) bind calcium in urine, forming calcium oxalate stones.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "KIDNEY_STONES", "rule_type": "LIMIT", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "oxalate_mg", "max_per_serving": 10},
     "reason": "Keeping oxalate per serving under 10mg minimizes urinary oxalate load and stone formation risk.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "KIDNEY_STONES", "rule_type": "LIMIT", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "sodium_mg", "max_per_day": 2300},
     "reason": "High sodium increases urinary calcium excretion, promoting calcium oxalate stone formation.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "KIDNEY_STONES", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "high_oxalate_vegetables"},
     "reason": "Spinach, beets, sweet potatoes, and almonds in large quantities are high in oxalate.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "KIDNEY_STONES", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_low_oxalate"},
     "reason": "Low-oxalate foods reduce urinary oxalate load, decreasing calcium oxalate crystal formation.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "KIDNEY_STONES", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "animal_protein"},
     "reason": "Excess animal protein increases urinary uric acid and calcium, promoting stone formation.",
     "evidence_level": "moderate", "priority": 3},

    # ==================== CHRONIC KIDNEY DISEASE ====================
    {"condition_code": "CKD", "rule_type": "NUTRIENT_THRESHOLD", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "protein_g", "max_per_day": None},  # calculated from weight
     "reason": "Protein restriction (0.6-0.8g/kg) slows CKD progression by reducing glomerular hyperfiltration.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "CKD", "rule_type": "NUTRIENT_THRESHOLD", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "phosphorus_mg", "max_per_day": 800},
     "reason": "CKD impairs phosphorus excretion; excess phosphorus causes hyperphosphatemia and bone disease.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "CKD", "rule_type": "NUTRIENT_THRESHOLD", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "potassium_mg", "max_per_day": 2000},
     "reason": "Impaired kidney function reduces potassium excretion; hyperkalemia causes dangerous cardiac arrhythmias.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "CKD", "rule_type": "NUTRIENT_THRESHOLD", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "sodium_mg", "max_per_day": 1500},
     "reason": "Sodium restriction reduces fluid retention, blood pressure, and proteinuria in CKD.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "CKD", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_low_phosphorus"},
     "reason": "Low-phosphorus foods prevent accumulation and secondary hyperparathyroidism in CKD.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "CKD", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "high_potassium_foods"},
     "reason": "Bananas, oranges, potatoes, and tomatoes are high in potassium and should be limited in CKD.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "CKD", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "dairy"},
     "reason": "Dairy products are high in phosphorus; limit to 1/2 cup per day in CKD.",
     "evidence_level": "strong", "priority": 2},

    # ==================== HEART DISEASE ====================
    {"condition_code": "HEART_DISEASE", "rule_type": "NUTRIENT_THRESHOLD", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "sodium_mg", "max_per_day": 1500},
     "reason": "Sodium restriction reduces cardiac preload and blood pressure in heart failure and CAD.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "HEART_DISEASE", "rule_type": "AVOID", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "trans_fats"},
     "reason": "Trans fats raise LDL, lower HDL, and increase systemic inflammation — directly linked to cardiovascular events.",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "HEART_DISEASE", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "processed_meat"},
     "reason": "Processed meats increase risk of cardiovascular events by 42% (Harvard meta-analysis).",
     "evidence_level": "strong", "priority": 1},

    {"condition_code": "HEART_DISEASE", "rule_type": "LIMIT", "scope": "NUTRIENT_THRESHOLD",
     "target_value": {"nutrient": "saturated_fat_g", "max_per_day": 13},
     "reason": "AHA guidelines for heart disease: < 6% of calories from saturated fat.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "HEART_DISEASE", "rule_type": "RECOMMEND", "scope": "FOOD_FLAG",
     "target_value": {"flag": "is_high_fiber"},
     "reason": "High fiber intake is associated with 25% lower risk of cardiovascular mortality.",
     "evidence_level": "strong", "priority": 2},

    {"condition_code": "HEART_DISEASE", "rule_type": "RECOMMEND", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "omega3_rich"},
     "reason": "Omega-3 fatty acids (fatty fish, flaxseed) reduce triglycerides and cardiac inflammation.",
     "evidence_level": "strong", "priority": 2},

    # ==================== THYROID ====================
    {"condition_code": "THYROID", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "raw_cruciferous"},
     "reason": "Raw cruciferous vegetables (broccoli, cauliflower, kale) contain goitrogens that may interfere with thyroid hormone synthesis when consumed in large amounts raw. Cooking neutralizes most goitrogens.",
     "evidence_level": "moderate", "priority": 4},

    {"condition_code": "THYROID", "rule_type": "LIMIT", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "soy_products"},
     "reason": "Soy isoflavones may inhibit thyroid peroxidase; consume in moderation and away from thyroid medication.",
     "evidence_level": "moderate", "priority": 4},

    {"condition_code": "THYROID", "rule_type": "RECOMMEND", "scope": "FOOD_GROUP",
     "target_value": {"food_group": "iodine_rich"},
     "reason": "Iodine is essential for thyroid hormone synthesis (T3 and T4). Good sources: seaweed, fish, dairy, iodized salt.",
     "evidence_level": "strong", "priority": 3},
]
