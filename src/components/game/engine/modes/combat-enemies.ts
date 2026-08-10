/**
 * Pure enemy / boss entity builders (recovered zr / Br).
 */

export type EnemyDesc = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  type: number;
  vx: number;
  vy: number;
  phase: number;
  flash: number;
  score: number;
  pts: number;
  boss: boolean;
  bossId: number;
  fireCd: number;
};

export type BossSpawnInfo = {
  id: number;
  w: number;
  h: number;
  name: string;
};

/** Grunt spawn (recovered zr). */
export function buildGrunt(opts: {
  id: number;
  stage: number;
  hpScale: number;
  rand?: () => number;
}): EnemyDesc {
  const rand = opts.rand ?? Math.random;
  const e = rand();
  const t = e < 0.45 ? 0 : e < 0.75 ? 1 : e < 0.92 ? 2 : 3;
  const n = 64 + rand() * 192;
  const base = t === 0 ? 2 : t === 1 ? 4 : t === 2 ? 6 : 10;
  const i = Math.floor((base + Math.floor(opts.stage / 3)) * opts.hpScale);
  return {
    id: opts.id,
    x: n,
    y: -16,
    w: t === 3 ? 22 : 14,
    h: t === 3 ? 18 : 12,
    hp: i,
    maxHp: i,
    type: t,
    vx: (rand() - 0.5) * (1 + opts.stage * 0.05),
    vy: 0.6 + rand() * 0.5 + opts.stage * 0.03,
    phase: rand() * Math.PI * 2,
    flash: 0,
    score: (t + 1) * 100,
    pts: (t + 1) * 15 + opts.stage,
    boss: false,
    bossId: 0,
    fireCd: 40 + rand() * 40,
  };
}

/** Boss spawn entity (recovered Br push). Mode/BGM stay in game. */
export function buildBossEntity(opts: {
  id: number;
  stage: number;
  hpScale: number;
  boss: BossSpawnInfo;
  fieldCenterX: number;
}): EnemyDesc {
  const n = Math.floor((80 + opts.stage * 35) * opts.hpScale);
  return {
    id: opts.id,
    x: opts.fieldCenterX,
    y: -40,
    w: opts.boss.w,
    h: opts.boss.h,
    hp: n,
    maxHp: n,
    type: 99,
    vx: 0,
    vy: 0.4,
    phase: 0,
    flash: 0,
    score: 5000 + opts.stage * 500,
    pts: 200 + opts.stage * 40,
    boss: true,
    bossId: opts.boss.id,
    fireCd: 30,
  };
}
