// ── Weekly Banking ─────────────────────────────────────────────────────────
//
// If a user logs enough hours in a week to meet their goal's weekly target
// (dailyTarget × activeDays.length), the goal is considered "banked" for
// any remaining scheduled days that week where no work was done.
//
// Week starts on Sunday (day 0). Will be configurable in a future settings update.

export interface BankingStatus {
  isBanked: boolean;
  weeklyTotal: number;   // hours logged this week
  weeklyTarget: number;  // hours needed this week
}

/** Returns all dates (YYYY-MM-DD) in the Sun–Sat week containing `date`. */
export function getWeekDatesRange(date: string): string[] {
  const d = new Date(date + "T00:00:00");
  const day = d.getDay(); // 0 = Sun
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(sunday);
    dt.setDate(sunday.getDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

/**
 * Compute weekly banking status for a single timer goal.
 *
 * @param goalType     - "timer" | "checkbox"
 * @param dailyTarget  - hours per active day
 * @param activeDays   - array of day-of-week numbers (0=Sun..6=Sat)
 * @param date         - the date we're checking (YYYY-MM-DD)
 * @param weeklyLogs   - all DailyLogs for this goal in the current Sun–Sat week
 */
export function getWeeklyBankingStatus(
  goalType: string,
  dailyTarget: number,
  activeDays: number[],
  date: string,
  weeklyLogs: Array<{ date: string; timeSpent: number }>
): BankingStatus {
  // Only timer goals with a positive daily target can be banked
  if (goalType !== "timer" || dailyTarget <= 0 || activeDays.length === 0) {
    return { isBanked: false, weeklyTotal: 0, weeklyTarget: 0 };
  }

  const weeklyTarget = dailyTarget * activeDays.length;
  const weeklyTotal = weeklyLogs.reduce((sum, l) => sum + (l.timeSpent ?? 0), 0);

  // If the user has already done work today, show real progress instead of "banked"
  const todayLog = weeklyLogs.find((l) => l.date === date);
  const todayTimeSpent = todayLog?.timeSpent ?? 0;

  const isBanked = weeklyTotal >= weeklyTarget && todayTimeSpent === 0;

  return { isBanked, weeklyTotal, weeklyTarget };
}
