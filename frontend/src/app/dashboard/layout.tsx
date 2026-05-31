"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Overview",   icon: "🏠" },
  { href: "/dashboard/nutrition",  label: "Nutrition",  icon: "🥗" },
  { href: "/dashboard/workouts",   label: "Workouts",   icon: "💪" },
  { href: "/dashboard/lifestyle",  label: "Lifestyle",  icon: "🌿" },
  { href: "/dashboard/progress",   label: "Progress",   icon: "📊" },
  { href: "/dashboard/ask",        label: "AI Copilot", icon: "🤖" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-20">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">H</div>
            <div>
              <div className="font-bold text-gray-900 text-sm">healthCopilot</div>
              <div className="text-xs text-gray-400">AI Health Platform</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                  isActive
                    ? "bg-gradient-to-r from-sky-50 to-violet-50 text-sky-700 border border-sky-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
                {item.label === "AI Copilot" && (
                  <span className="ml-auto px-1.5 py-0.5 bg-violet-100 text-violet-600 text-xs rounded-md font-bold">AI</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div className="text-xs font-semibold text-amber-800 mb-1">⚠️ Disclaimer</div>
            <div className="text-xs text-amber-700">Not medical advice. Consult your healthcare provider.</div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center py-2 text-xs transition-all",
                isActive ? "text-sky-600" : "text-gray-500"
              )}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
