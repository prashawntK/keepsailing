import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";

// ── Tailwind class merging ─────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date helpers ──────────────────────────────────────────────────────────
export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function dateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), "yyyy-MM-dd")
  );
}

export function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) =>
    format(subDays(new Date(), 29 - i), "yyyy-MM-dd")
  );
}

export function getLast365Days(): string[] {
  return Array.from({ length: 365 }, (_, i) =>
    format(subDays(new Date(), 364 - i), "yyyy-MM-dd")
  );
}

export function getWeekDates(date: Date = new Date()): string[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((d) =>
    format(d, "yyyy-MM-dd")
  );
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return format(date, "EEE, MMM d");
}

// ── Time formatting ───────────────────────────────────────────────────────
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function hoursToSeconds(hours: number): number {
  return Math.round(hours * 3600);
}

export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

// ── Active-days helpers ──────────────────────────────────────────────────
export function parseActiveDays(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [0, 1, 2, 3, 4, 5, 6];
    }
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

export function isGoalActiveToday(activeDays: unknown): boolean {
  const days = parseActiveDays(activeDays);
  return days.includes(new Date().getDay());
}

export function isGoalActiveOnDate(activeDays: unknown, dateStr: string): boolean {
  const days = parseActiveDays(activeDays);
  return days.includes(new Date(dateStr + "T00:00:00").getDay());
}

// ── Status colours ────────────────────────────────────────────────────────
export function getStatusColor(percentage: number): string {
  if (percentage >= 100) return "text-emerald-400";
  if (percentage >= 80) return "text-green-400";
  if (percentage >= 50) return "text-amber-400";
  return "text-red-400";
}

export function getStatusBg(percentage: number): string {
  if (percentage >= 100) return "bg-emerald-500/10 border-emerald-500/25";
  if (percentage >= 80) return "bg-green-500/10 border-green-500/25";
  if (percentage >= 50) return "bg-amber-500/10 border-amber-500/25";
  return "bg-red-500/8 border-red-500/20";
}

export function getStatusRing(percentage: number): string {
  if (percentage >= 100) return "#22C55E"; // success green
  if (percentage >= 80) return "#34D399";  // emerald-400
  if (percentage >= 50) return "#F59E0B";  // streak amber
  return "#EF4444";                         // error red
}

// ── Category colours ──────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  Learning: "text-purple-400",
  Career: "text-cyan-400",
  Health: "text-emerald-400",
  Personal: "text-orange-400",
  Creative: "text-pink-400",
};

export const CATEGORY_BG: Record<string, string> = {
  Learning: "bg-purple-500/12",
  Career: "bg-cyan-500/12",
  Health: "bg-emerald-500/12",
  Personal: "bg-orange-500/12",
  Creative: "bg-pink-500/12",
};

export const CATEGORY_HEX: Record<string, string> = {
  Learning: "#8B5CF6",
  Career: "#06B6D4",
  Health: "#10B981",
  Personal: "#F97316",
  Creative: "#EC4899",
};

// ── Priority labels ───────────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<string, string> = {
  must: "Must Do",
  should: "Should Do",
  want: "Want To Do",
};

export const PRIORITY_COLORS: Record<string, string> = {
  must: "text-red-400 bg-red-500/12",
  should: "text-amber-400 bg-amber-500/12",
  want: "text-emerald-400 bg-emerald-500/12",
};

// ── Misc ──────────────────────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
