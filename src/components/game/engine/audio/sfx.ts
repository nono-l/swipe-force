// @ts-nocheck
/**
 * Sound effects (one-shots). Implementation: ./engine.ts
 *
 * Recovered short names are re-exported for the game loop.
 * Prefer the readable aliases in new code.
 */
export {
  // low-level helpers sometimes used with SE
  g as throttleSfx,
  b as tone,
  x as noiseBurst,
  // one-shots (recovered names)
  se,
  ce,
  le,
  ue,
  de,
  fe,
  pe,
  me,
  he,
  ge,
  _e,
  C,
  w,
  ve,
  // readable aliases
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
} from "./engine";
