// @ts-nocheck
import { bossThemeMeta, BOSS_ACTS } from "./boss-themes";
/**
 * Recovered audio engine (SFX + BGM) — single module so shared mute/gain state stays consistent.
 * Prefer importing via ./sfx or ./bgm facades for clarity.
 */

/** AudioContext */
export let c = null;
/** master GainNode */
export let l = null;
/** muted */
export let u = false;
/** master vol 0..1 */
export let d = 1;
/** bgm vol 0..1 */
export let f = 0.85;
/** sfx vol 0..1 */
export let p = 1;
/** base scale */
export let m = 0.38;
/** one-shot throttle map */
export let h = {};

// ── throttle / rate-limit ──
export function g(e, t) {
    let n = performance.now();
    return n - (h[e] ?? 0) < t ? !1 : (h[e] = n, !0)
}


// ── Web Audio context ──
export function _() {
    if (typeof window > `u`) return null;
    if (!c) {
        let e = window.AudioContext || window.webkitAudioContext;
        if (!e) return null;
        c = new e, l = c.createGain(), l.gain.value = u ? 0 : m * d, l.connect(c.destination)
    }
    return c
}

export function v() {
    return _(), l
}

export function ee() {
    let e = _();
    if (!e) return;
    try {
        let t = e.createBuffer(1, 1, 22050),
            n = e.createBufferSource();
        n.buffer = t, n.connect(e.destination), n.start(0)
    } catch {}
    let t = () => {
        if (y(), !u && T !== `off`) {
            U();
            try {
                pt()
            } catch {
                H()
            }
        }
    };
    e.state === `suspended` || e.state === `interrupted` ? e.resume().then(() => t()).catch(() => {}) : t()
}

export function y() {
    if (!l) return;
    let e = _(),
        t = u ? 0 : m * Math.max(0, Math.min(1, d));
    e ? l.gain.setTargetAtTime(t, e.currentTime, .02) : l.gain.value = t
}

export function te(e) {
    u = e, y(), e ? U() : T !== `off` && (U(), pt())
}

export function ne() {
    return te(!u), u
}

export function re(e) {
    d = Math.max(0, Math.min(1, e)), y()
}

export function ie(e) {
    f = Math.max(0, Math.min(1, e))
}

export function ae(e) {
    p = Math.max(0, Math.min(1, e))
}

export function oe(e, t, n, r, i) {
    let a = e.createGain(),
        o = e.currentTime;
    return a.gain.setValueAtTime(1e-4, o), a.gain.exponentialRampToValueAtTime(Math.max(1e-4, n), o + Math.max(.001, r)), a.gain.exponentialRampToValueAtTime(1e-4, o + r + i), a.connect(t), a
}

export function b(e, t, n = `square`, r = .12, i, a = `sfx`) {
    if (u) return;
    let o = _(),
        s = v();
    if (!o || !s) return;
    if (o.state === `suspended`) {
        o.resume();
        return
    }
    let c = a === `bgm` ? f : p;
    if (c <= .001) return;
    let l = o.currentTime,
        d = o.createOscillator();
    d.type = n, d.frequency.setValueAtTime(Math.max(20, e), l), i != null && d.frequency.exponentialRampToValueAtTime(Math.max(20, i), l + t);
    let m = oe(o, s, r * c, .002, t);
    d.connect(m), d.start(l), d.stop(l + t + .03)
}

export function x(e, t = .15, n = 4e3, r = `sfx`) {
    if (u) return;
    let i = _(),
        a = v();
    if (!i || !a) return;
    if (i.state === `suspended`) {
        i.resume();
        return
    }
    let o = r === `bgm` ? f : p;
    if (o <= .001) return;
    t *= o;
    let s = Math.max(1, Math.floor(i.sampleRate * e)),
        c = i.createBuffer(1, s, i.sampleRate),
        l = c.getChannelData(0);
    for (let e = 0; e < s; e++) l[e] = Math.random() * 2 - 1;
    let d = i.createBufferSource();
    d.buffer = c;
    let m = i.createBiquadFilter();
    m.type = `lowpass`, m.frequency.setValueAtTime(n, i.currentTime), m.frequency.exponentialRampToValueAtTime(Math.max(80, n * .15), i.currentTime + e);
    let h = oe(i, a, t, .001, e);
    d.connect(m), m.connect(h), d.start(), d.stop(i.currentTime + e + .02)
}

export function S(e) {
    return 440 * 2 ** ((e - 69) / 12)
}

export function se() {
    g(`shoot`, 40) && b(880, .04, `square`, .07, 520)
}

export function ce() {
    g(`missile`, 70) && (b(200, .1, `square`, .09, 80), b(400, .06, `square`, .05, 150))
}

export function le() {
    g(`particle`, 80) && (b(1200, .08, `sawtooth`, .08, 400), b(600, .1, `square`, .05))
}

export function ue() {
    g(`lock`, 60) && b(500, .04, `square`, .06, 1400)
}

export function de() {
    g(`hit`, 28) && b(300, .03, `square`, .05, 120)
}

export function fe(e = !1) {
    g(e ? `xbig` : `xsm`, e ? 70 : 35) && (x(e ? .28 : .12, e ? .22 : .12, e ? 2200 : 1400), e && b(100, .2, `triangle`, .1, 40))
}

export function pe() {
    g(`phit`, 90) && (x(.16, .2, 900), b(180, .15, `square`, .1, 50))
}

export function me() {
    g(`boss`, 400) && (b(220, .12, `square`, .12), setTimeout(() => b(220, .12, `square`, .12), 140), setTimeout(() => b(160, .2, `square`, .14, 90), 280))
}

export function he() {
    g(`clear`, 500) && [523, 659, 784, 1046, 1318].forEach((e, t) => {
        setTimeout(() => b(e, .1, `square`, .1), t * 70)
    })
}

export function ge() {
    g(`go`, 500) && (b(400, .15, `square`, .1, 200), setTimeout(() => b(250, .2, `square`, .1, 120), 150), setTimeout(() => b(120, .35, `triangle`, .12, 55), 320))
}

export function _e() {
    g(`buy`, 70) && (b(660, .05, `square`, .08), setTimeout(() => b(990, .07, `square`, .09), 45))
}

export function C() {
    g(`buyfail`, 90) && b(160, .08, `square`, .08, 90)
}

export function w() {
    g(`ui`, 45) && b(520, .03, `square`, .05)
}


// ── SFX one-shots ──
export function ve() {
    g(`start`, 300) && [440, 554, 659, 880].forEach((e, t) => {
        setTimeout(() => b(e, .08, `square`, .09), t * 60)
    })
}
export var T = `off`,
    ye = 0,
    be = 1,
    xe = 0,
    Se = null,
    Ce = [
        [0, 2, 3, 5, 7, 8, 10],
        [0, 2, 3, 5, 7, 8, 11],
        [0, 2, 4, 5, 7, 9, 10],
        [0, 2, 3, 5, 7, 9, 10],
        [0, 1, 3, 5, 7, 8, 10],
        [0, 2, 4, 5, 7, 9, 11],
        [0, 2, 4, 6, 7, 9, 11],
        [0, 2, 3, 5, 6, 8, 10]
    ];

export function we(e) {
    let t = (e >>> 0) + 1831565813;
    return () => (t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / 4294967296)
}
export var Te = [
        [0, 2, 4, 5, 4, 2, 0, -1, 5, 4, 2, 0, 2, 4, 5, 7],
        [0, -1, 0, 3, 5, -1, 7, 5, 4, 2, 0, 2, 4, -1, 5, 4],
        [4, 5, 7, 5, 4, 2, 0, -1, 0, 2, 4, 5, 7, 9, 7, 5],
        [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 0, 0, -1, -1],
        [7, 5, 4, 2, 0, 2, 4, 5, 4, -1, 2, 0, -1, 2, 4, 0],
        [0, 2, -1, 5, 4, 2, 0, 5, 7, 5, 4, 2, 0, -1, 4, 5],
        [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 1, 3],
        [5, 4, 2, 0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, -1]
    ],
    Ee = [
        [0, 5, 3, 4],
        [0, 3, 4, 0],
        [0, 4, 5, 3],
        [0, 5, 0, 4],
        [0, 2, 3, 4],
        [5, 4, 0, 3],
        [0, 3, 0, 5],
        [0, 4, 0, 5]
    ];

