/**
 * JPDOC: オプション値の増減。
 */
/**
 * Options row delta application (recovered inner Nr(e)).
 * Pure settings mutation + feedback strings; no audio/DOM.
 */

export type OptionRowLike = {
  kind: string;
  key?: string;
  label?: string;
};

export type SettingsLike = {
  master?: number;
  bgm?: number;
  sfx?: number;
  muted?: boolean;
  shake?: boolean;
  scanlines?: boolean;
  sense: number;
  vstick: boolean;
  autoShop?: boolean;
  wepLv: Record<string, number>;
  [k: string]: unknown;
};

export type OptionAdjustResult =
  | { type: "noop" }
  | { type: "navigate_shot" }
  | { type: "navigate_weapons" }
  | { type: "back" }
  | { type: "title" }
  | { type: "locale" }
  | {
      type: "applied";
      settings: SettingsLike;
      feedback?: string;
      feedbackLife?: number;
      clearVstick?: boolean;
      replayAttractIfUnmuted?: boolean;
    };

export function applyOptionDelta(opts: {
  row: OptionRowLike | undefined;
  delta: number;
  settings: SettingsLike;
  maxArmed: (key: string) => number;
  currentArmed: (key: string) => number;
  weaponsEnabledCount: number;
}): OptionAdjustResult {
  const n = opts.row;
  if (!n) return { type: "noop" };
  if (n.kind === "header") return { type: "noop" };
  if (n.kind === "back") return { type: "back" };
  if (n.kind === "title") return { type: "title" };
  if (n.kind === "locale") return { type: "locale" };
  if (n.kind === "submenu") {
    if (n.key === "shot") return { type: "navigate_shot" };
    return { type: "navigate_weapons" };
  }

  const K: SettingsLike = {
    ...opts.settings,
    wepLv: { ...opts.settings.wepLv },
  };
  let feedback: string | undefined;
  let feedbackLife: number | undefined;
  let clearVstick = false;
  let replayAttractIfUnmuted = false;

  if (n.kind === "vol" && n.key) {
    const cur = Number(K[n.key] ?? 0);
    K[n.key] = Math.max(0, Math.min(10, cur + opts.delta));
    replayAttractIfUnmuted = true;
  } else if (n.kind === "toggle" && n.key) {
    K[n.key] = !K[n.key];
    if (n.key === "vstick" && !K.vstick) clearVstick = true;
    if (n.key === "muted") replayAttractIfUnmuted = true;
  } else if (n.kind === "sense") {
    K.sense = Math.round((K.sense + opts.delta * 0.1) * 10) / 10;
    K.sense = Math.max(0.6, Math.min(1.6, K.sense));
  } else if (n.kind === "weapon" && n.key) {
    const t = opts.maxArmed(n.key);
    const r = opts.currentArmed(n.key);
    const i = Math.max(0, Math.min(t, r + opts.delta));
    K.wepLv[n.key] = i;
    feedback =
      i <= 0 ? `${n.label} OFF` : `${n.label} → Lv${i}/${t}`;
    feedbackLife = 55;
  } else {
    return { type: "noop" };
  }

  return {
    type: "applied",
    settings: K,
    feedback,
    feedbackLife,
    clearVstick,
    replayAttractIfUnmuted,
  };
}

/** Post-adjust toast when loadout fully disabled */
export function dodgeOnlyFeedback(
  weaponsEnabled: number,
  fallback: string | undefined,
): string | undefined {
  if (weaponsEnabled === 0) return "全武装OFF · 回避チャレンジ!";
  return fallback;
}
