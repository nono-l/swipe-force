/**
 * Sound-test menu lists (pure data).
 * Recovered `Fi` / `Ii` + comment list formatting.
 */

import { listWindowStart } from "./list-scroll";
import { commentKindEmoji } from "./sound-test-meta";
import { translate } from "@/lib/i18n";

export type SoundTestMenuAction =
  | "title"
  | "stage_list"
  | "boss_list"
  | "legacy_list"
  | "archive_list"
  | "stop"
  | "back"
  | "stage"
  | "boss"
  | "legacy"
  | "archive";

export type SoundTestMenuItem = {
  label: string;
  sub?: string;
  action: SoundTestMenuAction | string;
  n?: number;
};

/** Recovered `Fi()` — root sound-test menu */
export function buildSoundTestRootMenu(): SoundTestMenuItem[] {
  return [
    { label: "▶ KEYGEN TITLE", action: "title" },
    { label: "STAGE BGM ×64", sub: translate("sound.stageSub"), action: "stage_list" },
    { label: "BOSS THEME ×64", sub: translate("sound.bossSub"), action: "boss_list" },
    { label: "LEGACY BOSS ×64", sub: translate("sound.legacySub"), action: "legacy_list" },
    { label: "ARCHIVES", sub: translate("sound.archiveSub"), action: "archive_list" },
    { label: "■ STOP", action: "stop" },
    { label: "◀ BACK", action: "back" },
  ];
}

export type SoundCatalogLabels = {
  stage: (n: number) => string;
  boss: (n: number) => string;
  legacy: (n: number) => string;
  archive?: (n: number) => string;
  /** period-only subline for archive rows */
  archivePeriod?: (n: number) => string;
};

export type SoundCatalog = {
  stages: number;
  bosses: number;
  archives?: number;
  labels: SoundCatalogLabels;
};

/** Recovered `Ii(mode)` — stage / boss / legacy / archive track list + BACK */
export function buildSoundTestTrackList(
  mode: "stage" | "boss" | "legacy" | "archive" | string,
  catalog: SoundCatalog,
): SoundTestMenuItem[] {
  if (mode === "archive") {
    const count = Math.max(0, catalog.archives || 0);
    const items: SoundTestMenuItem[] = [];
    for (let i = 1; i <= count; i++) {
      let label = catalog.labels.archive
        ? catalog.labels.archive(i)
        : `旧曲 #${String(i).padStart(2, "0")}`;
      // Prefer dedicated period label if catalog provides it
      let sub =
        catalog.labels.archivePeriod?.(i) ||
        "使用期間";
      if (label.length > 26) label = label.slice(0, 25) + "…";
      // strip legacy "(period)" suffix if still present
      const m = label.match(/^(.*)\s+\(([^)]+)\)$/);
      if (m && !catalog.labels.archivePeriod) {
        label = m[1];
        sub = m[2];
      }
      items.push({
        label,
        sub,
        action: "archive",
        n: i,
      });
    }
    if (!count) {
      items.push({
        label: "（まだバックアップなし）",
        action: "back",
        n: 0,
      });
    }
    items.push({ label: "◀ BACK", action: "back", n: 0 });
    return items;
  }
  const count = mode === "stage" ? catalog.stages : catalog.bosses;
  const items: SoundTestMenuItem[] = [];
  for (let i = 1; i <= count; i++) {
    let label =
      mode === "stage"
        ? catalog.labels.stage(i)
        : mode === "legacy"
          ? catalog.labels.legacy(i)
          : catalog.labels.boss(i);
    if (label.length > 28) label = label.slice(0, 27) + "…";
    items.push({ label, action: mode, n: i });
  }
  items.push({ label: "◀ BACK", action: "back", n: 0 });
  return items;
}

/** Visible track rows when a track is playing vs not */
export function soundTestPageSize(hasPlayingTrack: boolean): number {
  return hasPlayingTrack ? 9 : 12;
}

export function soundTestListWindow(
  length: number,
  cursor: number,
  pageSize: number,
): number {
  return listWindowStart(length, cursor, pageSize);
}

export type CommentListItem = {
  kind?: string;
  from?: string;
  body: string;
  urls?: string[];
};

export type CommentRowView = {
  index: number;
  y: number;
  selected: boolean;
  text: string;
};

export function buildCommentRows(opts: {
  comments: CommentListItem[];
  cursor: number;
  baseY: number;
  pageSize?: number;
  rowH?: number;
}): { windowStart: number; rows: CommentRowView[] } {
  const page = opts.pageSize ?? 10;
  const rowH = opts.rowH ?? 22;
  const windowStart = listWindowStart(
    opts.comments.length,
    opts.cursor,
    page,
  );
  const rows: CommentRowView[] = [];
  const n = Math.min(page, opts.comments.length);
  for (let i = 0; i < n; i++) {
    const index = i + windowStart;
    const c = opts.comments[index];
    if (!c) continue;
    const body = c.body.replace(/\n/g, " ");
    const emoji = commentKindEmoji(c.kind);
    const from = (c.from || "?").slice(0, 5);
    const urlMark = c.urls?.length ? `🔗${c.urls.length}` : "";
    const text = `${emoji}${from}: ${body.slice(0, 18)}${body.length > 18 ? "…" : ""} ${urlMark}`;
    rows.push({
      index,
      y: opts.baseY + i * rowH,
      selected: index === opts.cursor,
      text,
    });
  }
  return { windowStart, rows };
}

export function soundTestListHeader(
  mode: string,
): { title: string; color: string } {
  if (mode === "stage") return { title: "STAGE THEMES", color: "#66aacc" };
  if (mode === "legacy")
    return { title: "LEGACY BOSS (旧曲)", color: "#aa8866" };
  if (mode === "archive")
    return { title: "ARCHIVES (入れ替え前)", color: "#ccaa66" };
  return { title: "STORY BOSS THEMES", color: "#66aacc" };
}

/** Bottom bar hit: comments mode 4 buttons 👍👎✍◀ */
export function soundTestCommentsFooterHit(
  x: number,
  y: number,
  playfieldLeft = 58,
): "like" | "dislike" | "write" | "back" | null {
  if (y < 358 || y > 386) return null;
  const n = 194 / 4;
  const t = x - playfieldLeft;
  if (t < n) return "like";
  if (t < n * 2) return "dislike";
  if (t < n * 3) return "write";
  return "back";
}

/** Bottom bar hit: playing track 3 buttons 👍👎💬 */
export function soundTestPlayingFooterHit(
  x: number,
  y: number,
  playfieldLeft = 58,
): "like" | "dislike" | "comments" | null {
  if (y < 358 || y > 384) return null;
  const n = 196 / 3;
  const t = x - playfieldLeft;
  if (t < n) return "like";
  if (t < n * 2) return "dislike";
  return "comments";
}
