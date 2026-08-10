/**
 * Default settings + localStorage merge (recovered Vt / Ht / load).
 */

export type WepLvTable = Record<string, number>;

export type GameSettings = {
  master: number;
  bgm: number;
  sfx: number;
  muted: boolean;
  scanlines: boolean;
  shake: boolean;
  sense: number;
  vstick: boolean;
  wepLv: WepLvTable;
};

export function defaultWepLv(): WepLvTable {
  return {
    shot: 99,
    rate: 99,
    power: 99,
    lockon: 99,
    missile: 99,
    particle: 99,
    hyper: 99,
    cluster: 99,
    overdrive: 99,
    option: 99,
    beam: 99,
    flame: 99,
  };
}

export function defaultSettings(): GameSettings {
  return {
    master: 10,
    bgm: 8,
    sfx: 10,
    muted: false,
    scanlines: true,
    shake: true,
    sense: 1,
    vstick: true,
    wepLv: defaultWepLv(),
  };
}

/** Merge saved JSON into defaults (supports legacy `wep` bool map). */
export function mergeSettingsFromStorage(
  raw: string | null,
): GameSettings {
  const base = defaultSettings();
  if (!raw) return base;
  try {
    const t = JSON.parse(raw) as Record<string, unknown> & {
      wepLv?: WepLvTable;
      wep?: Record<string, boolean>;
    };
    const n: WepLvTable = {
      ...defaultWepLv(),
      ...(t.wepLv ?? {}),
    };
    if (t.wep && !t.wepLv) {
      for (const e of Object.keys(n)) {
        n[e] = t.wep?.[e] === false ? 0 : 99;
      }
    }
    return {
      ...base,
      ...t,
      wepLv: n,
    } as GameSettings;
  } catch {
    return base;
  }
}
