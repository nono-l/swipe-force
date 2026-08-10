/**
 * Recovered-game API for the 64-stage boss roster.
 * Data lives in `@/lib/stages` — this file only aliases minified names.
 */
import {
  STAGE_COUNT,
  STAGE_BOSS_NAMES,
  STAGE_PALETTES,
  STAGE_BOSSES,
  bossForStage,
  bossById,
  stageDef,
  STAGES,
  type StageBossDef,
} from "@/lib/stages";

/** Boss names (recovered `Y`) */
export const Y = STAGE_BOSS_NAMES as string[];

/** Palettes (recovered `dn`) */
export const dn = STAGE_PALETTES as [string, string, string][];

/** Build roster (recovered `fn`) — returns same data as STAGE_BOSSES */
export function fn(): StageBossDef[] {
  return STAGE_BOSSES.map((b) => ({ ...b }));
}

/** Full roster array (recovered `pn` in meta — not the local particle list) */
export const pn: StageBossDef[] = STAGE_BOSSES as StageBossDef[];

/** Boss for 1-based stage (recovered `mn`) */
export function mn(stage: number): StageBossDef {
  return bossForStage(stage);
}

/** Boss by id 0..63 (recovered `hn`) */
export function hn(id: number): StageBossDef {
  return bossById(id);
}

export {
  STAGE_COUNT,
  STAGE_BOSSES,
  STAGE_BOSS_NAMES,
  STAGE_PALETTES,
  bossForStage,
  bossById,
  stageDef,
  STAGES,
};

export type { StageBossDef, StageDef } from "@/lib/stages";
