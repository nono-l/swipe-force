// @ts-nocheck
/** Message / profile text sanitizers (recovered). */

export var SHARE_TEXT_MAX = 40,
    LONG_TEXT_MAX = 2e3,
    RE_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF]/,
    RE_UNSAFE_CHARS = /[<>&"'`\\/]/,
    RE_SQLISH = /(--|\/\*|\*\/|;|\||\x00)/,
    RE_SQL_KEYWORDS = /\b(union|select|insert|update|delete|drop|alter|create|truncate|exec|execute|script|javascript|onerror|onload|eval)\b/i,
    RE_BIDI_INVISIBLE = /[\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD]/g,
    RE_EMOJI = /\p{Extended_Pictographic}/u;

export function isEmojiModifier(e) {
    return e === 8205 || e === 65039 || e === 8419 || e >= 127995 && e <= 127999 || e >= 127462 && e <= 127487 || e >= 917536 && e <= 917631
}

export function isAllowedChar(e) {
    let t = e.codePointAt(0) ?? 0;
    return !!(t === 32 || t >= 48 && t <= 57 || t >= 65 && t <= 90 || t >= 97 && t <= 122 || t === 12288 || t === 33 || t === 63 || t === 46 || t === 44 || t === 40 || t === 41 || t === 126 || t === 12289 || t === 12290 || t === 12539 || t === 12540 || t === 12316 || t === 65374 || t === 8230 || t === 65281 || t === 65311 || t === 12300 || t === 12301 || t === 12302 || t === 12303 || t === 65288 || t === 65289 || t >= 12353 && t <= 12438 || t === 12445 || t === 12446 || t === 12540 || t >= 12449 && t <= 12538 || t === 12541 || t === 12542 || t >= 65382 && t <= 65437 || t >= 19968 && t <= 40959 || t >= 13312 && t <= 19903 || t === 12293 || t === 12347 || isEmojiModifier(t) || RE_EMOJI.test(e) || t >= 9728 && t <= 9983 || t >= 9984 && t <= 10175)
}

export function graphemeLength(e, t) {
    try {
        if (typeof Intl < `u` && `Segmenter` in Intl) {
            let n = new Intl.Segmenter(void 0, {
                    granularity: `grapheme`
                }),
                r = ``,
                i = 0;
            for (let {
                    segment: a
                }
                of n.segment(e)) {
                if (i >= t) break;
                r += a, i += 1
            }
            return r
        }
    } catch {}
    return [...e].slice(0, t).join(``)
}

export function sanitizeUserText(e) {
    return sanitizeTextCore(e, SHARE_TEXT_MAX, 400, !1)
}

export function sanitizeLongText(e) {
    return sanitizeTextCore(e, LONG_TEXT_MAX, 16e3, !0)
}

export function sanitizeTextCore(e, t, n, r) {
    if (typeof e != `string`) return {
        ok: !1,
        reason: `type`
    };
    if (e.length > n) return {
        ok: !1,
        reason: `long`
    };
    if (e.includes(`\0`) || e.includes(`\0`)) return {
        ok: !1,
        reason: `null`
    };
    if (RE_CONTROL_CHARS.test(e)) return {
        ok: !1,
        reason: `control`
    };
    if (RE_UNSAFE_CHARS.test(e)) return {
        ok: !1,
        reason: `html`
    };
    if (RE_SQLISH.test(e) || RE_SQL_KEYWORDS.test(e)) return {
        ok: !1,
        reason: `sql`
    };
    let i = e.normalize(`NFC`);
    if (i = i.replace(RE_BIDI_INVISIBLE, ``), r) i = i.replace(/\r\n/g, `
`).replace(/\r/g, `
`).replace(/\t/g, ` `), i = i.replace(/\n{3,}/g, `

`);
    else if (/[\r\n\t]/.test(i)) return {
        ok: !1,
        reason: `control`
    };
    if (r) {
        let e = i.split(`
`),
            n = [];
        for (let t of e) {
            let e = [...t].filter(isAllowedChar).join(``);
            if (e !== [...t].join(``)) return {
                ok: !1,
                reason: `unsafe`
            };
            n.push(e)
        }
        let r = graphemeLength(n.join(`
`).trim(), t);
        return r = r.split(`
`).map(e => e.trimEnd()).join(`
`).trim(), !r || !/[\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff]/u.test(r) && !RE_EMOJI.test(r) && !/[\u2600-\u27bf]/u.test(r) ? {
            ok: !1,
            reason: `empty`
        } : {
            ok: !0,
            text: r
        }
    }
    let a = [...i].filter(isAllowedChar).join(``);
    if (a !== [...i].join(``)) return {
        ok: !1,
        reason: `unsafe`
    };
    let o = graphemeLength(a.trim(), t);
    return !o || !/[\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff]/u.test(o) && !RE_EMOJI.test(o) && !/[\u2600-\u27bf]/u.test(o) ? {
        ok: !1,
        reason: `empty`
    } : {
        ok: !0,
        text: o
    }
}

export function sanitizeReasonText(e) {
    switch (e) {
        case `html`:
            return `HTML記号は使えません`;
        case `sql`:
            return `使えない文字・語句があります`;
        case `control`:
        case `null`:
            return `制御文字は使えません`;
        case `unsafe`:
            return `使用できない文字が含まれています`;
        case `empty`:
            return `メッセージを入力してください`;
        case `long`:
            return `長すぎます（上限を超えています）`;
        case `url`:
            return `URLが正しくありません（httpsのみ）`;
        case `url_limit`:
            return `URLは20件までです`;
        default:
            return `入力内容を確認してください`
    }
}
export var MAX_URL_COUNT = 20,
    MAX_URL_LEN = 500;

export function sanitizeUrlList(e) {
    if (e == null) return {
        ok: !0,
        urls: []
    };
    if (!Array.isArray(e)) return {
        ok: !1,
        reason: `type`
    };
    if (e.length > MAX_URL_COUNT) return {
        ok: !1,
        reason: `url_limit`
    };
    let t = [];
    for (let n of e) {
        if (typeof n != `string`) return {
            ok: !1,
            reason: `url`
        };
        let e = n.trim();
        if (!e) continue;
        if (e.length > MAX_URL_LEN || /[\u0000-\u001F\u007F<>"'`]/.test(e)) return {
            ok: !1,
            reason: `url`
        };
        let r;
        try {
            r = new URL(e)
        } catch {
            return {
                ok: !1,
                reason: `url`
            }
        }
        if (r.protocol !== `https:` && r.protocol !== `http:` || r.username || r.password || (!r.hostname || r.hostname.includes(` `) || r.hostname === `localhost`) && r.hostname !== `localhost` && r.hostname !== `127.0.0.1` && !/^[a-z0-9.-]+$/i.test(r.hostname)) return {
            ok: !1,
            reason: `url`
        };
        let i = r.toString();
        if (t.includes(i) || t.push(i), t.length > MAX_URL_COUNT) return {
            ok: !1,
            reason: `url_limit`
        }
    }
    return {
        ok: !0,
        urls: t
    }
}

export function normalizeCommentKind(e) {
    return e === `arrange` || e === `cover` || e === `note` ? e : `note`
}
export var KEY_SOUND_COMMENTS = `swipe_force_sound_comments_v2`;

export function makeTrackKey(e, t = 0) {
    return e === `title` ? `title` : `${e}:${t}`
}

export function loadLocalCommentsStore() {
    try {
        return JSON.parse(localStorage.getItem(KEY_SOUND_COMMENTS) || `{}`)
    } catch {
        return {}
    }
}

export function saveLocalCommentsStore(e) {
    try {
        localStorage.setItem(KEY_SOUND_COMMENTS, JSON.stringify(e))
    } catch {}
}

export function getLocalTrackComments(e) {
    return loadLocalCommentsStore()[e] || []
}

export function cacheLocalComment(e, t) {
    let n = loadLocalCommentsStore(),
        r = n[e] || [];
    r.some(e => e.id === t.id) || (n[e] = [t, ...r].slice(0, 50), saveLocalCommentsStore(n))
}

export function mergeTrackComments(e, t) {
    let n = new Map;
    for (let r of [...e, ...t]) r?.id && n.set(r.id, {
        ...r,
        urls: Array.isArray(r.urls) ? r.urls : [],
        kind: r.kind || `note`
    });
    return [...n.values()].sort((e, t) => (t.at || ``).localeCompare(e.at || ``)).slice(0, 50)
}
export async function fetchTrackComments(e) {
    let t = getLocalTrackComments(e);
    try {
        let n = await fetch(`/api/sound/comments?track=${encodeURIComponent(e)}`, {
            credentials: `same-origin`
        });
        if (!n.ok) return t;
        let r = await n.json(),
            i = mergeTrackComments(t, Array.isArray(r.comments) ? r.comments : []),
            a = loadLocalCommentsStore();
        return a[e] = i, saveLocalCommentsStore(a), i
    } catch {
        return t
    }
}
export async function postTrackComment(e, t, n, r = [], i = `note`) {
    let a = normalizeCommentKind(i),
        o = sanitizeUrlList(r);
    if (!o.ok) return {
        ok: !1,
        reason: o.reason
    };
    let s = ``;
    if (n.trim()) {
        let e = sanitizeLongText(n);
        if (!e.ok) return {
            ok: !1,
            reason: e.reason
        };
        s = e.text
    }
    if (!s && o.urls.length === 0) return {
        ok: !1,
        reason: `empty`
    };
    try {
        let n = await fetch(`/api/sound/comments`, {
                method: `POST`,
                headers: {
                    "Content-Type": `application/json`
                },
                credentials: `same-origin`,
                body: JSON.stringify({
                    track: e,
                    playerId: t,
                    body: s || ` `,
                    urls: o.urls,
                    kind: a
                })
            }),
            r = await n.json();
        return r.comment ? (cacheLocalComment(e, r.comment), {
            ok: !0,
            comment: r.comment
        }) : n.ok ? {
            ok: !!r.ok,
            reason: r.reason
        } : {
            ok: !1,
            reason: r.reason || (n.status === 401 ? `link_required` : `fail`)
        }
    } catch {
        return {
            ok: !1,
            reason: `link_required`
        }
    }
}

