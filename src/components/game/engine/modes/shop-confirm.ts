/**
 * Shop pointer-up / empty-tap confirm (recovered Qi / $i).
 */

import { shopFooterIndices } from "./shop-rows";
import { listWindowStart } from "./list-scroll";

export type ShopConfirmAction =
  | { type: "side_opt" }
  | { type: "side_back" }
  | { type: "header_share" }
  | { type: "header_opt" }
  | { type: "buy"; index: number }
  | { type: "select"; index: number }
  | { type: "footer_share" }
  | { type: "footer_opt" }
  | { type: "footer_go" }
  | { type: "empty_confirm" }
  | { type: "none" };

export function shopPointerUp(opts: {
  x: number;
  y: number;
  left: number;
  right: number;
  catalogLen: number;
  cursor: number;
  pageSize?: number;
}): ShopConfirmAction {
  const { x, y, left, right, catalogLen, cursor } = opts;
  const page = opts.pageSize ?? 10;
  const foot = shopFooterIndices(catalogLen);

  if (x < left || x > right) {
    if (y >= 100 && y < 150) return { type: "side_opt" };
    return { type: "side_back" };
  }

  if (y >= 22 && y <= 46) {
    if (x >= 150 && x <= 208) return { type: "header_share" };
    if (x >= 212 && x <= 264) return { type: "header_opt" };
  }

  const win = listWindowStart(catalogLen, cursor, page);
  for (let e = 0; e < Math.min(page, catalogLen); e++) {
    const i = e + win;
    const a = 68 + e * 20;
    if (y >= a - 1 && y < a + 20 - 1) {
      return cursor === i
        ? { type: "buy", index: i }
        : { type: "select", index: i };
    }
  }

  if (y >= 350 && y <= 388) {
    if (x >= 56 && x < 122.66666666666667) return { type: "footer_share" };
    if (x >= 126.66666666666667 && x < 193.33333333333334)
      return { type: "footer_opt" };
    if (x >= 197.33333333333334 && x <= 264) return { type: "footer_go" };
  }

  return { type: "empty_confirm" };
}

export type ShopEmptyAction =
  | { type: "buy"; index: number }
  | { type: "go" }
  | { type: "opt" }
  | { type: "share" }
  | { type: "none" };

export function shopEmptyConfirm(
  cursor: number,
  catalogLen: number,
): ShopEmptyAction {
  if (cursor < catalogLen) return { type: "buy", index: cursor };
  if (cursor === catalogLen) return { type: "go" };
  if (cursor === catalogLen + 1) return { type: "opt" };
  if (cursor === catalogLen + 2) return { type: "share" };
  return { type: "none" };
}
