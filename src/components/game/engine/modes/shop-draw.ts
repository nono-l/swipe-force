/**
 * Power shop chrome: header chips, footer buttons, tier banner (pure).
 */

export type ShopChip = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  label: string;
  labelColor: string;
  labelX: number;
  labelY: number;
  selected: boolean;
};

export function shopHeaderChips(opts: {
  shareSelected: boolean;
  optSelected: boolean;
}): ShopChip[] {
  const n = opts.shareSelected;
  const r = opts.optSelected;
  return [
    {
      x: 150,
      y: 22,
      w: 58,
      h: 20,
      fill: n ? "#442200" : "#221100",
      stroke: n ? "#ffcc66" : "#aa8844",
      label: "𝕏 SHARE",
      labelColor: n ? "#ffeeaa" : "#ccaa66",
      labelX: 179,
      labelY: 27,
      selected: n,
    },
    {
      x: 212,
      y: 22,
      w: 52,
      h: 20,
      fill: r ? "#004466" : "#002233",
      stroke: r ? "#66eeff" : "#33aacc",
      label: "⚙ OPT",
      labelColor: r ? "#ffffff" : "#88ddff",
      labelX: 238,
      labelY: 27,
      selected: r,
    },
  ];
}

export function shopFooterButtons(opts: {
  catalogLen: number;
  cursor: number;
  pauseShop: boolean;
  shareSelected: boolean;
  optSelected: boolean;
}): (ShopChip & { sub?: string; subY?: number })[] {
  const i = 200 / 3;
  const n = opts.shareSelected;
  const r = opts.optSelected;
  const a = opts.cursor === opts.catalogLen;
  return [
    {
      x: 56,
      y: 352,
      w: i,
      h: 32,
      fill: n ? "#553300" : "#2a1800",
      stroke: n ? "#ffcc66" : "#aa7744",
      label: "𝕏 SHARE",
      labelColor: n ? "#ffeeaa" : "#ddaa66",
      labelX: 56 + i / 2,
      labelY: 358,
      selected: n,
      sub: "進行度つき",
      subY: 370,
    },
    {
      x: 56 + i + 4 / 3, // visual ~126.66
      y: 352,
      w: i,
      h: 32,
      fill: r ? "#005577" : "#003344",
      stroke: r ? "#88eeff" : "#44aacc",
      label: "⚙ OPT",
      labelColor: r ? "#ffffff" : "#aaddff",
      labelX: 160,
      labelY: 362,
      selected: r,
    },
    {
      x: 56 + (i + 4 / 3) * 2,
      y: 352,
      w: i,
      h: 32,
      fill: a ? "#007700" : "#004400",
      stroke: a ? "#ffff00" : "#00aa44",
      label: opts.pauseShop ? "▶ GO" : "▶ NEXT",
      labelColor: a ? "#ffff00" : "#88ff88",
      labelX: 230.66666666666669,
      labelY: 362,
      selected: a,
    },
  ];
}

/** Exact recovered footer x positions */
export function shopFooterButtonsExact(opts: {
  catalogLen: number;
  cursor: number;
  pauseShop: boolean;
  shareSelected: boolean;
  optSelected: boolean;
}): (ShopChip & { sub?: string; subY?: number })[] {
  const i = 200 / 3;
  const n = opts.shareSelected;
  const r = opts.optSelected;
  const a = opts.cursor === opts.catalogLen;
  return [
    {
      x: 56,
      y: 352,
      w: i,
      h: 32,
      fill: n ? "#553300" : "#2a1800",
      stroke: n ? "#ffcc66" : "#aa7744",
      label: "𝕏 SHARE",
      labelColor: n ? "#ffeeaa" : "#ddaa66",
      labelX: 89.33333333333334,
      labelY: 358,
      selected: n,
      sub: "進行度つき",
      subY: 370,
    },
    {
      x: 126.66666666666667,
      y: 352,
      w: i,
      h: 32,
      fill: r ? "#005577" : "#003344",
      stroke: r ? "#88eeff" : "#44aacc",
      label: "⚙ OPT",
      labelColor: r ? "#ffffff" : "#aaddff",
      labelX: 160,
      labelY: 362,
      selected: r,
    },
    {
      x: 197.33333333333334,
      y: 352,
      w: i,
      h: 32,
      fill: a ? "#007700" : "#004400",
      stroke: a ? "#ffff00" : "#00aa44",
      label: opts.pauseShop ? "▶ GO" : "▶ NEXT",
      labelColor: a ? "#ffff00" : "#88ff88",
      labelX: 230.66666666666669,
      labelY: 362,
      selected: a,
    },
  ];
}

export function shopTierHint(opts: {
  tier2: boolean;
  tier3: boolean;
  celebrate: boolean;
  frame: number;
  linked?: boolean;
}): { text: string; color: string } {
  let text: string;
  if (!opts.tier2) {
    text = "基本強化を全MAX → TIER2兵器解放";
  } else if (!opts.tier3) {
    text = "上級兵器を全MAX → TIER3解放";
  } else if (opts.linked) {
    text = "最終強化解放済み · OPT/FLAME可";
  } else {
    text = "最終強化解放済み · 連携でOPT/FLAME";
  }
  const color =
    opts.celebrate && opts.frame % 10 < 5 ? "#ff66ff" : "#66aa66";
  return { text, color };
}

export function shopStatusLine(opts: {
  pts: number;
  tier: number;
  difficulty: string;
}): { text: string; color: string } {
  const esy = opts.difficulty !== "normal";
  return {
    text: `PTS ${opts.pts}  ·  T${opts.tier}  ·  ${esy ? "ESY SAVE" : "NRM"}`,
    color: esy ? "#ffff66" : "#ffaa66",
  };
}
