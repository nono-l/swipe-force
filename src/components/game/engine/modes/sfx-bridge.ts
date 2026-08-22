/**
 * JPDOC: SE 呼び出しの橋。
 */
/**
 * Readable SFX bridge over recovered audio short names.
 */

import {
  sfxShoot as sfxShoot,
  sfxMissile as sfxMissile,
  sfxParticle as sfxParticle,
  sfxLockon as sfxLockon,
  sfxHit as sfxHit,
  sfxExplode as sfxExplode,
  sfxPlayerHit as sfxPlayerHit,
  sfxBossWarn as sfxBossWarn,
  sfxStageClear as sfxStageClear,
  sfxGameOver as sfxGameOver,
  sfxBuy as sfxBuy,
  sfxBuyFail as sfxBuyFail,
  sfxUi as sfxUi,
  sfxSelect as sfxSelect,
  sfxStart as sfxStart,
} from "../audio/sfx";

export const sfx = {
  shoot: sfxShoot,
  missile: sfxMissile,
  particle: sfxParticle,
  lockon: sfxLockon,
  hit: sfxHit,
  explode: sfxExplode,
  playerHit: sfxPlayerHit,
  bossWarn: sfxBossWarn,
  stageClear: sfxStageClear,
  gameOver: sfxGameOver,
  buy: sfxBuy,
  buyFail: sfxBuyFail,
  ui: sfxUi,
  select: sfxSelect,
  start: sfxStart,
} as const;

export type SfxName = keyof typeof sfx;

export function playSfx(name: SfxName): void {
  sfx[name]?.();
}
