import { NextResponse } from "next/server";

// Cache the quote for the calendar day (server-side)
let cached: { date: string; quote: string; author: string } | null = null;

const FALLBACK_QUOTES = [
  { quote: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
];

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  if (cached?.date === today) {
    return NextResponse.json({ quote: cached.quote, author: cached.author });
  }

  try {
    const res = await fetch("https://zenquotes.io/api/today", {
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const data = await res.json();
      const { q: quote, a: author } = data[0];
      cached = { date: today, quote, author };
      return NextResponse.json({ quote, author });
    }
  } catch {
    // fall through to fallback
  }

  // Deterministic fallback: pick by day-of-year so it still rotates
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const fallback = FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
  cached = { date: today, ...fallback };
  return NextResponse.json(fallback);
}
