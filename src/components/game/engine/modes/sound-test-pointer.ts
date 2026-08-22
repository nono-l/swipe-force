/**
 * JPDOC: サウンドテストのポインタ。
 */
/**
 * Sound-test pointer down / drag / up (recovered Vi / Hi / Ui).
 */

export type SoundTestDown =
  | { type: "side_back_comments" }
  | { type: "side_back_list" }
  | { type: "drag_start"; selectRow: number | null };

export function soundTestPointerDown(opts: {
  x: number;
  y: number;
  left: number;
  right: number;
  mode: string; // A
  rowAtY: (y: number) => number;
}): SoundTestDown {
  if (opts.x < opts.left || opts.x > opts.right) {
    return opts.mode === "comments"
      ? { type: "side_back_comments" }
      : { type: "side_back_list" };
  }
  if (opts.mode === "comments") {
    return { type: "drag_start", selectRow: null };
  }
  const n = opts.rowAtY(opts.y);
  return { type: "drag_start", selectRow: n >= 0 ? n : null };
}

/** Accumulate vertical drag into cursor steps (15px). */
export function dragScrollSteps(
  accum: number,
  dy: number,
  step = 15,
): { accum: number; steps: number } {
  let pos = accum + dy;
  let steps = 0;
  while (pos <= -step) {
    steps -= 1;
    pos += step;
  }
  while (pos >= step) {
    steps += 1;
    pos -= step;
  }
  return { accum: pos, steps };
}

export type SoundTestUp =
  | { type: "ignore" }
  | { type: "footer_like" }
  | { type: "footer_dislike" }
  | { type: "footer_write" }
  | { type: "footer_back" }
  | { type: "footer_comments" }
  | { type: "open_comment" }
  | { type: "write_first" }
  | { type: "activate_row"; row: number };

export function soundTestPointerUp(opts: {
  dragged: boolean;
  x: number;
  y: number;
  left: number;
  right: number;
  mode: string;
  playing: boolean;
  hasComments: boolean;
  commentsFooter: (x: number, y: number) => string | null;
  playingFooter: (x: number, y: number) => string | null;
  rowAtY: (y: number) => number;
}): SoundTestUp {
  if (opts.dragged) return { type: "ignore" };
  if (opts.x < opts.left || opts.x > opts.right) return { type: "ignore" };

  if (opts.mode === "comments") {
    const hit = opts.commentsFooter(opts.x, opts.y);
    if (hit === "like") return { type: "footer_like" };
    if (hit === "dislike") return { type: "footer_dislike" };
    if (hit === "write") return { type: "footer_write" };
    if (hit === "back") return { type: "footer_back" };
    return opts.hasComments ? { type: "open_comment" } : { type: "write_first" };
  }

  if (opts.playing) {
    const hit = opts.playingFooter(opts.x, opts.y);
    if (hit === "like") return { type: "footer_like" };
    if (hit === "dislike") return { type: "footer_dislike" };
    if (hit === "comments") return { type: "footer_comments" };
  }

  const n = opts.rowAtY(opts.y);
  return { type: "activate_row", row: n };
}