export function De(e, t) {
    let n = ((Math.max(1, e) - 1) % 64 + 64) % 64,
        r = we(n * 7919 + (t ? 4242 : 17) + ye * 99),
        i = Ce[(n + (t ? ye : 0)) % Ce.length],
        a = [45, 47, 48, 50, 52, 53, 55, 57],
        o = a[n % a.length] - (t ? 2 : 0),
        s = Ee[n % Ee.length].slice();
    t && (s = [0, 0, 3, 4, 0, 5, 4, 0]);
    let c = Te[n % Te.length],
        l = Te[(n * 3 + 1) % Te.length],
        u = [...c, ...l];
    for (let e = 0; e < u.length; e++) r() > .85 && u[e] >= 0 && (u[e] = Math.max(0, Math.min(i.length + 1, u[e] + (r() > .5 ? 1 : -1)))), t && e % 8 == 7 && (u[e] = -1);
    let d = 70 + n % 16 * 3 + n * 5 % 7;
    t && (d = 85 + ye * 4 + n % 5 * 2), !t && n % 5 == 0 && (d = 72 + n % 8 * 2);
    let f = t ? (n + 3) % 6 : (n * 2 + 1) % 6,
        p = !t && n % 4 == 0 || n % 3 == 0 ? `triangle` : `square`;
    return {
        tonic: o,
        scale: i,
        prog: s,
        lead: u,
        tempo: Math.max(68, Math.min(135, d)),
        arpStyle: (n * 3 + ye) % 4,
        drum: f,
        leadDuty: p,
        style: t ? `legacy` : `chip`,
        counter: u.map((e, t) => t % 2 == 0 ? e : -1)
    }
}
export var E = [
        [0, 2, 3, 5, 7, 8, 10],
        [0, 2, 3, 5, 7, 8, 11],
        [0, 2, 4, 5, 7, 9, 11],
        [0, 2, 3, 5, 7, 9, 10],
        [0, 2, 4, 5, 7, 8, 11]
    ],
    Oe = [
        [0, 3, 4, 0],
        [0, 4, 0, 5, 3, 4, 0, 0],
        [0, 5, 3, 4, 0, 3, 4, 0],
        [0, 2, 5, 4, 0, 3, 4, 0],
        [0, 3, 0, 4, 5, 4, 0, 0],
        [4, 0, 5, 3, 4, 0, 4, 0],
        [0, 4, 5, 3, 0, 5, 4, 0],
        [0, 3, 4, 5, 3, 4, 0, 0]
    ],
    ke = [
        [0, 2, 4, 5, 4, 2, 0, -1, 5, 4, 2, 0, 2, 4, 7, 5],
        [0, -1, 0, 2, 3, 5, 7, 5, 3, 2, 0, 2, 5, 4, 2, 0],
        [4, 2, 0, 2, 4, 5, 7, -1, 7, 5, 4, 2, 0, 2, 4, 0],
        [0, 0, 2, 4, -1, 5, 4, 2, 0, 3, 2, 0, -1, 4, 5, 7],
        [7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0, -1, 0, 2, 4, 5],
        [0, 3, 5, 7, 5, 3, 0, -1, 2, 4, 5, 7, 9, 7, 5, 4],
        [0, 2, -1, 4, 5, 4, 2, 0, 5, 7, 5, 4, 2, 0, -1, 0],
        [2, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 3, 5, 4, 2, 0],
        [0, 7, 5, 4, 2, 0, -1, 2, 4, 5, 7, -1, 5, 4, 2, 0],
        [0, 0, 0, 2, 4, 4, 5, 5, 7, 5, 4, 2, 0, -1, -1, 0],
        [5, 4, 2, 0, -1, -1, 0, 2, 4, 7, 5, 4, 2, 0, 2, 4],
        [0, 4, 7, 4, 0, 5, 9, 5, 0, 4, 7, 11, 7, 4, 0, -1],
        [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 1, 3],
        [7, 7, 5, 5, 4, 4, 2, 0, 2, 4, 5, 7, -1, 5, 4, 2],
        [0, 2, 4, -1, 7, 5, -1, 4, 2, 0, 2, 4, 5, -1, 7, 5],
        [4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 0, -1, 4, 5, 4, 0]
    ],
    /** @deprecated use BOSS_ACTS from boss-themes */
    Ae = BOSS_ACTS;

export function D(e) {
    return bossThemeMeta(e);
}

export function je(e) {
    return e.map(e => e < 0 ? -1 : Math.max(0, 7 - e))
}
export var Me = [
        [0, -1, 2, 4, 7, -1, 5, 4, 2, 0, -1, 5, 7, 5, 4, 2],
        [0, 1, 3, -1, 5, 3, 1, 0, -1, 7, 5, 4, 2, -1, 0, 2],
        [0, 4, -1, 2, 7, 4, -1, 0, 5, -1, 4, 2, 5, 7, -1, 4],
        [0, -1, -1, 4, 7, -1, 5, 4, -1, 2, 0, -1, 5, 4, 2, 0]
    ],
    Ne = [
        [4, 2, 0, -1, 2, 4, 5, 4, 2, -1, 0, 2, 4, -1, 2, 0],
        [5, 3, 1, 0, -1, 1, 3, 5, 3, -1, 1, 0, 2, 3, -1, 0],
        [7, 5, 4, 2, -1, 4, 2, 0, 2, 4, -1, 5, 4, 2, 0, -1],
        [2, 0, -1, 4, 2, 0, -1, 5, 4, 2, 0, -1, 4, 5, 4, 2]
    ];

export function O(e, t) {
    let n = Math.max(1, Math.min(64, e | 0)),
        r = Math.floor((n - 1) / 16) % 4,
        i = E[+(r % 2 == 0)],
        a = [47, 50, 45, 52],
        o = [118, 108, 100, 92],
        s = Me[r].slice(),
        c = s.map(e => e < 0 ? -1 : e + 4),
        l = Ne[r].slice(),
        u = [...s, ...c],
        d = [...Array(s.length).fill(-1), ...l];
    return {
        tonic: a[r],
        scale: i,
        prog: [0, 0, 4, 0, 0, 3, 4, 0],
        lead: u,
        counter: d,
        tempo: o[r],
        arpStyle: 0,
        drum: 11,
        leadDuty: `triangle`,
        style: `baroque`,
        story: t.title,
        fugue: !0,
        fugueSubject: s,
        arr: n - 1,
        bassMode: 0,
        leadMode: 2,
        gtrMode: 0,
        brassMode: 0,
        leadEvery: 1,
        leadOct: 12,
        gtrOct: 12,
        brassOct: 0,
        chordTicks: 16,
        leadPeak: .1
    }
}

export function Pe(e, t, n) {
    let r = e.slice();
    for (; r.length < 32;) r.push(...e);
    let i = r.slice(0, 32),
        a = 4 + n % 5;
    for (let e = 0; e < i.length; e++) {
        if (e % a === a - 1 && t() > .35) {
            i[e] = -1;
            continue
        }
        if (!(i[e] < 0)) {
            if (t() > .55) {
                let t = (n * 3 + e * 7) % 5 - 2;
                i[e] = Math.max(0, Math.min(11, i[e] + t))
            }
            t() > .9 && (i[e] = Math.min(12, i[e] + 7))
        }
    }
    if (n % 3 == 0)
        for (let e = 1; e < i.length; e += 4) i[e] = -1;
    else if (n % 3 == 1)
        for (let e = 0; e < i.length; e += 8) i[e] >= 0 && (i[e] = (i[e] + 2) % 8);
    return i
}

export function Fe(e, t) {
    let n = Math.max(1, Math.min(64, e | 0)),
        r = Math.floor((n - 1) / 16) % 4,
        i = [
            [0, 2, 3, 5, 7, 8, 10],
            [0, 2, 4, 5, 7, 9, 11],
            [0, 2, 3, 5, 7, 8, 11],
            [0, 2, 4, 5, 7, 9, 10]
        ][r],
        a = [48, 50, 47, 52],
        o = [114, 108, 100, 118],
        s = [
            [0, 0, 0, 0, 2, 2, 0, -1, 0, 0, 3, 3, 5, 5, 4, 4, 0, 0, 0, 2, 4, 5, 7, 5, 4, 4, 2, 0, 0, 0, 4, 5],
            [0, 2, 4, 4, 5, 5, 7, -1, 5, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2, 0, 0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 0],
            [0, 0, 3, 3, 5, 5, 7, 7, 5, 5, 3, 3, 0, -1, 4, 4, 0, 0, 3, 5, 7, 8, 7, 5, 4, 4, 2, 0, 0, 4, 5, 7],
            [0, 4, 7, 7, 5, 5, 4, -1, 0, 2, 4, 5, 7, 9, 7, 5, 4, 4, 2, 0, 5, 5, 7, 7, 9, 7, 5, 4, 2, 0, 0, 0]
        ][r].slice(),
        c = s.map(e => e < 0 ? -1 : e + 2);
    return {
        tonic: a[r],
        scale: i,
        prog: [
            [0, 0, 3, 4, 0, 5, 4, 0],
            [0, 4, 5, 0, 3, 4, 0, 0],
            [0, 0, 5, 4, 0, 3, 4, 0],
            [0, 5, 4, 0, 4, 5, 0, 0]
        ][r],
        lead: s,
        counter: c,
        tempo: o[r],
        arpStyle: 0,
        drum: 43,
        leadDuty: `triangle`,
        style: `baroque`,
        story: t.title,
        choir: !0,
        whistle: !1,
        canon: !1,
        organ: !1,
        fugue: !1,
        arr: n - 1,
        bassMode: 0,
        leadMode: 0,
        gtrMode: 0,
        brassMode: 0,
        leadEvery: 2,
        leadOct: 0,
        gtrOct: 12,
        brassOct: 0,
        chordTicks: 8,
        leadPeak: .065
    }
}

export function Ie(e, t) {
    let n = Math.max(1, Math.min(64, e | 0)),
        r = Math.floor((n - 1) / 16) % 4,
        i = [
            [0, 2, 4, 7, 9],
            [0, 2, 5, 7, 9],
            [0, 3, 5, 7, 10],
            [0, 2, 4, 5, 7, 9]
        ][r],
        a = [60, 62, 57, 64],
        o = [118, 124, 110, 128],
        s = [
            [0, 2, 4, 2, 0, -1, 4, 2, 0, 0, 2, 4, 7, 4, 2, 0, 0, 2, 4, 4, 2, 0, -1, 2, 4, 7, 4, 2, 0, 0, 2, 0],
            [0, 0, 2, 5, 5, 2, 0, -1, 5, 4, 2, 0, 2, 5, 7, 5, 0, 2, 5, 5, 2, 0, -1, 0, 2, 4, 5, 2, 0, 0, 2, 0],
            [0, 3, 5, 3, 0, -1, 5, 3, 0, 0, 3, 5, 7, 5, 3, 0, 5, 5, 3, 0, -1, 3, 5, 7, 5, 3, 0, 0, 3, 5, 3, 0],
            [0, 2, 4, 5, 4, 2, 0, -1, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, -1, 0, 2, 4, 5, 4, 2, 0, 2, 0, 0, 0]
        ][r].slice(),
        c = je(s).map(e => e < 0 ? -1 : e);
    return {
        tonic: a[r],
        scale: i,
        prog: [
            [0, 0, 4, 0, 5, 4, 0, 0],
            [0, 2, 0, 4, 0, 5, 4, 0],
            [0, 0, 3, 0, 5, 3, 0, 0],
            [0, 4, 0, 5, 0, 4, 0, 0]
        ][r],
        lead: s,
        counter: c,
        tempo: o[r],
        arpStyle: 0,
        drum: 42,
        leadDuty: `triangle`,
        style: `baroque`,
        story: t.title,
        whistle: !0,
        canon: !1,
        organ: !1,
        fugue: !1,
        arr: n - 1,
        bassMode: 3,
        leadMode: 0,
        gtrMode: 0,
        brassMode: 0,
        leadEvery: 2,
        leadOct: 12,
        gtrOct: 12,
        brassOct: 0,
        chordTicks: 8,
        leadPeak: .07
    }
}

