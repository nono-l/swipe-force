/** Client helpers for advertiser portal + prepaid codes */

export type PrepaidCode = {
  code: string;
  label: string;
  creditHours: number;
  maxClaims: number;
  claimCount: number;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
  expiresAt?: string | null;
};

export type AdvertiserVideo = {
  id: string;
  label: string;
  durationSec: number;
  maxDisplayHours: number;
  active: boolean;
  exhausted: boolean;
  totalWatchSec: number;
  totalClaims: number;
  viewerCount: number;
  remainingDisplaySec: number | null;
  ownerPlayerId?: string;
  ownerDisplayName?: string;
  ownerKind?: "platform" | "advertiser";
  claimOnce?: boolean;
  showChannel?: boolean;
  channelUrl?: string;
  channelName?: string;
};

export type AdvertiserStatus = {
  ok: boolean;
  balance: { creditHours: number; creditSec?: number; totalCredited: number };
  assignedHours: number;
  freeHours: number;
  isAdvertiser: boolean;
  isAdmin?: boolean;
  scope?: string;
  videos: AdvertiserVideo[];
  allVideos?: AdvertiserVideo[];
  reason?: string;
};

export async function fetchAdvertiserStatus(
  playerId: string,
  opts?: { all?: boolean },
): Promise<AdvertiserStatus> {
  try {
    const q = new URLSearchParams({ playerId });
    if (opts?.all) q.set("all", "1");
    const res = await fetch(
      `/api/share/partner?${q.toString()}`,
      { credentials: "same-origin" },
    );
    const data = (await res.json().catch(() => ({}))) as AdvertiserStatus & {
      ok?: boolean;
      reason?: string;
    };
    if (!data.ok) {
      return {
        ok: false,
        balance: { creditHours: 0, totalCredited: 0 },
        assignedHours: 0,
        freeHours: 0,
        isAdvertiser: false,
        videos: [],
        reason: data.reason || "fail",
      };
    }
    return {
      ok: true,
      balance: data.balance || { creditHours: 0, totalCredited: 0 },
      assignedHours: Number(data.assignedHours) || 0,
      freeHours: Number(data.freeHours) || 0,
      isAdvertiser: !!data.isAdvertiser,
      isAdmin: !!(data as { isAdmin?: boolean }).isAdmin,
      scope: (data as { scope?: string }).scope,
      videos: Array.isArray(data.videos) ? data.videos : [],
      allVideos: Array.isArray((data as { allVideos?: AdvertiserVideo[] }).allVideos)
        ? (data as { allVideos: AdvertiserVideo[] }).allVideos
        : undefined,
    };
  } catch {
    return {
      ok: false,
      balance: { creditHours: 0, totalCredited: 0 },
      assignedHours: 0,
      freeHours: 0,
      isAdvertiser: false,
      videos: [],
      reason: "network",
    };
  }
}

export async function redeemPrepaidCode(
  playerId: string,
  code: string,
): Promise<{ ok: boolean; credited?: number; reason?: string; balance?: { creditHours: number } }> {
  try {
    const res = await fetch("/api/share/partner-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "redeem", code }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      credited?: number;
      reason?: string;
      balance?: { creditHours: number };
    };
    if (!data.ok) return { ok: false, reason: data.reason || "fail" };
    return {
      ok: true,
      credited: Number(data.credited) || 0,
      balance: data.balance,
    };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function saveAdvertiserVideo(
  playerId: string,
  video: {
    id: string;
    label: string;
    durationSec: number;
    maxDisplayHours: number;
    active: boolean;
    claimOnce?: boolean;
    showChannel?: boolean;
    channelUrl?: string;
    channelName?: string;
  },
): Promise<{ ok: boolean; reason?: string; message?: string; videos?: AdvertiserVideo[]; freeHours?: number }> {
  try {
    const res = await fetch("/api/share/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "save", video }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      message?: string;
      videos?: AdvertiserVideo[];
      freeHours?: number;
    };
    if (!data.ok) {
      return {
        ok: false,
        reason: data.reason || "fail",
        message: data.message,
      };
    }
    return {
      ok: true,
      videos: data.videos,
      freeHours: data.freeHours,
    };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function deleteAdvertiserVideo(
  playerId: string,
  videoId: string,
): Promise<{ ok: boolean; reason?: string; videos?: AdvertiserVideo[] }> {
  try {
    const res = await fetch("/api/share/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "delete", videoId }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      videos?: AdvertiserVideo[];
    };
    if (!data.ok) return { ok: false, reason: data.reason || "fail" };
    return { ok: true, videos: data.videos };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function fetchPrepaidAdmin(playerId: string): Promise<{
  ok: boolean;
  codes: PrepaidCode[];
  reason?: string;
}> {
  try {
    const res = await fetch(
      `/api/share/partner-credit?admin=1&playerId=${encodeURIComponent(playerId)}`,
      { credentials: "same-origin" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      codes?: PrepaidCode[];
      reason?: string;
    };
    if (!data.ok) return { ok: false, codes: [], reason: data.reason || "fail" };
    return { ok: true, codes: Array.isArray(data.codes) ? data.codes : [] };
  } catch {
    return { ok: false, codes: [], reason: "network" };
  }
}

export async function createPrepaidCode(
  playerId: string,
  opts: {
    code?: string;
    label?: string;
    creditHours: number;
    maxClaims?: number;
    expiresAt?: string;
  },
): Promise<{ ok: boolean; code?: string; reason?: string }> {
  try {
    const res = await fetch("/api/share/partner-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "create", ...opts }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      code?: string;
      reason?: string;
    };
    if (!data.ok) return { ok: false, reason: data.reason || "fail" };
    return { ok: true, code: data.code };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function disablePrepaidCode(
  playerId: string,
  code: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch("/api/share/partner-credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "disable", code }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
    };
    if (!data.ok) return { ok: false, reason: data.reason || "fail" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}
