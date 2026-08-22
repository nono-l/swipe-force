/**
 * JPDOC: HUD の座標。
 */
/**
 * canSendFanmailTo-play HUD text lines (recovered $r pure).
 */

export type HudTopLine = {
  score: string;
  hi: string;
  pts: string;
  coins: string;
  stage: string;
};

export function buildHudTop(opts: {
  score: number;
  high: number;
  pts: number;
  coins: number;
  stage: number;
}): HudTopLine {
  return {
    score: `SC ${String(opts.score).padStart(7, "0")}`,
    hi: `HI ${String(opts.high).padStart(7, "0")}`,
    pts: `PTS ${opts.pts}`,
    coins: `¢${opts.coins}`,
    stage: `ST${opts.stage}`,
  };
}

export type HudChipCursor = { x: number; items: { text: string; color: string; flash?: boolean }[] };

export function buildHudBottomChips(opts: {
  dodgeOnly: boolean;
  shotOff: boolean;
  weaponLabels: { label: string; color: string }[];
  frame: number;
  startX?: number;
}): HudChipCursor {
  let n = opts.startX ?? 52;
  const items: HudChipCursor["items"] = [];
  if (opts.dodgeOnly) {
    items.push({
      text: "DODGE ONLY",
      color: opts.frame % 20 < 12 ? "#ff88aa" : "#aa4466",
      flash: true,
    });
    n += 56;
  } else if (opts.shotOff) {
    items.push({ text: "SHOT OFF", color: "#aa4444" });
    n += 48;
  }
  for (const chip of opts.weaponLabels) {
    items.push({ text: chip.label, color: chip.color });
    n += 18;
  }
  return { x: n, items };
}

export function enemyHpHud(mult: number): string | null {
  return mult > 1 ? `ENEMY HP×${mult}` : null;
}
