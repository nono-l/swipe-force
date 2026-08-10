// @ts-nocheck
/**
 * Account link + cloud save (continue coins / easy ups / inbox / play stats).
 * Storage keys + GET/POST /api/account/link helpers.
 */
import { getBearerToken } from "@/lib/auth/client";
import { newPlayerId, getCoins, setCoins, loadLocalInbox } from "./share";
import {
  applyCloudStats,
  readStats,
  type PlayerStats,
} from "@/lib/player-stats";
import {
  applyIdCreatedAt,
  ensureIdCreatedAt,
  getIdCreatedAt,
} from "@/lib/player-id-meta";

export var KEY_LINKED_PLAYER = `swipe_force_linked_player_v1`,
    KEY_LOCAL_PLAYER = `swipe_force_guest_player_v1`,
    KEY_EASY_CLOUD = `swipe_force_easy_up_v1`,
    KEY_CLOUD_INBOX = `swipe_force_msgs_v1`,
    EMPTY_EASY_UPGRADES = {
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
        flame: 0
    };

export function authHeaders() {
    let e = {
            "Content-Type": `application/json`
        },
        t = getBearerToken();
    return t && (e.Authorization = `Bearer ${t}`), e
}

export function ensureLocalPlayerId() {
    try {
        let e = localStorage.getItem(KEY_LOCAL_PLAYER);
        if (!e) {
            e = newPlayerId();
            localStorage.setItem(KEY_LOCAL_PLAYER, e);
            ensureIdCreatedAt(e);
        } else {
            ensureIdCreatedAt(e);
        }
        return e
    } catch {
        return newPlayerId()
    }
}

export function loadPlayerId() {
    try {
        let e = localStorage.getItem(KEY_LINKED_PLAYER);
        if (e && e.length >= 4) return e
    } catch {}
    return ensureLocalPlayerId()
}

export function setLinkedPlayerId(e) {
    try {
        e ? localStorage.setItem(KEY_LINKED_PLAYER, e) : localStorage.removeItem(KEY_LINKED_PLAYER), e && localStorage.setItem(`swipe_force_player_v1`, e)
    } catch {}
}

export function loadEasyUpgradesCloud() {
    try {
        let e = localStorage.getItem(KEY_EASY_CLOUD);
        if (!e) return {
            ...EMPTY_EASY_UPGRADES
        };
        let t = JSON.parse(e),
            n = {
                ...EMPTY_EASY_UPGRADES
            };
        return Object.keys(EMPTY_EASY_UPGRADES).forEach(e => {
            let r = Number(t[e]);
            n[e] = Number.isFinite(r) ? Math.max(0, Math.min(99, r | 0)) : 0
        }), n
    } catch {
        return {
            ...EMPTY_EASY_UPGRADES
        }
    }
}

export function saveEasyUpgradesCloud(e) {
    try {
        localStorage.setItem(KEY_EASY_CLOUD, JSON.stringify(e))
    } catch {}
}

export function mergeEasyUpgrades(e, t) {
    let n = {
        ...e
    };
    return Object.keys(EMPTY_EASY_UPGRADES).forEach(r => {
        n[r] = Math.max(e[r] || 0, t[r] || 0)
    }), n
}

export function mergeInboxMessages(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(KEY_CLOUD_INBOX) || `{}`),
            r = n[e] || [],
            i = new Map;
        for (let e of [...r, ...t]) {
            if (!e?.id) continue;
            let t = i.get(e.id);
            i.set(e.id, t ? {
                ...t,
                ...e,
                thanksSent: t.thanksSent || e.thanksSent
            } : e)
        }
        n[e] = [...i.values()].slice(0, 200), localStorage.setItem(KEY_CLOUD_INBOX, JSON.stringify(n))
    } catch {}
}

/**
 * Apply server snapshot into local storage.
 * @param playerId linked account player id
 * @param cloud response body (coins, easyUpgrades, inbox, playTimeSec, stats)
 * @param guestCoins coins to max-merge
 * @param guestEasy guest easy upgrades
 * @param guestInbox guest inbox messages
 */
