"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Target, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function Navigation() {
  const pathname = usePathname();
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) return null;

  return (
    <>
      <header
        className="sticky top-0 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      />

      <nav
        className="fixed bottom-6 left-4 right-4 z-40 glass-panel rounded-2xl border border-white/10 overflow-hidden"
        style={{
          background: "color-mix(in srgb, var(--nav-bg) 92%, var(--color-primary) 8%)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 -8px 32px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="max-w-4xl mx-auto px-2 h-16 flex items-center justify-around">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all",
                  active
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl pointer-events-none"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <Icon
                    size={active ? 22 : 20}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={active ? { filter: "drop-shadow(0 0 6px var(--color-primary))" } : undefined}
                  />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
