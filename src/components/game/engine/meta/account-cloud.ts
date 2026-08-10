// @ts-nocheck
/**
 * Account link + cloud save (continue coins / easy ups / inbox merge).
 * Storage keys + GET/POST /api/account/link helpers.
 */
import { getBearerToken } from "@/lib/auth/client";
import { Cn, wn, Tn, Xn } from "./share";

export var rr = `swipe_force_linked_player_v1`,
    ir = `swipe_force_guest_player_v1`,
    ar = `swipe_force_easy_up_v1`,
    or = `swipe_force_msgs_v1`,
    sr = {
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

export function cr() {
    let e = {
            "Content-Type": `application/json`
        },
        t = getBearerToken();
    return t && (e.Authorization = `Bearer ${t}`), e
}

export function lr() {
    try {
        let e = localStorage.getItem(ir);
        return e || (e = Cn(), localStorage.setItem(ir, e)), e
    } catch {
        return Cn()
    }
}

export function ur() {
    try {
        let e = localStorage.getItem(rr);
        if (e && e.length >= 4) return e
    } catch {}
    return lr()
}

export function dr(e) {
    try {
        e ? localStorage.setItem(rr, e) : localStorage.removeItem(rr), e && localStorage.setItem(`swipe_force_player_v1`, e)
    } catch {}
}

export function fr() {
    try {
        let e = localStorage.getItem(ar);
        if (!e) return {
            ...sr
        };
        let t = JSON.parse(e),
            n = {
                ...sr
            };
        return Object.keys(sr).forEach(e => {
            let r = Number(t[e]);
            n[e] = Number.isFinite(r) ? Math.max(0, Math.min(99, r | 0)) : 0
        }), n
    } catch {
        return {
            ...sr
        }
    }
}

export function pr(e) {
    try {
        localStorage.setItem(ar, JSON.stringify(e))
    } catch {}
}

export function mr(e, t) {
    let n = {
        ...e
    };
    return Object.keys(sr).forEach(r => {
        n[r] = Math.max(e[r] || 0, t[r] || 0)
    }), n
}

export function hr(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(or) || `{}`),
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
        n[e] = [...i.values()].slice(0, 200), localStorage.setItem(or, JSON.stringify(n))
    } catch {}
}

export function gr(e, t, n, r, i) {
    let a = Math.max(Number(t.coins) || 0, wn(e), n);
    Tn(e, a);
    let o = fr(),
        s = mr(o, t.easyUpgrades ? mr(t.easyUpgrades, r) : mr(o, r));
    return pr(s), hr(e, [...t.inbox || [], ...i, ...Xn(e)]), {
        coins: a,
        easyUpgrades: s,
        inbox: Xn(e)
    }
}
export async function _r() {
    let e = lr();
    try {
        let t = await fetch(`/api/account/link`, {
            method: `GET`,
            headers: cr(),
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
        if (!n.linked || !n.user || !n.playerId) return dr(null), {
            linked: !1,
            playerId: e,
            name: null,
            email: null,
            image: null
        };
        dr(n.playerId);
        let r = gr(n.playerId, n, 0, fr(), Xn(e));
        return hr(n.playerId, Xn(e)), {
            linked: !0,
            playerId: n.playerId,
            name: n.user.name ?? null,
            email: n.user.email ?? null,
            image: n.user.image ?? null,
            coins: r.coins,
            easyUpgrades: r.easyUpgrades,
            inbox: r.inbox
        }
    } catch {
        return {
            linked: !1,
            playerId: e,
            name: null,
            email: null,
            image: null
        }
    }
}
export async function vr() {
    let e = lr(),
        t = wn(e),
        n = fr(),
        r = Xn(e);
    try {
        let res = await fetch(`/api/account/link`, {
            method: `POST`,
            headers: cr(),
            credentials: `include`,
            body: JSON.stringify({
                guestPlayerId: e,
                guestCoins: t,
                easyUpgrades: n,
                inbox: r
            })
        });
        if (res.status === 401) return _r();
        let i = await res.json().catch(() => ({}));
        if (i.playerId) {
            dr(i.playerId);
            let a = gr(i.playerId, i, t, n, r);
            return e !== i.playerId && Tn(e, 0), {
                linked: !0,
                playerId: i.playerId,
                name: i.user?.name ?? null,
                email: null,
                image: null,
                coins: a.coins,
                easyUpgrades: a.easyUpgrades,
                inbox: a.inbox
            }
        }
    } catch {}
    return _r()
}
export async function yr() {
    let e = ur();
    if ((() => {
            try {
                return !!localStorage.getItem(rr)
            } catch {
                return !1
            }
        })()) try {
        await fetch(`/api/account/link`, {
            method: `POST`,
            headers: cr(),
            credentials: `include`,
            body: JSON.stringify({
                guestPlayerId: e,
                guestCoins: 0,
                easyUpgrades: fr(),
                inbox: Xn(e)
            })
        })
    } catch {}
}
export async function br() {
    dr(null);
    try {
        let e = lr();
        localStorage.setItem(`swipe_force_player_v1`, e)
    } catch {}
}
