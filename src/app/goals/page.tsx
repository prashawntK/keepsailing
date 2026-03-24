"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, List, CalendarDays } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { GoalList } from "@/components/goals/GoalList";
import { GoalScheduleMatrix } from "@/components/goals/GoalScheduleMatrix";
import { GoalForm, type GoalFormData } from "@/components/goals/GoalForm";
import { ExtraCurricularList } from "@/components/goals/ExtraCurricularList";
import { ExtraCurricularForm, type ExtraCurricularFormData } from "@/components/goals/ExtraCurricularForm";
import { ChoreList } from "@/components/goals/ChoreList";
import { ChoreForm, type ChoreFormData } from "@/components/goals/ChoreForm";
import type { Goal, ExtraCurricular, Chore } from "@/types";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ParentTab = "goals" | "extras" | "chores";

const TABS: { key: ParentTab; label: string }[] = [
  { key: "goals", label: "Goals" },
  { key: "extras", label: "Extra-Curriculars" },
  { key: "chores", label: "Chores" },
];

export default function GoalsPage() {
  const [parentTab, setParentTab] = useState<ParentTab>("goals");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ecItems, setEcItems] = useState<ExtraCurricular[]>([]);
  const [choreItems, setChoreItems] = useState<(Chore & { totalMinutesSpent?: number })[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "schedule">("list");
  const [loading, setLoading] = useState(true);
  const directionRef = useRef(0);
  const prevTabRef = useRef<ParentTab>("goals");
  const { success: toastSuccess, error: toastError } = useToast();

  const switchTab = (tab: ParentTab) => {
    const oldIdx = TABS.findIndex(t => t.key === prevTabRef.current);
    const newIdx = TABS.findIndex(t => t.key === tab);
    directionRef.current = newIdx > oldIdx ? 1 : -1;
    prevTabRef.current = tab;
    setParentTab(tab);
  };

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?archived=${showArchived}`);
      const data = await res.json();
      setGoals(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  const fetchExtras = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/extra-curriculars?archived=${showArchived}`);
      const data = await res.json();
      setEcItems(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  const fetchChores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chores?archived=${showArchived}`);
      const data = await res.json();
      setChoreItems(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    if (parentTab === "goals") fetchGoals();
    else if (parentTab === "extras") fetchExtras();
    else fetchChores();
  }, [parentTab, fetchGoals, fetchExtras, fetchChores]);

  useEffect(() => { setShowArchived(false); }, [parentTab]);

  async function handleAddGoal(data: GoalFormData) {
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setShowAddModal(false);
      fetchGoals();
      toastSuccess("Goal created", data.name);
    } catch {
      toastError("Failed to create goal");
    }
  }

  async function handleAddEC(data: ExtraCurricularFormData) {
    try {
      await fetch("/api/extra-curriculars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setShowAddModal(false);
      fetchExtras();
      toastSuccess("Activity created", data.name);
    } catch {
      toastError("Failed to create activity");
    }
  }

  async function handleAddChore(data: ChoreFormData) {
    try {
      await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setShowAddModal(false);
      fetchChores();
      toastSuccess("Chore created", data.name);
    } catch {
      toastError("Failed to create chore");
    }
  }

  const pageTitle =
    parentTab === "goals" ? "Goals"
    : parentTab === "extras" ? "Extra-Curriculars"
    : "Chores";

  const pageDesc =
    parentTab === "goals" ? "Manage your daily targets"
    : parentTab === "extras" ? "Track your side activities"
    : "Things to get done before their deadline";

  const addLabel =
    parentTab === "goals" ? "Add Goal"
    : parentTab === "extras" ? "Add Activity"
    : "Add Chore";

  return (
    <div className="space-y-4 pb-24">
      {/* Header — title only */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{pageTitle}</h1>
        <p className="text-sm text-gray-400">{pageDesc}</p>
      </div>

      {/* Floating island pill tabs */}
      <div className="flex justify-center">
        <div
          className="relative glass-card p-1 rounded-full inline-flex shadow-lg shadow-black/20"
          style={{ backdropFilter: "blur(20px)" }}
        >
          {/* Sliding thumb */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-primary/80 shadow-md shadow-primary/30 transition-all duration-300 ease-out"
            style={{
              width: `calc((100% - 8px) / 3)`,
              left: `calc(4px + ${TABS.findIndex(t => t.key === parentTab)} * ((100% - 8px) / 3))`,
            }}
          />
          <div className="relative grid grid-cols-3">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={cn(
                  "px-5 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 relative z-10 whitespace-nowrap text-center",
                  parentTab === key ? "text-white" : "text-gray-400 hover:text-gray-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active/Archived underline toggle + view toggle — same row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-5">
          <button
            onClick={() => setShowArchived(false)}
            className={cn(
              "text-sm font-medium pb-0.5 transition-all border-b-2",
              !showArchived
                ? "text-white border-primary"
                : "text-gray-500 hover:text-gray-300 border-transparent"
            )}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={cn(
              "text-sm font-medium pb-0.5 transition-all border-b-2",
              showArchived
                ? "text-white border-primary"
                : "text-gray-500 hover:text-gray-300 border-transparent"
            )}
          >
            Archived
          </button>
        </div>

        {parentTab === "goals" && !showArchived && (
          <div className="flex gap-0.5 glass-card p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "list" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-gray-300"
              )}
              title="List view"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode("schedule")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "schedule" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-gray-300"
              )}
              title="Schedule view"
            >
              <CalendarDays size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={directionRef.current}>
          <motion.div
            key={parentTab}
            custom={directionRef.current}
            variants={{
              enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => <div key={i} className="card h-20 bg-surface-2" />)}
              </div>
            ) : (
              <>
                {parentTab === "goals" && (
                  viewMode === "schedule" && !showArchived
                    ? <GoalScheduleMatrix goals={goals} onRefresh={fetchGoals} />
                    : <GoalList goals={goals} onRefresh={fetchGoals} />
                )}
                {parentTab === "extras" && (
                  <ExtraCurricularList items={ecItems} onRefresh={fetchExtras} />
                )}
                {parentTab === "chores" && (
                  <ChoreList items={choreItems} onRefresh={fetchChores} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[100px] left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-4xl mx-auto px-4 flex justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="pointer-events-auto w-14 h-14 rounded-full btn-premium shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label={addLabel}
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Add modals */}
      <Modal
        open={showAddModal && parentTab === "goals"}
        onClose={() => setShowAddModal(false)}
        title="New Goal"
      >
        <GoalForm
          onSubmit={handleAddGoal}
          onCancel={() => setShowAddModal(false)}
          submitLabel="Create Goal"
        />
      </Modal>

      <Modal
        open={showAddModal && parentTab === "extras"}
        onClose={() => setShowAddModal(false)}
        title="New Extra-Curricular"
      >
        <ExtraCurricularForm
          onSubmit={handleAddEC}
          onCancel={() => setShowAddModal(false)}
          submitLabel="Create"
        />
      </Modal>

      <Modal
        open={showAddModal && parentTab === "chores"}
        onClose={() => setShowAddModal(false)}
        title="New Chore"
      >
        <ChoreForm
          onSubmit={handleAddChore}
          onCancel={() => setShowAddModal(false)}
          submitLabel="Create Chore"
        />
      </Modal>
    </div>
  );
}
