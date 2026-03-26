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

/**
 * Remove the solid "bg" layer (white circle backdrop) from every asset's
 * layer list so the animation renders on a transparent background.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripBackground(data: any): any {
  if (!data?.assets) return data;
  return {
    ...data,
    assets: data.assets.map((asset: any) => {
      if (!asset.layers) return asset;
      return {
        ...asset,
        layers: asset.layers.filter((l: any) => l.nm !== "bg" && l.ty !== 1),
      };
    }),
  };
}

/**
 * Apply theme primary colour to a Lottie animation JSON and remove the
 * solid background layer so it renders transparently over any backdrop.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLottieTheme(animationData: any, theme: Theme): any {
  const target = THEME_PRIMARY[theme] ?? THEME_PRIMARY["detrimental-dark"];

  // 1. Swap the accent colour
  const recoloured = replaceColor(BASE_ACCENT, target, animationData);

  // 2. Strip the solid white background layer
  return stripBackground(recoloured);
}
