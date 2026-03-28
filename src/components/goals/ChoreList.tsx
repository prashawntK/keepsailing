"use client";

import { useState } from "react";
import { Pencil, Archive, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ChoreForm, type ChoreFormData } from "./ChoreForm";
import type { Chore } from "@/types";
import { useToast } from "@/lib/toast";

type ChoreWithMeta = Chore & { totalMinutesSpent?: number };

interface ChoreListProps {
  items: ChoreWithMeta[];
  onRefresh: () => void;
}

function getDaysFromToday(deadline: Date | string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function deadlineLabel(days: number): string {
  if (days < -1) return `overdue ${Math.abs(days)} days ago`;
  if (days === -1) return "overdue 1 day ago";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return `in ${days}d`;
  if (days <= 30) return `in ${Math.ceil(days / 7)}w`;
  return `in ${Math.ceil(days / 30)}mo`;
}

function formatDate(deadline: Date | string): string {
  const d = new Date(deadline);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m}m` : `${h}h`;
}

type Urgency = "overdue" | "urgent" | "soon" | "comfortable";

function getUrgency(days: number): Urgency {
  if (days < 0) return "overdue";
  if (days <= 1) return "urgent";
  if (days <= 5) return "soon";
  return "comfortable";
}

const URGENCY_STYLES: Record<Urgency, { dot: string; label: string; card: string }> = {
  overdue: {
    dot: "bg-red-400 shadow-sm shadow-red-400/60",
    label: "text-red-400",
    card: "border-red-500/55 bg-red-500/15",
  },
  urgent: {
    dot: "bg-amber-400 shadow-sm shadow-amber-400/60",
    label: "text-amber-400",
    card: "border-amber-500/55 bg-amber-500/15",
  },
  soon: {
    dot: "bg-yellow-400 shadow-sm shadow-yellow-400/60",
    label: "text-yellow-400",
    card: "border-yellow-500/50 bg-yellow-500/12",
  },
  comfortable: {
    dot: "bg-emerald-400 shadow-sm shadow-emerald-400/60",
    label: "text-emerald-400",
    card: "border-emerald-500/45 bg-emerald-500/12",
  },
};

export function ChoreList({ items, onRefresh }: ChoreListProps) {
  const [editingItem, setEditingItem] = useState<ChoreWithMeta | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  async function handleEdit(data: ChoreFormData) {
    if (!editingItem) return;
    try {
      await fetch(`/api/chores/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setEditingItem(null);
      onRefresh();
      toastSuccess("Chore updated", data.name);
    } catch {
      toastError("Failed to update chore");
    }
  }

  async function handleArchive(item: ChoreWithMeta) {
    try {
      await fetch(`/api/chores/${item.id}`, { method: "DELETE" });
      onRefresh();
      toastSuccess("Chore archived", item.name);
    } catch {
      toastError("Failed to archive chore");
    }
  }

  async function handleRestore(item: ChoreWithMeta) {
    try {
      await fetch(`/api/chores/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false, archivedAt: null }),
      });
      onRefresh();
      toastSuccess("Chore restored", item.name);
    } catch {
      toastError("Failed to restore chore");
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-3xl mb-2">🧹</p>
        <p>No chores yet — add your first one!</p>
      </div>
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );
  const overdue = sorted.filter((c) => getDaysFromToday(c.deadline) < 0);
  const upcoming = sorted.filter((c) => getDaysFromToday(c.deadline) >= 0);

  function ChoreCard({ item }: { item: ChoreWithMeta }) {
    const days = getDaysFromToday(item.deadline);
    const urgency = getUrgency(days);
    const styles = URGENCY_STYLES[urgency];

    return (
      <div className="flex items-center gap-0 group">
        {/* Rail: dot + date label */}
        <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 56 }}>
          <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", styles.dot)} />
          <span className={cn("text-[9px] font-semibold mt-0.5 tabular-nums", styles.label)}>
            {formatDate(item.deadline)}
          </span>
        </div>

        {/* Card */}
        <div
          className={cn(
            "flex-1 rounded-xl border px-3 py-2.5 flex items-center gap-3 ml-1",
            "transition-all duration-200 hover:-translate-y-0.5",
            styles.card,
            item.isArchived && "opacity-40"
          )}
        >
          <span className="text-xl flex-shrink-0">{item.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">{item.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("text-[11px] font-semibold", styles.label)}>
                {deadlineLabel(days)}
              </span>
              <span className="text-gray-600 text-[10px]">·</span>
              <span className="text-[11px] text-gray-500">~{timeLabel(item.estimatedMinutes)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            {!item.isArchived ? (
              <>
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-all"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleArchive(item)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/10 transition-all"
                >
                  <Archive size={12} />
                </button>
              </>
            ) : (
              <button
                onClick={() => handleRestore(item)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-white/10 transition-all"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative pt-1">
        {/* Vertical rail line — center of 56px column = 28px */}
        <div className="absolute top-0 bottom-0 w-px bg-white/8" style={{ left: 28 }} />

        <div className="space-y-1.5">
          {/* Overdue section */}
          {overdue.length > 0 && (
            <>
              <div className="pb-1" style={{ paddingLeft: 60 }}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/70">
                  Past Due
                </span>
              </div>
              {overdue.map((item) => (
                <ChoreCard key={item.id} item={item} />
              ))}
            </>
          )}

          {/* TODAY marker */}
          <div className="flex items-center gap-0 py-2">
            <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 56 }}>
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-40" />
                <div className="w-3 h-3 rounded-full bg-primary relative z-10" />
              </div>
              <span className="text-[9px] font-bold text-primary/80 mt-0.5 uppercase tracking-wide">now</span>
            </div>
            <div className="flex-1 ml-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Today</span>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
          </div>

          {/* Upcoming section */}
          {upcoming.length > 0 ? (
            upcoming.map((item) => (
              <ChoreCard key={item.id} item={item} />
            ))
          ) : (
            <div className="py-3 text-sm text-gray-600 italic" style={{ paddingLeft: 60 }}>
              All caught up! ✨
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Chore"
      >
        {editingItem && (
          <ChoreForm
            initial={{
              name: editingItem.name,
              emoji: editingItem.emoji,
              deadline: new Date(editingItem.deadline).toISOString(),
              estimatedMinutes: editingItem.estimatedMinutes,
              description: editingItem.description ?? "",
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
