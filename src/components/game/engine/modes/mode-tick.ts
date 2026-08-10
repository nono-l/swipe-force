/**
 * Non-playing mode transitions each frame (recovered Ki early branches).
 */

export type ModeTick =
  | { type: "menu_idle" }
  | { type: "countdown_to_playing"; readyLeft: number }
  | { type: "stageclear_to_shop"; readyLeft: number; openShop: boolean }
  | { type: "gameover_poll"; pollCoins: boolean }
  | { type: "name_blink" }
  | { type: "inbox_idle" }
  | { type: "play" };

export function tickMode(opts: {
  mode: string;
  readyFrames: number;
  frame: number;
}): ModeTick {
  const p = opts.mode;
  if (
    p === "attract" ||
    p === "shop" ||
    p === "options" ||
    p === "soundtest" ||
    p === "changelog"
  ) {
    return { type: "menu_idle" };
  }
  if (p === "ready" || p === "bossintro") {
    const left = opts.readyFrames - 1;
    return { type: "countdown_to_playing", readyLeft: left };
  }
  if (p === "stageclear") {
    const left = opts.readyFrames - 1;
    return {
      type: "stageclear_to_shop",
      readyLeft: left,
      openShop: left <= 0,
    };
  }
  if (p === "gameover") {
    return { type: "gameover_poll", pollCoins: opts.frame % 90 === 0 };
  }
  if (p === "name") return { type: "name_blink" };
  if (p === "inbox") return { type: "inbox_idle" };
  return { type: "play" };
}
