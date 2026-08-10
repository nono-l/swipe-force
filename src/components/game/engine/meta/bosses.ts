/**
 * Recovered-game API for the 64-stage boss roster.
 * Data lives in `@/lib/stages` — readable re-exports only.
 */
import {
  STAGE_COUNT,
  STAGE_BOSS_NAMES,
  STAGE_PALETTES,
  STAGE_BOSSES,
  bossForStage as bossForStageImpl,
  bossById as bossByIdImpl,
  stageDef,
  STAGES,
  type StageBossDef,
} from "@/lib/stages";

/** Boss display names in stage order */
export const BOSS_NAMES = STAGE_BOSS_NAMES as string[];
/** @deprecated minified alias — use BOSS_NAMES */
export const Y = BOSS_NAMES;

/** Stage color palettes */
export const STAGE_PALETTE_LIST = STAGE_PALETTES as [string, string, string][];

/** Clone of full boss roster */
export function buildBossRoster(): StageBossDef[] {
  return STAGE_BOSSES.map((b) => ({ ...b }));
}

/** Full roster array (id 0..63) */
export const BOSS_BY_ID_MAP: StageBossDef[] = STAGE_BOSSES as StageBossDef[];

/** Boss for 1-based stage */
export function bossForStage(stage: number): StageBossDef {
  return bossForStageImpl(stage);
}

/** Boss by id 0..63 */
export function bossById(id: number): StageBossDef {
  return bossByIdImpl(id);
}

export {
  STAGE_COUNT,
  STAGE_BOSSES,
  STAGE_BOSS_NAMES,
  STAGE_PALETTES,
  stageDef,
  STAGES,
};

export type { StageBossDef, StageDef } from "@/lib/stages";
