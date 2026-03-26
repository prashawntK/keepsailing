"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const QUOTES = [
  { text: "Productivity isn't doing more. It's doing what matters.", author: null },
  { text: "Show up consistently. That's the whole game.", author: null },
  { text: "You don't rise to your goals. You fall to your systems.", author: "James Clear" },
  { text: "One thing done well beats ten things done halfway.", author: null },
  { text: "Clarity before speed.", author: null },
  { text: "Your future self is watching. What are you doing today?", author: null },
  { text: "Small daily improvements lead to stunning long-term results.", author: null },
  { text: "The compass matters more than the map.", author: null },
  { text: "Focus is the art of knowing what to ignore.", author: null },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "The secret is not to prioritise your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { text: "It's not about having time. It's about making time.", author: null },
  { text: "Progress, not perfection.", author: null },
  { text: "Do the hard thing first. Everything else gets easier.", author: null },
];

// Watermark words cycling per section
const SECTION_WORDS: Record<string, string> = {
  "/": "TODAY",
  "/goals": "GOALS",
  "/stats": "STATS",
  "/settings": "SETTINGS",
};

const MIN_DISPLAY_MS = 750;

export function NavigationLoader() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const [show, setShow] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [word, setWord] = useState("SAIL");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip on very first render (initial page load)
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (pathname === prevPathRef.current) return;

    prevPathRef.current = pathname;

    // Pick random quote
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Pick section word
    const sectionWord = SECTION_WORDS[pathname] ?? "SAIL";
    setWord(sectionWord);

    setShow(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), MIN_DISPLAY_MS);
  }, [pathname]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
          style={{
            background: "var(--color-surface-base, #0B0F19)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Giant faint watermark word */}
          <div
            className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden"
            aria-hidden
          >
            <motion.span
              className="font-black tracking-[0.25em] text-white/[0.04]"
              style={{ fontSize: "clamp(80px, 22vw, 200px)" }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {word}
            </motion.span>
          </div>

          {/* Logo + quote */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-8 max-w-sm text-center"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.06 }}
          >
            {/* Logo */}
            <img src="/logo.svg" alt="Keep Sailing" className="w-10 h-10 opacity-70" />

            {/* Quote */}
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-200 leading-snug">
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.author && (
                <p className="text-xs text-gray-500 tracking-wide">— {quote.author}</p>
              )}
            </div>
          </motion.div>

          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.05]">
            <motion.div
              className="h-full bg-primary/60"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: MIN_DISPLAY_MS / 1000, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
