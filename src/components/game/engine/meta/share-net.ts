// @ts-nocheck
/**
 * JPDOC: シェアAPIの通信。
 */
/** X share intent + continue-coin / mission / inbox network API. */
import { sanitizeUserText } from "./sanitize";
import {
  MISSION_DEFS,
  loadAllMissions,
  addCoins,
  markFanmailSent,
  markMissionDone,
  allMissionsComplete,
  saveAllMissions,
  hasSentFanmail,
  buildShareUrl,
  setCoins,
  isMissionDone,
  newShareId,
  getCoins,
  formatShareProgress,
} from "./player-local";
import { shareProfilePayload } from "@/lib/profile-ui";
import { noteHelpAsked } from "@/lib/player-stats";

export function openShareSheet(e, t = {}) {
    let n = newShareId(),
        r = buildShareUrl(e, n),
        i = formatShareProgress(t),
        prof = {};
    try { prof = shareProfilePayload() || {}; } catch (err) { prof = {}; }
    let who = prof.displayName ? `パイロット「${String(prof.displayName).slice(0, 16)}」が助けを求めています` : ``,
        blurb = prof.shareBlurb ? String(prof.shareBlurb).slice(0, 40) : ``;
    // Clean layout: body → blank → tags → blank → URL
    // Do NOT pass &hashtags= (Twitter appends them after the URL and duplicates).
    let lines = [`SWIPE FORCE`];
    if (who) lines.push(who);
    if (blurb) lines.push(blurb);
    for (const line of String(i || ``).split(`\n`)) {
        if (line !== ``) lines.push(line);
    }
    lines.push(``);
    lines.push(`#SWIPEFORCE #GrokBuild #シューティング #indiegames`);
    lines.push(``);
    lines.push(r);
    let o = lines.join(`\n`),
        s = `https://twitter.com/intent/tweet?text=${encodeURIComponent(o)}`;
    try { noteHelpAsked(); } catch (err) {}
    return window.open(s, `_blank`, `noopener,noreferrer`), n
}
export async function fetchCoinBalance(e) {
    let t = getCoins(e);
    try {
        let n = await fetch(`/api/share/balance?playerId=${encodeURIComponent(e)}`, {
            credentials: `same-origin`
        });
        if (!n.ok) return t;
        let r = await n.json(),
            i = Math.max(0, Number(r.coins) || 0),
            a = Math.max(t, i);
        return setCoins(e, a), a > i && fetch(`/api/share/sync`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            body: JSON.stringify({
                playerId: e,
                coins: a
            })
        }), a
    } catch {
        return t
    }
}
export async function reportMissionClear(e) {
    let {
        sharerId: t,
        shareId: n,
        visitorId: r,
        missionId: i,
        playSeconds: a
    } = e, o = MISSION_DEFS.find(e => e.id === i);
    if (!o) return {
        ok: !1,
        reason: `bad`
    };
    if (!t || !n || t === r) return {
        ok: !1,
        reason: `self`
    };
    if (n.length < 6 || n.startsWith(`leg`)) return {
        ok: !1,
        reason: `share`
    };
    if (a < o.minSec) return {
        ok: !1,
        reason: `too_fast`
    };
    if (isMissionDone(n, i)) return {
        ok: !0,
        already: !0,
        coins: getCoins(t)
    };
    markMissionDone(n, i);
    let s = addCoins(t, o.coins);
    try {
        let e = await fetch(`/api/share/mission`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            body: JSON.stringify({
                sharerId: t,
                shareId: n,
                visitorId: r,
                missionId: i,
                playSeconds: a
            })
        });
        if (!e.ok) {
            // network/HTTP error — keep local credit (local_only)
            return {
                ok: !0,
                reason: `local_only`,
                coins: s
            };
        }
        let body = await e.json().catch(() => ({}));
        if (body.ok === !1 && (body.reason === `self` || body.reason === `too_fast`)) {
            // roll back local: keyed by shareId, not sharerId
            let store = loadAllMissions();
            if (store[n]) {
                delete store[n][i];
                saveAllMissions(store);
            }
            addCoins(t, -o.coins);
            return {
                ok: !1,
                reason: body.reason
            }
        }
        let c = Math.max(s, Number(body.coins) || 0);
        return setCoins(t, c), {
            ok: !0,
            already: !!body.already,
            coins: c
        }
    } catch {
        return {
            ok: !0,
            reason: `local_only`,
            coins: s
        }
    }
}
export async function spendContinueCoin(e) {
    if (getCoins(e) <= 0) return {
        ok: !1,
        coins: 0
    };
    let t = addCoins(e, -1);
    try {
        let n = await fetch(`/api/share/spend`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            body: JSON.stringify({
                playerId: e
            })
        });
        if (n.ok) {
            let r = await n.json();
            if (r.ok === !1) {
                let t = Math.max(0, Number(r.coins) || 0);
                return setCoins(e, t), {
                    ok: !1,
                    coins: t
                }
            }
            let i = Math.min(t, Math.max(0, Number(r.coins) ?? t));
            return setCoins(e, i), {
                ok: !0,
                coins: i
            }
        }
    } catch {}
    return {
        ok: !0,
        coins: t
    }
}

