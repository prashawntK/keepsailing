"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ChoreList } from "@/components/goals/ChoreList";
import { ChoreForm, type ChoreFormData } from "@/components/goals/ChoreForm";
import type { Chore } from "@/types";
import { useToast } from "@/lib/toast";

export default function ChoresPage() {
  const [choreItems, setChoreItems] = useState<(Chore & { totalMinutesSpent?: number })[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { success: toastSuccess, error: toastError } = useToast();

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
    fetchChores();
  }, [fetchChores]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Chores</h1>
          <p className="text-sm text-gray-400">Things to get done before their deadline</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Chore
        </Button>
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
        <ChoreList items={choreItems} onRefresh={fetchChores} />
      )}

      {/* Add modal */}
      <Modal
        open={showAddModal}
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
