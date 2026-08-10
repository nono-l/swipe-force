/**
 * Side rail button paint styles (pure).
 */

export type RailBtnStyle = {
  fill: string;
  stroke: string;
  labelColor: string;
  subColor: string;
};

export function sideRailBtnStyle(hot: boolean): RailBtnStyle {
  return {
    fill: hot ? "#1a4028" : "#0e2214",
    stroke: hot ? "#66ffaa" : "#228844",
    labelColor: hot ? "#ccffee" : "#66cc88",
    subColor: hot ? "#88aa88" : "#446644",
  };
}

export function muteLabel(muted: boolean, dimmed: boolean): {
  text: string;
  color: string;
} {
  return {
    text: muted ? "MUTE" : "🔊",
    color: dimmed ? "#223322" : "#66aa66",
  };
}

export const SIDE_RAIL_BRAND = {
  color: "#00ff66",
  lines: ["SWIPE", "FORCE"] as const,
};
