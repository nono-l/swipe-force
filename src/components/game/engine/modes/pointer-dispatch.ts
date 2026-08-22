/**
 * JPDOC: ポインタをモード別に振る。
 */
/**
 * Pointer-down mode routing (recovered fa pure decisions).
 */

export type PointerMode =
  | "attract"
  | "changelog"
  | "soundtest"
  | "options"
  | "shop"
  | "gameover"
  | "name"
  | "inbox"
  | "playing"
  | "ready"
  | "bossintro"
  | string;

export type PointerRoute =
  | { type: "mute" }
  | { type: "mode"; mode: PointerMode }
  | { type: "play_side"; left: boolean; upper: boolean; slot: 0 | 1 | 2 }
  | { type: "play_move" }
  | { type: "none" };

export function routePointerDown(opts: {
  mode: PointerMode;
  x: number;
  y: number;
  left: number;
  right: number;
  muteHit: boolean;
}): PointerRoute {
  const p = opts.mode;
  if (
    p !== "attract" &&
    p !== "options" &&
    p !== "shop" &&
    opts.muteHit
  ) {
    return { type: "mute" };
  }

  if (
    p === "attract" ||
    p === "changelog" ||
    p === "soundtest" ||
    p === "options" ||
    p === "shop" ||
    p === "bag" ||
    p === "stageselect" ||
    p === "gameover" ||
    p === "name" ||
    p === "inbox"
  ) {
    return { type: "mode", mode: p };
  }

  if (p === "playing" || p === "ready" || p === "bossintro") {
    if (opts.x < opts.left || opts.x > opts.right) {
      const slot: 0 | 1 | 2 = opts.y < 90 ? 0 : opts.y < 140 ? 1 : 2;
      return {
        type: "play_side",
        left: opts.x < opts.left,
        upper: slot === 0,
        slot,
      };
    }
    return { type: "play_move" };
  }

  return { type: "none" };
}

export type NameEntryHit = "side_back" | "letter_prev" | "letter_next" | "letter_advance";

export function nameEntryHit(
  x: number,
  fieldW: number,
  left: number,
  right: number,
): NameEntryHit {
  if (x < left || x > right) return "side_back";
  if (x < fieldW / 3) return "letter_prev";
  if (x > (fieldW * 2) / 3) return "letter_next";
  return "letter_advance";
}

export type PlayMoveSeed = {
  vstick: boolean;
  stickX: number;
  stickY: number;
  followX: number;
  followY: number;
};

export function playMoveFromPointer(opts: {
  x: number;
  y: number;
  vstick: boolean;
}): PlayMoveSeed {
  if (opts.vstick) {
    return {
      vstick: true,
      stickX: Math.max(78, Math.min(242, opts.x)),
      stickY: Math.max(70, Math.min(380, opts.y)),
      followX: 0,
      followY: 0,
    };
  }
  return {
    vstick: false,
    stickX: 0,
    stickY: 0,
    followX: Math.max(58, Math.min(262, opts.x)),
    followY: Math.max(36, Math.min(382, opts.y)),
  };
}
