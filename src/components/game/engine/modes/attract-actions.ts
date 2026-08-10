/**
 * Title attract menu action resolution (pure).
 * Game maps action ids → side effects.
 */

import {
  titleMenuLen,
  titleMenuYs,
  titleHitHeights,
  type TitleSub,
} from "./title-menu";

export type AttractAction =
  | { type: "account" }
  | { type: "side_back_extra" }
  | { type: "side_back_diff" }
  | { type: "side_options" }
  | { type: "side_extra" }
  | { type: "open_diff"; preferNormal: boolean }
  | { type: "share" }
  | { type: "inbox" }
  | { type: "options" }
  | { type: "open_extra" }
  | { type: "changelog" }
  | { type: "start_easy" }
  | { type: "start_normal" }
  | { type: "back_root"; cursor: number }
  | { type: "sound_test" }
  | { type: "profile" }
  | { type: "stats" }
  | { type: "noop" };

/** LINK button top-right on attract */
export function attractAccountHit(x: number, y: number): boolean {
  return x >= 210 && x <= 268 && y >= 4 && y <= 28;
}

export function attractMenuIndexAt(
  sub: TitleSub,
  y: number,
  Z: number,
): number {
  const ys = titleMenuYs(sub, Z);
  const hs = titleHitHeights(sub);
  const len = titleMenuLen(sub);
  for (let i = 0; i < len; i++) {
    if (y >= ys[i] - 2 && y <= ys[i] + hs[i]) return i;
  }
  return -1;
}

/** Action for a menu index (or current cursor when index < 0 → use cursor). */
export function attractActionForIndex(
  sub: TitleSub,
  index: number,
  cursor: number,
  difficulty: "easy" | "normal" | string,
): AttractAction {
  const i = index >= 0 ? index : cursor;

  if (sub === "extra") {
    if (i === 0) return { type: "sound_test" };
    if (i === 1) return { type: "profile" };
    if (i === 2) return { type: "stats" };
    return { type: "back_root", cursor: 4 };
  }

  if (sub === "diff") {
    if (i === 0) return { type: "start_easy" };
    if (i === 1) return { type: "start_normal" };
    return { type: "back_root", cursor: 0 };
  }

  // root
  if (i === 0)
    return {
      type: "open_diff",
      preferNormal: difficulty === "normal",
    };
  if (i === 1) return { type: "share" };
  if (i === 2) return { type: "inbox" };
  if (i === 3) return { type: "options" };
  if (i === 4) return { type: "open_extra" };
  if (i === 5) return { type: "changelog" };
  return { type: "noop" };
}

/** Full pointer resolve: account → side rails → menu hit → empty confirm */
export function resolveAttractPointer(opts: {
  x: number;
  y: number;
  Z: number;
  left: number; // Cr
  right: number; // wr
  sub: TitleSub;
  cursor: number;
  difficulty: "easy" | "normal" | string;
}): { cursor?: number; action: AttractAction } {
  const { x, y, Z, left, right, sub, cursor, difficulty } = opts;

  if (attractAccountHit(x, y)) return { action: { type: "account" } };

  if (x < left || x > right) {
    if (sub === "extra") return { action: { type: "side_back_extra" } };
    if (sub === "diff") return { action: { type: "side_back_diff" } };
    if (x < left) return { action: { type: "side_options" } };
    return { action: { type: "side_extra" } };
  }

  const hit = attractMenuIndexAt(sub, y, Z);
  if (hit >= 0) {
    return {
      cursor: hit,
      action: attractActionForIndex(sub, hit, cursor, difficulty),
    };
  }

  // empty area = confirm current cursor
  return {
    action: attractActionForIndex(sub, -1, cursor, difficulty),
  };
}
