/**
 * Player ship + option pods draw specs.
 */

import type { RectSpec } from "./draw-specs";

/** Relative triangle points for ship (path). */
export const PLAYER_SHIP_PATH: readonly [number, number][] = [
  [0, -8],
  [7, 6],
  [3, 3],
  [0, 7],
  [-3, 3],
  [-7, 6],
];

export const PLAYER_SHIP_FILL = "#44ff88";

/** Local rects on ship (cockpit + engines). */
export function playerShipLocalRects(): RectSpec[] {
  return [
    { x: -2, y: -3, w: 4, h: 4, color: "#ffffff" },
    { x: -5, y: 5, w: 3, h: 4, color: "#ff8800" },
    { x: 2, y: 5, w: 3, h: 4, color: "#ff8800" },
  ];
}

/** Option pod rects in world space. */
export function optionPodRects(
  px: number,
  py: number,
  optionLevel: number,
): RectSpec[] {
  const out: RectSpec[] = [];
  if (optionLevel >= 1) {
    out.push(
      { x: px - 18, y: py - 2, w: 6, h: 6, color: "#88ff88" },
      { x: px - 16, y: py, w: 2, h: 2, color: "#fff" },
    );
  }
  if (optionLevel >= 2) {
    out.push(
      { x: px + 12, y: py - 2, w: 6, h: 6, color: "#88ff88" },
      { x: px + 14, y: py, w: 2, h: 2, color: "#fff" },
    );
  }
  return out;
}

export type VStickLayout = {
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
  alpha: number;
  knobAlpha: number;
  radius: number;
  innerR: number;
  knobR: number;
};

export function virtualStickLayout(opts: {
  active: boolean;
  centerX: number;
  centerY: number;
  axisX: number;
  axisY: number;
  idleX?: number;
  idleY?: number;
}): VStickLayout {
  const e = opts.active ? opts.centerX : (opts.idleX ?? 86);
  const t = opts.active ? opts.centerY : (opts.idleY ?? 346);
  return {
    baseX: e,
    baseY: t,
    knobX: opts.active ? e + opts.axisX * 30 : e,
    knobY: opts.active ? t + opts.axisY * 30 : t,
    alpha: opts.active ? 0.55 : 0.28,
    knobAlpha: opts.active ? 0.75 : 0.4,
    radius: 30,
    innerR: 13.5,
    knobR: 11,
  };
}
