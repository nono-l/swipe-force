/**
 * JPDOC: 仮想スティック描画。
 */
/**
 * Virtual stick canvas paint ops (recovered ni).
 */

import type { VStickLayout } from "./draw-player";

export type VStickDrawOp =
  | { type: "save" }
  | { type: "restore" }
  | { type: "alpha"; a: number }
  | { type: "strokeStyle"; c: string }
  | { type: "fillStyle"; c: string }
  | { type: "lineWidth"; w: number }
  | { type: "arc"; x: number; y: number; r: number; stroke?: boolean; fill?: boolean }
  | { type: "cross"; x: number; y: number; r: number };

export function vstickDrawOps(
  lay: VStickLayout,
  active: boolean,
): VStickDrawOp[] {
  const ops: VStickDrawOp[] = [
    { type: "save" },
    { type: "alpha", a: lay.alpha },
    { type: "strokeStyle", c: "#44ffaa" },
    { type: "lineWidth", w: 2 },
    { type: "arc", x: lay.baseX, y: lay.baseY, r: lay.radius, stroke: true },
    { type: "strokeStyle", c: "#226644" },
    { type: "arc", x: lay.baseX, y: lay.baseY, r: lay.innerR, stroke: true },
    { type: "strokeStyle", c: "#338855" },
    { type: "lineWidth", w: 1 },
    { type: "cross", x: lay.baseX, y: lay.baseY, r: lay.radius },
    { type: "alpha", a: lay.knobAlpha },
    { type: "fillStyle", c: active ? "#88ffcc" : "#44aa77" },
    {
      type: "arc",
      x: lay.knobX,
      y: lay.knobY,
      r: lay.knobR,
      fill: true,
    },
    { type: "strokeStyle", c: "#ffffff" },
    { type: "lineWidth", w: 1 },
    {
      type: "arc",
      x: lay.knobX,
      y: lay.knobY,
      r: lay.knobR,
      stroke: true,
    },
    { type: "restore" },
  ];
  return ops;
}

export function vstickVisible(
  vstickEnabled: boolean,
  mode: string,
): boolean {
  if (!vstickEnabled) return false;
  return mode === "playing" || mode === "ready" || mode === "bossintro";
}
