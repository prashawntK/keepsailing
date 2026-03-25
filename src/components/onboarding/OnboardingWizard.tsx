"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { format, addDays } from "date-fns";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const THEMES: { id: Theme; name: string; color: string; accent: string }[] = [
  { id: "detrimental-dark", name: "Detrimental Dark", color: "bg-[#0B0F19]", accent: "bg-primary" },
  { id: "lucid-light", name: "Lucid Light", color: "bg-[#F8FAFC]", accent: "bg-primary" },
  { id: "plausible-purple", name: "Plausible Purple", color: "bg-[#0D0415]", accent: "bg-[#D946EF]" },
  { id: "original-orange", name: "Original Orange", color: "bg-[#0B0F19]", accent: "bg-[#F97316]" },
  { id: "amber-noir", name: "Amber Noir", color: "bg-[#0D0A07]", accent: "bg-[#F97316]" },
  { id: "charcoal-black", name: "Charcoal Black", color: "bg-[#080808]", accent: "bg-[#94A3B8]" },
];

const GOAL_EMOJIS = ["🎯", "📚", "💻", "🏃", "🎨", "🎵", "✍️", "🧠", "💡", "🌱", "🔥", "⚡"];
const EC_EMOJIS = ["🧘", "📝", "🏋️", "🚴", "🌿", "🎤", "🎸", "🧗", "🌊", "☕", "🌅", "🙏"];
const CHORE_EMOJIS = ["🛒", "🧺", "🧹", "💊", "📦", "🔧", "🚿", "🍽️", "📬", "💳", "🚗", "🌿"];

type InlineMode = "none" | "form";

