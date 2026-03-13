"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GoalList } from "@/components/goals/GoalList";
import { GoalForm, type GoalFormData } from "@/components/goals/GoalForm";
import { ExtraCurricularList } from "@/components/goals/ExtraCurricularList";
import { ExtraCurricularForm, type ExtraCurricularFormData } from "@/components/goals/ExtraCurricularForm";
import type { Goal, ExtraCurricular } from "@/types";

type ParentTab = "goals" | "extras";

export default function GoalsPage() {
  const [parentTab, setParentTab] = useState<ParentTab>("goals");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ecItems, setEcItems] = useState<ExtraCurricular[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchGoals = useCallback(async () => {
    const res = await fetch(`/api/goals?archived=${showArchived}`);
    const data = await res.json();
    setGoals(data);
  }, [showArchived]);

  const fetchExtras = useCallback(async () => {
    const res = await fetch(`/api/extra-curriculars?archived=${showArchived}`);
    const data = await res.json();
    setEcItems(data);
  }, [showArchived]);

  useEffect(() => {
    if (parentTab === "goals") fetchGoals();
    else fetchExtras();
  }, [parentTab, fetchGoals, fetchExtras]);

  // Reset archive filter when switching tabs
  useEffect(() => { setShowArchived(false); }, [parentTab]);

  async function handleAddGoal(data: GoalFormData) {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddModal(false);
    fetchGoals();
  }

  async function handleAddEC(data: ExtraCurricularFormData) {
    await fetch("/api/extra-curriculars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddModal(false);
    fetchExtras();
  }

  const isGoals = parentTab === "goals";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            {isGoals ? "Goals" : "Extra-Curriculars"}
          </h1>
          <p className="text-sm text-gray-400">
            {isGoals ? "Manage your daily targets" : "Track your side activities"}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> {isGoals ? "Add Goal" : "Add Activity"}
        </Button>
      </div>

      {/* Parent tabs */}
      <div className="flex gap-1 glass-card p-1">
        {([
          { key: "goals" as const, label: "Goals" },
          { key: "extras" as const, label: "Extra-Curriculars" },
        ]).map(({ key, label }) => (
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
      {isGoals ? (
        <GoalList goals={goals} onRefresh={fetchGoals} />
      ) : (
        <ExtraCurricularList items={ecItems} onRefresh={fetchExtras} />
      )}

      {/* Add modals */}
      <Modal
        open={showAddModal && isGoals}
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
        open={showAddModal && !isGoals}
        onClose={() => setShowAddModal(false)}
        title="New Extra-Curricular"
      >
        <ExtraCurricularForm
          onSubmit={handleAddEC}
          onCancel={() => setShowAddModal(false)}
          submitLabel="Create"
        />
      </Modal>
    </div>
  );
}
