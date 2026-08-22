/**
 * JPDOC: レールの色とラベル。
 */
/**
 * Side-rail paint model (recovered Qr pure).
 */

import { getSideRailButtons, sideRailHints } from "./side-rails";
import { sideRailBtnStyle, muteLabel, SIDE_RAIL_BRAND } from "./side-rail-draw";

export type RailRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  label: string;
  labelColor: string;
  sub?: string;
  subColor?: string;
};

export type SideRailPaint = {
  brand: { lines: string[]; color: string; leftX: number; rightX: number };
  buttons: RailRect[];
  hints: { left?: string; right?: string };
  mute: { text: string; color: string; x: number; y: number };
  railFill: string;
};

export function buildSideRailPaint(opts: {
  mode: string;
  titleSub: string;
  shopPaused: boolean;
  muted: boolean;
  fieldH: number;
  leftW: number;
  rightX: number;
  muteDisabled: boolean;
}): SideRailPaint {
  const rails = getSideRailButtons({
    mode: opts.mode,
    titleSub: opts.titleSub,
    shopPaused: opts.shopPaused,
  });
  const buttons: RailRect[] = rails.map((b) => {
    const st = sideRailBtnStyle(!!b.hot);
    const x0 = b.side === "left" ? 0 : opts.rightX;
    return {
      x: x0 + 8,
      y: b.y,
      w: 32,
      h: 40,
      fill: st.fill,
      stroke: st.stroke,
      label: b.label,
      labelColor: st.labelColor,
      sub: b.sub,
      subColor: st.subColor,
    };
  });
  const hints = sideRailHints(opts.mode);
  const m = muteLabel(opts.muted, opts.muteDisabled);
  return {
    brand: {
      lines: [...SIDE_RAIL_BRAND.lines],
      color: SIDE_RAIL_BRAND.color,
      leftX: 8,
      rightX: opts.rightX + 8,
    },
    buttons,
    hints: { left: hints.left, right: hints.right },
    mute: { text: m.text, color: m.color, x: 280, y: 378 },
    railFill: "#0a1a0a",
  };
}
