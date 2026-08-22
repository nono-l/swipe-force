/**
 * JPDOC: 矩形当たり判定。
 */
/**
 * Simple AABB / proximity hits used by combat.
 */

export function aabbOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return Math.abs(ax - bx) < aw / 2 + bw / 2 && Math.abs(ay - by) < ah / 2 + bh / 2;
}

/** Player hurtbox vs bullet (recovered half-sizes 6×7). */
export function playerBulletHit(
  px: number,
  py: number,
  bx: number,
  by: number,
  halfW = 6,
  halfH = 7,
): boolean {
  return Math.abs(bx - px) < halfW && Math.abs(by - py) < halfH;
}

/** Enemy body vs player ship (scale factor 0.35 of combined sizes). */
export function enemyPlayerHit(
  ex: number,
  ey: number,
  ew: number,
  eh: number,
  px: number,
  py: number,
  pw: number,
  ph: number,
  scale = 0.35,
): boolean {
  return (
    Math.abs(ex - px) < (ew + pw) * scale &&
    Math.abs(ey - py) < (eh + ph) * scale
  );
}
