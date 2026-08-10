/**
 * Keyboard / virtual stick axis (pure).
 */

export type Axis2 = { x: number; y: number };

/** Recovered keyboard scan: A/← left, D/→ right, W/↑ up, S/↓ down */
export function keyboardAxis(keys: Set<string> | { has(k: string): boolean }): Axis2 {
  let n = 0;
  let r = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) n -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) n += 1;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) r -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) r += 1;
  return { x: n, y: r };
}

/** Normalize non-zero axis to unit vector components used for movement */
export function normalizeAxis(axis: Axis2): Axis2 {
  if (axis.x === 0 && axis.y === 0) return axis;
  const i = Math.hypot(axis.x, axis.y) || 1;
  return { x: axis.x / i, y: axis.y / i };
}

/**
 * Virtual stick: map finger offset from center to -1..1 axis.
 * Recovered `da`.
 */
export function virtualStickAxis(
  fingerX: number,
  fingerY: number,
  centerX: number,
  centerY: number,
  radius = 30,
): Axis2 {
  const n = fingerX - centerX;
  const r = fingerY - centerY;
  const i = Math.hypot(n, r);
  if (i > radius) return { x: n / i, y: r / i };
  if (i < 0.001) return { x: 0, y: 0 };
  return { x: n / radius, y: r / radius };
}

export const VSTICK_DEADZONE = 0.08;