function inputClass() {
  return "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors";
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState(0); // 0–4
  const [visible, setVisible] = useState(true);

  // Step 1 — profile
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  // Step 2 — goal inline form
  const [goalMode, setGoalMode] = useState<InlineMode>("none");
  const [goalEmoji, setGoalEmoji] = useState("🎯");
  const [goalName, setGoalName] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // Step 3 — EC inline form
  const [ecMode, setEcMode] = useState<InlineMode>("none");
  const [ecEmoji, setEcEmoji] = useState("🧘");
  const [ecName, setEcName] = useState("");
  const [savingEc, setSavingEc] = useState(false);

  // Step 4 — Chore inline form
  const [choreMode, setChoreMode] = useState<InlineMode>("none");
  const [choreEmoji, setChoreEmoji] = useState("🛒");
  const [choreName, setChoreName] = useState("");
  const [choreDeadline, setChoreDeadline] = useState<"today" | "tomorrow" | "3days" | "week">("today");
  const [savingChore, setSavingChore] = useState(false);

  const totalSteps = 5;

  function deadlineDate(key: typeof choreDeadline): string {
    const today = new Date();
    switch (key) {
      case "today": return format(today, "yyyy-MM-dd");
      case "tomorrow": return format(addDays(today, 1), "yyyy-MM-dd");
      case "3days": return format(addDays(today, 3), "yyyy-MM-dd");
      case "week": return format(addDays(today, 7), "yyyy-MM-dd");
    }
  }

  async function saveProfile() {
    const body: Record<string, unknown> = {};
    if (name.trim()) body.name = name.trim();
    if (age.trim()) body.age = parseInt(age);
    if (Object.keys(body).length > 0) {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  }

  async function handleStep1Next() {
    await saveProfile();
    advance();
  }

  async function handleSaveGoal() {
    if (!goalName.trim()) return;
    setSavingGoal(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goalName.trim(),
          emoji: goalEmoji,
          category: "Personal",
          goalType: "completion",
          dailyTarget: 0,
          priority: "should",
        }),
      });
    } finally {
      setSavingGoal(false);
    }
    advance();
  }

  async function handleSaveEc() {
    if (!ecName.trim()) return;
    setSavingEc(true);
    try {
      await fetch("/api/extra-curriculars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ecName.trim(), emoji: ecEmoji }),
      });
    } finally {
      setSavingEc(false);
    }
    advance();
  }

  async function handleSaveChore() {
    if (!choreName.trim()) return;
    setSavingChore(true);
    try {
      await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: choreName.trim(),
          emoji: choreEmoji,
          deadline: deadlineDate(choreDeadline),
        }),
      });
    } finally {
      setSavingChore(false);
    }
    advance();
  }

  async function handleThemeSelect(t: Theme) {
    setTheme(t);
    // Update both /api/user and /api/settings
    await Promise.all([
      fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      }),
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      }),
    ]);
  }

  async function handleFinish() {
    // Mark complete first, then close — prevents re-show on dashboard refresh
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingCompleted: true }),
    });
    setVisible(false);
    // Call onComplete after animation — dashboard refresh will now read onboardingCompleted: true
    setTimeout(onComplete, 300);
  }

  function advance() {
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function back() {
    // If in inline form mode, go back to description
    if (step === 1 && goalMode === "form") { setGoalMode("none"); return; }
    if (step === 2 && ecMode === "form") { setEcMode("none"); return; }
    if (step === 3 && choreMode === "form") { setChoreMode("none"); return; }
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSkip() {
    if (step === 1 && goalMode === "form") { setGoalMode("none"); advance(); return; }
    if (step === 2 && ecMode === "form") { setEcMode("none"); advance(); return; }
    if (step === 3 && choreMode === "form") { setChoreMode("none"); advance(); return; }
    advance();
  }

  const showBack = step > 0 || (step === 1 && goalMode === "form") || (step === 2 && ecMode === "form") || (step === 3 && choreMode === "form");
  const showSkip = step >= 1 && step <= 3;
  const inForm = (step === 1 && goalMode === "form") || (step === 2 && ecMode === "form") || (step === 3 && choreMode === "form");

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Card */}
      <div className="relative max-w-sm w-full mx-4">
        <div className="glass-card rounded-3xl p-8 space-y-6">

          {/* Top row: back arrow + progress dots + skip */}
          <div className="flex items-center justify-between">
            {/* Back arrow */}
            <div className="w-8">
              {showBack && (
                <button
                  onClick={back}
                  className="text-gray-400 hover:text-gray-200 transition-colors text-lg leading-none"
                  aria-label="Go back"
                >
                  ←
                </button>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step
                      ? "w-4 h-2 bg-primary"
                      : i < step
                      ? "w-2 h-2 bg-primary/40"
                      : "w-2 h-2 bg-white/20"
                  )}
                />
              ))}
            </div>

            {/* Skip button */}
            <div className="w-8 flex justify-end">
              {showSkip && step < 4 && (
                <button
                  onClick={handleSkip}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors whitespace-nowrap"
                >
                  Skip
                </button>
              )}
            </div>
          </div>

          {/* Step content with fade transition */}
          <div className="transition-all duration-300">
            {step === 0 && <Step1Welcome name={name} setName={setName} age={age} setAge={setAge} onNext={handleStep1Next} inputClass={inputClass()} />}
            {step === 1 && goalMode === "none" && (
              <Step2Goals onAdd={() => setGoalMode("form")} onSkip={advance} />
            )}
            {step === 1 && goalMode === "form" && (
              <InlineGoalForm
                emoji={goalEmoji}
                setEmoji={setGoalEmoji}
                name={goalName}
                setName={setGoalName}
                saving={savingGoal}
                onSave={handleSaveGoal}
                onBack={() => setGoalMode("none")}
                inputClass={inputClass()}
                emojis={GOAL_EMOJIS}
              />
            )}
            {step === 2 && ecMode === "none" && (
              <Step3EC onAdd={() => setEcMode("form")} onSkip={advance} />
            )}
            {step === 2 && ecMode === "form" && (
              <InlineEcForm
                emoji={ecEmoji}
                setEmoji={setEcEmoji}
                name={ecName}
                setName={setEcName}
                saving={savingEc}
                onSave={handleSaveEc}
                onBack={() => setEcMode("none")}
                inputClass={inputClass()}
                emojis={EC_EMOJIS}
              />
            )}
            {step === 3 && choreMode === "none" && (
              <Step4Chores onAdd={() => setChoreMode("form")} onSkip={advance} />
            )}
            {step === 3 && choreMode === "form" && (
              <InlineChoreForm
                emoji={choreEmoji}
                setEmoji={setChoreEmoji}
                name={choreName}
                setName={setChoreName}
                deadline={choreDeadline}
                setDeadline={setChoreDeadline}
                saving={savingChore}
                onSave={handleSaveChore}
                onBack={() => setChoreMode("none")}
                inputClass={inputClass()}
                emojis={CHORE_EMOJIS}
              />
            )}
            {step === 4 && (
              <Step5Theme
                selectedTheme={theme}
                onSelectTheme={handleThemeSelect}
                onFinish={handleFinish}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ────────────────────────────────────────────────────────

function Step1Welcome({
  name, setName, age, setAge, onNext, inputClass,
}: {
  name: string;
  setName: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  onNext: () => void;
  inputClass: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <img src="/logo.svg" alt="Keep Sailing" className="w-14 h-14 mx-auto mb-1" />
        <h2 className="text-xl font-bold text-gray-100">Let&apos;s get you set up</h2>
        <p className="text-sm text-gray-400">Takes about 2 minutes. You can skip anything.</p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="What should we call you?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          autoFocus
        />
        <input
          type="number"
          placeholder="How old are you? (optional)"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={inputClass}
          min={1}
          max={120}
        />
      </div>

      <button
        onClick={onNext}
        className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
      >
        Let&apos;s go →
      </button>
    </div>
  );
}

// ─── Step 2: Goals ──────────────────────────────────────────────────────────

function Step2Goals({ onAdd, onSkip }: { onAdd: () => void; onSkip: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🎯</div>
        <h2 className="text-xl font-bold text-gray-100">Goals — your daily targets</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Goals are things you want to work on every day. Learning a skill, building a habit, a project. Tracked by time or completion.
        </p>
      </div>

      {/* Mini example pills */}
      <div className="flex flex-wrap gap-2">
        {["📚 Reading · 30min", "💻 Coding · 1h", "🏃 Running · 20min"].map((ex) => (
          <span key={ex} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-gray-300">
            {ex}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <button
          onClick={onAdd}
          className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
        >
          Add your first goal
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Extra-Curriculars ───────────────────────────────────────────────

function Step3EC({ onAdd, onSkip }: { onAdd: () => void; onSkip: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">✨</div>
        <h2 className="text-xl font-bold text-gray-100">Extra-Curriculars — optional habits</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          ECs are activities you want to do regularly but without strict daily pressure. Meditation, journaling, exercise. Do them when you can.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["🧘 Meditation", "📝 Journaling", "🏋️ Exercise"].map((ex) => (
          <span key={ex} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-gray-300">
            {ex}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <button
          onClick={onAdd}
          className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
        >
          Add an activity
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Chores ─────────────────────────────────────────────────────────

function Step4Chores({ onAdd, onSkip }: { onAdd: () => void; onSkip: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🧹</div>
        <h2 className="text-xl font-bold text-gray-100">Chores — things with deadlines</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Chores are recurring tasks that need to get done by a certain date. Laundry, groceries, bills. The app reminds you when they&apos;re getting urgent.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["🛒 Grocery shop · in 2d", "🧺 Laundry · today", "💊 Meds · tomorrow"].map((ex) => (
          <span key={ex} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-gray-300">
            {ex}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <button
          onClick={onAdd}
          className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
        >
          Add a chore
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Theme ──────────────────────────────────────────────────────────

function Step5Theme({
  selectedTheme,
  onSelectTheme,
  onFinish,
}: {
  selectedTheme: Theme;
  onSelectTheme: (t: Theme) => void;
  onFinish: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🎨</div>
        <h2 className="text-xl font-bold text-gray-100">Pick your style</h2>
        <p className="text-sm text-gray-400">You can always change this in Settings.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTheme(t.id)}
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all",
              selectedTheme === t.id
                ? "border-primary bg-primary/10 ring-1 ring-primary/50"
                : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
            )}
          >
            <div className={cn("w-7 h-7 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0", t.color)}>
              <div className={cn("w-2.5 h-2.5 rounded-full", t.accent)} />
            </div>
            <span className="text-xs font-medium text-gray-200 leading-tight">{t.name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onFinish}
        className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
      >
        Start your journey →
      </button>
    </div>
  );
}

// ─── Inline Goal Form ────────────────────────────────────────────────────────

function InlineGoalForm({
  emoji, setEmoji, name, setName, saving, onSave, onBack, inputClass, emojis,
}: {
  emoji: string;
  setEmoji: (e: string) => void;
  name: string;
  setName: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  inputClass: string;
  emojis: string[];
}) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="text-4xl">{emoji}</div>
        <h3 className="text-lg font-bold text-gray-100">Add a goal</h3>
      </div>

      <EmojiPicker selected={emoji} onSelect={setEmoji} emojis={emojis} />

      <input
        type="text"
        placeholder="Goal name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
        autoFocus
      />

      <button
        onClick={onSave}
        disabled={!name.trim() || saving}
        className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save & Continue →"}
      </button>
      <button onClick={onBack} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← Back
      </button>
    </div>
  );
}

// ─── Inline EC Form ──────────────────────────────────────────────────────────

function InlineEcForm({
  emoji, setEmoji, name, setName, saving, onSave, onBack, inputClass, emojis,
}: {
  emoji: string;
  setEmoji: (e: string) => void;
  name: string;
  setName: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  inputClass: string;
  emojis: string[];
}) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="text-4xl">{emoji}</div>
        <h3 className="text-lg font-bold text-gray-100">Add an activity</h3>
      </div>

      <EmojiPicker selected={emoji} onSelect={setEmoji} emojis={emojis} />

      <input
        type="text"
        placeholder="Activity name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
        autoFocus
      />

      <button
        onClick={onSave}
        disabled={!name.trim() || saving}
        className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save & Continue →"}
      </button>
      <button onClick={onBack} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← Back
      </button>
    </div>
  );
}

// ─── Inline Chore Form ───────────────────────────────────────────────────────

function InlineChoreForm({
  emoji, setEmoji, name, setName, deadline, setDeadline, saving, onSave, onBack, inputClass, emojis,
}: {
  emoji: string;
  setEmoji: (e: string) => void;
  name: string;
  setName: (v: string) => void;
  deadline: "today" | "tomorrow" | "3days" | "week";
  setDeadline: (v: "today" | "tomorrow" | "3days" | "week") => void;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  inputClass: string;
  emojis: string[];
}) {
  const deadlineOptions: { value: "today" | "tomorrow" | "3days" | "week"; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "3days", label: "In 3 days" },
    { value: "week", label: "In 1 week" },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="text-4xl">{emoji}</div>
        <h3 className="text-lg font-bold text-gray-100">Add a chore</h3>
      </div>

      <EmojiPicker selected={emoji} onSelect={setEmoji} emojis={emojis} />

      <input
        type="text"
        placeholder="Chore name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
        autoFocus
      />

      <div className="grid grid-cols-2 gap-2">
        {deadlineOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDeadline(opt.value)}
            className={cn(
              "py-2 rounded-xl text-xs font-medium border transition-all",
              deadline === opt.value
                ? "border-primary bg-primary/15 text-gray-100"
                : "border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={!name.trim() || saving}
        className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save & Continue →"}
      </button>
      <button onClick={onBack} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">
        ← Back
      </button>
    </div>
  );
}

// ─── Emoji Picker ────────────────────────────────────────────────────────────

function EmojiPicker({
  selected, onSelect, emojis,
}: {
  selected: string;
  onSelect: (e: string) => void;
  emojis: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {emojis.map((e) => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all",
            selected === e
              ? "bg-primary/20 ring-1 ring-primary/50"
              : "bg-white/[0.04] hover:bg-white/[0.08]"
          )}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
