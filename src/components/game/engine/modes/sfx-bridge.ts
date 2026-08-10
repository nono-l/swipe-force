/**
 * Readable SFX bridge over recovered audio short names.
 */

import {
  se as sfxShoot,
  ce as sfxMissile,
  le as sfxParticle,
  ue as sfxLockon,
  de as sfxHit,
  fe as sfxExplode,
  pe as sfxPlayerHit,
  me as sfxBossWarn,
  he as sfxStageClear,
  ge as sfxGameOver,
  _e as sfxBuy,
  C as sfxBuyFail,
  w as sfxUi,
  ve as sfxStart,
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
  start: sfxStart,
} as const;

export type SfxName = keyof typeof sfx;

export function playSfx(name: SfxName): void {
  sfx[name]?.();
}
