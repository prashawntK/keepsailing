"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Timer } from "lucide-react";
import { DailyScoreCard } from "./DailyScoreCard";
import { GoalGrid } from "./GoalGrid";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { TimerStartModal } from "@/components/timer/TimerStartModal";
import { useTimer } from "@/components/providers/TimerProvider";
import { MorningView } from "@/components/adhd/MorningView";
import { ForgivenessBanner } from "@/components/adhd/ForgivenessBanner";
import { DailyWin } from "@/components/adhd/DailyWin";
import { EnergyTracker } from "@/components/adhd/EnergyTracker";
import { DecisionHelper } from "@/components/adhd/DecisionHelper";
import { ExtraCurricularSection } from "./ExtraCurricularSection";
import { ChoreSection } from "./ChoreSection";
import { Confetti } from "@/components/ui/Confetti";
import { checkAndNotifyChores, requestNotificationPermission } from "@/lib/chore-notifications";
import type { DashboardData } from "@/types";

interface DashboardViewProps {
  initialData: DashboardData;
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  // loading=true until the first client-side fetch completes
  const [loading, setLoading] = useState(initialData.date === "");
  const [showConfetti, setShowConfetti] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const { timerState } = useTimer();
  const [, startTransition] = useTransition();
  const prevCompletedRef = useRef(initialData.dailyScore.goalsCompleted);
  const refreshingRef = useRef(false);
  const lastDateRef = useRef(format(new Date(), "yyyy-MM-dd"));

  // Always fetch with the client's local date — never trust server-UTC date
  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const localDate = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/dashboard?date=${localDate}`, { cache: "no-store" });
      if (!res.ok) return;
      const next: DashboardData = await res.json();
      startTransition(() => {
        setData(next);
        setLoading(false);
        if (next.dailyScore.goalsCompleted > prevCompletedRef.current) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 200);
        }
        prevCompletedRef.current = next.dailyScore.goalsCompleted;
      });
    } catch {
      setLoading(false);
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  // Initial load — fetch with correct local date on mount
  useEffect(() => { refresh(); }, [refresh]);

  // Request notification permission on mount (non-intrusive) and check chore deadlines
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    requestNotificationPermission().then(() => {
      if (data.chores?.length > 0) {
        checkAndNotifyChores(data.chores);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Passive background sync every 60s — also detects day rollover at midnight
  useEffect(() => {
    const id = setInterval(() => {
      const currentDate = format(new Date(), "yyyy-MM-dd");
      if (currentDate !== lastDateRef.current) {
        // Midnight has passed — reset to new day immediately
        lastDateRef.current = currentDate;
      }
      refresh();
    }, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const hasActivityToday =
    data.dailyScore.totalHours > 0 || data.dailyScore.goalsCompleted > 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-surface-2 rounded-lg" />
        <div className="card h-48 bg-surface-2" />
        <div className="card h-32 bg-surface-2" />
        <div className="card h-32 bg-surface-2" />
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          {!timerState.isRunning && (
            <button
              onClick={() => setTimerModalOpen(true)}
              className="p-2.5 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-all"
              title="Start timer"
            >
              <Timer size={20} />
            </button>
          )}
          <EnergyTracker />
        </div>
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

      {/* Extra-curriculars */}
      {(data.extraCurriculars?.length > 0) && (
        <ExtraCurricularSection items={data.extraCurriculars} onRefresh={refresh} />
      )}

      {/* Chores */}
      {(data.chores?.length > 0) && (
        <ChoreSection chores={data.chores} onRefresh={refresh} />
      )}

      {/* Daily win journal */}
      <DailyWin />

      {/* Floating timer */}
      <TimerDisplay onRefresh={refresh} goals={data.goals} />

      {/* Timer start modal */}
      <TimerStartModal
        open={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
        goals={data.goals}
        extraCurriculars={data.extraCurriculars ?? []}
        chores={data.chores ?? []}
        onRefresh={refresh}
      />
    </div>
  );
}
