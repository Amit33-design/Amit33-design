"""Lifestyle Engine — generates sleep, hydration, stress recommendations."""
from __future__ import annotations

from app.models.user import User, LifestyleFactors
from app.utils.calculators import calculate_hydration_liters


def generate_lifestyle_recommendations(
    user: User,
    lifestyle: LifestyleFactors | None,
    condition_codes: list[str],
) -> dict:
    """Generate personalized lifestyle recommendations."""
    weight = user.weight_kg or 70
    activity = user.activity_level or "moderate"
    age = user.age or 30

    # Hydration
    hydration_liters = calculate_hydration_liters(weight, activity)
    if "KIDNEY_STONES" in condition_codes:
        hydration_liters = max(hydration_liters, 2.5)  # Higher for kidney stones

    hydration_rec = {
        "target_liters": hydration_liters,
        "glasses_8oz": round(hydration_liters / 0.237, 0),
        "reason": (
            "Increased hydration helps prevent kidney stone formation."
            if "KIDNEY_STONES" in condition_codes
            else "Based on your weight and activity level."
        ),
        "tips": [
            "Start your day with a glass of water",
            "Carry a reusable water bottle",
            "Set hourly hydration reminders",
        ],
    }

    # Sleep
    if age >= 60:
        sleep_target = (7, 8)
    elif age >= 26:
        sleep_target = (7, 9)
    else:
        sleep_target = (8, 10)

    current_sleep = lifestyle.sleep_hours if lifestyle else None
    sleep_gap = None
    if current_sleep:
        if current_sleep < sleep_target[0]:
            sleep_gap = f"You're getting {current_sleep}h — aim for {sleep_target[0]}–{sleep_target[1]}h"
        elif current_sleep > sleep_target[1]:
            sleep_gap = f"You're getting {current_sleep}h — try to cap at {sleep_target[1]}h"

    sleep_rec = {
        "target_hours": f"{sleep_target[0]}–{sleep_target[1]}",
        "current_hours": current_sleep,
        "gap_message": sleep_gap,
        "tips": [
            "Maintain a consistent sleep-wake schedule",
            "Avoid screens 1 hour before bed",
            "Keep bedroom temperature between 65–68°F (18–20°C)",
            "Avoid caffeine after 2 PM",
        ],
    }

    # Stress
    stress_level = lifestyle.stress_level if lifestyle else "medium"
    stress_rec = {
        "current_level": stress_level,
        "techniques": [],
    }

    if stress_level in ("high", "medium"):
        stress_rec["techniques"] = [
            {"name": "Box Breathing", "duration": "5 minutes", "description": "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s"},
            {"name": "Progressive Muscle Relaxation", "duration": "10 minutes", "description": "Tense and release muscle groups from feet to face"},
            {"name": "Daily Walk", "duration": "20-30 minutes", "description": "Brisk walking reduces cortisol levels"},
            {"name": "Meditation", "duration": "10 minutes", "description": "Mindfulness apps like Headspace or Calm"},
        ]
    else:
        stress_rec["techniques"] = [
            {"name": "Maintain Current Routine", "duration": "Ongoing", "description": "Your stress management is working well"},
            {"name": "Daily Walk", "duration": "20 minutes", "description": "Continue light movement to maintain low stress"},
        ]

    # Blood pressure note
    if "HTN" in condition_codes:
        stress_rec["clinical_note"] = "Chronic stress elevates blood pressure. Prioritize daily relaxation practices."

    # Smoking
    smoking_rec = None
    if lifestyle and lifestyle.smoking_status == "current":
        smoking_rec = {
            "status": "current",
            "message": "Smoking significantly increases cardiovascular and cancer risk. Consider cessation support.",
            "resources": ["NRT (Nicotine Replacement Therapy)", "Prescription cessation medications", "Behavioral counseling"],
        }

    # Alcohol
    alcohol_rec = None
    if lifestyle and lifestyle.alcohol_units_week is not None:
        if lifestyle.alcohol_units_week > 14:
            alcohol_rec = {"status": "high", "message": "Current intake exceeds safe limits. Consider reducing to < 14 units/week."}
        elif lifestyle.alcohol_units_week > 7:
            alcohol_rec = {"status": "moderate", "message": "Moderate intake detected. Aim for alcohol-free days each week."}
        else:
            alcohol_rec = {"status": "low", "message": "Alcohol intake is within safe limits."}

    return {
        "hydration": hydration_rec,
        "sleep": sleep_rec,
        "stress": stress_rec,
        "smoking": smoking_rec,
        "alcohol": alcohol_rec,
        "condition_specific": _condition_lifestyle_notes(condition_codes),
    }


def _condition_lifestyle_notes(condition_codes: list[str]) -> list[dict]:
    notes = []
    if "T2D" in condition_codes:
        notes.append({
            "condition": "Diabetes",
            "tip": "A 15-minute walk after each meal significantly improves post-meal blood sugar control.",
        })
    if "HTN" in condition_codes:
        notes.append({
            "condition": "Hypertension",
            "tip": "Limit sodium to < 1500mg/day and practice daily relaxation to support blood pressure management.",
        })
    if "KIDNEY_STONES" in condition_codes:
        notes.append({
            "condition": "Kidney Stones",
            "tip": "Drink enough water to produce at least 2.5L of urine daily. Limit oxalate-rich foods.",
        })
    if "HEART_DISEASE" in condition_codes:
        notes.append({
            "condition": "Heart Disease",
            "tip": "Aim for 150 minutes of moderate-intensity exercise weekly. Avoid high-intensity exertion without medical clearance.",
        })
    return notes
