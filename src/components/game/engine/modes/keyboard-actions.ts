/**
 * JPDOC: キーボード。Esc は1段戻る。
 */
/**
 * Keyboard → high-level action ids by game mode (recovered ba pure core).
 * Side effects stay in the game loop.
 */

export type KeyAction =
  | { type: "mute_toggle" }
  | { type: "options_up" }
  | { type: "options_down" }
  | { type: "options_left" }
  | { type: "options_right" }
  | { type: "options_confirm" }
  | { type: "options_back" }
  | { type: "st_comments_up" }
  | { type: "st_comments_down" }
  | { type: "st_comments_write" }
  | { type: "st_comments_back" }
  | { type: "st_like" }
  | { type: "st_dislike" }
  | { type: "st_up" }
  | { type: "st_down" }
  | { type: "st_confirm" }
  | { type: "st_comments_open" }
  | { type: "st_escape" }
  | { type: "attract_up" }
  | { type: "attract_down" }
  | { type: "attract_confirm" }
  | { type: "attract_back" }
  | { type: "changelog_up" }
  | { type: "changelog_down" }
  | { type: "changelog_back" }
  | { type: "inbox_escape" }
  | { type: "inbox_up" }
  | { type: "inbox_down" }
  | { type: "inbox_confirm" }
  | { type: "inbox_delete" }
  | { type: "gameover_continue_or_share" }
  | { type: "gameover_share" }
  | { type: "gameover_title" }
  | { type: "pause_shop" }
  | { type: "open_options_play" }
  | { type: "open_bag_play" }
  | { type: "shop_up" }
  | { type: "shop_down" }
  | { type: "shop_confirm" }
  | { type: "shop_escape" }
  | { type: "bag_up" }
  | { type: "bag_down" }
  | { type: "bag_confirm" }
  | { type: "bag_back" }
  | { type: "stage_up" }
  | { type: "stage_down" }
  | { type: "stage_confirm" }
  | { type: "stage_back" }
  | { type: "none" };

function isUp(k: string) {
  return k === "ArrowUp" || k === "w" || k === "W";
}
function isDown(k: string) {
  return k === "ArrowDown" || k === "s" || k === "S";
}
function isLeft(k: string) {
  return k === "ArrowLeft" || k === "a" || k === "A";
}
function isRight(k: string) {
  return k === "ArrowRight" || k === "d" || k === "D";
}
function isConfirm(k: string) {
  return k === "Enter" || k === " ";
}

export function resolveKeyAction(opts: {
  key: string;
  mode: string;
  soundSub?: string; // A
  shopPaused?: boolean;
}): KeyAction {
  const k = opts.key;
  const p = opts.mode;

  if (k === "m" || k === "M") return { type: "mute_toggle" };

  if (p === "options") {
    if (isUp(k)) return { type: "options_up" };
    if (isDown(k)) return { type: "options_down" };
    if (isLeft(k)) return { type: "options_left" };
    if (isRight(k)) return { type: "options_right" };
    if (isConfirm(k)) return { type: "options_confirm" };
    if (k === "Escape") return { type: "options_back" };
    return { type: "none" };
  }

  if (p === "soundtest") {
    if (opts.soundSub === "comments") {
      if (isUp(k)) return { type: "st_comments_up" };
      if (isDown(k)) return { type: "st_comments_down" };
      if (isConfirm(k) || k === "c" || k === "C") return { type: "st_comments_write" };
      if (k === "Escape") return { type: "st_comments_back" };
      if (k === "l" || k === "L") return { type: "st_like" };
      if (k === "d" || k === "D") return { type: "st_dislike" };
      // note: original also had Escape/Backspace with tSub root logic which looked like a bug for soundtest
      return { type: "none" };
    }
    if (isUp(k)) return { type: "st_up" };
    if (isDown(k)) return { type: "st_down" };
    if (isConfirm(k)) return { type: "st_confirm" };
    if (k === "c" || k === "C") return { type: "st_comments_open" };
    if (k === "l" || k === "L") return { type: "st_like" };
    if (k === "d" || k === "D") return { type: "st_dislike" };
    if (k === "Escape") return { type: "st_escape" };
    return { type: "none" };
  }

  if (p === "attract") {
    if (isUp(k)) return { type: "attract_up" };
    if (isDown(k)) return { type: "attract_down" };
    if (isConfirm(k)) return { type: "attract_confirm" };
    if (k === "Escape" || k === "Backspace") return { type: "attract_back" };
    return { type: "none" };
  }

  if (p === "changelog") {
    if (isUp(k)) return { type: "changelog_up" };
    if (isDown(k)) return { type: "changelog_down" };
    if (k === "Escape" || isConfirm(k)) return { type: "changelog_back" };
    return { type: "none" };
  }

  if (p === "inbox") {
    if (k === "Escape") return { type: "inbox_escape" };
    if (isUp(k)) return { type: "inbox_up" };
    if (isDown(k)) return { type: "inbox_down" };
    if (isConfirm(k)) return { type: "inbox_confirm" };
    if (k === "Backspace" || k === "Delete") return { type: "inbox_delete" };
    return { type: "none" };
  }

  if (p === "gameover") {
    if (isConfirm(k) || k === "c" || k === "C")
      return { type: "gameover_continue_or_share" };
    if (k === "s" || k === "S") return { type: "gameover_share" };
    if (k === "Escape") return { type: "gameover_title" };
    return { type: "none" };
  }

  if (
    (k === "p" || k === "P" || k === "Tab") &&
    (p === "playing" || p === "ready" || p === "bossintro")
  ) {
    return { type: "pause_shop" };
  }
  if (
    (k === "o" || k === "O") &&
    (p === "playing" || p === "ready" || p === "bossintro")
  ) {
    return { type: "open_options_play" };
  }
  if (
    (k === "b" || k === "B" || k === "i" || k === "I") &&
    (p === "playing" || p === "ready" || p === "bossintro")
  ) {
    return { type: "open_bag_play" };
  }

  if (p === "shop") {
    if (isUp(k)) return { type: "shop_up" };
    if (isDown(k)) return { type: "shop_down" };
    if (isConfirm(k)) return { type: "shop_confirm" };
    if (k === "Escape" && opts.shopPaused) return { type: "shop_escape" };
    if (k === "b" || k === "B") return { type: "open_bag_play" };
    return { type: "none" };
  }

  if (p === "bag") {
    if (isUp(k)) return { type: "bag_up" };
    if (isDown(k)) return { type: "bag_down" };
    if (isConfirm(k)) return { type: "bag_confirm" };
    if (k === "Escape") return { type: "bag_back" };
    return { type: "none" };
  }

  if (p === "stageselect") {
    if (isUp(k)) return { type: "stage_up" };
    if (isDown(k)) return { type: "stage_down" };
    if (isConfirm(k)) return { type: "stage_confirm" };
    if (k === "Escape") return { type: "stage_back" };
    return { type: "none" };
  }

  return { type: "none" };
}
