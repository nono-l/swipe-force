/**
 * JPDOC: プレイ領域・レール幅など、描画と当たり判定が共有する定数。
 */
/**
 * Documented storage keys / constants used by the recovered engine.
 * Values must stay in sync with recovered-support / recovered-game.
 * (This file is documentation + bgmSetBgmVol-exports for new code; the recovered
 * modules still embed the same string literals.)
 */

export const STORAGE = {
  hiScore: "swipe_force_hi_v1",
  options: "swipe_force_opt_v5",
  easyUpgrades: "swipe_force_easy_up_v1",
  playerId: "swipe_force_player_v1",
  coins: "swipe_force_coins_v1",
  missions: "swipe_force_missions_v1",
  inbox: "swipe_force_msgs_v1",
  stats: "swipe_force_stats_v1",
  profile: "swipe_force_profile_v1",
  bag: "swipe_force_bag_v1",
  bagPending: "swipe_force_bag_pending_v1",
  loginBonus: "swipe_force_login_bonus_v1",
  promoClaimed: "swipe_force_promo_claimed_v1",
} as const;

export const PLAYFIELD = {
  /** logical canvas width (game units) */
  baseW: 320,
  baseH: 400,
  sideW: 48,
} as const;

export const APP_MODES = [
  "attract",
  "ready",
  "playing",
  "bossintro",
  "shop",
  "options",
  "bag",
  "stageselect",
  "stageclear",
  "gameover",
  "name",
  "changelog",
  "soundtest",
  "inbox",
] as const;

export type AppMode = (typeof APP_MODES)[number] | string;
