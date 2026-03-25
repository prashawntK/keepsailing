"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Timer } from "lucide-react";
import { DailyScoreCard } from "./DailyScoreCard";
import { GoalGrid } from "./GoalGrid";
import { TimerStartModal } from "@/components/timer/TimerStartModal";
import { useTimer } from "@/components/providers/TimerProvider";
import { DailyQuote } from "@/components/adhd/DailyQuote";
import { EnergyTracker } from "@/components/adhd/EnergyTracker";
import { ExtraCurricularSection } from "./ExtraCurricularSection";
import { ChoreSection } from "./ChoreSection";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { Confetti } from "@/components/ui/Confetti";
import { checkAndNotifyChores, requestNotificationPermission } from "@/lib/chore-notifications";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { DashboardData } from "@/types";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface DashboardViewProps {
  initialData: DashboardData;
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  // loading=true until the first client-side fetch completes
  const [loading, setLoading] = useState(initialData.date === "");
  const [showConfetti, setShowConfetti] = useState(false);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  // null = still checking, true = show wizard, false = hide wizard
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const onboardingDismissedRef = useRef(false);
  const { timerState, startUniversalTimer } = useTimer();
  const [, startTransition] = useTransition();
  const prevCompletedRef = useRef<number | null>(null); // null = initial load not done yet
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
        // Set onboarding state from dashboard response — never re-show once dismissed
        if (next.user !== undefined && !onboardingDismissedRef.current) {
          setShowOnboarding(!next.user?.onboardingCompleted);
        }
        // Only fire confetti when count genuinely increases AFTER the first load.
        // prevCompletedRef starts as null so the initial page load never triggers it.
        if (prevCompletedRef.current !== null && next.dailyScore.goalsCompleted > prevCompletedRef.current) {
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

  // Onboarding state is set inside the refresh() callback via data.user
  // No separate /api/user fetch needed — eliminates an extra round-trip on load

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
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <Confetti trigger={showConfetti} type="basic" />

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Today</h1>
          <p className="text-sm text-gray-400">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!timerState.isRunning && (
            <button
              onClick={() => {
                startUniversalTimer({ type: "goal", id: "free", name: "", emoji: "⏱️", durationMinutes: null });
                refresh();
              }}
              className="p-2.5 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-all"
              title="Start timer"
            >
              <Timer size={20} />
            </button>
          )}
          <EnergyTracker />
        </div>
      </motion.div>


      {/* Daily score ring */}
      <motion.div variants={itemVariants} className="card" layout>
        <DailyScoreCard
          score={data.dailyScore.score}
          goalsCompleted={data.dailyScore.goalsCompleted}
          goalsTotal={data.dailyScore.goalsTotal}
          totalHours={data.dailyScore.totalHours}
          targetHours={data.dailyScore.targetHours}
          yesterdayScore={data.yesterdayScore}
          overallStreak={data.overallStreak}
        />
      </motion.div>

      {/* Goal grid */}
      <motion.div variants={itemVariants} layout>
        <GoalGrid goals={data.goals} onRefresh={refresh} />
      </motion.div>

      {/* Extra-curriculars */}
      <AnimatePresence mode="popLayout">
        {(data.extraCurriculars?.length > 0) && (
          <motion.div key="extracurriculars" variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }} layout>
            <ExtraCurricularSection items={data.extraCurriculars} onRefresh={refresh} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chores */}
      <AnimatePresence mode="popLayout">
        {(data.chores?.length > 0) && (
          <motion.div key="chores" variants={itemVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }} layout>
            <ChoreSection chores={data.chores} onRefresh={refresh} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily win journal */}
      <motion.div variants={itemVariants} layout>
        <DailyQuote />
      </motion.div>

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

      {/* Onboarding wizard — shown on first login, null means still checking */}
      {showOnboarding === true && (
        <OnboardingWizard
          onComplete={() => {
            onboardingDismissedRef.current = true;
            setShowOnboarding(false);
            refresh();
          }}
        />
      )}
    </motion.div>
  );
}
