"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { formatTimerDisplay } from "@/lib/utils";
import type { TimerState, TimerTargetType } from "@/types";

const STORAGE_KEY = "adhd-scorecard-timer";

export interface StartUniversalTimerParams {
  type: TimerTargetType;
  id: string;
  name: string;
  emoji: string;
  durationMinutes: number | null; // null = open-ended
}

interface TimerContextValue {
  timerState: TimerState;
  displayTime: string;
  totalElapsed: number; // seconds
  startTimer: (goalId: string, pomodoro?: boolean) => Promise<void>;
  startUniversalTimer: (params: StartUniversalTimerParams) => Promise<void>;
  stopTimer: (focusRating?: number) => Promise<void>;
  togglePomodoro: () => void;
}

const defaultState: TimerState = {
  goalId: null,
  sessionId: null,
  isRunning: false,
  startTime: null,
  elapsed: 0,
  pomodoroMode: false,
  pomodoroPhase: "work",
  pomodoroCount: 0,
  targetType: null,
  targetId: null,
  targetName: null,
  targetEmoji: null,
  targetDuration: null,
};

const TimerContext = createContext<TimerContextValue>({
  timerState: defaultState,
  displayTime: "00:00",
  totalElapsed: 0,
  startTimer: async () => {},
  startUniversalTimer: async () => {},
  stopTimer: async () => {},
  togglePomodoro: () => {},
});

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>(defaultState);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore from localStorage on mount (with migration for old format)
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saved: any = JSON.parse(raw);
      // Backfill missing universal fields for old-format saved state
      const migrated: TimerState = {
        ...defaultState,
        ...saved,
        targetType: saved.targetType ?? (saved.goalId ? "goal" : null),
        targetId: saved.targetId ?? saved.goalId ?? null,
        targetName: saved.targetName ?? null,
        targetEmoji: saved.targetEmoji ?? null,
        targetDuration: saved.targetDuration ?? null,
      };
      if (migrated.isRunning && migrated.startTime) {
        setState(migrated);
        startInterval();
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startInterval() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
  }

  function clearTimerInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Compute total elapsed seconds
  const totalElapsed =
    state.isRunning && state.startTime
      ? state.elapsed + Math.floor((Date.now() - state.startTime) / 1000)
      : state.elapsed;

  // Suppress unused tick warning — it exists to trigger re-render
  void tick;

  const displayTime = formatTimerDisplay(totalElapsed);

  // Legacy goal-only start — backward compat for GoalCard inline buttons
  const startTimer = useCallback(
    async (goalId: string, pomodoro = false) => {
      if (state.isRunning) {
        await stopTimerFn();
      }

      const res = await fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      });
      const { sessionId } = await res.json();

      const next: TimerState = {
        goalId,
        sessionId,
        isRunning: true,
        startTime: Date.now(),
        elapsed: 0,
        pomodoroMode: pomodoro,
        pomodoroPhase: "work",
        pomodoroCount: state.pomodoroCount,
        targetType: "goal",
        targetId: goalId,
        targetName: null,
        targetEmoji: null,
        targetDuration: null,
      };
      setState(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      startInterval();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.isRunning, state.pomodoroCount]
  );

  // Universal timer start — works for goals, ECs, and chores
  const startUniversalTimer = useCallback(
    async (params: StartUniversalTimerParams) => {
      if (state.isRunning) {
        await stopTimerFn();
      }

      let sessionId: string | null = null;

      // For goals, create a server-side TimerSession
      if (params.type === "goal") {
        const res = await fetch("/api/timer/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalId: params.id }),
        });
        const data = await res.json();
        sessionId = data.sessionId;
      }

      const next: TimerState = {
        goalId: params.type === "goal" ? params.id : null,
        sessionId,
        isRunning: true,
        startTime: Date.now(),
        elapsed: 0,
        pomodoroMode: false,
        pomodoroPhase: "work",
        pomodoroCount: 0,
        targetType: params.type,
        targetId: params.id,
        targetName: params.name,
        targetEmoji: params.emoji,
        targetDuration:
          params.durationMinutes != null ? params.durationMinutes * 60 : null,
      };
      setState(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      startInterval();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.isRunning]
  );

  // Core stop logic — shared by stopTimer and internal stops
  async function doStop(currentState: TimerState, focusRating?: number) {
    clearTimerInterval();

    const finalElapsed =
      currentState.isRunning && currentState.startTime
        ? currentState.elapsed +
          Math.floor((Date.now() - currentState.startTime) / 1000)
        : currentState.elapsed;

    const minutes = Math.max(1, Math.round(finalElapsed / 60));
    const type =
      currentState.targetType ?? (currentState.goalId ? "goal" : null);

    if (type === "goal" && currentState.sessionId) {
      await fetch("/api/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentState.sessionId,
          focusRating,
          elapsed: finalElapsed,
        }),
      });
    } else if (type === "ec" && currentState.targetId) {
      await fetch("/api/extra-curriculars/log-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ecId: currentState.targetId,
          minutesSpent: minutes,
        }),
      });
    } else if (type === "chore" && currentState.targetId) {
      await fetch("/api/chores/log-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreId: currentState.targetId,
          minutesSpent: minutes,
        }),
      });
    }

    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Internal stop used before starting a new timer (uses current state ref)
  async function stopTimerFn() {
    await doStop(state);
  }

  const stopTimer = useCallback(
    async (focusRating?: number) => {
      // Allow stopping for any target type, not just goals with sessionId
      if (!state.isRunning) return;
      await doStop(state, focusRating);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state.sessionId,
      state.isRunning,
      state.startTime,
      state.elapsed,
      state.targetType,
      state.goalId,
      state.targetId,
    ]
  );

  const togglePomodoro = useCallback(() => {
    setState((s) => {
      const next = { ...s, pomodoroMode: !s.pomodoroMode };
      if (s.isRunning)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <TimerContext.Provider
      value={{
        timerState: state,
        displayTime,
        totalElapsed,
        startTimer,
        startUniversalTimer,
        stopTimer,
        togglePomodoro,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
