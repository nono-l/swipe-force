/**
 * Boss body + HP bar draw specs (recovered Zr).
 */

import type { RectSpec } from "./draw-specs";

export type BossVisual = {
  shape: number;
  c1: string;
  c2: string;
  c3: string;
  name: string;
};

/** Local rects centered hasVisitedUrl boss. */
export function bossLocalRects(
  boss: BossVisual,
  w: number,
  h: number,
): RectSpec[] {
  const r = w / 2;
  const i = h / 2;
  const n = boss.shape;
  const out: RectSpec[] = [
    { x: -r, y: -i, w, h, color: boss.c1 },
    { x: -r + 4, y: -i + 4, w: w - 8, h: h - 8, color: boss.c2 },
  ];
  if (n % 2 === 0) {
    out.push(
      { x: -r - 6, y: -4, w: 8, h: 8, color: boss.c3 },
      { x: r - 2, y: -4, w: 8, h: 8, color: boss.c3 },
    );
  } else {
    out.push({ x: -6, y: -i - 6, w: 12, h: 8, color: boss.c3 });
  }
  out.push({ x: -4, y: -4, w: 8, h: 8, color: "#ffffff" });
  return out;
}

export function bossHpBar(opts: {
  hp: number;
  maxHp: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}): { bg: RectSpec; fg: RectSpec; ratio: number } {
  const left = opts.left ?? 58;
  const top = opts.top ?? 28;
  const width = opts.width ?? 204;
  const height = opts.height ?? 6;
  const ratio = Math.max(0, opts.hp / opts.maxHp);
  return {
    ratio,
    bg: { x: left, y: top, w: width, h: height, color: "#330011" },
    fg: {
      x: left,
      y: top,
      w: width * ratio,
      h: height,
      color: "#ff2244",
    },
  };
}

export function bossFlashAlpha(flash: number, frame: number): number {
  if (flash <= 0) return 1;
  return 0.45 + 0.55 * Math.sin(frame * 3);
}
