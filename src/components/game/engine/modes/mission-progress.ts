/**
 * JPDOC: シェアミッションの進捗。
 */
/**
 * Share-mission stage triggers (recovered hi / gi).
 */

/** Stage number → mission id when that stage's boss is cleared. */
export const BOSS_CLEAR_MISSION: Record<number, string> = {
  2: "m2",
  3: "m3",
  4: "m4",
};

/** First-boss (stage 1 intro) mission. */
export const FIRST_BOSS_MISSION = "m1";

export function firstBossMissionId(
  stage: number,
  alreadyFlagged: boolean,
): string | null {
  if (alreadyFlagged) return null;
  if (stage === 1) return FIRST_BOSS_MISSION;
  return null;
}

export function bossClearMissionId(stage: number): string | null {
  return BOSS_CLEAR_MISSION[stage] ?? null;
}

export function canAttemptMission(opts: {
  sharerId: string | null | undefined;
  shareId: string | null | undefined;
  alreadyDone: boolean;
}): boolean {
  return !!(opts.sharerId && opts.shareId && !opts.alreadyDone);
}

export function missionPlaySeconds(startedAt: number, now = performance.now()): number {
  return (now - startedAt) / 1e3;
}
