/**
 * Readable BGM bridge over recovered audio short names.
 */

import {
  W as startBgm,
  mt as startBossBgm,
  ht as startLegacyBossBgm,
  gt as stopBgm,
  ee as unlockAudio,
  te as setMuted,
  ne as toggleMute,
  re as setMasterVol,
  ie as setBgmVol,
  ae as setSfxVol,
} from "../audio/bgm";

export const bgm = {
  start: startBgm,
  boss: startBossBgm,
  legacyBoss: startLegacyBossBgm,
  stop: stopBgm,
  unlock: unlockAudio,
  setMuted,
  toggleMute,
  setMasterVol,
  setBgmVol,
  setSfxVol,
} as const;

/** Recovered `W(mode, stage?)` for attract / play beds. */
export function playSceneBgm(mode: string, stage?: number): void {
  if (mode === "attract") {
    startBgm("attract");
    return;
  }
  if (mode === "play") {
    startBgm("play", stage);
    return;
  }
  startBgm(mode, stage);
}

/** Recovered `mt(themeIndex, stage)` boss bed. */
export function playBossBgm(themeIndex: number, stage?: number): void {
  startBossBgm(themeIndex, stage ?? 1);
}
