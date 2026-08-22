/**
 * JPDOC: 武器解禁フラグ。
 */
/**
 * Promo / gift special weapon unlocks (local).
 * Stored as a single string of comma-separated ids — no extra DB columns.
 * grant_json.unlocks = "beam,flame"
 */

export const PROMO_UNLOCKS_KEY = "swipe_force_promo_unlocks_v1";

/** Special weapons grantable via promo string (whitelist). */
export const PROMO_UNLOCK_IDS = ["beam", "flame"] as const;
export type PromoUnlockId = (typeof PROMO_UNLOCK_IDS)[number];

const ALLOWED = new Set<string>(PROMO_UNLOCK_IDS);

export function isPromoUnlockId(id: string): id is PromoUnlockId {
  return ALLOWED.has(id);
}

/** Normalize unlocks field: "beam, flame" | ["beam"] | {beam:1} → "beam,flame" */
export function normalizeUnlocksString(raw: unknown): string {
  if (raw == null || raw === "") return "";
  let parts: string[] = [];
  if (typeof raw === "string") {
    parts = raw.split(/[\s,|+/]+/);
  } else if (Array.isArray(raw)) {
    parts = raw.map((x) => String(x));
  } else if (typeof raw === "object") {
    parts = Object.keys(raw as object).filter(
      (k) => !!(raw as Record<string, unknown>)[k],
    );
  }
  const out: string[] = [];
  for (const p of parts) {
    const id = String(p || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    // aliases
    const mapped =
      id === "optlaser" || id === "opt-laser" || id === "laser"
        ? "beam"
        : id === "fire" || id === "flamethrower"
          ? "flame"
          : id;
    if (ALLOWED.has(mapped) && !out.includes(mapped)) out.push(mapped);
  }
  return out.join(",");
}

export function unlocksToList(raw: unknown): PromoUnlockId[] {
  const s = normalizeUnlocksString(raw);
  if (!s) return [];
  return s.split(",").filter(isPromoUnlockId);
}

export function loadPromoUnlocks(raw?: string | null): PromoUnlockId[] {
  let s = raw;
  if (s == null) {
    try {
      s = localStorage.getItem(PROMO_UNLOCKS_KEY);
    } catch {
      s = null;
    }
  }
  return unlocksToList(s || "");
}

export function savePromoUnlocks(ids: readonly string[]): PromoUnlockId[] {
  const next = unlocksToList(ids.join(","));
  try {
    if (next.length) localStorage.setItem(PROMO_UNLOCKS_KEY, next.join(","));
    else localStorage.removeItem(PROMO_UNLOCKS_KEY);
  } catch {
    /* */
  }
  return next;
}

/** Merge grant unlocks string into local storage. Returns full set. */
export function applyUnlocksFromGrant(
  grantUnlocks: string | undefined | null,
): PromoUnlockId[] {
  const add = unlocksToList(grantUnlocks);
  if (!add.length) return loadPromoUnlocks();
  const cur = loadPromoUnlocks();
  return savePromoUnlocks([...cur, ...add]);
}

export function hasPromoUnlock(id: string, list?: readonly string[]): boolean {
  const ids = list ?? loadPromoUnlocks();
  return ids.includes(id as PromoUnlockId);
}

/** Shop / combat access for link-only specials */
export function hasSpecialWeaponAccess(
  id: string,
  linked: boolean,
  unlocks?: readonly string[],
): boolean {
  if (linked) return true;
  return hasPromoUnlock(id, unlocks);
}

export function unlockLabel(id: string): string {
  if (id === "beam") return "OPT-LASER";
  if (id === "flame") return "FLAME";
  return id.toUpperCase();
}

export function formatUnlocksSummary(raw: unknown): string {
  const list = unlocksToList(raw);
  if (!list.length) return "";
  return list.map(unlockLabel).join("+");
}