export function applyCloudSnapshot(playerId, cloud, guestCoins, guestEasy, guestInbox) {
    let coins = Math.max(
        Number(cloud?.coins) || 0,
        getCoins(playerId),
        Number(guestCoins) || 0,
    );
    setCoins(playerId, coins);
    let localEasy = loadEasyUpgradesCloud();
    let cloudEasy = cloud?.easyUpgrades
        ? mergeEasyUpgrades(parseMaybeUpgrades(cloud.easyUpgrades), guestEasy || EMPTY_EASY_UPGRADES)
        : mergeEasyUpgrades(localEasy, guestEasy || EMPTY_EASY_UPGRADES);
    let easyUpgrades = mergeEasyUpgrades(localEasy, cloudEasy);
    saveEasyUpgradesCloud(easyUpgrades);

    let cloudInbox = Array.isArray(cloud?.inbox) ? cloud.inbox : [];
    let guest = Array.isArray(guestInbox) ? guestInbox : [];
    let existing = [];
    try {
        existing = loadLocalInbox(playerId) || [];
    } catch {
        existing = [];
    }
    mergeInboxMessages(playerId, [...cloudInbox, ...guest, ...existing]);

    // play time + stats (max-merge into local)
    let stats: PlayerStats | null = null;
    try {
        stats = applyCloudStats(cloud?.stats, cloud?.playTimeSec);
    } catch {
        try {
            stats = applyCloudStats({}, cloud?.playTimeSec);
        } catch {
            stats = null;
        }
    }

    let idCreatedAt = "";
    try {
        idCreatedAt = applyIdCreatedAt(playerId, cloud?.idCreatedAt);
        // also stamp guest id if different
        try {
            const guest = ensureLocalPlayerId();
            if (guest && guest !== playerId) ensureIdCreatedAt(guest);
        } catch { /* */ }
    } catch {
        idCreatedAt = getIdCreatedAt(playerId);
    }

    return {
        coins,
        easyUpgrades,
        inbox: loadLocalInbox(playerId),
        playTimeSec: stats?.playTimeSec ?? (Number(cloud?.playTimeSec) || 0),
        stats,
        idCreatedAt,
    }
}

function parseMaybeUpgrades(raw) {
    if (!raw || typeof raw !== `object`) return { ...EMPTY_EASY_UPGRADES };
    let n = { ...EMPTY_EASY_UPGRADES };
    Object.keys(EMPTY_EASY_UPGRADES).forEach(k => {
        let r = Number(raw[k]);
        n[k] = Number.isFinite(r) ? Math.max(0, Math.min(99, r | 0)) : 0
    });
    return n
}

function localStatsPayload() {
    try {
        return readStats();
    } catch {
        return null;
    }
}

function cloudBodyBase(e, t, n, r) {
    const stats = localStatsPayload() || {
        playTimeSec: 0,
        helpAsked: 0,
        helpReceived: 0,
        maxStageEasy: 0,
        maxStageNormal: 0,
        runs: 0,
        totalKills: 0,
        bossesDefeated: 0,
        continuesUsed: 0,
        hiScore: 0,
        lastPlayedAt: "",
    };
    const idCreatedAt = ensureIdCreatedAt(e) || getIdCreatedAt(e);
    return {
        guestPlayerId: e,
        guestCoins: t,
        easyUpgrades: n,
        inbox: r,
        playTimeSec: stats.playTimeSec | 0,
        stats,
        idCreatedAt,
    };
}

