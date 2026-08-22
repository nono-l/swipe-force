/**
 * JPDOC: 購入処理。
 */
/**
 * Shop purchase pure application (recovered EMPTY_EASY_UPGRADES core).
 */

export type ShopItem = {
  id: string;
  name: string;
  consumable?: boolean;
  stockable?: boolean;
};

export type PurchaseInput = {
  item: ShopItem;
  cost: number;
  pts: number;
  lives: number;
  shieldFrames: number;
  upgrades: Record<string, number>;
  maxLevel: number;
  canBuy: boolean;
  difficulty: string;
  wepLv: Record<string, number>;
  /** max for wepLv key */
  wepCap: (key: string) => number;
  /** current bag stock for stockable items */
  bagStock?: number;
};

export type PurchaseResult =
  | {
      ok: false;
      reason: "cant_buy";
    }
  | {
      ok: true;
      pts: number;
      lives: number;
      shieldFrames: number;
      upgrades: Record<string, number>;
      wepLv: Record<string, number>;
      wepLvChanged: boolean;
      message: string;
      celebrateTier: boolean;
      /** stockable: add 1 to this bag field via shop id */
      bagAddId?: string;
    };

export function applyShopPurchase(
  input: PurchaseInput,
  celebrate: {
    tier2Ready: boolean;
    tier3Ready: boolean;
    linkedSpecial: boolean;
  },
): PurchaseResult {
  if (!input.canBuy) return { ok: false, reason: "cant_buy" };

  let pts = input.pts - input.cost;
  let lives = input.lives;
  let shieldFrames = input.shieldFrames;
  const upgrades = { ...input.upgrades };
  const wepLv = { ...input.wepLv };
  let wepLvChanged = false;
  let bagAddId: string | undefined;

  if (input.item.stockable) {
    bagAddId = input.item.id;
  } else if (input.item.id === "life") {
    lives = Math.min(5, lives + 1);
  } else if (input.item.id === "shield") {
    shieldFrames = 480;
  } else {
    const id = input.item.id;
    upgrades[id] = Math.min(input.maxLevel, (upgrades[id] || 0) + 1);
    if (id in wepLv) {
      const cap = input.wepCap(id);
      if (wepLv[id] >= cap - 1 || wepLv[id] > 50) {
        wepLv[id] = cap;
        wepLvChanged = true;
      }
    }
  }

  const stockNote =
    bagAddId != null
      ? ` 在庫${(input.bagStock || 0) + 1}`
      : "";
  const message =
    input.difficulty === "tutorial"
      ? `${input.item.name} GET! (TUTORIAL)`
      : input.difficulty === "easy" && !input.item.consumable
      ? `${input.item.name} GET! (EASY引継ぎ)`
      : `${input.item.name} GET!${stockNote}`;

  const celebrateTier =
    celebrate.tier2Ready ||
    celebrate.tier3Ready ||
    celebrate.linkedSpecial;

  return {
    ok: true,
    pts,
    lives,
    shieldFrames,
    upgrades,
    wepLv,
    wepLvChanged,
    message,
    celebrateTier,
    bagAddId,
  };
}
