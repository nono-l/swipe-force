/**
 * Options list hit testing (pure).
 */

import { listWindowStart } from "./list-scroll";

export const OPTIONS_PAGE = 14;
export const OPTIONS_ROW_H = 18;
export const OPTIONS_BASE_Y = 48;

/** Recovered `aa(y)` — row index under finger, KEY_CLOUD_INBOX -1 */
export function optionsRowAtY(
  y: number,
  rowCount: number,
  cursor: number,
): number {
  const n = listWindowStart(rowCount, cursor, OPTIONS_PAGE);
  for (let r = 0; r < Math.min(OPTIONS_PAGE, rowCount); r++) {
    const index = r + n;
    const i = OPTIONS_BASE_Y + r * OPTIONS_ROW_H;
    if (y >= i - 1 && y < i + OPTIONS_ROW_H - 1) return index;
  }
  return -1;
}

/** Horizontal swipe step for vol/sense (14) vs weapon toggle (18) */
export function optionsSwipeStep(kind: string): number {
  return kind === "weapon" ? 18 : 14;
}
