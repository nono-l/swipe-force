/**
 * EASY mode power-up carry (localStorage) pure helpers.
 */

export type UpgradeTable = Record<string, number>;

export function loadEasyCarry(
  raw: string | null,
  defaults: UpgradeTable,
  maxLv = 20,
): UpgradeTable {
  if (!raw) return { ...defaults };
  try {
    const t = JSON.parse(raw) as Record<string, unknown>;
    const n: UpgradeTable = { ...defaults };
    for (const e of Object.keys(defaults)) {
      const r = Number(t[e]);
      if (Number.isFinite(r) && r > 0) {
        n[e] = Math.max(0, Math.min(maxLv, r | 0));
      }
    }
    return n;
  } catch {
    return { ...defaults };
  }
}

export function serializeEasyCarry(upgrades: UpgradeTable): string {
  return JSON.stringify(upgrades);
}
