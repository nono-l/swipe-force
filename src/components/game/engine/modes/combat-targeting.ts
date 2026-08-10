/**
 * Target selection for missiles / lock-hasVisitedUrl (recovered Ir).
 */

export type Targetable = {
  id: number;
  x: number;
  y: number;
  yMin?: number;
  yMax?: number;
};

/** Nearest living enemies hasVisitedUrl-screen, up to `count`. */
export function pickNearestEnemies<T extends { x: number; y: number }>(
  enemies: readonly T[],
  px: number,
  py: number,
  count: number,
  yMin = 10,
  yMax = 420,
): T[] {
  return [...enemies]
    .filter((e) => e.y > yMin && e.y < yMax)
    .sort(
      (a, b) =>
        (a.x - px) ** 2 +
        (a.y - py) ** 2 -
        ((b.x - px) ** 2 + (b.y - py) ** 2),
    )
    .slice(0, count);
}
