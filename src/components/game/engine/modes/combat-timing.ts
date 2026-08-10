/**
 * Weapon fire intervals & spawn cadence (pure formulas from recovered Ki).
 * Levels come from unlocked+armed counts (`q(key)`).
 */

/** Main shot cooldown frames (after firing). */
export function shotCooldownFrames(rateLevel: number): number {
  const e = rateLevel;
  return Math.max(2, 8 - e * (e > 3 ? 0.35 : 1.1));
}

export function missileCooldownFrames(
  missileLevel: number,
  clusterLevel: number,
): number {
  return Math.max(22, 48 - missileLevel * 6 - clusterLevel * 4);
}

export function particleCooldownFrames(
  particleLevel: number,
  overdriveLevel: number,
): number {
  return Math.max(28, 70 - particleLevel * 8 - overdriveLevel * 6);
}

export function lockonCooldownFrames(
  lockonLevel: number,
  hyperLevel: number,
): number {
  return Math.max(10, 22 - lockonLevel * 2 - hyperLevel * 2);
}

export function beamCooldownFrames(beamLevel: number): number {
  return Math.max(28, 90 - beamLevel * 5);
}

export function flameCooldownFrames(flameLevel: number): number {
  return Math.max(4, 10 - Math.floor(flameLevel / 2));
}

/** Grunt spawn timer after each spawn. */
export function enemySpawnInterval(stage: number): number {
  return Math.max(18, 50 - stage * 2);
}

/** Player ship speed (px/sec scale used as * dt). */
export function playerSpeed(speedLevel: number, sense: number): number {
  return (120 + speedLevel * 35) * sense;
}

export function swipeFollowFactor(
  speedLevel: number,
  sense: number,
  dt: number,
): number {
  return Math.min(1, (12 + speedLevel * 2) * sense * dt);
}

/** Playfield clamp for player ship */
export const PLAYER_BOUNDS = {
  minX: 58,
  maxX: 262,
  minY: 36,
  maxY: 382,
} as const;

export function clampPlayerPos(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(PLAYER_BOUNDS.minX, Math.min(PLAYER_BOUNDS.maxX, x)),
    y: Math.max(PLAYER_BOUNDS.minY, Math.min(PLAYER_BOUNDS.maxY, y)),
  };
}
