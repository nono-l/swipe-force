/**
 * Playing-mode combat step orchestration helpers (recovered Ki).
 * Pure decision bits only — side effects stay in the loop.
 */

import { tickWeaponCds, type WeaponCds, type WeaponLevels } from "./weapon-cds";
import {
  tickSpawnTimer,
  enemyShouldDespawn,
  enemyShouldFire,
  enemyReloadFrames,
} from "./enemy-step";
import { bulletOutOfBounds } from "./missile-homing";
import { enemySpawnInterval } from "./combat-timing";

export type CombatFireName =
  | "shot"
  | "missile"
  | "particle"
  | "lockon"
  | "beam"
  | "flame";

export function planWeaponFire(
  cds: WeaponCds,
  levels: WeaponLevels,
  dt: number,
): { cds: WeaponCds; fire: CombatFireName[] } {
  return tickWeaponCds(cds, levels, dt);
}

export function planSpawn(opts: {
  bossActive: boolean;
  spawnCd: number;
  kills: number;
  killTarget: number;
  stage: number;
}): { spawnCd: number; spawn: boolean; startBoss: boolean; afterSpawnCd?: number } {
  if (opts.bossActive) {
    return { spawnCd: opts.spawnCd, spawn: false, startBoss: false };
  }
  const sp = tickSpawnTimer(
    opts.spawnCd,
    opts.kills,
    opts.killTarget,
    opts.bossActive,
  );
  return {
    spawnCd: sp.spawnCd,
    spawn: sp.spawn,
    startBoss: sp.startBoss,
    afterSpawnCd: sp.spawn ? enemySpawnInterval(opts.stage) : undefined,
  };
}

export {
  enemyShouldDespawn,
  enemyShouldFire,
  enemyReloadFrames,
  bulletOutOfBounds,
};