export function k(e, t) {
    let n = Math.max(1, Math.min(64, e | 0)),
        r = Math.floor((n - 1) / 16) % 4,
        i = [
            [0, 2, 3, 5, 7, 8, 10],
            [0, 2, 3, 5, 7, 9, 10],
            [0, 2, 3, 5, 7, 8, 11],
            [0, 1, 3, 5, 7, 8, 10]
        ][r],
        a = [45, 47, 48, 50],
        o = [108, 100, 96, 112],
        s = [4, 6, 8, 5],
        c = [
            [0, 2, 4, 2, 0, -1, 4, 5, 7, 5, 4, 2, 0, 2, 4, 0, 5, 4, 2, 0, -1, 2, 4, 5, 4, 2, 0, 0, 2, 4, 2, 0],
            [0, 0, 2, 3, 5, 3, 2, 0, 4, 5, 7, 5, 4, 2, 0, -1, 0, 2, 4, 5, 4, 2, 0, 2, 5, 4, 2, 0, -1, 0, 2, 0],
            [4, 2, 0, 2, 4, 5, 4, 2, 0, -1, 0, 2, 4, 7, 5, 4, 2, 0, 2, 4, 5, -1, 4, 2, 0, 0, 2, 3, 5, 3, 2, 0],
            [0, 3, 5, 7, 5, 3, 0, -1, 2, 0, 2, 4, 5, 4, 2, 0, 5, 7, 5, 4, 2, 0, -1, 2, 4, 5, 4, 2, 0, 2, 0, 0]
        ][r].slice(),
        l = c.slice();
    return {
        tonic: a[r],
        scale: i,
        prog: [
            [0, 0, 3, 4, 0, 5, 4, 0],
            [0, 5, 3, 4, 0, 0, 4, 0],
            [0, 3, 0, 4, 5, 4, 0, 0],
            [0, 2, 3, 4, 0, 5, 4, 0]
        ][r],
        lead: c,
        counter: l,
        tempo: o[r],
        arpStyle: 0,
        drum: 41,
        leadDuty: `square`,
        style: `baroque`,
        story: t.title,
        canon: !0,
        organ: !1,
        fugue: !1,
        arr: n - 1,
        bassMode: 1,
        leadMode: 2,
        gtrMode: 1,
        brassMode: 0,
        leadEvery: 2,
        leadOct: 12,
        gtrOct: 12,
        brassOct: 0,
        chordTicks: s[r],
        leadPeak: .09
    }
}

export function Le(e, t) {
    let n = Math.max(1, Math.min(64, e | 0)),
        r = Math.floor((n - 1) / 16) % 4,
        i = [
            [0, 2, 3, 5, 7, 8, 10],
            [0, 2, 3, 5, 7, 9, 10],
            [0, 2, 4, 5, 7, 9, 11],
            [0, 2, 3, 5, 7, 8, 11]
        ][r],
        a = [41, 43, 45, 48],
        o = [132, 138, 126, 142],
        s = [
            [0, 0, 2, 2, 4, 4, 5, -1, 4, 4, 2, 2, 0, 0, 4, 4, 5, 5, 7, 7, 5, 4, 2, -1, 0, 0, 2, 4, 5, 5, 4, 4],
            [0, 0, 0, 2, 3, 3, 5, 5, 7, 5, 3, 2, 0, -1, 5, 5, 4, 4, 2, 2, 0, 0, 4, 4, 5, 5, 7, 5, 4, 4, 5, 5],
            [0, 2, 4, 4, 5, 5, 4, -1, 2, 2, 0, 0, 4, 4, 5, 7, 9, 7, 5, 4, 2, 0, -1, 0, 4, 4, 5, 5, 7, 7, 5, 5],
            [0, 0, 3, 3, 5, 5, 7, -1, 5, 4, 3, 2, 0, 0, 4, 4, 5, 5, 7, 8, 7, 5, 4, -1, 0, 2, 3, 5, 7, 7, 5, 4]
        ][r].slice(),
        c = s.map(e => e < 0 ? -1 : e + 4);
    return {
        tonic: a[r],
        scale: i,
        prog: [
            [0, 0, 3, 4, 0, 5, 4, 4],
            [0, 3, 0, 4, 5, 3, 4, 4],
            [0, 4, 0, 5, 3, 4, 4, 4],
            [0, 0, 5, 4, 0, 3, 4, 4]
        ][r],
        lead: s,
        counter: c,
        tempo: o[r],
        arpStyle: 0,
        drum: 40,
        leadDuty: `triangle`,
        style: `baroque`,
        story: t.title,
        organ: !0,
        fugue: !1,
        arr: n - 1,
        bassMode: 0,
        leadMode: 1,
        gtrMode: 0,
        brassMode: 0,
        leadEvery: 4,
        leadOct: 12,
        gtrOct: 12,
        brassOct: 0,
        chordTicks: 16,
        leadPeak: .08
    }
}

export function Re(e, t, n, r) {
    let i = Math.max(1, Math.min(64, e | 0));
    return {
        tonic: r.tonic,
        scale: r.scale,
        prog: r.prog,
        lead: r.lead,
        counter: r.counter,
        tempo: r.tempo,
        arpStyle: r.arpStyle ?? 0,
        drum: r.drum ?? 20,
        leadDuty: r.leadDuty ?? `triangle`,
        style: `baroque`,
        story: t.title,
        flavor: n,
        fugue: !1,
        organ: !1,
        canon: !1,
        whistle: !1,
        choir: !1,
        arr: i - 1,
        bassMode: r.bassMode ?? 1,
        leadMode: r.leadMode ?? 2,
        gtrMode: r.gtrMode ?? 0,
        brassMode: r.brassMode ?? 0,
        leadEvery: r.leadEvery ?? 2,
        leadOct: r.leadOct ?? 12,
        gtrOct: r.gtrOct ?? 12,
        brassOct: r.brassOct ?? 0,
        chordTicks: r.chordTicks ?? 8,
        leadPeak: r.leadPeak ?? .09
    }
}

export function ze(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 5, 4, 2, 0, -1, 2, 4, 7, 5, 4, 2, 0, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, -1, 4, 5, 4, 2, 0, 0],
            [0, 1, 3, 5, 3, 1, 0, -1, 3, 5, 7, 5, 3, 1, 0, 3, 0, 3, 5, 7, 8, 7, 5, 3, 1, -1, 5, 3, 1, 0, 0, 0],
            [0, 2, 0, 4, 2, 5, 4, -1, 0, 4, 7, 4, 2, 0, 2, 4, 5, 4, 2, 0, 4, 5, 7, 5, 4, -1, 2, 4, 2, 0, 0, 0],
            [0, 2, 4, 7, 9, 7, 5, 4, 2, -1, 0, 2, 4, 5, 4, 2, 0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, -1, 4, 2, 0, 0]
        ][n],
        i = r.map((e, t) => {
            let n = r[(t + r.length - 4) % r.length];
            return n < 0 ? -1 : n + 2
        });
    return Re(e, t, `dawn`, {
        tonic: [50, 52, 48, 53][n],
        scale: E[0],
        prog: [0, 0, 3, 4, 0, 5, 4, 0],
        lead: r,
        counter: i,
        tempo: [104, 98, 92, 108][n],
        drum: 44,
        leadEvery: 2,
        leadOct: 12,
        leadPeak: .08
    })
}

export function Be(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 7, -1, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0],
            [0, 4, 7, 4, 2, 0, -1, 5, 7, 5, 4, 2, 0, 2, 4, 0],
            [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 3, 5],
            [0, 2, 0, 5, 4, 2, 7, 5, 4, 2, 0, -1, 4, 5, 7, 0]
        ][n],
        i = [...r, ...r.map(e => e < 0 ? -1 : e + 0)],
        a = [...Array(16).fill(-1), ...r.map(e => e < 0 ? -1 : e + 4)];
    return Re(e, t, `subject`, {
        tonic: [48, 50, 47, 52][n],
        scale: E[+(n % 2 == 0)],
        prog: [0, 0, 0, 0, 4, 4, 0, 0],
        lead: i,
        counter: a,
        tempo: [110, 102, 96, 114][n],
        drum: 45,
        leadEvery: 2,
        leadOct: 12,
        leadPeak: .11,
        bassMode: 0
    })
}

export function Ve(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [0, 2, 4, 5, 4, 2, 0, 5, 4, 2, 0, 2, 4, 5, 7, 5],
        i = r.map((e, t) => t % 4 == 3 ? -1 : e + 4),
        a = r.slice();
    return Re(e, t, `continuo`, {
        tonic: [45, 47, 43, 48][n],
        scale: E[1],
        prog: [0, 4, 0, 5, 3, 4, 0, 0],
        lead: i,
        counter: a,
        tempo: [100, 94, 88, 106][n],
        drum: 46,
        leadEvery: 2,
        leadOct: 12,
        leadPeak: .07,
        bassMode: 2
    })
}

export function A(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, -1, -1, 4, -1, -1, 7, -1, 5, -1, -1, 4, -1, 2, -1, 0],
            [0, -1, 5, -1, -1, 7, -1, -1, 4, -1, 2, -1, 0, -1, 4, -1],
            [7, -1, -1, 4, -1, 0, -1, -1, 5, -1, 4, -1, 2, -1, 0, -1],
            [0, -1, -1, -1, 4, -1, -1, 7, -1, -1, 5, -1, 4, -1, 0, 0]
        ][n],
        i = [...r, ...r],
        a = r.map(e => e < 0 ? -1 : e + 7);
    return Re(e, t, `bells`, {
        tonic: [53, 55, 50, 57][n],
        scale: E[0],
        prog: [0, 0, 4, 0, 0, 3, 4, 0],
        lead: i,
        counter: a,
        tempo: [88, 82, 78, 94][n],
        drum: 47,
        leadEvery: 2,
        leadOct: 24,
        leadPeak: .1
    })
}

