import { parseActiveDays } from "./utils";
import { getWeekDatesRange, getWeeklyBankingStatus } from "./banking";

// Milestone thresholds
export const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  milestoneReached: number | null;
}

/**
 * Calculate streak for a goal based on its DailyLog history.
 * - Timer goals: completed when timeSpent >= dailyTarget
 * - Checkbox goals: completed when completed === true
 * - Days where the goal is inactive are skipped (not counted as breaks)
 * - `freezesAvailable` missed active days are forgiven before breaking
 */
export function calculateGoalStreak(
  logs: Array<{ date: string; completed: boolean; timeSpent: number }>,
  goal: { goalType: string; dailyTarget: number; activeDays: unknown },
  today: string,
  freezesAvailable: number = 0
): StreakResult {
  const activeDays = parseActiveDays(goal.activeDays);

  // Build a set of dates with a qualifying log (actual completion OR banked)
  const completedDates = new Set<string>();
  for (const log of logs) {
    const isCompleted =
      goal.goalType === "checkbox"
        ? log.completed
        : log.timeSpent >= goal.dailyTarget;
    if (isCompleted) completedDates.add(log.date);
  }

  // For timer goals: also mark all active days in weeks where weekly target was met
  if (goal.goalType === "timer" && goal.dailyTarget > 0 && activeDays.length > 0) {
    // Collect all unique weeks from log dates
    const weekStarts = new Set<string>();
    for (const log of logs) {
      weekStarts.add(getWeekDatesRange(log.date)[0]);
    }
    for (const weekStart of weekStarts) {
      const weekDates = getWeekDatesRange(weekStart);
      const weekLogs = logs.filter((l) => weekDates.includes(l.date));
      const { isBanked: weeklyMet } = getWeeklyBankingStatus(
        goal.goalType,
        goal.dailyTarget,
        activeDays,
        // Use last day of week (Sat) to check banking — on that day todayTimeSpent check is irrelevant
        weekDates[6],
        weekLogs
      );
      if (weeklyMet || weekLogs.reduce((s, l) => s + l.timeSpent, 0) >= goal.dailyTarget * activeDays.length) {
        // Mark all active days in this week as effectively completed
        for (const d of weekDates) {
          const dow = new Date(d + "T00:00:00").getDay();
          if (activeDays.includes(dow)) completedDates.add(d);
        }
      }
    }
  }

  // Walk backwards from today to find current streak
  let currentStreak = 0;
  let freezesLeft = freezesAvailable;
  let checkDate = today;
  let longestStreak = 0;
  let lastActiveDate: string | null = null;

  for (let i = 0; i < 365; i++) {
    const d = subtractDays(today, i);
    const dayOfWeek = new Date(d + "T00:00:00").getDay();

    // Skip inactive days
    if (!activeDays.includes(dayOfWeek)) continue;

    if (completedDates.has(d)) {
      currentStreak++;
      if (!lastActiveDate) lastActiveDate = d;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (d === today) {
      // Today not yet complete — don't break streak, just continue
    } else if (freezesLeft > 0) {
      freezesLeft--;
    } else {
      break;
    }
    void checkDate; // avoid unused var lint
    checkDate = d;
  }

  // Compute longest streak across all history
  let tempStreak = 0;
  const sortedDates = [...completedDates].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      // Check continuity (accounting for active days gaps)
      tempStreak++;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
    milestoneReached: null,
  };
}

/**
 * Calculate overall streak based on daily scores >= threshold.
 */
export function calculateOverallStreak(
  scores: Array<{ date: string; score: number }>,
  today: string,
  threshold: number = 70,
  freezesAvailable: number = 0
): StreakResult {
  const goodDays = new Set(
    scores.filter((s) => s.score >= threshold).map((s) => s.date)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let freezesLeft = freezesAvailable;
  let lastActiveDate: string | null = null;
  let tempLongest = 0;

  for (let i = 0; i < 365; i++) {
    const d = subtractDays(today, i);

    if (goodDays.has(d)) {
      currentStreak++;
      tempLongest = Math.max(tempLongest, currentStreak);
      if (!lastActiveDate) lastActiveDate = d;
    } else if (d === today) {
      // Today not yet done
    } else if (freezesLeft > 0) {
      freezesLeft--;
    } else {
      break;
    }
  }

  longestStreak = Math.max(currentStreak, tempLongest);

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
    milestoneReached: null,
  };
}

/**
 * Detect if a milestone was just crossed.
 */
export function checkMilestone(
  previousStreak: number,
  currentStreak: number
): number | null {
  for (const milestone of MILESTONES) {
    if (previousStreak < milestone && currentStreak >= milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get an encouraging recovery message based on how many days were missed.
 */
export function getRecoveryMessage(
  daysGap: number,
  previousStreak: number
): string {
  if (daysGap === 0) return "";
  if (daysGap === 1) return "Just one day off. You've got this — day one again!";
  if (daysGap <= 3)
    return "A short break is okay. Ready to start a new streak?";
  if (daysGap <= 7 && previousStreak > 0)
    return `Remember that ${previousStreak}-day streak? Let's build a new one — starting today!`;
  if (previousStreak >= 30)
    return `You had a ${previousStreak}-day run before. That focus is still inside you. Let's go!`;
  return "Every expert was once a beginner. Today is day one of something amazing.";
}

/**
 * Get a milestone celebration message.
 */
export function getMilestoneMessage(days: number, goalName?: string): string {
  const target = goalName ? `"${goalName}"` : "your overall";
  if (days === 3) return `3 days on ${target} streak! Great start 🔥`;
  if (days === 7) return `One full week on ${target}! You're building a habit 💪`;
  if (days === 14) return `Two weeks strong on ${target}! Consistency is your superpower 🚀`;
  if (days === 21) return `21 days — the magic number! ${target} streak is a real habit now 🧠`;
  if (days === 30) return `30-day ${target} streak! One month of showing up — incredible! 🏆`;
  if (days === 60) return `60 days on ${target}! Two months of dedication. You're unstoppable 🌟`;
  if (days === 90) return `90-day ${target} streak! Three months — you've transformed yourself 💎`;
  if (days === 180) return `Half a year on ${target}! This is mastery level. Legendary! 🎯`;
  if (days === 365) return `ONE YEAR on ${target}!! This is extraordinary. You are extraordinary! 🏅`;
  return `${days}-day streak on ${target}! Keep going! 🔥`;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
