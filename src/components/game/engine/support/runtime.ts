/**
 * Named runtime bindings for recovered-game (split by source module).
 * Readable names after deobfuscation of the minified production bundle.
 */

// ── BGM / music (includes short aliases for residual callers) ──
export * from "../audio/bgm";

// ── SFX ──
export * from "../audio/sfx";

// Shared audio primitives still used by bridges / advanced code
export {
  c,
  d,
  f,
  h,
  l,
  m,
  p,
  u,
  tone,
  noiseBurst,
  throttleSfx,
  ensureAudioCtx,
  getMasterGain,
  makeEnvGain,
  midiToHz,
  BAROQUE_SCALES,
  FUGUE_SUBJECTS,
  FUGUE_COUNTERS,
  makeFuguePatch,
  BAROQUE_PROGS,
  BAROQUE_LEADS,
  sfxBuy,
  sfxBuyFail,
  sfxUi,
  sfxHit,
  sfxExplode,
  sfxGameOver,
  sfxStageClear,
  sfxBossWarn,
  sfxPlayerHit,
  sfxLockon,
  sfxStart,
  sfxShoot,
  sfxMissile,
  sfxParticle,
} from "../audio/engine";

export {
  fetchAccountGet,
  KEY_EASY_CLOUD,
  unlinkAccountLocal,
  authHeaders,
  setLinkedPlayerId,
  loadEasyUpgradesCloud,
  applyCloudSnapshot,
  mergeInboxMessages,
  KEY_LOCAL_PLAYER,
  ensureLocalPlayerId,
  mergeEasyUpgrades,
  KEY_CLOUD_INBOX,
  saveEasyUpgradesCloud,
  KEY_LINKED_PLAYER,
  EMPTY_EASY_UPGRADES,
  loadPlayerId,
  linkAccountPost,
  syncAccountCloud,
} from "../meta/account-cloud";

export {
  Y,
  BOSS_NAMES,
  STAGE_PALETTE_LIST,
  buildBossRoster,
  bossById,
  bossForStage,
  BOSS_BY_ID_MAP,
  STAGE_COUNT,
  STAGE_BOSSES,
  STAGE_BOSS_NAMES,
  STAGE_PALETTES,
} from "../meta/bosses";

export {
  getMissionsForShare,
  newPlayerId,
  loadAllMissions,
  addCoins,
  markFanmailSent,
  canSendFanmailTo,
  parseShareParams,
  markMissionDone,
  allMissionsComplete,
  saveAllMissions,
  hasSentFanmail,
  buildShareUrl,
  MISSION_DEFS,
  setCoins,
  KEY_COINS_LEGACY,
  KEY_MSGS,
  KEY_PLAYER_ID,
  isMissionDone,
  newShareId,
  KEY_COIN_LEDGER,
  getCoins,
  KEY_MSG_SENT,
  KEY_MISSIONS,
  formatShareProgress,
} from "../meta/player-local";

export {
  PLAY_W,
  PLAY_H,
  RAIL_W,
  LEFT_RAIL,
  FIELD_RIGHT,
  FIELD_INNER_W,
  DEFAULT_UPGRADES,
  SHOP_ITEMS,
  LINKED_ITEM_IDS,
  SETTINGS_KEY,
  EASY_UP_KEY,
  HI_SCORE_KEY,
  NAME_CHARSET,
  jsxRuntime,
} from "../meta/playfield_shop";

export {
  sanitizeUserText,
  saveLocalCommentsStore,
  RE_SQLISH,
  isEmojiModifier,
  sanitizeUrlList,
  MAX_URL_COUNT,
  cacheLocalComment,
  normalizeCommentKind,
  mergeTrackComments,
  KEY_SOUND_COMMENTS,
  sanitizeTextCore,
  sanitizeReasonText,
  isAllowedChar,
  MAX_URL_LEN,
  makeTrackKey,
  RE_UNSAFE_CHARS,
  fetchTrackComments,
  getLocalTrackComments,
  postTrackComment,
  LONG_TEXT_MAX,
  sanitizeLongText,
  graphemeLength,
  RE_CONTROL_CHARS,
  SHARE_TEXT_MAX,
  loadLocalCommentsStore,
} from "../meta/sanitize";

export {
  deleteInboxMessage,
  openShareSheet,
  normalizeInboxMessage,
  reportMissionClear,
  loadIdSet,
  KEY_INBOX_DELETED,
  removeLocalInbox,
  spendContinueCoin,
  fetchCoinBalance,
  canReplyThanks,
  loadLocalInbox,
  saveIdSet,
  pushLocalInbox,
  sendThanksReply,
  fetchInboxMessages,
  KEY_INBOX_HIDDEN,
  sendFanmailMessage,
} from "../meta/share-net";

export {
  KEY_SOUND_VOTES,
  saveUrlVisits,
  getLocalVotes,
  loadVotesStore,
  loadUrlReportsStore,
  castTrackVote,
  fetchTrackVotes,
  loadUrlVisits,
  urlReportKey,
  KEY_URL_REPORTS,
  saveVotesStore,
  KEY_URL_VISITS,
} from "../meta/sound_social";

export {
  APP_VERSION,
  VERSION_HISTORY,
  versionShortLabel,
} from "../meta/version";

/** React shim for residual recovered UI */
export { s } from "../recovered-support";
