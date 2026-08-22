/**
 * JPDOC: 自機被弾。
 */
/**
 * Player hit / death (recovered Rr pure).
 */

export type PlayerHitOutcome =
  | { type: "blocked_invuln" }
  | {
      type: "shield_break";
      invulnFrames: number;
      burst: { color: string; count: number };
    }
  | {
      type: "life_loss";
      lives: number;
      invulnFrames: number;
      shake: number;
      burst: { color: string; count: number };
      gameover: boolean;
      gameoverFrames: number;
    };

export function resolvePlayerHit(opts: {
  invulnFrames: number;
  shieldFrames: number;
  lives: number;
}): PlayerHitOutcome {
  if (opts.invulnFrames > 0) return { type: "blocked_invuln" };
  if (opts.shieldFrames > 0) {
    return {
      type: "shield_break",
      invulnFrames: 50,
      burst: { color: "#66ffff", count: 10 },
    };
  }
  const lives = opts.lives - 1;
  const gameover = lives < 0;
  return {
    type: "life_loss",
    lives: gameover ? 0 : lives,
    invulnFrames: 90,
    shake: 10,
    burst: { color: "#ff2244", count: 16 },
    gameover,
    gameoverFrames: 150,
  };
}

export function highScoreUpdate(
  score: number,
  high: number,
): { high: number; dirty: boolean } {
  if (score > high) return { high: score, dirty: true };
  return { high, dirty: false };
}
