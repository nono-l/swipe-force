/**
 * JPDOC: 出撃ロードアウト。
 */
/**
 * Weapon loadout levels: owned vs armed (recovered saveVotesStore / q / loadUrlReportsStore / saveUrlReportsStore).
 */

export type Upgrades = Record<string, number>;
export type WepLv = Record<string, number>;

/** Max armable level from owned upgrades (recovered saveVotesStore). */
export function ownedLevel(key: string, upgrades: Upgrades): number {
  if (key === "shot") return (upgrades.shot || 0) + 1;
  if (key === "rate") return upgrades.rate || 0;
  if (key === "power") return upgrades.power || 0;
  return upgrades[key] || 0;
}

/**
 * Currently armed level, clamped to owned (recovered q).
 * Missing wepLv entry → fully armed (owned).
 */
export function armedLevel(
  key: string,
  upgrades: Upgrades,
  wepLv: WepLv,
): number {
  const t = ownedLevel(key, upgrades);
  if (t <= 0) return 0;
  const n = wepLv[key];
  return Math.max(0, Math.min(t, (n ?? t) | 0));
}

export function isArmed(
  key: string,
  upgrades: Upgrades,
  wepLv: WepLv,
): boolean {
  return armedLevel(key, upgrades, wepLv) > 0;
}

export const LOADOUT_COUNT_KEYS_DEFAULT = [
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

export function countArmedWeapons(
  keys: readonly string[],
  upgrades: Upgrades,
  wepLv: WepLv,
): number {
  return keys.filter((e) => isArmed(e, upgrades, wepLv)).length;
}
