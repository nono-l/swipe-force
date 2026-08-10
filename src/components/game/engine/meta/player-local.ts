// @ts-nocheck
/** Player id, continue coins, missions (localStorage). */

export var gn = `swipe_force_player_v1`,
    _n = `swipe_force_coins_v1`,
    vn = `swipe_force_coin_ledger_v1`,
    yn = `swipe_force_missions_v1`,
    bn = `swipe_force_msgs_v1`,
    xn = `swipe_force_msg_sent_v1`,
    Sn = [{
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

export function Cn() {
    try {
        let e = localStorage.getItem(gn);
        return (!e || e.length < 6) && (e = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(e => (e % 36).toString(36)).join(``), localStorage.setItem(gn, e)), e
    } catch {
        return `guest`
    }
}

export function wn(e) {
    try {
        let t = JSON.parse(localStorage.getItem(`swipe_force_coin_ledger_v1`) || `{}`);
        if (typeof t[e] == `number`) return Math.max(0, t[e] | 0);
        let n = Number(localStorage.getItem(`swipe_force_coins_v1`) || `0`);
        return Math.max(0, n | 0)
    } catch {
        return 0
    }
}

export function Tn(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_coin_ledger_v1`) || `{}`);
        n[e] = Math.max(0, t | 0), localStorage.setItem(vn, JSON.stringify(n)), localStorage.setItem(_n, String(n[e]))
    } catch {}
}

export function En(e, t) {
    let n = Math.max(0, wn(e) + t);
    return Tn(e, n), n
}

export function Dn() {
    try {
        return JSON.parse(localStorage.getItem(`swipe_force_missions_v1`) || `{}`)
    } catch {
        return {}
    }
}

export function On(e) {
    try {
        localStorage.setItem(yn, JSON.stringify(e))
    } catch {}
}

export function kn() {
    try {
        return Array.from(crypto.getRandomValues(new Uint8Array(8))).map(e => (e % 36).toString(36)).join(``)
    } catch {
        return `s${Date.now().toString(36)}`
    }
}

export function An(e) {
    return e ? {
        ...Dn()[e]
    } : {}
}

export function jn(e, t) {
    return !!An(e)[t]
}

export function Mn(e, t) {
    let n = Dn();
    n[e] = {
        ...n[e] || {},
        [t]: !0
    }, On(n)
}

export function Nn(e) {
    let t = An(e);
    return Sn.every(e => t[e.id])
}

export function Pn(e, t) {
    if (!e || !t) return !1;
    try {
        return !!JSON.parse(localStorage.getItem(`swipe_force_msg_sent_v1`) || `{}`)[`${t}>${e}`]
    } catch {
        return !1
    }
}

export function Fn(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_msg_sent_v1`) || `{}`);
        n[`${t}>${e}`] = !0, localStorage.setItem(xn, JSON.stringify(n))
    } catch {}
}

export function In(e, t, n) {
    return !!e && !!t && !!n && t !== n && Nn(e) && !Pn(e, n)
}

export function Ln() {
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

export function Rn(e, t) {
    try {
        let n = new URL(window.location.href);
        return n.searchParams.set(`ref`, e), n.searchParams.set(`sid`, t), n.hash = ``, n.toString()
    } catch {
        return `?ref=${e}&sid=${t}`
    }
}

export function zn(e) {
    let t = Math.max(1, e.stage || 1),
        n = e.difficulty === `normal` ? `NORMAL` : e.difficulty === `easy` ? `EASY` : ``,
        r = typeof e.score == `number` && e.score > 0 ? ` SCORE ${String(e.score).padStart(7,`0`)}` : ``,
        i = e.context || `title`;
    return i === `gameover` ? [`🆘 助けて！ ${n} STAGE ${t} で撃沈${r}`, e.bossName ? `ボス「${e.bossName}」手前/戦いでやられました` : `進行: ${t}面目安`, `遊んでミッションクリアしてくれるとコンティニューできます`].join(`
`) : i === `boss` ? [`⚔️ ボス戦中！ ${n} STAGE ${t}${e.bossName?`「${e.bossName}」`:``}${r}`, `応援プレイ（ミッション）でシェア主にコインが入ります`].join(`
`) : i === `playing` || i === `ready` || i === `shop` ? [`🚀 進行中 ${n} STAGE ${t}${r}`, `いま ${t}面あたりで助けを求めてます`, `M1=1面ボス到達 / M2~4=2~4面ボス撃破 → コイン1枚ずつ`].join(`
`) : [`📣 一緒に遊んで助けて！（${n||`SWIPE FORCE`}）`, `ミッションクリアでシェア主にコンティニューコイン🎁`, `M1:1面ボス到達 / M2~4:各面ボス撃破（各1枚）`].join(`
`)
}


// ── Twitter share intent ──
