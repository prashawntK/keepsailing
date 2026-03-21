"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, X, Check, ChevronUp, ChevronDown, Minus,
  Sparkles, Calendar, Target, AlignLeft, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, CATEGORY_HEX } from "@/lib/utils";

// ── Emoji picker data ─────────────────────────────────────────────────────
const EMOJI_GROUPS = [
  { icon: "🎯", label: "Goals",    emojis: ["🎯","🏆","⭐","🚀","💡","⚡","🔥","💎","🌟","✅","💪","🎖️","🥇","📈","🏅","🎪","🎰","🛡️","⚔️","🗡️"] },
  { icon: "📚", label: "Learning", emojis: ["📚","🎓","📖","🧠","💻","🔬","📝","🌐","🔭","🧪","📐","📊","🗂️","📜","🖊️","🔍","💡","🎒","🏫","📡"] },
  { icon: "💼", label: "Career",   emojis: ["💼","📊","🤝","💰","🏢","📱","🖥️","📋","🎤","📧","🔑","🗝️","📌","🖱️","⌨️","💳","🏦","📞","🖨️","📠"] },
  { icon: "🏃", label: "Health",   emojis: ["🏃","🧘","🍎","💤","🚴","🏋️","🌿","❤️","🥗","💊","🫀","🧬","🏊","⚽","🎾","🧗","🤸","🥦","🫁","🩺"] },
  { icon: "🌱", label: "Personal", emojis: ["🌱","🏠","❤️","🙏","😊","🌸","🌍","🎁","🌈","☀️","🌙","🕊️","🦋","🌺","🫶","🧸","🪴","🏡","🛋️","🧹"] },
  { icon: "🎨", label: "Creative", emojis: ["🎨","🎭","🎬","🎶","✍️","📷","🎮","🖌️","🎸","🎹","🎺","🎻","📸","🎙️","🎞️","🖼️","🎲","🪄","🎠","🎡"] },
] as const;

function EmojiPicker({ onSelect, accentColor, anchorRect }: { onSelect: (e: string) => void; accentColor: string; anchorRect: DOMRect | null }) {
  const [activeGroup, setActiveGroup] = useState(0);
  const [search, setSearch] = useState("");
  if (!anchorRect) return null;

  const allEmojis = EMOJI_GROUPS.flatMap((g) => g.emojis);
  const displayed = search.trim()
    ? allEmojis.filter((e) => e.includes(search))
    : EMOJI_GROUPS[activeGroup].emojis;

  return (
    <div
      className="fixed z-[9999] rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width: 300,
        top: anchorRect.bottom + 8,
        left: anchorRect.left,
        background: "rgba(15, 20, 35, 0.97)",
        border: `1px solid ${accentColor}35`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}20`,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Search */}
      <div className="p-2.5 pb-0">
        <input
          type="text"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm text-gray-200 outline-none placeholder-gray-600"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${accentColor}30`,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}80`; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = `${accentColor}30`; }}
        />
      </div>

      {/* Category icons row */}
      {!search && (
        <div className="flex items-center gap-0.5 px-2.5 pt-2.5">
          {EMOJI_GROUPS.map((g, i) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setActiveGroup(i)}
              title={g.label}
              className="flex-1 h-9 rounded-xl text-lg flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
              style={activeGroup === i ? {
                background: `${accentColor}28`,
                boxShadow: `0 0 10px ${accentColor}30`,
              } : {
                background: "transparent",
                filter: "grayscale(0.4) opacity(0.55)",
              }}
            >
              {g.icon}
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 mt-2.5 mb-0 h-px" style={{ background: `${accentColor}20` }} />

      {/* Emoji grid */}
      <div className="p-2 grid grid-cols-6 gap-0.5 max-h-44 overflow-y-auto">
        {displayed.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="h-10 w-full rounded-xl text-xl flex items-center justify-center transition-all duration-100 hover:scale-125 active:scale-95"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${accentColor}22`;
              e.currentTarget.style.boxShadow = `0 4px 12px ${accentColor}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {emoji}
          </button>
        ))}
        {displayed.length === 0 && (
          <div className="col-span-6 text-center py-4 text-gray-600 text-xs">No results</div>
        )}
      </div>

      {/* Footer label */}
      {!search && (
        <div className="px-3 pb-2 pt-0.5 text-[10px] text-gray-600 font-medium">
          {EMOJI_GROUPS[activeGroup].label}
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  { value: "Learning",  emoji: "📚", color: "#8B5CF6" },
  { value: "Career",   emoji: "💼", color: "#06B6D4" },
  { value: "Health",   emoji: "🏃", color: "#10B981" },
  { value: "Personal", emoji: "🌱", color: "#F97316" },
  { value: "Creative", emoji: "🎨", color: "#EC4899" },
] as const;

const PRIORITIES = [
  { value: "must",   label: "Must Do",    desc: "Non-negotiable", color: "#EF4444" },
  { value: "should", label: "Should Do",  desc: "Important",      color: "#F59E0B" },
  { value: "want",   label: "Want To Do", desc: "Nice to have",   color: "#22C55E" },
] as const;

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  step,
  children,
}: {
  icon: React.ElementType;
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.18] overflow-hidden" style={{ background: "rgba(255,255,255,0.11)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.12]" style={{ background: "rgba(255,255,255,0.10)" }}>
        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 tabular-nums">
          {step}
        </span>
        <Icon size={13} className="text-gray-500 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </span>
      </div>
      {/* Body */}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Plain input inside a section ─────────────────────────────────────────
function SectionInput({
  accentColor,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { accentColor?: string }) {
  return (
    <input
      {...props}
      className={cn(
        "w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-gray-100",
        "outline-none transition-all duration-200 placeholder-gray-600 hover:border-white/14",
        "focus:border-transparent",
        className
      )}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 1.5px ${accentColor ?? "#6366F1"}`;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
    />
  );
}

