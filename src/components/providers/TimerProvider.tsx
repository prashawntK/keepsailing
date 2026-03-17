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
  startTimer: (goalId: string, pomodoro?: boolean) => void;
  startUniversalTimer: (params: StartUniversalTimerParams) => void;
  stopTimer: () => void;
  cancelTimer: () => void;
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
  startTimer: () => {},
  startUniversalTimer: () => {},
  stopTimer: () => {},
  cancelTimer: () => {},
  togglePomodoro: () => {},
});

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>(defaultState);
  const stateRef = useRef<TimerState>(defaultState);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep a ref in sync so callbacks always read current state without stale closure issues
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Restore from localStorage on mount (with migration for old format)
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saved: any = JSON.parse(raw);
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
        stateRef.current = migrated;
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

  void tick; // triggers re-render each second

  const displayTime = formatTimerDisplay(totalElapsed);

  // Fire-and-forget API call to stop a previous session (no UI wait)
  function fireStopApi(snap: TimerState) {
    const finalElapsed =
      snap.isRunning && snap.startTime
        ? snap.elapsed + Math.floor((Date.now() - snap.startTime) / 1000)
        : snap.elapsed;
    const minutes = Math.max(1, Math.round(finalElapsed / 60));
    const type = snap.targetType ?? (snap.goalId ? "goal" : null);

    if (type === "goal" && snap.sessionId) {
      fetch("/api/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: snap.sessionId, elapsed: finalElapsed }),
      }).catch(() => {});
    } else if (type === "ec" && snap.targetId) {
      fetch("/api/extra-curriculars/log-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecId: snap.targetId, minutesSpent: minutes }),
      }).catch(() => {});
    } else if (type === "chore" && snap.targetId) {
      fetch("/api/chores/log-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choreId: snap.targetId, minutesSpent: minutes }),
      }).catch(() => {});
    }
  }

  // Legacy goal-only start — backward compat for GoalCard inline buttons
  // UI updates instantly; API call to get sessionId happens in background
  const startTimer = useCallback((goalId: string, pomodoro = false) => {
    const prev = stateRef.current;

    // Stop previous timer immediately (fire-and-forget)
    if (prev.isRunning) {
      fireStopApi(prev);
    }
    clearTimerInterval();

    // Start UI immediately — no waiting for API
    const next: TimerState = {
      goalId,
      sessionId: null, // will be filled in background
      isRunning: true,
      startTime: Date.now(),
      elapsed: 0,
      pomodoroMode: pomodoro,
      pomodoroPhase: "work",
      pomodoroCount: prev.pomodoroCount,
      targetType: "goal",
      targetId: goalId,
      targetName: null,
      targetEmoji: null,
      targetDuration: null,
    };
    setState(next);
    stateRef.current = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    startInterval();

    // Fetch sessionId in background, update state when ready
    fetch("/api/timer/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId }),
    })
      .then((r) => r.json())
      .then(({ sessionId }) => {
        setState((s) => {
          if (!s.isRunning || s.goalId !== goalId) return s; // guard: timer may have been stopped
          const updated = { ...s, sessionId };
          stateRef.current = updated;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Universal timer start — works for goals, ECs, and chores
  // UI updates instantly; for goals, sessionId is fetched in background
  const startUniversalTimer = useCallback((params: StartUniversalTimerParams) => {
    const prev = stateRef.current;

    // Stop previous timer immediately (fire-and-forget)
    if (prev.isRunning) {
      fireStopApi(prev);
    }
    clearTimerInterval();

    // Start UI immediately
    const next: TimerState = {
      goalId: params.type === "goal" ? params.id : null,
      sessionId: null,
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
    stateRef.current = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    startInterval();

    // For goals, fetch sessionId in background
    if (params.type === "goal") {
      fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: params.id }),
      })
        .then((r) => r.json())
        .then(({ sessionId }) => {
          setState((s) => {
            if (!s.isRunning || s.targetId !== params.id) return s;
            const updated = { ...s, sessionId };
            stateRef.current = updated;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop timer — clears UI instantly, fires API in background (saves time)
  const stopTimer = useCallback(() => {
    const snap = stateRef.current;
    if (!snap.isRunning) return;

    // Clear UI immediately — no lag
    clearTimerInterval();
    setState(defaultState);
    stateRef.current = defaultState;
    localStorage.removeItem(STORAGE_KEY);

    // Fire API in background
    fireStopApi(snap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cancel timer — clears UI instantly, discards session without saving any time
  const cancelTimer = useCallback(() => {
    const snap = stateRef.current;
    if (!snap.isRunning) return;

    // Clear UI immediately
    clearTimerInterval();
    setState(defaultState);
    stateRef.current = defaultState;
    localStorage.removeItem(STORAGE_KEY);

    // For goal timers: delete the TimerSession from the DB (no time logged)
    // For EC/chore timers: nothing to clean up server-side
    const type = snap.targetType ?? (snap.goalId ? "goal" : null);
    if (type === "goal" && snap.sessionId) {
      fetch("/api/timer/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: snap.sessionId }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePomodoro = useCallback(() => {
    setState((s) => {
      const next = { ...s, pomodoroMode: !s.pomodoroMode };
      if (s.isRunning) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
        cancelTimer,
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
