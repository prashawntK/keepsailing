"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface ExtraCurricularFormData {
  name: string;
  emoji: string;
  targetMinutes: number | null;
}

interface ExtraCurricularFormProps {
  initial?: Partial<ExtraCurricularFormData>;
  onSubmit: (data: ExtraCurricularFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export function ExtraCurricularForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: ExtraCurricularFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "✨");
  const [minutes, setMinutes] = useState<string>(
    initial?.targetMinutes != null ? String(initial.targetMinutes) : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const parsed = parseInt(minutes, 10);
      await onSubmit({
        name: name.trim(),
        emoji: emoji || "✨",
        targetMinutes: !isNaN(parsed) && parsed > 0 ? parsed : null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Emoji + Name */}
      <div className="flex gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Emoji</label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 text-center bg-surface-1 border border-white/10 rounded-lg px-2 py-2 text-lg focus:outline-none focus:border-primary"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-1 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-primary"
            placeholder="e.g. Meditation, Guitar, Reading..."
            autoFocus
          />
        </div>
      </div>

      {/* Recommended time */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">
          Recommended time <span className="text-gray-600">(optional)</span>
        </label>
        <div className="flex gap-2 flex-wrap mb-2">
          {TIME_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMinutes(String(p))}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                minutes === String(p)
                  ? "bg-primary/20 border-primary text-primary"
                  : "border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20"
              }`}
            >
              {p}m
            </button>
          ))}
          {minutes && !TIME_PRESETS.map(String).includes(minutes) && (
            <button
              type="button"
              onClick={() => setMinutes("")}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-white/10 text-gray-400 hover:text-gray-200"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={300}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-16 bg-surface-1 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-100 text-center focus:outline-none focus:border-primary"
            placeholder="—"
          />
          <span className="text-xs text-gray-500">minutes</span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
