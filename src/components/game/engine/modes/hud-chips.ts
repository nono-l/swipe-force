/**
 * canSendFanmailTo-play HUD weapon chips + life pips (recovered $r pure data).
 */

export type WeaponChip = {
  letter: string;
  armed: number;
  owned: number;
  color: string;
  label: string;
};

const CHIP_KEYS: { key: string; letter: string }[] = [
  { key: "lockon", letter: "L" },
  { key: "missile", letter: "M" },
  { key: "particle", letter: "P" },
  { key: "hyper", letter: "H" },
  { key: "cluster", letter: "C" },
  { key: "overdrive", letter: "O" },
  { key: "beam", letter: "B" },
  { key: "flame", letter: "F" },
];

export function buildWeaponChips(
  upgrades: Record<string, number>,
  armedLevel: (key: string) => number,
): WeaponChip[] {
  const r: WeaponChip[] = [];
  for (const { key, letter } of CHIP_KEYS) {
    const owned = upgrades[key] || 0;
    if (!owned) continue;
    const t = armedLevel(key);
    r.push({
      letter,
      armed: t,
      owned,
      label: t > 0 ? `${letter}${t}` : `${letter}-`,
      color: t > 0 ? (t < owned ? "#ffdd88" : "#88ffcc") : "#554444",
    });
  }
  return r;
}

export type HudFlags = {
  dodgeOnly: boolean;
  shotOff: boolean;
  controlLabel: "STICK" | "SWIPE";
  diffLabel: "ESY" | "NRM";
  enemyHpMult: number;
};

export function buildHudFlags(opts: {
  weaponsEnabledCount: number;
  shotArmed: boolean;
  vstick: boolean;
  difficulty: string;
  enemyHpMult: number;
}): HudFlags {
  return {
    dodgeOnly: opts.weaponsEnabledCount === 0,
    shotOff: !opts.shotArmed,
    controlLabel: opts.vstick ? "STICK" : "SWIPE",
    diffLabel: opts.difficulty === "easy" ? "ESY" : "NRM",
    enemyHpMult: opts.enemyHpMult,
  };
}

export function lifePipXs(lives: number, startX = 52, step = 9): number[] {
  const out: number[] = [];
  let t = startX;
  for (let e = 0; e < lives; e++) {
    out.push(t);
    t += step;
  }
  return out;
}