export function j(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0, 5, 4, 2, 0, 4, 2, 0, 0],
            [0, 1, 3, 5, 7, 8, 7, 5, 3, 1, 0, 3, 5, 7, 5, 3, 1, 0, 5, 3, 1, 0, 3, 5, 7, 5, 3, 1, 0, 1, 0, 0],
            [0, 4, 2, 5, 4, 7, 5, 4, 2, 0, 5, 7, 5, 4, 2, 4, 0, 2, 4, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 0],
            [0, 2, 0, 4, 2, 5, 4, 7, 5, 4, 2, 5, 7, 9, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0]
        ][n],
        i = r.map((e, t) => t % 2 == 0 ? -1 : (e + 3) % 10);
    return Re(e, t, `chase`, {
        tonic: [48, 50, 52, 47][n],
        scale: E[n % 2],
        prog: [0, 4, 5, 0, 3, 4, 5, 0],
        lead: r,
        counter: i,
        tempo: [128, 134, 122, 140][n],
        drum: 48,
        leadEvery: 1,
        leadOct: 12,
        leadPeak: .1,
        bassMode: 4
    })
}

export function M(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, -1, -1, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, -1, -1, 2, -1, -1, -1, 0, -1, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1],
            [0, -1, -1, -1, 7, -1, -1, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, 2, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, 0, -1, -1, -1, -1, 3, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, -1, -1],
            [0, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, 7, -1, -1, -1, -1, 5, -1, -1, -1, -1, 2, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1]
        ][n];
    return Re(e, t, `silence`, {
        tonic: [43, 45, 41, 47][n],
        scale: E[2 % E.length],
        prog: [0, 0, 0, 0, 0, 0, 4, 0],
        lead: r,
        counter: r.map(() => -1),
        tempo: [72, 68, 64, 76][n],
        drum: 49,
        leadEvery: 2,
        leadOct: 0,
        leadPeak: .06
    })
}

export function He(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 0, 4, 4, 0, 0, 5, 5, 0, 4, 0, 5, 4, 4, 0, 0],
            [0, 4, 0, 4, 7, 7, 5, 4, 0, 0, 4, 5, 4, 0, 0, 0],
            [0, 0, 0, 4, 4, 4, 5, 5, 7, 5, 4, 0, 4, 5, 0, 0],
            [0, 5, 4, 0, 0, 4, 5, 7, 5, 4, 0, 4, 0, 0, 0, 0]
        ][n],
        i = [...r, ...r],
        a = i.map(e => e + 4);
    return Re(e, t, `iron`, {
        tonic: [40, 43, 38, 45][n],
        scale: E[1],
        prog: [0, 0, 4, 0, 5, 4, 0, 0],
        lead: i,
        counter: a,
        tempo: [108, 100, 96, 114][n],
        drum: 50,
        leadDuty: `square`,
        leadEvery: 2,
        leadOct: 0,
        leadPeak: .12,
        bassMode: 5
    })
}

export function Ue(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 7, 2, 9, 4, 0, 11, 5, 2, 8, 0, 7, 4, 10, 2, 0],
            [0, 8, 1, 7, 3, 10, 0, 5, 9, 2, 6, 0, 7, 1, 4, 0],
            [0, 11, 4, 7, 0, 9, 2, 5, 12, 4, 0, 7, 3, 8, 0, 4],
            [0, 7, 0, 12, 5, 2, 9, 0, 6, 11, 3, 0, 8, 4, 0, 7]
        ][n],
        i = [...r, ...r.map(e => Math.max(0, e - 2))],
        a = i.map((e, t) => t % 3 == 0 ? e : -1);
    return Re(e, t, `tear`, {
        tonic: [49, 51, 46, 54][n],
        scale: E[(n + 2) % E.length],
        prog: [0, 3, 5, 4, 0, 2, 4, 0],
        lead: i,
        counter: a,
        tempo: [112, 118, 106, 124][n],
        drum: 51,
        leadDuty: `square`,
        leadEvery: 2,
        leadOct: 12,
        leadPeak: .11
    })
}

export function We(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 5, 7, 5, 4, 2, 5, 7, 9, 7, 5, 4, 2, 0, 4, 5, 7, 9, 11, 9, 7, 5, 4, 2, 0, 2, 4, 5, 4, 0],
            [0, 3, 5, 7, 8, 7, 5, 3, 0, 5, 7, 10, 7, 5, 3, 0, 3, 5, 7, 8, 10, 8, 7, 5, 3, 0, 5, 3, 0, 3, 5, 0],
            [0, 4, 7, 4, 2, 5, 9, 5, 4, 7, 11, 7, 5, 4, 2, 0, 4, 7, 5, 9, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 0, 0],
            [0, 1, 4, 7, 5, 8, 4, 7, 2, 5, 9, 5, 0, 4, 7, 4, 1, 5, 8, 5, 2, 7, 10, 7, 0, 4, 0, 5, 4, 2, 0, 0]
        ][n],
        i = r.map((e, t) => t % 2 == 0 ? e + 2 : e - 1);
    return Re(e, t, `storm`, {
        tonic: [46, 48, 50, 44][n],
        scale: E[n % E.length],
        prog: [0, 4, 5, 3, 4, 5, 0, 4],
        lead: r,
        counter: i,
        tempo: [136, 142, 130, 148][n],
        drum: 52,
        leadEvery: 1,
        leadOct: 12,
        leadPeak: .1,
        bassMode: 4,
        brassMode: 3
    })
}

export function Ge(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 0, 0, 2, 0, 0, 4, 0, 0, 0, 5, 0, 4, 2, 0, 0],
            [0, 0, 3, 0, 0, 5, 0, 0, 0, 2, 0, 0, 3, 0, 0, 0],
            [0, 2, 0, 0, 4, 0, 0, 5, 0, 4, 0, 2, 0, 0, 0, 0],
            [0, 0, 0, 0, 5, 5, 0, 0, 3, 0, 0, 2, 0, 0, 0, 0]
        ][n],
        i = r.map((e, t) => t % 4 == 0 ? e + 7 : -1);
    return Re(e, t, `abyss`, {
        tonic: [36, 38, 35, 40][n],
        scale: E[1],
        prog: [0, 0, 5, 0, 0, 3, 0, 0],
        lead: [...i, ...i],
        counter: [...r, ...r],
        tempo: [80, 74, 70, 86][n],
        drum: 53,
        leadEvery: 4,
        leadOct: 0,
        leadPeak: .07,
        bassMode: 2
    })
}

export function N(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 0, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 0],
            [0, 4, 7, 4, 0, 5, 4, 0, 2, 4, 5, 7, 5, 4, 0, 0],
            [0, 0, 4, 4, 5, 5, 0, 0, 4, 5, 7, 9, 7, 5, 4, 0],
            [0, 2, 0, 4, 5, 7, 5, 4, 0, 4, 5, 0, 4, 2, 0, 0]
        ][n],
        i = [...r, ...r],
        a = i.map(e => e + 2);
    return Re(e, t, `cadence`, {
        tonic: [48, 50, 52, 47][n],
        scale: E[0],
        prog: [0, 3, 4, 0, 0, 3, 4, 0],
        lead: i,
        counter: a,
        tempo: [100, 96, 92, 108][n],
        drum: 54,
        leadDuty: `square`,
        leadEvery: 2,
        leadOct: 12,
        leadPeak: .11,
        brassMode: 3
    })
}

export function Ke(e) {
    let t = Math.max(1, Math.min(64, e | 0)),
        n = t - 1,
        r = D(t);
    if (r.title.includes(`星屑のフーガ`)) return O(t, r);
    if (r.title.includes(`祈りの半終止`)) return Le(t, r);
    if (r.title.includes(`影のカノン`)) return k(t, r);
    if (r.title.includes(`鏡像の答`)) return Ie(t, r);
    if (r.title.includes(`決意の和声`)) return Fe(t, r);
    if (r.title.includes(`夜明けの対位`)) return ze(t, r);
    if (r.title.includes(`第一主題`)) return Be(t, r);
    if (r.title.includes(`歩む通奏`)) return Ve(t, r);
    if (r.title.includes(`遠い鐘`)) return A(t, r);
    if (r.title.includes(`追走曲`)) return j(t, r);
    if (r.title.includes(`沈黙の前`)) return M(t, r);
    if (r.title.includes(`鉄の序奏`)) return He(t, r);
    if (r.title.includes(`裂ける旋律`)) return Ue(t, r);
    if (r.title.includes(`嵐の展開`)) return We(t, r);
    if (r.title.includes(`深海のバス`)) return Ge(t, r);
    if (r.title.includes(`最後のカデンツ`)) return N(t, r);
    let i = we(t * 11003 + 777 + t * t),
        a = Math.max(0, Ae.findIndex(e => t >= e.from && t <= e.to)),
        o = (t - 1) % 16,
        s = E[(n * 3 + a + o) % E.length],
        c = [40, 41, 43, 45, 46, 47, 48, 50, 52, 53, 55, 57],
        l = c[(n * 5 + a * 2) % c.length],
        u = Oe[(n * 7 + o) % Oe.length].slice();
    o % 4 == 0 && (u = [0, 0, ...u]), o % 5 == 2 && (u = [...u, 4, 0, 5, 0]), a >= 2 && n % 2 == 0 && (u = u.map((e, t) => t % 2 == 0 ? e : (e + 3) % 7));
    let d = ke[n % ke.length],
        f = ke[(n * 5 + 3) % ke.length],
        p = Pe([...d, ...f], i, n),
        m, h = n % 4;
    m = h === 0 ? [...Array(8).fill(-1), ...p.slice(0, 24)] : h === 1 ? je(p) : h === 2 ? p.map(e => e < 0 ? -1 : e + 4) : p.map((e, t) => t % 2 == 0 ? e : -1);
    let g = Math.max(72, Math.min(138, 78 + n % 16 * 3 + a * 4 + o % 3 * 2)),
        _ = (n + a) % 6,
        v = (n * 2 + o) % 6,
        ee = (n + 3) % 5,
        y = (n * 3 + 1) % 6,
        te = [1, 2, 2, 4, 2, 1][(n + o) % 6],
        ne = [0, 12, 12, 24, 12, 0][n % 6],
        re = [12, 12, 24, 0, 12][ee],
        ie = [0, 0, 12, 0, -12, 12][y],
        ae = [4, 8, 8, 16, 8, 4][(n + a) % 6],
        oe = n % 2 == 0 ? `triangle` : `square`,
        b = 20 + (n * 3 + a) % 16,
        x = ee,
        S = y,
        se = _,
        ce = v,
        le = g;
    return o === 3 ? (se = 2, ce = 2, x = 4, S = 0) : o === 4 ? (ce = 4, se = 3, x = 0, S = 3, le = Math.min(140, le + 12)) : o === 5 ? (le = Math.max(72, le - 18), x = 2, se = 4, ce = 3) : o === 6 ? (p = p.map((e, t) => t % 3 == 0 ? e : -1), se = 3, x = 0, S = 1, le += 10) : o === 9 ? (se = 5, S = 3, x = 3, ce = 0) : o === 10 ? (S = 2, x = 2, ce = 1) : o === 12 ? (le = Math.max(72, le - 22), se = 4, x = 2, S = 3, ce = 3) : o === 13 ? (se = 1, ce = 2, S = 4, x = 4) : o === 15 && (u = [0, 4, 0, 0, 3, 4, 0, 0], S = 3, ce = 0), {
        tonic: l,
        scale: s,
        prog: u,
        lead: p,
        counter: m,
        tempo: Math.max(72, Math.min(140, le)),
        arpStyle: (n + a) % 4,
        drum: b,
        leadDuty: oe,
        style: `baroque`,
        story: r.title,
        fugue: !1,
        arr: n,
        bassMode: se,
        leadMode: ce,
        gtrMode: x,
        brassMode: S,
        leadEvery: te,
        leadOct: o === 13 ? 0 : ne,
        gtrOct: re,
        brassOct: o === 13 ? -12 : ie,
        chordTicks: ae,
        leadPeak: .07 + n % 5 * .008
    }
}
export var P = De(1, !1);

