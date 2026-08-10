// @ts-nocheck
/** Sound-test comments, votes, URL reports & visits (recovered). */

// ── Sound test comments & votes ──
export var Gt = `swipe_force_sound_votes_v1`;

export function Kt() {
    try {
        return JSON.parse(localStorage.getItem(Gt) || `{}`)
    } catch {
        return {}
    }
}

export function qt(e) {
    try {
        localStorage.setItem(Gt, JSON.stringify(e))
    } catch {}
}

export function Jt(e) {
    return Kt()[e] || {
        likes: 0,
        dislikes: 0,
        mine: null
    }
}
export async function Yt(e, t) {
    let n = Jt(e);
    try {
        let r = await fetch(`/api/sound/votes?track=${encodeURIComponent(e)}&playerId=${encodeURIComponent(t)}`, {
            credentials: `same-origin`
        });
        if (!r.ok) return n;
        let i = await r.json(),
            a = {
                likes: Number(i.likes) || 0,
                dislikes: Number(i.dislikes) || 0,
                mine: i.mine === 1 || i.mine === -1 ? i.mine : null
            };
        if (i.offline && n.mine) return {
            likes: Math.max(n.likes, a.likes),
            dislikes: Math.max(n.dislikes, a.dislikes),
            mine: n.mine
        };
        let o = Kt();
        return o[e] = a, qt(o), a
    } catch {
        return n
    }
}
export async function Xt(e, t, n) {
    let r = Kt(),
        i = r[e] || {
            likes: 0,
            dislikes: 0,
            mine: null
        },
        a = i.likes,
        o = i.dislikes;
    i.mine === 1 && (a = Math.max(0, a - 1)), i.mine === -1 && (o = Math.max(0, o - 1));
    let s = null;
    n === 1 ? i.mine === 1 ? s = null : (a += 1, s = 1) : n === -1 && (i.mine === -1 ? s = null : (o += 1, s = -1));
    let c = {
        likes: a,
        dislikes: o,
        mine: s
    };
    r[e] = c, qt(r);
    let l = s === null ? 0 : s;
    try {
        let n = await (await fetch(`/api/sound/votes`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            credentials: `same-origin`,
            body: JSON.stringify({
                track: e,
                playerId: t,
                vote: l
            })
        })).json();
        if (n && typeof n.likes == `number`) {
            let t = {
                likes: Number(n.likes) || 0,
                dislikes: Number(n.dislikes) || 0,
                mine: n.mine === 1 || n.mine === -1 ? n.mine : null
            };
            return r[e] = t, qt(r), t
        }
    } catch {}
    return c
}
export var Zt = [{
        id: `kami`,
        label: `神`,
        emoji: `✨`,
        tone: `good`
    }, {
        id: `affiliate`,
        label: `アフィ`,
        emoji: `💰`,
        tone: `warn`
    }, {
        id: `spam`,
        label: `スパム`,
        emoji: `🚫`,
        tone: `bad`
    }, {
        id: `gore`,
        label: `グロ`,
        emoji: `⚠️`,
        tone: `bad`
    }, {
        id: `fraud`,
        label: `詐欺`,
        emoji: `🚨`,
        tone: `bad`
    }, {
        id: `copyright`,
        label: `著作権`,
        emoji: `©️`,
        tone: `warn`
    }],
    q = `swipe_force_url_reports_v1`;

export function Qt() {
    try {
        return JSON.parse(localStorage.getItem(q) || `{}`)
    } catch {
        return {}
    }
}

export function $t(e) {
    try {
        localStorage.setItem(q, JSON.stringify(e))
    } catch {}
}

export function en(e, t) {
    return `${e}::${t}`
}
export async function tn(e, t, n) {
    if (!t.length) return {};
    let r = Qt(),
        i = {};
    for (let n of t) i[n] = r[en(e, n)] || {
        counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
        mine: null
    };
    try {
        let r = await fetch(`/api/sound/url-report?track=${encodeURIComponent(e)}&playerId=${encodeURIComponent(n)}&urls=${encodeURIComponent(JSON.stringify(t))}`, {
            credentials: `same-origin`
        });
        if (!r.ok) return i;
        let a = (await r.json()).reports || {},
            o = Qt();
        for (let [t, n] of Object.entries(a)) o[en(e, t)] = n, i[t] = n;
        return $t(o), i
    } catch {
        return i
    }
}
export async function nn(e, t, n, r) {
    try {
        let i = await fetch(`/api/sound/url-report`, {
                method: `POST`,
                headers: {
                    "Content-Type": `application/json`
                },
                credentials: `same-origin`,
                body: JSON.stringify({
                    track: e,
                    playerId: n,
                    url: t,
                    reason: r
                })
            }),
            a = await i.json();
        if (!i.ok) return {
            ok: !1,
            reason: a.reason || `fail`,
            counts: a.counts || {},
            mine: null,
            visited: !1
        };
        if (a && a.counts) {
            let n = Qt(),
                r = {
                    counts: a.counts,
                    mine: a.mine ?? null,
                    visited: !0
                };
            return n[en(e, t)] = r, $t(n), {
                ok: !0,
                ...r
            }
        }
    } catch {}
    if (!an()[en(e, t)]) return {
        ok: !1,
        reason: `not_visited`,
        counts: {},
        mine: null,
        visited: !1
    };
    let i = Qt(),
        a = en(e, t),
        o = i[a] || {
            counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
            mine: null,
            visited: !0
        },
        s = {
            ...o.counts
        };
    o.mine && s[o.mine] != null && (s[o.mine] = Math.max(0, (s[o.mine] || 0) - 1));
    let c = r;
    o.mine === r ? c = null : s[r] = (s[r] || 0) + 1;
    let l = {
        counts: s,
        mine: c,
        visited: !0
    };
    return i[a] = l, $t(i), {
        ok: !0,
        ...l
    }
}
export var rn = `swipe_force_url_visits_v1`;

export function an() {
    try {
        return JSON.parse(localStorage.getItem(rn) || `{}`)
    } catch {
        return {}
    }
}

export function J(e) {
    try {
        localStorage.setItem(rn, JSON.stringify(e))
    } catch {}
}

export function on(e, t) {
    return !!an()[en(e, t)]
}
export async function sn(e, t, n) {
    try {
        let r = await fetch(`/api/sound/url-visit`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            credentials: `same-origin`,
            body: JSON.stringify({
                track: e,
                playerId: n,
                url: t
            })
        });
        if (r.status === 401 || !r.ok && !(await r.json().catch(() => ({}))).ok) return !1
    } catch {
        return !1
    }
    let r = an();
    r[en(e, t)] = !0, J(r);
    let i = Qt(),
        a = en(e, t);
    return i[a] = {
        ...i[a] || {
            counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
            mine: null
        },
        visited: !0
    }, $t(i), !0
}

