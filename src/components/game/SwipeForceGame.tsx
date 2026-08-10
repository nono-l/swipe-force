// @ts-nocheck
/**
 * Recovered from live deploy https://monarch-jade-kind-brush.grok.me/
 * Full game (~v1.4): share missions, sound test, cushion URLs, account link, etc.
 */
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import {
  GROK_PROVIDERS,
  signIn,
  signOut,
  getBearerToken,
} from "@/lib/auth/client";
import {
  openProfileDialog,
  openStatsDialog,
  shareProfilePayload,
} from "@/lib/profile-ui";
import {
  addPlayTime,
  noteHelpAsked,
  noteHelpReceived,
  noteRunStart,
  noteStage,
  noteKill,
  noteBossClear,
  noteContinue,
  noteHiScore,
} from "@/lib/player-stats";

/** esbuild __toESM(mod, 1) compatible shim */
function __toESM(mod, _isNodeMode) {
  if (mod && mod.__esModule) return mod;
  const target = Object.create(null);
  if (mod != null) {
    for (const k of Object.keys(mod)) {
      if (k !== "default") {
        try { target[k] = mod[k]; } catch {}
      }
    }
  }
  target.default = mod;
  return target;
}
const e = __toESM;
const n = () => React;
const t = () => ({ jsx, jsxs });
const r = GROK_PROVIDERS;
const i = signIn;
const a = signOut;
const o = getBearerToken;

var s = e(n(), 1),
    c = null,
    l = null,
    u = !1,
    d = 1,
    f = .85,
    p = 1,
    m = .38,
    h = {};

function g(e, t) {
    let n = performance.now();
    return n - (h[e] ?? 0) < t ? !1 : (h[e] = n, !0)
}

function _() {
    if (typeof window > `u`) return null;
    if (!c) {
        let e = window.AudioContext || window.webkitAudioContext;
        if (!e) return null;
        c = new e, l = c.createGain(), l.gain.value = u ? 0 : m * d, l.connect(c.destination)
    }
    return c
}

function v() {
    return _(), l
}

