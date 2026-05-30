"use client";
import { useState } from "react";
import { DEMO_MODE } from "@/lib/api-client";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (!DEMO_MODE || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs bg-white rounded-2xl shadow-card-hover border border-violet-200 p-4 animate-slide-up">
      <div className="flex items-start gap-2">
        <span className="text-lg">🎭</span>
        <div className="flex-1">
          <div className="font-bold text-gray-900 text-sm mb-0.5">Demo Mode</div>
          <div className="text-xs text-gray-500 leading-relaxed">
            This is a static showcase running on sample data (a Type 2 Diabetes + Hypertension user).
            Run the full stack locally with <code className="text-violet-600">docker compose</code> for
            live AI and your own profile.
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 text-sm"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