export function F(e, t = 0) {
    let n = P.scale,
        r = e,
        i = t;
    for (; r < 0;) r += n.length, i -= 12;
    for (; r >= n.length;) r -= n.length, i += 12;
    return P.tonic + n[r] + i
}

export function qe(e) {
    return [e, e + 2, e + 4, e + 6, e + 7]
}

export function Je(e, t, n) {
    let r = e.length;
    if (t === 0) return e[n % r];
    if (t === 1) return e[r - 1 - n % r];
    if (t === 2) {
        let t = r * 2 - 2,
            i = n % t;
        return i < r ? e[i] : e[t - i]
    }
    return e[n % 2 == 0 ? 0 : 2 + n % 3]
}

export function Ye() {
    b(140, .07, `triangle`, .14, 45, `bgm`), x(.025, .06, 600, `bgm`)
}

export function I(e = 0) {
    e === 0 ? (b(120, .09, `triangle`, .16, 38, `bgm`), x(.03, .07, 500, `bgm`)) : e === 1 ? (b(70, .14, `triangle`, .18, 32, `bgm`), b(110, .06, `sine`, .08, 40, `bgm`), x(.04, .05, 400, `bgm`)) : e === 2 ? (b(130, .05, `triangle`, .14, 42, `bgm`), setTimeout(() => {
        b(95, .08, `triangle`, .12, 36, `bgm`), x(.03, .06, 550, `bgm`)
    }, 45)) : (b(100, .16, `triangle`, .15, 30, `bgm`), x(.08, .08, 350, `bgm`))
}

export function Xe() {
    x(.06, .12, 3500, `bgm`), b(220, .03, `square`, .04, 100, `bgm`)
}

export function L(e = !1) {
    x(e ? .05 : .02, e ? .045 : .03, e ? 9e3 : 7e3, `bgm`)
}

export function Ze(e, t) {
    let n = _(),
        r = v();
    if (!n || !r || u) return;
    if (n.state === `suspended`) {
        n.resume();
        return
    }
    let i = n.currentTime,
        a = Math.max(.001, t * f),
        o = [1, 2, 2.76, 3.79, 5.1],
        s = [1, .45, .28, .15, .08];
    for (let t = 0; t < o.length; t++) {
        let c = n.createOscillator();
        c.type = t === 0 ? `sine` : `triangle`, c.frequency.setValueAtTime(e * o[t], i);
        let l = n.createGain();
        l.gain.setValueAtTime(1e-4, i), l.gain.exponentialRampToValueAtTime(a * s[t], i + .01), l.gain.exponentialRampToValueAtTime(1e-4, i + .55 + t * .05), c.connect(l), l.connect(r), c.start(i), c.stop(i + .7)
    }
    b(e, .08, `sine`, t * .25, void 0, `bgm`)
}

export function R(e, t) {
    let n = S(F(e, -12));
    b(n, .12, `square`, t, void 0, `bgm`), b(S(F(e + 4, -12)), .12, `square`, t * .75, void 0, `bgm`), b(n * 2, .06, `square`, t * .35, void 0, `bgm`), x(.03, t * .2, 1800, `bgm`)
}

export function z(e, t, n) {
    let r = S(F(e, 12)),
        i = S(F(t, 12));
    b(r, .16, `square`, n, i, `bgm`), b(r * .5, .14, `triangle`, n * .4, i * .5, `bgm`)
}

export function Qe(e, t, n) {
    let r = [0, 2, 4, 6, 7];
    for (let i = 0; i < r.length; i++) {
        let a = S(F(e + r[i], t)),
            o = n * (1 - i * .08);
        b(a, .16, `triangle`, o, void 0, `bgm`), b(a, .12, `square`, o * .42, a * (1 + (i - 2) * .0015), `bgm`)
    }
}

export function $e(e, t, n, r = .14) {
    if (!Number.isFinite(e) || e < 40 || e > 2800) return;
    let i = Math.max(.02, t);
    n === 0 ? (b(e, r, `square`, i, void 0, `bgm`), b(e, r * .9, `triangle`, i * .55, void 0, `bgm`), b(e * 2, r * .5, `triangle`, i * .18, void 0, `bgm`)) : n === 1 ? (b(e, r * 1.05, `triangle`, i * 1.05, void 0, `bgm`), b(e, r * .7, `square`, i * .35, void 0, `bgm`)) : n === 2 ? (b(e, r * 1.1, `triangle`, i, void 0, `bgm`), b(e * .5, r * .9, `triangle`, i * .35, void 0, `bgm`)) : n === 3 ? (b(e, r * .95, `square`, i * .85, void 0, `bgm`), b(e * 1.5, r * .4, `triangle`, i * .15, void 0, `bgm`)) : b(e, r * 1.15, `triangle`, i * .9, void 0, `bgm`)
}

export function et(e, t) {
    for (let n of [{
            d: 0,
            o: -12,
            p: 1,
            gender: `m`,
            vow: `o`
        }, {
            d: 4,
            o: 0,
            p: .75,
            gender: `m`,
            vow: `a`
        }, {
            d: 0,
            o: 12,
            p: .85,
            gender: `f`,
            vow: `a`
        }, {
            d: 2,
            o: 12,
            p: .6,
            gender: `f`,
            vow: `e`
        }]) {
        let r = S(F(e + n.d, n.o));
        r < 60 || r > 1400 || it(r, .3, t * n.p, n.vow, n.gender)
    }
}

export function tt(e, t) {
    let n = S(F(e, 0));
    n < 50 || n > 900 || (it(n, .22, t * 1.2, `o`, `m`), it(Math.max(60, n * .5), .24, t * .7, `u`, `m`))
}
export var nt = null;

export function rt(e) {
    if (nt && nt.sampleRate === e.sampleRate) return nt;
    let t = Math.max(1, Math.floor(e.sampleRate * .2)),
        n = e.createBuffer(1, t, e.sampleRate),
        r = n.getChannelData(0);
    for (let e = 0; e < r.length; e++) r[e] = Math.random() * 2 - 1;
    return nt = n, n
}

export function it(e, t, n, r = `a`, i = `m`) {
    try {
        if (u) return;
        let a = _(),
            o = v();
        if (!a || !o) return;
        if (a.state === `suspended`) {
            a.resume();
            return
        }
        if (f <= .001 || !Number.isFinite(e) || e < 40 || e > 2e3) return;
        let s = a.currentTime,
            c = Math.max(.001, Math.min(.38, n * f * 2)),
            l = {
                a: [750, 1150, 2500],
                o: [480, 850, 2400],
                u: [340, 650, 2200],
                e: [480, 1750, 2450],
                i: [290, 2100, 2900]
            },
            [d, p, m] = l[r] || l.a;
        i === `f` && (d *= 1.1, p *= 1.12, m *= 1.08);
        let h = a.createOscillator(),
            g = a.createOscillator();
        h.type = `sawtooth`, g.type = `sawtooth`, h.frequency.setValueAtTime(e, s), g.frequency.setValueAtTime(e * 1.005, s);
        let ee = a.createOscillator();
        ee.type = `sine`, ee.frequency.value = i === `f` ? 5.6 : 5.1;
        let y = a.createGain();
        y.gain.value = Math.min(12, e * .009), ee.connect(y), y.connect(h.frequency), y.connect(g.frequency);
        let te = a.createGain();
        te.gain.value = .4, h.connect(te), g.connect(te);
        let ne = a.createGain();
        ne.gain.value = 1;
        for (let [e, t, n] of [
                [d, 6, 1.15],
                [p, 8, .9],
                [m, 10, .45]
            ]) {
            let r = a.createBiquadFilter();
            r.type = `bandpass`, r.frequency.value = Math.min(7e3, Math.max(90, e)), r.Q.value = t;
            let i = a.createGain();
            i.gain.value = n, te.connect(r), r.connect(i), i.connect(ne)
        }
        let re = a.createGain();
        re.gain.value = .32, te.connect(re), re.connect(ne);
        try {
            let e = a.createBufferSource();
            e.buffer = rt(a);
            let n = a.createBiquadFilter();
            n.type = `bandpass`, n.frequency.value = Math.min(6e3, p), n.Q.value = 3;
            let r = a.createGain();
            r.gain.value = .045, e.connect(n), n.connect(r), r.connect(ne), e.start(s), e.stop(s + Math.min(t, .2))
        } catch {}
        let ie = a.createGain();
        ie.gain.setValueAtTime(1e-4, s), ie.gain.exponentialRampToValueAtTime(c, s + .03), ie.gain.setValueAtTime(c * .9, s + Math.max(.05, t * .5)), ie.gain.exponentialRampToValueAtTime(1e-4, s + t);
        let ae = a.createBiquadFilter();
        ae.type = `lowpass`, ae.frequency.value = i === `f` ? 4800 : 3800, ne.connect(ie), ie.connect(ae), ae.connect(o);
        let oe = s + t + .03;
        h.start(s), g.start(s), ee.start(s), h.stop(oe), g.stop(oe), ee.stop(oe)
    } catch {}
}

