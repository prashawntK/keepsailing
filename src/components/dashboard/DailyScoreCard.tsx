"use client";

import { ProgressRing } from "@/components/ui/ProgressRing";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { getScoreLabel } from "@/lib/scoring";

interface DailyScoreCardProps {
  score: number;
  goalsCompleted: number;
  goalsTotal: number;
  totalHours: number;
  targetHours: number;
  yesterdayScore: number | null;
  overallStreak: { currentStreak: number; longestStreak: number };
}

export function DailyScoreCard({
  score,
  goalsCompleted,
  goalsTotal,
  totalHours,
  targetHours,
  yesterdayScore,
  overallStreak,
}: DailyScoreCardProps) {
  const label = getScoreLabel(score);
  const diff = yesterdayScore !== null ? Math.round(score - yesterdayScore) : null;

  const ringColor =
    score >= 80 ? "#22C55E" : score >= 60 ? "#F97316" : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      {/* Dynamic spotlight glow reflecting current score */}
      <div 
        className="absolute top-0 right-0 w-48 h-48 blur-[60px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: ringColor, opacity: score >= 80 ? 0.25 : 0.15 }}
      />
      
      <div className="flex items-center gap-6 relative z-10">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <ProgressRing
            percentage={score}
            size={100}
            strokeWidth={8}
            color={ringColor}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-xp drop-shadow-sm">
              {Math.round(score)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-100">{label}</span>
            {diff !== null && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  diff >= 0 ? "text-success bg-success/15" : "text-error bg-error/15"
                }`}
              >
                {diff >= 0 ? "+" : ""}{diff} vs yesterday
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-gray-400">
              <span className="text-gray-100 font-semibold">{goalsCompleted}</span>
              <span> / {goalsTotal} goals</span>
            </div>
            <div className="text-gray-400">
              <span className="text-gray-100 font-semibold">
                {totalHours.toFixed(1)}h
              </span>
              <span> / {targetHours.toFixed(1)}h</span>
            </div>
          </div>

          {overallStreak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-gray-500">Overall streak:</span>
              <StreakBadge streak={overallStreak.currentStreak} size="sm" showLabel={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
