/**
 * Gift-only bag grants: daily login bonus + promo URL codes.
 * Built-in defs + custom promos (local admin UI).
 * unlocks lives as grant.unlocks string (e.g. "beam,flame") — no extra DB cols.
 */

import type { BagStock } from "./bag-inventory";
import { addBagStock, EMPTY_BAG } from "./bag-inventory";
import {
  applyUnlocksFromGrant,
  formatUnlocksSummary,
  normalizeUnlocksString,
} from "./weapon-unlocks";

export const LOGIN_BONUS_KEY = "swipe_force_login_bonus_v1";
export const PROMO_CLAIMED_KEY = "swipe_force_promo_claimed_v1";
export const CUSTOM_PROMO_KEY = "swipe_force_promo_defs_v1";

export type GrantBundle = Partial<BagStock> & {
  /** comma-separated special weapons: "beam,flame" */
  unlocks?: string;
};

export type PromoDef = {
  code: string;
  label: string;
  grant: GrantBundle;
  /** true = user-created via admin UI */
  custom?: boolean;
};

/** Built-in campaign codes (URL ?promo=CODE or ?gift=CODE). */
export const PROMO_DEFS: PromoDef[] = [
  {
    code: "WELCOME",
    label: "ウェルカム",
    grant: { stageTicket: 1, ptsX5: 1, ptsPack: 1 },
  },
  {
    code: "STAGEPASS",
    label: "ステージパス",
    grant: { stageTicket: 2 },
  },
  {
    code: "PTS5",
    label: "PTS×5 配布",
    grant: { ptsX5: 1 },
  },
  {
    code: "PTS10",
    label: "PTS×10 配布",
    grant: { ptsX10: 1 },
  },
  {
    code: "PTS5K",
    label: "PTS+5000 配布",
    grant: { ptsPack: 1 },
  },
  {
    code: "FORCE2026",
    label: "FORCE2026 キャンペーン",
    grant: { stageTicket: 2, ptsX10: 1, ptsPack: 2 },
  },
  {
    code: "SWIPE",
    label: "SWIPE プロモ",
    grant: { stageTicket: 1, ptsX5: 1 },
  },
];

function clampQty(n: unknown, max = 99): number {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(max, v));
}

export function sanitizeGrant(g: GrantBundle | null | undefined): GrantBundle {
  const out: GrantBundle = {};
  const t = clampQty(g?.stageTicket);
  const a = clampQty(g?.ptsX5);
  const b = clampQty(g?.ptsX10);
  const c = clampQty(g?.ptsPack);
  const u = normalizeUnlocksString(g?.unlocks);
  if (t) out.stageTicket = t;
  if (a) out.ptsX5 = a;
  if (b) out.ptsX10 = b;
  if (c) out.ptsPack = c;
  if (u) out.unlocks = u;
  return out;
}

export function grantIsEmpty(g: GrantBundle): boolean {
  return !(
    (g.stageTicket || 0) +
      (g.ptsX5 || 0) +
      (g.ptsX10 || 0) +
      (g.ptsPack || 0) ||
    (g.unlocks && g.unlocks.length > 0)
  );
}

