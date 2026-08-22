/**
 * JPDOC: プロモ請求・一覧のクライアント。
 */
/** Client helpers for DB-backed promo codes. */

import { getBearerToken } from "@/lib/auth/client";
import type { BagStock } from "@/components/game/engine/modes/bag-inventory";
import {
  applyGrantToBag,
  loadClaimedPromos,
  normalizePromoCode,
  PROMO_CLAIMED_KEY,
  serializeClaimedPromos,
  type GrantBundle,
  type PromoDef,
} from "@/components/game/engine/modes/bag-grants";

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = getBearerToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export type ServerPromo = PromoDef & {
  active?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  claimCount?: number;
  expiresAt?: string;
  maxClaims?: number;
};

export async function fetchAdminPromos(): Promise<{
  ok: boolean;
  builtins: ServerPromo[];
  customs: ServerPromo[];
  items: ServerPromo[];
  claimCounts: Record<string, number>;
  totalClaims: number;
  reason?: string;
}> {
  try {
    const res = await fetch("/api/admin/promo", {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      builtins?: ServerPromo[];
      customs?: ServerPromo[];
      items?: ServerPromo[];
      claimCounts?: Record<string, number>;
      totalClaims?: number;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        builtins: [],
        customs: [],
        items: [],
        claimCounts: {},
        totalClaims: 0,
        reason: data.reason || "fail",
      };
    }
    return {
      ok: true,
      builtins: data.builtins || [],
      customs: data.customs || [],
      items: data.items || [],
      claimCounts: data.claimCounts || {},
      totalClaims: Number(data.totalClaims) || 0,
    };
  } catch {
    return {
      ok: false,
      builtins: [],
      customs: [],
      items: [],
      claimCounts: {},
      totalClaims: 0,
      reason: "network",
    };
  }
}

export async function saveAdminPromo(input: {
  code: string;
  label?: string;
  grant: GrantBundle;
  expiresAt?: string;
  maxClaims?: number;
}): Promise<{ ok: boolean; def?: ServerPromo; summary?: string; reason?: string }> {
  try {
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      def?: ServerPromo;
      summary?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, reason: data.reason || "fail" };
    }
    return { ok: true, def: data.def, summary: data.summary };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function deleteAdminPromo(
  code: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(
      `/api/admin/promo?code=${encodeURIComponent(normalizePromoCode(code))}`,
      {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, reason: data.reason || "fail" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export type RemoteClaimResult =
  | {
      ok: false;
      reason:
        | "invalid"
        | "already"
        | "player"
        | "network"
        | "db"
        | "expired"
        | "sold_out";
      code: string;
    }
  | {
      ok: true;
      code: string;
      label: string;
      grant: GrantBundle;
      summary: string;
      bag: BagStock;
      claimed: string[];
    };

/** Claim via server, then apply grant to local bag + claimed list. */
export async function claimPromoRemote(
  bag: BagStock,
  codeRaw: string,
  playerId: string,
  alreadyClaimed: string[],
): Promise<RemoteClaimResult> {
  const code = normalizePromoCode(codeRaw);
  if (!code) return { ok: false, reason: "invalid", code };
  if (alreadyClaimed.map((c) => c.toUpperCase()).includes(code)) {
    return { ok: false, reason: "already", code };
  }
  try {
    const res = await fetch("/api/promo/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ code, playerId }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      code?: string;
      label?: string;
      grant?: GrantBundle;
      summary?: string;
    };
    if (!data.ok) {
      const r = String(data.reason || "");
      const reason =
        r === "already"
          ? "already"
          : r === "player"
            ? "player"
            : r === "db"
              ? "db"
              : r === "expired"
                ? "expired"
                : r === "sold_out"
                  ? "sold_out"
                  : "invalid";
      if (reason === "already") {
        const next = [...new Set([...alreadyClaimed, code])];
        try {
          localStorage.setItem(PROMO_CLAIMED_KEY, serializeClaimedPromos(next));
        } catch {
          /* */
        }
      }
      return { ok: false, reason, code };
    }
    const grant = data.grant || {};
    const nextBag = applyGrantToBag(bag, grant);
    const claimed = [...new Set([...alreadyClaimed, code])];
    try {
      localStorage.setItem(PROMO_CLAIMED_KEY, serializeClaimedPromos(claimed));
    } catch {
      /* */
    }
    return {
      ok: true,
      code,
      label: String(data.label || code),
      grant,
      summary: String(data.summary || ""),
      bag: nextBag,
      claimed,
    };
  } catch {
    return { ok: false, reason: "network", code };
  }
}

export function markLocalClaimed(code: string): string[] {
  const cur = loadClaimedPromos(null);
  const next = [...new Set([...cur, normalizePromoCode(code)])];
  try {
    localStorage.setItem(PROMO_CLAIMED_KEY, serializeClaimedPromos(next));
  } catch {
    /* */
  }
  return next;
}
