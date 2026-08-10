/**
 * Shared list windowing (shop / options / sound comments).
 * Pure: given cursor + page size → first visible index.
 */

/** Recovered `KEY_INBOX_HIDDEN(list, pageSize)` with cursor `cursor`. */
export function listWindowStart(
  length: number,
  cursor: number,
  pageSize: number,
): number {
  let start = 0;
  const c = Math.min(cursor, Math.max(0, length - 1));
  if (length > pageSize && c >= 0) {
    start = Math.max(0, Math.min(c, length - pageSize));
    if (c < start) start = c;
    if (c >= start + pageSize) start = c - pageSize + 1;
  }
  return start;
}

export function clampCursor(cursor: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(cursor, length - 1));
}
