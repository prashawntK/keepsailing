import { replaceColor } from "lottie-colorify";
import type { Theme } from "@/components/providers/ThemeProvider";

// ─── timership accent recolouring ────────────────────────────────────────────

const THEME_PRIMARY: Record<Theme, [number, number, number]> = {
  "detrimental-dark": [99,  102, 241],
  "lucid-light":      [79,   70, 229],
  "plausible-purple": [168,  85, 247],
  "original-orange":  [249, 115,  22],
  "amber-noir":       [249, 115,  22],
  "charcoal-black":   [148, 163, 184],
};
const BASE_ACCENT: [number, number, number] = [121, 127, 247]; // #797ff7 in timership

// ─── newship source colours (extracted from newship.json) ────────────────────

const SRC = {
  // water
  darkWater:  [115, 179, 212] as [number, number, number], // #73b3d4
  midWater:   [139, 197, 226] as [number, number, number], // #8bc5e2
  lightWater: [163, 213, 238] as [number, number, number], // #a3d5ee
  // sky
  sky1:       [232, 237, 249] as [number, number, number], // #e8edf9
  sky2:       [218, 224, 238] as [number, number, number], // #dae0ee
  sky3:       [236, 239, 247] as [number, number, number], // #eceff7
  // sun
  sunCore:    [255, 203, 117] as [number, number, number], // #ffcb75
  sunGlow1:   [255, 246, 223] as [number, number, number], // #fff6df
  sunGlow2:   [255, 250, 237] as [number, number, number], // #fffaed
  // birds
  birdDark:   [116, 116, 116] as [number, number, number], // #747474
  birdMid:    [141, 141, 141] as [number, number, number], // #8d8d8d
};

type ScenePalette = {
  darkWater:  [number, number, number];
  midWater:   [number, number, number];
  lightWater: [number, number, number];
  sky1:       [number, number, number];
  sky2:       [number, number, number];
  sky3:       [number, number, number];
  sunCore:    [number, number, number];
  sunGlow1:   [number, number, number];
  sunGlow2:   [number, number, number];
  birdDark:   [number, number, number];
  birdMid:    [number, number, number];
};

