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
};

export function trackCardLayout(opts: {
  top: number;
  compact: boolean;
  mode: string;
  index: number;
  cat: string;
}): TrackCardLayout {
  const r = opts.compact;
  const i = r ? 28 : 36;
  const a = opts.mode === "title" ? 44 : 56;
  const catText =
    opts.cat + (opts.mode === "title" ? "" : String(opts.index).padStart(2, "0"));
  return {
    height: i,
    box: { x: 58, y: opts.top, w: 204, h: i },
    catBadge: { x: 62, y: opts.top + 5, w: a, h: 12, text: catText },
    catLabelX: 62 + a / 2,
    catLabelY: opts.top + 7,
    metaX: 66 + a,
    metaY: opts.top + 7,
    titleY: opts.top + (r ? 16 : 20),
    titleSize: r ? 7 : 8,
    showId: !r,
    idY: opts.top + 20,
  };
}