export function at(e, t, n = .14) {
    b(e, n, `sine`, t, void 0, `bgm`), b(e, n * .85, `triangle`, t * .45, void 0, `bgm`), x(.02, t * .15, 6e3, `bgm`)
}

export function ot(e, t, n) {
    let r = [0, 1, 2, 3, 4, 5];
    for (let i = 0; i < 6; i++) {
        let a = S(F(e + r[i], t + (i >= 4 ? 12 : 0))),
            o = n * (1 - i * .1);
        at(a, Math.max(.015, o), .13 + (i === 0 ? .04 : 0))
    }
}

export function st(e, t = 12, n = .08) {
    let r = S(F(e, t));
    b(r, .09, `triangle`, n, r * .985, `bgm`), b(r, .05, `square`, n * .35, void 0, `bgm`), b(r * 2, .04, `triangle`, n * .22, void 0, `bgm`)
}

export function ct(e, t = .12) {
    let n = S(F(e, -12));
    b(n, .14, `triangle`, t, n * .96, `bgm`), b(n * .5, .1, `triangle`, t * .45, void 0, `bgm`)
}

export function lt(e, t, n) {
    let r = [{
        d: 0,
        o: t,
        p: 1
    }, {
        d: 0,
        o: t + 12,
        p: .55
    }, {
        d: 4,
        o: t,
        p: .45
    }, {
        d: 0,
        o: t + 24,
        p: .28
    }, {
        d: 2,
        o: t,
        p: .35
    }];
    for (let t of r) {
        let r = S(F(e + t.d, t.o));
        b(r, .28, `triangle`, n * t.p, void 0, `bgm`), b(r * 1.003, .22, `triangle`, n * t.p * .35, void 0, `bgm`)
    }
}

export function ut(e) {
    let t = S(F(e, -12));
    b(t, .32, `triangle`, .14, void 0, `bgm`), b(t * .5, .36, `triangle`, .1, void 0, `bgm`), b(t * 2, .2, `triangle`, .04, void 0, `bgm`)
}

export function B(e, t, n, r) {
    let i = S(F(e, t)),
        a = S(F(e + 2, t)),
        o = S(F(e + 4, t));
    b(i, .13, r, n, void 0, `bgm`), b(a, .12, r, n * .72, void 0, `bgm`), b(o, .12, r, n * .55, void 0, `bgm`)
}

export function V(e, t = 12) {
    let n = S(F(e, t));
    b(n, .07, `square`, .07, n * .97, `bgm`), b(n * 2, .04, `square`, .03, void 0, `bgm`)
}

export function dt(e, t = 0) {
    let n = S(F(e, t));
    b(n, .16, `triangle`, .08, void 0, `bgm`), b(n, .12, `square`, .045, n * 1.01, `bgm`), b(S(F(e + 4, t)), .12, `triangle`, .04, void 0, `bgm`)
}

export function ft(e) {
    let t = P.drum,
        n = e % 16;
    if (P.style === `baroque`) {
        if (P.organ || P.drum === 40) {
            n === 0 && xe % 64 < 2 && x(.02, .02, 400, `bgm`);
            return
        }
        if (P.canon || P.drum === 41) {
            n === 0 && I(0), n === 8 && x(.03, .035, 900, `bgm`), (n === 4 || n === 12) && x(.025, .03, 2500, `bgm`), n % 4 == 2 && L(!1);
            return
        }
        if (P.whistle || P.drum === 42) {
            n === 0 && xe % 32 == 0 && x(.015, .02, 3e3, `bgm`);
            return
        }
        if (P.choir || P.drum === 43) {
            (n === 0 || n === 8) && I(1), (n === 4 || n === 12) && (x(.05, .08, 4e3, `bgm`), b(800, .02, `square`, .03, void 0, `bgm`)), (n === 6 || n === 14) && x(.025, .04, 3500, `bgm`);
            return
        }
        let e = P.drum >= 20 ? (P.drum - 20) % 16 : Math.max(0, P.drum - 10);
        e === 0 ? ((n === 0 || n === 8) && I(1), (n === 4 || n === 12) && I(0)) : e === 1 ? (n % 4 == 0 && I(0), (n === 6 || n === 14) && I(2), (n === 4 || n === 12) && Xe()) : e === 2 ? ((n === 0 || n === 3 || n === 6 || n === 8 || n === 11 || n === 14) && I(0), (n === 4 || n === 12) && Xe(), n % 2 == 1 && L(!1)) : e === 3 ? (n === 0 && I(1), n === 8 && I(3), (n === 4 || n === 12) && x(.05, .06, 900, `bgm`)) : e === 4 ? (n === 0 && I(1), n === 8 && I(1), n === 12 && Xe(), n === 4 && L(!0)) : e === 5 ? (n % 2 == 0 && I(+(n % 4 == 0)), (n === 7 || n === 15) && I(2), n % 4 == 1 && L(!1)) : e === 6 ? ((n === 0 || n === 5 || n === 8 || n === 13) && I(0), (n === 4 || n === 12) && Xe(), (n === 2 || n === 6 || n === 10 || n === 14) && L(!1)) : e === 7 ? (n === 0 && I(3), n === 10 && I(0), n === 15 && x(.06, .05, 600, `bgm`)) : e === 8 ? ((n === 0 || n === 8) && I(1), (n === 2 || n === 6 || n === 10 || n === 14) && I(0), (n === 4 || n === 12) && (Xe(), I(0))) : e === 9 ? (n % 4 == 0 && I(1), n % 4 == 2 && I(0), (n === 4 || n === 12) && Xe(), n % 2 == 1 && L(!0)) : e === 10 ? ((n === 0 || n === 7 || n === 8 || n === 15) && I(2), (n === 4 || n === 12) && Xe()) : e === 11 ? ((n === 0 || n === 8) && I(3), (n === 4 || n === 12) && x(.04, .04, 500, `bgm`)) : e === 12 ? (n % 2 == 0 && I(0), n % 4 == 3 && I(2), (n === 4 || n === 6 || n === 12 || n === 14) && Xe(), L(n % 3 == 0)) : e === 13 ? ((n === 0 || n === 8) && I(1), (n === 4 || n === 12) && I(1), (n === 2 || n === 10) && x(.05, .05, 300, `bgm`)) : e === 14 ? (n === 0 && I(0), (n === 3 || n === 6) && I(0), n === 8 && I(1), (n === 11 || n === 14) && I(0), (n === 4 || n === 12) && Xe()) : ((n === 0 || n === 8) && I(1), n === 4 && Xe(), n === 12 && (Xe(), I(2)), (n === 14 || n === 15) && I(0));
        return
    }
    if (T === `attract`) {
        (n === 0 || n === 8) && Ye(), (n === 4 || n === 12) && L(!1), n === 14 && Xe();
        return
    }
    t === 0 ? (n % 4 == 0 && Ye(), (n === 4 || n === 12) && Xe(), n % 2 == 1 && L(!1)) : t === 1 ? ((n === 0 || n === 6 || n === 8 || n === 14) && Ye(), (n === 4 || n === 12) && Xe(), n % 2 == 0 && L(n % 4 == 2)) : t === 2 ? ((n === 0 || n === 3 || n === 8 || n === 10) && Ye(), (n === 4 || n === 11 || n === 14) && Xe(), L(n % 3 == 0)) : t === 3 ? ((n === 0 || n === 8) && Ye(), (n === 4 || n === 12) && Xe(), (n === 2 || n === 6 || n === 10 || n === 14) && L(!0)) : t === 4 ? (n % 2 == 0 && Ye(), (n === 4 || n === 6 || n === 12 || n === 14) && Xe(), n % 2 == 1 && L(!1)) : ((n === 0 || n === 8) && Ye(), (n === 4 || n === 12) && Xe(), n % 2 == 1 && L(!1), n === 15 && Math.random() > .6 && x(.08, .08, 5e3, `bgm`))
}