export function loadCustomPromos(raw?: string | null): PromoDef[] {
  let s = raw;
  if (s == null) {
    try {
      s = localStorage.getItem(CUSTOM_PROMO_KEY);
    } catch {
      s = null;
    }
  }
  if (!s) return [];
  try {
    const t = JSON.parse(s);
    const arr = Array.isArray(t) ? t : t?.items;
    if (!Array.isArray(arr)) return [];
    const out: PromoDef[] = [];
    for (const row of arr) {
      const code = normalizePromoCode(row?.code);
      if (!code) continue;
      const grant = sanitizeGrant(row?.grant || row);
      if (grantIsEmpty(grant)) continue;
      const label = String(row?.label || code)
        .trim()
        .slice(0, 40);
      out.push({ code, label: label || code, grant, custom: true });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeCustomPromos(list: PromoDef[]): string {
  return JSON.stringify({
    items: list.map((d) => ({
      code: normalizePromoCode(d.code),
      label: String(d.label || d.code).slice(0, 40),
      grant: sanitizeGrant(d.grant),
    })),
  });
}

export function saveCustomPromos(list: PromoDef[]): void {
  try {
    localStorage.setItem(CUSTOM_PROMO_KEY, serializeCustomPromos(list));
  } catch {
    /* ignore */
  }
}

/** Built-ins first, then custom (custom overrides same code). */
export function getAllPromoDefs(): PromoDef[] {
  const customs = loadCustomPromos();
  const customCodes = new Set(customs.map((c) => c.code));
  const builtins = PROMO_DEFS.filter((d) => !customCodes.has(d.code)).map(
    (d) => ({ ...d, custom: false as const }),
  );
  return [...builtins, ...customs.map((c) => ({ ...c, custom: true as const }))];
}

export function getPromoMap(): Record<string, PromoDef> {
  return Object.fromEntries(getAllPromoDefs().map((d) => [d.code, d]));
}

export function findPromoDef(codeRaw: string): PromoDef | null {
  const code = normalizePromoCode(codeRaw);
  if (!code) return null;
  return getPromoMap()[code] || null;
}

export type UpsertPromoResult =
  | { ok: true; def: PromoDef; list: PromoDef[] }
  | { ok: false; reason: "bad_code" | "empty_grant" | "builtin_locked" };

/** Add or update a custom promo. Cannot overwrite built-in unless forceCustom. */
export function upsertCustomPromo(
  input: { code: string; label?: string; grant: GrantBundle },
  opts?: { allowOverrideBuiltin?: boolean },
): UpsertPromoResult {
  const code = normalizePromoCode(input.code);
  if (!code || code.length < 2) return { ok: false, reason: "bad_code" };
  const grant = sanitizeGrant(input.grant);
  if (grantIsEmpty(grant)) return { ok: false, reason: "empty_grant" };

  const isBuiltin = PROMO_DEFS.some((d) => d.code === code);
  if (isBuiltin && !opts?.allowOverrideBuiltin) {
    return { ok: false, reason: "builtin_locked" };
  }

  const def: PromoDef = {
    code,
    label: String(input.label || code).trim().slice(0, 40) || code,
    grant,
    custom: true,
  };
  const list = loadCustomPromos().filter((d) => d.code !== code);
  list.push(def);
  list.sort((a, b) => a.code.localeCompare(b.code));
  saveCustomPromos(list);
  return { ok: true, def, list };
}

export function deleteCustomPromo(codeRaw: string): {
  ok: boolean;
  list: PromoDef[];
} {
  const code = normalizePromoCode(codeRaw);
  const list = loadCustomPromos().filter((d) => d.code !== code);
  saveCustomPromos(list);
  return { ok: true, list };
}

/** Remove code from claimed list so it can be redeemed again on this device. */
export function unclaimPromoCode(codeRaw: string): string[] {
  const code = normalizePromoCode(codeRaw);
  const cur = loadClaimedPromos(null);
  const next = cur.filter((c) => c !== code);
  try {
    localStorage.setItem(PROMO_CLAIMED_KEY, serializeClaimedPromos(next));
  } catch {
    /* */
  }
  return next;
}

export function buildPromoUrl(codeRaw: string, baseHref?: string): string {
  const code = normalizePromoCode(codeRaw);
  try {
    const u = new URL(baseHref || window.location.href);
    u.searchParams.set("promo", code);
    u.hash = "";
    return u.toString();
  } catch {
    return `?promo=${code}`;
  }
}

/** JST calendar date YYYY-MM-DD */
export function jstDateKey(now = Date.now()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(now));
  } catch {
    return new Date(now).toISOString().slice(0, 10);
  }
}

/** 0=Sun … 6=Sat in JST */
export function jstWeekday(now = Date.now()): number {
  try {
    const w = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      weekday: "short",
    }).format(new Date(now));
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[w] ?? new Date(now).getUTCDay();
  } catch {
    return new Date(now).getUTCDay();
  }
}

/** Daily rotating login package (JST weekday). */
export function loginBonusGrant(now = Date.now()): GrantBundle {
  switch (jstWeekday(now)) {
    case 0:
      return { stageTicket: 1, ptsPack: 1 };
    case 1:
      return { ptsX5: 1, ptsPack: 1 };
    case 2:
      return { stageTicket: 1, ptsX5: 1 };
    case 3:
      return { ptsX10: 1 };
    case 4:
      return { stageTicket: 1, ptsPack: 1 };
    case 5:
      return { ptsX5: 1, ptsX10: 1 };
    case 6:
    default:
      return { stageTicket: 1, ptsX5: 1, ptsPack: 1 };
  }
}

export function formatGrantSummary(g: GrantBundle): string {
  const parts: string[] = [];
  if (g.stageTicket) parts.push(`TICKET×${g.stageTicket}`);
  if (g.ptsX5) parts.push(`×5×${g.ptsX5}`);
  if (g.ptsX10) parts.push(`×10×${g.ptsX10}`);
  if (g.ptsPack) parts.push(`+5K×${g.ptsPack}`);
  const u = formatUnlocksSummary(g.unlocks);
  if (u) parts.push(`UNLOCK:${u}`);
  return parts.length ? parts.join(" ") : "なし";
}

