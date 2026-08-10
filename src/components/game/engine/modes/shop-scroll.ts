/**
 * Shop list cursor scroll (recovered ra / ta / ea).
 */

import { dragScrollSteps } from "./sound-test-pointer";

export function shopCursorMax(catalogLen: number): number {
  return catalogLen + 2; // items + GO + OPT + SHARE
}

export function shopCursorStep(
  cursor: number,
  delta: number,
  catalogLen: number,
): number {
  const t = shopCursorMax(catalogLen);
  return Math.max(0, Math.min(t, cursor + delta));
}

/** Vertical-dominant drag → cursor steps of 16px. */
export function shopDragScroll(opts: {
  dx: number;
  dy: number;
  accum: number;
  stepPx?: number;
}): { accum: number; steps: number; vertical: boolean } {
  const step = opts.stepPx ?? 16;
  if (Math.abs(opts.dy) < Math.abs(opts.dx) * 0.65) {
    return { accum: opts.accum, steps: 0, vertical: false };
  }
  const scr = dragScrollSteps(opts.accum, opts.dy, step);
  return { accum: scr.accum, steps: scr.steps, vertical: true };
}
