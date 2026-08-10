/**
 * @deprecated Prefer `@/lib/stages` — kept for existing imports.
 * Re-exports the 64-stage boss roster.
 */
export {
  STAGE_COUNT,
  STAGE_BOSSES as BOSSES,
  STAGE_BOSS_NAMES,
  STAGE_PALETTES,
  bossForStage,
  bossById,
  stageDef,
  STAGES,
  type StageBossDef as BossDef,
  type StageDef,
} from "./stages";