const NEWSHIP_PALETTE: Record<Theme, ScenePalette> = {
  "detrimental-dark": {
    // deep navy ocean + near-black sky + indigo moonrise + ghostly birds
    darkWater:  [ 40,  52, 128],
    midWater:   [ 58,  74, 165],
    lightWater: [ 82, 102, 200],
    sky1:       [ 12,  15,  42],
    sky2:       [ 10,  12,  34],
    sky3:       [ 15,  18,  50],
    sunCore:    [165, 180, 252],   // soft indigo "moon"
    sunGlow1:   [ 30,  35,  90],
    sunGlow2:   [ 22,  27,  72],
    birdDark:   [129, 140, 248],   // indigo birds
    birdMid:    [165, 175, 255],
  },
  "lucid-light": {
    // bright daylight — natural blue ocean, warm golden sun, slate birds
    darkWater:  [ 85, 148, 200],
    midWater:   [115, 175, 218],
    lightWater: [150, 205, 235],
    sky1:       [215, 228, 248],
    sky2:       [205, 218, 240],
    sky3:       [220, 232, 250],
    sunCore:    [251, 191,  36],   // golden sun
    sunGlow1:   [254, 240, 190],
    sunGlow2:   [255, 247, 215],
    birdDark:   [ 71,  85, 105],   // dark slate birds
    birdMid:    [ 95, 112, 135],
  },
  "plausible-purple": {
    // violet dusk — purple sea, near-black sky, magenta sun, lavender birds
    darkWater:  [ 72,  28, 138],
    midWater:   [ 98,  48, 168],
    lightWater: [130,  82, 202],
    sky1:       [ 14,   8,  36],
    sky2:       [ 11,   6,  28],
    sky3:       [ 17,  10,  44],
    sunCore:    [232, 121, 249],   // pink/magenta sun
    sunGlow1:   [ 40,  12,  70],
    sunGlow2:   [ 30,   8,  55],
    birdDark:   [216, 180, 254],   // lavender birds
    birdMid:    [233, 210, 255],
  },
  "original-orange": {
    // golden-hour sunset — amber sea, deep dusk sky, blazing sun, warm birds
    darkWater:  [155,  75,  18],
    midWater:   [198, 108,  32],
    lightWater: [232, 148,  58],
    sky1:       [ 34,  14,   4],
    sky2:       [ 26,  10,   3],
    sky3:       [ 42,  18,   6],
    sunCore:    [251, 146,  60],   // orange sun
    sunGlow1:   [ 80,  28,   5],
    sunGlow2:   [ 60,  20,   3],
    birdDark:   [254, 215, 170],   // warm peach birds
    birdMid:    [255, 230, 200],
  },
  "amber-noir": {
    // noir midnight gold — dark amber water, almost-black sky, amber sun
    darkWater:  [115,  65,  12],
    midWater:   [155,  95,  22],
    lightWater: [195, 135,  42],
    sky1:       [ 18,  10,   2],
    sky2:       [ 14,   8,   2],
    sky3:       [ 22,  13,   3],
    sunCore:    [245, 158,  11],   // amber sun
    sunGlow1:   [ 55,  28,   3],
    sunGlow2:   [ 40,  20,   2],
    birdDark:   [253, 230, 138],   // amber-lit birds
    birdMid:    [255, 240, 170],
  },
  "charcoal-black": {
    // moonlit slate — cool grey water, charcoal sky, silver moon, pale birds
    darkWater:  [ 42,  58,  76],
    midWater:   [ 60,  80, 104],
    lightWater: [ 82, 108, 135],
    sky1:       [ 16,  20,  26],
    sky2:       [ 13,  16,  21],
    sky3:       [ 20,  24,  31],
    sunCore:    [226, 232, 240],   // silver moon
    sunGlow1:   [ 30,  36,  44],
    sunGlow2:   [ 24,  28,  36],
    birdDark:   [148, 163, 184],   // slate birds
    birdMid:    [175, 188, 204],
  },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSolidBg(l: any) { return l.ty === 1; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripBackground(data: any): any {
  return {
    ...data,
    layers: data.layers?.filter((l: any) => !isSolidBg(l)),
    assets: data.assets?.map((asset: any) => {
      if (!asset.layers) return asset;
      return { ...asset, layers: asset.layers.filter((l: any) => !isSolidBg(l)) };
    }),
  };
}

// ─── public API ──────────────────────────────────────────────────────────────

/** timership.json — recolour accent + strip bg */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLottieTheme(animationData: any, theme: Theme): any {
  const target = THEME_PRIMARY[theme] ?? THEME_PRIMARY["detrimental-dark"];
  return stripBackground(replaceColor(BASE_ACCENT, target, animationData));
}

/**
 * newship.json — recolour water, sky, sun, and birds to match the active
 * theme. Results are cached per-theme at the call site (TimerFocusModal).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyNewshipTheme(animationData: any, theme: Theme): any {
  const p = NEWSHIP_PALETTE[theme] ?? NEWSHIP_PALETTE["detrimental-dark"];
  let d = animationData;
  // water
  d = replaceColor(SRC.darkWater,  p.darkWater,  d);
  d = replaceColor(SRC.midWater,   p.midWater,   d);
  d = replaceColor(SRC.lightWater, p.lightWater, d);
  // sky
  d = replaceColor(SRC.sky1,       p.sky1,       d);
  d = replaceColor(SRC.sky2,       p.sky2,       d);
  d = replaceColor(SRC.sky3,       p.sky3,       d);
  // sun
  d = replaceColor(SRC.sunCore,    p.sunCore,    d);
  d = replaceColor(SRC.sunGlow1,   p.sunGlow1,   d);
  d = replaceColor(SRC.sunGlow2,   p.sunGlow2,   d);
  // birds
  d = replaceColor(SRC.birdDark,   p.birdDark,   d);
  d = replaceColor(SRC.birdMid,    p.birdMid,    d);
  return d;
}

/** strip bg only — for animations with their own palette */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stripLottieBackground(animationData: any): any {
  return stripBackground(animationData);
}
