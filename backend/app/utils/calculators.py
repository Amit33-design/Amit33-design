"""Pure BMR/TDEE/macro calculation functions."""
from __future__ import annotations

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

GOAL_CALORIE_ADJUSTMENTS = {
    "weight_loss": -500,
    "fat_loss": -300,
    "muscle_gain": +300,
    "maintenance": 0,
    "healthy_aging": -100,
    "cardiovascular": -200,
    "diabetes_friendly": -300,
    "blood_pressure_management": 0,
}

# (protein_pct, carbs_pct, fat_pct)
GOAL_MACRO_SPLITS = {
    "weight_loss":                (0.30, 0.40, 0.30),
    "fat_loss":                   (0.35, 0.35, 0.30),
    "muscle_gain":                (0.35, 0.45, 0.20),
    "maintenance":                (0.25, 0.50, 0.25),
    "healthy_aging":              (0.30, 0.45, 0.25),
    "cardiovascular":             (0.20, 0.55, 0.25),
    "diabetes_friendly":          (0.25, 0.35, 0.40),
    "blood_pressure_management":  (0.20, 0.55, 0.25),
}

# Minimum calorie floor by gender
MIN_CALORIES = {"male": 1500, "female": 1200, "other": 1350}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    """Mifflin-St Jeor equation."""
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    if gender == "male":
        return base + 5
    elif gender == "female":
        return base - 161
    else:
        return base - 78  # average


def calculate_tdee(bmr: float, activity_level: str) -> float:
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.375)
    return round(bmr * multiplier, 1)


def calculate_target_calories(tdee: float, goal_type: str, gender: str = "other") -> float:
    adjustment = GOAL_CALORIE_ADJUSTMENTS.get(goal_type, 0)
    target = tdee + adjustment
    floor = MIN_CALORIES.get(gender, 1350)
    return max(target, floor)


def calculate_macros(
    target_calories: float,
    goal_type: str,
    weight_kg: float,
    protein_override_g: float | None = None,
) -> dict:
    """
    Returns macro targets in grams.
    protein_override_g: used for CKD (capped at 0.8g/kg) overriding the standard split.
    """
    splits = GOAL_MACRO_SPLITS.get(goal_type, (0.25, 0.50, 0.25))
    protein_pct, carbs_pct, fat_pct = splits

    protein_g = (target_calories * protein_pct) / 4
    if protein_override_g is not None:
        protein_g = min(protein_g, protein_override_g)
        # Redistribute freed calories to carbs
        actual_protein_cal = protein_g * 4
        remaining_cal = target_calories - actual_protein_cal
        carbs_g = (remaining_cal * (carbs_pct / (carbs_pct + fat_pct))) / 4
        fat_g = (remaining_cal * (fat_pct / (carbs_pct + fat_pct))) / 9
    else:
        carbs_g = (target_calories * carbs_pct) / 4
        fat_g = (target_calories * fat_pct) / 9

    # Fiber target: 14g per 1000 calories
    fiber_g = (target_calories / 1000) * 14

    return {
        "calories": round(target_calories, 0),
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs_g, 1),
        "fat_g": round(fat_g, 1),
        "fiber_g": round(fiber_g, 1),
        "protein_g_per_kg": round(protein_g / weight_kg, 2),
    }


def calculate_hydration_liters(weight_kg: float, activity_level: str) -> float:
    """Hydration recommendation: 35ml/kg base + activity bonus."""
    base = weight_kg * 0.035
    bonus = {"sedentary": 0, "light": 0.25, "moderate": 0.5, "active": 0.75, "very_active": 1.0}
    return round(base + bonus.get(activity_level, 0), 1)


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)


def get_bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "Underweight"
    elif bmi < 25:
        return "Normal"
    elif bmi < 30:
        return "Overweight"
    else:
        return "Obese"
