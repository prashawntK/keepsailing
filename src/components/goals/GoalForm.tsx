"use client";

import { useState } from "react";
import { Plus, X, Check, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Learning", "Career", "Health", "Personal", "Creative"] as const;
const PRIORITIES = [
  { value: "must", label: "Must Do", color: "border-error text-error" },
  { value: "should", label: "Should Do", color: "border-streak text-streak" },
  { value: "want", label: "Want To Do", color: "border-success text-success" },
] as const;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface GoalFormProps {
  initial?: Partial<GoalFormData>;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export interface GoalFormData {
  name: string;
  emoji: string;
  category: string;
  goalType: "timer" | "checkbox";
  dailyTarget: number;
  priority: "must" | "should" | "want";
  activeDays: number[];
  description: string;
  motivation: string;
  steps: { id?: string; name: string; completedAt?: string | null }[];
}

export function GoalForm({ initial, onSubmit, onCancel, submitLabel = "Save Goal" }: GoalFormProps) {
  const [form, setForm] = useState<GoalFormData>({
    name: initial?.name ?? "",
    emoji: initial?.emoji ?? "🎯",
    category: initial?.category ?? "Learning",
    goalType: initial?.goalType ?? "timer",
    dailyTarget: initial?.dailyTarget ?? 1,
    priority: initial?.priority ?? "should",
    activeDays: initial?.activeDays ?? [0, 1, 2, 3, 4, 5, 6],
    description: initial?.description ?? "",
    motivation: initial?.motivation ?? "",
    steps: initial?.steps ?? [],
  });
  const [loading, setLoading] = useState(false);

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, { name: "" }] }));
  }
  function removeStep(index: number) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== index) }));
  }
  function updateStep(index: number, name: string) {
    setForm((f) => ({ ...f, steps: f.steps.map((s, i) => (i === index ? { ...s, name } : s)) }));
  }
  function moveStep(index: number, direction: "up" | "down") {
    setForm((f) => {
      const steps = [...f.steps];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= steps.length) return f;
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { ...f, steps };
    });
  }

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      activeDays: f.activeDays.includes(d)
        ? f.activeDays.filter((x) => x !== d)
        : [...f.activeDays, d].sort(),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  const field = "bg-surface-2 border border-surface-3 rounded-xl px-3 py-2 text-sm text-primary w-full focus:outline-none focus:border-primary focus:bg-surface-2 transition-colors shadow-inner";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name + emoji */}
      <div className="flex gap-2">
        <input
          value={form.emoji}
          onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
          className={cn(field, "w-14 text-center text-xl")}
          maxLength={2}
        />
        <input
          required
          placeholder="Goal name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={cn(field, "flex-1")}
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((f) => ({ ...f, category: c }))}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                form.category === c
                  ? "border-primary bg-primary/15 text-primary-light"
                  : "border-surface-3 text-secondary hover:border-primary/40"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Goal type */}
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Type</label>
        <div className="flex gap-2">
          {(["timer", "checkbox"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, goalType: t }))}
              className={cn(
                "flex-1 py-2 rounded-xl border text-sm font-medium transition-all",
                form.goalType === t
                  ? "border-primary bg-primary/15 text-primary-light"
                  : "border-surface-3 text-secondary hover:border-primary/40"
              )}
            >
              {t === "timer" ? "⏱ Timer" : "✅ Checkbox"}
            </button>
          ))}
        </div>
      </div>

      {/* Daily target (timer only) */}
      {form.goalType === "timer" && (
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">
            Daily target (hours)
          </label>
          <input
            type="number"
            min={0.25}
            max={12}
            step={0.25}
            value={form.dailyTarget}
            onChange={(e) => setForm((f) => ({ ...f, dailyTarget: parseFloat(e.target.value) || 0 }))}
            className={field}
          />
        </div>
      )}

      {/* Priority */}
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Priority</label>
        <div className="flex gap-2">
          {PRIORITIES.map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, priority: value }))}
              className={cn(
                "flex-1 py-2 rounded-xl border text-xs font-medium transition-all",
                form.priority === value
                  ? color + " bg-surface-2"
                  : "border-surface-3 text-secondary hover:border-primary/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Active days */}
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Active days</label>
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(i)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                form.activeDays.includes(i)
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-gray-500 hover:bg-surface-3"
              )}
            >
              {d[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className={cn(field, "resize-none h-20")}
      />

      {/* Motivation */}
      <textarea
        placeholder="Why does this matter to you? (optional)"
        value={form.motivation}
        onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
        className={cn(field, "resize-none h-16")}
      />

      {/* Steps */}
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">
          Steps <span className="text-gray-600">(optional — break into sequential sub-tasks)</span>
        </label>
        <div className="space-y-2">
          {form.steps.map((step, i) => {
            const done = !!step.completedAt;
            return (
              <div key={i} className="flex gap-2 items-center">
                {/* Up / Down reorder */}
                <div className="flex flex-col flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveStep(i, "up")}
                    disabled={i === 0}
                    className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(i, "down")}
                    disabled={i === form.steps.length - 1}
                    className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>

                {done ? (
                  <div className="w-5 h-5 rounded-full bg-success/20 border border-success/50 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-success" />
                  </div>
                ) : (
                  <span className="text-xs text-gray-600 w-5 flex-shrink-0 text-center">{i + 1}.</span>
                )}
                <input
                  value={step.name}
                  onChange={(e) => updateStep(i, e.target.value)}
                  placeholder={`Step ${i + 1}`}
                  className={cn(
                    field,
                    "flex-1",
                    done && "line-through text-gray-500 opacity-60"
                  )}
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="p-1 text-gray-500 hover:text-error transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 text-xs text-primary hover:text-primary-light flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add step
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
