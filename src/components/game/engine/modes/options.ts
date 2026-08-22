/**
 * JPDOC: オプション状態。
 */
/**
 * Options mode map (recovered-game).
 *
 * Entry: mergeEasyUpgrades(from)  from = "attract" | "shop"
 * Back:  mergeInboxMessages()
 * Subtree: z = "main" | "weapons" | "shot"
 * Cursor: R
 *
 * Row building & value formatting: ./options-rows.ts (pure).
 * Persist: loadVotesStore() → localStorage OPTIONS_KEY + apply audio (KEY_SOUND_VOTES).
 */

export {
  buildOptionRows,
  formatVolumeBar,
  formatLoadoutSummary,
  formatShotSubSummary,
  formatOptionValue,
  SHOT_DETAIL_KEYS,
  LOADOUT_WEAPON_KEYS,
  LOADOUT_COUNT_KEYS,
  SHOT_SUMMARY_KEYS,
} from "./options-rows";

export type {
  OptionRow,
  OptionsSubmenu,
  OptionValueState,
} from "./options-rows";

export const OPTIONS_SUBMENUS = ["main", "weapons", "shot"] as const;
export const OPTIONS_FROM = ["attract", "shop"] as const;

export type OptionsFrom = (typeof OPTIONS_FROM)[number] | string;
