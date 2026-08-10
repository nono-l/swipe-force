/**
 * Power shop pointer hit testing (pure).
 */

import { listWindowStart } from "./list-scroll";
import { shopFooterIndices } from "./shop-rows";

export type ShopPointerDown = {
  /** select catalog index, KEY_CLOUD_INBOX footer index (>= catalogLen) */
  cursor: number | null;
  /** side rail → resume/next when pause-shop */
  sideRail: boolean;
};

/**
 * Recovered `na` geometry.
 * Footer strip y>=350: thirds SHARE / OPT / GO
 */
export function shopPointerDown(opts: {
  x: number;
  y: number;
  left: number;
  right: number;
  catalogLen: number;
  cursor: number;
  pageSize?: number;
  rowH?: number;
  baseY?: number;
}): ShopPointerDown {
  const { x, y, left, right, catalogLen } = opts;
  if (x < left || x > right) return { cursor: null, sideRail: true };

  const page = opts.pageSize ?? 10;
  const rowH = opts.rowH ?? 20;
  const baseY = opts.baseY ?? 68;
  const win = listWindowStart(catalogLen, opts.cursor, page);

  for (let e = 0; e < Math.min(page, catalogLen); e++) {
    const index = e + win;
    const i = baseY + e * rowH;
    if (y >= i - 1 && y < i + rowH - 1) {
      return { cursor: index, sideRail: false };
    }
  }

  if (y >= 350) {
    const foot = shopFooterIndices(catalogLen);
    // thirds at 122.66 / 197.33 (320 field center strip)
    if (x < 122.66666666666667) return { cursor: foot.share, sideRail: false };
    if (x < 197.33333333333334) return { cursor: foot.opt, sideRail: false };
    return { cursor: foot.go, sideRail: false };
  }

  return { cursor: null, sideRail: false };
}