export async function fetchAccountGet() {
    let e = ensureLocalPlayerId();
    try {
        let t = await fetch(`/api/account/link`, {
            method: `GET`,
            headers: authHeaders(),
            credentials: `include`
        });
        if (!t.ok) return {
            linked: !1,
            playerId: e,
            name: null,
            email: null,
            image: null
        };
        let n = await t.json().catch(() => ({}));
        if (!n.linked || !n.user || !n.playerId) return setLinkedPlayerId(null), {
            linked: !1,
            playerId: e,
            name: null,
            email: null,
            image: null
        };
        setLinkedPlayerId(n.playerId);
        let r = applyCloudSnapshot(n.playerId, n, 0, loadEasyUpgradesCloud(), loadLocalInbox(e));
        return mergeInboxMessages(n.playerId, loadLocalInbox(e)), {
            linked: !0,
            playerId: n.playerId,
            name: n.user.name ?? null,
            email: n.user.email ?? null,
            image: n.user.image ?? null,
            coins: r.coins,
            easyUpgrades: r.easyUpgrades,
            inbox: r.inbox,
            playTimeSec: r.playTimeSec,
            stats: r.stats,
            idCreatedAt: r.idCreatedAt,
        }
    } catch (err) {
        console.warn("[SWIPE FORCE] fetchAccountGet failed", err);
        return {
            linked: !1,
            playerId: e,
            name: null,
            email: null,
            image: null
        }
    }
}
export async function linkAccountPost() {
    let e = ensureLocalPlayerId(),
        t = getCoins(e),
        n = loadEasyUpgradesCloud(),
        r = loadLocalInbox(e);
    try {
        // flush play-time accumulator before upload
        try {
            const acc = Number((globalThis as any).__sfPlayAcc) || 0;
            if (acc >= 1) {
                const { addPlayTime } = await import("@/lib/player-stats");
                addPlayTime(acc);
                (globalThis as any).__sfPlayAcc = 0;
            }
        } catch { /* ignore */ }
        let res = await fetch(`/api/account/link`, {
            method: `POST`,
            headers: authHeaders(),
            credentials: `include`,
            body: JSON.stringify(cloudBodyBase(e, t, n, r))
        });
        if (res.status === 401) return fetchAccountGet();
        let i = await res.json().catch(() => ({}));
        if (i.playerId) {
            setLinkedPlayerId(i.playerId);
            let a = applyCloudSnapshot(i.playerId, i, t, n, r);
            return e !== i.playerId && setCoins(e, 0), {
                linked: !0,
                playerId: i.playerId,
                name: i.user?.name ?? null,
                email: i.user?.email ?? null,
                image: i.user?.image ?? null,
                coins: a.coins,
                easyUpgrades: a.easyUpgrades,
                inbox: a.inbox,
                playTimeSec: a.playTimeSec,
                stats: a.stats,
                idCreatedAt: a.idCreatedAt,
            }
        }
    } catch (err) {
        console.warn("[SWIPE FORCE] linkAccountPost failed", err);
    }
    return fetchAccountGet()
}
export async function syncAccountCloud() {
    let e = loadPlayerId();
    if ((() => {
            try {
                return !!localStorage.getItem(KEY_LINKED_PLAYER)
            } catch {
                return !1
            }
        })()) try {
        try {
            const acc = Number((globalThis as any).__sfPlayAcc) || 0;
            if (acc >= 1) {
                const { addPlayTime } = await import("@/lib/player-stats");
                addPlayTime(acc);
                (globalThis as any).__sfPlayAcc = 0;
            }
        } catch { /* ignore */ }
        const stats = readStats();
        const idCreatedAt = ensureIdCreatedAt(e) || getIdCreatedAt(e);
        await fetch(`/api/account/link`, {
            method: `POST`,
            headers: authHeaders(),
            credentials: `include`,
            body: JSON.stringify({
                guestPlayerId: e,
                guestCoins: 0,
                easyUpgrades: loadEasyUpgradesCloud(),
                inbox: loadLocalInbox(e),
                playTimeSec: stats.playTimeSec | 0,
                stats,
                idCreatedAt,
            })
        })
    } catch {}
}
export async function unlinkAccountLocal() {
    setLinkedPlayerId(null);
    try {
        let e = ensureLocalPlayerId();
        localStorage.setItem(`swipe_force_player_v1`, e)
    } catch {}
}
