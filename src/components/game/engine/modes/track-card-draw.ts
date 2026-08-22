/**
 * JPDOC: トラックカード描画。
 */
/**
 * Sound-test track card layout (recovered Di).
 */

export type TrackCardLayout = {
  height: number;
  box: { x: number; y: number; w: number; h: number };
  catBadge: { x: number; y: number; w: number; h: number; text: string };
  catLabelX: number;
  catLabelY: number;
  metaX: number;
  metaY: number;
  titleY: number;
  titleSize: number;
  showId: boolean;
  idY: number;
  /** second line for archive period */
  periodY: number | null;
  periodSize: number;
};

export function trackCardLayout(opts: {
  top: number;
  compact: boolean;
  mode: string;
  index: number;
  cat: string;
  /** when true, reserve a line for period text */
  hasPeriod?: boolean;
}): TrackCardLayout {
  const r = opts.compact;
  const periodExtra = opts.hasPeriod ? (r ? 10 : 12) : 0;
  const i = (r ? 28 : 36) + periodExtra;
  const a = opts.mode === "title" ? 44 : 56;
  const catText =
    opts.cat + (opts.mode === "title" ? "" : String(opts.index).padStart(2, "0"));
  const titleY = opts.top + (r ? 16 : 20);
  return {
    height: i,
    box: { x: 58, y: opts.top, w: 204, h: i },
    catBadge: { x: 62, y: opts.top + 5, w: a, h: 12, text: catText },
    catLabelX: 62 + a / 2,
    catLabelY: opts.top + 7,
    metaX: 66 + a,
    metaY: opts.top + 7,
    titleY,
    titleSize: r ? 7 : 8,
    showId: !r && !opts.hasPeriod,
    idY: opts.top + 20,
    periodY: opts.hasPeriod ? titleY + (r ? 10 : 12) : null,
    periodSize: r ? 6 : 7,
  };
}
