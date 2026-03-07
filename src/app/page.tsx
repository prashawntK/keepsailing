import { DashboardView } from "@/components/dashboard/DashboardView";
import { assembleDashboardData } from "@/lib/dashboard";
import type { DashboardData } from "@/types";

const EMPTY_STATE: DashboardData = {
  goals: [],
  dailyScore: { score: 0, goalsCompleted: 0, goalsTotal: 0, totalHours: 0, targetHours: 0, streakBonus: 0 },
  overallStreak: { currentStreak: 0, longestStreak: 0 },
  yesterdayScore: null,
  totalPoints: 0,
  date: new Date().toISOString().slice(0, 10),
};

export default async function Home() {
  let data: DashboardData;
  try {
    data = await assembleDashboardData();
  } catch {
    data = EMPTY_STATE;
  }
  return <DashboardView initialData={data} />;
}
