"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { DailyScoreCard } from "./DailyScoreCard";
import { GoalGrid } from "./GoalGrid";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { MorningView } from "@/components/adhd/MorningView";
import { ForgivenessBanner } from "@/components/adhd/ForgivenessBanner";
import { DailyWin } from "@/components/adhd/DailyWin";
import { EnergyTracker } from "@/components/adhd/EnergyTracker";
import { DecisionHelper } from "@/components/adhd/DecisionHelper";
import { Confetti } from "@/components/ui/Confetti";
import type { DashboardData } from "@/types";

interface DashboardViewProps {
  initialData: DashboardData;
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [showConfetti, setShowConfetti] = useState(false);
  const [, startTransition] = useTransition();
  const prevCompletedRef = useRef(initialData.dailyScore.goalsCompleted);
  const refreshingRef = useRef(false);

  // Silent background refresh — never blocks UI, never causes a loading flash
  const refresh = useCallback(async () => {
    if (refreshingRef.current) return; // debounce concurrent refreshes
    refreshingRef.current = true;
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) return;
      const next: DashboardData = await res.json();
      // useTransition marks this as low-priority — won't block user interactions
      startTransition(() => {
        setData(next);
        if (next.dailyScore.goalsCompleted > prevCompletedRef.current) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 200);
        }
        prevCompletedRef.current = next.dailyScore.goalsCompleted;
      });
    } catch {
      // silently ignore
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  // Passive background sync every 60s (was 30s — halved DB traffic)
  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const hasActivityToday =
    data.dailyScore.totalHours > 0 || data.dailyScore.goalsCompleted > 0;

  return (
    <div className="space-y-6">
      <Confetti trigger={showConfetti} type="basic" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Today</h1>
          <p className="text-sm text-gray-400">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <EnergyTracker />
      </div>

      {/* Forgiveness banner */}
      <ForgivenessBanner yesterdayScore={data.yesterdayScore} />

      {/* Morning kickstart */}
      {!hasActivityToday && data.goals.length > 0 && (
        <MorningView
          goals={data.goals}
          yesterdayScore={data.yesterdayScore}
          overallStreak={data.overallStreak}
          onDismiss={refresh}
        />
      )}

      {/* Daily score ring */}
      <div className="card">
        <DailyScoreCard
          score={data.dailyScore.score}
          goalsCompleted={data.dailyScore.goalsCompleted}
          goalsTotal={data.dailyScore.goalsTotal}
          totalHours={data.dailyScore.totalHours}
          targetHours={data.dailyScore.targetHours}
          yesterdayScore={data.yesterdayScore}
          overallStreak={data.overallStreak}
        />
      </div>

      {/* Decision helper */}
      {data.goals.filter((g) => g.isActiveToday && g.completionPercentage < 100).length > 0 && (
        <DecisionHelper goals={data.goals} energyLevel={null} onStartTimer={refresh} />
      )}

      {/* Goal grid */}
      <GoalGrid goals={data.goals} onRefresh={refresh} />

      {/* Daily win journal */}
      <DailyWin />

      {/* Floating timer */}
      <TimerDisplay onRefresh={refresh} goals={data.goals} />
    </div>
  );
}
