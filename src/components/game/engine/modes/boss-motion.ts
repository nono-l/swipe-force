/**
 * Boss / grunt motion step (pure position update).
 */

export type BossMotionEnemy = {
  x: number;
  y: number;
  w: number;
  h: number;
  phase: number;
  boss?: boolean;
  bossId?: number;
  vx?: number;
  vy?: number;
  type?: number;
};

export type BossMoveDef = { move: number };

/**
 * One frame of boss movement after intro descent (y>=70).
 * Recovered branch inside Ki.
 */
export function stepBossPosition(
  n: BossMotionEnemy,
  moveArchetype: number,
  left: number,
  right: number,
): void {
  if (n.y < 70) {
    n.y += 0.6;
    return;
  }
  const t = moveArchetype;
  if (t % 4 === 0) n.x += Math.sin(n.phase * 0.7) * 1.4;
  else if (t % 4 === 1) n.x += Math.sin(n.phase) * 2.2;
  else if (t % 4 === 2) {
    n.x += Math.cos(n.phase * 0.5) * 1.8;
    n.y = 70 + Math.sin(n.phase * 0.4) * 20;
  } else n.x += Math.sin(n.phase * 1.3) * 1.1;
  n.x = Math.max(left + n.w / 2, Math.min(right - n.w / 2, n.x));
}