export function canReplyThanks(e) {
    return e ? e.source === `mission` && e.canThanks === !0 && e.thanksSent !== !0 : !1
}

export function normalizeInboxMessage(e) {
    return !e?.id || !e.from || e.body == null || e.body === `` ? null : (e.source === `thanks` || e.kind === `thanks` ? `thanks` : `mission`) == `thanks` ? {
        id: String(e.id),
        from: String(e.from),
        body: String(e.body),
        at: e.at,
        shareId: e.shareId,
        source: `thanks`,
        canThanks: !1,
        thanksSent: !0
    } : {
        id: String(e.id),
        from: String(e.from),
        body: String(e.body),
        at: e.at,
        shareId: e.shareId,
        source: `mission`,
        canThanks: e.canThanks !== !1,
        thanksSent: !!e.thanksSent
    }
}
export var KEY_INBOX_DELETED = `swipe_force_inbox_deleted_v1`,
    KEY_INBOX_HIDDEN = `swipe_force_thanks_sent_v1`;

export function loadIdSet(e) {
    try {
        let t = JSON.parse(localStorage.getItem(e) || `[]`);
        return new Set(t)
    } catch {
        return new Set
    }
}

export function saveIdSet(e, t) {
    try {
        localStorage.setItem(e, JSON.stringify([...t]))
    } catch {}
}

export function loadLocalInbox(e) {
    try {
        let t = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`),
            n = loadIdSet(KEY_INBOX_DELETED),
            r = loadIdSet(KEY_INBOX_HIDDEN);
        return (t[e] || []).map(e => normalizeInboxMessage(e)).filter(e => !!e && !n.has(e.id)).map(e => r.has(e.id) ? {
            ...e,
            thanksSent: !0,
            canThanks: e.canThanks
        } : e)
    } catch {
        return []
    }
}

export function pushLocalInbox(e, t) {
    let n = normalizeInboxMessage(t);
    if (n) try {
        let t = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`);
        t[e] = [n, ...(t[e] || []).filter(e => e.id !== n.id)].slice(0, 200), localStorage.setItem(KEY_MSGS, JSON.stringify(t))
    } catch {}
}

