/**
 * JPDOC: 武器クールダウン。
 */
/**
 * Weapon cooldown ticks + fire decisions (recovered Ki playing block).
 */

import {
  shotCooldownFrames,
  missileCooldownFrames,
  particleCooldownFrames,
  lockonCooldownFrames,
  beamCooldownFrames,
  flameCooldownFrames,
} from "./combat-timing";

export type WeaponCds = {
  shot: number;
  missile: number;
  particle: number;
  lockon: number;
  beam: number;
  flame: number;
};

export type WeaponLevels = {
  rate: number;
  missile: number;
  cluster: number;
  particle: number;
  overdrive: number;
  lockon: number;
  hyper: number;
  beam: number;
  flame: number;
  shotArmed: boolean;
  optionArmed: boolean;
  linked: boolean;
};

export type WeaponFire =
  | "shot"
  | "missile"
  | "particle"
  | "lockon"
  | "beam"
  | "flame";

export function tickWeaponCds(
  cds: WeaponCds,
  levels: WeaponLevels,
  dt: number,
): { cds: WeaponCds; fire: WeaponFire[] } {
  const mul = dt * 60;
  const next = { ...cds };
  const fire: WeaponFire[] = [];

  next.shot -= mul;
  if (next.shot <= 0) {
    if (levels.shotArmed || levels.optionArmed) fire.push("shot");
    next.shot = shotCooldownFrames(levels.rate);
  }

  next.missile -= mul;
  if (next.missile <= 0 && levels.missile > 0) {
    fire.push("missile");
    next.missile = missileCooldownFrames(levels.missile, levels.cluster);
  }

  next.particle -= mul;
  if (next.particle <= 0 && levels.particle > 0) {
    fire.push("particle");
    next.particle = particleCooldownFrames(levels.particle, levels.overdrive);
  }

  next.lockon -= mul;
  if (next.lockon <= 0 && levels.lockon > 0) {
    fire.push("lockon");
    next.lockon = lockonCooldownFrames(levels.lockon, levels.hyper);
  }

  next.beam -= mul;
  if (next.beam <= 0 && levels.beam > 0 && levels.linked) {
    fire.push("beam");
    next.beam = beamCooldownFrames(levels.beam);
  }

  next.flame -= mul;
  if (next.flame <= 0 && levels.flame > 0 && levels.linked) {
    fire.push("flame");
    next.flame = flameCooldownFrames(levels.flame);
  }

  return { cds: next, fire };
}
