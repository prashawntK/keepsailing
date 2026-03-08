"use client";

import { Clock, Target, Flame, TrendingUp, Calendar, Trophy } from "lucide-react";

interface StatsOverviewCardsProps {
  totalHours: number;
  averageScore: number;
  bestDay: { date: string; score: number } | null;
  consistencyRate: number;
  currentOverallStreak: number;
  daysWithActivity: number;
}

export function StatsOverviewCards({
  totalHours,
  averageScore,
  bestDay,
  consistencyRate,
  currentOverallStreak,
  daysWithActivity,
}: StatsOverviewCardsProps) {
  const cards = [
    {
      icon: Clock,
      label: "Total Hours",
      value: `${totalHours.toFixed(1)}h`,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      icon: TrendingUp,
      label: "Avg Score",
      value: `${averageScore}/100`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Flame,
      label: "Streak",
      value: `${currentOverallStreak}d`,
      color: "text-streak",
      bg: "bg-streak/10",
    },
    {
      icon: Calendar,
      label: "Consistency",
      value: `${consistencyRate}%`,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: Trophy,
      label: "Best Score",
      value: bestDay ? `${Math.round(bestDay.score)}` : "—",
      color: "text-streak",
      bg: "bg-streak/10",
    },
    {
      icon: Target,
      label: "Days Active",
      value: String(daysWithActivity),
      color: "text-xp",
      bg: "bg-xp/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className={`${bg} border border-white/[0.06] rounded-xl p-3`}>
          <Icon size={16} className={`${color} mb-1`} />
          <p className="text-lg font-bold text-gray-100">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
