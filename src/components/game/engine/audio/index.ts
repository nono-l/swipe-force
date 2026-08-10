/**
 * Audio public surface.
 * - ./sfx  — sound effects
 * - ./bgm  — music
 * - ./engine — full implementation (shared state)
 */
export * from "./sfx";
export * from "./bgm";
// context-level state & oscillators for advanced use
export {
  c as audioCtx,
  l as masterGain,
  u as muted,
  d as masterVol,
  f as bgmVol,
  p as sfxVol,
  m as baseGainScale,
  h as sfxThrottleMap,
  c,
  l,
  u,
  d,
  f,
  p,
  m,
  h,
  throttleSfx,
  ensureAudioCtx,
  getMasterGain,
  makeEnvGain,
  tone,
  noiseBurst,
  midiToHz,
} from "./engine";
export * from "./boss-themes";
