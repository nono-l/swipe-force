/**
 * JPDOC: スタッフACL。根管理者IDはコード定数で、DB行にしない。
 */
/**
 * Game admin / staff checks.
 * - SUPER_ADMIN_PLAYER_ID is hard-coded and never removable
 * - Extra admins come from /api/admin/staff (cached in localStorage)
 */

import { getBearerToken } from "@/lib/auth/client";

/** Fixed root admin (cannot be removed or demoted) */
export const SUPER_ADMIN_PLAYER_ID = "uzwdbubkeggsdico0kgho";

/** @deprecated use SUPER_ADMIN_PLAYER_ID */
export const ADMIN_PLAYER_IDS: readonly string[] = [SUPER_ADMIN_PLAYER_ID];

export const EXTRA_ADMINS_KEY = "swipe_force_extra_admins_v1";

export type StaffEntry = {
  playerId: string;
  label: string;
  appointedBy?: string;
  createdAt?: string;
  fixed?: boolean;
};

export function normalizePlayerId(id: string | null | undefined): string {
  return String(id || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
}

export function isSuperAdmin(playerId: string | null | undefined): boolean {
  return normalizePlayerId(playerId) === SUPER_ADMIN_PLAYER_ID;
}

/** Cached appointed ids (not including super) */
export function loadExtraAdminIds(raw?: string | null): string[] {
  let s = raw;
  if (s == null) {
    try {
      s = localStorage.getItem(EXTRA_ADMINS_KEY);
    } catch {
      s = null;
    }
  }
  if (!s) return [];
  try {
    const t = JSON.parse(s);
    const arr = Array.isArray(t) ? t : t?.ids || t?.staff;
    if (!Array.isArray(arr)) return [];
    return [
      ...new Set(
        arr
          .map((x: unknown) =>
            typeof x === "string"
              ? normalizePlayerId(x)
              : normalizePlayerId((x as { playerId?: string })?.playerId),
          )
          .filter((id: string) => id && id !== SUPER_ADMIN_PLAYER_ID),
      ),
    ];
  } catch {
    return [];
  }
}

export function saveExtraAdminIds(ids: string[]): void {
  const clean = [
    ...new Set(
      ids
        .map(normalizePlayerId)
        .filter((id) => id && id !== SUPER_ADMIN_PLAYER_ID),
    ),
  ];
  try {
    localStorage.setItem(
      EXTRA_ADMINS_KEY,
      JSON.stringify({ ids: clean, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function isPromoAdminPlayer(playerId: string | null | undefined): boolean {
  const id = normalizePlayerId(playerId);
  if (!id) return false;
  if (id === SUPER_ADMIN_PLAYER_ID) return true;
  return loadExtraAdminIds().includes(id);
}

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = getBearerToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export type StaffListResult = {
  ok: boolean;
  offline?: boolean;
  superAdminId: string;
  me: string | null;
  isStaff: boolean;
  isSuper: boolean;
  staff: StaffEntry[];
  error?: string;
};

/** Fetch staff list from server and update local cache of appointed ids. */
export async function fetchStaffList(): Promise<StaffListResult> {
  const fallback: StaffListResult = {
    ok: true,
    offline: true,
    superAdminId: SUPER_ADMIN_PLAYER_ID,
    me: null,
    isStaff: false,
    isSuper: false,
    staff: [
      {
        playerId: SUPER_ADMIN_PLAYER_ID,
        label: "固定管理者",
        fixed: true,
      },
    ],
  };
  try {
    const res = await fetch(`/api/admin/staff`, {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as StaffListResult;
    const staff = Array.isArray(data.staff) ? data.staff : fallback.staff;
    const extra = staff
      .filter((s) => !s.fixed && normalizePlayerId(s.playerId) !== SUPER_ADMIN_PLAYER_ID)
      .map((s) => normalizePlayerId(s.playerId));
    saveExtraAdminIds(extra);
    return {
      ok: true,
      offline: !!data.offline,
      superAdminId: SUPER_ADMIN_PLAYER_ID,
      me: data.me ? normalizePlayerId(data.me) : null,
      isStaff: !!data.isStaff || isPromoAdminPlayer(data.me),
      isSuper: !!data.isSuper || isSuperAdmin(data.me),
      staff: staff.map((s) => ({
        playerId: normalizePlayerId(s.playerId),
        label: String(s.label || s.playerId).slice(0, 40),
        appointedBy: s.appointedBy ? normalizePlayerId(s.appointedBy) : "",
        createdAt: s.createdAt || "",
        fixed: !!s.fixed || normalizePlayerId(s.playerId) === SUPER_ADMIN_PLAYER_ID,
      })),
      error: data.error,
    };
  } catch {
    return fallback;
  }
}

export async function appointAdmin(
  playerId: string,
  label?: string,
): Promise<{ ok: boolean; reason?: string; staff?: StaffEntry[] }> {
  const target = normalizePlayerId(playerId);
  if (!target || target.length < 4) return { ok: false, reason: "bad_id" };
  if (target === SUPER_ADMIN_PLAYER_ID) return { ok: false, reason: "already_super" };
  try {
    const res = await fetch(`/api/admin/staff`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({ playerId: target, label: label || target }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        reason: (data as { reason?: string }).reason || `http_${res.status}`,
      };
    }
    const staff = Array.isArray((data as StaffListResult).staff)
      ? (data as StaffListResult).staff
      : [];
    saveExtraAdminIds(
      staff
        .filter((s) => !s.fixed && normalizePlayerId(s.playerId) !== SUPER_ADMIN_PLAYER_ID)
        .map((s) => normalizePlayerId(s.playerId)),
    );
    return { ok: true, staff };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function removeAppointedAdmin(
  playerId: string,
): Promise<{ ok: boolean; reason?: string; staff?: StaffEntry[] }> {
  const target = normalizePlayerId(playerId);
  if (!target) return { ok: false, reason: "bad_id" };
  if (target === SUPER_ADMIN_PLAYER_ID) return { ok: false, reason: "fixed" };
  try {
    const res = await fetch(`/api/admin/staff`, {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({ playerId: target }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        reason: (data as { reason?: string }).reason || `http_${res.status}`,
      };
    }
    const staff = Array.isArray((data as StaffListResult).staff)
      ? (data as StaffListResult).staff
      : [];
    saveExtraAdminIds(
      staff
        .filter((s) => !s.fixed && normalizePlayerId(s.playerId) !== SUPER_ADMIN_PLAYER_ID)
        .map((s) => normalizePlayerId(s.playerId)),
    );
    return { ok: true, staff };
  } catch {
    return { ok: false, reason: "network" };
  }
}
