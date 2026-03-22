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
    return <div className="h-20 animate-pulse" />;
  }

  if (!quote) return null;

  // ── DESIGN 5: Negative space ───────────────────────────────────────────────
  return (
    <div className="py-6 px-2 text-center">
      <p className="text-sm leading-relaxed text-gray-500 mb-6">{quote}</p>
      <p className="text-[10px] tracking-widest text-gray-600 text-right">— {author}</p>
    </div>
  );
}
