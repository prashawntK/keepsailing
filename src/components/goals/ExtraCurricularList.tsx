"use client";

import { useState } from "react";
import { Pencil, Archive, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ExtraCurricularForm, type ExtraCurricularFormData } from "./ExtraCurricularForm";
import type { ExtraCurricular } from "@/types";

type ECWithTime = ExtraCurricular & { targetMinutes?: number | null };

interface ExtraCurricularListProps {
  items: ECWithTime[];
  onRefresh: () => void;
}

function timeLabel(minutes: number | null | undefined): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function ExtraCurricularList({ items, onRefresh }: ExtraCurricularListProps) {
  const [editingItem, setEditingItem] = useState<ECWithTime | null>(null);

  async function handleEdit(data: ExtraCurricularFormData) {
    if (!editingItem) return;
    await fetch(`/api/extra-curriculars/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingItem(null);
    onRefresh();
  }

  async function handleArchive(item: ECWithTime) {
    await fetch(`/api/extra-curriculars/${item.id}`, { method: "DELETE" });
    onRefresh();
  }

  async function handleRestore(item: ECWithTime) {
    await fetch(`/api/extra-curriculars/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false, archivedAt: null }),
    });
    onRefresh();
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-3xl mb-2">✨</p>
        <p>No extra-curriculars yet — add your first one!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((item) => {
          const time = timeLabel(item.targetMinutes);
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 glass-card px-4 py-3",
                item.isArchived && "opacity-50"
              )}
            >
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-100 truncate">{item.name}</p>
                {time && (
                  <p className="text-xs text-gray-500 mt-0.5">{time}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!item.isArchived ? (
                  <>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-surface-2"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleArchive(item)}
                      className="p-2 rounded-lg text-gray-500 hover:text-streak hover:bg-surface-2"
                    >
                      <Archive size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRestore(item)}
                    className="p-2 rounded-lg text-gray-500 hover:text-success hover:bg-surface-2"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Extra-Curricular"
      >
        {editingItem && (
          <ExtraCurricularForm
            initial={{
              name: editingItem.name,
              emoji: editingItem.emoji,
              targetMinutes: editingItem.targetMinutes ?? null,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditingItem(null)}
            submitLabel="Update"
          />
        )}
      </Modal>
    </>
  );
}
