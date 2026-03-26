"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const GOAL_EXAMPLES = [
  { emoji: "📚", label: "📚 Reading · 30min", name: "Reading", minutes: 30 },
  { emoji: "💻", label: "💻 Coding · 1h", name: "Coding", minutes: 60 },
  { emoji: "🏃", label: "🏃 Running · 20min", name: "Running", minutes: 20 },
];
const EC_EXAMPLES = [
  { emoji: "🧘", label: "🧘 Meditation · 15min", name: "Meditation", minutes: 15 },
  { emoji: "📝", label: "📝 Journaling · 20min", name: "Journaling", minutes: 20 },
  { emoji: "🏋️", label: "🏋️ Exercise · 45min", name: "Exercise", minutes: 45 },
];
const CHORE_EXAMPLES = [
  { emoji: "🛒", label: "🛒 Groceries · tomorrow", name: "Groceries" },
  { emoji: "🧺", label: "🧺 Laundry · in 3d", name: "Laundry" },
  { emoji: "💊", label: "💊 Meds · today", name: "Meds" },
];

type InlineMode = "none" | "form";

function inputClass() {
  return "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary/60 transition-colors";
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [visible, setVisible] = useState(true);

  // Step 1 — profile
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  // Step 2 — goal
  const [goalMode, setGoalMode] = useState<InlineMode>("none");
  const [goalEmoji, setGoalEmoji] = useState("🎯");
  const [goalName, setGoalName] = useState("");
  const [goalDailyTarget, setGoalDailyTarget] = useState(60);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savedGoal, setSavedGoal] = useState<{ emoji: string; name: string } | null>(null);

  // Step 3 — EC
  const [ecMode, setEcMode] = useState<InlineMode>("none");
  const [ecEmoji, setEcEmoji] = useState("🧘");
  const [ecName, setEcName] = useState("");
  const [ecTargetMinutes, setEcTargetMinutes] = useState(30);
  const [savingEc, setSavingEc] = useState(false);
  const [savedEc, setSavedEc] = useState<{ emoji: string; name: string } | null>(null);

  // Step 4 — Chore
  const [choreMode, setChoreMode] = useState<InlineMode>("none");
  const [choreEmoji, setChoreEmoji] = useState("🛒");
  const [choreName, setChoreName] = useState("");
  const [choreDescription, setChoreDescription] = useState("");
  const [choreDeadline, setChoreDeadline] = useState<"today" | "tomorrow" | "3days" | "week">("tomorrow");
  const [savingChore, setSavingChore] = useState(false);
  const [savedChore, setSavedChore] = useState<{ emoji: string; name: string } | null>(null);

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

  function advance() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function back() {
    if (step === 1 && goalMode === "form") { setDirection(-1); setGoalMode("none"); return; }
    if (step === 2 && ecMode === "form") { setDirection(-1); setEcMode("none"); return; }
    if (step === 3 && choreMode === "form") { setDirection(-1); setChoreMode("none"); return; }
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSkip() {
    if (step === 1 && goalMode === "form") { setGoalMode("none"); advance(); return; }
    if (step === 2 && ecMode === "form") { setEcMode("none"); advance(); return; }
    if (step === 3 && choreMode === "form") { setChoreMode("none"); advance(); return; }
    advance();
  }

  async function saveProfile() {
    const body: Record<string, unknown> = {};
    if (name.trim()) body.name = name.trim();
    if (age.trim()) body.age = parseInt(age);
    if (Object.keys(body).length > 0) {
      await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
          goalType: "timer",
          dailyTarget: goalDailyTarget / 60,
          priority: "should",
        }),
      });
      setSavedGoal({ emoji: goalEmoji, name: goalName.trim() });
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
        body: JSON.stringify({ name: ecName.trim(), emoji: ecEmoji, targetMinutes: ecTargetMinutes }),
      });
      setSavedEc({ emoji: ecEmoji, name: ecName.trim() });
    } finally {
      setSavingEc(false);
    }
    advance();
  }

  async function handleSaveChore() {
    if (!choreName.trim() || !choreDescription.trim()) return;
    setSavingChore(true);
    try {
      await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: choreName.trim(),
          emoji: choreEmoji,
          description: choreDescription.trim(),
          deadline: deadlineDate(choreDeadline),
        }),
      });
      setSavedChore({ emoji: choreEmoji, name: choreName.trim() });
    } finally {
      setSavingChore(false);
    }
    advance();
  }

  async function handleThemeSelect(t: Theme) {
    setTheme(t);
    await Promise.all([
      fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t }) }),
      fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t }) }),
    ]);
  }

  async function handleFinish() {
    const res = await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onboardingCompleted: true }) });
    if (!res.ok) {
      await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onboardingCompleted: true }) });
    }
    setVisible(false);
    setTimeout(onComplete, 300);
  }

  // Pre-fill goal from example pill
  function prefillGoal(ex: typeof GOAL_EXAMPLES[0]) {
    setGoalEmoji(ex.emoji);
    setGoalName(ex.name);
    setGoalDailyTarget(ex.minutes);
    setDirection(1);
    setGoalMode("form");
  }

  // Pre-fill EC from example pill
  function prefillEc(ex: typeof EC_EXAMPLES[0]) {
    setEcEmoji(ex.emoji);
    setEcName(ex.name);
    setEcTargetMinutes(ex.minutes);
    setDirection(1);
    setEcMode("form");
  }

  // Pre-fill Chore from example pill
  function prefillChore(ex: typeof CHORE_EXAMPLES[0]) {
    setChoreEmoji(ex.emoji);
    setChoreName(ex.name);
    setDirection(1);
    setChoreMode("form");
  }

  const showBack = step > 0 || (step === 1 && goalMode === "form") || (step === 2 && ecMode === "form") || (step === 3 && choreMode === "form");
  const showSkip = step >= 1 && step <= 3;

  // Unique key for AnimatePresence — changes on every step/mode transition
  const contentKey = `${step}-${step === 1 ? goalMode : step === 2 ? ecMode : step === 3 ? choreMode : "x"}`;

  const savedItems = [savedGoal, savedEc, savedChore].filter(Boolean) as { emoji: string; name: string }[];

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300", visible ? "opacity-100" : "opacity-0 pointer-events-none")}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="relative max-w-sm w-full mx-4">
        <div className="glass-card rounded-3xl p-8 space-y-6 overflow-hidden">

          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="w-8">
              {showBack && (
                <button onClick={back} className="text-gray-400 hover:text-gray-200 transition-colors text-lg leading-none" aria-label="Go back">←</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={cn("rounded-full transition-all duration-300", i === step ? "w-4 h-2 bg-primary" : i < step ? "w-2 h-2 bg-primary/40" : "w-2 h-2 bg-white/20")} />
              ))}
            </div>
            <div className="w-8 flex justify-end">
              {showSkip && step < 4 && (
                <button onClick={handleSkip} className="text-xs text-gray-500 hover:text-gray-300 transition-colors whitespace-nowrap">Skip</button>
              )}
            </div>
          </div>

          {/* Step content with slide transition */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={contentKey}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {step === 0 && <Step1Welcome name={name} setName={setName} age={age} setAge={setAge} onNext={handleStep1Next} inputClass={inputClass()} />}

              {step === 1 && goalMode === "none" && <Step2Goals onAdd={() => { setDirection(1); setGoalMode("form"); }} onSkip={advance} examples={GOAL_EXAMPLES} onPrefill={prefillGoal} />}
              {step === 1 && goalMode === "form" && (
                <InlineGoalForm emoji={goalEmoji} setEmoji={setGoalEmoji} name={goalName} setName={setGoalName} dailyTarget={goalDailyTarget} setDailyTarget={setGoalDailyTarget} saving={savingGoal} onSave={handleSaveGoal} onBack={() => { setDirection(-1); setGoalMode("none"); }} inputClass={inputClass()} emojis={GOAL_EMOJIS} />
              )}

              {step === 2 && ecMode === "none" && <Step3EC onAdd={() => { setDirection(1); setEcMode("form"); }} onSkip={advance} examples={EC_EXAMPLES} onPrefill={prefillEc} />}
              {step === 2 && ecMode === "form" && (
                <InlineEcForm emoji={ecEmoji} setEmoji={setEcEmoji} name={ecName} setName={setEcName} targetMinutes={ecTargetMinutes} setTargetMinutes={setEcTargetMinutes} saving={savingEc} onSave={handleSaveEc} onBack={() => { setDirection(-1); setEcMode("none"); }} inputClass={inputClass()} emojis={EC_EMOJIS} />
              )}

              {step === 3 && choreMode === "none" && <Step4Chores onAdd={() => { setDirection(1); setChoreMode("form"); }} onSkip={advance} examples={CHORE_EXAMPLES} onPrefill={prefillChore} />}
              {step === 3 && choreMode === "form" && (
                <InlineChoreForm emoji={choreEmoji} setEmoji={setChoreEmoji} name={choreName} setName={setChoreName} description={choreDescription} setDescription={setChoreDescription} deadline={choreDeadline} setDeadline={setChoreDeadline} saving={savingChore} onSave={handleSaveChore} onBack={() => { setDirection(-1); setChoreMode("none"); }} inputClass={inputClass()} emojis={CHORE_EMOJIS} />
              )}

              {step === 4 && <Step5Theme selectedTheme={theme} onSelectTheme={handleThemeSelect} onFinish={handleFinish} savedItems={savedItems} />}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function Step1Welcome({ name, setName, age, setAge, onNext, inputClass }: {
  name: string; setName: (v: string) => void;
  age: string; setAge: (v: string) => void;
  onNext: () => void; inputClass: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <img src="/logo.svg" alt="Keep Sailing" className="w-14 h-14 mx-auto mb-1" />
        <h2 className="text-xl font-bold text-gray-100">Let&apos;s get you set up</h2>
        <p className="text-sm text-gray-400">Takes about 2 minutes. You can skip anything.</p>
      </div>
      <div className="space-y-3">
        <input type="text" placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus onKeyDown={(e) => e.key === "Enter" && onNext()} />
        <input type="number" placeholder="How old are you? (optional)" value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} min={1} max={120} onKeyDown={(e) => e.key === "Enter" && onNext()} />
      </div>
      <button onClick={onNext} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95">
        Let&apos;s go →
      </button>
    </div>
  );
}

