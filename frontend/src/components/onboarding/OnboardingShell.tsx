"use client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Profile",    icon: "👤", path: "/onboarding/profile" },
  { num: 2, label: "Activity",   icon: "🏃", path: "/onboarding/activity" },
  { num: 3, label: "Goals",      icon: "🎯", path: "/onboarding/goals" },
  { num: 4, label: "Conditions", icon: "🩺", path: "/onboarding/conditions" },
  { num: 5, label: "Diet",       icon: "🥗", path: "/onboarding/diet" },
  { num: 6, label: "Lifestyle",  icon: "🌿", path: "/onboarding/lifestyle" },
];

interface Props {
  currentStep: number;
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function OnboardingShell({ currentStep, children, title, subtitle }: Props) {
  const router = useRouter();
  const progress = (currentStep / 6) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-bold cursor-pointer"
              onClick={() => router.push("/")}
            >
              H
            </div>
            <span className="font-bold text-gray-900">healthCopilot</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Build Your Health Profile</span>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-3 overflow-x-auto pb-1">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-[60px] transition-all",
                    step.num < currentStep && "cursor-pointer"
                  )}
                  onClick={() => step.num < currentStep && router.push(step.path)}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                      step.num < currentStep && "bg-emerald-100 text-emerald-700",
                      step.num === currentStep && "bg-gradient-to-br from-sky-500 to-violet-600 text-white shadow-glow-blue scale-110",
                      step.num > currentStep && "bg-gray-100 text-gray-400"
                    )}
                  >
                    {step.num < currentStep ? "✓" : step.icon}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium hidden sm:block",
                      step.num === currentStep ? "text-sky-600" : step.num < currentStep ? "text-emerald-600" : "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <div className="text-sm text-sky-600 font-semibold mb-1">Step {currentStep} of 6</div>
          <h1 className="text-3xl font-black text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-2">{subtitle}</p>
        </div>
        <div className="animate-slide-up">{children}</div>
      </div>
    </div>
  );
}
