/**
 * JPDOC: modes をエンジンへ渡す公開バレル。
 */
/**
 * Aggregated pure helpers for recovered-game wiring.
 */

export {
  buildOptionRows,
  formatVolumeBar,
  formatLoadoutSummary,
  formatShotSubSummary,
  formatOptionValue,
  LOADOUT_COUNT_KEYS,
  SHOT_SUMMARY_KEYS,
} from "./options-rows";

export {
  buildTitleMenu,
  titleMenuYs,
  titleHitHeights,
  titleMenuLen,
  titleSelectLabel,
} from "./title-menu";

export {
  getSideRailButtons,
  sideRailHints,
} from "./side-rails";

export {
  shopItemCost,
  shopItemMax,
  enemyHpMultiplier,
  scoreHpThresholds,
  shopUnlockTier,
  filterShopCatalog,
  normalCostScale,
} from "./shop-pricing";

export { listWindowStart } from "./list-scroll";

export {
  buildTrackCard,
  commentKindEmoji,
  commentKindLabel,
  SOUND_TEST_MENU,
} from "./sound-test-meta";

export {
  buildSoundTestRootMenu,
  buildSoundTestTrackList,
  soundTestPageSize,
  soundTestListWindow,
  buildCommentRows,
  soundTestListHeader,
  soundTestCommentsFooterHit,
  soundTestPlayingFooterHit,
} from "./sound-test-lists";

export {
  buildChangelogRows,
  changelogMaxScroll,
  changelogVisibleRows,
  changelogBackHit,
} from "./changelog-rows";

export { resolveAttractPointer } from "./attract-actions";

export { muteButtonHit, gameOverHit } from "./pointer-zones";

export {
  shotCooldownFrames,
  missileCooldownFrames,
  particleCooldownFrames,
  lockonCooldownFrames,
  beamCooldownFrames,
  flameCooldownFrames,
  enemySpawnInterval,
  playerSpeed,
  swipeFollowFactor,
  clampPlayerPos,
} from "./combat-timing";

export {
  keyboardAxis,
  normalizeAxis,
  virtualStickAxis,
  VSTICK_DEADZONE,
} from "./player-input";

export { shopPointerDown } from "./shop-hit";

export { optionsRowAtY, optionsSwipeStep, OPTIONS_PAGE } from "./options-hit";

export { stepBossPosition } from "./boss-motion";

export {
  buildPlayerShots,
  buildMissiles,
  buildParticles,
  buildBeams,
  buildFlames,
  buildEnemyFire,
} from "./combat-projectiles";

export { buildGrunt, buildBossEntity } from "./combat-enemies";

export { aabbOverlap, playerBulletHit, enemyPlayerHit } from "./collision";

export { buildBurstParticles, buildLockonHits } from "./combat-fx";

export { pickNearestEnemies } from "./combat-targeting";

export { bulletRects, gruntLocalRects, screenShakeOffset, starColor } from "./draw-specs";

export { bossLocalRects, bossHpBar, bossFlashAlpha } from "./draw-boss";

export {
  PLAYER_SHIP_PATH,
  PLAYER_SHIP_FILL,
  playerShipLocalRects,
  optionPodRects,
  virtualStickLayout,
} from "./draw-player";

export { buildWeaponChips, buildHudFlags, lifePipXs } from "./hud-chips";

export { titleMenuRowColors, titleLinkStyle, titleInboxLabels } from "./title-draw";

export {
  buildGameOverView,
  buildNameEntryView,
  stageBanner,
} from "./draw-gameover";

export {
  buildInboxListRows,
  buildInboxDetail,
} from "./draw-inbox";

export {
  buildMissionChips,
  missionNextLine,
  buildTitleMissionRows,
  titleMissionFooter,
} from "./mission-hud";

export {
  sideRailBtnStyle,
  muteLabel,
  SIDE_RAIL_BRAND,
} from "./side-rail-draw";

export { buildSharePayload } from "./share-context";

export {
  missionClearFloats,
  missionTooFastFloats,
  fanmailGate,
  fanmailGateMessage,
} from "./mission-feedback";

export { buildNewRunSeed, buildStageSeed } from "./session-state";

export { applyShopPurchase } from "./shop-purchase";

export {
  applyOptionDelta,
  dodgeOnlyFeedback,
} from "./options-adjust";

export {
  ownedLevel,
  armedLevel,
  isArmed,
  countArmedWeapons,
} from "./loadout";

export { loadEasyCarry, serializeEasyCarry } from "./easy-carry";

export { buildContinueSeed } from "./continue-state";

export {
  optionsCursorStep,
  optionsActivate,
  optionsBackTarget,
} from "./options-nav";

export {
  defaultWepLv,
  defaultSettings,
  mergeSettingsFromStorage,
} from "./settings-storage";

export {
  soundTestRowAtY,
  soundTestMenuAction,
  soundTestListAction,
} from "./sound-test-input";

export { resolveKeyAction } from "./keyboard-actions";

export {
  routePointerDown,
  nameEntryHit,
  playMoveFromPointer,
} from "./pointer-dispatch";