// ─── Step 2: Goals intro ──────────────────────────────────────────────────────

function Step2Goals({ onAdd, onSkip, examples, onPrefill }: {
  onAdd: () => void; onSkip: () => void;
  examples: typeof GOAL_EXAMPLES;
  onPrefill: (ex: typeof GOAL_EXAMPLES[0]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🎯</div>
        <h2 className="text-xl font-bold text-gray-100">Goals</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          The things you want to make time for every day. Set a daily time target — the app holds you to it.
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2 text-center">Tap an example to prefill</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {examples.map((ex) => (
            <button key={ex.label} onClick={() => onPrefill(ex)} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.12] hover:border-primary/40 hover:text-gray-100 transition-all active:scale-95">
              {ex.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <button onClick={onAdd} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95">
          Add your own goal
        </button>
        <button onClick={onSkip} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: EC intro ─────────────────────────────────────────────────────────

function Step3EC({ onAdd, onSkip, examples, onPrefill }: {
  onAdd: () => void; onSkip: () => void;
  examples: typeof EC_EXAMPLES;
  onPrefill: (ex: typeof EC_EXAMPLES[0]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">✨</div>
        <h2 className="text-xl font-bold text-gray-100">Extra-Curriculars</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Activities that enrich your life without a strict daily deadline. Show up when you can.
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2 text-center">Tap an example to prefill</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {examples.map((ex) => (
            <button key={ex.label} onClick={() => onPrefill(ex)} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.12] hover:border-primary/40 hover:text-gray-100 transition-all active:scale-95">
              {ex.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <button onClick={onAdd} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95">
          Add your own activity
        </button>
        <button onClick={onSkip} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Chores intro ─────────────────────────────────────────────────────

function Step4Chores({ onAdd, onSkip, examples, onPrefill }: {
  onAdd: () => void; onSkip: () => void;
  examples: typeof CHORE_EXAMPLES;
  onPrefill: (ex: typeof CHORE_EXAMPLES[0]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🧹</div>
        <h2 className="text-xl font-bold text-gray-100">Chores</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          Tasks that pile up if ignored. Add a deadline and a reason — the app nudges you before things get urgent.
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-2 text-center">Tap an example to prefill</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {examples.map((ex) => (
            <button key={ex.label} onClick={() => onPrefill(ex)} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.12] hover:border-primary/40 hover:text-gray-100 transition-all active:scale-95">
              {ex.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <button onClick={onAdd} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95">
          Add your own chore
        </button>
        <button onClick={onSkip} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Theme ────────────────────────────────────────────────────────────

function Step5Theme({ selectedTheme, onSelectTheme, onFinish, savedItems }: {
  selectedTheme: Theme; onSelectTheme: (t: Theme) => void; onFinish: () => void;
  savedItems: { emoji: string; name: string }[];
}) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="text-5xl">🎨</div>
        <h2 className="text-xl font-bold text-gray-100">Pick your style</h2>
        <p className="text-sm text-gray-400">You can always change this in Settings.</p>
      </div>

      {savedItems.length > 0 && (
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-3 space-y-1.5">
          <p className="text-xs text-gray-500 mb-1">Added during setup</p>
          {savedItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <span>{item.emoji}</span>
              <span>{item.name}</span>
              <span className="ml-auto text-xs text-green-400/70">✓</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button key={t.id} onClick={() => onSelectTheme(t.id)} className={cn("flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all", selectedTheme === t.id ? "border-primary bg-primary/10 ring-1 ring-primary/50" : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]")}>
            <div className={cn("w-7 h-7 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0", t.color)}>
              <div className={cn("w-2.5 h-2.5 rounded-full", t.accent)} />
            </div>
            <span className="text-xs font-medium text-gray-200 leading-tight">{t.name}</span>
          </button>
        ))}
      </div>

      <button onClick={onFinish} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95">
        Start sailing →
      </button>
    </div>
  );
}

// ─── Time Stepper ─────────────────────────────────────────────────────────────

function TimeStepper({ minutes, setMinutes, label = "Daily target" }: { minutes: number; setMinutes: (v: number) => void; label?: string }) {
  const options = [15, 20, 30, 45, 60, 90, 120];
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((m) => (
          <button key={m} onClick={() => setMinutes(m)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", minutes === m ? "border-primary bg-primary/15 text-gray-100" : "border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]")}>
            {m < 60 ? `${m}m` : `${m / 60}h`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Inline Goal Form ─────────────────────────────────────────────────────────

function InlineGoalForm({ emoji, setEmoji, name, setName, dailyTarget, setDailyTarget, saving, onSave, onBack, inputClass, emojis }: {
  emoji: string; setEmoji: (e: string) => void;
  name: string; setName: (v: string) => void;
  dailyTarget: number; setDailyTarget: (v: number) => void;
  saving: boolean; onSave: () => void; onBack: () => void;
  inputClass: string; emojis: string[];
}) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="text-4xl">{emoji}</div>
        <h3 className="text-lg font-bold text-gray-100">Add a goal</h3>
      </div>
      <EmojiPicker selected={emoji} onSelect={setEmoji} emojis={emojis} />
      <input type="text" placeholder="Goal name (e.g. Read every day)" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave()} />
      <TimeStepper minutes={dailyTarget} setMinutes={setDailyTarget} />
      <button onClick={onSave} disabled={!name.trim() || saving} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">
        {saving ? "Saving…" : "Save & Continue →"}
      </button>
      <button onClick={onBack} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">← Back</button>
    </div>
  );
}

// ─── Inline EC Form ───────────────────────────────────────────────────────────

function InlineEcForm({ emoji, setEmoji, name, setName, targetMinutes, setTargetMinutes, saving, onSave, onBack, inputClass, emojis }: {
  emoji: string; setEmoji: (e: string) => void;
  name: string; setName: (v: string) => void;
  targetMinutes: number; setTargetMinutes: (v: number) => void;
  saving: boolean; onSave: () => void; onBack: () => void;
  inputClass: string; emojis: string[];
}) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="text-4xl">{emoji}</div>
        <h3 className="text-lg font-bold text-gray-100">Add an activity</h3>
      </div>
      <EmojiPicker selected={emoji} onSelect={setEmoji} emojis={emojis} />
      <input type="text" placeholder="Activity name (e.g. Morning meditation)" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave()} />
      <TimeStepper minutes={targetMinutes} setMinutes={setTargetMinutes} label="Session target" />
      <button onClick={onSave} disabled={!name.trim() || saving} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">
        {saving ? "Saving…" : "Save & Continue →"}
      </button>
      <button onClick={onBack} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">← Back</button>
    </div>
  );
}

// ─── Inline Chore Form ────────────────────────────────────────────────────────

function InlineChoreForm({ emoji, setEmoji, name, setName, description, setDescription, deadline, setDeadline, saving, onSave, onBack, inputClass, emojis }: {
  emoji: string; setEmoji: (e: string) => void;
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  deadline: "today" | "tomorrow" | "3days" | "week"; setDeadline: (v: "today" | "tomorrow" | "3days" | "week") => void;
  saving: boolean; onSave: () => void; onBack: () => void;
  inputClass: string; emojis: string[];
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
      <input type="text" placeholder="Chore name (e.g. Buy groceries)" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
      <input type="text" placeholder="Why does this matter? (e.g. Running low on essentials)" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      <div>
        <p className="text-xs text-gray-500 mb-2">Due by</p>
        <div className="grid grid-cols-2 gap-2">
          {deadlineOptions.map((opt) => (
            <button key={opt.value} onClick={() => setDeadline(opt.value)} className={cn("py-2 rounded-xl text-xs font-medium border transition-all", deadline === opt.value ? "border-primary bg-primary/15 text-gray-100" : "border-white/[0.08] bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]")}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onSave} disabled={!name.trim() || !description.trim() || saving} className="w-full btn-premium py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50">
        {saving ? "Saving…" : "Save & Continue →"}
      </button>
      <button onClick={onBack} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors">← Back</button>
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ selected, onSelect, emojis }: { selected: string; onSelect: (e: string) => void; emojis: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {emojis.map((e) => (
        <button key={e} onClick={() => onSelect(e)} className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all", selected === e ? "bg-primary/20 ring-1 ring-primary/50" : "bg-white/[0.04] hover:bg-white/[0.08]")}>
          {e}
        </button>
      ))}
    </div>
  );
}
