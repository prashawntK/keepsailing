"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GoalList } from "@/components/goals/GoalList";
import { GoalForm, type GoalFormData } from "@/components/goals/GoalForm";
import { ExtraCurricularList } from "@/components/goals/ExtraCurricularList";
import { ExtraCurricularForm, type ExtraCurricularFormData } from "@/components/goals/ExtraCurricularForm";
import { ChoreList } from "@/components/goals/ChoreList";
import { ChoreForm, type ChoreFormData } from "@/components/goals/ChoreForm";
import type { Goal, ExtraCurricular, Chore } from "@/types";
import { useToast } from "@/lib/toast";

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
  const [loading, setLoading] = useState(true);
  const { success: toastSuccess, error: toastError } = useToast();

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?archived=${showArchived}`);
      const data = await res.json();
      setGoals(data);
    } catch {
      // silently ignore — loading spinner will clear
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
      // silently ignore — loading spinner will clear
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
      // silently ignore — loading spinner will clear
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    if (parentTab === "goals") fetchGoals();
    else if (parentTab === "extras") fetchExtras();
    else fetchChores();
  }, [parentTab, fetchGoals, fetchExtras, fetchChores]);

  // Reset archive filter when switching tabs
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
    parentTab === "goals"
      ? "Goals"
      : parentTab === "extras"
      ? "Extra-Curriculars"
      : "Chores";

  const pageDesc =
    parentTab === "goals"
      ? "Manage your daily targets"
      : parentTab === "extras"
      ? "Track your side activities"
      : "Things to get done before their deadline";

  const addLabel =
    parentTab === "goals"
      ? "Add Goal"
      : parentTab === "extras"
      ? "Add Activity"
      : "Add Chore";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{pageTitle}</h1>
          <p className="text-sm text-gray-400">{pageDesc}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> {addLabel}
        </Button>
      </div>

      {/* Parent tabs */}
      <div className="flex gap-1 glass-card p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setParentTab(key)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              parentTab === key
                ? "btn-premium"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active / Archived sub-filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            !showArchived
              ? "bg-primary text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            showArchived
              ? "bg-primary text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Archived
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="card h-20 bg-surface-2" />)}
        </div>
      ) : (
        <>
          {parentTab === "goals" && (
            <GoalList goals={goals} onRefresh={fetchGoals} />
          )}
          {parentTab === "extras" && (
            <ExtraCurricularList items={ecItems} onRefresh={fetchExtras} />
          )}
          {parentTab === "chores" && (
            <ChoreList items={choreItems} onRefresh={fetchChores} />
          )}
        </>
      )}

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
