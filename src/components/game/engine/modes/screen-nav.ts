/**
 * Shop / options open-close pure seeds (recovered fr / pr / mr).
 */

export type OpenShop = {
  mode: "shop";
  paused: boolean;
  cursor: number;
  toast: string;
  toastLife: number;
  clearEntities: boolean;
};

export function openShopSeed(paused: boolean): OpenShop {
  return {
    mode: "shop",
    paused,
    cursor: 0,
    toast: paused ? "一時ショップ (戦闘一時停止)" : "PTSで強化せよ",
    toastLife: 80,
    clearEntities: !paused,
  };
}

export type CloseShop =
  | { type: "resume_play"; invulnMin: number }
  | { type: "next_stage" };

export function closeShopSeed(paused: boolean): CloseShop {
  if (paused) return { type: "resume_play", invulnMin: 45 };
  return { type: "next_stage" };
}

export type OpenOptions = {
  mode: "options";
  submenu: "main";
  cursor: number;
  from: string;
};

export function openOptionsSeed(from: string): OpenOptions {
  return {
    mode: "options",
    submenu: "main",
    cursor: 0,
    from,
  };
}
