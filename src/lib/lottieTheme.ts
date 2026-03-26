import { replaceColor } from "lottie-colorify";
import type { Theme } from "@/components/providers/ThemeProvider";

// Primary accent color per theme [R, G, B]
const THEME_PRIMARY: Record<Theme, [number, number, number]> = {
  "detrimental-dark": [99, 102, 241],   // #6366F1 indigo
  "lucid-light":      [79, 70, 229],    // #4F46E5 indigo (darker for light bg)
  "plausible-purple": [168, 85, 247],   // #a855f7 purple
  "original-orange":  [249, 115, 22],   // #F97316 orange
  "amber-noir":       [249, 115, 22],   // #F97316 orange
  "charcoal-black":   [148, 163, 184],  // #94A3B8 slate
};

// The main indigo accent in timership.json to replace with the theme colour
const BASE_ACCENT: [number, number, number] = [121, 127, 247]; // #797ff7

// The two navy background/sky colours in timership.json
// We replace them with pure black so mix-blend-mode:screen makes them vanish.
const NAVY_COLORS: Array<[number, number, number]> = [
  [26, 43, 149],  // #1a2b95
  [27, 44, 150],  // #1b2c96
];
const BLACK: [number, number, number] = [0, 0, 0];

/**
 * Apply theme primary colour to a Lottie animation JSON and strip the
 * navy background so it becomes transparent via mix-blend-mode:screen.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLottieTheme(animationData: any, theme: Theme): any {
  const target = THEME_PRIMARY[theme] ?? THEME_PRIMARY["detrimental-dark"];

  // 1. Swap accent colour
  let result = replaceColor(BASE_ACCENT, target, animationData);

  // 2. Replace both navy background shades with black
  //    (screen blend mode then makes them fully transparent)
  for (const navy of NAVY_COLORS) {
    result = replaceColor(navy, BLACK, result);
  }

  return result;
}
