"use client";

import { useCallback, useEffect, useState } from "react";
import { ScoreTrendChart } from "@/components/stats/ScoreTrendChart";
import { CategoryPieChart } from "@/components/stats/CategoryPieChart";
import { StreakCalendar } from "@/components/stats/StreakCalendar";
import { StatsOverviewCards } from "@/components/stats/StatsOverviewCards";
import { getLast365Days } from "@/lib/utils";
import type { OverviewStats } from "@/types";

type Period = "week" | "month";

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [scoreTrend, setScoreTrend] = useState<{ date: string; score: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [yearScores, setYearScores] = useState<{ date: string; score: number }[]>([]);

  const fetchData = useCallback(async () => {
    const [ov, trend, cat, yearData] = await Promise.all([
      fetch(`/api/stats/overview?period=${period}`).then((r) => r.json()),
      fetch(`/api/stats/charts?type=daily_scores&period=${period}`).then((r) => r.json()),
      fetch(`/api/stats/charts?type=category_breakdown&period=${period}`).then((r) => r.json()),
      fetch(`/api/scores?from=${getLast365Days()[0]}&to=${getLast365Days()[364]}&fill=true`).then((r) => r.json()),
    ]);
    setOverview(ov);
    setScoreTrend(trend);
    setCategoryData(cat);
    setYearScores(yearData);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Stats</h1>
          <p className="text-sm text-gray-400">Your productivity at a glance</p>
        </div>
        <div className="flex gap-1 bg-surface-1 border border-white/[0.06] rounded-xl p-1">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                period === p
                  ? "bg-primary text-white"
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
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Score Trend</h2>
        <ScoreTrendChart data={scoreTrend} />
      </div>

      {/* Category breakdown */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Time by Category</h2>
        <CategoryPieChart data={categoryData} />
      </div>

      {/* Activity heatmap */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Activity Heatmap (365 days)
        </h2>
        <StreakCalendar scores={yearScores} />
      </div>
    </div>
  );
}
