/**
 * JPDOC: アカウント連携とクラウドセーブ。プレイ時間や作成日時も含める。
 */
/** Client helpers for Better Auth account link + cloud save. */

import { getBearerToken } from "@/lib/auth/client";
import {
  getOrCreatePlayerId,
  readLocalCoins,
  writeLocalCoins,
  readLocalInbox,
  type FanMessage,
} from "@/lib/share";

const LINKED_PLAYER_KEY = "swipe_force_linked_player_v1";
const GUEST_PLAYER_KEY = "swipe_force_guest_player_v1";
const EASY_UP_KEY = "swipe_force_easy_up_v1";
const MSG_KEY = "swipe_force_msgs_v1";

export type EasyUpgrades = {
  shot: number;
  rate: number;
  speed: number;
  power: number;
  option: number;
  lockon: number;
  missile: number;
  particle: number;
  hyper: number;
  cluster: number;
  overdrive: number;
  beam: number;
  flame: number;
};

const EMPTY_UP: EasyUpgrades = {
  shot: 0,
  rate: 0,
  speed: 0,
  power: 0,
  option: 0,
  lockon: 0,
  missile: 0,
  particle: 0,
  hyper: 0,
  cluster: 0,
  overdrive: 0,
  beam: 0,
  flame: 0,
};

export type LinkedAccount = {
  linked: boolean;
  playerId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  coins?: number;
  easyUpgrades?: EasyUpgrades;
  inbox?: FanMessage[];
};

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = getBearerToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export function ensureGuestPlayerId(): string {
  try {
    let g = localStorage.getItem(GUEST_PLAYER_KEY);
    if (!g) {
      g = getOrCreatePlayerId();
      localStorage.setItem(GUEST_PLAYER_KEY, g);
    }
    return g;
  } catch {
    return getOrCreatePlayerId();
  }
}

export function getActivePlayerId(): string {
  try {
    const linked = localStorage.getItem(LINKED_PLAYER_KEY);
    if (linked && linked.length >= 4) return linked;
  } catch {
    /* ignore */
  }
  return ensureGuestPlayerId();
}

export function setLinkedPlayerId(playerId: string | null) {
  try {
    if (playerId) localStorage.setItem(LINKED_PLAYER_KEY, playerId);
    else localStorage.removeItem(LINKED_PLAYER_KEY);
    if (playerId) localStorage.setItem("swipe_force_player_v1", playerId);
  } catch {
    /* ignore */
  }
}

export function readLocalEasyUpgrades(): EasyUpgrades {
  try {
    const raw = localStorage.getItem(EASY_UP_KEY);
    if (!raw) return { ...EMPTY_UP };
    const p = JSON.parse(raw) as Partial<EasyUpgrades>;
    const out = { ...EMPTY_UP };
    (Object.keys(EMPTY_UP) as (keyof EasyUpgrades)[]).forEach((k) => {
      const n = Number(p[k]);
      out[k] = Number.isFinite(n) ? Math.max(0, Math.min(99, n | 0)) : 0;
    });
    return out;
  } catch {
    return { ...EMPTY_UP };
  }
}

export function writeLocalEasyUpgrades(up: EasyUpgrades) {
  try {
    localStorage.setItem(EASY_UP_KEY, JSON.stringify(up));
  } catch {
    /* ignore */
  }
}

function mergeUpgrades(a: EasyUpgrades, b: EasyUpgrades): EasyUpgrades {
  const out = { ...a };
  (Object.keys(EMPTY_UP) as (keyof EasyUpgrades)[]).forEach((k) => {
    out[k] = Math.max(a[k] || 0, b[k] || 0);
  });
  return out;
}

