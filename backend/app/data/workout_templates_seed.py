"""Workout template seed data — 28 templates across all fitness levels and goals."""

TEMPLATES = [
    # ==================== BEGINNER ====================
    {
        "name": "Beginner Walking Program",
        "fitness_level": "beginner",
        "goal_type": "weight_loss",
        "duration_min": 30,
        "equipment": ["none"],
        "description": "A structured walking program to build aerobic base and burn calories safely.",
        "contraindications": [],
        "instructions": {
            "warmup": [{"exercise": "Slow walk", "duration_sec": 300}],
            "main_circuit": [
                {"exercise": "Brisk walk", "duration_sec": 1200},
                {"exercise": "Normal pace walk", "duration_sec": 300},
                {"exercise": "Brisk walk", "duration_sec": 900},
            ],
            "cooldown": [
                {"exercise": "Slow walk", "duration_sec": 180},
                {"exercise": "Standing quad stretch", "duration_sec": 30},
                {"exercise": "Calf stretch", "duration_sec": 30},
            ],
        },
    },
    {
        "name": "Beginner Full Body Circuit",
        "fitness_level": "beginner",
        "goal_type": "weight_loss",
        "duration_min": 25,
        "equipment": ["bodyweight"],
        "description": "Low-impact full body workout to build strength and burn calories.",
        "contraindications": ["HEART_DISEASE"],
        "instructions": {
            "warmup": [
                {"exercise": "March in place", "duration_sec": 120},
                {"exercise": "Arm circles", "sets": 2, "reps": 10},
            ],
            "main_circuit": [
                {"exercise": "Wall push-up", "sets": 3, "reps": 10, "rest_sec": 45},
                {"exercise": "Chair squat", "sets": 3, "reps": 12, "rest_sec": 45},
                {"exercise": "Seated leg raise", "sets": 3, "reps": 12, "rest_sec": 30},
                {"exercise": "Standing side leg raise", "sets": 2, "reps": 10, "rest_sec": 30},
                {"exercise": "Modified plank (knees)", "duration_sec": 20, "sets": 3, "rest_sec": 30},
            ],
            "cooldown": [
                {"exercise": "Child's pose", "duration_sec": 45},
                {"exercise": "Seated hamstring stretch", "duration_sec": 30},
                {"exercise": "Chest opener stretch", "duration_sec": 30},
            ],
        },
    },
    {
        "name": "Beginner Strength Foundation",
        "fitness_level": "beginner",
        "goal_type": "muscle_gain",
        "duration_min": 35,
        "equipment": ["bodyweight", "resistance_band"],
        "description": "Introduction to resistance training with bodyweight and bands.",
        "contraindications": ["HEART_DISEASE"],
        "instructions": {
            "warmup": [
                {"exercise": "Light cardio (jog in place)", "duration_sec": 180},
                {"exercise": "Dynamic leg swings", "sets": 2, "reps": 10},
            ],
            "main_circuit": [
                {"exercise": "Bodyweight squat", "sets": 3, "reps": 15, "rest_sec": 60},
                {"exercise": "Incline push-up", "sets": 3, "reps": 10, "rest_sec": 60},
                {"exercise": "Resistance band row", "sets": 3, "reps": 12, "rest_sec": 60},
                {"exercise": "Glute bridge", "sets": 3, "reps": 15, "rest_sec": 45},
                {"exercise": "Band lateral walk", "sets": 2, "reps": 12, "rest_sec": 45},
                {"exercise": "Superman hold", "sets": 3, "reps": 10, "rest_sec": 30},
            ],
            "cooldown": [
                {"exercise": "Downward dog", "duration_sec": 45},
                {"exercise": "Hip flexor stretch", "duration_sec": 30},
                {"exercise": "Shoulder cross-body stretch", "duration_sec": 30},
            ],
        },
    },
    {
        "name": "Beginner Diabetes-Friendly Walk",
        "fitness_level": "beginner",
        "goal_type": "diabetes_friendly",
        "duration_min": 20,
        "equipment": ["none"],
        "description": "Post-meal walks and gentle movement to support blood sugar control.",
        "contraindications": [],
        "instructions": {
            "warmup": [{"exercise": "Slow walk", "duration_sec": 120}],
            "main_circuit": [
                {"exercise": "Brisk post-meal walk", "duration_sec": 900},
                {"exercise": "Gentle arm swings while walking", "duration_sec": 180},
            ],
            "cooldown": [
                {"exercise": "Deep breathing", "duration_sec": 120},
                {"exercise": "Standing ankle rolls", "sets": 1, "reps": 10},
            ],
        },
    },
    {
        "name": "Blood Pressure Management Walk",
        "fitness_level": "beginner",
        "goal_type": "blood_pressure_management",
        "duration_min": 30,
        "equipment": ["none"],
        "description": "Moderate steady-state cardio — proven to reduce systolic blood pressure by 4-9 mmHg.",
        "contraindications": [],
        "instructions": {
            "warmup": [{"exercise": "Slow walk", "duration_sec": 300}],
            "main_circuit": [
                {"exercise": "Steady brisk walk (50-60% max HR)", "duration_sec": 1200},
                {"exercise": "Slow walk recovery", "duration_sec": 300},
            ],
            "cooldown": [
                {"exercise": "Slow walk", "duration_sec": 180},
                {"exercise": "Box breathing (4-4-4-4)", "duration_sec": 120},
            ],
        },
    },

    # ==================== INTERMEDIATE ====================
    {
        "name": "Intermediate HIIT Weight Loss",
        "fitness_level": "intermediate",
        "goal_type": "weight_loss",
        "duration_min": 35,
        "equipment": ["bodyweight"],
        "description": "High-intensity intervals to maximize calorie burn and metabolic rate.",
        "contraindications": ["HTN", "HEART_DISEASE", "CKD"],
        "instructions": {
            "warmup": [
                {"exercise": "Jumping jacks", "sets": 2, "reps": 20},
                {"exercise": "High knees", "duration_sec": 60},
                {"exercise": "Hip circles", "sets": 1, "reps": 10},
            ],
            "main_circuit": [
                {"exercise": "Burpees", "sets": 4, "reps": 10, "rest_sec": 30},
                {"exercise": "Jump squats", "sets": 4, "reps": 12, "rest_sec": 30},
                {"exercise": "Mountain climbers", "duration_sec": 40, "sets": 4, "rest_sec": 20},
                {"exercise": "Push-up to plank", "sets": 3, "reps": 10, "rest_sec": 30},
                {"exercise": "Lateral shuffle", "duration_sec": 30, "sets": 3, "rest_sec": 20},
            ],
            "cooldown": [
                {"exercise": "Child's pose", "duration_sec": 60},
                {"exercise": "Pigeon pose", "duration_sec": 45},
                {"exercise": "Seated spinal twist", "duration_sec": 30},
            ],
        },
    },
    {
        "name": "Intermediate Upper Body Push",
        "fitness_level": "intermediate",
        "goal_type": "muscle_gain",
        "duration_min": 45,
        "equipment": ["dumbbells"],
        "description": "Chest, shoulders, and triceps hypertrophy session.",
        "contraindications": ["HEART_DISEASE"],
        "instructions": {
            "warmup": [
                {"exercise": "Arm circles", "sets": 2, "reps": 15},
                {"exercise": "Shoulder pass-through with band", "sets": 2, "reps": 10},
            ],
            "main_circuit": [
                {"exercise": "Dumbbell chest press", "sets": 4, "reps": 10, "rest_sec": 90},
                {"exercise": "Dumbbell shoulder press", "sets": 4, "reps": 10, "rest_sec": 90},
                {"exercise": "Incline dumbbell press", "sets": 3, "reps": 12, "rest_sec": 75},
                {"exercise": "Lateral raises", "sets": 3, "reps": 15, "rest_sec": 60},
                {"exercise": "Tricep dumbbell kickback", "sets": 3, "reps": 12, "rest_sec": 60},
                {"exercise": "Push-up", "sets": 3, "reps": 12, "rest_sec": 60},
            ],
            "cooldown": [
                {"exercise": "Doorway chest stretch", "duration_sec": 45},
                {"exercise": "Cross-body shoulder stretch", "duration_sec": 30},
                {"exercise": "Tricep overhead stretch", "duration_sec": 30},
            ],
        },
    },
    {
        "name": "Intermediate Upper Body Pull",
        "fitness_level": "intermediate",
        "goal_type": "muscle_gain",
        "duration_min": 45,
        "equipment": ["dumbbells", "resistance_band"],
        "description": "Back and biceps hypertrophy session.",
        "contraindications": ["HEART_DISEASE"],
        "instructions": {
            "warmup": [
                {"exercise": "Band pull-apart", "sets": 2, "reps": 15},
                {"exercise": "Cat-cow stretch", "sets": 2, "reps": 10},
            ],
            "main_circuit": [
                {"exercise": "Dumbbell bent-over row", "sets": 4, "reps": 10, "rest_sec": 90},
                {"exercise": "Single-arm dumbbell row", "sets": 4, "reps": 10, "rest_sec": 75},
                {"exercise": "Band face pull", "sets": 3, "reps": 15, "rest_sec": 60},
                {"exercise": "Dumbbell bicep curl", "sets": 3, "reps": 12, "rest_sec": 60},
                {"exercise": "Hammer curl", "sets": 3, "reps": 12, "rest_sec": 60},
                {"exercise": "Reverse fly", "sets": 3, "reps": 12, "rest_sec": 60},
            ],
            "cooldown": [
                {"exercise": "Lat stretch", "duration_sec": 45},
                {"exercise": "Bicep wall stretch", "duration_sec": 30},
                {"exercise": "Child's pose", "duration_sec": 45},
            ],
        },
    },
    {
        "name": "Intermediate Lower Body",
        "fitness_level": "intermediate",
        "goal_type": "muscle_gain",
        "duration_min": 50,
        "equipment": ["dumbbells"],
        "description": "Quad, hamstring, and glute development session.",
        "contraindications": ["HEART_DISEASE"],
        "instructions": {
            "warmup": [
                {"exercise": "Bodyweight squat", "sets": 2, "reps": 15},
                {"exercise": "Hip flexor stretch", "duration_sec": 60},
            ],
            "main_circuit": [
                {"exercise": "Dumbbell goblet squat", "sets": 4, "reps": 12, "rest_sec": 90},
                {"exercise": "Romanian deadlift", "sets": 4, "reps": 10, "rest_sec": 90},
                {"exercise": "Dumbbell lunge", "sets": 3, "reps": 12, "rest_sec": 75},
                {"exercise": "Bulgarian split squat", "sets": 3, "reps": 10, "rest_sec": 90},
                {"exercise": "Hip thrust", "sets": 3, "reps": 15, "rest_sec": 60},
                {"exercise": "Calf raise", "sets": 4, "reps": 20, "rest_sec": 45},
            ],
            "cooldown": [
                {"exercise": "Pigeon pose", "duration_sec": 60},
                {"exercise": "Seated hamstring stretch", "duration_sec": 45},
                {"exercise": "Hip flexor stretch", "duration_sec": 45},
            ],
        },
    },
    {
        "name": "Intermediate Cardiovascular",
        "fitness_level": "intermediate",
        "goal_type": "cardiovascular",
        "duration_min": 40,
        "equipment": ["bodyweight"],
        "description": "Sustained cardio with intervals to build aerobic capacity.",
        "contraindications": ["HEART_DISEASE"],
        "instructions": {
            "warmup": [
                {"exercise": "Jog in place", "duration_sec": 180},
                {"exercise": "High knees", "duration_sec": 60},
            ],
            "main_circuit": [
                {"exercise": "Steady-state jog (65-75% max HR)", "duration_sec": 1200},
                {"exercise": "Speed interval (80-85% max HR)", "duration_sec": 60},
                {"exercise": "Recovery jog", "duration_sec": 120},
                {"exercise": "Speed interval", "duration_sec": 60},
                {"exercise": "Recovery jog", "duration_sec": 120},
                {"exercise": "Speed interval", "duration_sec": 60},
                {"exercise": "Steady-state cooldown jog", "duration_sec": 300},
            ],
            "cooldown": [
                {"exercise": "Walking", "duration_sec": 180},
                {"exercise": "Standing quad stretch", "duration_sec": 30},
                {"exercise": "Calf stretch", "duration_sec": 30},
            ],
        },
    },

    # ==================== ADVANCED ====================
    {
        "name": "Advanced Push Day (PPL)",
        "fitness_level": "advanced",
        "goal_type": "muscle_gain",
        "duration_min": 60,
        "equipment": ["dumbbells", "barbell", "bench"],
        "description": "Heavy push day: chest, shoulders, triceps with progressive overload.",
        "contraindications": ["HTN", "HEART_DISEASE", "CKD"],
        "instructions": {
            "warmup": [
                {"exercise": "Rotator cuff warm-up with bands", "sets": 2, "reps": 15},
                {"exercise": "Scapular push-up", "sets": 2, "reps": 10},
            ],
            "main_circuit": [
                {"exercise": "Barbell bench press", "sets": 5, "reps": 5, "rest_sec": 180},
                {"exercise": "Overhead press", "sets": 4, "reps": 8, "rest_sec": 120},
                {"exercise": "Incline dumbbell press", "sets": 3, "reps": 10, "rest_sec": 90},
                {"exercise": "Cable flye (or band)", "sets": 3, "reps": 15, "rest_sec": 75},
                {"exercise": "Lateral raises", "sets": 4, "reps": 15, "rest_sec": 60},
                {"exercise": "Skull crusher", "sets": 3, "reps": 12, "rest_sec": 75},
                {"exercise": "Tricep pushdown", "sets": 3, "reps": 15, "rest_sec": 60},
            ],
            "cooldown": [
                {"exercise": "Pec stretch", "duration_sec": 45},
                {"exercise": "Overhead tricep stretch", "duration_sec": 30},
            ],
        },
    },
    {
        "name": "Advanced HIIT Fat Loss",
        "fitness_level": "advanced",
        "goal_type": "fat_loss",
        "duration_min": 45,
        "equipment": ["bodyweight", "kettlebell"],
        "description": "Tabata-style HIIT for maximum fat oxidation and EPOC effect.",
        "contraindications": ["HTN", "HEART_DISEASE", "CKD"],
        "instructions": {
            "warmup": [
                {"exercise": "Dynamic warm-up circuit", "duration_sec": 300},
            ],
            "main_circuit": [
                {"exercise": "Kettlebell swing", "duration_sec": 20, "rest_sec": 10, "sets": 8},
                {"exercise": "Burpee with jump", "duration_sec": 20, "rest_sec": 10, "sets": 8},
                {"exercise": "Box jump", "duration_sec": 20, "rest_sec": 10, "sets": 6},
                {"exercise": "Battle rope slams (or jumping jacks)", "duration_sec": 20, "rest_sec": 10, "sets": 8},
            ],
            "cooldown": [
                {"exercise": "Full body stretch sequence", "duration_sec": 300},
            ],
        },
    },

    # ==================== OLDER ADULT ====================
    {
        "name": "Older Adult Chair Yoga & Flexibility",
        "fitness_level": "older_adult",
        "goal_type": "healthy_aging",
        "duration_min": 30,
        "equipment": ["chair"],
        "description": "Seated and standing flexibility work to maintain range of motion and prevent injury.",
        "contraindications": [],
        "instructions": {
            "warmup": [
                {"exercise": "Seated deep breathing", "duration_sec": 120},
                {"exercise": "Seated neck rolls", "sets": 2, "reps": 5},
            ],
            "main_circuit": [
                {"exercise": "Seated cat-cow", "sets": 2, "reps": 10},
                {"exercise": "Seated side bend", "sets": 2, "reps": 8},
                {"exercise": "Seated knee lift", "sets": 2, "reps": 12},
                {"exercise": "Standing wall push-up", "sets": 2, "reps": 10},
                {"exercise": "Standing hip abduction (holding chair)", "sets": 2, "reps": 10},
                {"exercise": "Standing calf raise (holding chair)", "sets": 2, "reps": 15},
                {"exercise": "Seated hamstring stretch", "duration_sec": 30},
                {"exercise": "Standing quad stretch (wall support)", "duration_sec": 30},
            ],
            "cooldown": [
                {"exercise": "Seated forward fold", "duration_sec": 45},
                {"exercise": "Seated breathing and meditation", "duration_sec": 120},
            ],
        },
    },
    {
        "name": "Older Adult Balance & Strength",
        "fitness_level": "older_adult",
        "goal_type": "healthy_aging",
        "duration_min": 35,
        "equipment": ["chair", "resistance_band"],
        "description": "Balance training combined with gentle resistance to prevent falls and maintain strength.",
        "contraindications": [],
        "instructions": {
            "warmup": [
                {"exercise": "Seated march", "duration_sec": 120},
                {"exercise": "Ankle pumps", "sets": 2, "reps": 15},
            ],
            "main_circuit": [
                {"exercise": "Single-leg stand (holding chair)", "duration_sec": 30, "sets": 2},
                {"exercise": "Heel-toe walk", "duration_sec": 60, "sets": 2},
                {"exercise": "Mini squat (holding chair)", "sets": 3, "reps": 10},
                {"exercise": "Resistance band bicep curl", "sets": 2, "reps": 12},
                {"exercise": "Resistance band seated row", "sets": 2, "reps": 12},
                {"exercise": "Side step with band", "sets": 2, "reps": 10},
                {"exercise": "Standing hip extension (holding chair)", "sets": 2, "reps": 12},
            ],
            "cooldown": [
                {"exercise": "Seated calf stretch", "duration_sec": 30},
                {"exercise": "Neck and shoulder stretch", "duration_sec": 60},
                {"exercise": "Deep breathing", "duration_sec": 120},
            ],
        },
    },
    {
        "name": "Older Adult Gentle Cardio Walk",
        "fitness_level": "older_adult",
        "goal_type": "cardiovascular",
        "duration_min": 30,
        "equipment": ["none"],
        "description": "Comfortable walking program for cardiovascular health without joint stress.",
        "contraindications": [],
        "instructions": {
            "warmup": [
                {"exercise": "Slow warm-up walk", "duration_sec": 300},
                {"exercise": "Ankle and knee circles", "sets": 1, "reps": 10},
            ],
            "main_circuit": [
                {"exercise": "Comfortable brisk walk (50-60% max HR)", "duration_sec": 1200},
            ],
            "cooldown": [
                {"exercise": "Slow cool-down walk", "duration_sec": 300},
                {"exercise": "Standing calf stretch", "duration_sec": 30},
                {"exercise": "Seated quad stretch", "duration_sec": 30},
            ],
        },
    },
    {
        "name": "Older Adult Diabetes Post-Meal Walk",
        "fitness_level": "older_adult",
        "goal_type": "diabetes_friendly",
        "duration_min": 20,
        "equipment": ["none"],
        "description": "Gentle post-meal walk proven to reduce postprandial blood sugar in older adults.",
        "contraindications": [],
        "instructions": {
            "warmup": [{"exercise": "Slow walk", "duration_sec": 120}],
            "main_circuit": [
                {"exercise": "Comfortable post-meal walk", "duration_sec": 900},
            ],
            "cooldown": [
                {"exercise": "Slow walk and breathing", "duration_sec": 180},
            ],
        },
    },
    {
        "name": "Older Adult Blood Pressure Walk",
        "fitness_level": "older_adult",
        "goal_type": "blood_pressure_management",
        "duration_min": 25,
        "equipment": ["none"],
        "description": "Low-intensity walking to reduce blood pressure without cardiovascular stress.",
        "contraindications": [],
        "instructions": {
            "warmup": [{"exercise": "Very slow walk", "duration_sec": 300}],
            "main_circuit": [
                {"exercise": "Comfortable walk (40-50% max HR)", "duration_sec": 900},
                {"exercise": "Rest and breathe", "duration_sec": 120},
                {"exercise": "Comfortable walk", "duration_sec": 600},
            ],
            "cooldown": [
                {"exercise": "Very slow walk", "duration_sec": 180},
                {"exercise": "Deep breathing", "duration_sec": 120},
            ],
        },
    },
]
