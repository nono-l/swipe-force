/**
 * New-run / new-stage pure state seeds (recovered cr / dr).
 */

export type UpgradeTable = Record<string, number>;

export const DEFAULT_UPGRADES: UpgradeTable = {
  shot: 1,
  rate: 0,
  power: 0,
  speed: 0,
  option: 0,
  lockon: 0,
  missile: 0,
  particle: 0,
  hyper: 0,
  cluster: 0,
  overdrive: 0,
  beam: 0,
  flame: 0,
};

export type RunSeed = {
  score: number;
  pts: number;
  lives: number;
  stage: number;
  upgrades: UpgradeTable;
  shieldFrames: number;
  invulnFrames: number;
  playerX: number;
  playerY: number;
};

export function buildNewRunSeed(opts: {
  difficulty: string;
  easyCarry: UpgradeTable;
  defaults?: UpgradeTable;
  fieldW: number;
  playerY?: number;
}): RunSeed {
  return {
    score: 0,
    pts: 0,
    lives: 3,
    stage: 1,
    upgrades:
      opts.difficulty === "easy"
        ? { ...opts.easyCarry }
        : { ...(opts.defaults || DEFAULT_UPGRADES) },
    shieldFrames: 0,
    invulnFrames: 0,
    playerX: opts.fieldW / 2,
    playerY: opts.playerY ?? 352,
  };
}

export type StageSeed = {
  kills: number;
  killTarget: number;
  bossActive: boolean;
  bossName: string;
  spawnTimer: number;
  shotCd: number;
  missileCd: number;
  particleCd: number;
  lockonCd: number;
  mode: "ready";
  readyFrames: number;
  invulnFrames: number;
};

/** Recovered `dr` numbers: killTarget = 14 + stage * 4, ready 90, invuln 60, spawn 40 */
export function buildStageSeed(stage: number): StageSeed {
  return {
    kills: 0,
    killTarget: 14 + stage * 4,
    bossActive: false,
    bossName: "",
    spawnTimer: 40,
    shotCd: 0,
    missileCd: 0,
    particleCd: 0,
    lockonCd: 0,
    mode: "ready",
    readyFrames: 90,
    invulnFrames: 60,
  };
}
