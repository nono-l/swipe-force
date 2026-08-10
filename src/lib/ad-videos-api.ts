/**
 * Client helpers for admin ad-video management + player pool.
 */

import {
  cacheAdVideosLocal,
  loadCachedAdVideos,
  setAdWatchVideos,
  type AdVideo,
} from "@/components/game/engine/modes/ad-watch";

export type AdminAdViewer = {
  playerId: string;
  displayName?: string;
  watchSec: number;
  claims: number;
  lastClaimedAt: string | null;
};

export type AdminAdVideo = AdVideo & {
  maxDisplayHours: number;
  active: boolean;
  sortOrder: number;
  totalWatchSec: number;
  totalClaims: number;
  remainingDisplaySec: number | null;
  exhausted: boolean;
  ownerPlayerId?: string;
  ownerDisplayName?: string;
  ownerKind?: "platform" | "advertiser";
  viewers?: AdminAdViewer[];
  viewerCount?: number;
};

export async function fetchAdVideos(): Promise<{
  ok: boolean;
  videos: AdVideo[];
}> {
  try {
    const res = await fetch("/api/share/ad-videos", {
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      videos?: AdVideo[];
    };
    if (data.ok && Array.isArray(data.videos)) {
      cacheAdVideosLocal(data.videos);
      return { ok: true, videos: data.videos };
    }
  } catch {
    /* */
  }
  const cached = loadCachedAdVideos();
  setAdWatchVideos(cached);
  return { ok: false, videos: cached };
}

export async function fetchAdminAdVideos(playerId: string): Promise<{
  ok: boolean;
  videos: AdminAdVideo[];
  reason?: string;
}> {
  try {
    const res = await fetch(
      `/api/share/ad-videos?admin=1&playerId=${encodeURIComponent(playerId)}`,
      { credentials: "same-origin" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      videos?: AdminAdVideo[];
      reason?: string;
    };
    if (!data.ok) {
      return { ok: false, videos: [], reason: data.reason || "fail" };
    }
    return { ok: true, videos: Array.isArray(data.videos) ? data.videos : [] };
  } catch {
    return { ok: false, videos: [], reason: "network" };
  }
}

export async function saveAdminAdVideo(
  playerId: string,
  video: {
    id: string;
    label: string;
    durationSec: number;
    maxDisplayHours: number;
    active: boolean;
    sortOrder?: number;
  },
): Promise<{ ok: boolean; videos: AdminAdVideo[]; reason?: string }> {
  try {
    const res = await fetch("/api/share/ad-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "save", video }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      videos?: AdminAdVideo[];
      reason?: string;
    };
    if (!data.ok) {
      return { ok: false, videos: [], reason: data.reason || "fail" };
    }
    const videos = Array.isArray(data.videos) ? data.videos : [];
    // refresh player cache with active subset
    cacheAdVideosLocal(
      videos
        .filter((v) => v.active && !v.exhausted)
        .map((v) => ({
          id: v.id,
          label: v.label,
          durationSec: v.durationSec,
        })),
    );
    return { ok: true, videos };
  } catch {
    return { ok: false, videos: [], reason: "network" };
  }
}

export async function deleteAdminAdVideo(
  playerId: string,
  videoId: string,
): Promise<{ ok: boolean; videos: AdminAdVideo[]; reason?: string }> {
  try {
    const res = await fetch("/api/share/ad-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "delete", videoId }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      videos?: AdminAdVideo[];
      reason?: string;
    };
    if (!data.ok) {
      return { ok: false, videos: [], reason: data.reason || "fail" };
    }
    const videos = Array.isArray(data.videos) ? data.videos : [];
    cacheAdVideosLocal(
      videos
        .filter((v) => v.active && !v.exhausted)
        .map((v) => ({
          id: v.id,
          label: v.label,
          durationSec: v.durationSec,
        })),
    );
    return { ok: true, videos };
  } catch {
    return { ok: false, videos: [], reason: "network" };
  }
}

/** @deprecated text config API — use saveAdminAdVideo */
export async function saveAdVideosConfig(
  playerId: string,
  configText: string,
): Promise<{ ok: boolean; videos: AdVideo[]; reason?: string }> {
  // parse simple lines into replaceAll
  const videos: {
    id: string;
    label: string;
    durationSec: number;
    maxDisplayHours: number;
    active: boolean;
    sortOrder: number;
  }[] = [];
  let order = 0;
  for (const line of String(configText || "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split(/\s+/);
    const id = (parts[0] || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (id.length < 6) continue;
    let durationSec = 180;
    let label = id;
    if (parts[1] && /^\d+$/.test(parts[1])) {
      durationSec = Number(parts[1]);
      if (parts.length > 2) label = parts.slice(2).join(" ");
    } else if (parts.length > 1) {
      label = parts.slice(1).join(" ");
    }
    videos.push({
      id,
      label,
      durationSec,
      maxDisplayHours: 0,
      active: true,
      sortOrder: order++,
    });
  }
  try {
    const res = await fetch("/api/share/ad-videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "replaceAll", videos }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      videos?: AdminAdVideo[];
      reason?: string;
    };
    if (!data.ok) {
      return { ok: false, videos: [], reason: data.reason || "fail" };
    }
    const list = (data.videos || []).map((v) => ({
      id: v.id,
      label: v.label,
      durationSec: v.durationSec,
    }));
    cacheAdVideosLocal(list);
    return { ok: true, videos: list };
  } catch {
    return { ok: false, videos: [], reason: "network" };
  }
}
