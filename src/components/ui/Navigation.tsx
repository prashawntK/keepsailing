"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Target, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/components/providers/TimerProvider";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function Navigation() {
  const pathname = usePathname();
  const { timerState, displayTime } = useTimer();

  // Don't show navigation on auth pages
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) return null;

  return (
    <>
      {/* Top bar — visible only when timer is running; always reserves safe-area space */}
      <header
        className="sticky top-0 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {timerState.isRunning && (
          <div className="max-w-4xl mx-auto px-4 h-11 flex items-center justify-end bg-surface-base/80 backdrop-blur-md border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-sm font-mono">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {displayTime}
            </div>
          </div>
        )}
      </header>

      {/* Bottom floating tab bar */}
      <nav className="fixed bottom-6 left-4 right-4 z-40 glass-panel rounded-2xl border border-white/10 shadow-2xl">
        <div className="max-w-4xl mx-auto px-2 h-16 flex items-center justify-around">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                  active
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
