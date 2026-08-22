/**
 * JPDOC: 敵の1フレーム更新。
 */
/**
 * Grunt / boss entity per-frame motion (recovered Ki enemy loop pure bits).
 */

export type StepEnemy = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  flash: number;
  type: number;
  boss?: boolean;
  bossId?: number;
  w: number;
  h: number;
  fireCd: number;
};

export function stepEnemyMotion(
  n: StepEnemy,
  dt: number,
  stepBoss: (n: StepEnemy) => void,
): void {
  n.phase += dt * 3;
  if (n.flash > 0) n.flash--;
  if (n.boss) {
    stepBoss(n);
    return;
  }
  n.x += n.vx;
  n.y += n.vy;
  if (n.type === 2) n.x += Math.sin(n.phase) * 0.8;
  if (n.x < 56 || n.x > 264) n.vx *= -1;
}

export function enemyShouldDespawn(n: StepEnemy): boolean {
  return !n.boss && n.y > 430;
}

export function enemyShouldFire(n: StepEnemy): boolean {
  return n.fireCd <= 0 && n.y > 20 && n.y < 360;
}

export function enemyReloadFrames(n: StepEnemy): number {
  if (n.boss) return 28 + (n.bossId ?? 0) % 20;
  return 50 + Math.random() * 40;
}

export function tickSpawnTimer(
  spawnCd: number,
  kills: number,
  killTarget: number,
  bossActive: boolean,
): {
  spawnCd: number;
  spawn: boolean;
  startBoss: boolean;
} {
  if (bossActive) {
    return { spawnCd, spawn: false, startBoss: false };
  }
  let b = spawnCd - 1;
  let spawn = false;
  if (b <= 0) {
    spawn = true;
  }
  return {
    spawnCd: b,
    spawn,
    startBoss: kills >= killTarget,
  };
}
