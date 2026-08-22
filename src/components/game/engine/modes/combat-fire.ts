/**
 * JPDOC: 自機の発射。
 */
/**
 * Named player/enemy fire entrypoints (thin wrappers over projectile builders).
 */

import {
  buildPlayerShots,
  buildMissiles,
  buildParticles,
  buildBeams,
  buildFlames,
  buildEnemyFire,
  type BulletDesc,
  type ShotLevels,
} from "./combat-projectiles";
import { buildLockonHits } from "./combat-fx";
import { buildGrunt, buildBossEntity, type EnemyDesc } from "./combat-enemies";

export function createPlayerShots(
  px: number,
  py: number,
  lv: ShotLevels,
): BulletDesc[] {
  return buildPlayerShots(px, py, lv);
}

export function createMissiles(opts: {
  px: number;
  py: number;
  missile: number;
  cluster: number;
  targets: { id: number; x: number; y: number }[];
}): BulletDesc[] {
  return buildMissiles(opts);
}

export function createParticles(opts: {
  px: number;
  py: number;
  particle: number;
  overdrive: number;
}): BulletDesc[] {
  return buildParticles(opts);
}

export function createBeams(opts: {
  px: number;
  py: number;
  beam: number;
  power: number;
  option: number;
}): BulletDesc[] {
  return buildBeams(opts);
}

export function createFlames(opts: {
  px: number;
  py: number;
  flame: number;
  power: number;
}): BulletDesc[] {
  return buildFlames(opts);
}

export function createEnemyVolley(
  enemy: Parameters<typeof buildEnemyFire>[0],
  px: number,
  py: number,
  atk: number,
): BulletDesc[] {
  return buildEnemyFire(enemy, px, py, atk);
}

export function createLockonHits(opts: {
  targets: any[];
  lockon: number;
  hyper: number;
}) {
  return buildLockonHits(opts);
}

export function spawnGrunt(opts: {
  id: number;
  stage: number;
  hpScale: number;
}): EnemyDesc {
  return buildGrunt(opts);
}

export function spawnBoss(opts: {
  id: number;
  stage: number;
  hpScale: number;
  boss: any;
  fieldCenterX: number;
}): EnemyDesc {
  return buildBossEntity(opts);
}
