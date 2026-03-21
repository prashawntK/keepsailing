"use client";

import { useEffect, useState } from "react";

export function DailyQuote() {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quote")
      .then((r) => r.json())
      .then((data) => {
        setQuote(data.quote);
        setAuthor(data.author);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-3" />
        <div className="h-4 w-full bg-white/10 rounded mb-2" />
        <div className="h-4 w-4/5 bg-white/10 rounded mb-3" />
        <div className="h-3 w-24 bg-white/10 rounded ml-auto" />
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      {/* Subtle quote mark watermark */}
      <span
        className="absolute -top-2 -left-1 text-7xl font-serif text-white/[0.04] select-none pointer-events-none leading-none"
        aria-hidden
      >
        &ldquo;
      </span>

      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-3">
        Daily Motivation
      </p>

      <p className="text-sm leading-relaxed text-gray-200 font-medium relative z-10">
        &ldquo;{quote}&rdquo;
      </p>

      <p className="text-xs text-gray-500 mt-3 text-right">— {author}</p>
    </div>
  );
}
