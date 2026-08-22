/**
 * JPDOC: バージョン履歴の行とスクロール。
 */
/**
 * Version history flat rows for changelog mode.
 */

import { listWindowStart } from "./list-scroll";

export type VersionEntryLike = {
  version: string;
  date: string;
  title: string;
  notes: string[];
};

export type ChangelogRow = {
  kind: "head" | "note" | "gap";
  text: string;
  color: string;
};

export function buildChangelogRows(
  history: readonly VersionEntryLike[],
): ChangelogRow[] {
  const e: ChangelogRow[] = [];
  for (const t of history) {
    e.push({
      kind: "head",
      text: `v${t.version}  ${t.date}`,
      color: "#88ffaa",
    });
    e.push({
      kind: "head",
      text: t.title,
      color: "#ffee88",
    });
    for (const n of t.notes) {
      e.push({
        kind: "note",
        text: `· ${n}`,
        color: "#99bbaa",
      });
    }
    e.push({ kind: "gap", text: "", color: "#000" });
  }
  return e;
}

export const CHANGELOG_PAGE = 14;

export function changelogMaxScroll(rowCount: number): number {
  return Math.max(0, rowCount - CHANGELOG_PAGE);
}

export function changelogVisibleRows(
  rows: ChangelogRow[],
  scroll: number,
): { index: number; row: ChangelogRow; y: number }[] {
  const start = Math.max(0, Math.min(scroll, changelogMaxScroll(rows.length)));
  const out: { index: number; row: ChangelogRow; y: number }[] = [];
  for (let t = 0; t < CHANGELOG_PAGE; t++) {
    const n = t + start;
    if (n >= rows.length) break;
    out.push({ index: n, row: rows[n], y: 56 + t * 11 });
  }
  return out;
}

export function changelogBackHit(y: number, x: number, left: number, right: number): boolean {
  return y >= 366 || x < left || x > right;
}
