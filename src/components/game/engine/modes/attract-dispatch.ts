/**
 * Attract menu pointer action routing labels (recovered Gi).
 * Pure decision only — side effects stay in the game loop.
 */

export type AttractDispatch =
  | { type: "account" }
  | { type: "side_back_extra" }
  | { type: "side_back_diff" }
  | { type: "side_options" }
  | { type: "side_extra" }
  | { type: "sound_test" }
  | { type: "profile" }
  | { type: "stats" }
  | { type: "back_root"; cursor: number }
  | { type: "start_easy" }
  | { type: "start_normal" }
  | { type: "open_diff"; preferNormal: boolean }
  | { type: "share" }
  | { type: "inbox" }
  | { type: "options" }
  | { type: "open_extra" }
  | { type: "changelog" }
  | { type: "noop_ui" };

/** Pass-through of resolveAttractPointer action → dispatch token. */
export function toAttractDispatch(action: { type: string; [k: string]: any }): AttractDispatch {
  const a = action;
  switch (a.type) {
    case "account":
    case "side_back_extra":
    case "side_back_diff":
    case "side_options":
    case "side_extra":
    case "sound_test":
    case "profile":
    case "stats":
    case "start_easy":
    case "start_normal":
    case "share":
    case "inbox":
    case "options":
    case "open_extra":
    case "changelog":
      return { type: a.type };
    case "back_root":
      return { type: "back_root", cursor: a.cursor ?? 0 };
    case "open_diff":
      return { type: "open_diff", preferNormal: !!a.preferNormal };
    default:
      return { type: "noop_ui" };
  }
}
