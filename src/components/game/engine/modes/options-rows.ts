/**
 * Pure builders for the OPTIONS menu rows.
 * Recovered game calls these with local unlock/level accessors — behavior frozen.
 */

export type OptionRow =
  | { kind: "header"; label: string }
  | { kind: "vol"; key: "master" | "bgm" | "sfx"; label: string }
  | { kind: "toggle"; key: string; label: string }
  | { kind: "sense"; label: string }
  | { kind: "submenu"; key: "weapons" | "shot"; label: string }
  | { kind: "weapon"; key: string; label: string }
  | { kind: "back"; label: string };

export type OptionsSubmenu = "main" | "weapons" | "shot" | string;

/** Shot subtree keys shown when upgraded */
export const SHOT_DETAIL_KEYS: { key: string; label: string }[] = [
  { key: "rate", label: "RATE" },
  { key: "power", label: "POWER" },
  { key: "option", label: "OPTION" },
];

/** Advanced arms listed under WEAPON LOADOUT */
export const LOADOUT_WEAPON_KEYS: { key: string; label: string }[] = [
  { key: "lockon", label: "LOCK-ON" },
  { key: "missile", label: "MISSILE" },
  { key: "particle", label: "PARTICLE" },
  { key: "hyper", label: "HYPER LOCK" },
  { key: "cluster", label: "CLUSTER" },
  { key: "overdrive", label: "OVERDRIVE" },
  { key: "beam", label: "OPT-LASER" },
  { key: "flame", label: "FLAME" },
];

/** Arms counted for “N ON” summary */
export const LOADOUT_COUNT_KEYS = [
  "shot",
  "option",
  "lockon",
  "missile",
  "particle",
  "hyper",
  "cluster",
  "overdrive",
  "beam",
  "flame",
] as const;

/** Shot summary keys for SHOT submenu label */
export const SHOT_SUMMARY_KEYS = ["shot", "rate", "power", "option"] as const;

/**
 * Build option list for the current submenu.
 * @param submenu z in recovered game: main | weapons | shot
 * @param isUnlocked getLocalVotes(key) — true if upgrade level > 0 (unlocked in shop)
 */
export function buildOptionRows(
  submenu: OptionsSubmenu,
  isUnlocked: (key: string) => boolean,
): OptionRow[] {
  if (submenu === "shot") {
    const rows: OptionRow[] = [
      { kind: "header", label: "— SHOT 強化 · 左右=強度 —" },
      { kind: "weapon", key: "shot", label: "MAIN SHOT" },
    ];
    for (const item of SHOT_DETAIL_KEYS) {
      if (isUnlocked(item.key)) {
        rows.push({ kind: "weapon", key: item.key, label: item.label });
      }
    }
    rows.push({ kind: "back", label: "◀ LOADOUTへ" });
    return rows;
  }

  if (submenu === "weapons") {
    const rows: OptionRow[] = [
      { kind: "header", label: "— 解放武装 · SHOTは詳細へ —" },
      { kind: "submenu", key: "shot", label: "SHOT" },
    ];
    for (const item of LOADOUT_WEAPON_KEYS) {
      if (isUnlocked(item.key)) {
        rows.push({ kind: "weapon", key: item.key, label: item.label });
      }
    }
    rows.push({ kind: "back", label: "◀ オプションへ" });
    return rows;
  }

  // main
  return [
    { kind: "vol", key: "master", label: "MASTER VOL" },
    { kind: "vol", key: "bgm", label: "BGM VOL" },
    { kind: "vol", key: "sfx", label: "SFX VOL" },
    { kind: "toggle", key: "muted", label: "MUTE" },
    { kind: "toggle", key: "scanlines", label: "SCANLINES" },
    { kind: "toggle", key: "shake", label: "SCREEN SHAKE" },
    { kind: "toggle", key: "vstick", label: "V-STICK" },
    { kind: "sense", label: "MOVE SENSE" },
    { kind: "submenu", key: "weapons", label: "WEAPON LOADOUT" },
    { kind: "back", label: "BACK" },
  ];
}

/** Volume meter: ■■■□□ 3 */
export function formatVolumeBar(level: number): string {
  const t = Math.max(0, Math.min(10, level | 0));
  return "■".repeat(t) + "□".repeat(10 - t) + ` ${t}`;
}

/** WEAPON LOADOUT summary: "3 ON" / "DODGE" */
export function formatLoadoutSummary(enabledCount: number): string {
  return enabledCount === 0 ? "DODGE" : `${enabledCount} ON`;
}

/** SHOT submenu summary hasVisitedUrl weapons list */
export function formatShotSubSummary(opts: {
  shotOn: boolean;
  optionOn: boolean;
  detailOnCount: number;
}): string {
  if (!opts.shotOn && !opts.optionOn) return "OFF ▶";
  return `${opts.detailOnCount} ON ▶`;
}

export type OptionValueState = {
  /** K options object: master/bgm/sfx numbers, toggles, sense, wepLv… */
  options: Record<string, unknown>;
  /** effective armed level q(key) */
  armedLevel: (key: string) => number;
  /** max unlocked saveVotesStore(key) */
  maxLevel: (key: string) => number;
  /** loadout summary text for weapons submenu */
  loadoutSummary: string;
  /** shot submenu summary */
  shotSummary: string;
};

/** Right-hand value text for a row (recovered `xr`) */
export function formatOptionValue(
  row: OptionRow,
  state: OptionValueState,
): string {
  if (row.kind === "vol") {
    const n = Number(state.options[row.key] ?? 0);
    return `◀${formatVolumeBar(n)}▶`;
  }
  if (row.kind === "toggle") {
    return state.options[row.key] ? "ON" : "OFF";
  }
  if (row.kind === "sense") {
    const sense = Number(state.options.sense ?? 1);
    return `◀ ${sense.toFixed(1)}x ▶`;
  }
  if (row.kind === "submenu") {
    return row.key === "shot" ? state.shotSummary : `${state.loadoutSummary} ▶`;
  }
  if (row.kind === "weapon") {
    const t = state.armedLevel(row.key);
    const n = state.maxLevel(row.key);
    return t <= 0 ? "◀ OFF ▶" : `◀ Lv${t}/${n} ▶`;
  }
  if (row.kind === "back") return "◀";
  return "";
}
