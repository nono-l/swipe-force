/**
 * Theme archive — old arrangements kept for Sound Test after replacements.
 *
 * Workflow when swapping a track:
 * 1. Snapshot the previous make*Patch (+ scheduler flavor if unique) here
 * 2. Push a THEME_ARCHIVES entry with usedFrom / usedUntil (service period)
 * 3. New version becomes the live boss/stage theme
 *
 * Live game always uses the current makeBossPatch path.
 * Sound Test → 「旧曲バックアップ」 plays these snapshots.
 */

import type { BossThemeMeta } from "./boss-themes";

export type ThemeArchiveEntry = {
  /** stable id for track keys / votes */
  id: string;
  /** display title in sound test */
  title: string;
  /** which live theme this replaced */
  source: string;
  /** YYYY-MM-DD first day this arrangement was live (optional) */
  usedFrom?: string;
  /** YYYY-MM-DD last day this arrangement was live (inclusive) */
  usedUntil: string;
  /** YYYY-MM-DD when archived into this list (usually = usedUntil) */
  archivedAt: string;
  /** optional stage sample for patch variance (1..64) */
  sampleStage: number;
  /** flavor tag used by engine scheduler */
  flavor: string;
};

/**
 * Newest first. Index in sound test is 1-based into this list.
 */
export const THEME_ARCHIVES: readonly ThemeArchiveEntry[] = [
  {
    id: "abyss_v1_drone",
    title: "深海のバス (旧·低音ドローン)",
    source: "深海のバス",
    // 物語ボス曲として導入〜オルゴール版に差し替え前日まで
    usedFrom: "2026-08-08",
    usedUntil: "2026-08-10",
    archivedAt: "2026-08-10",
    sampleStage: 14,
    flavor: "abyss_v1",
  },
] as const;

export function themeArchiveCount(): number {
  return THEME_ARCHIVES.length;
}

export function themeArchiveAt(index1based: number): ThemeArchiveEntry | null {
  const i = Math.max(1, index1based | 0) - 1;
  return THEME_ARCHIVES[i] || null;
}

/** Format YYYY-MM-DD → M/D (no leading zero clutter) */
export function formatArchiveDate(iso: string | undefined | null): string {
  const s = String(iso || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return "";
  const y = s.slice(0, 4);
  const m = String(Number(s.slice(5, 7)));
  const d = String(Number(s.slice(8, 10)));
  return `${y}/${m}/${d}`;
}

/** e.g. "2026/8/8〜8/10" (same year) or "2026/8/8〜2027/1/1" */
export function formatArchivePeriod(entry: ThemeArchiveEntry): string {
  const untilRaw = String(entry.usedUntil || entry.archivedAt || "").trim();
  const fromRaw = String(entry.usedFrom || "").trim();
  if (!fromRaw && !untilRaw) return "";

  const fmt = (iso: string, withYear: boolean) => {
    if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
    const y = iso.slice(0, 4);
    const m = String(Number(iso.slice(5, 7)));
    const d = String(Number(iso.slice(8, 10)));
    return withYear ? `${y}/${m}/${d}` : `${m}/${d}`;
  };

  const fy = fromRaw.slice(0, 4);
  const uy = untilRaw.slice(0, 4);
  const sameYear = fy && uy && fy === uy;

  if (fromRaw && untilRaw) {
    return `${fmt(fromRaw, true)}〜${fmt(untilRaw, !sameYear)}`;
  }
  if (untilRaw) return `〜${fmt(untilRaw, true)}まで`;
  if (fromRaw) return `${fmt(fromRaw, true)}〜`;
  return "";
}

export function themeArchiveLabel(index1based: number): string {
  const e = themeArchiveAt(index1based);
  if (!e) return `旧曲 #${String(index1based).padStart(2, "0")}`;
  const num = String(index1based).padStart(2, "0");
  const base =
    e.title.length > 22 ? e.title.slice(0, 21) + "…" : e.title;
  return `旧${num} ${base}`;
}

/** Period only — for list sub / card second line */
export function themeArchivePeriodLabel(index1based: number): string {
  const e = themeArchiveAt(index1based);
  if (!e) return "";
  const period = formatArchivePeriod(e);
  return period ? `使用 ${period}` : "";
}

/** Longer line for track card / detail */
export function themeArchiveDetailLine(index1based: number): string {
  const e = themeArchiveAt(index1based);
  if (!e) return "";
  const period = formatArchivePeriod(e);
  if (!period) return `元: ${e.source}`;
  return `使用 ${period} · 元:${e.source}`;
}

export function themeArchiveMeta(index1based: number): BossThemeMeta {
  const e = themeArchiveAt(index1based);
  if (!e) {
    return {
      act: "ARCHIVE",
      title: `旧曲 #${index1based}`,
      feel: "archive",
    };
  }
  // Title only — period is drawn on a separate line in the UI
  return {
    act: "ARCHIVE",
    title: e.title,
    feel: "archive",
  };
}
