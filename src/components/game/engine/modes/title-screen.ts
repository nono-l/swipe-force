/**
 * Title attract layout bits (recovered fi pure).
 */

export function titleNoiseDot(
  left: number,
  width: number,
  height: number,
): { x: number; y: number; g: number } {
  const x = left + Math.random() * width;
  const y = Math.random() * height;
  const n = 100 + Math.random() * 120;
  return { x, y, g: n };
}

export function titleNoiseRgb(g: number): string {
  return `rgb(0,${g | 0},${(g * 0.35) | 0})`;
}

export type TitleHeader = {
  title: string;
  tagline: string;
  credit: string;
  versionLine: string;
};

export function titleHeader(version: string): TitleHeader {
  return {
    title: "SWIPE FORCE",
    tagline: "RETRO VERTICAL SHOOTER",
    credit: `${version} · Grok Build iOS`,
    versionLine: "v1.5 · 連携特典は EXTRA へ",
  };
}

export function continueCoinLine(coins: number): {
  text: string;
  color: string;
} {
  return {
    text: `CONTINUE COIN  ×${coins}`,
    color: coins > 0 ? "#ffee88" : "#887744",
  };
}

export function titleFooter(): { left: string; right: string } {
  return {
    left: "Grok Build iOS",
    right: "電気通信事業者 届出済",
  };
}
