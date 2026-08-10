/**
 * Power shop — catalog bgmSetBgmVol-exports + pricing helpers.
 */
export {
  Er as SHOP_ITEMS,
  Er,
  Dr as EMPTY_UPGRADES,
  Dr,
  Or as WEAPON_TOGGLE_KEYS,
  Or,
  kr as HI_SCORE_KEY,
  Ar as OPTIONS_KEY,
  jr as EASY_UP_KEY,
  Mr as NAME_CHARS,
  X as BASE_W,
  Z as BASE_H,
  Sr as SIDE_W,
  Cr,
  wr,
  Tr,
  xr,
} from "../meta/playfield_shop";

export {
  shopItemCost,
  shopItemMax,
  enemyHpMultiplier,
  scoreHpThresholds,
  shopUnlockTier,
  filterShopCatalog,
  normalCostScale,
} from "./shop-pricing";

export type { ShopItem } from "./shop-pricing";

/** Human labels for shop item ids */
export const SHOP_LABELS = {
  shot: "SHOT",
  rate: "RATE",
  speed: "SPEED",
  power: "POWER",
  option: "OPTION",
  lockon: "LOCKON",
  missile: "MISSILE",
  particle: "PARTICLE",
  hyper: "HYPER",
  cluster: "CLUSTER",
  overdrive: "OVERDRIVE",
  beam: "OPT-LASER",
  flame: "FLAME",
} as const;