export function pt() {
    if (u || T === `off`) return;
    let e = _(),
        t = v();
    if (!e || !t) {
        H();
        return
    }
    if (e.state === `suspended`) {
        e.resume().then(() => {
            !u && T !== `off` && H()
        }), H();
        return
    }
    let n = xe++,
        r = n % 16,
        i = Math.floor(n / 8) % P.prog.length,
        a = P.prog[i];
    if (P.fugue || P.flavor === `silence` || P.flavor === `bells`) {
        let e = r;
        e === 0 && b(80, .04, `triangle`, .035, void 0, `bgm`), e === 8 && P.flavor !== `silence` && x(.02, .02, 2e3, `bgm`)
    } else if (P.flavor === `dawn` || P.flavor === `abyss` || P.flavor === `continuo`) {
        let e = r;
        (e === 0 || e === 8) && b(70, .05, `triangle`, .05, void 0, `bgm`), (e === 4 || e === 12) && x(.02, .025, 2500, `bgm`)
    } else if (P.flavor === `iron` || P.flavor === `storm` || P.flavor === `chase`) ft(r);
    else if (P.flavor) {
        let e = r;
        (e === 0 || e === 8) && b(90, .05, `triangle`, .06, void 0, `bgm`), (e === 4 || e === 12) && x(.03, .03, 3e3, `bgm`)
    } else ft(r);
    if (P.style === `baroque`) {
        if (P.choir) {
            try {
                let e = P.leadEvery || 2;
                if (n % 8 == 0 && it(S(F(a, -12)), .34, .1, `u`, `m`), n % e === 0) {
                    let t = Math.floor(n / e),
                        r = t % P.lead.length,
                        i = P.lead[r],
                        o = Math.floor(t / 8) % 4;
                    if (i >= 0) {
                        if (o === 0) tt(i, .12);
                        else if (o === 1) et(i, P.leadPeak ?? .09);
                        else if (o === 2) {
                            et(i, (P.leadPeak ?? .09) * 1.15);
                            let e = P.counter[r];
                            e >= 0 && t % 2 == 0 && it(S(F(e, 12)), .24, .08, `a`, `f`)
                        } else et(i, P.leadPeak ?? .09), t % 4 == 0 && it(S(F(a + 4, 12)), .26, .07, `a`, `f`)
                    }
                }
                n % 32 == 28 && (it(S(F(3, 0)), .3, .09, `a`, `m`), it(S(F(3, 12)), .28, .07, `a`, `f`)), n % 32 == 30 && (it(S(F(0, 0)), .32, .1, `o`, `m`), it(S(F(0, 12)), .3, .08, `o`, `f`))
            } catch {}
            H();
            return
        }
        if (P.whistle) {
            let e = P.leadEvery || 2;
            if (n % 16 == 0 && b(S(F(a, -12)), .25, `triangle`, .025, void 0, `bgm`), n % e === 0) {
                let t = Math.floor(n / e),
                    r = Math.floor(t / 16) % 2,
                    i = t % P.lead.length;
                if (r === 0) {
                    let e = P.lead[i];
                    e >= 0 && ot(e, P.leadOct ?? 12, P.leadPeak ?? .07)
                } else {
                    let e = P.counter[i];
                    e >= 0 && ot(e, (P.leadOct ?? 12) + 12, (P.leadPeak ?? .07) * .9)
                }
            }
            if (n % 16 == 12) {
                let t = P.lead[Math.floor(n / e) % P.lead.length];
                t >= 0 && at(S(F(t, 24)), .04, .18)
            }
            H();
            return
        }
        if (P.canon) {
            let e = Math.max(2, P.chordTicks || 4),
                t = Math.floor(n / 2);
            if (n % 16 == 0 && b(S(F(a, -12)), .2, `triangle`, .03, void 0, `bgm`), n % 2 == 0) {
                let e = t % P.lead.length,
                    n = P.lead[e];
                n >= 0 && (st(n, P.leadOct ?? 12, P.leadPeak ?? .09), t % 8 == 0 && st(n + 2, (P.leadOct ?? 12) - 12, .035))
            }
            if (n % 2 == 0) {
                let n = t - e;
                if (n >= 0) {
                    let e = n % P.lead.length,
                        t = P.lead[e];
                    t >= 0 && (ct(t, .13), n % 4 == 0 && b(S(F(t, 0)), .08, `triangle`, .04, void 0, `bgm`))
                }
            }
            if (n % 8 == 5) {
                let e = P.lead[(t + 2) % P.lead.length];
                e >= 0 && st(e + 4, 24, .03)
            }
            H();
            return
        }
        if (P.organ) {
            if (n % 8 == 0 && ut(a), n % (P.leadEvery || 4) === 0) {
                let e = Math.floor(n / (P.leadEvery || 4)) % P.lead.length,
                    t = P.lead[e];
                if (t >= 0) {
                    lt(t, P.leadOct ?? 12, P.leadPeak ?? .08);
                    let n = P.counter[e];
                    n >= 0 && lt(n, (P.leadOct ?? 12) - 12, .04)
                }
            }
            n % 16 == 0 && lt(a, 0, .05), (n % 32 == 24 || n % 32 == 28) && (lt(4, 12, .07), ut(4)), H();
            return
        }
        if (P.fugue && P.fugueSubject) {
            let e = P.fugueSubject,
                t = e.length,
                r = Ne[Math.floor((P.arr ?? 0) / 16) % 4] || Ne[0],
                i = P.arr != null && P.arr >= 48 ? Math.max(10, t - 2) : P.arr != null && P.arr >= 24 ? Math.max(12, t - 1) : t,
                o = [0, 4, 0, 4, 7],
                s = [12, 0, 12, 24, 0],
                c = [.12, .11, .1, .095, .09];
            n % 8 == 0 && b(S(F(a, -12)), .2, `triangle`, .08, void 0, `bgm`), n % 16 == 0 && b(S(F(a, -24)), .22, `triangle`, .05, void 0, `bgm`);
            let l = n,
                u = i * 5,
                d = u + t * 2;
            for (let n = 0; n < 5; n++) {
                let a = n * i;
                if (l < a) continue;
                let u = l - a;
                if (l >= d) {
                    let e = Math.max(4, Math.floor(i / 2)),
                        r = n * e;
                    if (l - d < r) continue;
                    u = (l - d - r) % t
                } else if (u >= t) {
                    let e = r[(u - t) % r.length];
                    if (e < 0) continue;
                    $e(S(F(e + o[n] % 4, s[n])), c[n] * .55, n, .12);
                    continue
                }
                let f = e[(u % t + t) % t];
                f < 0 || (f += o[n], $e(S(F(f, s[n])), c[n], n, .15))
            }
            l > u && l % (t * 2) == t - 1 && Qe(a, 12, .05), l > d && l % t === t - 1 && Qe(a + 4, 12, .045), H();
            return
        }
        if (P.flavor) {
            let e = P.flavor,
                t = P.leadEvery ?? 2,
                i = P.leadPeak ?? .09,
                o = P.leadOct ?? 12;
            if (e === `dawn`) {
                if (n % 8 == 0 && b(S(F(a, -12)), .22, `triangle`, .06, void 0, `bgm`), n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e];
                    r >= 0 && (b(S(F(r, 12)), .14, `triangle`, i, void 0, `bgm`), b(S(F(r, 12)), .1, `sine`, i * .4, void 0, `bgm`));
                    let a = P.counter[e];
                    a >= 0 && b(S(F(a, 0)), .13, `triangle`, i * .7, void 0, `bgm`)
                }
                n % 16 == 12 && b(S(F(a + 4, 24)), .2, `sine`, .04, void 0, `bgm`), H();
                return
            }
            if (e === `subject`) {
                let e = Math.floor(n / t),
                    r = P.lead.length / 2;
                if (n % t === 0) {
                    let t = e % P.lead.length,
                        n = P.lead[t];
                    n >= 0 && (b(S(F(n, 12)), .15, `square`, i * 1.1, void 0, `bgm`), b(S(F(n, 12)), .12, `triangle`, i * .5, void 0, `bgm`))
                }
                if (e >= r && (n % 4 == 0 && b(S(F(a, -12)), .16, `triangle`, .09, void 0, `bgm`), n % t === 0)) {
                    let t = e % P.counter.length,
                        n = P.counter[t];
                    n >= 0 && b(S(F(n, 0)), .12, `triangle`, i * .55, void 0, `bgm`)
                }
                H();
                return
            }
            if (e === `continuo`) {
                if (n % 1 == 0 && n % 2 == 0) {
                    let e = Math.floor(n / 2) % P.counter.length,
                        t = P.counter[e];
                    t >= 0 && (b(S(F(t, -12)), .12, `triangle`, .13, void 0, `bgm`), b(S(F(t, -24)), .14, `triangle`, .06, void 0, `bgm`))
                }
                if (n % 4 == 2 && (b(S(F(a, 12)), .08, `square`, .05, void 0, `bgm`), b(S(F(a + 2, 12)), .08, `square`, .04, void 0, `bgm`), b(S(F(a + 4, 12)), .08, `triangle`, .04, void 0, `bgm`)), n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e];
                    r >= 0 && b(S(F(r, 12)), .1, `triangle`, i * .8, void 0, `bgm`)
                }
                H();
                return
            }
            if (e === `bells`) {
                if (n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e];
                    if (r >= 0) {
                        Ze(S(F(r, o > 12 ? 12 : o)), i);
                        let t = P.counter[e];
                        t >= 0 && n % 8 == 0 && Ze(S(F(t, 12)), i * .35)
                    }
                }
                n % 32 == 0 && x(.15, .02, 800, `bgm`), H();
                return
            }
            if (e === `chase`) {
                n % 2 == 0 && b(S(F(a + (n % 8 == 0 ? 0 : 4), -12)), .08, `triangle`, .08, void 0, `bgm`);
                let e = P.lead[n % P.lead.length];
                e >= 0 && b(S(F(e, 12)), .08, `square`, i, void 0, `bgm`);
                let t = P.lead[(n + P.lead.length - 1) % P.lead.length];
                t >= 0 && b(S(F(t + 3, 0)), .07, `triangle`, i * .65, void 0, `bgm`), n % 4 == 0 && b(S(F(a, 24)), .05, `square`, .04, void 0, `bgm`), H();
                return
            }
            if (e === `silence`) {
                if (n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e];
                    r >= 0 && (b(S(F(r, 0)), .35, `sine`, i, void 0, `bgm`), b(S(F(r, 0)), .3, `triangle`, i * .5, void 0, `bgm`))
                }
                n % 64 == 32 && x(.2, .015, 400, `bgm`), H();
                return
            }
            if (e === `iron`) {
                if (n % 4 == 0 && R(a, .1), n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e];
                    r >= 0 && (b(S(F(r, 0)), .12, `square`, i, void 0, `bgm`), b(S(F(r + 4, 0)), .12, `square`, i * .7, void 0, `bgm`))
                }(r === 0 || r === 8) && b(60, .08, `square`, .1, 40, `bgm`), H();
                return
            }
            if (e === `tear`) {
                if (n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e],
                        a = P.lead[(e + P.lead.length - 1) % P.lead.length];
                    r >= 0 && a >= 0 && Math.abs(r - a) >= 4 ? z(a, r, i) : r >= 0 && (b(S(F(r, 12)), .12, `square`, i, void 0, `bgm`), b(S(F(r, 24)), .06, `triangle`, i * .3, void 0, `bgm`))
                }
                n % 8 == 4 && b(S(F(a, -12)), .1, `triangle`, .08, void 0, `bgm`), H();
                return
            }
            if (e === `storm`) {
                n % 2 == 0 && b(S(F(a + n % 4, -12)), .08, `triangle`, .09, void 0, `bgm`);
                let e = P.lead[n % P.lead.length];
                e >= 0 && B(e, 12, i * .85, `square`);
                let t = P.counter[n % P.counter.length];
                t >= 0 && n % 2 == 1 && b(S(F(t, 24)), .06, `square`, i * .45, void 0, `bgm`), r === 0 && Qe(a, 0, .05), n % 3 == 0 && x(.02, .03, 5e3, `bgm`), H();
                return
            }
            if (e === `abyss`) {
                if (n % 2 == 0) {
                    let e = Math.floor(n / 2) % P.counter.length,
                        t = P.counter[e];
                    if (t >= 0) {
                        let e = S(F(t, -24));
                        b(e, .2, `triangle`, .16, void 0, `bgm`), b(e * 1.5, .16, `triangle`, .05, void 0, `bgm`), b(Math.max(30, e * .5), .22, `sine`, .08, void 0, `bgm`)
                    }
                }
                if (n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e];
                    r >= 0 && b(S(F(r, 12)), .2, `sine`, i * .6, void 0, `bgm`)
                }
                n % 16 == 8 && x(.12, .025, 300, `bgm`), H();
                return
            }
            if (e === `cadence`) {
                if (n % 4 == 0 && b(S(F(a, -12)), .14, `triangle`, .1, void 0, `bgm`), n % t === 0) {
                    let e = Math.floor(n / t) % P.lead.length,
                        r = P.lead[e];
                    r >= 0 && (b(S(F(r, 12)), .12, `square`, i, void 0, `bgm`), b(S(F(r + 2, 12)), .12, `triangle`, i * .55, void 0, `bgm`), b(S(F(r + 4, 12)), .12, `triangle`, i * .4, void 0, `bgm`))
                }
                r === 0 && Qe(a, 12, .07), r === 8 && Qe(a + 4, 12, .055), n % 32 == 30 && Qe(0, 12, .08), H();
                return
            }
        }
        let e = P.bassMode ?? 1,
            t = P.leadMode ?? 0,
            i = P.gtrMode ?? 1,
            o = P.brassMode ?? 1,
            s = P.leadEvery ?? 2,
            c = P.leadOct ?? 12,
            l = P.gtrOct ?? 12,
            u = P.brassOct ?? 0,
            d = P.leadPeak ?? .09;
        if (e === 0) n % 4 == 0 && b(S(F(a, -12)), .16, `triangle`, .12, void 0, `bgm`);
        else if (e === 1) n % 2 == 0 && b(S(F(n % 8 == 0 ? a : n % 8 == 2 ? a + 2 : n % 8 == 4 ? a + 4 : a + 3, -12)), .11, `triangle`, .11, void 0, `bgm`);
        else if (e === 2) {
            if (n % 2 == 0) {
                let e = [a, a, a + 4, a + 5][n / 2 % 4];
                b(S(F(e, -12)), .1, `triangle`, .13, void 0, `bgm`), b(S(F(e, -24)), .12, `triangle`, .06, void 0, `bgm`)
            }
        } else e === 3 ? n % 8 == 0 && b(S(F(a, -12)), .18, `triangle`, .14, void 0, `bgm`) : e === 4 ? (n % 4 == 1 || n % 4 == 2) && b(S(F(a + (n % 8 == 1 ? 0 : 4), -12)), .09, `triangle`, .1, void 0, `bgm`) : n % 2 == 0 && (b(S(F(a, -12)), .1, `square`, .08, void 0, `bgm`), b(S(F(a + 4, -12)), .1, `triangle`, .07, void 0, `bgm`));
        if (n % s === 0) {
            let e = Math.floor(n / s) % P.lead.length,
                r = P.lead[e];
            if (r >= 0) {
                if (t === 0 || t === 1) B(r, c, d, P.leadDuty);
                else if (t === 2) b(S(F(r, c)), .12, P.leadDuty, d * 1.15, void 0, `bgm`);
                else if (t === 3) {
                    let e = [0, 2, 4, 7][n / s % 4];
                    b(S(F(r + e, c)), .08, `square`, d, void 0, `bgm`)
                } else if (t === 4) Qe(r, c > 12 ? 12 : c, d * .7);
                else if (Math.floor(n / s) % 2 == 0) B(r, c, d, P.leadDuty);
                else {
                    let t = P.counter[e] ?? r;
                    t >= 0 && b(S(F(t, c)), .11, `square`, d, void 0, `bgm`)
                }
            }
        }
        if (i === 1 && n % 2 == 1) {
            let e = Math.floor(n / 2) % Math.max(1, P.counter.length),
                t = P.counter[e];
            t >= 0 ? V(t, l) : n % 4 == 1 && V(a + 4, l)
        } else if (i === 2) {
            let e = P.counter[n % Math.max(1, P.counter.length)];
            e >= 0 && n % 1 == 0 && (n % 2 == 0 || n % 3 == 0) && V(e, l)
        } else if (i === 3 && n % 4 == 0) {
            let e = S(F(a, l));
            b(e, .1, `square`, .08, void 0, `bgm`), b(S(F(a + 4, l)), .1, `square`, .06, void 0, `bgm`), b(e * 2, .06, `square`, .04, void 0, `bgm`)
        } else i === 4 && n % 8 == 2 && V(a + 2, l);
        if (o === 1 && n % 4 == 0) dt(a, u);
        else if (o === 2 && n % 2 == 0) dt(a + (n / 2 % 2 == 0 ? 0 : 2), u);
        else if (o === 3 && r === 0) Qe(a, u, .06);
        else if (o === 4 && n % 8 == 0) B(a, u, .05, `triangle`);
        else if (o === 5 && n % 4 == 2) {
            let e = Math.floor(n / 2) % Math.max(1, P.counter.length),
                t = P.counter[e];
            t >= 0 && dt(t, u)
        }
        o === 3 && r === 8 && (P.arr ?? 0) % 2 == 0 && dt(a + 4, u), H();
        return
    }
    if (n % 2 == 0 && b(S(F(n % 8 == 6 ? a + 4 : a, -12)), .09, `triangle`, T === `attract` ? .07 : .11, void 0, `bgm`), b(S(F(Je(qe(a), P.arpStyle, n), 12)), .055, `square`, T === `attract` ? .035 : .055, void 0, `bgm`), n % 2 == 0) {
        let e = Math.floor(n / 2) % P.lead.length,
            t = P.lead[e];
        if (t >= 0) {
            let e = S(F(t, 12)),
                r = T === `attract` ? .07 : .1;
            b(e, .1, P.leadDuty, r, void 0, `bgm`), T !== `attract` && n % 4 == 0 && b(e * 2, .06, `square`, r * .35, void 0, `bgm`)
        }
    }
    P.style === `legacy` && r === 0 && [7, 5, 4, 2].forEach((e, t) => {
        setTimeout(() => b(S(F(e, 24)), .05, `square`, .06, void 0, `bgm`), t * (P.tempo * .45))
    }), H()
}

