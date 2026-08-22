/**
 * JPDOC: ショップの行。
 */
/**
 * Power shop list row view-model (pure).
 */

export type ShopCatalogItem = {
  id: string;
  name: string;
  tier: number;
  consumable?: boolean;
  linkOnly?: boolean;
  stockable?: boolean;
  baseCost: number;
  max: number;
};

export type ShopRowView = {
  index: number;
  item: ShopCatalogItem;
  y: number;
  selected: boolean;
  cost: number;
  maxed: boolean;
  canBuy: boolean;
  levelText: string;
  nameColor: string;
  costText: string;
  costColor: string;
};

export type ShopRowContext = {
  catalog: ShopCatalogItem[];
  cursor: number;
  windowStart: number;
  pageSize?: number;
  rowH?: number;
  baseY?: number;
  upgrades: Record<string, number>;
  lives: number;
  shieldFrames: number;
  /** bag stock lookup for stockable items */
  bagStockOf?: (id: string) => number;
  costOf: (item: ShopCatalogItem) => number;
  maxOf: (item: ShopCatalogItem) => number;
  canBuy: (item: ShopCatalogItem) => boolean;
};

export function buildShopRows(ctx: ShopRowContext): ShopRowView[] {
  const page = ctx.pageSize ?? 10;
  const rowH = ctx.rowH ?? 20;
  const baseY = ctx.baseY ?? 68;
  const rows: ShopRowView[] = [];
  const n = Math.min(page, ctx.catalog.length);
  for (let i = 0; i < n; i++) {
    const index = i + ctx.windowStart;
    const item = ctx.catalog[index];
    if (!item) continue;
    const selected = index === ctx.cursor;
    const cost = ctx.costOf(item);
    const maxLv = ctx.maxOf(item);
    const maxed = !item.consumable && (ctx.upgrades[item.id] || 0) >= maxLv;
    const canBuy = ctx.canBuy(item);
    let levelText: string;
    if (item.stockable) {
      const st = ctx.bagStockOf?.(item.id) ?? 0;
      levelText = `×${st}`;
    } else if (item.id === "life") levelText = `${ctx.lives}/5`;
    else if (item.id === "shield")
      levelText = ctx.shieldFrames > 0 ? "ON" : "OK";
    else levelText = `Lv${ctx.upgrades[item.id] || 0}/${maxLv}`;

    const nameColor =
      item.tier === 3
        ? "#ff88ff"
        : item.tier === 2
          ? "#66ccff"
          : item.stockable
            ? selected
              ? "#ffe088"
              : "#ddaa44"
            : selected
              ? "#fff"
              : "#88ff88";

    rows.push({
      index,
      item,
      y: baseY + i * rowH,
      selected,
      cost,
      maxed,
      canBuy,
      levelText,
      nameColor,
      costText: maxed ? "MAX" : `${cost}P`,
      costColor: maxed ? "#888" : canBuy ? "#ffff00" : "#aa4444",
    });
  }
  return rows;
}

/** Extra footer buttons after catalog: OPT, SHARE, GO — cursor indices */
export function shopFooterIndices(catalogLen: number): {
  /** cursor == catalogLen → GO/NEXT */
  go: number;
  /** cursor == catalogLen + 1 → OPTIONS */
  opt: number;
  /** cursor == catalogLen + 2 → SHARE */
  share: number;
} {
  return {
    go: catalogLen,
    opt: catalogLen + 1,
    share: catalogLen + 2,
  };
}
