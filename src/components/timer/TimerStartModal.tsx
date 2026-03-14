"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useTimer } from "@/components/providers/TimerProvider";
import { cn } from "@/lib/utils";
import type {
  GoalWithProgress,
  ExtraCurricularWithStatus,
  ChoreWithStatus,
} from "@/types";

type TabKey = "goals" | "ec" | "chores";

interface SelectedItem {
  type: "goal" | "ec" | "chore";
  id: string;
  name: string;
  emoji: string;
  suggestedMinutes: number | null;
}

const DURATION_PRESETS = [5, 10, 15, 20, 25, 30, 45, 60];

interface TimerStartModalProps {
  open: boolean;
  onClose: () => void;
  goals: GoalWithProgress[];
  extraCurriculars: ExtraCurricularWithStatus[];
  chores: ChoreWithStatus[];
  onRefresh: () => void;
}

export function TimerStartModal({
  open,
  onClose,
  goals,
  extraCurriculars,
  chores,
  onRefresh,
}: TimerStartModalProps) {
  const { startUniversalTimer } = useTimer();
  const [activeTab, setActiveTab] = useState<TabKey>("goals");
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(25);
  const [starting, setStarting] = useState(false);

  // Filterable items
  const timerGoals = goals.filter(
    (g) => g.isActiveToday && g.completionPercentage < 100
  );
  const activeECs = extraCurriculars.filter((ec) => !ec.completedToday);
  const activeChores = chores.filter((c) => !c.completedToday);

  function handleSelectItem(item: SelectedItem) {
    setSelected(item);
    // Auto-suggest duration from the item's own settings
    if (item.suggestedMinutes != null && item.suggestedMinutes > 0) {
      setDurationMinutes(item.suggestedMinutes);
    }
  }

  async function handleStart() {
    if (!selected) return;
    setStarting(true);
    try {
      await startUniversalTimer({
        type: selected.type,
        id: selected.id,
        name: selected.name,
        emoji: selected.emoji,
        durationMinutes,
      });
      onClose();
      onRefresh();
      // Reset state for next open
      setSelected(null);
      setDurationMinutes(25);
      setActiveTab("goals");
    } finally {
      setStarting(false);
    }
  }

  function handleClose() {
    onClose();
    setSelected(null);
    setDurationMinutes(25);
    setActiveTab("goals");
  }

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "goals", label: "Goals", count: timerGoals.length },
    { key: "ec", label: "Activities", count: activeECs.length },
    { key: "chores", label: "Chores", count: activeChores.length },
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Start Timer">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-1 rounded-xl p-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              activeTab === tab.key
                ? "bg-primary/20 text-primary"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-[10px] opacity-60">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="max-h-48 overflow-y-auto space-y-1 mb-4 scrollbar-thin">
        {activeTab === "goals" &&
          (timerGoals.length > 0 ? (
            timerGoals.map((g) => (
              <ItemRow
                key={g.id}
                emoji={g.emoji}
                name={g.name}
                subtitle={
                  g.goalType === "timer" && g.dailyTarget > 0
                    ? `${Math.round(g.dailyTarget * 60)}m target`
                    : g.goalType === "checkbox"
                    ? "Checkbox"
                    : null
                }
                isSelected={selected?.id === g.id}
                onClick={() =>
                  handleSelectItem({
                    type: "goal",
                    id: g.id,
                    name: g.name,
                    emoji: g.emoji,
                    suggestedMinutes:
                      g.goalType === "timer" && g.dailyTarget > 0
                        ? Math.round(g.dailyTarget * 60)
                        : null,
                  })
                }
              />
            ))
          ) : (
            <EmptyState text="No incomplete goals for today" />
          ))}

        {activeTab === "ec" &&
          (activeECs.length > 0 ? (
            activeECs.map((ec) => (
              <ItemRow
                key={ec.id}
                emoji={ec.emoji}
                name={ec.name}
                subtitle={
                  ec.targetMinutes
                    ? `~${ec.targetMinutes}m recommended`
                    : null
                }
                isSelected={selected?.id === ec.id}
                onClick={() =>
                  handleSelectItem({
                    type: "ec",
                    id: ec.id,
                    name: ec.name,
                    emoji: ec.emoji,
                    suggestedMinutes: ec.targetMinutes ?? null,
                  })
                }
              />
            ))
          ) : (
            <EmptyState text="All activities completed today" />
          ))}

        {activeTab === "chores" &&
          (activeChores.length > 0 ? (
            activeChores.map((c) => (
              <ItemRow
                key={c.id}
                emoji={c.emoji}
                name={c.name}
                subtitle={`~${c.estimatedMinutes}m · ${c.deadlineLabel}`}
                isSelected={selected?.id === c.id}
                onClick={() =>
                  handleSelectItem({
                    type: "chore",
                    id: c.id,
                    name: c.name,
                    emoji: c.emoji,
                    suggestedMinutes: c.estimatedMinutes,
                  })
                }
              />
            ))
          ) : (
            <EmptyState text="All chores completed today" />
          ))}
      </div>

      {/* Duration picker */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2 font-medium">Duration</p>
        <div className="flex gap-1.5 flex-wrap">
          {DURATION_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDurationMinutes(m)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                durationMinutes === m
                  ? "bg-primary/20 border-primary text-primary"
                  : "border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20"
              )}
            >
              {m}m
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDurationMinutes(null)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
              durationMinutes === null
                ? "bg-primary/20 border-primary text-primary"
                : "border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20"
            )}
          >
            Open
          </button>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!selected || starting}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
          selected
            ? "btn-premium text-white"
            : "bg-surface-2 text-gray-500 cursor-not-allowed"
        )}
      >
        <Play size={16} fill="currentColor" />
        {starting
          ? "Starting..."
          : selected
          ? `Start ${selected.emoji} ${selected.name}`
          : "Select an item to start"}
      </button>
    </Modal>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function ItemRow({
  emoji,
  name,
  subtitle,
  isSelected,
  onClick,
}: {
  emoji: string;
  name: string;
  subtitle: string | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
        isSelected
          ? "bg-primary/15 ring-1 ring-primary/40"
          : "hover:bg-surface-2"
      )}
    >
      <span className="text-lg flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isSelected ? "text-primary" : "text-gray-200"
          )}
        >
          {name}
        </p>
        {subtitle && (
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-6 text-gray-600 text-sm">{text}</div>
  );
}
