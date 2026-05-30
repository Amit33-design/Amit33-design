"use client";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { cn } from "@/lib/utils";

const GENDERS = [
  { value: "male",   label: "Male",   icon: "♂️" },
  { value: "female", label: "Female", icon: "♀️" },
  { value: "other",  label: "Other",  icon: "⚧" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useOnboardingStore();

  const isValid =
    profile.age && profile.gender && profile.height_cm && profile.weight_kg;

  const bmi =
    profile.height_cm && profile.weight_kg
      ? (Number(profile.weight_kg) / Math.pow(Number(profile.height_cm) / 100, 2)).toFixed(1)
      : null;

  return (
    <OnboardingShell
      currentStep={1}
      title="Tell us about yourself"
      subtitle="Your physical stats help us calculate accurate calorie and macro targets using the Mifflin-St Jeor equation."
    >
      <div className="space-y-6">
        {/* Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name (optional)</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-gray-900"
            />
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Age <span className="text-red-500">*</span></label>
          <input
            type="number"
            value={profile.age}
            onChange={(e) => setProfile({ age: Number(e.target.value) })}
            placeholder="35"
            min={10}
            max={120}
            className="w-full md:w-48 px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-gray-900"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Gender <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                onClick={() => setProfile({ gender: g.value as "male" | "female" | "other" })}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold text-sm transition-all",
                  profile.gender === g.value
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Height (cm) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={profile.height_cm}
                onChange={(e) => setProfile({ height_cm: Number(e.target.value) })}
                placeholder="178"
                min={50}
                max={300}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-gray-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Weight (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={profile.weight_kg}
                onChange={(e) => setProfile({ weight_kg: Number(e.target.value) })}
                placeholder="75"
                min={20}
                max={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all text-gray-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
            </div>
          </div>
        </div>

        {/* BMI preview */}
        {bmi && (
          <div className="flex items-center gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl animate-fade-in">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-bold text-sky-800">BMI: {bmi}</div>
              <div className="text-sm text-sky-600">
                {Number(bmi) < 18.5 ? "Underweight" : Number(bmi) < 25 ? "Normal weight ✓" : Number(bmi) < 30 ? "Overweight" : "Obese"}
                {" "}— used to calibrate calorie targets
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => isValid && router.push("/onboarding/activity")}
          disabled={!isValid}
          className={cn(
            "w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all",
            isValid
              ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:scale-105 shadow-glow-blue"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          Continue to Activity →
        </button>
      </div>
    </OnboardingShell>
  );
}
