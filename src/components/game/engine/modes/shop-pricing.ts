/**
 * Pure shop pricing / unlock tier helpers.
 * State (upgrades, pts, linked) is passed in — no DOM.
 */

export type ShopItem = {
  id: string;
  name?: string;
  desc?: string;
  baseCost: number;
  max: number;
  tier: number;
  consumable?: boolean;
  linkOnly?: boolean;
};

/** Score thresholds that double enemy HP (cumulative). */
export function scoreHpThresholds(): number[] {
  const e: number[] = [];
  let t = 10000;
  let n = 10000;
  for (let r = 0; r < 6; r++) {
    e.push(t);
    n *= 2;
    t += n;
  }
  return e;
}

/** Enemy HP multiplier from score. */
export function enemyHpMultiplier(score: number): number {
  const thresholds = scoreHpThresholds();
  let t = 0;
  for (const n of thresholds) {
    if (score >= n) t++;
    else break;
  }
  return 2 ** t;
}

/**
 * Normal difficulty cost scale by shop tier.
 * Recovered pushLocalInbox(tier).
 */
/** Recovered pushLocalInbox(tier): normal multiplies shop costs by tier. */
export function normalCostScale(
  tier: number,
  difficulty: "easy" | "normal" | string,
): number {
  if (difficulty !== "normal") return 1;
  // e >= 4 → 27; e >= 3 → 81; e >= 2 → 9; else 3
  if (tier >= 4) return 27;
  if (tier >= 3) return 81;
  if (tier >= 2) return 9;
  return 3;
}

/** Item purchase cost. upgrades = current O[id] */
export function shopItemCost(
  item: ShopItem,
  upgrades: Record<string, number>,
  difficulty: "easy" | "normal" | string,
): number {
  if (item.consumable) {
    return Math.floor(item.baseCost * normalCostScale(1, difficulty));
  }
  const t = upgrades[item.id] || 0;
  let n =
    item.baseCost * (1 + t * 0.65) * normalCostScale(item.tier, difficulty);
  if (t >= 3) n *= 1.28 ** (t - 2);
  if (t >= 10) n *= 1.15 ** (t - 9);
  return Math.floor(n);
}

const WEAPON_EXTEND_IDS = [
  "shot",
  "rate",
  "power",
  "lockon",
  "missile",
  "particle",
] as const;

/** Max level for item (linked unlocks Lv20 for core arms). */
export function shopItemMax(
  item: ShopItem,
  linked: boolean,
  weaponExtendIds: readonly string[] = WEAPON_EXTEND_IDS,
): number {
  if (item.consumable) return item.max;
  if (linked && weaponExtendIds.includes(item.id)) return 20;
  if ((item.linkOnly || item.tier >= 4) && !linked) return 0;
  return item.max;
}

/**
 * Catalog unlock tier: 1 guest … 4 linked.
 * hasT3 / hasT2 from recovered buildShareUrl/markFanmailSent mission-ish gates.
 */
export function shopUnlockTier(
  linked: boolean,
  hasTier3: boolean,
  hasTier2: boolean,
): number {
  if (linked) return 4;
  if (hasTier3) return 3;
  if (hasTier2) return 2;
  return 1;
}

/** Filter catalog by unlock tier / link-only. */
export function filterShopCatalog<T extends ShopItem>(
  catalog: T[],
  unlockTier: number,
  linked: boolean,
): T[] {
  return catalog.filter((t) =>
    t.linkOnly || t.tier >= 4 ? linked : t.tier <= unlockTier,
  );
}
