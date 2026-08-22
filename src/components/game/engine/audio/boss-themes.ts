/**
 * JPDOC: ボス曲。深海のバスはオルゴール風三和音。
 */
/**
 * 64 boss BGM story titles / acts (display + sound-test labels).
 * Playback synthesis stays in engine.ts — this is metadata only.
 */

export type BossAct = {
  name: string;
  from: number; // inclusive stage 1..64
  to: number;
  feel: "solemn" | "rising" | "abyss" | "finale" | string;
};

export type BossThemeMeta = {
  act: string;
  title: string;
  feel: string;
};

/** Story acts spanning the 64 bosses */
export const BOSS_ACTS: readonly BossAct[] = [
  { name: "I 序曲", from: 1, to: 16, feel: "solemn" },
  { name: "II 闘争", from: 17, to: 32, feel: "rising" },
  { name: "III 深淵", from: 33, to: 48, feel: "abyss" },
  { name: "IV 終局", from: 49, to: 64, feel: "finale" },
] as const;

/** 16 theme name stems, cycled across 64 bosses */
export const BOSS_THEME_STEMS: readonly string[] = [
  "夜明けの対位",
  "第一主題",
  "影のカノン",
  "歩む通奏",
  "遠い鐘",
  "追走曲",
  "沈黙の前",
  "決意の和声",
  "星屑のフーガ",
  "鉄の序奏",
  "裂ける旋律",
  "祈りの半終止",
  "嵐の展開",
  "深海のバス",
  "鏡像の答",
  "最後のカデンツ",
] as const;

export function bossActForStage(stage: number): BossAct {
  const t = Math.max(1, Math.min(64, stage | 0));
  return BOSS_ACTS.find((a) => t >= a.from && t <= a.to) || BOSS_ACTS[0];
}

/** Recovered `D(stage)` — title card for boss BGM / sound test */
export function bossThemeMeta(stage: number): BossThemeMeta {
  const t = Math.max(1, Math.min(64, stage | 0));
  const act = bossActForStage(t);
  const stem = BOSS_THEME_STEMS[(t - 1) % BOSS_THEME_STEMS.length];
  return {
    act: act.name,
    title: `${act.name} · No.${String(t).padStart(2, "0")} ${stem}`,
    feel: act.feel,
  };
}

/** All 64 theme metas for sound-test listing */
export const BOSS_THEMES: readonly BossThemeMeta[] = Array.from(
  { length: 64 },
  (_, i) => bossThemeMeta(i + 1),
);
