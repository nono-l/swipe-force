/**
 * JPDOC: ミサイルの誘導。
 */
/**
 * Homing missile turn (recovered Ki missile branch).
 */

export type HomingBullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  turn: number;
  targetId?: number | string | null;
};

export type HomingTarget = { id: number | string; x: number; y: number };

export function steerMissile(
  t: HomingBullet,
  target: HomingTarget | null | undefined,
): void {
  if (!target) return;
  let n = Math.atan2(target.y - t.y, target.x - t.x);
  let r = Math.atan2(t.vy, t.vx);
  let i = n - r;
  while (i > Math.PI) i -= Math.PI * 2;
  while (i < -Math.PI) i += Math.PI * 2;
  const a = r + Math.max(-t.turn, Math.min(t.turn, i));
  const o = Math.hypot(t.vx, t.vy) || 3;
  t.vx = Math.cos(a) * Math.min(5.5, o + 0.05);
  t.vy = Math.sin(a) * Math.min(5.5, o + 0.05);
}

export function bulletOutOfBounds(
  t: { x: number; y: number; life: number },
): boolean {
  return (
    t.life <= 0 ||
    t.y < -20 ||
    t.y > 420 ||
    t.x < 28 ||
    t.x > 292
  );
}