export function applyGrantToBag(bag: BagStock, grant: GrantBundle): BagStock {
  let next = { ...bag };
  if (grant.stageTicket)
    next = addBagStock(next, "stageTicket", grant.stageTicket | 0);
  if (grant.ptsX5) next = addBagStock(next, "ptsX5", grant.ptsX5 | 0);
  if (grant.ptsX10) next = addBagStock(next, "ptsX10", grant.ptsX10 | 0);
  if (grant.ptsPack) next = addBagStock(next, "ptsPack", grant.ptsPack | 0);
  if (grant.unlocks) applyUnlocksFromGrant(grant.unlocks);
  return next;
}

export function loadLastLoginDate(raw: string | null): string {
  if (!raw) return "";
  try {
    const t = JSON.parse(raw) as { lastDate?: string };
    return String(t.lastDate || "").slice(0, 10);
  } catch {
    return String(raw).slice(0, 10);
  }
}

export function serializeLoginBonus(lastDate: string): string {
  return JSON.stringify({ lastDate: lastDate.slice(0, 10) });
}

export function canClaimLoginBonus(
  lastDate: string,
  now = Date.now(),
): boolean {
  const today = jstDateKey(now);
  return !lastDate || lastDate !== today;
}

export type LoginClaimResult =
  | { ok: false; reason: "already"; today: string }
  | {
      ok: true;
      bag: BagStock;
      grant: GrantBundle;
      today: string;
      summary: string;
    };

export function claimLoginBonus(
  bag: BagStock,
  lastDate: string,
  now = Date.now(),
): LoginClaimResult {
  const today = jstDateKey(now);
  if (lastDate === today) return { ok: false, reason: "already", today };
  const grant = loginBonusGrant(now);
  const next = applyGrantToBag(bag, grant);
  return {
    ok: true,
    bag: next,
    grant,
    today,
    summary: formatGrantSummary(grant),
  };
}

export function loadClaimedPromos(raw: string | null): string[] {
  let s = raw;
  if (s == null) {
    try {
      s = localStorage.getItem(PROMO_CLAIMED_KEY);
    } catch {
      s = null;
    }
  }
  if (!s) return [];
  try {
    const t = JSON.parse(s);
    if (Array.isArray(t))
      return t.map((x) => String(x).toUpperCase()).filter(Boolean);
    if (t && typeof t === "object" && Array.isArray((t as { claimed?: string[] }).claimed)) {
      return ((t as { claimed: string[] }).claimed || [])
        .map((x) => String(x).toUpperCase())
        .filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

export function serializeClaimedPromos(codes: string[]): string {
  return JSON.stringify({
    claimed: [...new Set(codes.map((c) => c.toUpperCase()))],
  });
}

export function normalizePromoCode(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 24);
}

export function parsePromoFromUrl(
  href: string | null | undefined = typeof window !== "undefined"
    ? window.location.href
    : "",
): string | null {
  if (!href) return null;
  try {
    const u = new URL(href);
    const code = normalizePromoCode(
      u.searchParams.get("promo") ||
        u.searchParams.get("gift") ||
        u.searchParams.get("code"),
    );
    return code || null;
  } catch {
    return null;
  }
}

export type PromoClaimResult =
  | { ok: false; reason: "invalid" | "already"; code: string }
  | {
      ok: true;
      code: string;
      label: string;
      bag: BagStock;
      grant: GrantBundle;
      claimed: string[];
      summary: string;
    };

export function claimPromoCode(
  bag: BagStock,
  codeRaw: string,
  alreadyClaimed: string[],
): PromoClaimResult {
  const code = normalizePromoCode(codeRaw);
  const def = findPromoDef(code);
  if (!code || !def) return { ok: false, reason: "invalid", code };
  if (alreadyClaimed.map((c) => c.toUpperCase()).includes(code))
    return { ok: false, reason: "already", code };
  const next = applyGrantToBag(bag, def.grant);
  const claimed = [...alreadyClaimed, code];
  return {
    ok: true,
    code,
    label: def.label,
    bag: next,
    grant: def.grant,
    claimed,
    summary: formatGrantSummary(def.grant),
  };
}

/** strip promo params from URL without reload */
export function stripPromoFromUrl(): void {
  try {
    const u = new URL(window.location.href);
    let changed = false;
    for (const k of ["promo", "gift", "code"]) {
      if (u.searchParams.has(k)) {
        u.searchParams.delete(k);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState({}, "", u.pathname + u.search + u.hash);
    }
  } catch {
    /* ignore */
  }
}

export function emptyBag(): BagStock {
  return { ...EMPTY_BAG };
}
