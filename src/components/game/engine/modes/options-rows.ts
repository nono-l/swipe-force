/**
 * JPDOC: オプションの行定義。
 */
/**
 * Pure builders for the OPTIONS menu rows.
 * Recovered game calls these with local unlock/level accessors — behavior frozen.
 */

import { getLocaleNative, translate } from "@/lib/i18n";

export type OptionRow =
  | { kind: "header"; label: string }
  | { kind: "vol"; key: "master" | "bgm" | "sfx"; label: string }
  | { kind: "toggle"; key: string; label: string }
  | { kind: "sense"; label: string }
  | { kind: "submenu"; key: "weapons" | "shot"; label: string }
  | { kind: "weapon"; key: string; label: string }
  | { kind: "title"; label: string }
  | { kind: "locale"; label: string }
  | { kind: "back"; label: string };

export type OptionsSubmenu = "main" | "weapons" | "shot" | string;

export const SHOT_DETAIL_KEYS: { key: string; label: string }[] = [
  { key: "rate", label: "RATE" },
  { key: "power", label: "POWER" },
  { key: "option", label: "OPTION" },
];

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

export const SHOT_SUMMARY_KEYS = ["shot", "rate", "power", "option"] as const;

export function buildOptionRows(
  submenu: OptionsSubmenu,
  isUnlocked: (key: string) => boolean,
): OptionRow[] {
  if (submenu === "shot") {
    const rows: OptionRow[] = [
      { kind: "header", label: translate("options.shotHeader") },
      { kind: "weapon", key: "shot", label: "MAIN SHOT" },
    ];
    for (const item of SHOT_DETAIL_KEYS) {
      if (isUnlocked(item.key)) {
        rows.push({ kind: "weapon", key: item.key, label: item.label });
      }
    }
    rows.push({ kind: "back", label: translate("options.backLoadout") });
    return rows;
  }

  if (submenu === "weapons") {
    const rows: OptionRow[] = [
      { kind: "header", label: translate("options.wepHeader") },
      { kind: "submenu", key: "shot", label: "SHOT" },
    ];
    for (const item of LOADOUT_WEAPON_KEYS) {
      if (isUnlocked(item.key)) {
        rows.push({ kind: "weapon", key: item.key, label: item.label });
      }
    }
    rows.push({ kind: "back", label: translate("options.backOptions") });
    return rows;
  }

  return [
    { kind: "vol", key: "master", label: "MASTER VOL" },
    { kind: "vol", key: "bgm", label: "BGM VOL" },
    { kind: "vol", key: "sfx", label: "SFX VOL" },
    { kind: "toggle", key: "muted", label: "MUTE" },
    { kind: "toggle", key: "scanlines", label: "SCANLINES" },
    { kind: "toggle", key: "shake", label: "SCREEN SHAKE" },
    { kind: "toggle", key: "vstick", label: "V-STICK" },
    { kind: "toggle", key: "autoShop", label: "AUTO SHOP" },
    { kind: "sense", label: "MOVE SENSE" },
    { kind: "locale", label: translate("options.language") },
    { kind: "submenu", key: "weapons", label: "WEAPON LOADOUT" },
    { kind: "title", label: translate("options.toTitle") },
    { kind: "back", label: translate("options.back") },
  ];
}

export function formatVolumeBar(level: number): string {
  const n = Math.max(0, Math.min(10, level | 0));
  return "■".repeat(n) + "□".repeat(10 - n) + ` ${n}`;
}

export function formatLoadoutSummary(enabledCount: number): string {
  return enabledCount === 0 ? "DODGE" : `${enabledCount} ON`;
}

export function formatShotSubSummary(opts: {
  shotOn: boolean;
  optionOn: boolean;
  detailOnCount: number;
}): string {
  if (!opts.shotOn && !opts.optionOn) return "OFF ▶";
  return `${opts.detailOnCount} ON ▶`;
}

export type OptionValueState = {
  options: Record<string, unknown>;
  armedLevel: (key: string) => number;
  maxLevel: (key: string) => number;
  loadoutSummary: string;
  shotSummary: string;
};

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
  if (row.kind === "locale") return `◀ ${getLocaleNative()} ▶`;
  if (row.kind === "submenu") {
    return row.key === "shot" ? state.shotSummary : `${state.loadoutSummary} ▶`;
  }
  if (row.kind === "weapon") {
    const lv = state.armedLevel(row.key);
    const n = state.maxLevel(row.key);
    return lv <= 0 ? "◀ OFF ▶" : `◀ Lv${lv}/${n} ▶`;
  }
  if (row.kind === "back") return "◀";
  if (row.kind === "title") return "▶";
  return "";
}
