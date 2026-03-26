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

/** Returns true for any solid-colour background layer */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSolidBg(l: any) { return l.ty === 1; }

/**
 * Remove solid background layers from both top-level layers and every
 * asset's layer list so the animation renders on a transparent background.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripBackground(data: any): any {
  return {
    ...data,
    // Strip from top-level layers
    layers: data.layers?.filter((l: any) => !isSolidBg(l)),
    // Strip from asset compositions
    assets: data.assets?.map((asset: any) => {
      if (!asset.layers) return asset;
      return { ...asset, layers: asset.layers.filter((l: any) => !isSolidBg(l)) };
    }),
  };
}

/**
 * Apply theme primary colour to a Lottie animation JSON and remove the
 * solid background layer so it renders transparently over any backdrop.
 * Used for animations that contain the #797ff7 indigo accent (timership).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLottieTheme(animationData: any, theme: Theme): any {
  const target = THEME_PRIMARY[theme] ?? THEME_PRIMARY["detrimental-dark"];
  const recoloured = replaceColor(BASE_ACCENT, target, animationData);
  return stripBackground(recoloured);
}

/**
 * Strip the solid background layer only — for animations with their own
 * colour palette that shouldn't be recoloured (e.g. ship3).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripLottieBackground(animationData: any): any {
  return stripBackground(animationData);
}
