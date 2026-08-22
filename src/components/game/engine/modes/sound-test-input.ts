/**
 * JPDOC: サウンドテスト入力。
 */
/**
 * Sound-test list hit / scroll / activate (pure).
 */

import { listWindowStart } from "./list-scroll";
import { soundTestPageSize, soundTestListWindow } from "./sound-test-lists";

export function soundTestRowAtY(opts: {
  y: number;
  mode: string; // A
  menuLen: number;
  listLen: number;
  cursor: number;
  listTop: number;
  playing: boolean;
  rowH?: number;
}): number {
  if (opts.mode === "comments") return -1;
  const rowH = opts.rowH ?? 17;
  const page = soundTestPageSize(opts.playing);
  const n = opts.listTop;

  if (opts.mode === "menu") {
    for (let r = 0; r < opts.menuLen; r++) {
      const t = n + r * rowH;
      if (opts.y >= t - 1 && opts.y < t + rowH - 1) return r;
    }
    return -1;
  }

  const i = soundTestListWindow(opts.listLen, opts.cursor, page);
  for (let a = 0; a < Math.min(page, opts.listLen); a++) {
    const index = a + i;
    const r = n + a * rowH;
    if (opts.y >= r - 1 && opts.y < r + rowH - 1) return index;
  }
  return -1;
}

export function soundTestScrollCursor(
  cursor: number,
  deltaRows: number,
  maxIndex: number,
): number {
  if (deltaRows < 0) return Math.max(0, cursor + deltaRows);
  return Math.min(maxIndex, cursor + deltaRows);
}

export type SoundTestMenuAction =
  | { type: "play_title" }
  | { type: "open_stage" }
  | { type: "open_boss" }
  | { type: "open_legacy" }
  | { type: "open_archive" }
  | { type: "stop" }
  | { type: "back" }
  | { type: "noop" };

export function soundTestMenuAction(
  action: string | undefined,
): SoundTestMenuAction {
  if (action === "title") return { type: "play_title" };
  if (action === "stage_list") return { type: "open_stage" };
  if (action === "boss_list") return { type: "open_boss" };
  if (action === "legacy_list") return { type: "open_legacy" };
  if (action === "archive_list") return { type: "open_archive" };
  if (action === "stop") return { type: "stop" };
  if (action === "back") return { type: "back" };
  return { type: "noop" };
}

export type SoundTestListAction =
  | { type: "back_menu" }
  | { type: "play"; list: string; index: number }
  | { type: "noop" };

export function soundTestListAction(
  mode: string,
  item: { action?: string; n?: number } | undefined,
): SoundTestListAction {
  if (!item) return { type: "noop" };
  if (item.action === "back") return { type: "back_menu" };
  if (
    mode === "stage" ||
    mode === "boss" ||
    mode === "legacy" ||
    mode === "archive"
  ) {
    return { type: "play", list: mode, index: item.n ?? 0 };
  }
  return { type: "noop" };
}
