// Re-export Prisma generated types
export type {
  Goal,
  DailyLog,
  TimerSession,
  Streak,
  DailyScore,
  Reward,
  PointsLedger,
  JournalEntry,
  EnergyLog,
  AppSettings,
  Step,
  ExtraCurricular,
  ExtraCurricularLog,
  ExtraCurricularTimeLog,
  Chore,
  ChoreTimeLog,
  ChoreCompletionLog,
} from "@prisma/client";

export interface StepData {
  id: string;
  name: string;
  sortOrder: number;
  completedAt: string | null; // ISO string or null
}

// ── Extended / computed types ─────────────────────────────────────────────

export interface GoalWithProgress {
  id: string;
  name: string;
  emoji: string;
  category: string;
  goalType: "timer" | "checkbox";
  dailyTarget: number;
  priority: "must" | "should" | "want";
  activeDays: number[];
  pomodoroSettings: PomodoroSettings | null;
  description: string | null;
  motivation: string | null;
  sortOrder: number;
  isArchived: boolean;

  // Computed for today
  todayLog: {
    id: string;
    completed: boolean;
    timeSpent: number;
    focusRating: number | null;
    note: string | null;
  } | null;

  streak: {
    id: string;
    currentStreak: number;
    longestStreak: number;
  };

  activeSession: {
    id: string;
    startTime: string; // ISO string
    goalId: string;
  } | null;

  completionPercentage: number;
  isActiveToday: boolean;
  isBanked: boolean;
  bankingInfo: { weeklyTotal: number; weeklyTarget: number } | null;

  // Steps (optional — goals may have 0 steps)
  steps: StepData[];
  currentStep: StepData | null; // first incomplete step by sortOrder
}

export interface ExtraCurricularWithStatus {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  isArchived: boolean;
  targetMinutes: number | null;
  completedToday: boolean;
  lastPerformedDate: string | null;
  lastPerformedDaysAgo: number | null;
  totalMinutesSpent: number;
}

export interface ChoreWithStatus {
  id: string;
  name: string;
  emoji: string;
  deadline: string; // ISO datetime
  estimatedMinutes: number;
  description: string | null;
  sortOrder: number;
  isArchived: boolean;
  completedToday: boolean;
  totalMinutesSpent: number;
  daysUntilDeadline: number; // negative = overdue
  deadlineLabel: string;
  deadlineSeverity:
    | "overdue"
    | "today"
    | "urgent"
    | "warning"
    | "comfortable"
    | "relaxed";
}

export interface DashboardData {
  goals: GoalWithProgress[];
  extraCurriculars: ExtraCurricularWithStatus[];
  chores: ChoreWithStatus[];
  dailyScore: {
    score: number;
    goalsCompleted: number;
    goalsTotal: number;
    totalHours: number;
    targetHours: number;
    streakBonus: number;
  };
  overallStreak: {
    currentStreak: number;
    longestStreak: number;
  };
  yesterdayScore: number | null;
  totalPoints: number;
  date: string;
  user?: { name: string | null; onboardingCompleted: boolean } | null;
}

export type TimerTargetType = "goal" | "ec" | "chore";

export interface TimerState {
  goalId: string | null;
  sessionId: string | null;
  isRunning: boolean;
  startTime: number | null; // Date.now() ms
  elapsed: number;           // seconds accumulated before current start
  pomodoroMode: boolean;
  pomodoroPhase: "work" | "break";
  pomodoroCount: number;
  // Universal timer fields
  targetType: TimerTargetType | null;
  targetId: string | null;
  targetName: string | null;
  targetEmoji: string | null;
  targetDuration: number | null; // seconds, null = open-ended count-up
}

export interface PomodoroSettings {
  enabled: boolean;
  workMinutes: number;
  breakMinutes: number;
}

// ── Literal union types ───────────────────────────────────────────────────
export type Category = "Learning" | "Career" | "Health" | "Personal" | "Creative";
export type Priority = "must" | "should" | "want";
export type GoalType = "timer" | "checkbox";
export type Theme = "dark" | "light";

// ── Stats types ───────────────────────────────────────────────────────────
export interface OverviewStats {
  totalHours: number;
  averageScore: number;
  bestDay: { date: string; score: number } | null;
  consistencyRate: number;  // % of days with score > 0
  currentOverallStreak: number;
  daysWithActivity: number;
  totalGoalsCompleted: number;
  topCategory: string | null;
}

export interface ChartDataPoint {
  date: string;
  score?: number;
  [key: string]: string | number | undefined;
}

export interface GoalStats {
  goalId: string;
  totalHours: number;
  completionRate: number;
  averageFocusRating: number | null;
  currentStreak: number;
  longestStreak: number;
  dailyData: Array<{ date: string; timeSpent: number; completed: boolean }>;
}

// ── API response types ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
