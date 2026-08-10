/**
 * Sound-test track card metadata (pure).
 * Drawing / network stay in recovered-game.
 */

export type SoundTestMode = "title" | "stage" | "boss" | "legacy" | "archive" | string;

export type SoundTestLabels = {
  title: string;
  stage: (n: number) => string;
  boss: (n: number) => string;
  legacy: (n: number) => string;
  archive?: (n: number) => string;
  archivePeriod?: (n: number) => string;
};

export type TrackCard = {
  key: string;
  cat: string;
  catColor: string;
  title: string;
  short: string;
  line: string;
  /** optional second line (archive period etc.) */
  period?: string;
};

const CAT: Record<string, { cat: string; color: string }> = {
  title: { cat: "TITLE", color: "#88ffcc" },
  stage: { cat: "STAGE", color: "#88ccff" },
  boss: { cat: "BOSS", color: "#ffcc88" },
  legacy: { cat: "LEGACY", color: "#ccaa88" },
  archive: { cat: "ARCH", color: "#eebb66" },
};

export function soundTestCategory(mode: SoundTestMode): {
  cat: string;
  color: string;
} {
  return CAT[mode] || CAT.legacy;
}

export function resolveTrackTitle(
  mode: SoundTestMode,
  index: number,
  titleOverride: string | undefined,
  labels: SoundTestLabels,
): string {
  let i =
    titleOverride && !titleOverride.startsWith("—") ? titleOverride : "";
  if (!i || i === "TITLE THEME") {
    if (mode === "title") i = labels.title;
    else if (mode === "stage") i = labels.stage(index);
    else if (mode === "legacy") i = labels.legacy(index);
    else if (mode === "archive")
      i = labels.archive ? labels.archive(index) : `旧曲 #${index}`;
    else i = labels.boss(index);
  }
  // strip period suffix if titleOverride still carries " · 2026/..."
  if (mode === "archive" && i.includes(" · ")) {
    i = i.split(" · ")[0] || i;
  }
  return i;
}

/** Recovered `Ei()` payload without canvas. */
export function buildTrackCard(opts: {
  trackKey: string;
  mode: SoundTestMode;
  index: number;
  titleOverride?: string;
  labels: SoundTestLabels;
}): TrackCard {
  const { cat, color } = soundTestCategory(opts.mode);
  const title = resolveTrackTitle(
    opts.mode,
    opts.index,
    opts.titleOverride,
    opts.labels,
  );
  const short = title.length > 30 ? title.slice(0, 29) + "…" : title;
  const num =
    opts.mode === "title" ? "" : ` #${String(opts.index).padStart(2, "0")}`;
  const period =
    opts.mode === "archive" && opts.labels.archivePeriod
      ? opts.labels.archivePeriod(opts.index)
      : "";
  return {
    key: opts.trackKey,
    cat,
    catColor: color,
    title,
    short,
    line: `▶ ${cat}${num}  ${short}`,
    period: period || undefined,
  };
}

export function commentKindLabel(
  kind: string | undefined,
): "アレンジ" | "演奏してみた" | "感想" {
  if (kind === "arrange") return "アレンジ";
  if (kind === "cover") return "演奏してみた";
  return "感想";
}

export function commentKindEmoji(kind: string | undefined): string {
  if (kind === "arrange") return "🎹";
  if (kind === "cover") return "🎸";
  return "💬";
}

/** Menu rows for sound-test root list */
export const SOUND_TEST_MENU = [
  { id: "title" as const, title: "♪ TITLE", sub: "タイトル曲" },
  { id: "stage" as const, title: "♪ STAGE 01-64", sub: "ステージBGM" },
  { id: "boss" as const, title: "♪ BOSS 01-64", sub: "ボス曲（物語）" },
  { id: "legacy" as const, title: "♪ LEGACY BOSS", sub: "旧ボス曲チップ" },
  { id: "archive" as const, title: "♪ ARCHIVES", sub: "入れ替え前の旧曲" },
  { id: "back" as const, title: "◀ BACK", sub: "タイトルへ" },
];
