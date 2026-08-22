/**
 * JPDOC: エンジンから BGM へ渡す薄い橋。
 */
/**
 * Readable BGM bridge over recovered audio short names.
 */

import {
  bgmStartScene as startBgm,
  bgmBoss as startBossBgm,
  bgmStop as startLegacyBossBgm,
  bgmArchive as startArchiveBgm,
  bgmUnlock as stopBgm,
  bgmSetMaster as unlockAudio,
  bgmSetMuted as setMuted,
  bgmToggleMute as toggleMute,
  bgmSetBgmVol as setMasterVol,
  bgmSetSfxVol as setBgmVol,
  bgmIsMuted as setSfxVol,
} from "../audio/bgm";

export const bgm = {
  start: startBgm,
  boss: startBossBgm,
  legacyBoss: startLegacyBossBgm,
  archive: startArchiveBgm,
  stop: stopBgm,
  unlock: unlockAudio,
  setMuted,
  toggleMute,
  setMasterVol,
  setBgmVol,
  setSfxVol,
} as const;

/** Recovered `bgmStartScene(mode, stage?)` for attract / play beds. */
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

/** Recovered `bgmBoss(themeIndex, stage)` boss bed. */
export function playBossBgm(themeIndex: number, stage?: number): void {
  startBossBgm(themeIndex, stage ?? 1);
}
