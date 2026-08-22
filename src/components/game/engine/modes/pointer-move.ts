/**
 * JPDOC: スワイプ追従。
 */
/**
 * Pointer-move mode routing (recovered pa).
 */

export type PointerMoveRoute =
  | { type: "options_drag" }
  | { type: "shop_drag" }
  | { type: "soundtest_drag" }
  | { type: "changelog_drag" }
  | { type: "vstick" }
  | { type: "swipe_follow" }
  | { type: "none" };

export function routePointerMove(opts: {
  mode: string;
  optionsDragging: boolean;
  shopDragging: boolean;
  soundtestDragging: boolean;
  changelogDragging: boolean;
  vstickEnabled: boolean;
  vstickActive: boolean;
  swipeActive: boolean;
}): PointerMoveRoute {
  const p = opts.mode;
  if (p === "options" && opts.optionsDragging) return { type: "options_drag" };
  if (p === "shop" && opts.shopDragging) return { type: "shop_drag" };
  if (p === "soundtest" && opts.soundtestDragging) return { type: "soundtest_drag" };
  if (p === "changelog" && opts.changelogDragging) return { type: "changelog_drag" };
  if (opts.vstickEnabled && opts.vstickActive) return { type: "vstick" };
  if (opts.swipeActive) return { type: "swipe_follow" };
  return { type: "none" };
}

export function clampSwipeFollow(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(58, Math.min(262, x)),
    y: Math.max(36, Math.min(382, y)),
  };
}