export function H() {
    if (Se && clearTimeout(Se), T === `off` || u) return;
    let e = T === `attract` && xe % 2 == 1 ? P.tempo * .06 : 0;
    Se = setTimeout(pt, Math.max(55, P.tempo + e))
}

export function U() {
    Se &&= (clearTimeout(Se), null)
}


// ── BGM scheduler ──
export function W(e, t = 1) {
    if (U(), T = e, be = Math.max(1, t | 0), ye = 0, xe = 0, P = De(e === `attract` ? 1 : be, !1), e === `attract` && (P = {
            ...De(8, !1),
            tempo: 110,
            drum: 5,
            leadDuty: `triangle`
        }), u) return;
    let n = _();
    if (n && n.state === `suspended`) {
        n.resume().then(() => {
            !u && T === e && pt()
        }), H();
        return
    }
    pt()
}

export function mt(e = 0, t = 1) {
    if (U(), T = `boss`, ye = ((e | 0) % 8 + 8) % 8, be = Math.max(1, t | 0), xe = 0, P = Ke(be), u) return;
    let n = _();
    if (n && n.state === `suspended`) {
        n.resume().then(() => {
            !u && T === `boss` && pt()
        }), H();
        return
    }
    pt()
}

export function ht(e = 0, t = 1) {
    if (U(), T = `boss`, ye = ((e | 0) % 8 + 8) % 8, be = Math.max(1, t | 0), xe = 0, P = De(be, !0), P.style = `legacy`, P.tempo = Math.max(70, P.tempo - ye), P.arpStyle = (P.arpStyle + ye) % 4, u) return;
    let n = _();
    if (n && n.state === `suspended`) {
        n.resume().then(() => {
            !u && T === `boss` && pt()
        }), H();
        return
    }
    pt()
}

export function gt() {
    U(), T = `off`
}

export function _t(e, t = 1) {
    let n = Math.max(1, Math.min(64, t | 0));
    return e === `title` ? (W(`attract`), `TITLE THEME`) : e === `stage` ? (W(`play`, n), `STAGE ${String(n).padStart(2,`0`)} BGM`) : e === `legacy` ? (ht((n - 1) % 8, n), `旧ボス ${String(n).padStart(2,`0`)} (CHIP)`) : (mt((n - 1) % 8, n), D(n).title)
}

export function vt() {
    return {
        stages: 64,
        bosses: 64,
        labels: {
            title: `TITLE THEME`,
            stage: e => `STAGE ${String(e).padStart(2,`0`)}`,
            boss: e => D(e).title,
            legacy: e => `旧B${String(e).padStart(2,`0`)} CHIP`
        }
    }
}

