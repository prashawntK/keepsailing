import { DashboardView } from "@/components/dashboard/DashboardView";
import type { DashboardData } from "@/types";

// Don't fetch data server-side: the server runs UTC, but users are in their
// local timezone. If we SSR with a UTC date we'd show yesterday's data to
// anyone in UTC+1 or later until midnight UTC passes. Instead, render the
// shell immediately and let DashboardView's first useEffect fetch with the
// correct client-local date — zero flicker, always correct.
const EMPTY_STATE: DashboardData = {
  goals: [],
  extraCurriculars: [],
  chores: [],
  dailyScore: { score: 0, goalsCompleted: 0, goalsTotal: 0, totalHours: 0, targetHours: 0, streakBonus: 0 },
  overallStreak: { currentStreak: 0, longestStreak: 0 },
  yesterdayScore: null,
  totalPoints: 0,
  date: "",
};

export default function Home() {
  return <DashboardView initialData={EMPTY_STATE} />;
}
