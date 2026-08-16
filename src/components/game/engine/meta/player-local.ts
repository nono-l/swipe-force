// @ts-nocheck
/** Player id, continue coins, missions (localStorage). */

export var KEY_PLAYER_ID = `swipe_force_player_v1`,
    KEY_COINS_LEGACY = `swipe_force_coins_v1`,
    KEY_COIN_LEDGER = `swipe_force_coin_ledger_v1`,
    KEY_MISSIONS = `swipe_force_missions_v1`,
    KEY_MSGS = `swipe_force_msgs_v1`,
    KEY_MSG_SENT = `swipe_force_msg_sent_v1`,
    MISSION_DEFS = [{
        id: `m1`,
        label: `M1`,
        detail: `1面ボス到達`,
        minSec: 10,
        coins: 1
    }, {
        id: `m2`,
        label: `M2`,
        detail: `2面ボス撃破`,
        minSec: 25,
        coins: 1
    }, {
        id: `m3`,
        label: `M3`,
        detail: `3面ボス撃破`,
        minSec: 45,
        coins: 1
    }, {
        id: `m4`,
        label: `M4`,
        detail: `4面ボス撃破`,
        minSec: 70,
        coins: 1
    }];

export function newPlayerId() {
    try {
        let e = localStorage.getItem(KEY_PLAYER_ID);
        if (!e || e.length < 6) {
            e = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(e => (e % 36).toString(36)).join(``);
            localStorage.setItem(KEY_PLAYER_ID, e);
        }
        try {
            const metaKey = `swipe_force_id_meta_v1`;
            const m = JSON.parse(localStorage.getItem(metaKey) || `{}`);
            if (!m[e]?.createdAt) {
                m[e] = { createdAt: new Date().toISOString() };
                localStorage.setItem(metaKey, JSON.stringify(m));
            }
        } catch {}
        return e
    } catch {
        return `guest`
    }
}

export function getCoins(e) {
    try {
        let t = JSON.parse(localStorage.getItem(`swipe_force_coin_ledger_v1`) || `{}`);
        if (typeof t[e] == `number`) return Math.max(0, t[e] | 0);
        let n = Number(localStorage.getItem(`swipe_force_coins_v1`) || `0`);
        return Math.max(0, n | 0)
    } catch {
        return 0
    }
}

export function setCoins(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_coin_ledger_v1`) || `{}`);
        n[e] = Math.max(0, t | 0), localStorage.setItem(KEY_COIN_LEDGER, JSON.stringify(n)), localStorage.setItem(KEY_COINS_LEGACY, String(n[e]))
    } catch {}
}

export function addCoins(e, t) {
    let n = Math.max(0, getCoins(e) + t);
    return setCoins(e, n), n
}

export function loadAllMissions() {
    try {
        return JSON.parse(localStorage.getItem(`swipe_force_missions_v1`) || `{}`)
    } catch {
        return {}
    }
}

export function saveAllMissions(e) {
    try {
        localStorage.setItem(KEY_MISSIONS, JSON.stringify(e))
    } catch {}
}

export function newShareId() {
    try {
        return Array.from(crypto.getRandomValues(new Uint8Array(8))).map(e => (e % 36).toString(36)).join(``)
    } catch {
        return `s${Date.now().toString(36)}`
    }
}

export function getMissionsForShare(e) {
    return e ? {
        ...(loadAllMissions()[e] || {})
    } : {}
}

export function isMissionDone(e, t) {
    return !!getMissionsForShare(e)[t]
}

export function markMissionDone(e, t) {
    let n = loadAllMissions();
    n[e] = {
        ...n[e] || {},
        [t]: !0
    }, saveAllMissions(n)
}

export function allMissionsComplete(e) {
    let t = getMissionsForShare(e);
    return MISSION_DEFS.every(e => t[e.id])
}

export function hasSentFanmail(e, t) {
    if (!e || !t) return !1;
    try {
        return !!JSON.parse(localStorage.getItem(`swipe_force_msg_sent_v1`) || `{}`)[`${t}>${e}`]
    } catch {
        return !1
    }
}

export function markFanmailSent(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_msg_sent_v1`) || `{}`);
        n[`${t}>${e}`] = !0, localStorage.setItem(KEY_MSG_SENT, JSON.stringify(n))
    } catch {}
}

export function canSendFanmailTo(e, t, n) {
    return !!e && !!t && !!n && t !== n && allMissionsComplete(e) && !hasSentFanmail(e, n)
}

export function parseShareParams() {
    try {
        let e = new URL(window.location.href),
            t = e.searchParams.get(`ref`) || e.searchParams.get(`share`),
            n = e.searchParams.get(`sid`) || e.searchParams.get(`s`),
            r = t ? t.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null,
            i = n ? n.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null;
        return !r || r.length < 4 || !i || i.length < 4 ? {
            ref: null,
            sid: null
        } : {
            ref: r,
            sid: i
        }
    } catch {
        return {
            ref: null,
            sid: null
        }
    }
}

export function buildShareUrl(e, t) {
    try {
        let n = new URL(window.location.href);
        return n.searchParams.set(`ref`, e), n.searchParams.set(`sid`, t), n.hash = ``, n.toString()
    } catch {
        return `?ref=${e}&sid=${t}`
    }
}

export function formatShareProgress(e) {
    let t = Math.max(1, e.stage || 1),
        n = e.difficulty === `normal` ? `NORMAL` : e.difficulty === `tutorial` ? `TUTORIAL` : e.difficulty === `easy` ? `EASY` : ``,
        r = typeof e.score == `number` && e.score > 0 ? ` SCORE ${String(e.score).padStart(7,`0`)}` : ``,
        i = e.context || `title`;
    return i === `gameover` ? [`🆘 助けて！ ${n} STAGE ${t} で撃沈${r}`, e.bossName ? `ボス「${e.bossName}」手前/戦いでやられました` : `進行: ${t}面目安`, `遊んでミッションクリアしてくれるとコンティニューできます`].join(`
`) : i === `boss` ? [`⚔️ ボス戦中！ ${n} STAGE ${t}${e.bossName?`「${e.bossName}」`:``}${r}`, `応援プレイ（ミッション）でシェア主にコインが入ります`].join(`
`) : i === `playing` || i === `ready` || i === `shop` ? [`🚀 進行中 ${n} STAGE ${t}${r}`, `いま ${t}面あたりで助けを求めてます`, `M1=1面ボス到達 / M2~4=2~4面ボス撃破 → コイン1枚ずつ`].join(`
`) : [`📣 一緒に遊んで助けて！（${n||`SWIPE FORCE`}）`, `ミッションクリアでシェア主にコンティニューコイン🎁`, `M1:1面ボス到達 / M2~4:各面ボス撃破（各1枚）`].join(`
`)
}


// ── Twitter share intent ──
