"use client";

import { useCallback, useEffect, useState } from "react";
import { ScoreTrendChart } from "@/components/stats/ScoreTrendChart";
import { StreakCalendar } from "@/components/stats/StreakCalendar";
import { StatsOverviewCards } from "@/components/stats/StatsOverviewCards";
import { StepBreakdownCard } from "@/components/stats/StepBreakdownCard";
import { LifeInWeeksCard } from "@/components/stats/LifeInWeeksCard";
import { Modal } from "@/components/ui/Modal";
import { Maximize2 } from "lucide-react";
import type { OverviewStats } from "@/types";

type Period = "week" | "month";

interface GoalSummary {
  id: string;
  name: string;
  emoji: string;
  steps: { id: string }[];
}

type DayScore = { date: string; score: number; goalsCompleted: number; goalsTotal: number };

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [goalsWithSteps, setGoalsWithSteps] = useState<GoalSummary[]>([]);
  const [scoreTrend, setScoreTrend] = useState<{ date: string; score: number }[]>([]);
  const [calendarScores, setCalendarScores] = useState<DayScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmapExpanded, setHeatmapExpanded] = useState(false);

  const currentYear = new Date().getFullYear();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const yearStart = `${currentYear}-01-01`;
    const yearEnd   = `${currentYear}-12-31`;

    const [ov, trend, calYear, goals] = await Promise.all([
      fetch(`/api/stats/overview?period=${period}`).then((r) => r.json()),
      fetch(`/api/stats/charts?type=daily_scores&period=${period}`).then((r) => r.json()),
      fetch(`/api/scores?from=${yearStart}&to=${yearEnd}&fill=true`).then((r) => r.json()),
      fetch(`/api/goals`).then((r) => r.json()),
    ]);
    setOverview(ov);
    setScoreTrend(trend);
    setCalendarScores(calYear ?? []);
    setGoalsWithSteps(goals ?? []);
    setLoading(false);
  }, [period, currentYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-20 bg-surface-2 rounded-lg" />
            <div className="h-4 w-48 bg-surface-2 rounded-lg" />
          </div>
          <div className="h-9 w-32 bg-surface-2 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-20 bg-surface-2" />)}
        </div>
        <div className="card h-52 bg-surface-2" />
        <div className="card h-52 bg-surface-2" />
        <div className="card h-36 bg-surface-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Stats</h1>
          <p className="text-sm text-gray-400">Your productivity at a glance</p>
        </div>
        <div className="flex gap-1 glass-card p-1">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                period === p
                  ? "btn-premium"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      {overview && (
        <StatsOverviewCards
          totalHours={overview.totalHours}
          averageScore={overview.averageScore}
          bestDay={overview.bestDay}
          consistencyRate={overview.consistencyRate}
          currentOverallStreak={overview.currentOverallStreak}
          daysWithActivity={overview.daysWithActivity ?? 0}
        />
      )}

      {/* Score trend */}
      <div className="glass-card p-4 group">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 group-hover:text-primary transition-colors">Score Trend</h2>
        <ScoreTrendChart data={scoreTrend} />
      </div>

      {/* Activity heatmap + Life in weeks — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Heatmap */}
        <div className="glass-card p-4 group">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider group-hover:text-primary transition-colors">
              Activity Heatmap — {currentYear}
            </h2>
            <button
              onClick={() => setHeatmapExpanded(true)}
              className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-2 cursor-pointer transition-colors"
            >
              <Maximize2 size={14} />
            </button>
          </div>
          <StreakCalendar scores={calendarScores} year={currentYear} />
        </div>

        {/* Life in weeks */}
        <LifeInWeeksCard scores={calendarScores} year={currentYear} />
      </div>

      {/* Heatmap expanded modal */}
      <Modal open={heatmapExpanded} onClose={() => setHeatmapExpanded(false)} title={`Activity Heatmap — ${currentYear}`}>
        <div className="overflow-x-auto">
          <StreakCalendar scores={calendarScores} year={currentYear} />
        </div>
      </Modal>

      {/* Step breakdown per goal */}
      {goalsWithSteps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Goal Breakdown</h2>
          {goalsWithSteps.map((goal) => (
            <StepBreakdownCard
              key={goal.id}
              goalId={goal.id}
              goalName={goal.name}
              goalEmoji={goal.emoji}
              period={period}
            />
          ))}
        </div>
      )}
    </div>
  );
}