function SectionTextarea({
  accentColor,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { accentColor?: string }) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-gray-100 resize-none",
        "outline-none transition-all duration-200 placeholder-gray-600 hover:border-white/14",
        "focus:border-transparent",
        className
      )}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 1.5px ${accentColor ?? "#6366F1"}`;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
    />
  );
}

export function GoalForm({ initial, onSubmit, onCancel, submitLabel = "Save Goal" }: GoalFormProps) {
  const [form, setForm] = useState<GoalFormData>({
    name:        initial?.name        ?? "",
    emoji:       initial?.emoji       ?? "🎯",
    category:    initial?.category    ?? "Learning",
    goalType:    initial?.goalType    ?? "timer",
    dailyTarget: initial?.dailyTarget ?? 1,
    priority:    initial?.priority    ?? "should",
    activeDays:  initial?.activeDays  ?? [0, 1, 2, 3, 4, 5, 6],
    description: initial?.description ?? "",
    motivation:  initial?.motivation  ?? "",
    steps:       initial?.steps       ?? [],
  });
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiAnchorRect, setEmojiAnchorRect] = useState<DOMRect | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  const accentColor = CATEGORY_HEX[form.category] ?? "#6366F1";

  // Close picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    function handler(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, { name: "" }] }));
  }
  function removeStep(i: number) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  }
  function updateStep(i: number, name: string) {
    setForm((f) => ({ ...f, steps: f.steps.map((s, idx) => (idx === i ? { ...s, name } : s)) }));
  }
  function moveStep(i: number, dir: "up" | "down") {
    setForm((f) => {
      const steps = [...f.steps];
      const t = dir === "up" ? i - 1 : i + 1;
      if (t < 0 || t >= steps.length) return f;
      [steps[i], steps[t]] = [steps[t], steps[i]];
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
  function stepTarget(delta: number) {
    setForm((f) => ({
      ...f,
      dailyTarget: Math.min(12, Math.max(0.25, Math.round((f.dailyTarget + delta) * 4) / 4)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await onSubmit(form); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* ── IDENTITY ─────────────────────────────────────────── */}
      <Section icon={Sparkles} title="Identity" step={1}>
        <div className="flex gap-2 items-center">
          {/* Emoji button + picker */}
          <div className="relative flex-shrink-0" ref={emojiPickerRef}>
            <button
              ref={emojiBtnRef}
              type="button"
              onClick={() => {
                const rect = emojiBtnRef.current?.getBoundingClientRect() ?? null;
                setEmojiAnchorRect(rect);
                setShowEmojiPicker((v) => !v);
              }}
              className="w-12 h-9 rounded-lg text-xl flex items-center justify-center border transition-all duration-200 hover:scale-105 active:scale-95"
              style={showEmojiPicker ? {
                background: `${accentColor}20`,
                borderColor: `${accentColor}60`,
                boxShadow: `0 0 0 1.5px ${accentColor}`,
              } : {
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.12)",
              }}
              title="Pick emoji"
            >
              {form.emoji}
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                accentColor={accentColor}
                anchorRect={emojiAnchorRect}
                onSelect={(e) => { setForm((f) => ({ ...f, emoji: e })); setShowEmojiPicker(false); }}
              />
            )}
          </div>
          <SectionInput
            required
            accentColor={accentColor}
            placeholder="Goal name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="flex-1"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 mt-3">
          {CATEGORIES.map(({ value, emoji, color }) => {
            const active = form.category === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: value }))}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-medium transition-all duration-200"
                style={active ? {
                  background: `${color}20`,
                  borderColor: `${color}55`,
                  color,
                } : {
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.07)",
                  color: "#4B5563",
                }}
              >
                <span className="text-sm">{emoji}</span>
                {value}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── SCHEDULE ─────────────────────────────────────────── */}
      <Section icon={Calendar} title="Schedule" step={2}>
        {/* Goal type */}
        <div className="flex gap-2 mb-3">
          {(["timer", "checkbox"] as const).map((t) => {
            const active = form.goalType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, goalType: t }))}
                className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all duration-200"
                style={active ? {
                  background: `${accentColor}18`,
                  borderColor: `${accentColor}50`,
                  color: accentColor,
                } : {
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.07)",
                  color: "#4B5563",
                }}
              >
                {t === "timer" ? "⏱ Timer" : "✅ Checkbox"}
              </button>
            );
          })}
        </div>

        {/* Daily target */}
        {form.goalType === "timer" && (
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-3 border"
            style={{ background: `${accentColor}0d`, borderColor: `${accentColor}25` }}
          >
            <span className="text-xs text-gray-500 flex-shrink-0">Daily target</span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => stepTarget(-0.25)}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: `${accentColor}25`, color: accentColor }}
              >
                <Minus size={11} />
              </button>
              <span className="text-base font-bold tabular-nums w-16 text-center" style={{ color: accentColor }}>
                {form.dailyTarget % 1 === 0
                  ? `${form.dailyTarget}h`
                  : `${form.dailyTarget.toFixed(2).replace(/\.?0+$/, "")}h`}
              </span>
              <button
                type="button"
                onClick={() => stepTarget(0.25)}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: `${accentColor}25`, color: accentColor }}
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Active days */}
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5">Active days</p>
          <div className="flex gap-1">
            {DAYS.map((d, i) => {
              const active = form.activeDays.includes(i);
              return (
                <button
                  key={DAY_FULL[i]}
                  type="button"
                  onClick={() => toggleDay(i)}
                  title={DAY_FULL[i]}
                  className="flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200"
                  style={active ? {
                    background: `${accentColor}25`,
                    color: accentColor,
                    border: `1px solid ${accentColor}45`,
                  } : {
                    background: "rgba(255,255,255,0.04)",
                    color: "#374151",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── PRIORITY ─────────────────────────────────────────── */}
      <Section icon={Target} title="Priority" step={3}>
        <div className="flex gap-2">
          {PRIORITIES.map(({ value, label, desc, color }) => {
            const active = form.priority === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: value }))}
                className="flex-1 py-2.5 px-2 rounded-lg border text-center transition-all duration-200"
                style={active ? {
                  background: `${color}18`,
                  borderColor: `${color}50`,
                  boxShadow: `0 0 12px ${color}18`,
                } : {
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <p className="text-xs font-semibold" style={{ color: active ? color : "#6B7280" }}>{label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: active ? `${color}90` : "#374151" }}>{desc}</p>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── CONTEXT ──────────────────────────────────────────── */}
      <Section icon={AlignLeft} title="Context" step={4}>
        <div className="space-y-2">
          <SectionTextarea
            accentColor={accentColor}
            placeholder="Description — what is this goal about?"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="h-16"
          />
          <SectionTextarea
            accentColor={accentColor}
            placeholder="Motivation — why does this matter to you?"
            value={form.motivation}
            onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
            className="h-14"
          />
        </div>
      </Section>

      {/* ── STEPS ────────────────────────────────────────────── */}
      <Section icon={ListChecks} title="Steps" step={5}>
        <div className="space-y-2">
          {form.steps.map((step, i) => {
            const done = !!step.completedAt;
            return (
              <div key={i} className="flex gap-1.5 items-center">
                <div className="flex flex-col flex-shrink-0">
                  <button type="button" onClick={() => moveStep(i, "up")} disabled={i === 0}
                    className="p-0.5 text-gray-700 hover:text-gray-300 disabled:opacity-20 transition-colors">
                    <ChevronUp size={11} />
                  </button>
                  <button type="button" onClick={() => moveStep(i, "down")} disabled={i === form.steps.length - 1}
                    className="p-0.5 text-gray-700 hover:text-gray-300 disabled:opacity-20 transition-colors">
                    <ChevronDown size={11} />
                  </button>
                </div>
                {done ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                    <Check size={9} className="text-emerald-400" />
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-600 w-5 text-center font-mono flex-shrink-0">{i + 1}.</span>
                )}
                <SectionInput
                  accentColor={accentColor}
                  value={step.name}
                  onChange={(e) => updateStep(i, e.target.value)}
                  placeholder={`Step ${i + 1}`}
                  className={cn("flex-1", done && "line-through text-gray-600 opacity-60")}
                />
                <button type="button" onClick={() => removeStep(i)}
                  className="p-1 text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-2.5 text-xs flex items-center gap-1 font-medium transition-colors"
          style={{ color: accentColor }}
        >
          <Plus size={12} /> Add step
        </button>
      </Section>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
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
