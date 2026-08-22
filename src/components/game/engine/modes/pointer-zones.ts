/**
 * JPDOC: MUTEボタン等の固定ヒット領域。
 */
/**
 * Shared pointer / tap hit zones (pure geometry).
 */

/** Mute toggle bottom-right (disabled while shop/options open — caller checks mode). */
export function muteButtonHit(x: number, y: number): boolean {
  return x > 236 && y > 372 && x < 276;
}

export type GameOverHit =
  | "continue"
  | "share"
  | "title"
  | "side_share"
  | "side_title"
  | null;

export function gameOverHit(
  x: number,
  y: number,
  left: number,
  right: number,
): GameOverHit {
  if (x < left || x > right) {
    if (x > right && y < 100) return "side_share";
    return "side_title";
  }
  if (y >= 226 && y <= 260 && x >= 68 && x <= 252) return "continue";
  if (y >= 262 && y <= 294 && x >= 68 && x <= 252) return "share";
  if (y >= 296 && y <= 322 && x >= 78 && x <= 242) return "title";
  return null;
}
