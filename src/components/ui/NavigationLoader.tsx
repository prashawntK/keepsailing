"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import shipAnimation from "../../../public/animations/ship-sailing.json";
import { useTheme } from "@/components/providers/ThemeProvider";

const QUOTES = [
  // ── Zen & presence ─────────────────────────────────────────────────────────
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "When walking, walk. When eating, eat.", author: "Zen proverb" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Be where you are, not where you think you should be.", author: null },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
  { text: "Sit quietly. Do nothing. Spring comes, and the grass grows by itself.", author: "Zen proverb" },
  { text: "Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.", author: "Zen proverb" },
  { text: "The obstacle is the path.", author: "Zen proverb" },
  { text: "No snowflake ever falls in the wrong place.", author: "Zen proverb" },

  // ── Discipline & consistency ───────────────────────────────────────────────
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "A river cuts through rock not because of its power, but because of its persistence.", author: null },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" },
  { text: "Dripping water hollows out stone, not through force but through persistence.", author: "Ovid" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },

  // ── Focus & clarity ────────────────────────────────────────────────────────
  { text: "Focus is the art of knowing what to ignore.", author: null },
  { text: "The secret is not to prioritise your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { text: "Clarity about what matters provides clarity about what does not.", author: "Cal Newport" },
  { text: "It is not enough to be busy. The question is: what are we busy about?", author: "Henry David Thoreau" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "The ability to simplify means to eliminate the unnecessary so that the necessary may speak.", author: "Hans Hofmann" },
  { text: "Besides the noble art of getting things done, there is the noble art of leaving things undone.", author: "Lin Yutang" },
  { text: "One thing done well beats ten things done halfway.", author: null },
  { text: "If you chase two rabbits, you will catch neither one.", author: "Russian proverb" },

  // ── Time & mortality ───────────────────────────────────────────────────────
  { text: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca" },
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },
  { text: "The bad news is time flies. The good news is you're the pilot.", author: "Michael Altshuler" },
  { text: "Your future self is watching. What are you doing today?", author: null },
  { text: "You may delay, but time will not.", author: "Benjamin Franklin" },
  { text: "Time is what we want most but what we use worst.", author: "William Penn" },
  { text: "An inch of time is an inch of gold, but an inch of gold cannot buy an inch of time.", author: "Chinese proverb" },
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { text: "Until you value yourself, you will not value your time.", author: "M. Scott Peck" },

  // ── Growth & becoming ──────────────────────────────────────────────────────
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { text: "The bamboo that bends is stronger than the oak that resists.", author: "Japanese proverb" },
  { text: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt" },
  { text: "The best time to plant a tree was twenty years ago. The second best time is now.", author: "Chinese proverb" },
  { text: "Vision without action is a daydream. Action without vision is a nightmare.", author: "Japanese proverb" },
  { text: "He who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Progress, not perfection.", author: null },

  // ── Stillness & inner peace ────────────────────────────────────────────────
  { text: "Muddy water, let stand, becomes clear.", author: "Lao Tzu" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "In the pursuit of knowledge, every day something is added. In the pursuit of wisdom, every day something is dropped.", author: "Lao Tzu" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "Tension is who you think you should be. Relaxation is who you are.", author: "Chinese proverb" },
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
  { text: "Silence is a source of great strength.", author: "Lao Tzu" },
  { text: "To a mind that is still, the whole universe surrenders.", author: "Lao Tzu" },
  { text: "Within you there is a stillness and sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },

  // ── Courage & action ───────────────────────────────────────────────────────
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Do the hard thing first. Everything else gets easier.", author: null },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Knowing is not enough. We must apply. Willing is not enough. We must do.", author: "Bruce Lee" },
  { text: "If not now, when?", author: "Hillel the Elder" },
  { text: "The man who removes a mountain begins by carrying away small stones.", author: "Chinese proverb" },
  { text: "Begin anywhere.", author: "John Cage" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },

  // ── Perspective & wisdom ───────────────────────────────────────────────────
  { text: "The compass matters more than the map.", author: null },
  { text: "He who knows that enough is enough will always have enough.", author: "Lao Tzu" },
  { text: "When you realise nothing is lacking, the whole world belongs to you.", author: "Lao Tzu" },
  { text: "Not everything that counts can be counted, and not everything that can be counted counts.", author: "William Bruce Cameron" },
  { text: "The frog does not drink up the pond in which it lives.", author: "Native American proverb" },
  { text: "The shoe that fits one person pinches another. There is no universal recipe for living.", author: "Carl Jung" },
  { text: "What the caterpillar calls the end of the world, the master calls a butterfly.", author: "Richard Bach" },
  { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
  { text: "Everything has beauty, but not everyone sees it.", author: "Confucius" },
  { text: "The things you own end up owning you.", author: "Chuck Palahniuk" },

  // ── Sailing & resilience ───────────────────────────────────────────────────
  { text: "You can't control the wind, but you can adjust your sails.", author: null },
  { text: "A ship in harbour is safe, but that is not what ships are built for.", author: "John A. Shedd" },
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott" },
  { text: "The pessimist complains about the wind. The optimist expects it to change. The realist adjusts the sails.", author: "William Arthur Ward" },
  { text: "Smooth seas do not make skillful sailors.", author: "African proverb" },
  { text: "Twenty years from now you will be more disappointed by the things you didn't do than the things you did.", author: "Mark Twain" },
  { text: "Only those who risk going too far can possibly find out how far one can go.", author: "T.S. Eliot" },
  { text: "The wind does not break a tree that bends.", author: "Sukuma proverb" },
  { text: "When everything seems to be going against you, remember that the airplane takes off against the wind.", author: "Henry Ford" },
  { text: "Storms don't last forever.", author: null },

  // ── Mindful productivity ───────────────────────────────────────────────────
  { text: "Productivity isn't doing more. It's doing what matters.", author: null },
  { text: "Show up consistently. That's the whole game.", author: null },
  { text: "Clarity before speed.", author: null },
  { text: "It's not about having time. It's about making time.", author: null },
  { text: "Small daily improvements lead to stunning long-term results.", author: null },
  { text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", author: "Stephen King" },
  { text: "Work expands so as to fill the time available for its completion.", author: "Cyril Northcote Parkinson" },
  { text: "The least productive people are usually the ones who are most in favour of holding meetings.", author: "Thomas Sowell" },
  { text: "Being busy is a form of laziness — lazy thinking and indiscriminate action.", author: "Tim Ferriss" },
  { text: "There is nothing so useless as doing efficiently that which should not be done at all.", author: "Peter Drucker" },
];

// Watermark words cycling per section
const SECTION_WORDS: Record<string, string> = {
  "/": "TODAY",
  "/goals": "GOALS",
  "/stats": "STATS",
  "/settings": "SETTINGS",
};

const DISPLAY_MS = 2000; // show for 2 seconds on home

// Prefetch data for other pages so they load instantly
function prefetchOtherPages() {
  const today = new Date().toISOString().slice(0, 10);
  const endpoints = [
    "/api/goals",
    "/api/extra-curriculars",
    "/api/chores",
    "/api/stats/overview?period=week",
    "/api/stats/charts?type=daily_scores&period=week",
    "/api/settings",
  ];
  endpoints.forEach((url) => {
    fetch(url).catch(() => {}); // fire and forget — warms up cache + serverless
  });
}

export function NavigationLoader() {
  const { theme } = useTheme();
  const isLight = theme === "lucid-light";
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const [show, setShow] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [word, setWord] = useState("SAIL");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownInitial = useRef(false);

  // Show on initial app load (home)
  useEffect(() => {
    if (pathname === "/" && !hasShownInitial.current) {
      hasShownInitial.current = true;
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
      setWord("TODAY");
      setShow(true);
      prefetchOtherPages();
      timerRef.current = setTimeout(() => setShow(false), DISPLAY_MS);
    }
  }, [pathname]);

  // Show when navigating TO home (not initial load)
  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (pathname === prevPathRef.current) return;

    prevPathRef.current = pathname;

    // Only show on home route
    if (pathname !== "/") return;

    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setWord("TODAY");
    setShow(true);
    prefetchOtherPages();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), DISPLAY_MS);
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

          {/* Ship animation + quote */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4 px-8 max-w-sm text-center"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.06 }}
          >
            {/* Ship Lottie */}
            <div className="w-48 h-48 -mb-4">
              <Lottie
                animationData={shipAnimation}
                loop
                autoPlay
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {/* Quote */}
            <div className="space-y-3">
              <p className={`text-lg font-medium leading-snug ${isLight ? "text-gray-700" : "text-gray-200"}`}>
                &ldquo;{quote.text}&rdquo;
              </p>
              {quote.author && (
                <p className={`text-xs tracking-wide ${isLight ? "text-gray-400" : "text-gray-500"}`}>— {quote.author}</p>
              )}
            </div>
          </motion.div>

          {/* Wind streaks */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{
                top: `${15 + i * 14}%`,
                left: "-10%",
                width: `${30 + Math.random() * 25}%`,
                height: "1px",
                background: isLight
                  ? `linear-gradient(90deg, transparent 0%, rgba(0,0,0,${0.04 + (i % 3) * 0.02}) 40%, transparent 100%)`
                  : `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${0.03 + (i % 3) * 0.015}) 40%, transparent 100%)`,
              }}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: "140vw", opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 1.2 + i * 0.15,
                delay: 0.05 + i * 0.08,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
