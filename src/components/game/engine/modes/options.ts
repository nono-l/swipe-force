/**
 * Options mode map (recovered-game).
 *
 * Entry: mr(from)  from = "attract" | "shop"
 * Back:  hr()
 * Subtree: z = "main" | "weapons" | "shot"
 * Cursor: R
 *
 * Row building & value formatting: ./options-rows.ts (pure).
 * Persist: Kt() → localStorage OPTIONS_KEY + apply audio (Gt).
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