function applyInboxToLocal(playerId: string, list: FanMessage[]) {
  try {
    const all = JSON.parse(localStorage.getItem(MSG_KEY) || "{}") as Record<
      string,
      FanMessage[]
    >;
    const prev = all[playerId] || [];
    const map = new Map<string, FanMessage>();
    for (const m of [...prev, ...list]) {
      if (!m?.id) continue;
      const old = map.get(m.id);
      map.set(m.id, old ? { ...old, ...m, thanksSent: old.thanksSent || m.thanksSent } : m);
    }
    all[playerId] = [...map.values()].slice(0, 200);
    localStorage.setItem(MSG_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function applyCloudPayload(
  playerId: string,
  data: {
    coins?: number;
    easyUpgrades?: EasyUpgrades;
    inbox?: FanMessage[];
  },
  guestCoins: number,
  guestUp: EasyUpgrades,
  guestInbox: FanMessage[],
) {
  const coins = Math.max(Number(data.coins) || 0, readLocalCoins(playerId), guestCoins);
  writeLocalCoins(playerId, coins);

  const localUp = readLocalEasyUpgrades();
  const cloudUp = data.easyUpgrades
    ? mergeUpgrades(data.easyUpgrades, guestUp)
    : mergeUpgrades(localUp, guestUp);
  const mergedUp = mergeUpgrades(localUp, cloudUp);
  writeLocalEasyUpgrades(mergedUp);

  const inbox = [
    ...(data.inbox || []),
    ...guestInbox,
    ...readLocalInbox(playerId),
  ];
  applyInboxToLocal(playerId, inbox);

  return { coins, easyUpgrades: mergedUp, inbox: readLocalInbox(playerId) };
}

export async function fetchLinkedAccount(): Promise<LinkedAccount> {
  const guest = ensureGuestPlayerId();
  try {
    const res = await fetch("/api/account/link", {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      return {
        linked: false,
        playerId: guest,
        name: null,
        email: null,
        image: null,
      };
    }
    const data = (await res.json()) as {
      linked?: boolean;
      playerId?: string;
      coins?: number;
      easyUpgrades?: EasyUpgrades;
      inbox?: FanMessage[];
      user?: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      } | null;
    };
    if (!data.linked || !data.user || !data.playerId) {
      setLinkedPlayerId(null);
      return {
        linked: false,
        playerId: guest,
        name: null,
        email: null,
        image: null,
      };
    }
    setLinkedPlayerId(data.playerId);
    const applied = applyCloudPayload(
      data.playerId,
      data,
      0,
      readLocalEasyUpgrades(),
      readLocalInbox(guest),
    );
    // also migrate guest inbox into linked id
    applyInboxToLocal(data.playerId, readLocalInbox(guest));
    return {
      linked: true,
      playerId: data.playerId,
      name: data.user.name ?? null,
      email: data.user.email ?? null,
      image: data.user.image ?? null,
      coins: applied.coins,
      easyUpgrades: applied.easyUpgrades,
      inbox: applied.inbox,
    };
  } catch {
    return {
      linked: false,
      playerId: guest,
      name: null,
      email: null,
      image: null,
    };
  }
}

/** After sign-in: merge guest coins / easy upgrades / inbox into account. */
export async function bindAccountAndMerge(): Promise<LinkedAccount> {
  const guest = ensureGuestPlayerId();
  const guestCoins = readLocalCoins(guest);
  const guestUp = readLocalEasyUpgrades();
  const guestInbox = readLocalInbox(guest);
  try {
    const res = await fetch("/api/account/link", {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({
        guestPlayerId: guest,
        guestCoins,
        easyUpgrades: guestUp,
        inbox: guestInbox,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      playerId?: string;
      coins?: number;
      easyUpgrades?: EasyUpgrades;
      inbox?: FanMessage[];
      user?: { id: string; name?: string | null };
    };
    if (data.playerId) {
      setLinkedPlayerId(data.playerId);
      const applied = applyCloudPayload(
        data.playerId,
        data,
        guestCoins,
        guestUp,
        guestInbox,
      );
      if (guest !== data.playerId) writeLocalCoins(guest, 0);
      return {
        linked: true,
        playerId: data.playerId,
        name: data.user?.name ?? null,
        email: null,
        image: null,
        coins: applied.coins,
        easyUpgrades: applied.easyUpgrades,
        inbox: applied.inbox,
      };
    }
  } catch {
    /* fall through */
  }
  return fetchLinkedAccount();
}

/** Push current local cloud fields while linked (e.g. after easy buy). */
export async function pushCloudSave(): Promise<void> {
  const playerId = getActivePlayerId();
  const linked = (() => {
    try {
      return !!localStorage.getItem(LINKED_PLAYER_KEY);
    } catch {
      return false;
    }
  })();
  if (!linked) return;
  try {
    await fetch("/api/account/link", {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({
        guestPlayerId: playerId,
        guestCoins: 0, // don't double-add coins
        easyUpgrades: readLocalEasyUpgrades(),
        inbox: readLocalInbox(playerId),
      }),
    });
  } catch {
    /* ignore */
  }
}

export async function clearLinkedAccount() {
  setLinkedPlayerId(null);
  try {
    const g = ensureGuestPlayerId();
    localStorage.setItem("swipe_force_player_v1", g);
  } catch {
    /* ignore */
  }
}

// —— player profile (link perk) ——

export type PlayerProfile = {
  displayName: string;
  bio: string;
  /** 40-char share tweet blurb */
  shareBlurb: string;
  hasProfile: boolean;
};

const PROFILE_LS = "swipe_force_profile_v1";

export function readLocalProfile(): PlayerProfile {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_LS) || "{}") as Partial<PlayerProfile>;
    return {
      displayName: String(p.displayName || "").slice(0, 16),
      bio: String(p.bio || "").slice(0, 5000),
      shareBlurb: String(p.shareBlurb || "").slice(0, 40),
      hasProfile: !!(p.displayName || p.bio || p.shareBlurb),
    };
  } catch {
    return { displayName: "", bio: "", shareBlurb: "", hasProfile: false };
  }
}

export function writeLocalProfile(p: PlayerProfile) {
  try {
    localStorage.setItem(
      PROFILE_LS,
      JSON.stringify({
        displayName: p.displayName,
        bio: p.bio,
        shareBlurb: p.shareBlurb || "",
        hasProfile: !!(p.displayName || p.bio || p.shareBlurb),
      }),
    );
  } catch {
    /* ignore */
  }
}

export async function fetchPublicProfile(playerId: string): Promise<PlayerProfile> {
  const empty: PlayerProfile = {
    displayName: "",
    bio: "",
    shareBlurb: "",
    hasProfile: false,
  };
  if (!playerId || playerId.length < 4) return empty;
  try {
    const res = await fetch(
      `/api/account/profile?playerId=${encodeURIComponent(playerId)}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return empty;
    const data = (await res.json()) as {
      displayName?: string;
      bio?: string;
      shareBlurb?: string;
      hasProfile?: boolean;
    };
    return {
      displayName: String(data.displayName || "").slice(0, 16),
      bio: String(data.bio || "").slice(0, 5000),
      shareBlurb: String(data.shareBlurb || "").slice(0, 40),
      hasProfile: !!(
        data.hasProfile ||
        data.displayName ||
        data.bio ||
        data.shareBlurb
      ),
    };
  } catch {
    return empty;
  }
}

/**
 * Pull own profile from server DB into this origin's localStorage.
 * Needed because localStorage is per-domain (custom domain ≠ vercel.app).
 * Server profile is keyed by linked playerId and is shared.
 */
export async function syncProfileFromServer(
  playerId: string,
): Promise<PlayerProfile> {
  const remote = await fetchPublicProfile(playerId);
  if (remote.hasProfile) {
    writeLocalProfile(remote);
    return remote;
  }
  // remote empty: keep local if any (may not have been pushed yet)
  const local = readLocalProfile();
  return local.hasProfile ? local : remote;
}

export async function saveMyProfile(
  displayName: string,
  bio: string,
  shareBlurb = "",
): Promise<{ ok: boolean; reason?: string; profile?: PlayerProfile }> {
  try {
    const res = await fetch("/api/account/profile", {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({ displayName, bio, shareBlurb }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      reason?: string;
      displayName?: string;
      bio?: string;
      shareBlurb?: string;
      hasProfile?: boolean;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        reason: data.reason || (res.status === 401 ? "link_required" : "fail"),
      };
    }
    const profile: PlayerProfile = {
      displayName: String(data.displayName || ""),
      bio: String(data.bio || ""),
      shareBlurb: String(data.shareBlurb || ""),
      hasProfile: !!data.hasProfile,
    };
    writeLocalProfile(profile);
    return { ok: true, profile };
  } catch {
    return { ok: false, reason: "offline" };
  }
}