export { inboxPointerHit } from "./inbox-hit";

export {
  commentsFooterButtons,
  playingFooterButtons,
  soundTestListTop,
} from "./sound-test-draw";

export {
  shopHeaderChips,
  shopFooterButtonsExact,
  shopTierHint,
  shopStatusLine,
} from "./shop-draw";

export { shopPointerUp, shopEmptyConfirm } from "./shop-confirm";

export { trackCardLayout } from "./track-card-draw";

export {
  optionsScreenTitle,
  optionsRowColors,
  optionsHint,
} from "./options-draw";

export { requireLinked } from "./link-gate";

export {
  canOpenComments,
  commentsReturnMode,
} from "./sound-comments-flow";

export {
  optionsPointerDown,
  optionsPointerUp,
} from "./options-pointer";

export {
  soundTestPointerDown,
  soundTestPointerUp,
  dragScrollSteps,
} from "./sound-test-pointer";

export {
  shopCursorMax,
  shopCursorStep,
  shopDragScroll,
} from "./shop-scroll";

export { tickMode } from "./mode-tick";

export {
  openShopSeed,
  closeShopSeed,
  openOptionsSeed,
} from "./screen-nav";

export {
  tickStars,
  tickFloats,
  tickLifetimes,
  tickParticles,
  decayTimers,
} from "./fx-tick";

export {
  drawRoute,
  fieldDrawsEntities,
  fieldShowsHud,
} from "./draw-frame";

export { tickWeaponCds } from "./weapon-cds";

export { steerMissile, bulletOutOfBounds } from "./missile-homing";

export {
  stepEnemyMotion,
  enemyShouldDespawn,
  enemyShouldFire,
  enemyReloadFrames,
  tickSpawnTimer,
} from "./enemy-step";

export {
  titleNoiseDot,
  titleNoiseRgb,
  titleHeader,
  continueCoinLine,
  titleFooter,
} from "./title-screen";

export {
  shieldStrokeColor,
  invulnBlink,
  floatTextAlpha,
  particleAlpha,
  lockonAlpha,
} from "./field-draw";

export { applyEnemyDamage } from "./combat-damage";

export { resolvePlayerHit, highScoreUpdate } from "./player-hit";

export {
  buildHudTop,
  buildHudBottomChips,
  enemyHpHud,
} from "./hud-layout";

export { vstickDrawOps, vstickVisible } from "./vstick-draw";

export { totalHpScale } from "./difficulty-scale";

export { buildShopRows, shopFooterIndices } from "./shop-rows";

export {
  firstBossMissionId,
  bossClearMissionId,
  canAttemptMission,
  missionPlaySeconds,
  BOSS_CLEAR_MISSION,
  FIRST_BOSS_MISSION,
} from "./mission-progress";

export {
  sfx,
  playSfx,
} from "./sfx-bridge";

export {
  bgm,
  playSceneBgm,
  playBossBgm,
} from "./bgm-bridge";


export {
  createPlayerShots,
  createMissiles,
  createParticles,
  createBeams,
  createFlames,
  createEnemyVolley,
  createLockonHits,
  spawnGrunt,
  spawnBoss,
} from "./combat-fire";

export { toAttractDispatch } from "./attract-dispatch";
export { routePointerMove, clampSwipeFollow } from "./pointer-move";
export { buildSideRailPaint } from "./side-rail-paint";

export { stageBannerOverlay, scanlineFill } from "./field-overlays";
export { planWeaponFire, planSpawn } from "./play-combat-step";

export {
  BAG_KEY,
  BAG_PENDING_KEY,
  loadBag,
  serializeBag,
  loadPending,
  serializePending,
  addBagStock,
  consumeBagStock,
  bagFieldForShopId,
  isStockableShopId,
  buildBagRows,
  buildStageSelectRows,
  maxSelectableStage,
  EMPTY_BAG,
  EMPTY_PENDING,
} from "./bag-inventory";
export type { BagStock, BagPending, BagRow } from "./bag-inventory";

export {
  LOGIN_BONUS_KEY,
  PROMO_CLAIMED_KEY,
  CUSTOM_PROMO_KEY,
  loginBonusGrant,
  formatGrantSummary,
  applyGrantToBag,
  loadLastLoginDate,
  serializeLoginBonus,
  canClaimLoginBonus,
  claimLoginBonus,
  loadClaimedPromos,
  serializeClaimedPromos,
  parsePromoFromUrl,
  claimPromoCode,
  stripPromoFromUrl,
  jstDateKey,
  PROMO_DEFS,
  getAllPromoDefs,
  loadCustomPromos,
  upsertCustomPromo,
  deleteCustomPromo,
  buildPromoUrl,
  unclaimPromoCode,
  findPromoDef,
} from "./bag-grants";

export {
  isPromoAdminPlayer,
  isSuperAdmin,
  SUPER_ADMIN_PLAYER_ID,
  ADMIN_PLAYER_IDS,
  fetchStaffList,
  appointAdmin,
  removeAppointedAdmin,
  loadExtraAdminIds,
} from "./admin";