function ee() {
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

function y() {
    if (!l) return;
    let e = _(),
        t = u ? 0 : m * Math.max(0, Math.min(1, d));
    e ? l.gain.setTargetAtTime(t, e.currentTime, .02) : l.gain.value = t
}

function te(e) {
    u = e, y(), e ? U() : T !== `off` && (U(), pt())
}

function ne() {
    return te(!u), u
}

function re(e) {
    d = Math.max(0, Math.min(1, e)), y()
}

function ie(e) {
    f = Math.max(0, Math.min(1, e))
}

function ae(e) {
    p = Math.max(0, Math.min(1, e))
}

function oe(e, t, n, r, i) {
    let a = e.createGain(),
        o = e.currentTime;
    return a.gain.setValueAtTime(1e-4, o), a.gain.exponentialRampToValueAtTime(Math.max(1e-4, n), o + Math.max(.001, r)), a.gain.exponentialRampToValueAtTime(1e-4, o + r + i), a.connect(t), a
}

function b(e, t, n = `square`, r = .12, i, a = `sfx`) {
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

function x(e, t = .15, n = 4e3, r = `sfx`) {
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

function S(e) {
    return 440 * 2 ** ((e - 69) / 12)
}

function se() {
    g(`shoot`, 40) && b(880, .04, `square`, .07, 520)
}

function ce() {
    g(`missile`, 70) && (b(200, .1, `square`, .09, 80), b(400, .06, `square`, .05, 150))
}

function le() {
    g(`particle`, 80) && (b(1200, .08, `sawtooth`, .08, 400), b(600, .1, `square`, .05))
}

function ue() {
    g(`lock`, 60) && b(500, .04, `square`, .06, 1400)
}

function de() {
    g(`hit`, 28) && b(300, .03, `square`, .05, 120)
}

function fe(e = !1) {
    g(e ? `xbig` : `xsm`, e ? 70 : 35) && (x(e ? .28 : .12, e ? .22 : .12, e ? 2200 : 1400), e && b(100, .2, `triangle`, .1, 40))
}

function pe() {
    g(`phit`, 90) && (x(.16, .2, 900), b(180, .15, `square`, .1, 50))
}

function me() {
    g(`boss`, 400) && (b(220, .12, `square`, .12), setTimeout(() => b(220, .12, `square`, .12), 140), setTimeout(() => b(160, .2, `square`, .14, 90), 280))
}

function he() {
    g(`clear`, 500) && [523, 659, 784, 1046, 1318].forEach((e, t) => {
        setTimeout(() => b(e, .1, `square`, .1), t * 70)
    })
}

function ge() {
    g(`go`, 500) && (b(400, .15, `square`, .1, 200), setTimeout(() => b(250, .2, `square`, .1, 120), 150), setTimeout(() => b(120, .35, `triangle`, .12, 55), 320))
}

function _e() {
    g(`buy`, 70) && (b(660, .05, `square`, .08), setTimeout(() => b(990, .07, `square`, .09), 45))
}

function C() {
    g(`buyfail`, 90) && b(160, .08, `square`, .08, 90)
}

function w() {
    g(`ui`, 45) && b(520, .03, `square`, .05)
}

function ve() {
    g(`start`, 300) && [440, 554, 659, 880].forEach((e, t) => {
        setTimeout(() => b(e, .08, `square`, .09), t * 60)
    })
}
var T = `off`,
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

function we(e) {
    let t = (e >>> 0) + 1831565813;
    return () => (t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / 4294967296)
}
var Te = [
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

function De(e, t) {
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
var E = [
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
    Ae = [{
        name: `I 序曲`,
        from: 1,
        to: 16,
        feel: `solemn`
    }, {
        name: `II 闘争`,
        from: 17,
        to: 32,
        feel: `rising`
    }, {
        name: `III 深淵`,
        from: 33,
        to: 48,
        feel: `abyss`
    }, {
        name: `IV 終局`,
        from: 49,
        to: 64,
        feel: `finale`
    }];

function D(e) {
    let t = Math.max(1, Math.min(64, e | 0)),
        n = Ae.find(e => t >= e.from && t <= e.to) || Ae[0],
        r = [`夜明けの対位`, `第一主題`, `影のカノン`, `歩む通奏`, `遠い鐘`, `追走曲`, `沈黙の前`, `決意の和声`, `星屑のフーガ`, `鉄の序奏`, `裂ける旋律`, `祈りの半終止`, `嵐の展開`, `深海のバス`, `鏡像の答`, `最後のカデンツ`],
        i = r[(t - 1) % r.length];
    return {
        act: n.name,
        title: `${n.name} · No.${String(t).padStart(2,`0`)} ${i}`,
        feel: n.feel
    }
}

function je(e) {
    return e.map(e => e < 0 ? -1 : Math.max(0, 7 - e))
}
var Me = [
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

function O(e, t) {
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

function Pe(e, t, n) {
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

function Fe(e, t) {
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

function Ie(e, t) {
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

function k(e, t) {
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

function Le(e, t) {
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

function Re(e, t, n, r) {
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

function ze(e, t) {
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

function Be(e, t) {
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

function Ve(e, t) {
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

function A(e, t) {
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

function j(e, t) {
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

function M(e, t) {
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

function He(e, t) {
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

function Ue(e, t) {
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

function We(e, t) {
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

function Ge(e, t) {
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

function N(e, t) {
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

function Ke(e) {
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
var P = De(1, !1);

function F(e, t = 0) {
    let n = P.scale,
        r = e,
        i = t;
    for (; r < 0;) r += n.length, i -= 12;
    for (; r >= n.length;) r -= n.length, i += 12;
    return P.tonic + n[r] + i
}

function qe(e) {
    return [e, e + 2, e + 4, e + 6, e + 7]
}

function Je(e, t, n) {
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

function Ye() {
    b(140, .07, `triangle`, .14, 45, `bgm`), x(.025, .06, 600, `bgm`)
}

function I(e = 0) {
    e === 0 ? (b(120, .09, `triangle`, .16, 38, `bgm`), x(.03, .07, 500, `bgm`)) : e === 1 ? (b(70, .14, `triangle`, .18, 32, `bgm`), b(110, .06, `sine`, .08, 40, `bgm`), x(.04, .05, 400, `bgm`)) : e === 2 ? (b(130, .05, `triangle`, .14, 42, `bgm`), setTimeout(() => {
        b(95, .08, `triangle`, .12, 36, `bgm`), x(.03, .06, 550, `bgm`)
    }, 45)) : (b(100, .16, `triangle`, .15, 30, `bgm`), x(.08, .08, 350, `bgm`))
}

function Xe() {
    x(.06, .12, 3500, `bgm`), b(220, .03, `square`, .04, 100, `bgm`)
}

function L(e = !1) {
    x(e ? .05 : .02, e ? .045 : .03, e ? 9e3 : 7e3, `bgm`)
}

function Ze(e, t) {
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

function R(e, t) {
    let n = S(F(e, -12));
    b(n, .12, `square`, t, void 0, `bgm`), b(S(F(e + 4, -12)), .12, `square`, t * .75, void 0, `bgm`), b(n * 2, .06, `square`, t * .35, void 0, `bgm`), x(.03, t * .2, 1800, `bgm`)
}

function z(e, t, n) {
    let r = S(F(e, 12)),
        i = S(F(t, 12));
    b(r, .16, `square`, n, i, `bgm`), b(r * .5, .14, `triangle`, n * .4, i * .5, `bgm`)
}

function Qe(e, t, n) {
    let r = [0, 2, 4, 6, 7];
    for (let i = 0; i < r.length; i++) {
        let a = S(F(e + r[i], t)),
            o = n * (1 - i * .08);
        b(a, .16, `triangle`, o, void 0, `bgm`), b(a, .12, `square`, o * .42, a * (1 + (i - 2) * .0015), `bgm`)
    }
}

function $e(e, t, n, r = .14) {
    if (!Number.isFinite(e) || e < 40 || e > 2800) return;
    let i = Math.max(.02, t);
    n === 0 ? (b(e, r, `square`, i, void 0, `bgm`), b(e, r * .9, `triangle`, i * .55, void 0, `bgm`), b(e * 2, r * .5, `triangle`, i * .18, void 0, `bgm`)) : n === 1 ? (b(e, r * 1.05, `triangle`, i * 1.05, void 0, `bgm`), b(e, r * .7, `square`, i * .35, void 0, `bgm`)) : n === 2 ? (b(e, r * 1.1, `triangle`, i, void 0, `bgm`), b(e * .5, r * .9, `triangle`, i * .35, void 0, `bgm`)) : n === 3 ? (b(e, r * .95, `square`, i * .85, void 0, `bgm`), b(e * 1.5, r * .4, `triangle`, i * .15, void 0, `bgm`)) : b(e, r * 1.15, `triangle`, i * .9, void 0, `bgm`)
}

function et(e, t) {
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

function tt(e, t) {
    let n = S(F(e, 0));
    n < 50 || n > 900 || (it(n, .22, t * 1.2, `o`, `m`), it(Math.max(60, n * .5), .24, t * .7, `u`, `m`))
}
var nt = null;

function rt(e) {
    if (nt && nt.sampleRate === e.sampleRate) return nt;
    let t = Math.max(1, Math.floor(e.sampleRate * .2)),
        n = e.createBuffer(1, t, e.sampleRate),
        r = n.getChannelData(0);
    for (let e = 0; e < r.length; e++) r[e] = Math.random() * 2 - 1;
    return nt = n, n
}

function it(e, t, n, r = `a`, i = `m`) {
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

function at(e, t, n = .14) {
    b(e, n, `sine`, t, void 0, `bgm`), b(e, n * .85, `triangle`, t * .45, void 0, `bgm`), x(.02, t * .15, 6e3, `bgm`)
}

function ot(e, t, n) {
    let r = [0, 1, 2, 3, 4, 5];
    for (let i = 0; i < 6; i++) {
        let a = S(F(e + r[i], t + (i >= 4 ? 12 : 0))),
            o = n * (1 - i * .1);
        at(a, Math.max(.015, o), .13 + (i === 0 ? .04 : 0))
    }
}

function st(e, t = 12, n = .08) {
    let r = S(F(e, t));
    b(r, .09, `triangle`, n, r * .985, `bgm`), b(r, .05, `square`, n * .35, void 0, `bgm`), b(r * 2, .04, `triangle`, n * .22, void 0, `bgm`)
}

function ct(e, t = .12) {
    let n = S(F(e, -12));
    b(n, .14, `triangle`, t, n * .96, `bgm`), b(n * .5, .1, `triangle`, t * .45, void 0, `bgm`)
}

function lt(e, t, n) {
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

function ut(e) {
    let t = S(F(e, -12));
    b(t, .32, `triangle`, .14, void 0, `bgm`), b(t * .5, .36, `triangle`, .1, void 0, `bgm`), b(t * 2, .2, `triangle`, .04, void 0, `bgm`)
}

function B(e, t, n, r) {
    let i = S(F(e, t)),
        a = S(F(e + 2, t)),
        o = S(F(e + 4, t));
    b(i, .13, r, n, void 0, `bgm`), b(a, .12, r, n * .72, void 0, `bgm`), b(o, .12, r, n * .55, void 0, `bgm`)
}

function V(e, t = 12) {
    let n = S(F(e, t));
    b(n, .07, `square`, .07, n * .97, `bgm`), b(n * 2, .04, `square`, .03, void 0, `bgm`)
}

function dt(e, t = 0) {
    let n = S(F(e, t));
    b(n, .16, `triangle`, .08, void 0, `bgm`), b(n, .12, `square`, .045, n * 1.01, `bgm`), b(S(F(e + 4, t)), .12, `triangle`, .04, void 0, `bgm`)
}

function ft(e) {
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

function pt() {
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

function H() {
    if (Se && clearTimeout(Se), T === `off` || u) return;
    let e = T === `attract` && xe % 2 == 1 ? P.tempo * .06 : 0;
    Se = setTimeout(pt, Math.max(55, P.tempo + e))
}

function U() {
    Se &&= (clearTimeout(Se), null)
}

function W(e, t = 1) {
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

function mt(e = 0, t = 1) {
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

function ht(e = 0, t = 1) {
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

function gt() {
    U(), T = `off`
}

function _t(e, t = 1) {
    let n = Math.max(1, Math.min(64, t | 0));
    return e === `title` ? (W(`attract`), `TITLE THEME`) : e === `stage` ? (W(`play`, n), `STAGE ${String(n).padStart(2,`0`)} BGM`) : e === `legacy` ? (ht((n - 1) % 8, n), `旧ボス ${String(n).padStart(2,`0`)} (CHIP)`) : (mt((n - 1) % 8, n), D(n).title)
}

function vt() {
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
var yt = 40,
    bt = 2e3,
    xt = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF]/,
    St = /[<>&"'`\\/]/,
    Ct = /(--|\/\*|\*\/|;|\||\x00)/,
    wt = /\b(union|select|insert|update|delete|drop|alter|create|truncate|exec|execute|script|javascript|onerror|onload|eval)\b/i,
    Tt = /[\u200B\u200C\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD]/g,
    Et = /\p{Extended_Pictographic}/u;

function Dt(e) {
    return e === 8205 || e === 65039 || e === 8419 || e >= 127995 && e <= 127999 || e >= 127462 && e <= 127487 || e >= 917536 && e <= 917631
}

function Ot(e) {
    let t = e.codePointAt(0) ?? 0;
    return !!(t === 32 || t >= 48 && t <= 57 || t >= 65 && t <= 90 || t >= 97 && t <= 122 || t === 12288 || t === 33 || t === 63 || t === 46 || t === 44 || t === 40 || t === 41 || t === 126 || t === 12289 || t === 12290 || t === 12539 || t === 12540 || t === 12316 || t === 65374 || t === 8230 || t === 65281 || t === 65311 || t === 12300 || t === 12301 || t === 12302 || t === 12303 || t === 65288 || t === 65289 || t >= 12353 && t <= 12438 || t === 12445 || t === 12446 || t === 12540 || t >= 12449 && t <= 12538 || t === 12541 || t === 12542 || t >= 65382 && t <= 65437 || t >= 19968 && t <= 40959 || t >= 13312 && t <= 19903 || t === 12293 || t === 12347 || Dt(t) || Et.test(e) || t >= 9728 && t <= 9983 || t >= 9984 && t <= 10175)
}

function kt(e, t) {
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

function At(e) {
    return Mt(e, yt, 400, !1)
}

function jt(e) {
    return Mt(e, bt, 16e3, !0)
}

function Mt(e, t, n, r) {
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
    if (xt.test(e)) return {
        ok: !1,
        reason: `control`
    };
    if (St.test(e)) return {
        ok: !1,
        reason: `html`
    };
    if (Ct.test(e) || wt.test(e)) return {
        ok: !1,
        reason: `sql`
    };
    let i = e.normalize(`NFC`);
    if (i = i.replace(Tt, ``), r) i = i.replace(/\r\n/g, `
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
            let e = [...t].filter(Ot).join(``);
            if (e !== [...t].join(``)) return {
                ok: !1,
                reason: `unsafe`
            };
            n.push(e)
        }
        let r = kt(n.join(`
`).trim(), t);
        return r = r.split(`
`).map(e => e.trimEnd()).join(`
`).trim(), !r || !/[\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff]/u.test(r) && !Et.test(r) && !/[\u2600-\u27bf]/u.test(r) ? {
            ok: !1,
            reason: `empty`
        } : {
            ok: !0,
            text: r
        }
    }
    let a = [...i].filter(Ot).join(``);
    if (a !== [...i].join(``)) return {
        ok: !1,
        reason: `unsafe`
    };
    let o = kt(a.trim(), t);
    return !o || !/[\p{L}\p{N}\u3040-\u30ff\u4e00-\u9fff]/u.test(o) && !Et.test(o) && !/[\u2600-\u27bf]/u.test(o) ? {
        ok: !1,
        reason: `empty`
    } : {
        ok: !0,
        text: o
    }
}

function Nt(e) {
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
var G = 20,
    Pt = 500;

function Ft(e) {
    if (e == null) return {
        ok: !0,
        urls: []
    };
    if (!Array.isArray(e)) return {
        ok: !1,
        reason: `type`
    };
    if (e.length > G) return {
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
        if (e.length > Pt || /[\u0000-\u001F\u007F<>"'`]/.test(e)) return {
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
        if (t.includes(i) || t.push(i), t.length > G) return {
            ok: !1,
            reason: `url_limit`
        }
    }
    return {
        ok: !0,
        urls: t
    }
}

function It(e) {
    return e === `arrange` || e === `cover` || e === `note` ? e : `note`
}
var Lt = `swipe_force_sound_comments_v2`;

function Rt(e, t = 0) {
    return e === `title` ? `title` : `${e}:${t}`
}

function zt() {
    try {
        return JSON.parse(localStorage.getItem(Lt) || `{}`)
    } catch {
        return {}
    }
}

function Bt(e) {
    try {
        localStorage.setItem(Lt, JSON.stringify(e))
    } catch {}
}

function Vt(e) {
    return zt()[e] || []
}

function Ht(e, t) {
    let n = zt(),
        r = n[e] || [];
    r.some(e => e.id === t.id) || (n[e] = [t, ...r].slice(0, 50), Bt(n))
}

function K(e, t) {
    let n = new Map;
    for (let r of [...e, ...t]) r?.id && n.set(r.id, {
        ...r,
        urls: Array.isArray(r.urls) ? r.urls : [],
        kind: r.kind || `note`
    });
    return [...n.values()].sort((e, t) => (t.at || ``).localeCompare(e.at || ``)).slice(0, 50)
}
async function Ut(e) {
    let t = Vt(e);
    try {
        let n = await fetch(`/api/sound/comments?track=${encodeURIComponent(e)}`, {
            credentials: `same-origin`
        });
        if (!n.ok) return t;
        let r = await n.json(),
            i = K(t, Array.isArray(r.comments) ? r.comments : []),
            a = zt();
        return a[e] = i, Bt(a), i
    } catch {
        return t
    }
}
async function Wt(e, t, n, r = [], i = `note`) {
    let a = It(i),
        o = Ft(r);
    if (!o.ok) return {
        ok: !1,
        reason: o.reason
    };
    let s = ``;
    if (n.trim()) {
        let e = jt(n);
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
        return r.comment ? (Ht(e, r.comment), {
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
var Gt = `swipe_force_sound_votes_v1`;

function Kt() {
    try {
        return JSON.parse(localStorage.getItem(Gt) || `{}`)
    } catch {
        return {}
    }
}

function qt(e) {
    try {
        localStorage.setItem(Gt, JSON.stringify(e))
    } catch {}
}

function Jt(e) {
    return Kt()[e] || {
        likes: 0,
        dislikes: 0,
        mine: null
    }
}
async function Yt(e, t) {
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
async function Xt(e, t, n) {
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
var Zt = [{
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

function Qt() {
    try {
        return JSON.parse(localStorage.getItem(q) || `{}`)
    } catch {
        return {}
    }
}

function $t(e) {
    try {
        localStorage.setItem(q, JSON.stringify(e))
    } catch {}
}

function en(e, t) {
    return `${e}::${t}`
}
async function tn(e, t, n) {
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
async function nn(e, t, n, r) {
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
var rn = `swipe_force_url_visits_v1`;

function an() {
    try {
        return JSON.parse(localStorage.getItem(rn) || `{}`)
    } catch {
        return {}
    }
}

function J(e) {
    try {
        localStorage.setItem(rn, JSON.stringify(e))
    } catch {}
}

function on(e, t) {
    return !!an()[en(e, t)]
}
async function sn(e, t, n) {
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
var cn = `1.5.0`,
    ln = [{
        version: `1.5.0`,
        date: `2026-08-10`,
        title: `プロフ・統計画面`,
        notes: [`連携特典プロフィール`, `自己紹介URLクッション`, `シェア文テンプレ40字`, `ゲーム情報画面`, `ロゴ下バージョン更新`]
    }, {
        version: `1.4.0`,
        date: `2026-08-10`,
        title: `ボス曲リファイン & 履歴`,
        notes: [`全ボス曲を曲名寄せアレンジに整理`, `星屑のフーガを単旋律のフーガ提示に`, `決意の和声をフォルマント声合成に`, `バージョン履歴ページを追加`, `タイトルにバージョン表示`]
    }, {
        version: `1.3.0`,
        date: `2026-08-10`,
        title: `サウンドテスト拡張`,
        notes: [`曲ごとのコメント（最大2000文字）`, `アレンジ／演奏共有とURL最大20件`, `2段クッションURLと開封後のみ評価`, `好き／嫌い・定型報告（連携必須）`]
    }, {
        version: `1.2.0`,
        date: `2026-08-10`,
        title: `連携特典と進行シェア`,
        notes: [`アカウント連携・クラウド引き継ぎ`, `OPTレーザー／火炎放射・強化Lv20`, `サウンドテスト（ステージ／ボス／旧曲）`, `ショップから進行中シェア`]
    }, {
        version: `1.1.0`,
        date: `2026-08-09`,
        title: `コンテニューコイン`,
        notes: [`Xシェアからミッション達成でコイン`, `1〜4面ボス段階ミッション`, `インボックスとお礼メッセージ`, `イージー強化引き継ぎ`]
    }, {
        version: `1.0.0`,
        date: `2026-08-08`,
        title: `SWIPE FORCE 初版`,
        notes: [`スワイプ移動・自動連射シューティング`, `パワーショップと段階強化`, `64ボス・難易度 EASY／NORMAL`, `オプション・武装ON/OFF・仮想スティック`, `波形合成チップチューンBGM`]
    }];

function un() {
    return `v${cn}`
}
var Y = `SWF-CORE.HEXA-CLAW.VOID SERPENT.RAID TITAN.OMEGA FORCE.NEON HYDRA.GRID WRAITH.PULSE REAVER.ARC BEETLE.VECTOR MANTIS.BIT KRAKEN.SYNTH GOLIATH.ORBIT SPIDER.NOVA SCORPION.CHROME LOCUST.LASER MOTH.PHANTOM DISC.STORM WEDGE.ION COBRA.PLASMA SHARK.QUASAR FIST.ECHO DRAGON.STATIC WOLF.FLUX RAVEN.PRISM MANTLE.CYBER LOTUS.DARK DIODE.WARP HORNET.NULL SENTRY.RIFT CRAB.GLITCH OWL.BYTE BASILISK.SAW ANGEL.THORN CROWN.MAGNET HYENA.TURBO VIPER.CRYSTAL TOAD.SMOKE JACKAL.VOLT SCYTHE.MIRROR LOOM.ASH PHOENIX.RUST COLOSSUS.FROST DRIFTER.EMBER WHEEL.TOXIC ORBITER.SILENT ABYSS.HOWL ENGINE.CROWN ZERO.JAZZ KNIFE.PUNK ORBIT.SWING REAPER.RIFF DEMON.BEBOP SPIKE.MOSH TITAN.SAX WRAITH.DISTORT KING.BLUE NOTE-X.POWER CHORD.WALKING BASS.CRASH CYMBAL.ALTO STRIKER.FUZZ SERAPH.TEMPO BREAKER.FINAL SWIPE`.split(`.`),
    dn = [
        [`#aa44ff`, `#44ffcc`, `#ff66ff`],
        [`#ff44aa`, `#220033`, `#ff88cc`],
        [`#66ffaa`, `#228866`, `#ffffff`],
        [`#8866ff`, `#ff44ff`, `#44ffcc`],
        [`#ff2288`, `#00ffcc`, `#aa44ff`],
        [`#ffcc00`, `#ff6600`, `#ffff88`],
        [`#00aaff`, `#004488`, `#88eeff`],
        [`#ff3333`, `#880000`, `#ffaaaa`],
        [`#88ff00`, `#335500`, `#ccff66`],
        [`#ff00ff`, `#440044`, `#ffaaff`],
        [`#00ff88`, `#003322`, `#aaffcc`],
        [`#ffaa44`, `#663300`, `#ffe0aa`],
        [`#aaaaff`, `#222266`, `#ddddff`],
        [`#ff6688`, `#440022`, `#ffccd0`],
        [`#66ffee`, `#004444`, `#ccffff`],
        [`#ffee00`, `#444400`, `#ffffaa`]
    ];

function fn() {
    let e = [];
    for (let t = 0; t < 64; t++) {
        let n = dn[t % dn.length],
            r = t % 8,
            i = t * 3 % 8,
            a = (t * 5 + Math.floor(t / 8)) % 12,
            o = (t + Math.floor(t / 8)) % 8,
            s = 40 + t % 5 * 4 + (r === 3 || r === 7 ? 8 : 0),
            c = 32 + t % 4 * 3 + (r === 2 ? 6 : 0);
        e.push({
            id: t,
            name: Y[t] ?? `BOSS-${t+1}`,
            shape: r,
            move: i,
            atk: a,
            vibe: o,
            w: s,
            h: c,
            c1: n[0],
            c2: n[1],
            c3: n[2]
        })
    }
    return e
}
var pn = fn();

function mn(e) {
    return pn[((Math.max(1, e) - 1) % 64 + 64) % 64]
}

function hn(e) {
    return pn[(e % 64 + 64) % 64]
}
var gn = `swipe_force_player_v1`,
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

function Cn() {
    try {
        let e = localStorage.getItem(gn);
        return (!e || e.length < 6) && (e = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(e => (e % 36).toString(36)).join(``), localStorage.setItem(gn, e)), e
    } catch {
        return `guest`
    }
}

function wn(e) {
    try {
        let t = JSON.parse(localStorage.getItem(`swipe_force_coin_ledger_v1`) || `{}`);
        if (typeof t[e] == `number`) return Math.max(0, t[e] | 0);
        let n = Number(localStorage.getItem(`swipe_force_coins_v1`) || `0`);
        return Math.max(0, n | 0)
    } catch {
        return 0
    }
}

function Tn(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_coin_ledger_v1`) || `{}`);
        n[e] = Math.max(0, t | 0), localStorage.setItem(vn, JSON.stringify(n)), localStorage.setItem(_n, String(n[e]))
    } catch {}
}

function En(e, t) {
    let n = Math.max(0, wn(e) + t);
    return Tn(e, n), n
}

function Dn() {
    try {
        return JSON.parse(localStorage.getItem(`swipe_force_missions_v1`) || `{}`)
    } catch {
        return {}
    }
}

function On(e) {
    try {
        localStorage.setItem(yn, JSON.stringify(e))
    } catch {}
}

function kn() {
    try {
        return Array.from(crypto.getRandomValues(new Uint8Array(8))).map(e => (e % 36).toString(36)).join(``)
    } catch {
        return `s${Date.now().toString(36)}`
    }
}

function An(e) {
    return e ? {
        ...Dn()[e]
    } : {}
}

function jn(e, t) {
    return !!An(e)[t]
}

function Mn(e, t) {
    let n = Dn();
    n[e] = {
        ...n[e] || {},
        [t]: !0
    }, On(n)
}

function Nn(e) {
    let t = An(e);
    return Sn.every(e => t[e.id])
}

function Pn(e, t) {
    if (!e || !t) return !1;
    try {
        return !!JSON.parse(localStorage.getItem(`swipe_force_msg_sent_v1`) || `{}`)[`${t}>${e}`]
    } catch {
        return !1
    }
}

function Fn(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_msg_sent_v1`) || `{}`);
        n[`${t}>${e}`] = !0, localStorage.setItem(xn, JSON.stringify(n))
    } catch {}
}

function In(e, t, n) {
    return !!e && !!t && !!n && t !== n && Nn(e) && !Pn(e, n)
}

function Ln() {
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

function Rn(e, t) {
    try {
        let n = new URL(window.location.href);
        return n.searchParams.set(`ref`, e), n.searchParams.set(`sid`, t), n.hash = ``, n.toString()
    } catch {
        return `?ref=${e}&sid=${t}`
    }
}

function zn(e) {
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

function Bn(e, t = {}) {
    let n = kn(),
        r = Rn(e, n),
        i = zn(t),
        a = [`SWIPEFORCE`, `GrokBuild`, `シューティング`, `indiegames`].map(e => e.trim()).filter(Boolean).join(`,`),
        prof = {};
    try { prof = shareProfilePayload() || {}; } catch (err) { prof = {}; }
    let who = prof.displayName ? `パイロット「${String(prof.displayName).slice(0, 16)}」が助けを求めています` : ``,
        blurb = prof.shareBlurb ? String(prof.shareBlurb).slice(0, 40) : ``,
        o = [`SWIPE FORCE`, who, blurb, i, ``, `#SWIPEFORCE #GrokBuild #シューティング`, r].filter(e => e !== ``).join(`
`),
        s = `https://twitter.com/intent/tweet?text=${encodeURIComponent(o)}&hashtags=${encodeURIComponent(a)}`;
    try { noteHelpAsked(); } catch (err) {}
    return window.open(s, `_blank`, `noopener,noreferrer`), n
}
async function Vn(e) {
    let t = wn(e);
    try {
        let n = await fetch(`/api/share/balance?playerId=${encodeURIComponent(e)}`, {
            credentials: `same-origin`
        });
        if (!n.ok) return t;
        let r = await n.json(),
            i = Math.max(0, Number(r.coins) || 0),
            a = Math.max(t, i);
        return Tn(e, a), a > i && fetch(`/api/share/sync`, {
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
async function Hn(e) {
    let {
        sharerId: t,
        shareId: n,
        visitorId: r,
        missionId: i,
        playSeconds: a
    } = e, o = Sn.find(e => e.id === i);
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
    if (jn(n, i)) return {
        ok: !0,
        already: !0,
        coins: wn(t)
    };
    Mn(n, i);
    let s = En(t, o.coins);
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
        if (!e.ok) return {
            ok: !0,
            reason: `local_only`,
            coins: s
        };
        let o = await e.json();
        if (o.ok === !1 && (o.reason === `self` || o.reason === `too_fast`)) {
            let e = Dn();
            return e[t] && (delete e[t][i], On(e)), En(t, -1), {
                ok: !1,
                reason: o.reason
            }
        }
        let c = Math.max(s, Number(o.coins) || 0);
        return Tn(t, c), {
            ok: !0,
            already: !!o.already,
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
async function Un(e) {
    if (wn(e) <= 0) return {
        ok: !1,
        coins: 0
    };
    let t = En(e, -1);
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
                return Tn(e, t), {
                    ok: !1,
                    coins: t
                }
            }
            let i = Math.min(t, Math.max(0, Number(r.coins) ?? t));
            return Tn(e, i), {
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

function Wn(e) {
    return e ? e.source === `mission` && e.canThanks === !0 && e.thanksSent !== !0 : !1
}

function Gn(e) {
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
var Kn = `swipe_force_inbox_deleted_v1`,
    qn = `swipe_force_thanks_sent_v1`;

function Jn(e) {
    try {
        let t = JSON.parse(localStorage.getItem(e) || `[]`);
        return new Set(t)
    } catch {
        return new Set
    }
}

function Yn(e, t) {
    try {
        localStorage.setItem(e, JSON.stringify([...t]))
    } catch {}
}

function Xn(e) {
    try {
        let t = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`),
            n = Jn(Kn),
            r = Jn(qn);
        return (t[e] || []).map(e => Gn(e)).filter(e => !!e && !n.has(e.id)).map(e => r.has(e.id) ? {
            ...e,
            thanksSent: !0,
            canThanks: e.canThanks
        } : e)
    } catch {
        return []
    }
}

function Zn(e, t) {
    let n = Gn(t);
    if (n) try {
        let t = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`);
        t[e] = [n, ...(t[e] || []).filter(e => e.id !== n.id)].slice(0, 200), localStorage.setItem(bn, JSON.stringify(t))
    } catch {}
}

function Qn(e, t) {
    try {
        let n = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`);
        n[e] = (n[e] || []).filter(e => e.id !== t), localStorage.setItem(bn, JSON.stringify(n));
        let r = Jn(Kn);
        r.add(t), Yn(Kn, r)
    } catch {}
}
async function $n(e) {
    Qn(e.playerId, e.messageId);
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
async function er(e) {
    let t = At(e.text);
    if (!t.ok) return {
        ok: !1,
        reason: t.reason
    };
    let n = Xn(e.playerId).find(t => t.id === e.messageId);
    if (n && !Wn(n)) return {
        ok: !1,
        reason: n.thanksSent ? `already` : `not_mission`
    };
    if (Jn(qn).has(e.messageId)) return {
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
                    let t = Jn(qn);
                    t.add(e.messageId), Yn(qn, t)
                }
                return {
                    ok: !1,
                    reason: r.reason
                }
            }
            let i = Jn(qn);
            i.add(e.messageId), Yn(qn, i);
            try {
                let n = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`),
                    i = n[e.playerId] || [];
                n[e.playerId] = i.map(e => Gn(e)).filter(e => !!e).map(t => t.id === e.messageId ? {
                    ...t,
                    thanksSent: !0,
                    canThanks: !0,
                    source: `mission`
                } : t), localStorage.setItem(bn, JSON.stringify(n)), r.to && Zn(r.to, {
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
async function tr(e) {
    let t = At(e.text);
    if (!t.ok) return {
        ok: !1,
        reason: t.reason
    };
    let n = t.text;
    if (!e.shareId) return {
        ok: !1,
        reason: `share`
    };
    if (!Nn(e.shareId)) return {
        ok: !1,
        reason: `missions`
    };
    if (e.sharerId === e.visitorId) return {
        ok: !1,
        reason: `self`
    };
    if (Pn(e.shareId, e.visitorId)) return {
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
            return n.ok === !1 ? (n.reason === `already` && Fn(e.shareId, e.visitorId), {
                ok: !1,
                reason: n.reason
            }) : (Fn(e.shareId, e.visitorId), Zn(e.sharerId, r), {
                ok: !0
            })
        }
        return Fn(e.shareId, e.visitorId), Zn(e.sharerId, r), {
            ok: !0,
            reason: `local_only`
        }
    } catch {
        return Fn(e.shareId, e.visitorId), Zn(e.sharerId, r), {
            ok: !0,
            reason: `local_only`
        }
    }
}
async function nr(e) {
    let t = Xn(e),
        n = Jn(Kn),
        r = Jn(qn);
    try {
        let i = await fetch(`/api/share/message?playerId=${encodeURIComponent(e)}`);
        if (!i.ok) return t;
        let a = ((await i.json()).messages || []).map(e => Gn(e)).filter(e => !!e && !n.has(e.id)),
            o = new Map;
        for (let e of t) o.set(e.id, e);
        for (let e of a) {
            let t = o.get(e.id),
                n = Gn({
                    ...t,
                    ...e,
                    thanksSent: e.thanksSent || r.has(e.id) || t?.thanksSent
                });
            n && o.set(e.id, n)
        }
        try {
            let t = JSON.parse(localStorage.getItem(`swipe_force_msgs_v1`) || `{}`);
            t[e] = [...o.values()], localStorage.setItem(bn, JSON.stringify(t))
        } catch {}
        return [...o.values()]
    } catch {
        return t
    }
}
var rr = `swipe_force_linked_player_v1`,
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

function cr() {
    let e = {
            "Content-Type": `application/json`
        },
        t = o();
    return t && (e.Authorization = `Bearer ${t}`), e
}

function lr() {
    try {
        let e = localStorage.getItem(ir);
        return e || (e = Cn(), localStorage.setItem(ir, e)), e
    } catch {
        return Cn()
    }
}

function ur() {
    try {
        let e = localStorage.getItem(rr);
        if (e && e.length >= 4) return e
    } catch {}
    return lr()
}

function dr(e) {
    try {
        e ? localStorage.setItem(rr, e) : localStorage.removeItem(rr), e && localStorage.setItem(`swipe_force_player_v1`, e)
    } catch {}
}

function fr() {
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

function pr(e) {
    try {
        localStorage.setItem(ar, JSON.stringify(e))
    } catch {}
}

function mr(e, t) {
    let n = {
        ...e
    };
    return Object.keys(sr).forEach(r => {
        n[r] = Math.max(e[r] || 0, t[r] || 0)
    }), n
}

function hr(e, t) {
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

function gr(e, t, n, r, i) {
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
async function _r() {
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
        let n = await t.json();
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
async function vr() {
    let e = lr(),
        t = wn(e),
        n = fr(),
        r = Xn(e);
    try {
        let i = await (await fetch(`/api/account/link`, {
            method: `POST`,
            headers: cr(),
            credentials: `include`,
            body: JSON.stringify({
                guestPlayerId: e,
                guestCoins: t,
                easyUpgrades: n,
                inbox: r
            })
        })).json();
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
async function yr() {
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
async function br() {
    dr(null);
    try {
        let e = lr();
        localStorage.setItem(`swipe_force_player_v1`, e)
    } catch {}
}
var xr = t(),
    X = 320,
    Z = 400,
    Sr = 48,
    Cr = Sr,
    wr = 272,
    Tr = 224,
    Er = [{
        id: `shot`,
        name: `SHOT`,
        desc: `弾が広がる`,
        baseCost: 120,
        max: 3,
        tier: 1
    }, {
        id: `rate`,
        name: `RATE`,
        desc: `連射速度UP`,
        baseCost: 140,
        max: 3,
        tier: 1
    }, {
        id: `speed`,
        name: `SPEED`,
        desc: `機体が速くなる`,
        baseCost: 180,
        max: 3,
        tier: 1
    }, {
        id: `power`,
        name: `POWER`,
        desc: `弾の威力UP`,
        baseCost: 200,
        max: 3,
        tier: 1
    }, {
        id: `option`,
        name: `OPTION`,
        desc: `補助ユニット`,
        baseCost: 250,
        max: 2,
        tier: 1
    }, {
        id: `life`,
        name: `1UP`,
        desc: `残機+1`,
        baseCost: 400,
        max: 5,
        tier: 1,
        consumable: !0
    }, {
        id: `shield`,
        name: `SHIELD`,
        desc: `一時バリア`,
        baseCost: 300,
        max: 1,
        tier: 1,
        consumable: !0
    }, {
        id: `lockon`,
        name: `LOCK-ON`,
        desc: `ロックオンレーザー`,
        baseCost: 500,
        max: 3,
        tier: 2
    }, {
        id: `missile`,
        name: `MISSILE`,
        desc: `誘導ミサイル`,
        baseCost: 550,
        max: 3,
        tier: 2
    }, {
        id: `particle`,
        name: `PARTICLE`,
        desc: `荷電粒子砲`,
        baseCost: 600,
        max: 3,
        tier: 2
    }, {
        id: `hyper`,
        name: `HYPER`,
        desc: `ロック強化`,
        baseCost: 900,
        max: 2,
        tier: 3
    }, {
        id: `cluster`,
        name: `CLUSTER`,
        desc: `ミサイル強化`,
        baseCost: 900,
        max: 2,
        tier: 3
    }, {
        id: `overdrive`,
        name: `OVERDRIVE`,
        desc: `粒子砲強化`,
        baseCost: 1e3,
        max: 2,
        tier: 3
    }, {
        id: `beam`,
        name: `OPT-LASER`,
        desc: `オプション長レーザー`,
        baseCost: 1500,
        max: 10,
        tier: 4,
        linkOnly: !0
    }, {
        id: `flame`,
        name: `FLAME`,
        desc: `火炎放射`,
        baseCost: 1600,
        max: 10,
        tier: 4,
        linkOnly: !0
    }],
    Dr = {
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
    },
    Or = [`shot`, `rate`, `power`, `lockon`, `missile`, `particle`],
    kr = `swipe_force_hi_v1`,
    Ar = `swipe_force_opt_v5`,
    jr = `swipe_force_easy_up_v1`,
    Mr = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;

function Nr() {
    let e = (0, s.useRef)(null),
        t = (0, s.useRef)(null);
    return (0, s.useEffect)(() => {
        let n = e.current,
            o = t.current;
        if (!n || !o) return;
        let s = o,
            c = s.getContext(`2d`);
        if (!c) return;
        let l = c,
            u = !0,
            d = 0,
            f = 1,
            p = `attract`,
            m = 0,
            h = 0,
            g = Number(localStorage.getItem(kr) || `50000`) || 5e4,
            _ = 3,
            v = 1,
            y = 0,
            oe = 0,
            b = 0,
            x = 0,
            S = 0,
            T = 0,
            ye = 0,
            be = 0,
            xe = 0,
            Se = 0,
            Ce = 0,
            we = 0,
            Te = 0,
            Ee = 18,
            De = !1,
            E = ``,
            Oe = 0,
            ke = [`A`, `A`, `A`],
            Ae = 0,
            D = 0,
            je = ``,
            Me = 0,
            Ne = !1,
            O = {
                ...Dr
            },
            Pe = 0,
            Fe = !1,
            Ie = `easy`,
            k = 2,
            Le = 0,
            Re = !1,
            ze = 0,
            Be = 0,
            Ve = !1,
            A = `menu`,
            j = 0,
            M = ``,
            He = !1,
            Ue = 0,
            We = 0,
            Ge = !1,
            N = `title`,
            Ke = 0,
            P = ``,
            F = [],
            qe = 0,
            Je = ``,
            Ye = 0,
            I = !1,
            Xe = `menu`,
            L = {
                likes: 0,
                dislikes: 0,
                mine: null
            },
            Ze = `shop`,
            R = 0,
            z = `main`,
            Qe = ``,
            $e = 0,
            et = !1,
            tt = 0,
            nt = 0,
            rt = 0,
            it = 0,
            at = !1,
            ot = !1,
            st = 0,
            ct = 0,
            lt = 0,
            ut = !1;
        lr();
        let B = ur(),
            V = {
                linked: !1,
                playerId: B,
                name: null,
                email: null,
                image: null
            },
            dt = !1;
        async function ft(e = !1) {
            try {
                V = e ? await vr() : await _r(), B = V.linked && V.playerId ? V.playerId : ur(), ht = wn(B), It(), Bt()
            } catch {}
        }
        ft(!1);
        let pt = Ln(),
            H = pt.ref,
            U = pt.sid;
        H && H === B && (H = null, U = null), (!H || !U) && (H = null, U = null);
        let ht = wn(B),
            yt = 0,
            bt = !1,
            xt = ``,
            St = 0,
            Ct = !1,
            wt = 0,
            Tt = ``,
            Et = 0,
            Dt = U ? An(U) : {};

        function Ot() {
            Dt = U ? An(U) : {}
        }

        function kt() {
            return !!U && Nn(U)
        }

        function jt() {
            return !!H && !!U && In(U, H, B)
        }

        function Mt() {
            return !!U && Pn(U, B)
        }
        let G = [],
            Pt = 0,
            Ft = !1;

        function It() {
            nr(B).then(e => {
                G = e, Pt >= G.length && (Pt = Math.max(0, G.length - 1))
            })
        }
        It();
        let Lt = !1;

        function zt(e) {
            if (!Wn(e)) {
                C(), xt = e.source === `thanks` ? `お礼にはお礼できません` : e.thanksSent ? `この通はお礼済み` : `ミッション完了MSGのみお礼可`, St = 80;
                return
            }
            if (Lt) return;
            Lt = !0, w();
            let t = document.createElement(`div`);
            t.id = `sf-mail-dlg`, t.style.cssText = [`position:absolute`, `inset:0`, `z-index:80`, `display:flex`, `align-items:center`, `justify-content:center`, `background:rgba(0,10,8,0.78)`, `padding:16px`, `box-sizing:border-box`, `font-family:system-ui,sans-serif`].join(`;`), t.innerHTML = `
        <div style="width:min(340px,100%);background:#0a1a14;border:2px solid #ffcc66;border-radius:12px;padding:16px 14px;color:#dff;box-shadow:0 8px 32px #000;">
          <div style="font-size:15px;font-weight:700;color:#ffcc88;margin-bottom:4px;">🙏 お礼メッセージ</div>
          <div style="font-size:11px;color:#9a8;margin-bottom:10px;">この受信1通につき1回 · 相手のINBOXへ届きます</div>
          <textarea id="sf-mail-input" maxlength="80" rows="3" placeholder="ありがとう！楽しかった🎉"
            style="width:100%;box-sizing:border-box;resize:none;border-radius:8px;border:1px solid #2a6;background:#03140e;color:#efe;padding:10px;font-size:16px;line-height:1.4;"></textarea>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button type="button" id="sf-mail-cancel"
              style="flex:1;padding:12px;border-radius:8px;border:1px solid #456;background:#123;color:#9ab;font-size:14px;">キャンセル</button>
            <button type="button" id="sf-mail-send"
              style="flex:1.2;padding:12px;border-radius:8px;border:1px solid #fc6;background:#403010;color:#ffe;font-size:14px;font-weight:700;">お礼を送る</button>
          </div>
          <div id="sf-mail-status" style="margin-top:8px;min-height:1.2em;font-size:12px;color:#fc8;text-align:center;"></div>
        </div>`, n.style.position = `relative`, n.appendChild(t);
            let r = t.querySelector(`#sf-mail-input`),
                i = t.querySelector(`#sf-mail-status`),
                a = t.querySelector(`#sf-mail-send`),
                o = t.querySelector(`#sf-mail-cancel`);
            setTimeout(() => r?.focus(), 50), t.addEventListener(`pointerdown`, e => e.stopPropagation()), o.onclick = () => {
                vi(), w()
            }, a.onclick = () => {
                (async () => {
                    let t = At(r.value || ``);
                    if (!t.ok) {
                        i.textContent = Nt(t.reason), C();
                        return
                    }
                    a.disabled = !0, i.textContent = `送信中…`;
                    let n = await er({
                        playerId: B,
                        messageId: e.id,
                        text: t.text
                    });
                    n.ok ? (i.textContent = `お礼を送りました`, _e(), It(), yr(), setTimeout(() => vi(), 700)) : (i.textContent = n.reason === `already` ? `このメッセージには送信済み` : n.reason === `not_mission` ? `ミッション完了MSGのみ` : Nt(n.reason || `unsafe`), a.disabled = !1, C())
                })()
            }
        }

        function Bt() {
            Vn(B).then(e => {
                ht = e
            })
        }
        Bt();
        let Vt = () => ({
                shot: 99,
                rate: 99,
                power: 99,
                lockon: 99,
                missile: 99,
                particle: 99,
                hyper: 99,
                cluster: 99,
                overdrive: 99,
                option: 99,
                beam: 99,
                flame: 99
            }),
            Ht = () => ({
                master: 10,
                bgm: 8,
                sfx: 10,
                muted: !1,
                scanlines: !0,
                shake: !0,
                sense: 1,
                vstick: !0,
                wepLv: Vt()
            }),
            K = Ht();
        try {
            let e = localStorage.getItem(Ar);
            if (e) {
                let t = JSON.parse(e),
                    n = {
                        ...Vt(),
                        ...t.wepLv ?? {}
                    };
                t.wep && !t.wepLv && Object.keys(n).forEach(e => {
                    n[e] = t.wep?.[e] === !1 ? 0 : 99
                }), K = {
                    ...Ht(),
                    ...t,
                    wepLv: n
                }
            }
        } catch {}

        function Gt() {
            re(K.master / 10), ie(K.bgm / 10), ae(K.sfx / 10), te(K.muted), Fe = K.muted
        }

        function Kt() {
            try {
                localStorage.setItem(Ar, JSON.stringify(K))
            } catch {}
            Gt()
        }
        Gt();

        function qt(e) {
            return e === `shot` ? O.shot + 1 : e === `rate` ? O.rate : e === `power` ? O.power : O[e] || 0
        }

        function Jt(e) {
            return qt(e) > 0
        }

        function q(e) {
            let t = qt(e);
            if (t <= 0) return 0;
            let n = K.wepLv[e];
            return Math.max(0, Math.min(t, (n ?? t) | 0))
        }

        function Qt(e) {
            return q(e) > 0
        }

        function $t() {
            return [`shot`, `option`, `lockon`, `missile`, `particle`, `hyper`, `cluster`, `overdrive`, `beam`, `flame`].filter(e => Qt(e)).length
        }

        function en() {
            let e = $t();
            return e === 0 ? `DODGE` : `${e} ON`
        }

        function rn() {
            let e = [`shot`, `rate`, `power`, `option`].filter(e => Qt(e)).length;
            return !Qt(`shot`) && !Qt(`option`) ? `OFF ▶` : `${e} ON ▶`
        }

        function an() {
            if (z === `shot`) {
                let e = [{
                    kind: `header`,
                    label: `— SHOT 強化 · 左右=強度 —`
                }, {
                    kind: `weapon`,
                    key: `shot`,
                    label: `MAIN SHOT`
                }];
                return Jt(`rate`) && e.push({
                    kind: `weapon`,
                    key: `rate`,
                    label: `RATE`
                }), Jt(`power`) && e.push({
                    kind: `weapon`,
                    key: `power`,
                    label: `POWER`
                }), Jt(`option`) && e.push({
                    kind: `weapon`,
                    key: `option`,
                    label: `OPTION`
                }), e.push({
                    kind: `back`,
                    label: `◀ LOADOUTへ`
                }), e
            }
            if (z === `weapons`) {
                let e = [{
                    kind: `header`,
                    label: `— 解放武装 · SHOTは詳細へ —`
                }, {
                    kind: `submenu`,
                    key: `shot`,
                    label: `SHOT`
                }];
                for (let t of [{
                        key: `lockon`,
                        label: `LOCK-ON`
                    }, {
                        key: `missile`,
                        label: `MISSILE`
                    }, {
                        key: `particle`,
                        label: `PARTICLE`
                    }, {
                        key: `hyper`,
                        label: `HYPER LOCK`
                    }, {
                        key: `cluster`,
                        label: `CLUSTER`
                    }, {
                        key: `overdrive`,
                        label: `OVERDRIVE`
                    }, {
                        key: `beam`,
                        label: `OPT-LASER`
                    }, {
                        key: `flame`,
                        label: `FLAME`
                    }]) Jt(t.key) && e.push({
                    kind: `weapon`,
                    key: t.key,
                    label: t.label
                });
                return e.push({
                    kind: `back`,
                    label: `◀ オプションへ`
                }), e
            }
            return [{
                kind: `vol`,
                key: `master`,
                label: `MASTER VOL`
            }, {
                kind: `vol`,
                key: `bgm`,
                label: `BGM VOL`
            }, {
                kind: `vol`,
                key: `sfx`,
                label: `SFX VOL`
            }, {
                kind: `toggle`,
                key: `muted`,
                label: `MUTE`
            }, {
                kind: `toggle`,
                key: `scanlines`,
                label: `SCANLINES`
            }, {
                kind: `toggle`,
                key: `shake`,
                label: `SCREEN SHAKE`
            }, {
                kind: `toggle`,
                key: `vstick`,
                label: `V-STICK`
            }, {
                kind: `sense`,
                label: `MOVE SENSE`
            }, {
                kind: `submenu`,
                key: `weapons`,
                label: `WEAPON LOADOUT`
            }, {
                kind: `back`,
                label: `BACK`
            }]
        }
        let J = {
                x: X / 2,
                y: 352,
                w: 14,
                h: 12
            },
            Y = [],
            dn = [],
            fn = [],
            pn = [],
            gn = [],
            _n = [];
        for (let e = 0; e < 48; e++) _n.push({
            x: Cr + Math.random() * Tr,
            y: Math.random() * Z,
            s: 1 + e % 2,
            sp: .4 + e % 5 * .25
        });
        let vn = !1,
            yn = J.x,
            bn = J.y,
            xn = !1,
            Cn = 88,
            Tn = 348,
            En = 0,
            Dn = 0,
            On = new Set;

        function kn() {
            xn = !1, En = 0, Dn = 0
        }

        function jn() {
            let e = n.getBoundingClientRect(),
                t = Math.min(e.width / X, e.height / Z),
                r = Math.min(window.devicePixelRatio || 1, 2);
            s.style.width = `${Math.floor(X*t)}px`, s.style.height = `${Math.floor(Z*t)}px`;
            let i = Math.max(1, Math.floor(t * r));
            s.width = X * i, s.height = Z * i, l.setTransform(i, 0, 0, i, 0, 0), l.imageSmoothingEnabled = !1
        }
        jn();
        let Mn = new ResizeObserver(jn);
        Mn.observe(n);

        function Fn() {
            return O.shot >= 3 && O.rate >= 3 && O.speed >= 3 && O.power >= 3 && O.option >= 2
        }

        function Rn() {
            return O.lockon >= 3 && O.missile >= 3 && O.particle >= 3
        }

        function zn() {
            return V.linked ? 4 : Rn() ? 3 : Fn() ? 2 : 1
        }

        function Gn(e) {
            return e.consumable ? e.max : V.linked && Or.includes(e.id) ? 20 : (e.linkOnly || e.tier >= 4) && !V.linked ? 0 : e.max
        }

        function Kn() {
            let e = zn();
            return Er.filter(t => t.linkOnly || t.tier >= 4 ? V.linked : t.tier <= e)
        }

        function qn(e, t) {
            let n = 0,
                r = Math.min(D, Math.max(0, e.length - 1));
            return e.length > t && r >= 0 && (n = Math.max(0, Math.min(r, e.length - t)), r < n && (n = r), r >= n + t && (n = r - t + 1)), n
        }

        function Jn() {
            let e = [],
                t = 1e4,
                n = 1e4;
            for (let r = 0; r < 6; r++) e.push(t), n *= 2, t += n;
            return e
        }

        function Yn() {
            let e = Jn(),
                t = 0;
            for (let n of e)
                if (m >= n) t++;
                else break;
            return 2 ** t
        }

        function Xn() {
            return (Ie === `normal` ? 6 : 1) * Yn()
        }

        function Zn(e) {
            return Ie === `normal` ? e >= 4 ? 27 : e >= 3 ? 81 : e >= 2 ? 9 : 3 : 1
        }

        function Qn(e) {
            if (e.consumable) return Math.floor(e.baseCost * Zn(1));
            let t = O[e.id] || 0,
                n = e.baseCost * (1 + t * .65) * Zn(e.tier);
            return t >= 3 && (n *= 1.28 ** (t - 2)), t >= 10 && (n *= 1.15 ** (t - 9)), Math.floor(n)
        }

        function rr(e) {
            return e.consumable ? e.id === `life` && _ >= 5 || e.id === `shield` && Ce > 0 ? !1 : h >= Qn(e) : (e.linkOnly || e.tier >= 4) && !V.linked || O[e.id] >= Gn(e) ? !1 : h >= Qn(e)
        }

        function ir() {
            if (Ie === `easy`) {
                try {
                    localStorage.setItem(jr, JSON.stringify(O))
                } catch {}
                yr()
            }
        }

        function ar() {
            try {
                let e = localStorage.getItem(jr);
                if (!e) return {
                    ...Dr
                };
                let t = JSON.parse(e),
                    n = {
                        ...Dr
                    };
                return Object.keys(Dr).forEach(e => {
                    let r = Number(t[e]);
                    Number.isFinite(r) && r > 0 && (n[e] = Math.max(0, Math.min(20, r | 0)))
                }), n
            } catch {
                return {
                    ...Dr
                }
            }
        }

        function or(e) {
            return Object.keys(Dr).reduce((t, n) => t + e[n], 0)
        }

        function sr(e) {
            if (!rr(e)) {
                je = `PTS不足 / MAX`, Me = 60, C();
                return
            }
            let t = Qn(e);
            if (h -= t, e.id === `life`) _ = Math.min(5, _ + 1);
            else if (e.id === `shield`) Ce = 480;
            else {
                let t = e.id;
                O[t] = Math.min(Gn(e), O[t] + 1);
                let n = e.id;
                if (n in K.wepLv) {
                    let e = qt(n);
                    (K.wepLv[n] >= e - 1 || K.wepLv[n] > 50) && (K.wepLv[n] = e), Kt()
                }
                ir()
            }
            _e(), je = Ie === `easy` && !e.consumable ? `${e.name} GET! (EASY引継ぎ)` : `${e.name} GET!`, Me = 50, (Fn() || Rn() || V.linked && (O.beam > 0 || O.flame > 0)) && (Pe = 90)
        }

        function cr() {
            m = 0, h = 0, _ = 3, v = 1, O = Ie === `easy` ? ar() : {
                ...Dr
            }, Ce = 0, Se = 0, Y.length = 0, dn.length = 0, fn.length = 0, pn.length = 0, gn.length = 0, J.x = X / 2, J.y = 352, kn()
        }

        function dr() {
            Te = 0, Ee = 14 + v * 4, De = !1, E = ``, b = 40, x = 0, S = 0, T = 0, ye = 0, Y.length = 0, dn.length = 0, gn.length = 0, p = `ready`, oe = 90, Se = 60, kn(), W(`play`, v)
        }

        function fr(e = !1) {
            p = `shop`, Ne = e, D = 0, je = e ? `一時ショップ (戦闘一時停止)` : `PTSで強化せよ`, Me = 80, vn = !1, kn(), e || (Y.length = 0, dn.length = 0, gn.length = 0), w(), W(`attract`)
        }

        function pr() {
            Ne ? (p = `playing`, Se = Math.max(Se, 45), Ne = !1, De ? mt(mn(v).vibe, v) : W(`play`, v)) : (v++, dr()), w()
        }

        function mr(e) {
            Ze = e, p = `options`, z = `main`, R = 0, Qe = ``, $e = 0, vn = !1, kn(), w(), W(`attract`)
        }

        function hr() {
            if (Kt(), w(), z === `shot`) {
                z = `weapons`, R = 1;
                return
            }
            if (z === `weapons`) {
                z = `main`;
                let e = an().findIndex(e => e.kind === `submenu` && e.key === `weapons`);
                R = e >= 0 ? e : 0;
                return
            }
            Ze === `shop` ? p = `shop` : (p = `attract`, W(`attract`))
        }

        function gr(e) {
            let t = Math.max(0, Math.min(10, e));
            return `■`.repeat(t) + `□`.repeat(10 - t) + ` ${t}`
        }

        function xr(e) {
            if (e.kind === `vol`) return `◀${gr(K[e.key])}▶`;
            if (e.kind === `toggle`) return K[e.key] ? `ON` : `OFF`;
            if (e.kind === `sense`) return `◀ ${K.sense.toFixed(1)}x ▶`;
            if (e.kind === `submenu`) return e.key === `shot` ? rn() : `${en()} ▶`;
            if (e.kind === `weapon`) {
                let t = q(e.key),
                    n = qt(e.key);
                return t <= 0 ? `◀ OFF ▶` : `◀ Lv${t}/${n} ▶`
            }
            return e.kind === `back` ? `◀` : ``
        }

        function Nr(e) {
            let t = an();
            (R < 0 || R >= t.length) && (R = 0);
            let n = t[R];
            if (n.kind === `vol`) K[n.key] = Math.max(0, Math.min(10, K[n.key] + e));
            else if (n.kind === `toggle`) K[n.key] = !K[n.key], n.key === `vstick` && !K.vstick && kn();
            else if (n.kind === `sense`) K.sense = Math.round((K.sense + e * .1) * 10) / 10, K.sense = Math.max(.6, Math.min(1.6, K.sense));
            else if (n.kind === `submenu`) {
                n.key === `shot` ? (z = `shot`, R = 1) : (z = `weapons`, R = 1), w();
                return
            } else if (n.kind === `weapon`) {
                let t = qt(n.key),
                    r = q(n.key),
                    i = Math.max(0, Math.min(t, r + e));
                K.wepLv[n.key] = i, Qe = $t() === 0 ? `全武装OFF · 回避チャレンジ!` : i <= 0 ? `${n.label} OFF` : `${n.label} → Lv${i}/${t}`, $e = 55
            } else if (n.kind === `header`) return;
            else if (n.kind === `back`) {
                hr();
                return
            }
            Kt(), !K.muted && (n.kind === `vol` || n.kind === `toggle` && n.key === `muted`) && W(`attract`), w()
        }

        function Pr(e, t, n, r = 14) {
            for (let i = 0; i < r; i++) {
                let r = Math.random() * Math.PI * 2,
                    i = .5 + Math.random() * 2.8;
                fn.push({
                    x: e,
                    y: t,
                    vx: Math.cos(r) * i,
                    vy: Math.sin(r) * i,
                    life: 18 + Math.random() * 18,
                    max: 36,
                    color: n,
                    size: 1 + +(Math.random() > .6)
                })
            }
        }

        function Fr(e) {
            return dn.find(t => t.id === e)
        }

        function Ir(e) {
            return [...dn].filter(e => e.y > 10 && e.y < 420).sort((e, t) => (e.x - J.x) ** 2 + (e.y - J.y) ** 2 - ((t.x - J.x) ** 2 + (t.y - J.y) ** 2)).slice(0, e)
        }

        function Lr(e, t, n, r) {
            if (e.hp -= t, e.flash = 6, de(), e.hp <= 0) {
                let t = e.boss;
                Pr(e.x, e.y, e.boss ? `#ff66ff` : `#ffaa00`, t ? 28 : 12), fe(t), m += e.score, h += e.pts, pn.push({
                    x: e.x,
                    y: e.y,
                    text: `+${e.pts}`,
                    color: `#ffff66`,
                    life: 40
                }), e.boss || Te++, e.boss && (gi(), p = `stageclear`, oe = 120, he(), gt(), K.shake && (we = 12));
                let n = dn.indexOf(e);
                n >= 0 && dn.splice(n, 1)
            } else Pr(n, r, `#ffffff`, 3)
        }

        function Rr() {
            if (!(Se > 0)) {
                if (Ce > 0) {
                    Ce = 0, Se = 50, Pr(J.x, J.y, `#66ffff`, 10), pe();
                    return
                }
                _--, Se = 90, K.shake && (we = 10), pe(), Pr(J.x, J.y, `#ff2244`, 16), _ < 0 && (_ = 0, p = `gameover`, oe = 150, ge(), gt(), m > g && (g = m, localStorage.setItem(kr, String(g))))
            }
        }

        function zr() {
            let e = Math.random(),
                t = e < .45 ? 0 : e < .75 ? 1 : e < .92 ? 2 : 3,
                n = 64 + Math.random() * 192,
                r = Xn(),
                i = Math.floor(((t === 0 ? 2 : t === 1 ? 4 : t === 2 ? 6 : 10) + Math.floor(v / 3)) * r);
            dn.push({
                id: f++,
                x: n,
                y: -16,
                w: t === 3 ? 22 : 14,
                h: t === 3 ? 18 : 12,
                hp: i,
                maxHp: i,
                type: t,
                vx: (Math.random() - .5) * (1 + v * .05),
                vy: .6 + Math.random() * .5 + v * .03,
                phase: Math.random() * Math.PI * 2,
                flash: 0,
                score: (t + 1) * 100,
                pts: (t + 1) * 15 + v,
                boss: !1,
                bossId: 0,
                fireCd: 40 + Math.random() * 40
            })
        }

        function Br() {
            let e = mn(v);
            E = e.name, De = !0, p = `bossintro`, oe = 120, me(), hi(), mt(e.vibe, v);
            let t = Xn(),
                n = Math.floor((80 + v * 35) * t);
            dn.push({
                id: f++,
                x: X / 2,
                y: -40,
                w: e.w,
                h: e.h,
                hp: n,
                maxHp: n,
                type: 99,
                vx: 0,
                vy: .4,
                phase: 0,
                flash: 0,
                score: 5e3 + v * 500,
                pts: 200 + v * 40,
                boss: !0,
                bossId: e.id,
                fireCd: 30
            })
        }

        function Vr(e) {
            if (e.boss) {
                let t = hn(e.bossId).atk,
                    n = 3 + t % 4;
                for (let r = 0; r < n; r++) {
                    let i = Math.atan2(J.y - e.y, J.x - e.x) + (r - (n - 1) / 2) * .22,
                        a = 1.4 + t % 3 * .25;
                    Y.push({
                        x: e.x,
                        y: e.y + e.h * .3,
                        vx: Math.cos(i) * a,
                        vy: Math.sin(i) * a,
                        w: 3,
                        h: 3,
                        from: `e`,
                        dmg: 1,
                        kind: `normal`,
                        targetId: 0,
                        life: 200,
                        turn: 0
                    })
                }
                if (t % 3 == 0)
                    for (let t = -2; t <= 2; t++) Y.push({
                        x: e.x + t * 8,
                        y: e.y + 10,
                        vx: t * .3,
                        vy: 1.8,
                        w: 3,
                        h: 4,
                        from: `e`,
                        dmg: 1,
                        kind: `normal`,
                        targetId: 0,
                        life: 180,
                        turn: 0
                    })
            } else if (e.type >= 1) {
                let t = Math.atan2(J.y - e.y, J.x - e.x);
                Y.push({
                    x: e.x,
                    y: e.y + 6,
                    vx: Math.cos(t) * 1.6,
                    vy: Math.sin(t) * 1.6,
                    w: 3,
                    h: 3,
                    from: `e`,
                    dmg: 1,
                    kind: `normal`,
                    targetId: 0,
                    life: 160,
                    turn: 0
                })
            }
        }

        function Hr() {
            let e = q(`shot`),
                t = Math.max(0, e - 1),
                n = q(`overdrive`),
                r = q(`power`),
                i = Math.max(0, t - 3),
                a = 1 + r + +(n > 0) + Math.floor(i / 2);
            if (e > 0) {
                let e = [{
                    dx: 0,
                    dy: -6.5 - i * .05
                }];
                t >= 1 && e.push({
                    dx: -1.2,
                    dy: -6.2
                }, {
                    dx: 1.2,
                    dy: -6.2
                }), t >= 2 && e.push({
                    dx: -2.2,
                    dy: -5.6
                }, {
                    dx: 2.2,
                    dy: -5.6
                }), t >= 3 && e.push({
                    dx: -3.2,
                    dy: -5
                }, {
                    dx: 3.2,
                    dy: -5
                }), t >= 6 && e.push({
                    dx: -4,
                    dy: -4.4
                }, {
                    dx: 4,
                    dy: -4.4
                }), t >= 12 && e.push({
                    dx: -4.8,
                    dy: -3.8
                }, {
                    dx: 4.8,
                    dy: -3.8
                }), se();
                for (let t of e) Y.push({
                    x: J.x,
                    y: J.y - 10,
                    vx: t.dx,
                    vy: t.dy,
                    w: 2 + +(r > 1) + +(i > 4),
                    h: 6 + Math.min(14, r) + Math.floor(i / 3),
                    from: `p`,
                    dmg: a,
                    kind: `normal`,
                    targetId: 0,
                    life: 120,
                    turn: 0
                })
            }
            let o = q(`option`);
            o >= 1 && (e <= 0 && se(), Y.push({
                x: J.x - 16,
                y: J.y - 4,
                vx: 0,
                vy: -5.5,
                w: 2,
                h: 5,
                from: `p`,
                dmg: Math.max(1, a - 1),
                kind: `normal`,
                targetId: 0,
                life: 120,
                turn: 0
            })), o >= 2 && Y.push({
                x: J.x + 16,
                y: J.y - 4,
                vx: 0,
                vy: -5.5,
                w: 2,
                h: 5,
                from: `p`,
                dmg: Math.max(1, a - 1),
                kind: `normal`,
                targetId: 0,
                life: 120,
                turn: 0
            })
        }

        function Ur() {
            let e = q(`beam`);
            if (e <= 0 || !V.linked) return;
            let t = q(`power`),
                n = 4 + e * 2 + Math.floor(t / 2),
                r = 36 + e * 5,
                i = [],
                a = q(`option`);
            a >= 1 && i.push(-16), a >= 2 && i.push(16), i.length || i.push(0), ue();
            for (let t of i) Y.push({
                x: J.x + t,
                y: J.y - r / 2 - 8,
                vx: 0,
                vy: -16 - e * .4,
                w: 3 + Math.floor(e / 4),
                h: r,
                from: `p`,
                dmg: n,
                kind: `beam`,
                targetId: 0,
                life: 16 + e,
                turn: 0
            })
        }

        function Wr() {
            let e = q(`flame`);
            if (e <= 0 || !V.linked) return;
            let t = q(`power`),
                n = 3 + Math.min(8, e),
                r = 1 + Math.floor(e / 2) + Math.floor(t / 4);
            for (let t = 0; t < n; t++) {
                let t = .35 + e * .04,
                    n = -Math.PI / 2 + (Math.random() - .5) * t,
                    i = 2.2 + Math.random() * 1.4 + e * .08;
                Y.push({
                    x: J.x + (Math.random() - .5) * 6,
                    y: J.y - 8,
                    vx: Math.cos(n) * i,
                    vy: Math.sin(n) * i,
                    w: 5 + Math.floor(e / 3),
                    h: 5 + Math.floor(e / 3),
                    from: `p`,
                    dmg: r,
                    kind: `flame`,
                    targetId: 0,
                    life: 14 + e,
                    turn: 0
                })
            }
        }

        function Gr() {
            let e = q(`missile`);
            if (e <= 0) return;
            let t = q(`cluster`),
                n = e + (t > 0 ? t + 1 : 0),
                r = Ir(n),
                i = 2 + e + t;
            ce();
            for (let t = 0; t < n; t++) {
                let a = r[t % Math.max(1, r.length)],
                    o = -Math.PI / 2 + (t - (n - 1) / 2) * .35;
                Y.push({
                    x: J.x + Math.cos(o) * 6,
                    y: J.y - 6,
                    vx: Math.cos(o) * 2.5,
                    vy: Math.sin(o) * 2.5 - 1.5,
                    w: 4,
                    h: 4,
                    from: `p`,
                    dmg: i,
                    kind: `missile`,
                    targetId: a ? a.id : 0,
                    life: 160,
                    turn: .12 + e * .03
                })
            }
        }

        function Kr() {
            let e = q(`particle`);
            if (e <= 0) return;
            let t = q(`overdrive`),
                n = 4 + e * 2 + t * 3,
                r = 4 + e + t * 2;
            if (le(), Y.push({
                    x: J.x,
                    y: J.y - 14,
                    vx: 0,
                    vy: -9 - e,
                    w: r,
                    h: 14 + e * 2,
                    from: `p`,
                    dmg: n,
                    kind: `particle`,
                    targetId: 0,
                    life: 90,
                    turn: 0
                }), t >= 1)
                for (let e of [-1, 1]) Y.push({
                    x: J.x + e * 10,
                    y: J.y - 10,
                    vx: e * .8,
                    vy: -8,
                    w: r - 1,
                    h: 12,
                    from: `p`,
                    dmg: n - 1,
                    kind: `particle`,
                    targetId: 0,
                    life: 90,
                    turn: 0
                });
            if (t >= 2)
                for (let e of [-1, 1]) Y.push({
                    x: J.x,
                    y: J.y - 8,
                    vx: e * 2.5,
                    vy: -7,
                    w: 5,
                    h: 10,
                    from: `p`,
                    dmg: Math.floor(n * .7),
                    kind: `particle`,
                    targetId: 0,
                    life: 80,
                    turn: 0
                });
            Pr(J.x, J.y - 16, `#66ccff`, 6)
        }

        function qr() {
            let e = q(`lockon`);
            if (e <= 0) return;
            let t = q(`hyper`),
                n = Ir(e + (t > 0 ? t + 1 : 0)),
                r = 1 + e + t;
            n.length && ue();
            for (let i of n) gn.push({
                tx: i.x,
                ty: i.y,
                life: 8 + e * 2,
                color: t > 0 ? `#ff66ff` : `#00ffcc`
            }), fn.push({
                x: i.x,
                y: i.y,
                vx: 0,
                vy: 0,
                life: 10,
                max: 10,
                color: `#ff2244`,
                size: 3
            }), Lr(i, r, i.x, i.y)
        }

        function Q(e, t, n, r, i) {
            l.fillStyle = i, l.fillRect(Math.round(e), Math.round(t), Math.round(n), Math.round(r))
        }

        function $(e, t, n, r, i = 8, a = `left`) {
            l.fillStyle = r, l.font = `bold ${i}px "Courier New", monospace`, l.textAlign = a, l.textBaseline = `top`, l.fillText(e, t, n)
        }

        function Jr(e, t, n, r) {
            r || (l.save(), l.translate(Math.round(e), Math.round(t)), l.fillStyle = `#44ff88`, l.beginPath(), l.moveTo(0, -8), l.lineTo(7, 6), l.lineTo(3, 3), l.lineTo(0, 7), l.lineTo(-3, 3), l.lineTo(-7, 6), l.closePath(), l.fill(), Q(-2, -3, 4, 4, `#ffffff`), Q(-5, 5, 3, 4, `#ff8800`), Q(2, 5, 3, 4, `#ff8800`), l.restore())
        }

        function Yr() {
            let e = q(`option`);
            e >= 1 && (Q(J.x - 18, J.y - 2, 6, 6, `#88ff88`), Q(J.x - 16, J.y, 2, 2, `#fff`)), e >= 2 && (Q(J.x + 12, J.y - 2, 6, 6, `#88ff88`), Q(J.x + 14, J.y, 2, 2, `#fff`))
        }

        function Xr(e) {
            if (e.boss) {
                Zr(e);
                return
            }
            l.save(), l.translate(Math.round(e.x), Math.round(e.y)), e.flash > 0 && (l.globalAlpha = .5), e.type === 0 ? (Q(-6, -5, 12, 10, `#ff4466`), Q(-3, 3, 6, 4, `#ffaa00`)) : e.type === 1 ? (Q(-8, -6, 16, 12, `#44aaff`), Q(-4, -2, 8, 6, `#aaddff`)) : e.type === 2 ? (l.rotate(e.phase), Q(-6, -6, 12, 12, `#ff3333`), Q(-9, -2, 18, 4, `#ff8888`), Q(-2, -2, 4, 4, `#ffff00`)) : (Q(-14, -8, 10, 16, `#aa44ff`), Q(4, -8, 10, 16, `#aa44ff`), Q(-10, -4, 20, 12, `#44ffcc`), Q(-6, -10, 12, 6, `#ff88ff`)), l.restore()
        }

        function Zr(e) {
            let t = hn(e.bossId);
            l.save(), l.translate(Math.round(e.x), Math.round(e.y)), e.flash > 0 && (l.globalAlpha = .45 + .55 * Math.sin(y * 3));
            let n = t.shape,
                r = e.w / 2,
                i = e.h / 2;
            Q(-r, -i, e.w, e.h, t.c1), Q(-r + 4, -i + 4, e.w - 8, e.h - 8, t.c2), n % 2 == 0 ? (Q(-r - 6, -4, 8, 8, t.c3), Q(r - 2, -4, 8, 8, t.c3)) : Q(-6, -i - 6, 12, 8, t.c3), Q(-4, -4, 8, 8, `#ffffff`), l.restore();
            let a = Math.max(0, e.hp / e.maxHp);
            Q(58, 28, 204, 6, `#330011`), Q(58, 28, 204 * a, 6, `#ff2244`), $(t.name, X / 2, 18, `#ff66aa`, 8, `center`)
        }

        function Qr() {
            Q(0, 0, Sr, Z, `#0a1a0a`), Q(wr, 0, Sr, Z, `#0a1a0a`);
            for (let e of [0, wr]) $(`SWIPE`, e + 8, 20, `#00ff66`, 7), $(`FORCE`, e + 8, 30, `#00ff66`, 7), Q(e + 10, 50, 28, 28, `#113311`), l.strokeStyle = `#00aa44`, l.strokeRect(e + 10.5, 50.5, 27, 27), $(`SHOP`, e + 14, 60, `#88ff88`, 7), $(`TAP`, e + 16, 72, `#558855`, 6);
            p === `options` || p === `shop` ? $(Fe ? `MUTE` : `🔊`, 280, 378, `#223322`, 7) : $(Fe ? `MUTE` : `🔊`, 280, 378, `#66aa66`, 7)
        }

        function $r() {
            $(`SC ${String(m).padStart(7,`0`)}`, 52, 4, `#00ff88`, 8), $(`HI ${String(g).padStart(7,`0`)}`, 268, 4, `#ffff66`, 8, `right`), $(`PTS ${h}`, 52, 14, `#ffff66`, 8), $(`¢${ht}`, 118, 14, `#ffee88`, 8), $(`ST${v}`, 268, 14, `#88ffaa`, 8, `right`);
            let e = Yn();
            e > 1 && $(`ENEMY HP×${e}`, 52, 24, `#ff8866`, 7), Ie === `easy` ? $(`ESY`, 268, 24, `#88ff88`, 6, `right`) : $(`NRM`, 268, 24, `#ffaa66`, 6, `right`);
            let t = 52;
            for (let e = 0; e < _; e++) Q(t, 388, 6, 6, `#44ff88`), t += 9;
            let n = 52,
                r = [];
            O.lockon && r.push([`L`, q(`lockon`), O.lockon]), O.missile && r.push([`M`, q(`missile`), O.missile]), O.particle && r.push([`P`, q(`particle`), O.particle]), O.hyper && r.push([`H`, q(`hyper`), O.hyper]), O.cluster && r.push([`C`, q(`cluster`), O.cluster]), O.overdrive && r.push([`O`, q(`overdrive`), O.overdrive]), O.beam && r.push([`B`, q(`beam`), O.beam]), O.flame && r.push([`F`, q(`flame`), O.flame]), $t() === 0 ? ($(`DODGE ONLY`, n, 376, y % 20 < 12 ? `#ff88aa` : `#aa4466`, 7), n += 56) : Qt(`shot`) || ($(`SHOT OFF`, n, 376, `#aa4444`, 7), n += 48);
            for (let [e, t, i] of r) $(t > 0 ? `${e}${t}` : `${e}-`, n, 376, t > 0 ? t < i ? `#ffdd88` : `#88ffcc` : `#554444`, 7), n += 18;
            K.vstick ? $(`STICK`, 268, 376, `#448866`, 6, `right`) : $(`SWIPE`, 268, 376, `#448866`, 6, `right`), ei()
        }

        function ei() {
            if (!H) return;
            Q(52, 24, 216, 28, `#001a22`), l.strokeStyle = kt() ? `#ffee66` : y % 40 < 28 ? `#44ddaa` : `#228866`, l.strokeRect(52.5, 24.5, 215, 27), $(`MISSION`, 56, 27, `#66ffcc`, 7);
            let e = 100;
            for (let t of Sn) {
                let n = !!Dt[t.id];
                $(t.label, e, 27, n ? `#ffff66` : `#557766`, 7), $(n ? `✓` : `·`, e + 14, 27, n ? `#88ff88` : `#445544`, 7), e += 36
            }
            let t = Sn.find(e => !Dt[e.id]);
            kt() ? $(`ALL CLEAR · メッセージ送信可`, 56, 39, `#ffee88`, 7) : t && $(`NEXT: ${t.detail} → ¢+1`, 56, 39, `#ffcc66`, 7), Et > 0 && $(Tt, 264, 39, `#aaffff`, 6, `right`)
        }

        function ti(e) {
            if (!H) return;
            Ot(), Q(58, 90, 204, 72, `#001820`), l.strokeStyle = kt() ? `#ffee66` : `#44ffcc`, l.lineWidth = 2, l.strokeRect(58.5, 90.5, 203, 71), l.lineWidth = 1, $(`◆ SHARE MISSIONS`, e, 94, `#66ffee`, 9, `center`), $(`4段階 × 各1枚 = 最大4 COIN`, e, 106, `#ffcc66`, 7, `center`);
            let t = 118;
            for (let e of Sn) {
                let n = !!Dt[e.id];
                $(`${n?`✓`:`○`} ${e.detail}  →  ¢+1`, 66, t, n ? `#88ff88` : `#aabbcc`, 7), t += 10
            }
            kt() && (Mt() ? $(`このシェアではMSG送信済`, e, 152, `#88aa88`, 7, `center`) : $(`全クリア! このシェアでMSG 1回`, e, 152, `#ffff88`, 7, `center`))
        }

        function ni() {
            if (!K.vstick || p !== `playing` && p !== `ready` && p !== `bossintro`) return;
            let e = xn ? Cn : 86,
                t = xn ? Tn : 346,
                n = xn ? e + En * 30 : e,
                r = xn ? t + Dn * 30 : t,
                i = xn ? .55 : .28;
            l.save(), l.globalAlpha = i, l.strokeStyle = `#44ffaa`, l.lineWidth = 2, l.beginPath(), l.arc(e, t, 30, 0, Math.PI * 2), l.stroke(), l.strokeStyle = `#226644`, l.beginPath(), l.arc(e, t, 13.5, 0, Math.PI * 2), l.stroke(), l.strokeStyle = `#338855`, l.lineWidth = 1, l.beginPath(), l.moveTo(e - 30 + 4, t), l.lineTo(e + 30 - 4, t), l.moveTo(e, t - 30 + 4), l.lineTo(e, t + 30 - 4), l.stroke(), l.globalAlpha = xn ? .75 : .4, l.fillStyle = xn ? `#88ffcc` : `#44aa77`, l.beginPath(), l.arc(n, r, 11, 0, Math.PI * 2), l.fill(), l.strokeStyle = `#ffffff`, l.lineWidth = 1, l.stroke(), l.restore()
        }

        function ri() {
            let e = Kn(),
                t = qn(e, 10);
            Q(Cr, 0, Tr, Z, `#001400`), Q(54, 20, 212, 372, `#002200`), l.strokeStyle = `#00ff66`, l.strokeRect(54.5, 20.5, 211, 371), $(`POWER SHOP`, 62, 24, `#ffff00`, 11);
            let n = D === e.length + 2,
                r = D === e.length + 1;
            Q(150, 22, 58, 20, n ? `#442200` : `#221100`), l.strokeStyle = n ? `#ffcc66` : `#aa8844`, l.lineWidth = 2, l.strokeRect(150.5, 22.5, 57, 19), $(`𝕏 SHARE`, 179, 27, n ? `#ffeeaa` : `#ccaa66`, 8, `center`), Q(212, 22, 52, 20, r ? `#004466` : `#002233`), l.strokeStyle = r ? `#66eeff` : `#33aacc`, l.strokeRect(212.5, 22.5, 51, 19), l.lineWidth = 1, $(`⚙ OPT`, 238, 27, r ? `#ffffff` : `#88ddff`, 8, `center`), $(`PTS ${h}  ·  T${zn()}  ·  ${Ie===`normal`?`NRM`:`ESY SAVE`}`, X / 2, 46, Ie === `normal` ? `#ffaa66` : `#ffff66`, 8, `center`), $(Fn() ? Rn() ? `最終強化解放済み` : `上級兵器を全MAX → TIER3解放` : `基本強化を全MAX → TIER2兵器解放`, X / 2, 56, Pe > 0 && y % 10 < 5 ? `#ff66ff` : `#66aa66`, 6, `center`);
            for (let n = 0; n < Math.min(10, e.length); n++) {
                let r = n + t,
                    i = e[r],
                    a = 68 + n * 20,
                    o = r === D,
                    s = Qn(i),
                    c = !i.consumable && O[i.id] >= Gn(i),
                    u = i.tier === 3 ? `#ff88ff` : i.tier === 2 ? `#66ccff` : o ? `#fff` : `#88ff88`;
                o && (Q(58, a - 1, 204, 19, `#004400`), l.strokeStyle = `#00ff00`, l.strokeRect(58.5, a - .5, 203, 18)), $(i.name, 62, a + 3, u, 8), $(i.id === `life` ? `${_}/5` : i.id === `shield` ? Ce > 0 ? `ON` : `OK` : `Lv${O[i.id]}/${Gn(i)}`, 148, a + 3, `#66ccaa`, 7), $(c ? `MAX` : `${s}P`, 260, a + 3, c ? `#888` : rr(i) ? `#ffff00` : `#aa4444`, 8, `right`)
            }
            t > 0 && $(`▲`, X / 2, 60, `#00ff88`, 8, `center`), t + 10 < e.length && $(`▼`, X / 2, 336, `#00ff88`, 8, `center`);
            let i = 200 / 3,
                a = D === e.length;
            Q(56, 352, i, 32, n ? `#553300` : `#2a1800`), l.strokeStyle = n ? `#ffcc66` : `#aa7744`, l.lineWidth = 2, l.strokeRect(56.5, 352.5, 65.66666666666667, 31), $(`𝕏 SHARE`, 89.33333333333334, 358, n ? `#ffeeaa` : `#ddaa66`, 8, `center`), $(`進行度つき`, 89.33333333333334, 370, `#886644`, 6, `center`), Q(126.66666666666667, 352, i, 32, r ? `#005577` : `#003344`), l.strokeStyle = r ? `#88eeff` : `#44aacc`, l.strokeRect(127.16666666666667, 352.5, 65.66666666666667, 31), $(`⚙ OPT`, 160, 362, r ? `#ffffff` : `#aaddff`, 9, `center`), Q(197.33333333333334, 352, i, 32, a ? `#007700` : `#004400`), l.strokeStyle = a ? `#ffff00` : `#00aa44`, l.strokeRect(197.83333333333334, 352.5, 65.66666666666667, 31), l.lineWidth = 1, $(Ne ? `▶ GO` : `▶ NEXT`, 230.66666666666669, 362, a ? `#ffff00` : `#88ff88`, 9, `center`), Me > 0 ? $(je, X / 2, 388, `#ffaa00`, 6, `center`) : $(Ne ? `進行中SHAREで助けを呼べます` : `上下スワイプ · 空欄タップで決定`, X / 2, 388, `#335544`, 6, `center`)
        }

        function ii() {
            let e = an();
            R >= e.length && (R = Math.max(0, e.length - 1)), Q(Cr, 0, Tr, Z, `#001018`), Q(54, 18, 212, 370, `#001a22`), l.strokeStyle = z === `weapons` ? `#66ffaa` : `#00ccff`, l.strokeRect(54.5, 18.5, 211, 369), $(z === `shot` ? `SHOT TUNING` : z === `weapons` ? `WEAPON LOADOUT` : `OPTIONS`, X / 2, 22, z === `shot` || z === `weapons` ? `#88ffcc` : `#66eeff`, 11, `center`), $(z === `shot` ? `MAIN / RATE / POWER / OPTION を個別調整` : z === `weapons` ? `SHOTを開くと強化を個別ON/OFF` : `音量・操作 · 武装は下の LOADOUT へ`, X / 2, 36, `#448888`, 7, `center`);
            let t = 0;
            e.length > 14 && (t = Math.max(0, Math.min(R, e.length - 14)), R < t && (t = R), R >= t + 14 && (t = R - 14 + 1));
            for (let n = 0; n < Math.min(14, e.length); n++) {
                let r = n + t,
                    i = e[r],
                    a = 48 + n * 18,
                    o = r === R;
                if (i.kind === `header`) {
                    $(i.label, X / 2, a + 4, `#558888`, 7, `center`);
                    continue
                }
                o && (Q(60, a - 1, 200, 16, `#003344`), l.strokeStyle = `#00eeff`, l.strokeRect(60.5, a - .5, 199, 15));
                let s = i.kind === `weapon` ? q(i.key) > 0 ? o ? `#aaffcc` : `#66aa88` : o ? `#ffaaaa` : `#886666` : i.kind === `submenu` ? o ? `#aaffdd` : `#66ccaa` : o ? `#ffffff` : `#88aacc`;
                $(i.label, 64, a + 3, s, 8);
                let c = xr(i);
                c && $(c, 260, a + 3, i.kind === `weapon` ? q(i.key) > 0 ? `#66ff88` : `#ff6666` : i.kind === `submenu` ? `#88ffcc` : o ? `#ffff66` : `#668888`, 7, `right`)
            }
            t > 0 && $(`▲`, X / 2, 38, `#00ccff`, 7, `center`), t + 14 < e.length && $(`▼`, X / 2, 372, `#00ccff`, 7, `center`), $($e > 0 ? Qe : z === `shot` ? `上下=項目  左右=強度  空き=決定` : z === `weapons` ? `上下スワイプ  空きタップ=決定` : `上下=項目  左右=調整  空き=決定`, X / 2, 386, $e > 0 ? `#ffaa00` : `#446666`, 6, `center`)
        }

        function ai() {
            p = `changelog`, Le = 0, w()
        }

        function oi() {
            p = `attract`, w()
        }

        function si() {
            let e = 0;
            for (let t of ln) e += 3 + t.notes.length;
            return Math.max(0, e - 14)
        }

        function ci() {
            Q(Cr, 0, Tr, Z, `#000a12`), Q(54, 12, 212, 380, `#001018`), l.strokeStyle = `#44ffcc`, l.strokeRect(54.5, 12.5, 211, 379), $(`VERSION HISTORY`, X / 2, 20, `#88ffee`, 11, `center`), $(`NOW  ${un()}`, X / 2, 34, `#ffee88`, 8, `center`), $(`Grok Build iOS`, X / 2, 46, `#556666`, 6, `center`);
            let e = [];
            for (let t of ln) {
                e.push({
                    kind: `head`,
                    text: `v${t.version}  ${t.date}`,
                    color: `#88ffaa`
                }), e.push({
                    kind: `head`,
                    text: t.title,
                    color: `#ffee88`
                });
                for (let n of t.notes) e.push({
                    kind: `note`,
                    text: `· ${n}`,
                    color: `#99bbaa`
                });
                e.push({
                    kind: `gap`,
                    text: ``,
                    color: `#000`
                })
            }
            let t = Math.max(0, e.length - 14);
            Le > t && (Le = t);
            for (let t = 0; t < 14; t++) {
                let n = t + Le;
                if (n >= e.length) break;
                let r = e[n];
                if (r.kind === `gap`) continue;
                let i = 56 + t * 11,
                    a = r.kind === `head` ? 7 : 6;
                $(r.text.slice(0, 34), 62, i, r.color, a)
            }
            Le > 0 && $(`▲`, X / 2, 52, `#44aa88`, 7, `center`), Le < t && $(`▼`, X / 2, 364, `#44aa88`, 7, `center`), Q(60, 370, 200, 18, `#1a3030`), l.strokeStyle = `#6688aa`, l.strokeRect(60.5, 370.5, 199, 17), $(`◀ BACK`, X / 2, 375, `#aaccff`, 8, `center`)
        }

        function li(e, t) {
            Re = !0, ze = t, Be = 0, Ve = !1
        }

        function ui(e, t) {
            if (!Re || p !== `changelog`) return;
            let n = t - ze;
            for (Be += n, ze = t; Be <= -14;) Le = Math.max(0, Le - 1), Be += 14, Ve = !0, w();
            for (; Be >= 14;) Le = Math.min(si(), Le + 1), Be -= 14, Ve = !0, w()
        }

        function di(e, t) {
            if (Re) {
                if (Re = !1, Ve) {
                    Ve = !1;
                    return
                }(t >= 366 || e < Cr || e > wr) && oi()
            }
        }

        function fi() {
            l.fillStyle = `#001100`, l.fillRect(Cr, 0, Tr, Z);
            for (let e = 0; e < 400; e++) {
                let e = Cr + Math.random() * Tr,
                    t = Math.random() * Z,
                    n = 100 + Math.random() * 120;
                l.fillStyle = `rgb(0,${n|0},${n*.35|0})`, l.fillRect(e, t, 1, 1)
            }
            let e = X / 2;
            $(`SWIPE FORCE`, e, 28, `#00ff88`, 15, `center`), $(`RETRO VERTICAL SHOOTER`, e, 44, `#66aa66`, 7, `center`), $(un() + ` · Grok Build iOS`, e, 56, `#88cc88`, 8, `center`), $(`v1.5 プロフ / データ / シェア文`, e, 66, `#556666`, 6, `center`), Q(210, 6, 56, 18, V.linked ? `#0a3020` : `#1a2030`), l.strokeStyle = V.linked ? `#66ffaa` : `#6688aa`, l.strokeRect(210.5, 6.5, 55, 17), $(V.linked ? (V.name || `LINK`).slice(0, 6) : `LINK`, 238, 11, V.linked ? `#aaffcc` : `#aaccff`, 7, `center`), Q(68, 76, 184, 18, `#1a1500`), l.strokeStyle = `#ffcc44`, l.strokeRect(68.5, 76.5, 183, 17), $(`CONTINUE COIN  ×${ht}`, e, 80, ht > 0 ? `#ffee88` : `#887744`, 9, `center`), H ? ti(e) : $(`シェア先が1面ボス到達 → コインGET`, e, 96, `#558866`, 7, `center`), St > 0 && $(xt, e, H ? 148 : 110, `#ffaa00`, 7, `center`), $(`SELECT`, e, Z * .385, `#ffff66`, 7, `center`);
            let t = [Z * .395, Z * .45, Z * .50, Z * .55, Z * .60, Z * .65, Z * .70, Z * .75, Z * .81, Z * .87],
                n = or(ar()),
                r = [{
                    title: `EASY`,
                    sub: n > 0 ? `強化引継ぎ ${n}Lv` : `強化が次プレイに残る`,
                    h: 20
                }, {
                    title: `NORMAL`,
                    sub: `敵×6 · 強化リセット`,
                    h: 20
                }, {
                    title: `▶ START`,
                    sub: ``,
                    h: 16
                }, {
                    title: `𝕏 SHARE`,
                    sub: `ミッションでコイン`,
                    h: 16
                }, {
                    title: jt() ? `✉ MSG` : Mt() ? `✉ SENT` : G.length ? `✉ INBOX(${G.length})` : `✉ INBOX`,
                    sub: jt() ? `このシェアへの1回送信` : Mt() ? `このシェアは送信済` : `届いたメッセージ`,
                    h: 16
                }, {
                    title: `⚙ OPTIONS`,
                    sub: ``,
                    h: 15
                }, {
                    title: V.linked ? `♪ SOUND TEST` : `♪ SOUND TEST 🔒`,
                    sub: V.linked ? `全ステージ/ボス曲` : `連携で解放`,
                    h: 13
                }, {
                    title: V.linked ? `👤 PROFILE` : `👤 PROFILE 🔒`,
                    sub: V.linked ? `表示名/紹介/シェア文` : `連携で設定`,
                    h: 13
                }, {
                    title: `📊 DATA`,
                    sub: `時間・ヘルプ・強化`,
                    h: 13
                }, {
                    title: `📋 VER ${cn}`,
                    sub: `更新履歴`,
                    h: 13
                }];
            for (let n = 0; n < r.length; n++) {
                let i = t[n],
                    a = k === n,
                    o = r[n].h;
                a ? (Q(62, i - 2, 196, o, n === 3 ? `#221100` : n === 4 ? `#220022` : n === 5 ? `#002233` : n === 6 ? `#001a22` : `#003300`), l.strokeStyle = n === 3 ? `#ffaa44` : n === 4 ? `#ff88cc` : n === 5 ? `#66ccff` : n === 6 ? `#44ffcc` : `#ffff00`, l.strokeRect(62.5, i - 1.5, 195, o - 1)) : (l.strokeStyle = `#005500`, l.strokeRect(62.5, i - 1.5, 195, o - 1));
                let s = n === 0 ? a ? `#88ff88` : `#55aa55` : n === 1 ? a ? `#ffaa66` : `#aa6644` : n === 3 ? a ? `#ffcc66` : `#aa8844` : n === 4 ? a ? `#ffaadd` : `#aa6688` : n === 5 ? a ? `#aaddff` : `#5588aa` : a && y % 24 < 16 ? `#ffffff` : `#00ff88`;
                $(r[n].title, e, i + 2, s, 10, `center`), r[n].sub && $(r[n].sub, e, i + 13, a ? `#ccffcc` : `#446644`, 6, `center`)
            }
            $(`Grok Build iOS`, 56, 386, `#335533`, 6), $(`電気通信事業者 届出済`, 266, 386, `#2a4a2a`, 6, `right`)
        }

        function pi() {
            cr(), yt = performance.now(), bt = !1, Ot(), wt = 0, Tt = ``, Et = 0, ve(), dr();
            try { noteRunStart(); window.__sfPlayAcc = 0; } catch (err) {}
        }

        function mi(e) {
            if (!H || !U || Dt[e]) return;
            let t = (performance.now() - yt) / 1e3,
                n = Sn.find(t => t.id === e);
            Hn({
                sharerId: H,
                shareId: U,
                visitorId: B,
                missionId: e,
                playSeconds: t
            }).then(e => {
                Ot(), e.ok && !e.already ? (wt = 160, Tt = `${n.label} CLEAR!`, Et = 120, he(), pn.push({
                    x: X / 2,
                    y: Z * .3,
                    text: `${n.label} CLEAR!`,
                    color: `#ffff66`,
                    life: 100
                }), pn.push({
                    x: X / 2,
                    y: Z * .38,
                    text: `¢+1 → sharer`,
                    color: `#ffcc66`,
                    life: 100
                }), kt() && jt() && pn.push({
                    x: X / 2,
                    y: Z * .46,
                    text: `ALL CLEAR · MSG 1x`,
                    color: `#ffaadd`,
                    life: 120
                }), Bt()) : !e.ok && e.reason === `too_fast` && (Tt = `${n.label} 早すぎ`, Et = 90, pn.push({
                    x: X / 2,
                    y: Z * .35,
                    text: `TOO FAST`,
                    color: `#ff8888`,
                    life: 80
                }))
            })
        }

        function hi() {
            bt || v === 1 && (bt = !0, mi(`m1`))
        }

        function gi() {
            v === 2 ? mi(`m2`) : v === 3 ? mi(`m3`) : v === 4 && mi(`m4`)
        }

        function _i() {
            if (document.getElementById(`sf-account-dlg`)) return;
            w(), ee();
            let e = document.createElement(`div`);
            e.id = `sf-account-dlg`, e.setAttribute(`role`, `dialog`), e.style.cssText = [`position:absolute`, `inset:0`, `z-index:90`, `display:flex`, `align-items:flex-start`, `justify-content:flex-end`, `background:rgba(0,8,6,0.72)`, `padding:12px`, `box-sizing:border-box`, `font-family:system-ui,sans-serif`].join(`;`);
            let t = V.linked ? V.name || V.email || `LINKED` : `ゲスト`,
                o = r.map(e => `<button type="button" data-provider="${e.providerId}" class="sf-acc-btn"
                style="width:100%;padding:12px;margin-top:8px;border-radius:8px;border:1px solid #4a8;background:#0a2818;color:#cfe;font-size:14px;font-weight:600;cursor:pointer;">
                ${e.label===`X`?`𝕏`:e.label} で連携
              </button>`).join(``);
            e.innerHTML = `
        <div style="width:min(300px,100%);margin-top:8px;background:#061a12;border:2px solid #66ffaa;border-radius:12px;padding:14px 12px;color:#dff;box-shadow:0 8px 28px #000;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:14px;font-weight:700;color:#8ff;">アカウント連携</div>
            <button type="button" id="sf-acc-close" style="border:0;background:transparent;color:#9ab;font-size:18px;cursor:pointer;line-height:1;">×</button>
          </div>
          <div style="font-size:11px;color:#6a9;line-height:1.4;margin-bottom:10px;">
            X / Google と連携すると引き継ぎます<br>
            · コンティニューコイン<br>
            · イージーのパワーアップ<br>
            · INBOXメッセージ<br>
            · OPT-LASER / FLAME 解放<br>
            · 攻撃Lv20まで解禁<br>
            · SOUND TEST（全曲試聴）<br>
            · プロフィール / シェア文40字<br>
            · ゲーム情報（統計画面）
          </div>
          <div style="background:#03140e;border-radius:8px;padding:10px;border:1px solid #245;">
            <div style="font-size:10px;color:#6a8;">STATUS</div>
            <div id="sf-acc-status" style="font-size:13px;font-weight:700;color:${V.linked?`#8f8`:`#fc8`};margin-top:2px;">
              ${V.linked?`連携中`:`未連携（ゲスト）`}
            </div>
            <div id="sf-acc-name" style="font-size:12px;color:#cfe;margin-top:4px;word-break:break-all;">${t}</div>
            <div style="font-size:10px;color:#567;margin-top:6px;">ID ${B}</div>
            <div style="font-size:10px;color:#aa8;margin-top:2px;">COIN ×${ht}</div>
          </div>
          <div id="sf-acc-actions">${V.linked?`<button type="button" id="sf-acc-profile" style="width:100%;padding:12px;margin-top:10px;border-radius:8px;border:1px solid #4a8;background:#0a2818;color:#cfe;font-size:14px;font-weight:600;cursor:pointer;">プロフィール設定</button>
                <button type="button" id="sf-acc-stats" style="width:100%;padding:10px;margin-top:8px;border-radius:8px;border:1px solid #468;background:#0a1820;color:#adf;font-size:13px;cursor:pointer;">ゲーム情報</button>
                <button type="button" id="sf-acc-logout"
                  style="width:100%;padding:12px;margin-top:8px;border-radius:8px;border:1px solid #844;background:#2a1010;color:#fcc;font-size:14px;cursor:pointer;">連携解除</button>`:o}</div>
          <div id="sf-acc-msg" style="min-height:1.2em;margin-top:8px;font-size:11px;color:#fc8;text-align:center;"></div>
        </div>`, n.style.position = `relative`, n.appendChild(e);
            let s = e => e.stopPropagation();
            e.addEventListener(`pointerdown`, s), e.addEventListener(`touchstart`, s, {
                passive: !0
            });
            let c = e.querySelector(`#sf-acc-msg`);
            e.querySelector(`#sf-acc-close`).addEventListener(`click`, () => {
                e.remove(), w()
            }), (function(){
              var pr=e.querySelector(`#sf-acc-profile`);
              if(pr) pr.addEventListener(`click`, function(){ e.remove(); try{window.__sfOpenProfile()}catch(err){} });
              var st=e.querySelector(`#sf-acc-stats`);
              if(st) st.addEventListener(`click`, function(){ e.remove(); try{window.__sfOpenStats()}catch(err){} });
            })();
            e.querySelectorAll(`[data-provider]`).forEach(t => {
                t.addEventListener(`click`, () => {
                    (async () => {
                        if (dt) return;
                        dt = !0, c.textContent = `連携中…`;
                        let n = t.dataset.provider;
                        try {
                            await i(n, {
                                callbackURL: window.location.href
                            }), await ft(!0), c.textContent = `連携しました`, _e(), e.remove(), setTimeout(() => _i(), 200)
                        } catch (e) {
                            c.textContent = e instanceof Error ? e.message : `連携に失敗しました`, C()
                        } finally {
                            dt = !1
                        }
                    })()
                })
            });
            let l = e.querySelector(`#sf-acc-logout`);
            l && l.addEventListener(`click`, () => {
                (async () => {
                    if (!dt) {
                        dt = !0, c.textContent = `解除中…`;
                        try {
                            await br(), await a(window.location.href)
                        } catch {
                            await br(), B = ur(), V = {
                                linked: !1,
                                playerId: B,
                                name: null,
                                email: null,
                                image: null
                            }, ht = wn(B), e.remove(), w()
                        } finally {
                            dt = !1
                        }
                    }
                })()
            })
        }

        function vi() {
            let e = n.querySelector(`#sf-mail-dlg`);
            e && e.remove(), Lt = !1
        }

        function yi() {
            if (!H) {
                C();
                return
            }
            if (Mt()) {
                C(), xt = `このシェアでは送信済み`, St = 90;
                return
            }
            if (!kt()) {
                C(), xt = `全ミッションクリア後に送信可`, St = 90;
                return
            }
            if (Lt) return;
            w(), Lt = !0;
            let e = document.createElement(`div`);
            e.id = `sf-mail-dlg`, e.setAttribute(`role`, `dialog`), e.style.cssText = [`position:absolute`, `inset:0`, `z-index:80`, `display:flex`, `align-items:center`, `justify-content:center`, `background:rgba(0,10,8,0.78)`, `padding:16px`, `box-sizing:border-box`, `font-family:system-ui,sans-serif`].join(`;`), e.innerHTML = `
        <div style="width:min(340px,100%);background:#0a1a14;border:2px solid #66ffcc;border-radius:12px;padding:16px 14px;color:#dff;box-shadow:0 8px 32px #000;">
          <div style="font-size:15px;font-weight:700;color:#8ff;margin-bottom:4px;">✉ シェア主へメッセージ</div>
          <div style="font-size:11px;color:#6a9;margin-bottom:10px;">ミッション全クリア特典 · <b>1回のみ</b> · 最大40文字 · 絵文字OK</div>
          <textarea id="sf-mail-input" maxlength="80" rows="3" placeholder="ありがとう！楽しかった🎉"
            style="width:100%;box-sizing:border-box;resize:none;border-radius:8px;border:1px solid #2a6;background:#03140e;color:#efe;padding:10px;font-size:16px;line-height:1.4;"></textarea>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button type="button" id="sf-mail-cancel"
              style="flex:1;padding:12px;border-radius:8px;border:1px solid #456;background:#123;color:#9ab;font-size:14px;">キャンセル</button>
            <button type="button" id="sf-mail-send"
              style="flex:1.2;padding:12px;border-radius:8px;border:1px solid #8fc;background:#1a4030;color:#cff;font-size:14px;font-weight:700;">送信</button>
          </div>
          <div id="sf-mail-status" style="margin-top:8px;min-height:1.2em;font-size:12px;color:#fc8;text-align:center;"></div>
        </div>`, n.style.position = `relative`, n.appendChild(e);
            let t = e.querySelector(`#sf-mail-input`),
                r = e.querySelector(`#sf-mail-status`),
                i = e.querySelector(`#sf-mail-send`),
                a = e.querySelector(`#sf-mail-cancel`);
            setTimeout(() => t?.focus(), 50);
            let o = e => e.stopPropagation();
            e.addEventListener(`pointerdown`, o), e.addEventListener(`touchstart`, o, {
                passive: !0
            }), a.onclick = () => {
                vi(), w()
            }, i.onclick = () => {
                (async () => {
                    if (!H) return;
                    let e = At(t.value || ``);
                    if (!e.ok) {
                        r.textContent = Nt(e.reason), C(), t.focus();
                        return
                    }
                    i.disabled = !0, r.textContent = `送信中…`;
                    let n = await tr({
                        sharerId: H,
                        shareId: U,
                        visitorId: B,
                        text: e.text
                    });
                    n.ok ? (r.textContent = `送信しました！（再送不可）`, _e(), yr(), setTimeout(() => vi(), 700)) : (r.textContent = n.reason === `missions` ? `ミッション未完了` : n.reason === `already` ? `すでに送信済みです` : Nt(n.reason || `unsafe`), i.disabled = !1, C())
                })()
            }
        }

        function bi() {
            It(), yr(), p = `inbox`, Pt = 0, Ft = !1, w()
        }
        async function xi() {
            if (Ct || ht <= 0) return;
            Ct = !0;
            let e = await Un(B);
            if (ht = e.coins, Ct = !1, !e.ok) {
                C();
                return
            }
            _ = 1, Se = 150, Ce = Math.max(Ce, 180), p = `playing`, oe = 0, _e(), pn.push({
                x: J.x,
                y: J.y - 20,
                text: `CONTINUE!`,
                color: `#66ffcc`,
                life: 80
            }), De ? mt(mn(v).vibe, v) : W(`play`, v)
        }

        function Si(e = `この機能`) {
            return V.linked ? !0 : (Je = `${e}はアカウント連携が必要です`, Ye = 100, xt = Je, St = 100, C(), !1)
        }

        function Ci() {
            if (!V.linked) {
                xt = `SOUND TEST はアカウント連携特典です`, St = 90, C();
                return
            }
            ee(), A = `menu`, j = 0, M = ``, p = `soundtest`, W(`attract`), N = `title`, Ke = 0, M = `TITLE THEME`, Yt(`title`, B).then(e => {
                L = e
            }), w()
        }

        function wi() {
            p = `attract`, W(`attract`), M = ``, w()
        }

        function Ti() {
            return Rt(N, Ke)
        }

        function Ei() {
            let e = Ti(),
                t = N === `title` ? `TITLE` : N === `stage` ? `STAGE` : N === `boss` ? `BOSS` : `LEGACY`,
                n = N === `title` ? `#88ffcc` : N === `stage` ? `#88ccff` : N === `boss` ? `#ffcc88` : `#ccaa88`,
                r = vt(),
                i = M && !M.startsWith(`—`) ? M : ``;
            (!i || i === `TITLE THEME`) && (i = N === `title` ? r.labels.title : N === `stage` ? r.labels.stage(Ke) : N === `legacy` ? r.labels.legacy(Ke) : r.labels.boss(Ke));
            let a = i.length > 36 ? i.slice(0, 35) + `…` : i,
                o = `▶ ${t}${N===`title`?``:` #${String(Ke).padStart(2,`0`)}`}  ${a}`;
            return {
                key: e,
                cat: t,
                catColor: n,
                title: i,
                short: a,
                line: o
            }
        }

        function Di(e, t) {
            let n = Ei(),
                r = !!t?.compact,
                i = r ? 28 : 36;
            Q(58, e, 204, i, `#0a1a14`), l.strokeStyle = n.catColor, l.strokeRect(58.5, e + .5, 203, i - 1);
            let a = N === `title` ? 44 : 56;
            return Q(62, e + 5, a, 12, `#102820`), $(n.cat + (N === `title` ? `` : String(Ke).padStart(2, `0`)), 62 + a / 2, e + 7, n.catColor, 6, `center`), $(`この曲に対する評価・コメント`, 66 + a, e + 7, `#668877`, 6), $(n.short, 64, e + (r ? 16 : 20), `#ffeeaa`, r ? 7 : 8), r || $(`ID ${n.key}`, 258, e + 20, `#445544`, 5, `right`), i
        }

        function Oi(e, t = 0) {
            N = e, Ke = t, M = _t(e, t), Yt(Rt(e, t), B).then(e => {
                L = e
            })
        }
        async function ki(e) {
            Si(`曲の評価`) && (L = await Xt(Ti(), B, e), w())
        }
        async function Ai(e) {
            P = e, F = await Ut(e), qe = 0
        }

        function ji() {
            if (!M || M.startsWith(`—`)) {
                Je = `先に曲を再生してください`, Ye = 80, C();
                return
            }
            Xe = A === `menu` || A === `stage` || A === `boss` || A === `legacy` ? A : N === `title` ? `menu` : N;
            let e = Ti();
            Promise.all([Ai(e), Yt(e, B)]).then(([, e]) => {
                L = e, A = `comments`, qe = 0, w()
            })
        }

        function Mi() {
            A = Xe, w()
        }

        function Ni(e) {
            let t = e.kind === `arrange` ? `アレンジ` : e.kind === `cover` ? `演奏してみた` : `感想`,
                n = P || Ti(),
                r = document.createElement(`div`);
            r.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.82);display:flex;align-items:flex-start;justify-content:center;font-family:system-ui,sans-serif;padding:14px 10px;overflow:auto`;
            let i = document.createElement(`div`);
            i.style.cssText = `width:min(390px,96vw);background:linear-gradient(180deg,#0c1c16,#081410);border:2px solid #44ffaa;border-radius:12px;padding:14px;color:#dff;margin:auto;box-shadow:0 12px 40px rgba(0,0,0,.55)`;
            let a = Ei(),
                o = document.createElement(`div`);
            o.style.cssText = `background:#041810;border:1px solid #3a6;border-radius:8px;padding:8px 10px;margin-bottom:10px`, o.innerHTML = `<div style="font-size:10px;color:#8fd;font-weight:700">対象トラック</div>
        <div style="font-size:11px;color:#fc8">${a.cat}${N===`title`?``:` `+String(Ke).padStart(2,`0`)} · ${a.key}</div>
        <div style="font-size:13px;color:#ffe;font-weight:700;word-break:break-all">${a.title.replace(/[<>&]/g,``)}</div>`, i.appendChild(o);
            let s = document.createElement(`div`);
            s.style.cssText = `display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px`;
            let c = document.createElement(`div`);
            c.innerHTML = `<div style="font-size:12px;font-weight:700;color:#aef">${(e.from||`?`).replace(/[<>&]/g,``)}</div>
        <div style="font-size:10px;color:#7a9;margin-top:2px">${t} · ${(e.at||``).slice(0,19)}</div>`;
            let l = document.createElement(`button`);
            l.type = `button`, l.textContent = `✕`, l.style.cssText = `background:#1a3030;border:1px solid #456;color:#cde;border-radius:8px;width:32px;height:32px;font-size:14px;cursor:pointer`, l.onclick = () => r.remove(), s.appendChild(c), s.appendChild(l), i.appendChild(s);
            let u = document.createElement(`div`);
            u.style.cssText = `font-size:13px;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:#eef;background:#04140e;border:1px solid #1a4;border-radius:8px;padding:10px;margin-bottom:12px`, u.textContent = e.body, i.appendChild(u);

            function d(e, t, r) {
                let i = `link`;
                try {
                    i = new URL(e).hostname
                } catch {}
                let a = document.createElement(`div`);
                a.style.cssText = `position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif`;
                let o = document.createElement(`div`);
                o.style.cssText = `width:min(360px,94vw);background:#0a1418;border:2px solid #6cf;border-radius:14px;padding:16px;color:#eef;box-shadow:0 16px 48px rgba(0,0,0,.6)`, a.appendChild(o), document.body.appendChild(a);
                let s = () => a.remove(),
                    c = () => {
                        o.innerHTML = ``;
                        let a = t[e] || {
                                counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
                                mine: null,
                                visited: on(n, e)
                            },
                            u = !!(a.visited || on(n, e)),
                            d = document.createElement(`div`);
                        d.style.cssText = `font-size:13px;font-weight:800;color:#8ef;margin-bottom:4px`, d.textContent = `① クッション · 評価を見る`, o.appendChild(d);
                        let f = document.createElement(`div`);
                        f.style.cssText = `font-size:10px;color:#fc8;background:#1a1208;border:1px solid #643;border-radius:6px;padding:6px 8px;margin-bottom:8px;word-break:break-all`, f.textContent = `曲: ${Ei().line}`, o.appendChild(f);
                        let p = document.createElement(`div`);
                        p.style.cssText = `font-size:11px;color:#8ab;margin-bottom:10px;word-break:break-all`, p.textContent = `リンク先: ${i}`, o.appendChild(p);
                        let m = document.createElement(`div`);
                        m.style.cssText = `display:inline-block;padding:3px 8px;border-radius:999px;font-size:10px;margin-bottom:10px;border:1px solid ${u?`#4a6`:`#864`};background:${u?`#0f2a18`:`#2a1810`};color:${u?`#cfc`:`#fc8`}`, m.textContent = u ? `✓ 開封済み · 評価できます` : `未開封 · 飛んだ人だけ評価可`, o.appendChild(m);
                        let h = document.createElement(`div`);
                        h.style.cssText = `display:flex;flex-wrap:wrap;gap:6px;min-height:28px;margin-bottom:12px;padding:10px;background:#061018;border-radius:10px;border:1px solid #234`;
                        let g = !1;
                        for (let e of Zt) {
                            let t = a.counts[e.id] || 0;
                            if (!t) continue;
                            g = !0;
                            let n = document.createElement(`span`);
                            n.textContent = `${e.emoji} ${e.label} ${t}`, n.style.cssText = `padding:4px 8px;border-radius:999px;font-size:11px;border:1px solid ${e.tone===`good`?`#3a6`:e.tone===`warn`?`#a83`:`#a44`};color:#eef;background:#0a1512`, h.appendChild(n)
                        }
                        if (!g) {
                            let e = document.createElement(`span`);
                            e.style.cssText = `font-size:11px;color:#678`, e.textContent = `まだ評価がありません`, h.appendChild(e)
                        }
                        o.appendChild(h);
                        let _ = document.createElement(`div`);
                        _.style.cssText = `font-size:11px;font-weight:700;color:#9bc;margin-bottom:6px`, _.textContent = `定型評価`, o.appendChild(_);
                        let v = document.createElement(`div`);
                        v.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px`;
                        for (let i of Zt) {
                            let o = document.createElement(`button`);
                            o.type = `button`, o.disabled = !u, o.innerHTML = `<span>${i.emoji}</span> <span style="font-size:11px;font-weight:700">${i.label}</span>`;
                            let s = a.mine === i.id;
                            o.style.cssText = `display:flex;gap:6px;align-items:center;justify-content:center;padding:10px 6px;border-radius:8px;border:1px solid ${s?`#8f8`:`#456`};background:${u?s?`#1a4030`:`#122`:`#111`};color:${u?`#eef`:`#666`};cursor:${u?`pointer`:`not-allowed`};opacity:${u?`1`:`0.55`}`, o.onclick = () => {
                                if (u) {
                                    if (!V.linked) {
                                        C();
                                        return
                                    }(async () => {
                                        o.disabled = !0;
                                        let a = await nn(n, e, B, i.id);
                                        if (!a.ok) {
                                            C(), o.disabled = !1;
                                            return
                                        }
                                        t[e] = a, r(), w(), c()
                                    })()
                                }
                            }, v.appendChild(o)
                        }
                        if (o.appendChild(v), !u) {
                            let e = document.createElement(`div`);
                            e.style.cssText = `font-size:10px;color:#a86;margin-bottom:10px;line-height:1.4;padding:8px;background:#1a1008;border-radius:8px;border:1px solid #643`, e.textContent = `🔒 2段目のクッションから実際にリンクを開いた人だけが評価できます（スパム防止）`, o.appendChild(e)
                        }
                        let ee = document.createElement(`div`);
                        ee.style.cssText = `display:flex;flex-direction:column;gap:8px;margin-top:6px`;
                        let y = document.createElement(`button`);
                        y.type = `button`, y.textContent = `② 本当に開く（クッション2）→`, y.style.cssText = `padding:12px;border-radius:10px;border:1px solid #4af;background:linear-gradient(180deg,#1a4060,#102838);color:#dff;font-weight:800;font-size:13px;cursor:pointer`, y.onclick = () => {
                            w(), l()
                        };
                        let te = document.createElement(`button`);
                        te.type = `button`, te.textContent = `閉じる`, te.style.cssText = `padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd;cursor:pointer`, te.onclick = s, ee.appendChild(y), ee.appendChild(te), o.appendChild(ee)
                    },
                    l = () => {
                        o.innerHTML = ``;
                        let i = document.createElement(`div`);
                        i.style.cssText = `font-size:13px;font-weight:800;color:#fc8;margin-bottom:6px`, i.textContent = `② クッション · 外部サイトへ`, o.appendChild(i);
                        let a = document.createElement(`div`);
                        a.style.cssText = `font-size:11px;line-height:1.5;color:#cba;background:#1a1208;border:1px solid #864;border-radius:8px;padding:10px;margin-bottom:10px`, a.textContent = `ここから先は外部サイトです。内容・安全は保証されません。問題のあるリンクは戻って評価してください。`, o.appendChild(a);
                        let s = document.createElement(`div`);
                        s.style.cssText = `font-size:11px;word-break:break-all;color:#8cf;background:#061018;border-radius:8px;padding:10px;margin-bottom:12px;border:1px solid #246`, s.textContent = e, o.appendChild(s);
                        let l = document.createElement(`button`);
                        l.type = `button`, l.textContent = `サイトを開く`, l.style.cssText = `width:100%;padding:14px;border-radius:10px;border:1px solid #4f8;background:linear-gradient(180deg,#1a6040,#0e3020);color:#fff;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:8px`, l.onclick = () => {
                            (async () => {
                                if (!V.linked) {
                                    C();
                                    let e = document.createElement(`div`);
                                    e.textContent = `外部リンクを開くにはアカウント連携が必要です`, e.style.cssText = `font-size:11px;color:#fc8;margin:8px 0`, l.insertAdjacentElement(`beforebegin`, e);
                                    return
                                }
                                if (!await sn(n, e, B)) {
                                    C(), l.textContent = `連携してから開く`;
                                    return
                                }
                                t[e] = {
                                    ...t[e] || {
                                        counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
                                        mine: null
                                    },
                                    visited: !0
                                }, r(), window.open(e, `_blank`, `noopener,noreferrer`), w(), c()
                            })()
                        };
                        let u = document.createElement(`button`);
                        u.type = `button`, u.textContent = `← 評価画面に戻る`, u.style.cssText = `width:100%;padding:10px;border-radius:10px;border:1px solid #456;background:#1a2428;color:#bcd;cursor:pointer`, u.onclick = () => {
                            w(), c()
                        }, o.appendChild(l), o.appendChild(u)
                    };
                c(), a.addEventListener(`click`, e => {
                    e.target === a && s()
                })
            }
            if (e.urls && e.urls.length) {
                let t = document.createElement(`div`);
                t.style.cssText = `font-size:11px;font-weight:700;color:#8fd;margin:4px 0 8px;letter-spacing:.04em`, t.textContent = `LINKS  ·  2段クッション経由`, i.appendChild(t);
                let r = document.createElement(`div`);
                r.style.cssText = `display:flex;flex-direction:column;gap:10px`, i.appendChild(r);
                let a = {},
                    o = (e, t) => {
                        let r = a[t] || {
                                counts: Object.fromEntries(Zt.map(e => [e.id, 0])),
                                mine: null,
                                visited: on(n, t)
                            },
                            i = e.querySelector(`.stc-chips`),
                            o = e.querySelector(`.stc-lock`);
                        if (i) {
                            i.innerHTML = ``;
                            let e = !1;
                            for (let t of Zt) {
                                let n = r.counts[t.id] || 0;
                                if (!n && r.mine !== t.id) continue;
                                e = !0;
                                let a = document.createElement(`span`);
                                a.textContent = `${t.emoji}${t.label} ${n}`, a.style.cssText = `display:inline-flex;padding:2px 7px;border-radius:999px;font-size:10px;border:1px solid ${t.tone===`good`?`#3a6`:t.tone===`warn`?`#a83`:`#a44`};background:#0a1814;color:#eef`, i.appendChild(a)
                            }
                            if (!e) {
                                let e = document.createElement(`span`);
                                e.textContent = `評価なし`, e.style.cssText = `font-size:10px;color:#567`, i.appendChild(e)
                            }
                        }
                        if (o) {
                            let e = !!(r.visited || on(n, t));
                            o.textContent = e ? `開封済` : `未開封`, o.style.background = e ? `#0f2a18` : `#2a1810`, o.style.color = e ? `#cfc` : `#fc8`, o.style.borderColor = e ? `#3a6` : `#864`
                        }
                    };
                for (let t = 0; t < e.urls.length; t++) {
                    let n = e.urls[t],
                        i = n;
                    try {
                        i = new URL(n).hostname
                    } catch {}
                    let s = document.createElement(`div`);
                    s.style.cssText = `background:#061610;border:1px solid #245;border-radius:10px;padding:10px`;
                    let c = document.createElement(`div`);
                    c.style.cssText = `display:flex;gap:8px;align-items:flex-start`;
                    let l = document.createElement(`div`);
                    l.textContent = String(t + 1), l.style.cssText = `min-width:22px;height:22px;border-radius:6px;background:#1a4030;color:#9f8;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:700`;
                    let u = document.createElement(`div`);
                    u.style.cssText = `flex:1;min-width:0`;
                    let f = document.createElement(`div`);
                    f.textContent = i, f.style.cssText = `font-size:12px;color:#8cf;font-weight:700;word-break:break-all`;
                    let p = document.createElement(`div`);
                    p.className = `stc-chips`, p.style.cssText = `display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;min-height:18px`, u.appendChild(f), u.appendChild(p);
                    let m = document.createElement(`span`);
                    m.className = `stc-lock`, m.style.cssText = `flex-shrink:0;padding:3px 7px;border-radius:999px;font-size:9px;border:1px solid #864;background:#2a1810;color:#fc8`, m.textContent = `未開封`, c.appendChild(l), c.appendChild(u), c.appendChild(m), s.appendChild(c);
                    let h = document.createElement(`button`);
                    h.type = `button`, h.textContent = `クッションを開く（評価 → 移動）`, h.style.cssText = `margin-top:8px;width:100%;padding:9px;border-radius:8px;border:1px solid #4af;background:#123040;color:#cef;font-size:11px;font-weight:700;cursor:pointer`, h.onclick = () => {
                        w(), d(n, a, () => o(s, n))
                    }, s.appendChild(h), r.appendChild(s), o(s, n)
                }
                tn(n, e.urls, B).then(t => {
                    for (let [e, r] of Object.entries(t)) a[e] = {
                        ...r,
                        visited: r.visited || on(n, e)
                    };
                    r.querySelectorAll(`:scope > div`).forEach((t, n) => {
                        let r = e.urls[n];
                        r && o(t, r)
                    })
                })
            } else {
                let e = document.createElement(`div`);
                e.style.cssText = `font-size:11px;color:#567;margin-bottom:8px`, e.textContent = `リンクなし`, i.appendChild(e)
            }
            let f = document.createElement(`div`);
            f.style.cssText = `margin-top:14px;display:flex;justify-content:flex-end`;
            let p = document.createElement(`button`);
            p.type = `button`, p.textContent = `閉じる`, p.style.cssText = `padding:9px 16px;background:#1a3030;color:#cde;border:1px solid #456;border-radius:8px;font-weight:700;cursor:pointer`, p.onclick = () => r.remove(), f.appendChild(p), i.appendChild(f), r.appendChild(i), r.addEventListener(`click`, e => {
                e.target === r && r.remove()
            }), document.body.appendChild(r)
        }

        function Pi() {
            if (!Si(`コメント投稿`) || I) return;
            let e = P || Ti();
            I = !0;
            let t = document.createElement(`div`);
            t.style.cssText = `position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.78);display:flex;align-items:flex-start;justify-content:center;font-family:system-ui,sans-serif;overflow:auto;padding:16px 8px;`;
            let n = document.createElement(`div`);
            n.style.cssText = `width:min(360px,94vw);background:#0a1a14;border:2px solid #44ffaa;border-radius:10px;padding:14px;color:#dff;margin:auto;`;
            let r = Ei(),
                i = r.title.replace(/[<>&"']/g, ``);
            n.innerHTML = `
        <div style="font-size:13px;font-weight:700;margin-bottom:4px;color:#8f8">♪ コメント / アレンジ共有</div>
        <div style="background:#041810;border:1px solid #3a6;border-radius:8px;padding:8px 10px;margin-bottom:10px">
          <div style="font-size:10px;color:#8fd;font-weight:700;letter-spacing:.06em">この曲に投稿</div>
          <div style="font-size:11px;color:#fc8;margin-top:2px">${r.cat.replace(/[<>&"']/g,``)}${N===`title`?``:` `+String(Ke).padStart(2,`0`)}</div>
          <div style="font-size:13px;color:#ffe;font-weight:700;margin-top:2px;word-break:break-all">${i}</div>
          <div style="font-size:10px;color:#567;margin-top:2px">track: ${r.key}</div>
        </div>
        <div style="font-size:11px;color:#9ab;margin-bottom:6px">種類</div>
        <div id="stc-kinds" style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
          <button type="button" data-kind="note" class="stc-kind" style="padding:6px 10px;border-radius:6px;border:1px solid #4a6;background:#1a4030;color:#cfe;font-size:11px">感想</button>
          <button type="button" data-kind="arrange" class="stc-kind" style="padding:6px 10px;border-radius:6px;border:1px solid #456;background:#123;color:#9ab;font-size:11px">アレンジ</button>
          <button type="button" data-kind="cover" class="stc-kind" style="padding:6px 10px;border-radius:6px;border:1px solid #456;background:#123;color:#9ab;font-size:11px">演奏してみた</button>
        </div>
        <textarea id="stc-body" maxlength="2000" rows="5" placeholder="感想・アレンジの説明など（最大2000文字）" style="width:100%;box-sizing:border-box;background:#001a10;color:#efe;border:1px solid #2a6;border-radius:6px;padding:8px;font-size:13px;resize:vertical;min-height:90px"></textarea>
        <div id="stc-count" style="font-size:10px;color:#6a8;text-align:right;margin:2px 0 8px">0 / 2000</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-size:11px;color:#9ab">リンク URL（https）</div>
          <button id="stc-add-url" type="button" style="padding:4px 10px;background:#245;color:#def;border:1px solid #4a8;border-radius:6px;font-size:11px;font-weight:700">＋ ADD</button>
        </div>
        <div id="stc-urls" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"></div>
        <div style="font-size:10px;color:#678;margin-bottom:6px">動画・音源・譜面など最大20件。空欄は無視されます。</div>
        <div id="stc-status" style="font-size:11px;color:#aa8;min-height:16px;margin:6px 0"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="stc-cancel" type="button" style="padding:8px 12px;background:#234;color:#cde;border:1px solid #456;border-radius:6px">閉じる</button>
          <button id="stc-send" type="button" style="padding:8px 12px;background:#1a5;color:#fff;border:1px solid #4f8;border-radius:6px;font-weight:700">投稿</button>
        </div>`, t.appendChild(n), document.body.appendChild(t);
            let a = `note`,
                o = () => n.querySelectorAll(`.stc-kind`),
                s = () => {
                    o().forEach(e => {
                        let t = e,
                            n = t.dataset.kind === a;
                        t.style.background = n ? `#1a4030` : `#123`, t.style.borderColor = n ? `#4a6` : `#456`, t.style.color = n ? `#cfe` : `#9ab`
                    })
                };
            o().forEach(e => e.addEventListener(`click`, () => {
                a = e.dataset.kind || `note`, s()
            })), s();
            let c = n.querySelector(`#stc-urls`),
                l = n.querySelector(`#stc-status`),
                u = (e = ``) => {
                    if (c.children.length >= 20) {
                        l.textContent = `URLは20件まで`, C();
                        return
                    }
                    let t = document.createElement(`div`);
                    t.style.cssText = `display:flex;gap:6px;align-items:center`;
                    let n = document.createElement(`input`);
                    n.type = `url`, n.placeholder = `https://… (${c.children.length+1}/20)`, n.value = e, n.maxLength = 500, n.style.cssText = `flex:1;box-sizing:border-box;background:#001a10;color:#efe;border:1px solid #2a6;border-radius:6px;padding:7px 8px;font-size:12px`;
                    let r = document.createElement(`button`);
                    r.type = `button`, r.textContent = `×`, r.style.cssText = `padding:6px 8px;background:#422;color:#fcc;border:1px solid #644;border-radius:6px`, r.onclick = () => {
                        t.remove(), d()
                    }, t.appendChild(n), t.appendChild(r), c.appendChild(t), d()
                },
                d = () => {
                    [...c.querySelectorAll(`input`)].forEach((e, t) => {
                        e.placeholder = `https://… (${t+1}/20)`
                    })
                };
            u();
            let f = n.querySelector(`#stc-body`),
                p = n.querySelector(`#stc-count`),
                m = () => {
                    p && (p.textContent = `${f.value.length} / 2000`)
                };
            f.addEventListener(`input`, m), m(), n.querySelector(`#stc-add-url`).addEventListener(`click`, () => u());
            let h = () => {
                I = !1, t.remove()
            };
            n.querySelector(`#stc-cancel`).addEventListener(`click`, h), n.querySelector(`#stc-send`).addEventListener(`click`, () => {
                (async () => {
                    l.textContent = `送信中…`;
                    let t = [...c.querySelectorAll(`input`)].map(e => e.value),
                        n = await Wt(e, B, f.value, t, a);
                    n.ok ? (l.textContent = `投稿しました`, _e(), F = await Ut(e), setTimeout(h, 500)) : (l.textContent = n.reason === `link_required` ? `アカウント連携が必要です` : n.reason === `limit` ? `この曲は5件まで` : n.reason === `empty` ? `本文かURLを入れてください` : n.reason === `url` || n.reason === `url_limit` ? n.reason === `url_limit` ? `URLは20件まで` : `URLは https/http のみ` : n.reason === `long` ? `2000文字までです` : `使えない文字があります`, C())
                })()
            }), setTimeout(() => f.focus(), 50)
        }

        function Fi() {
            return [{
                label: `▶ TITLE THEME`,
                action: `title`
            }, {
                label: `STAGE BGM ×64`,
                sub: `各面テーマ`,
                action: `stage_list`
            }, {
                label: `BOSS THEME ×64`,
                sub: `物語アーク`,
                action: `boss_list`
            }, {
                label: `旧ボス曲 CHIP×64`,
                sub: `アーカイブ`,
                action: `legacy_list`
            }, {
                label: `■ STOP`,
                action: `stop`
            }, {
                label: `◀ BACK`,
                action: `back`
            }]
        }

        function Ii(e) {
            let t = vt(),
                n = [],
                r = e === `stage` ? t.stages : t.bosses;
            for (let i = 1; i <= r; i++) {
                let r = e === `stage` ? t.labels.stage(i) : e === `legacy` ? t.labels.legacy(i) : t.labels.boss(i);
                r.length > 28 && (r = r.slice(0, 27) + `…`), n.push({
                    label: r,
                    action: e,
                    n: i
                })
            }
            return n.push({
                label: `◀ BACK`,
                action: `back`,
                n: 0
            }), n
        }

        function Li() {
            if (ee(), A === `menu`) {
                let e = Fi()[j];
                if (!e) return;
                e.action === `title` ? (Oi(`title`, 0), w()) : e.action === `stage_list` ? (A = `stage`, j = 0, w()) : e.action === `boss_list` ? (A = `boss`, j = 0, w()) : e.action === `legacy_list` ? (A = `legacy`, j = 0, w()) : e.action === `stop` ? (gt(), M = `— STOPPED —`, w()) : e.action === `back` && wi();
                return
            }
            if (A === `comments`) return;
            let e = Ii(A)[j];
            if (e) {
                if (e.action === `back`) {
                    A = `menu`, j = 0, w();
                    return
                }(A === `stage` || A === `boss` || A === `legacy`) && Oi(A, e.n), w()
            }
        }

        function Ri() {
            if (Q(Cr, 0, Tr, Z, `#000a12`), Q(54, 14, 212, 376, `#001018`), l.strokeStyle = `#44ffcc`, l.strokeRect(54.5, 14.5, 211, 375), A === `comments`) {
                $(`COMMENTS`, X / 2, 18, `#88ffee`, 10, `center`);
                let e = Di(28, {
                    compact: !0
                });
                $(`コメント ${F.length} 件  ·  この曲専用`, X / 2, 28 + e + 4, `#668866`, 6, `center`);
                let t = 28 + e + 14,
                    n = 0;
                if (F.length > 10 && (n = Math.max(0, Math.min(qe, F.length - 10)), qe < n && (n = qe), qe >= n + 10 && (n = qe - 10 + 1)), !F.length) $(`まだコメントがありません`, X / 2, 120, `#556666`, 8, `center`), $(`WRITE で最初の感想を`, X / 2, 136, `#445555`, 7, `center`);
                else
                    for (let e = 0; e < Math.min(10, F.length); e++) {
                        let r = e + n,
                            i = F[r],
                            a = t + e * 22,
                            o = r === qe;
                        o && (Q(60, a - 1, 200, 20, `#003322`), l.strokeStyle = `#66ffaa`, l.strokeRect(60.5, a - .5, 199, 19));
                        let s = i.body.replace(/\n/g, ` `),
                            c = i.kind === `arrange` ? `🎹` : i.kind === `cover` ? `🎸` : `💬`,
                            u = i.urls?.length ? `🔗${i.urls.length}` : ``;
                        $(`${c}${(i.from||`?`).slice(0,5)}: ${s.slice(0,18)}${s.length>18?`…`:``} ${u}`, 64, a + 4, o ? `#ffffff` : `#99bbaa`, 7)
                    }
                $(V.linked ? `👍 ${L.likes}   👎 ${L.dislikes}` : `評価・投稿はアカウント連携必須`, X / 2, 348, V.linked ? `#88aa88` : `#aa8844`, 7, `center`), Q(58, 360, 46.5, 22, L.mine === 1 ? `#204020` : `#152018`), l.strokeStyle = L.mine === 1 ? `#88ff88` : `#446644`, l.strokeRect(58.5, 360.5, 45.5, 21), $(`👍`, 82.25, 366, `#ccffcc`, 8, `center`), Q(108.5, 360, 46.5, 22, L.mine === -1 ? `#402020` : `#201518`), l.strokeStyle = L.mine === -1 ? `#ff8888` : `#664444`, l.strokeRect(109, 360.5, 45.5, 21), $(`👎`, 132.75, 366, `#ffcccc`, 8, `center`), Q(159, 360, 46.5, 22, `#1a4030`), l.strokeStyle = `#66cc88`, l.strokeRect(159.5, 360.5, 45.5, 21), $(`✍`, 183.25, 366, `#ccffdd`, 8, `center`), Q(209.5, 360, 46.5, 22, `#203040`), l.strokeStyle = `#6688aa`, l.strokeRect(210, 360.5, 45.5, 21), $(`◀`, 233.75, 366, `#aaccff`, 8, `center`), Ye > 0 && $(Je, X / 2, 388, `#ffaa66`, 6, `center`);
                return
            }
            $(`SOUND TEST`, X / 2, 18, `#88ffee`, 11, `center`), $(`LINK PERK · 全曲試聴`, X / 2, 30, `#448866`, 6, `center`);
            let e = 38;
            M && !M.startsWith(`—`) ? (e = 38 + Di(36, {
                compact: !1
            }) + 4, $(`この曲の評価  👍${L.likes}  👎${L.dislikes}`, X / 2, e - 2, `#88aa88`, 6, `center`), e += 8) : ($(`曲を選ぶと、その曲の評価・コメントが対象になります`, X / 2, 48, `#556666`, 6, `center`), e = 58);
            let t = M && !M.startsWith(`—`) ? 9 : 12,
                n = e;
            if (A === `menu`) {
                let e = Fi();
                j >= e.length && (j = e.length - 1);
                for (let t = 0; t < e.length; t++) {
                    let r = n + t * 17,
                        i = t === j;
                    i && (Q(60, r - 1, 200, 15, `#003322`), l.strokeStyle = `#66ffaa`, l.strokeRect(60.5, r - .5, 199, 14)), $(e[t].label, 66, r + 2, i ? `#ffffff` : `#88ccaa`, 8), e[t].sub && $(e[t].sub, 258, r + 3, `#446655`, 6, `right`)
                }
            } else {
                let e = Ii(A);
                j >= e.length && (j = e.length - 1);
                let r = 0;
                e.length > t && (r = Math.max(0, Math.min(j, e.length - t)), j < r && (r = j), j >= r + t && (r = j - t + 1)), $(A === `stage` ? `STAGE THEMES` : A === `legacy` ? `LEGACY BOSS (旧曲)` : `STORY BOSS THEMES`, X / 2, 52, A === `legacy` ? `#aa8866` : `#66aacc`, 6, `center`);
                for (let i = 0; i < Math.min(t, e.length); i++) {
                    let t = i + r,
                        a = n + 2 + i * 17,
                        o = t === j;
                    o && (Q(60, a - 1, 200, 15, `#002233`), l.strokeStyle = `#66ccff`, l.strokeRect(60.5, a - .5, 199, 14));
                    let s = e[t].action === `back`;
                    $(e[t].label, 66, a + 2, o ? `#ffffff` : s ? `#888` : `#88aacc`, 8), !s && N === A && Ke === e[t].n && $(`▶`, 256, a + 2, `#ffee66`, 7, `right`)
                }
                r > 0 && $(`▲`, X / 2, n - 4, `#44aa88`, 7, `center`), r + t < e.length && $(`▼`, X / 2, 360, `#44aa88`, 7, `center`)
            }
            if (M && !M.startsWith(`—`)) {
                if (Q(58, 360, 63.33333333333333, 22, L.mine === 1 ? `#204020` : `#152018`), l.strokeStyle = L.mine === 1 ? `#88ff88` : `#446644`, l.strokeRect(58.5, 360.5, 62.33333333333333, 21), $(`👍${L.likes}`, 90.66666666666666, 366, L.mine === 1 ? `#ccffcc` : `#88aa88`, 7, `center`), Q(125.33333333333333, 360, 63.33333333333333, 22, L.mine === -1 ? `#402020` : `#201518`), l.strokeStyle = L.mine === -1 ? `#ff8888` : `#664444`, l.strokeRect(125.83333333333333, 360.5, 62.33333333333333, 21), $(`👎 ${L.dislikes}`, 158, 366, L.mine === -1 ? `#ffcccc` : `#aa8888`, 7, `center`), Q(192.66666666666666, 360, 63.33333333333333, 22, `#1a3028`), l.strokeStyle = `#55aa77`, l.strokeRect(193.16666666666666, 360.5, 62.33333333333333, 21), $(`💬感想`, 225.33333333333331, 366, `#aaffee`, 7, `center`), !V.linked) $(`評価・コメントは連携必須`, X / 2, 350, `#aa8844`, 6, `center`);
                else {
                    let e = Ei();
                    $(`対象: ${e.cat}${N===`title`?``:Ke} ${e.short.slice(0,16)}`, X / 2, 350, `#668866`, 5, `center`)
                }
            } else $(`上下スワイプ · タップ決定`, X / 2, 366, `#335544`, 6, `center`);
            Ye > 0 && $(Je, X / 2, 388, `#ffaa66`, 6, `center`)
        }

        function zi() {
            return A === `comments` ? 70 : M && !M.startsWith(`—`) ? 84 : 58
        }

        function Bi(e) {
            if (A === `comments`) return -1;
            let t = M && !M.startsWith(`—`) ? 9 : 12,
                n = zi();
            if (A === `menu`) {
                let t = Fi();
                for (let r = 0; r < t.length; r++) {
                    let t = n + r * 17;
                    if (e >= t - 1 && e < t + 17 - 1) return r
                }
                return -1
            }
            let r = Ii(A),
                i = 0;
            r.length > t && (i = Math.max(0, Math.min(j, r.length - t)), j < i && (i = j), j >= i + t && (i = j - t + 1));
            for (let a = 0; a < Math.min(t, r.length); a++) {
                let t = a + i,
                    r = n + a * 17;
                if (e >= r - 1 && e < r + 17 - 1) return t
            }
            return -1
        }

        function Vi(e, t) {
            if (e < Cr || e > wr) {
                A === `comments` ? Mi() : wi();
                return
            }
            if (He = !0, Ue = t, We = 0, Ge = !1, A === `comments`) {
                for (let e = 0; e < F.length; e++);
                return
            }
            let n = Bi(t);
            n >= 0 && (j = n)
        }

        function Hi(e, t) {
            if (!He || p !== `soundtest`) return;
            let n = t - Ue;
            if (We += n, Ue = t, A === `comments`) {
                let e = Math.max(0, F.length - 1);
                for (; We <= -15;) qe = Math.max(0, qe - 1), We += 15, Ge = !0, w();
                for (; We >= 15;) qe = Math.min(e, qe + 1), We -= 15, Ge = !0, w();
                return
            }
            let r = A === `menu` ? Fi().length - 1 : Ii(A).length - 1;
            for (; We <= -15;) j = Math.max(0, j - 1), We += 15, Ge = !0, w();
            for (; We >= 15;) j = Math.min(r, j + 1), We -= 15, Ge = !0, w()
        }

        function Ui(e, t) {
            if (!He) return;
            if (He = !1, Ge) {
                Ge = !1;
                return
            }
            if (e < Cr || e > wr) return;
            if (A === `comments`) {
                let n = 194 / 4;
                if (t >= 358 && t <= 386) {
                    let t = e - 58;
                    t < n ? ki(1) : t < n * 2 ? ki(-1) : t < n * 3 ? Pi() : Mi();
                    return
                }
                F.length ? F[qe] && Ni(F[qe]) : Pi();
                return
            }
            if (M && !M.startsWith(`—`) && t >= 358 && t <= 384) {
                let t = 196 / 3,
                    n = e - 58;
                n < t ? ki(1) : n < t * 2 ? ki(-1) : ji();
                return
            }
            let n = Bi(t);
            n >= 0 && (j = n), Li()
        }

        function Wi() {
            let e = p === `gameover` ? `gameover` : p === `bossintro` || p === `playing` && De ? `boss` : p === `shop` ? `shop` : p === `playing` || p === `ready` ? `playing` : `title`;
            Bn(B, {
                stage: v,
                score: m,
                difficulty: Ie,
                context: e,
                bossName: De || p === `bossintro` ? E : void 0,
                lives: _,
                continueCoins: ht
            }), xt = e === `gameover` ? `進行度つきでシェア · 助けを求めました` : `ハッシュタグ＆進行度つきでシェア`, St = 120, w()
        }

        function Gi(e, t) {
            if (e >= 210 && e <= 268 && t >= 4 && t <= 28) {
                _i();
                return
            }
            let n = [Z * .395, Z * .45, Z * .50, Z * .55, Z * .60, Z * .65, Z * .70, Z * .75, Z * .81, Z * .87],
                r = [16, 16, 14, 14, 14, 14, 13, 13, 13, 13];
            for (let e = 0; e < 10; e++)
                if (t >= n[e] - 2 && t <= n[e] + r[e]) {
                    e === 0 ? (Ie = `easy`, k = 0, w()) : e === 1 ? (Ie = `normal`, k = 1, w()) : e === 2 ? (k = 2, pi()) : e === 3 ? (k = 3, Wi()) : e === 4 ? (k = 4, H && jt() ? yi() : bi()) : e === 5 ? (k = 5, mr(`attract`)) : e === 6 ? (k = 6, Ci()) : (k = 7, ai());
                    return
                } k === 2 ? pi() : k === 3 ? Wi() : k === 4 ? H && jt() ? yi() : bi() : k === 5 ? mr(`attract`) : k === 6 ? Ci() : k === 7 ? (typeof window.__sfOpenProfile==="function"?window.__sfOpenProfile():0) : k === 8 ? (typeof window.__sfOpenStats==="function"?window.__sfOpenStats():0) : k === 9 ? ai() : (k = 2, w())
        }

        function Ki(e) {
            try {
              if (p === `playing` || p === `ready` || p === `bossintro`) {
                window.__sfPlayAcc = (window.__sfPlayAcc || 0) + (typeof e === "number" ? e : 0.016);
                if (window.__sfPlayAcc >= 1) { addPlayTime(window.__sfPlayAcc); window.__sfPlayAcc = 0; }
              }
            } catch (err) {}
            y++, we > 0 && (we *= .85), we < .2 && (we = 0), Me > 0 && Me--, $e > 0 && $e--, Ye > 0 && Ye--, St > 0 && St--, wt > 0 && wt--, Et > 0 && Et--, Ce > 0 && Ce--, Pe > 0 && Pe--;
            for (let e of _n) e.y += e.sp * (p === `playing` ? 1 : .3), e.y > Z && (e.y = 0, e.x = Cr + Math.random() * Tr);
            for (let e = pn.length - 1; e >= 0; e--) pn[e].y -= .45, pn[e].life--, pn[e].life <= 0 && pn.splice(e, 1);
            for (let e = gn.length - 1; e >= 0; e--) gn[e].life--, gn[e].life <= 0 && gn.splice(e, 1);
            for (let e = fn.length - 1; e >= 0; e--) {
                let t = fn[e];
                t.x += t.vx, t.y += t.vy, t.life--, t.life <= 0 && fn.splice(e, 1)
            }
            if (p === `attract` || p === `shop` || p === `options` || p === `soundtest` || p === `changelog`) return;
            if (p === `ready`) oe--, oe <= 0 && (p = `playing`);
            else if (p === `bossintro`) oe--, oe <= 0 && (p = `playing`);
            else if (p === `stageclear`) {
                oe--, oe <= 0 && fr(!1);
                return
            } else if (p === `gameover`) {
                y % 90 == 0 && Bt();
                return
            } else if (p === `name`) {
                Ae++;
                return
            } else if (p === `inbox`) return;
            if (p !== `playing` && p !== `ready` && p !== `bossintro`) return;
            let t = (120 + O.speed * 35) * K.sense,
                n = 0,
                r = 0;
            if ((On.has(`ArrowLeft`) || On.has(`a`) || On.has(`A`)) && --n, (On.has(`ArrowRight`) || On.has(`d`) || On.has(`D`)) && (n += 1), (On.has(`ArrowUp`) || On.has(`w`) || On.has(`W`)) && --r, (On.has(`ArrowDown`) || On.has(`s`) || On.has(`S`)) && (r += 1), n !== 0 || r !== 0) {
                let i = Math.hypot(n, r) || 1;
                J.x += n / i * t * e, J.y += r / i * t * e
            } else if (K.vstick && xn) Math.min(1, Math.hypot(En, Dn)) > .08 && (J.x += En * t * e, J.y += Dn * t * e);
            else if (!K.vstick && vn) {
                let t = Math.min(1, (12 + O.speed * 2) * K.sense * e);
                J.x += (yn - J.x) * t, J.y += (bn - J.y) * t
            }
            if (J.x = Math.max(58, Math.min(262, J.x)), J.y = Math.max(36, Math.min(382, J.y)), Se > 0 && Se--, p === `playing`) {
                if (x -= e * 60, x <= 0) {
                    (Qt(`shot`) || Qt(`option`)) && Hr();
                    {
                        let e = q(`rate`);
                        x = Math.max(2, 8 - e * (e > 3 ? .35 : 1.1))
                    }
                }
                if (S -= e * 60, S <= 0 && q(`missile`) > 0) {
                    Gr();
                    let e = q(`missile`),
                        t = q(`cluster`);
                    S = Math.max(22, 48 - e * 6 - t * 4)
                }
                if (T -= e * 60, T <= 0 && q(`particle`) > 0) {
                    Kr();
                    let e = q(`particle`),
                        t = q(`overdrive`);
                    T = Math.max(28, 70 - e * 8 - t * 6)
                }
                if (ye -= e * 60, ye <= 0 && q(`lockon`) > 0) {
                    qr();
                    let e = q(`lockon`),
                        t = q(`hyper`);
                    ye = Math.max(10, 22 - e * 2 - t * 2)
                }
                if (be -= e * 60, be <= 0 && q(`beam`) > 0 && V.linked) {
                    Ur();
                    let e = q(`beam`);
                    be = Math.max(28, 90 - e * 5)
                }
                if (xe -= e * 60, xe <= 0 && q(`flame`) > 0 && V.linked) {
                    Wr();
                    let e = q(`flame`);
                    xe = Math.max(4, 10 - Math.floor(e / 2))
                }
                De || (b--, b <= 0 && (zr(), b = Math.max(18, 50 - v * 2)), Te >= Ee && Br());
                for (let t = dn.length - 1; t >= 0; t--) {
                    let n = dn[t];
                    if (n.phase += e * 3, n.flash > 0 && n.flash--, n.boss) {
                        let e = hn(n.bossId);
                        if (n.y < 70) n.y += .6;
                        else {
                            let t = e.move;
                            t % 4 == 0 ? n.x += Math.sin(n.phase * .7) * 1.4 : t % 4 == 1 ? n.x += Math.sin(n.phase) * 2.2 : t % 4 == 2 ? (n.x += Math.cos(n.phase * .5) * 1.8, n.y = 70 + Math.sin(n.phase * .4) * 20) : n.x += Math.sin(n.phase * 1.3) * 1.1, n.x = Math.max(Cr + n.w / 2, Math.min(wr - n.w / 2, n.x))
                        }
                    } else n.x += n.vx, n.y += n.vy, n.type === 2 && (n.x += Math.sin(n.phase) * .8), (n.x < 56 || n.x > 264) && (n.vx *= -1);
                    n.fireCd--, n.fireCd <= 0 && n.y > 20 && n.y < 360 && (Vr(n), n.fireCd = n.boss ? 28 + n.bossId % 20 : 50 + Math.random() * 40), !n.boss && n.y > 430 && dn.splice(t, 1), Se <= 0 && Math.abs(n.x - J.x) < (n.w + J.w) * .35 && Math.abs(n.y - J.y) < (n.h + J.h) * .35 && (Rr(), n.boss || Lr(n, 999, n.x, n.y))
                }
                for (let e = Y.length - 1; e >= 0; e--) {
                    let t = Y[e];
                    if (t.life--, t.kind === `missile` && t.from === `p`) {
                        let e = t.targetId ? Fr(t.targetId) : void 0;
                        if (!e) {
                            let n = Ir(1)[0];
                            n && (t.targetId = n.id, e = n)
                        }
                        if (e) {
                            let n = Math.atan2(e.y - t.y, e.x - t.x),
                                r = Math.atan2(t.vy, t.vx),
                                i = n - r;
                            for (; i > Math.PI;) i -= Math.PI * 2;
                            for (; i < -Math.PI;) i += Math.PI * 2;
                            let a = r + Math.max(-t.turn, Math.min(t.turn, i)),
                                o = Math.hypot(t.vx, t.vy) || 3;
                            t.vx = Math.cos(a) * Math.min(5.5, o + .05), t.vy = Math.sin(a) * Math.min(5.5, o + .05)
                        }
                    }
                    if (t.x += t.vx, t.y += t.vy, t.life <= 0 || t.y < -20 || t.y > 420 || t.x < 28 || t.x > 292) {
                        Y.splice(e, 1);
                        continue
                    }
                    if (t.from === `p`) {
                        for (let n of dn)
                            if (Math.abs(t.x - n.x) < n.w / 2 + t.w && Math.abs(t.y - n.y) < n.h / 2 + t.h) {
                                Lr(n, t.dmg, t.x, t.y), t.kind !== `particle` && Y.splice(e, 1), K.shake && (we = Math.min(10, we + 1));
                                break
                            }
                    } else Se <= 0 && Math.abs(t.x - J.x) < 6 && Math.abs(t.y - J.y) < 7 && (Rr(), Y.splice(e, 1))
                }
            }
        }

        function qi() {
            l.fillStyle = `#000`, l.fillRect(0, 0, X, Z);
            let e = we ? (Math.random() - .5) * we : 0,
                t = we ? (Math.random() - .5) * we : 0;
            if (l.save(), l.translate(e, t), Q(Cr, 0, Tr, Z, `#000`), p === `attract`) fi();
            else if (p === `changelog`) ci();
            else if (p === `soundtest`) Ri();
            else if (p === `shop`) ri();
            else if (p === `options`) ii();
            else {
                for (let e of _n) Q(e.x, e.y, e.s, e.s, e.s > 1 ? `#aaffaa` : `#446644`);
                if (p === `playing` || p === `ready` || p === `stageclear` || p === `bossintro`) {
                    for (let e of gn) l.strokeStyle = e.color, l.globalAlpha = Math.min(1, e.life / 6), l.lineWidth = 1 + O.lockon * .4, l.beginPath(), l.moveTo(J.x, J.y - 6), l.lineTo(e.tx, e.ty), l.stroke(), l.strokeRect(e.tx - 6, e.ty - 6, 12, 12), l.globalAlpha = 1;
                    for (let e of Y)
                        if (e.from === `e`) Q(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h, `#ff3333`);
                        else if (e.kind === `missile`) Q(e.x - 2, e.y - 2, 4, 4, `#ffaa00`), Q(e.x - 1, e.y + 2, 2, 3, `#ff4400`);
                    else if (e.kind === `particle`) Q(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h, `#66eeff`), Q(e.x - e.w / 4, e.y - e.h / 2, e.w / 2, e.h, `#ffffff`);
                    else if (e.kind === `beam`) Q(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h, `#88ffff`), Q(e.x - 1, e.y - e.h / 2, 2, e.h, `#ffffff`);
                    else if (e.kind === `flame`) {
                        let t = e.life > 8 ? `#ffee44` : `#ff6622`;
                        Q(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h, t), Q(e.x - e.w / 4, e.y - e.h / 4, e.w / 2, e.h / 2, `#ffffff`)
                    } else Q(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h, q(`power`) >= 2 ? `#ffaa44` : `#ffff44`);
                    for (let e of dn) Xr(e);
                    Ce > 0 && (l.strokeStyle = y % 8 < 4 ? `#66ffff` : `#2288aa`, l.beginPath(), l.arc(J.x, J.y, 14, 0, Math.PI * 2), l.stroke()), Jr(J.x, J.y, 1, Se > 0 && Math.floor(Se / 3) % 2 == 0), Yr();
                    for (let e of fn) l.globalAlpha = Math.max(0, e.life / e.max), Q(e.x, e.y, e.size, e.size, e.color);
                    l.globalAlpha = 1;
                    for (let e of pn) l.globalAlpha = Math.min(1, e.life / 20), $(e.text, e.x, e.y, e.color, 8, `center`);
                    l.globalAlpha = 1, ni()
                }
                if (p === `ready` && ($(`STAGE ${v}`, X / 2, Z / 2 - 10, `#00ffaa`, 16, `center`), $(`GET READY`, X / 2, 212, `#ffffff`, 10, `center`)), p === `bossintro` && (Q(58, Z / 2 - 40, 204, 70, `#220011`), l.strokeStyle = y % 12 < 6 ? `#ff2244` : `#880000`, l.strokeRect(58.5, Z / 2 - 39.5, 203, 69), $(`WARNING!`, X / 2, Z / 2 - 28, `#ff2244`, 16, `center`), $(`BOSS APPROACHING`, X / 2, Z / 2 - 6, `#ffaa00`, 10, `center`), $(E, X / 2, 214, `#ff66ff`, 12, `center`)), p === `stageclear` && ($(`STAGE CLEAR`, X / 2, Z / 2 - 8, `#ffff00`, 14, `center`), $(`BOSS DEFEATED`, X / 2, 212, `#ff66ff`, 10, `center`), $(`→ POWER SHOP`, X / 2, 228, `#ffff66`, 9, `center`)), p === `gameover`) {
                    $(`GAME OVER`, X / 2, Z / 2 - 48, `#ff2244`, 18, `center`), $(`SCORE ${m}`, X / 2, Z / 2 - 24, `#00ff88`, 12, `center`), $(`CONTINUE COIN  ×${ht}`, X / 2, Z / 2 - 6, ht > 0 ? `#ffee88` : `#887744`, 10, `center`), $(`制限時間なし · シェアしてコイン待ちOK`, X / 2, 210, `#668866`, 7, `center`);
                    {
                        let e = ht > 0,
                            t = e && y % 24 < 16;
                        Q(72, 228, 176, 30, e ? `#223300` : `#111111`), l.strokeStyle = e ? t ? `#ffff00` : `#88aa00` : `#444444`, l.strokeRect(72.5, 228.5, 175, 29), $(e ? `▶ CONTINUE (−1 COIN)` : `▶ CONTINUE (コイン不足)`, X / 2, 237, e ? t ? `#ffff66` : `#ccff88` : `#555555`, 9, `center`)
                    }
                    Q(72, 264, 176, 28, `#221100`), l.strokeStyle = y % 30 < 18 ? `#ffaa44` : `#886622`, l.strokeRect(72.5, 264.5, 175, 27), $(`𝕏 SHARE してコインGET`, X / 2, 272, `#ffcc66`, 9, `center`), Q(88, 298, 144, 22, `#001100`), l.strokeStyle = `#335533`, l.strokeRect(88.5, 298.5, 143, 21), $(`→ TITLE`, X / 2, 303, `#668866`, 8, `center`)
                }
                if (p === `name`) {
                    $(`ENTER YOUR NAME!`, X / 2, Z * .28, `#ff3333`, 12, `center`), $(`BEST PLAYERS`, X / 2, Z * .36, `#00ffaa`, 10, `center`), $(`1ST  ${String(Math.max(g,5e4)).padStart(7,`0`)}  SWF`, X / 2, Z * .44, `#fff`, 9, `center`), $(`2ND  030000  FOR`, X / 2, Z * .5, `#fff`, 9, `center`), $(`3RD  ${String(m).padStart(7,`0`)}  ${ke.join(``)}`, X / 2, Z * .56, `#ff66ff`, 9, `center`);
                    for (let e = 0; e < 3; e++) {
                        let t = e === Oe && Ae % 20 < 12 ? `#ffff00` : `#00ff00`;
                        $(ke[e], X / 2 - 20 + e * 20, Z * .64, t, 16, `center`)
                    }
                }
                if (p === `inbox`) {
                    if (Q(56, 24, 208, 360, `#001018`), l.strokeStyle = `#66ccff`, l.strokeRect(56.5, 24.5, 207, 359), $(`INBOX`, X / 2, 32, `#88eeff`, 12, `center`), $(`消すまで残る · ミッションMSGのみお礼可`, X / 2, 46, `#446688`, 7, `center`), !G.length) $(`メッセージはありません`, X / 2, Z * .45, `#668888`, 8, `center`), $(`TAP=戻る`, X / 2, 372, `#556666`, 7, `center`);
                    else if (Ft) {
                        let e = G[Pt];
                        if (!e) Ft = !1;
                        else {
                            $(e.source === `thanks` ? `お礼メッセージ` : `ミッション完了メッセージ`, X / 2, 60, `#aaddff`, 9, `center`), $(`From ${e.from}`, X / 2, 78, `#88aacc`, 8, `center`);
                            let t = e.body;
                            $(t.slice(0, 18), X / 2, 110, `#ffffff`, 10, `center`), t.length > 18 && $(t.slice(18, 36), X / 2, 126, `#ffffff`, 10, `center`), t.length > 36 && $(t.slice(36, 40), X / 2, 142, `#ffffff`, 10, `center`), Wn(e) ? (Q(72, Z * .55, 176, 28, `#332200`), l.strokeStyle = `#ffcc66`, l.strokeRect(72.5, 220.50000000000003, 175, 27), $(`🙏 お礼を送る (1回)`, X / 2, 228.00000000000003, `#ffeeaa`, 9, `center`)) : e.source === `thanks` ? $(`お礼MSG · 返信不可`, X / 2, 228.00000000000003, `#889988`, 8, `center`) : $(`この通にはお礼送信済み`, X / 2, 228.00000000000003, `#889988`, 8, `center`), Q(72, Z * .68, 176, 26, `#220011`), l.strokeStyle = `#ff6688`, l.strokeRect(72.5, 272.5, 175, 25), $(`🗑 削除する`, X / 2, 279, `#ff99aa`, 9, `center`), Q(88, Z * .8, 144, 22, `#001820`), l.strokeStyle = `#446666`, l.strokeRect(88.5, 320.5, 143, 21), $(`◀ 一覧へ`, X / 2, 325, `#88aaaa`, 8, `center`)
                        }
                    } else {
                        let e = Math.max(0, Math.min(Pt, Math.max(0, G.length - 5)));
                        for (let t = 0; t < Math.min(5, G.length - e); t++) {
                            let n = G[e + t],
                                r = 58 + t * 48;
                            e + t === Pt && Q(62, r - 2, 196, 44, `#002233`), $(`${n.source===`thanks`?`お礼`:`完走`} From ${n.from.slice(0,8)}`, 66, r, n.source === `thanks` ? `#ffcc88` : `#88aacc`, 7), $(n.body.slice(0, 20), 66, r + 12, `#ffffff`, 9), $(Wn(n) ? `お礼可` : n.source === `thanks` ? `受信お礼` : n.thanksSent ? `お礼済` : `—`, 258, r + 12, Wn(n) ? `#ffcc66` : `#668866`, 7, `right`), $(n.source === `mission` ? `完走MSG` : `お礼MSG`, 66, r + 26, `#445566`, 6)
                        }
                        $(`選択TAP→詳細  下端=戻る`, X / 2, 372, `#556666`, 7, `center`)
                    }
                }
                p !== `name` && p !== `inbox` && $r()
            }
            if (l.restore(), Qr(), K.scanlines) {
                l.fillStyle = `rgba(0,0,0,0.12)`;
                for (let e = 0; e < Z; e += 2) l.fillRect(Cr, e, Tr, 1)
            }
        }
        let Ji = performance.now();

        function Yi(e) {
            if (!u) return;
            let t = (e - Ji) / 1e3;
            Ji = e, t > .05 && (t = .05), Ki(t), qi(), d = requestAnimationFrame(Yi)
        }
        d = requestAnimationFrame(Yi);

        function Xi(e, t) {
            let n = s.getBoundingClientRect();
            return {
                x: (e - n.left) / n.width * X,
                y: (t - n.top) / n.height * Z
            }
        }

        function Zi(e) {
            let t = Mr.indexOf(ke[Oe]);
            ke[Oe] = Mr[(t + e + 36) % 36]
        }

        function Qi(e, t) {
            if (e < Cr || e > wr) {
                Ne && pr();
                return
            }
            let n = Kn();
            if (t >= 22 && t <= 46) {
                if (e >= 150 && e <= 208) {
                    D = n.length + 2, Wi();
                    return
                }
                if (e >= 212 && e <= 264) {
                    D = n.length + 1, mr(`shop`);
                    return
                }
            }
            let r = qn(n, 10);
            for (let e = 0; e < Math.min(10, n.length); e++) {
                let i = e + r,
                    a = 68 + e * 20;
                if (t >= a - 1 && t < a + 20 - 1) {
                    D === i ? sr(n[i]) : (D = i, w());
                    return
                }
            }
            if (t >= 350 && t <= 388) {
                if (e >= 56 && e < 122.66666666666667) {
                    D = n.length + 2, Wi();
                    return
                }
                if (e >= 126.66666666666667 && e < 193.33333333333334) {
                    D = n.length + 1, mr(`shop`);
                    return
                }
                if (e >= 197.33333333333334 && e <= 264) {
                    D = n.length, pr();
                    return
                }
            }
            $i()
        }

        function $i() {
            let e = Kn();
            if (D < e.length) {
                sr(e[D]);
                return
            }
            if (D === e.length) {
                pr();
                return
            }
            if (D === e.length + 1) {
                mr(`shop`);
                return
            }
            if (D === e.length + 2) {
                Wi();
                return
            }
        }

        function ea() {
            return Kn().length + 2
        }

        function ta(e) {
            let t = ea();
            D = Math.max(0, Math.min(t, D + e)), w()
        }

        function na(e, t) {
            if (e < Cr || e > wr) {
                Ne && pr();
                return
            }
            ot = !0, st = e, ct = t, lt = 0, ut = !1;
            let n = Kn(),
                r = qn(n, 10);
            for (let e = 0; e < Math.min(10, n.length); e++) {
                let n = e + r,
                    i = 68 + e * 20;
                if (t >= i - 1 && t < i + 20 - 1) {
                    D = n;
                    return
                }
            }
            t >= 350 && (D = e < 122.66666666666667 ? n.length + 2 : e < 197.33333333333334 ? n.length + 1 : n.length)
        }

        function ra(e, t) {
            if (!ot || p !== `shop`) return;
            let n = t - ct,
                r = e - st;
            if (Math.abs(n) >= Math.abs(r) * .65) {
                for (lt += n, ct = t, st = e; lt <= -16;) ta(-1), lt += 16, ut = !0;
                for (; lt >= 16;) ta(1), lt -= 16, ut = !0;
                return
            }
            st = e, ct = t
        }

        function ia(e, t) {
            if (ot) {
                if (ot = !1, ut) {
                    ut = !1;
                    return
                }
                Qi(e, t)
            }
        }

        function aa(e) {
            let t = an(),
                n = 0;
            t.length > 14 && (n = Math.max(0, Math.min(R, t.length - 14)), R < n && (n = R), R >= n + 14 && (n = R - 14 + 1));
            for (let r = 0; r < Math.min(14, t.length); r++) {
                let t = r + n,
                    i = 48 + r * 18;
                if (e >= i - 1 && e < i + 18 - 1) return t
            }
            return -1
        }

        function oa(e, t) {
            let n = an();
            if (!n.length) return 0;
            let r = e;
            for (let e = 0; e < n.length; e++)
                if (r = (r + t + n.length) % n.length, n[r].kind !== `header`) return r;
            return e
        }

        function sa(e, t) {
            if (e < Cr || e > wr) {
                hr();
                return
            }
            et = !0, tt = e, nt = t, rt = 0, it = 0, at = !1;
            let n = aa(t);
            n >= 0 && an()[n].kind !== `header` && (R = n)
        }

        function ca(e, t) {
            if (!et || p !== `options`) return;
            let n = e - tt,
                r = t - nt;
            if (Math.abs(r) > Math.abs(n) * .85) {
                for (it += r, tt = e, nt = t; it <= -15;) R = oa(R, -1), it += 15, at = !0, w();
                for (; it >= 15;) R = oa(R, 1), it -= 15, at = !0, w();
                return
            }
            let i = an()[R];
            if (!i || i.kind !== `vol` && i.kind !== `sense` && i.kind !== `weapon`) {
                tt = e, nt = t;
                return
            }
            if (Math.abs(n) < Math.abs(r) * .7) {
                tt = e, nt = t;
                return
            }
            rt += n, tt = e, nt = t;
            let a = i.kind === `weapon` ? 18 : 14;
            for (; rt >= a;) Nr(1), rt -= a, at = !0;
            for (; rt <= -a;) Nr(-1), rt += a, at = !0
        }

        function la(e) {
            let t = an();
            if (!t.length) return;
            let n = Math.max(0, Math.min(t.length - 1, e));
            t[n].kind === `header` && (n = oa(n, 1));
            let r = t[n];
            if (!(!r || r.kind === `header`)) {
                if (R = n, r.kind === `back`) {
                    hr();
                    return
                }
                if (r.kind === `submenu`) {
                    r.key === `shot` ? (z = `shot`, R = 1) : (z = `weapons`, R = 1), w();
                    return
                }
                if (r.kind === `toggle`) {
                    Nr(1);
                    return
                }
                if (r.kind === `vol` || r.kind === `sense` || r.kind === `weapon`) {
                    Qe = `${r.label}  OK`, $e = 40, w();
                    return
                }
                Nr(1)
            }
        }

        function ua(e, t) {
            if (!et) return;
            if (et = !1, at) {
                at = !1;
                return
            }
            if (e < Cr || e > wr) return;
            let n = aa(t);
            if (n < 0) {
                la(R);
                return
            }
            let r = an()[n];
            if (!r || r.kind === `header`) {
                la(R);
                return
            }
            if (n === R) {
                la(R);
                return
            }
            R = n, w()
        }

        function da(e, t) {
            let n = e - Cn,
                r = t - Tn,
                i = Math.hypot(n, r);
            i > 30 ? (En = n / i, Dn = r / i) : i < .001 ? (En = 0, Dn = 0) : (En = n / 30, Dn = r / 30)
        }

        function fa(e, t) {
            let n = Xi(e, t);
            if (ee(), Gt(), p !== `attract` && p !== `options` && p !== `shop` && n.x > 236 && n.y > 372 && n.x < 276) {
                Fe = ne(), K.muted = Fe, Kt(), Fe || (p === `bossintro` || p === `playing` && De ? mt(mn(v).vibe, v) : (p === `playing` || p === `ready`) && W(`play`, v)), w();
                return
            }
            if (p === `attract`) {
                Gi(n.x, n.y);
                return
            }
            if (p === `changelog`) {
                li(n.x, n.y);
                return
            }
            if (p === `soundtest`) {
                Vi(n.x, n.y);
                return
            }
            if (p === `options`) {
                sa(n.x, n.y);
                return
            }
            if (p === `shop`) {
                na(n.x, n.y);
                return
            }
            if (p === `gameover`) {
                if (n.y >= 226 && n.y <= 260 && n.x >= 68 && n.x <= 252) {
                    ht > 0 ? xi() : (C(), xt = `コインが必要です · シェアしよう`, St = 80);
                    return
                }
                if (n.y >= 262 && n.y <= 294 && n.x >= 68 && n.x <= 252) {
                    Wi(), Bt();
                    return
                }
                n.y >= 296 && n.y <= 322 && n.x >= 78 && n.x <= 242 && (p = `attract`, Bt(), W(`attract`), w());
                return
            }
            if (p === `name`) {
                n.x < X / 3 ? Zi(-1) : n.x > X * 2 / 3 ? Zi(1) : (Oe++, Oe >= 3 && (p = `attract`, W(`attract`)));
                return
            }
            if (p === `inbox`) {
                if (!G.length) {
                    p = `attract`, W(`attract`);
                    return
                }
                if (!Ft) {
                    if (n.y > 364) {
                        p = `attract`, W(`attract`);
                        return
                    }
                    let e = Math.max(0, Math.min(Pt, Math.max(0, G.length - 5)));
                    for (let t = 0; t < Math.min(5, G.length - e); t++) {
                        let r = 58 + t * 48;
                        if (n.y >= r - 2 && n.y < r + 44) {
                            Pt = e + t, Ft = !0, w();
                            return
                        }
                    }
                    return
                }
                let e = G[Pt];
                if (!e) {
                    Ft = !1;
                    return
                }
                if (n.y >= Z * .55 && n.y < Z * .65) {
                    Wn(e) ? zt(e) : C();
                    return
                }
                if (n.y >= Z * .68 && n.y < Z * .78) {
                    $n({
                        playerId: B,
                        messageId: e.id
                    }).then(() => {
                        It(), Ft = !1, w()
                    });
                    return
                }
                if (n.y >= Z * .8) {
                    Ft = !1, w();
                    return
                }
                return
            }
            if ((p === `playing` || p === `ready` || p === `bossintro`) && (n.x < Cr || n.x > wr)) {
                fr(!0);
                return
            }(p === `playing` || p === `ready` || p === `bossintro`) && (K.vstick ? (xn = !0, Cn = Math.max(78, Math.min(242, n.x)), Tn = Math.max(70, Math.min(380, n.y)), En = 0, Dn = 0) : (vn = !0, yn = Math.max(58, Math.min(262, n.x)), bn = Math.max(36, Math.min(382, n.y))))
        }

        function pa(e, t) {
            if (p === `options` && et) {
                let n = Xi(e, t);
                ca(n.x, n.y);
                return
            }
            if (p === `shop` && ot) {
                let n = Xi(e, t);
                ra(n.x, n.y);
                return
            }
            if (p === `soundtest` && He) {
                let n = Xi(e, t);
                Hi(n.x, n.y);
                return
            }
            if (p === `changelog` && Re) {
                let n = Xi(e, t);
                ui(n.x, n.y);
                return
            }
            let n = Xi(e, t);
            if (K.vstick && xn) {
                da(n.x, n.y);
                return
            }
            vn && (yn = Math.max(58, Math.min(262, n.x)), bn = Math.max(36, Math.min(382, n.y)))
        }
        let ma = e => {
                e.preventDefault(), fa(e.touches[0].clientX, e.touches[0].clientY)
            },
            ha = e => {
                e.preventDefault(), pa(e.touches[0].clientX, e.touches[0].clientY)
            },
            ga = e => {
                if (e.preventDefault(), p === `options` && et) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        ua(e.x, e.y)
                    } else ua(tt, nt);
                    return
                }
                if (p === `shop` && ot) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        ia(e.x, e.y)
                    } else ia(st, ct);
                    return
                }
                if (p === `soundtest` && He) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        Ui(e.x, e.y)
                    } else Ui(58, Ue);
                    return
                }
                if (p === `changelog` && Re) {
                    let t = e.changedTouches[0];
                    if (t) {
                        let e = Xi(t.clientX, t.clientY);
                        di(e.x, e.y)
                    } else di(58, ze);
                    return
                }
                vn = !1, kn()
            },
            _a = e => fa(e.clientX, e.clientY),
            va = e => pa(e.clientX, e.clientY),
            ya = e => {
                if (p === `options` && et) {
                    let t = Xi(e.clientX, e.clientY);
                    ua(t.x, t.y);
                    return
                }
                if (p === `shop` && ot) {
                    let t = Xi(e.clientX, e.clientY);
                    ia(t.x, t.y);
                    return
                }
                if (p === `soundtest` && He) {
                    let t = Xi(e.clientX, e.clientY);
                    Ui(t.x, t.y);
                    return
                }
                if (p === `changelog` && Re) {
                    let t = Xi(e.clientX, e.clientY);
                    di(t.x, t.y);
                    return
                }
                vn = !1, kn()
            },
            ba = e => {
                if (On.add(e.key), ee(), e.key === `m` || e.key === `M`) {
                    Fe = ne(), K.muted = Fe, Kt(), Fe || (p === `shop` || p === `attract` || p === `options` ? W(`attract`) : p === `playing` && De ? mt(mn(v).vibe, v) : (p === `playing` || p === `ready`) && W(`play`, v));
                    return
                }
                if (p === `options`) {
                    let t = an(),
                        n = (e, n) => {
                            let r = e;
                            for (let e = 0; e < t.length; e++)
                                if (r = (r + n + t.length) % t.length, t[r].kind !== `header`) return r;
                            return e
                        };
                    (e.key === `ArrowUp` || e.key === `w` || e.key === `W`) && (R = n(R, -1), w()), (e.key === `ArrowDown` || e.key === `s` || e.key === `S`) && (R = n(R, 1), w()), (e.key === `ArrowLeft` || e.key === `a` || e.key === `A`) && Nr(-1), (e.key === `ArrowRight` || e.key === `d` || e.key === `D`) && Nr(1), (e.key === `Enter` || e.key === ` `) && (t[R]?.kind === `back` ? hr() : Nr(1)), e.key === `Escape` && hr();
                    return
                }
                if (p === `soundtest`) {
                    if (A === `comments`) {
                        (e.key === `ArrowUp` || e.key === `w` || e.key === `W`) && (qe = Math.max(0, qe - 1), w()), (e.key === `ArrowDown` || e.key === `s` || e.key === `S`) && (qe = Math.min(Math.max(0, F.length - 1), qe + 1), w()), (e.key === ` ` || e.key === `Enter`) && Pi(), e.key === `Escape` && Mi(), (e.key === `c` || e.key === `C`) && Pi(), (e.key === `l` || e.key === `L`) && ki(1), (e.key === `d` || e.key === `D`) && ki(-1);
                        return
                    }
                    let t = A === `menu` ? Fi().length - 1 : Ii(A).length - 1;
                    (e.key === `ArrowUp` || e.key === `w` || e.key === `W`) && (j = Math.max(0, j - 1), w()), (e.key === `ArrowDown` || e.key === `s` || e.key === `S`) && (j = Math.min(t, j + 1), w()), (e.key === ` ` || e.key === `Enter`) && Li(), (e.key === `c` || e.key === `C`) && ji(), (e.key === `l` || e.key === `L`) && ki(1), (e.key === `d` || e.key === `D`) && ki(-1), e.key === `Escape` && (A === `menu` ? wi() : (A = `menu`, j = 0));
                    return
                }
                if (p === `attract`) {
                    (e.key === `ArrowUp` || e.key === `w` || e.key === `W`) && (k = (k + 9) % 10, k === 0 && (Ie = `easy`), k === 1 && (Ie = `normal`), w()), (e.key === `ArrowDown` || e.key === `s` || e.key === `S`) && (k = (k + 1) % 10, k === 0 && (Ie = `easy`), k === 1 && (Ie = `normal`), w()), (e.key === ` ` || e.key === `Enter`) && (k === 3 ? Wi() : k === 4 ? H && jt() ? yi() : bi() : k === 5 ? mr(`attract`) : k === 6 ? Ci() : k === 7 ? (typeof window.__sfOpenProfile==="function"?window.__sfOpenProfile():0) : k === 8 ? (typeof window.__sfOpenStats==="function"?window.__sfOpenStats():0) : k === 9 ? ai() : pi());
                    return
                }
                if (p === `changelog`) {
                    (e.key === `ArrowUp` || e.key === `w` || e.key === `W`) && (Le = Math.max(0, Le - 1), w()), (e.key === `ArrowDown` || e.key === `s` || e.key === `S`) && (Le = Math.min(si(), Le + 1), w()), (e.key === `Escape` || e.key === `Enter` || e.key === ` `) && oi();
                    return
                }
                if (p === `inbox`) {
                    if (e.key === `Escape`) {
                        Ft ? Ft = !1 : (p = `attract`, W(`attract`));
                        return
                    }
                    if ((e.key === `ArrowUp` || e.key === `w` || e.key === `W`) && !Ft && G.length && (Pt = (Pt - 1 + G.length) % G.length, w()), (e.key === `ArrowDown` || e.key === `s` || e.key === `S`) && !Ft && G.length && (Pt = (Pt + 1) % G.length, w()), e.key === `Enter` || e.key === ` `) {
                        if (!Ft && G.length) Ft = !0;
                        else if (Ft) {
                            let e = G[Pt];
                            Wn(e) && zt(e)
                        }
                        return
                    }
                    if ((e.key === `Backspace` || e.key === `Delete`) && Ft) {
                        let e = G[Pt];
                        e && $n({
                            playerId: B,
                            messageId: e.id
                        }).then(() => {
                            It(), Ft = !1
                        });
                        return
                    }
                    return
                }
                if (p === `gameover`) {
                    if (e.key === ` ` || e.key === `Enter` || e.key === `c` || e.key === `C`) {
                        ht > 0 ? xi() : Wi();
                        return
                    }
                    if (e.key === `s` || e.key === `S`) {
                        Wi();
                        return
                    }
                    if (e.key === `Escape`) {
                        p = `attract`, Bt(), W(`attract`);
                        return
                    }
                }
                if ((e.key === `p` || e.key === `P` || e.key === `Tab`) && (p === `playing` || p === `ready` || p === `bossintro`)) {
                    e.preventDefault(), fr(!0);
                    return
                }
                if (p === `shop`) {
                    let t = Kn(),
                        n = t.length + 2;
                    (e.key === `ArrowUp` || e.key === `w` || e.key === `W`) && (D = (D + n) % (n + 1)), (e.key === `ArrowDown` || e.key === `s` || e.key === `S`) && (D = (D + 1) % (n + 1)), (e.key === `Enter` || e.key === ` `) && (D === t.length ? pr() : D === t.length + 1 ? mr(`shop`) : D === t.length + 2 ? Wi() : sr(t[D])), e.key === `Escape` && Ne && pr()
                }
            },
            xa = e => {
                On.delete(e.key)
            };
        return s.addEventListener(`touchstart`, ma, {
            passive: !1
        }), s.addEventListener(`touchmove`, ha, {
            passive: !1
        }), s.addEventListener(`touchend`, ga, {
            passive: !1
        }), s.addEventListener(`mousedown`, _a), window.addEventListener(`mousemove`, va), window.addEventListener(`mouseup`, ya), window.addEventListener(`keydown`, ba), window.addEventListener(`keyup`, xa), window.__sfOpenProfile = function() {
              try {
                openProfileDialog({
                  linked: !!(V && V.linked),
                  playerId: B || "",
                  sfxUi: function(){ try{w()}catch(e){} },
                  sfxOk: function(){ try{_e()}catch(e){} },
                  sfxFail: function(){ try{C()}catch(e){} },
                  onNeedLink: function(){ try{_i()}catch(e){} }
                });
              } catch (err) { console.error(err); }
            }, window.__sfOpenStats = function() {
              try {
                openStatsDialog({
                  playerId: B || "",
                  linked: !!(V && V.linked),
                  sfxUi: function(){ try{w()}catch(e){} }
                });
              } catch (err) { console.error(err); }
            }, window.__swipeForceTest = {
            mode: () => p,
            start: () => pi(),
            openShop: () => fr(!0),
            openOptions: () => mr(`shop`),
            setVstick: e => {
                K.vstick = e, Kt()
            },
            playerId: () => B,
            coins: () => ht,
            setCoins: e => {
                ht = Math.max(0, e | 0)
            },
            setRef: (e, t) => {
                let n = e ? e.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null,
                    r = t ? t.replace(/[^a-z0-9]/gi, ``).slice(0, 32) : null;
                n && n !== B && r && r.length >= 4 ? (H = n, U = r) : (H = null, U = null), Ot()
            },
            award: () => hi(),
            missions: () => Dt,
            openFanmail: () => yi(),
            openInbox: () => bi(),
            share: () => Wi()
        }, W(`attract`), () => {
            u = !1, cancelAnimationFrame(d), Mn.disconnect(), s.removeEventListener(`touchstart`, ma), s.removeEventListener(`touchmove`, ha), s.removeEventListener(`touchend`, ga), s.removeEventListener(`mousedown`, _a), window.removeEventListener(`mousemove`, va), window.removeEventListener(`mouseup`, ya), window.removeEventListener(`keydown`, ba), window.removeEventListener(`keyup`, xa), gt()
        }
    }, []), (0, xr.jsx)(`div`, {
        ref: e,
        className: `flex h-dvh w-full items-center justify-center bg-black`,
        style: {
            touchAction: `none`
        },
        children: (0, xr.jsx)(`canvas`, {
            ref: t,
            className: `max-h-full max-w-full`
        })
    })
}

function Pr() {
    return (0, xr.jsx)(Nr, {})
}


export function SwipeForceGame() {
  return Pr();
}
export default SwipeForceGame;