export function removeLocalInbox(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`);
        n[e] = (n[e] || []).filter(e => e.id !== t), localStorage.setItem(KEY_MSGS, JSON.stringify(n));
        let r = loadIdSet(KEY_INBOX_DELETED);
        r.add(t), saveIdSet(KEY_INBOX_DELETED, r)
    } catch {}
}
export async function deleteInboxMessage(e) {
    removeLocalInbox(e.playerId, e.messageId);
    try {
        let t = await fetch(`/api/share/message`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            body: JSON.stringify({
                action: `delete`,
                playerId: e.playerId,
                messageId: e.messageId
            })
        });
        if (!t.ok) return {
            ok: !0,
            reason: `local_only`
        };
        let n = await t.json();
        return n.ok === !1 ? {
            ok: !1,
            reason: n.reason
        } : {
            ok: !0
        }
    } catch {
        return {
            ok: !0,
            reason: `local_only`
        }
    }
}
export async function sendThanksReply(e) {
    let t = sanitizeUserText(e.text);
    if (!t.ok) return {
        ok: !1,
        reason: t.reason
    };
    let n = loadLocalInbox(e.playerId).find(t => t.id === e.messageId);
    if (n && !canReplyThanks(n)) return {
        ok: !1,
        reason: n.thanksSent ? `already` : `not_mission`
    };
    if (loadIdSet(KEY_INBOX_HIDDEN).has(e.messageId)) return {
        ok: !1,
        reason: `already`
    };
    try {
        let n = await fetch(`/api/share/message`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            body: JSON.stringify({
                action: `thanks`,
                playerId: e.playerId,
                messageId: e.messageId,
                text: t.text
            })
        });
        if (n.ok) {
            let r = await n.json();
            if (r.ok === !1) {
                if (r.reason === `already`) {
                    let t = loadIdSet(KEY_INBOX_HIDDEN);
                    t.add(e.messageId), saveIdSet(KEY_INBOX_HIDDEN, t)
                }
                return {
                    ok: !1,
                    reason: r.reason
                }
            }
            let i = loadIdSet(KEY_INBOX_HIDDEN);
            i.add(e.messageId), saveIdSet(KEY_INBOX_HIDDEN, i);
            try {
                let n = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`),
                    i = n[e.playerId] || [];
                n[e.playerId] = i.map(e => normalizeInboxMessage(e)).filter(e => !!e).map(t => t.id === e.messageId ? {
                    ...t,
                    thanksSent: !0,
                    canThanks: !0,
                    source: `mission`
                } : t), localStorage.setItem(KEY_MSGS, JSON.stringify(n)), r.to && pushLocalInbox(r.to, {
                    id: `tlocal-${e.messageId}`,
                    from: e.playerId,
                    body: t.text,
                    at: new Date().toISOString(),
                    source: `thanks`,
                    canThanks: !1,
                    thanksSent: !0
                })
            } catch {}
            return {
                ok: !0
            }
        }
        return {
            ok: !1,
            reason: `net`
        }
    } catch {
        return {
            ok: !1,
            reason: `net`
        }
    }
}
export async function sendFanmailMessage(e) {
    let t = sanitizeUserText(e.text);
    if (!t.ok) return {
        ok: !1,
        reason: t.reason
    };
    let n = t.text;
    if (!e.shareId) return {
        ok: !1,
        reason: `share`
    };
    if (!allMissionsComplete(e.shareId)) return {
        ok: !1,
        reason: `missions`
    };
    if (e.sharerId === e.visitorId) return {
        ok: !1,
        reason: `self`
    };
    if (hasSentFanmail(e.shareId, e.visitorId)) return {
        ok: !1,
        reason: `already`
    };
    let r = {
        id: `flocal-${e.shareId}-${e.visitorId}`,
        from: e.visitorId,
        body: n,
        at: new Date().toISOString(),
        shareId: e.shareId,
        source: `mission`,
        canThanks: !0,
        thanksSent: !1
    };
    try {
        let t = await fetch(`/api/share/message`, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`
            },
            body: JSON.stringify({
                action: `fan`,
                sharerId: e.sharerId,
                shareId: e.shareId,
                visitorId: e.visitorId,
                text: n
            })
        });
        if (t.ok) {
            let n = await t.json();
            return n.ok === !1 ? (n.reason === `already` && markFanmailSent(e.shareId, e.visitorId), {
                ok: !1,
                reason: n.reason
            }) : (markFanmailSent(e.shareId, e.visitorId), pushLocalInbox(e.sharerId, r), {
                ok: !0
            })
        }
        return markFanmailSent(e.shareId, e.visitorId), pushLocalInbox(e.sharerId, r), {
            ok: !0,
            reason: `local_only`
        }
    } catch {
        return markFanmailSent(e.shareId, e.visitorId), pushLocalInbox(e.sharerId, r), {
            ok: !0,
            reason: `local_only`
        }
    }
}
export async function fetchInboxMessages(e) {
    let t = loadLocalInbox(e),
        n = loadIdSet(KEY_INBOX_DELETED),
        r = loadIdSet(KEY_INBOX_HIDDEN);
    try {
        let i = await fetch(`/api/share/message?playerId=${encodeURIComponent(e)}`);
        if (!i.ok) return t;
        let a = ((await i.json()).messages || []).map(e => normalizeInboxMessage(e)).filter(e => !!e && !n.has(e.id)),
            o = new Map;
        for (let e of t) o.set(e.id, e);
        for (let e of a) {
            let t = o.get(e.id),
                n = normalizeInboxMessage({
                    ...t,
                    ...e,
                    thanksSent: e.thanksSent || r.has(e.id) || t?.thanksSent
                });
            n && o.set(e.id, n)
        }
        try {
            let t = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`);
            t[e] = [...o.values()], localStorage.setItem(KEY_MSGS, JSON.stringify(t))
        } catch {}
        return [...o.values()]
    } catch {
        return t
    }
}

// ── Account link / cloud save (split) ──
export {
  KEY_LINKED_PLAYER,
  KEY_LOCAL_PLAYER,
  KEY_EASY_CLOUD,
  KEY_CLOUD_INBOX,
  EMPTY_EASY_UPGRADES,
  authHeaders,
  ensureLocalPlayerId,
  loadPlayerId,
  setLinkedPlayerId,
  loadEasyUpgradesCloud,
  saveEasyUpgradesCloud,
  mergeEasyUpgrades,
  mergeInboxMessages,
  applyCloudSnapshot,
  fetchAccountGet,
  linkAccountPost,
  syncAccountCloud,
  unlinkAccountLocal,
} from "./account-cloud";
