// @ts-nocheck
import { bossThemeMeta, BOSS_ACTS } from "./boss-themes";
/**
 * Recovered audio engine (SFX + BGM) — single module so shared mute/gain state stays consistent.
 * Prefer importing via ./sfx KEY_CLOUD_INBOX ./bgm facades for clarity.
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
export function throttleSfx(e, t) {
    let n = performance.now();
    return n - (h[e] ?? 0) < t ? !1 : (h[e] = n, !0)
}


// ── Web Audio context ──
export function ensureAudioCtx() {
    if (typeof window > `u`) return null;
    if (!c) {
        let e = window.AudioContext || window.webkitAudioContext;
        if (!e) return null;
        c = new e, l = c.createGain(), l.gain.value = u ? 0 : m * d, l.connect(c.destination)
    }
    return c
}

export function getMasterGain() {
    return ensureAudioCtx(), l
}

export function bgmSetMaster() {
    let e = ensureAudioCtx();
    if (!e) return;
    try {
        let t = e.createBuffer(1, 1, 22050),
            n = e.createBufferSource();
        n.buffer = t, n.connect(e.destination), n.start(0)
    } catch {}
    let t = () => {
        if (applyMasterGain(), !u && bgmMode !== `off`) {
            clearBgmTimer();
            try {
                bgmResume()
            } catch {
                scheduleNextTick()
            }
        }
    };
    e.state === `suspended` || e.state === `interrupted` ? e.resume().then(() => t()).catch(() => {}) : t()
}

export function applyMasterGain() {
    if (!l) return;
    let e = ensureAudioCtx(),
        t = u ? 0 : m * Math.max(0, Math.min(1, d));
    e ? l.gain.setTargetAtTime(t, e.currentTime, .02) : l.gain.value = t
}

export function bgmSetMuted(e) {
    u = e, applyMasterGain(), e ? clearBgmTimer() : bgmMode !== `off` && (clearBgmTimer(), bgmResume())
}

export function bgmToggleMute() {
    return bgmSetMuted(!u), u
}

export function bgmSetBgmVol(e) {
    d = Math.max(0, Math.min(1, e)), applyMasterGain()
}

export function bgmSetSfxVol(e) {
    f = Math.max(0, Math.min(1, e))
}

export function bgmIsMuted(e) {
    p = Math.max(0, Math.min(1, e))
}

export function makeEnvGain(e, t, n, r, i) {
    let a = e.createGain(),
        o = e.currentTime;
    return a.gain.setValueAtTime(1e-4, o), a.gain.exponentialRampToValueAtTime(Math.max(1e-4, n), o + Math.max(.001, r)), a.gain.exponentialRampToValueAtTime(1e-4, o + r + i), a.connect(t), a
}

export function tone(e, t, n = `square`, r = .12, i, a = `sfx`) {
    if (u) return;
    let o = ensureAudioCtx(),
        s = getMasterGain();
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
    let m = makeEnvGain(o, s, r * c, .002, t);
    d.connect(m), d.start(l), d.stop(l + t + .03)
}

export function noiseBurst(e, t = .15, n = 4e3, r = `sfx`) {
    if (u) return;
    let i = ensureAudioCtx(),
        a = getMasterGain();
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
    let h = makeEnvGain(i, a, t, .001, e);
    d.connect(m), m.connect(h), d.start(), d.stop(i.currentTime + e + .02)
}

export function midiToHz(e) {
    return 440 * 2 ** ((e - 69) / 12)
}

export function sfxShoot() {
    throttleSfx(`shoot`, 40) && tone(880, .04, `square`, .07, 520)
}

export function sfxMissile() {
    throttleSfx(`missile`, 70) && (tone(200, .1, `square`, .09, 80), tone(400, .06, `square`, .05, 150))
}

export function sfxParticle() {
    throttleSfx(`particle`, 80) && (tone(1200, .08, `sawtooth`, .08, 400), tone(600, .1, `square`, .05))
}

export function sfxLockon() {
    throttleSfx(`lock`, 60) && tone(500, .04, `square`, .06, 1400)
}

export function sfxHit() {
    throttleSfx(`hit`, 28) && tone(300, .03, `square`, .05, 120)
}

export function sfxExplode(e = !1) {
    throttleSfx(e ? `xbig` : `xsm`, e ? 70 : 35) && (noiseBurst(e ? .28 : .12, e ? .22 : .12, e ? 2200 : 1400), e && tone(100, .2, `triangle`, .1, 40))
}

export function sfxPlayerHit() {
    throttleSfx(`phit`, 90) && (noiseBurst(.16, .2, 900), tone(180, .15, `square`, .1, 50))
}

export function sfxBossWarn() {
    throttleSfx(`boss`, 400) && (tone(220, .12, `square`, .12), setTimeout(() => tone(220, .12, `square`, .12), 140), setTimeout(() => tone(160, .2, `square`, .14, 90), 280))
}

export function sfxStageClear() {
    throttleSfx(`clear`, 500) && [523, 659, 784, 1046, 1318].forEach((e, t) => {
        setTimeout(() => tone(e, .1, `square`, .1), t * 70)
    })
}

export function sfxGameOver() {
    throttleSfx(`go`, 500) && (tone(400, .15, `square`, .1, 200), setTimeout(() => tone(250, .2, `square`, .1, 120), 150), setTimeout(() => tone(120, .35, `triangle`, .12, 55), 320))
}

export function sfxBuy() {
    throttleSfx(`buy`, 70) && (tone(660, .05, `square`, .08), setTimeout(() => tone(990, .07, `square`, .09), 45))
}

export function sfxBuyFail() {
    throttleSfx(`buyfail`, 90) && tone(160, .08, `square`, .08, 90)
}

export function sfxUi() {
    throttleSfx(`ui`, 45) && tone(520, .03, `square`, .05)
}


// ── SFX one-shots ──
export function sfxStart() {
    throttleSfx(`start`, 300) && [440, 554, 659, 880].forEach((e, t) => {
        setTimeout(() => tone(e, .08, `square`, .09), t * 60)
    })
}
export var bgmMode = `off`,
    themeSeed = 0,
    bgmStage = 1,
    tickIndex = 0,
    tickTimer = null,
    CHIP_SCALES = [
        [0, 2, 3, 5, 7, 8, 10],
        [0, 2, 3, 5, 7, 8, 11],
        [0, 2, 4, 5, 7, 9, 10],
        [0, 2, 3, 5, 7, 9, 10],
        [0, 1, 3, 5, 7, 8, 10],
        [0, 2, 4, 5, 7, 9, 11],
        [0, 2, 4, 6, 7, 9, 11],
        [0, 2, 3, 5, 6, 8, 10]
    ];

export function makeRng(e) {
    let t = (e >>> 0) + 1831565813;
    return () => (t = Math.imul(t ^ t >>> 15, t | 1), t ^= t + Math.imul(t ^ t >>> 7, t | 61), ((t ^ t >>> 14) >>> 0) / 4294967296)
}
export var CHIP_LEADS = [
        [0, 2, 4, 5, 4, 2, 0, -1, 5, 4, 2, 0, 2, 4, 5, 7],
        [0, -1, 0, 3, 5, -1, 7, 5, 4, 2, 0, 2, 4, -1, 5, 4],
        [4, 5, 7, 5, 4, 2, 0, -1, 0, 2, 4, 5, 7, 9, 7, 5],
        [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 0, 0, -1, -1],
        [7, 5, 4, 2, 0, 2, 4, 5, 4, -1, 2, 0, -1, 2, 4, 0],
        [0, 2, -1, 5, 4, 2, 0, 5, 7, 5, 4, 2, 0, -1, 4, 5],
        [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 1, 3],
        [5, 4, 2, 0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, -1]
    ],
    CHIP_PROGS = [
        [0, 5, 3, 4],
        [0, 3, 4, 0],
        [0, 4, 5, 3],
        [0, 5, 0, 4],
        [0, 2, 3, 4],
        [5, 4, 0, 3],
        [0, 3, 0, 5],
        [0, 4, 0, 5]
    ];

export function makeChipPatch(e, t) {
    let n = ((Math.max(1, e) - 1) % 64 + 64) % 64,
        r = makeRng(n * 7919 + (t ? 4242 : 17) + themeSeed * 99),
        i = CHIP_SCALES[(n + (t ? themeSeed : 0)) % CHIP_SCALES.length],
        a = [45, 47, 48, 50, 52, 53, 55, 57],
        o = a[n % a.length] - (t ? 2 : 0),
        s = CHIP_PROGS[n % CHIP_PROGS.length].slice();
    t && (s = [0, 0, 3, 4, 0, 5, 4, 0]);
    let c = CHIP_LEADS[n % CHIP_LEADS.length],
        l = CHIP_LEADS[(n * 3 + 1) % CHIP_LEADS.length],
        u = [...c, ...l];
    for (let e = 0; e < u.length; e++) r() > .85 && u[e] >= 0 && (u[e] = Math.max(0, Math.min(i.length + 1, u[e] + (r() > .5 ? 1 : -1)))), t && e % 8 == 7 && (u[e] = -1);
    let d = 70 + n % 16 * 3 + n * 5 % 7;
    t && (d = 85 + themeSeed * 4 + n % 5 * 2), !t && n % 5 == 0 && (d = 72 + n % 8 * 2);
    let f = t ? (n + 3) % 6 : (n * 2 + 1) % 6,
        p = !t && n % 4 == 0 || n % 3 == 0 ? `triangle` : `square`;
    return {
        tonic: o,
        scale: i,
        prog: s,
        lead: u,
        tempo: Math.max(68, Math.min(135, d)),
        arpStyle: (n * 3 + themeSeed) % 4,
        drum: f,
        leadDuty: p,
        style: t ? `legacy` : `chip`,
        counter: u.map((e, t) => t % 2 == 0 ? e : -1)
    }
}
export var BAROQUE_SCALES = [
        [0, 2, 3, 5, 7, 8, 10],
        [0, 2, 3, 5, 7, 8, 11],
        [0, 2, 4, 5, 7, 9, 11],
        [0, 2, 3, 5, 7, 9, 10],
        [0, 2, 4, 5, 7, 8, 11]
    ],
    BAROQUE_PROGS = [
        [0, 3, 4, 0],
        [0, 4, 0, 5, 3, 4, 0, 0],
        [0, 5, 3, 4, 0, 3, 4, 0],
        [0, 2, 5, 4, 0, 3, 4, 0],
        [0, 3, 0, 4, 5, 4, 0, 0],
        [4, 0, 5, 3, 4, 0, 4, 0],
        [0, 4, 5, 3, 0, 5, 4, 0],
        [0, 3, 4, 5, 3, 4, 0, 0]
    ],
    BAROQUE_LEADS = [
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
    BOSS_ACT_TABLE = BOSS_ACTS;

export function getBossThemeMeta(e) {
    return bossThemeMeta(e);
}

export function invertDegrees(e) {
    return e.map(e => e < 0 ? -1 : Math.max(0, 7 - e))
}
export var FUGUE_SUBJECTS = [
        [0, -1, 2, 4, 7, -1, 5, 4, 2, 0, -1, 5, 7, 5, 4, 2],
        [0, 1, 3, -1, 5, 3, 1, 0, -1, 7, 5, 4, 2, -1, 0, 2],
        [0, 4, -1, 2, 7, 4, -1, 0, 5, -1, 4, 2, 5, 7, -1, 4],
        [0, -1, -1, 4, 7, -1, 5, 4, -1, 2, 0, -1, 5, 4, 2, 0]
    ],
    FUGUE_COUNTERS = [
        [4, 2, 0, -1, 2, 4, 5, 4, 2, -1, 0, 2, 4, -1, 2, 0],
        [5, 3, 1, 0, -1, 1, 3, 5, 3, -1, 1, 0, 2, 3, -1, 0],
        [7, 5, 4, 2, -1, 4, 2, 0, 2, 4, -1, 5, 4, 2, 0, -1],
        [2, 0, -1, 4, 2, 0, -1, 5, 4, 2, 0, -1, 4, 5, 4, 2]
    ];

export function makeFuguePatch(e, t) {
    let n = Math.max(1, Math.min(64, e | 0)),
        r = Math.floor((n - 1) / 16) % 4,
        i = BAROQUE_SCALES[+(r % 2 == 0)],
        a = [47, 50, 45, 52],
        o = [118, 108, 100, 92],
        s = FUGUE_SUBJECTS[r].slice(),
        c = s.map(e => e < 0 ? -1 : e + 4),
        l = FUGUE_COUNTERS[r].slice(),
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

export function mutateLeadLine(e, t, n) {
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

export function makeHarmonyPatch(e, t) {
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

export function makeWhistlePatch(e, t) {
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
        c = invertDegrees(s).map(e => e < 0 ? -1 : e);
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

export function makeCanonPatch(e, t) {
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

export function makeOrganPatch(e, t) {
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

export function makeFlavorPatch(e, t, n, r) {
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

export function makeDawnPatch(e, t) {
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
    return makeFlavorPatch(e, t, `dawn`, {
        tonic: [50, 52, 48, 53][n],
        scale: BAROQUE_SCALES[0],
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

export function makeSubjectPatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 7, -1, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0],
            [0, 4, 7, 4, 2, 0, -1, 5, 7, 5, 4, 2, 0, 2, 4, 0],
            [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 3, 5],
            [0, 2, 0, 5, 4, 2, 7, 5, 4, 2, 0, -1, 4, 5, 7, 0]
        ][n],
        i = [...r, ...r.map(e => e < 0 ? -1 : e + 0)],
        a = [...Array(16).fill(-1), ...r.map(e => e < 0 ? -1 : e + 4)];
    return makeFlavorPatch(e, t, `subject`, {
        tonic: [48, 50, 47, 52][n],
        scale: BAROQUE_SCALES[+(n % 2 == 0)],
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

export function makeContinuoPatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [0, 2, 4, 5, 4, 2, 0, 5, 4, 2, 0, 2, 4, 5, 7, 5],
        i = r.map((e, t) => t % 4 == 3 ? -1 : e + 4),
        a = r.slice();
    return makeFlavorPatch(e, t, `continuo`, {
        tonic: [45, 47, 43, 48][n],
        scale: BAROQUE_SCALES[1],
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

export function makeBellsPatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, -1, -1, 4, -1, -1, 7, -1, 5, -1, -1, 4, -1, 2, -1, 0],
            [0, -1, 5, -1, -1, 7, -1, -1, 4, -1, 2, -1, 0, -1, 4, -1],
            [7, -1, -1, 4, -1, 0, -1, -1, 5, -1, 4, -1, 2, -1, 0, -1],
            [0, -1, -1, -1, 4, -1, -1, 7, -1, -1, 5, -1, 4, -1, 0, 0]
        ][n],
        i = [...r, ...r],
        a = r.map(e => e < 0 ? -1 : e + 7);
    return makeFlavorPatch(e, t, `bells`, {
        tonic: [53, 55, 50, 57][n],
        scale: BAROQUE_SCALES[0],
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

export function makeChasePatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0, 5, 4, 2, 0, 4, 2, 0, 0],
            [0, 1, 3, 5, 7, 8, 7, 5, 3, 1, 0, 3, 5, 7, 5, 3, 1, 0, 5, 3, 1, 0, 3, 5, 7, 5, 3, 1, 0, 1, 0, 0],
            [0, 4, 2, 5, 4, 7, 5, 4, 2, 0, 5, 7, 5, 4, 2, 4, 0, 2, 4, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 0],
            [0, 2, 0, 4, 2, 5, 4, 7, 5, 4, 2, 5, 7, 9, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0]
        ][n],
        i = r.map((e, t) => t % 2 == 0 ? -1 : (e + 3) % 10);
    return makeFlavorPatch(e, t, `chase`, {
        tonic: [48, 50, 52, 47][n],
        scale: BAROQUE_SCALES[n % 2],
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

export function makeSilencePatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, -1, -1, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, -1, -1, 2, -1, -1, -1, 0, -1, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1],
            [0, -1, -1, -1, 7, -1, -1, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, 2, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, 0, -1, -1, -1, -1, 3, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, -1, -1],
            [0, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, 7, -1, -1, -1, -1, 5, -1, -1, -1, -1, 2, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1]
        ][n];
    return makeFlavorPatch(e, t, `silence`, {
        tonic: [43, 45, 41, 47][n],
        scale: BAROQUE_SCALES[2 % BAROQUE_SCALES.length],
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

export function makeIronPatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 0, 4, 4, 0, 0, 5, 5, 0, 4, 0, 5, 4, 4, 0, 0],
            [0, 4, 0, 4, 7, 7, 5, 4, 0, 0, 4, 5, 4, 0, 0, 0],
            [0, 0, 0, 4, 4, 4, 5, 5, 7, 5, 4, 0, 4, 5, 0, 0],
            [0, 5, 4, 0, 0, 4, 5, 7, 5, 4, 0, 4, 0, 0, 0, 0]
        ][n],
        i = [...r, ...r],
        a = i.map(e => e + 4);
    return makeFlavorPatch(e, t, `iron`, {
        tonic: [40, 43, 38, 45][n],
        scale: BAROQUE_SCALES[1],
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

export function makeTearPatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 7, 2, 9, 4, 0, 11, 5, 2, 8, 0, 7, 4, 10, 2, 0],
            [0, 8, 1, 7, 3, 10, 0, 5, 9, 2, 6, 0, 7, 1, 4, 0],
            [0, 11, 4, 7, 0, 9, 2, 5, 12, 4, 0, 7, 3, 8, 0, 4],
            [0, 7, 0, 12, 5, 2, 9, 0, 6, 11, 3, 0, 8, 4, 0, 7]
        ][n],
        i = [...r, ...r.map(e => Math.max(0, e - 2))],
        a = i.map((e, t) => t % 3 == 0 ? e : -1);
    return makeFlavorPatch(e, t, `tear`, {
        tonic: [49, 51, 46, 54][n],
        scale: BAROQUE_SCALES[(n + 2) % BAROQUE_SCALES.length],
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

export function makeStormPatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 5, 7, 5, 4, 2, 5, 7, 9, 7, 5, 4, 2, 0, 4, 5, 7, 9, 11, 9, 7, 5, 4, 2, 0, 2, 4, 5, 4, 0],
            [0, 3, 5, 7, 8, 7, 5, 3, 0, 5, 7, 10, 7, 5, 3, 0, 3, 5, 7, 8, 10, 8, 7, 5, 3, 0, 5, 3, 0, 3, 5, 0],
            [0, 4, 7, 4, 2, 5, 9, 5, 4, 7, 11, 7, 5, 4, 2, 0, 4, 7, 5, 9, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 0, 0],
            [0, 1, 4, 7, 5, 8, 4, 7, 2, 5, 9, 5, 0, 4, 7, 4, 1, 5, 8, 5, 2, 7, 10, 7, 0, 4, 0, 5, 4, 2, 0, 0]
        ][n],
        i = r.map((e, t) => t % 2 == 0 ? e + 2 : e - 1);
    return makeFlavorPatch(e, t, `storm`, {
        tonic: [46, 48, 50, 44][n],
        scale: BAROQUE_SCALES[n % BAROQUE_SCALES.length],
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

export function makeAbyssPatch(e, t) {
    // 深海のバス — 三和音のオルゴール（music box triads）
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        // broken-triad melodies (scale degrees 0-2-4-7-…) with rests
        r = [
            // I · V · vi · IV 風の箱揺らし
            [0, 2, 4, -1, 4, 2, 0, -1, 0, 4, 7, -1, 5, 4, 2, 0,
             0, 2, 4, 5, 4, 2, 0, -1, 7, 5, 4, 2, 0, -1, 0, -1],
            // 少し暗い揺らぎ
            [0, -1, 2, 4, -1, 5, 4, 2, 0, 2, 4, 7, 5, -1, 4, 0,
             4, 2, 0, -1, 2, 4, 5, 4, 0, -1, 5, 4, 2, 0, -1, 0],
            // 高域のつま弾き
            [4, 2, 0, 2, 4, 7, -1, 5, 4, 2, 0, -1, 4, 5, 7, 4,
             0, 2, 4, -1, 7, 5, 4, 2, 0, 4, 2, 0, -1, 2, 0, -1],
            // ゆっくりなカデンツ
            [0, -1, -1, 4, -1, -1, 7, -1, 5, -1, 4, -1, 2, -1, 0, -1,
             0, 2, 4, 5, -1, 4, 2, 0, 4, -1, 5, 4, 2, 0, -1, 0],
        ][n],
        // カウンターは 3 度上の細い応答（オルゴールの第2ボイス）
        i = r.map((deg, idx) => {
            if (deg < 0) return -1;
            if (idx % 4 === 1 || idx % 4 === 3) return deg + 2;
            return -1;
        });
    return makeFlavorPatch(e, t, `abyss`, {
        tonic: [55, 53, 57, 52][n], // 高め＝箱の金属感
        scale: BAROQUE_SCALES[0], // major-ish
        // 三和音進行: I – V – vi – IV – I – iii – V – I
        prog: [0, 4, 5, 3, 0, 2, 4, 0],
        lead: r,
        counter: i,
        tempo: [68, 64, 60, 72][n],
        drum: 53,
        leadDuty: `sine`,
        leadEvery: 2,
        leadOct: 24,
        leadPeak: .09,
        bassMode: 0,
        gtrMode: 0,
        brassMode: 0,
        chordTicks: 8,
        arpStyle: 0,
    })
}

export function makeCadencePatch(e, t) {
    let n = Math.floor((Math.max(1, e) - 1) / 16) % 4,
        r = [
            [0, 2, 4, 0, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 0],
            [0, 4, 7, 4, 0, 5, 4, 0, 2, 4, 5, 7, 5, 4, 0, 0],
            [0, 0, 4, 4, 5, 5, 0, 0, 4, 5, 7, 9, 7, 5, 4, 0],
            [0, 2, 0, 4, 5, 7, 5, 4, 0, 4, 5, 0, 4, 2, 0, 0]
        ][n],
        i = [...r, ...r],
        a = i.map(e => e + 2);
    return makeFlavorPatch(e, t, `cadence`, {
        tonic: [48, 50, 52, 47][n],
        scale: BAROQUE_SCALES[0],
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

export function makeBossPatch(e) {
    let t = Math.max(1, Math.min(64, e | 0)),
        n = t - 1,
        r = getBossThemeMeta(t);
    if (r.title.includes(`星屑のフーガ`)) return makeFuguePatch(t, r);
    if (r.title.includes(`祈りの半終止`)) return makeOrganPatch(t, r);
    if (r.title.includes(`影のカノン`)) return makeCanonPatch(t, r);
    if (r.title.includes(`鏡像の答`)) return makeWhistlePatch(t, r);
    if (r.title.includes(`決意の和声`)) return makeHarmonyPatch(t, r);
    if (r.title.includes(`夜明けの対位`)) return makeDawnPatch(t, r);
    if (r.title.includes(`第一主題`)) return makeSubjectPatch(t, r);
    if (r.title.includes(`歩む通奏`)) return makeContinuoPatch(t, r);
    if (r.title.includes(`遠い鐘`)) return makeBellsPatch(t, r);
    if (r.title.includes(`追走曲`)) return makeChasePatch(t, r);
    if (r.title.includes(`沈黙の前`)) return makeSilencePatch(t, r);
    if (r.title.includes(`鉄の序奏`)) return makeIronPatch(t, r);
    if (r.title.includes(`裂ける旋律`)) return makeTearPatch(t, r);
    if (r.title.includes(`嵐の展開`)) return makeStormPatch(t, r);
    if (r.title.includes(`深海のバス`)) return makeAbyssPatch(t, r);
    if (r.title.includes(`最後のカデンツ`)) return makeCadencePatch(t, r);
    let i = makeRng(t * 11003 + 777 + t * t),
        a = Math.max(0, BOSS_ACT_TABLE.findIndex(e => t >= e.from && t <= e.to)),
        o = (t - 1) % 16,
        s = BAROQUE_SCALES[(n * 3 + a + o) % BAROQUE_SCALES.length],
        c = [40, 41, 43, 45, 46, 47, 48, 50, 52, 53, 55, 57],
        l = c[(n * 5 + a * 2) % c.length],
        u = BAROQUE_PROGS[(n * 7 + o) % BAROQUE_PROGS.length].slice();
    o % 4 == 0 && (u = [0, 0, ...u]), o % 5 == 2 && (u = [...u, 4, 0, 5, 0]), a >= 2 && n % 2 == 0 && (u = u.map((e, t) => t % 2 == 0 ? e : (e + 3) % 7));
    let d = BAROQUE_LEADS[n % BAROQUE_LEADS.length],
        f = BAROQUE_LEADS[(n * 5 + 3) % BAROQUE_LEADS.length],
        p = mutateLeadLine([...d, ...f], i, n),
        m, h = n % 4;
    m = h === 0 ? [...Array(8).fill(-1), ...p.slice(0, 24)] : h === 1 ? invertDegrees(p) : h === 2 ? p.map(e => e < 0 ? -1 : e + 4) : p.map((e, t) => t % 2 == 0 ? e : -1);
    let tempo = Math.max(72, Math.min(138, 78 + n % 16 * 3 + a * 4 + o % 3 * 2)),
        bassMode = (n + a) % 6,
        leadMode = (n * 2 + o) % 6,
        gtrModePick = (n + 3) % 5,
        brassModePick = (n * 3 + 1) % 6,
        leadEvery = [1, 2, 2, 4, 2, 1][(n + o) % 6],
        leadOct = [0, 12, 12, 24, 12, 0][n % 6],
        gtrOct = [12, 12, 24, 0, 12][gtrModePick],
        brassOct = [0, 0, 12, 0, -12, 12][brassModePick],
        chordTicks = [4, 8, 8, 16, 8, 4][(n + a) % 6],
        leadDuty = n % 2 == 0 ? `triangle` : `square`,
        drum = 20 + (n * 3 + a) % 16,
        gtrMode = gtrModePick,
        brassMode = brassModePick;
    return o === 3 ? (bassMode = 2, leadMode = 2, gtrMode = 4, brassMode = 0) : o === 4 ? (leadMode = 4, bassMode = 3, gtrMode = 0, brassMode = 3, tempo = Math.min(140, tempo + 12)) : o === 5 ? (tempo = Math.max(72, tempo - 18), gtrMode = 2, bassMode = 4, leadMode = 3) : o === 6 ? (p = p.map((e, t) => t % 3 == 0 ? e : -1), bassMode = 3, gtrMode = 0, brassMode = 1, tempo += 10) : o === 9 ? (bassMode = 5, brassMode = 3, gtrMode = 3, leadMode = 0) : o === 10 ? (brassMode = 2, gtrMode = 2, leadMode = 1) : o === 12 ? (tempo = Math.max(72, tempo - 22), bassMode = 4, gtrMode = 2, brassMode = 3, leadMode = 3) : o === 13 ? (bassMode = 1, leadMode = 2, brassMode = 4, gtrMode = 4) : o === 15 && (u = [0, 4, 0, 0, 3, 4, 0, 0], brassMode = 3, leadMode = 0), {
        tonic: l,
        scale: s,
        prog: u,
        lead: p,
        counter: m,
        tempo: Math.max(72, Math.min(140, tempo)),
        arpStyle: (n + a) % 4,
        drum: drum,
        leadDuty: leadDuty,
        style: `baroque`,
        story: r.title,
        fugue: !1,
        arr: n,
        bassMode: bassMode,
        leadMode: leadMode,
        gtrMode: gtrMode,
        brassMode: brassMode,
        leadEvery: leadEvery,
        leadOct: o === 13 ? 0 : leadOct,
        gtrOct: gtrOct,
        brassOct: o === 13 ? -12 : brassOct,
        chordTicks: chordTicks,
        leadPeak: .07 + n % 5 * .008
    }
}
export var activePatch = makeChipPatch(1, !1);

export function degreeToMidi(e, t = 0) {
    let n = activePatch.scale,
        r = e,
        i = t;
    for (; r < 0;) r += n.length, i -= 12;
    for (; r >= n.length;) r -= n.length, i += 12;
    return activePatch.tonic + n[r] + i
}

export function arpSteps(e) {
    return [e, e + 2, e + 4, e + 6, e + 7]
}

export function pickArpStep(e, t, n) {
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

export function drumKickLight() {
    tone(140, .07, `triangle`, .14, 45, `bgm`), noiseBurst(.025, .06, 600, `bgm`)
}

export function drumKick(e = 0) {
    e === 0 ? (tone(120, .09, `triangle`, .16, 38, `bgm`), noiseBurst(.03, .07, 500, `bgm`)) : e === 1 ? (tone(70, .14, `triangle`, .18, 32, `bgm`), tone(110, .06, `sine`, .08, 40, `bgm`), noiseBurst(.04, .05, 400, `bgm`)) : e === 2 ? (tone(130, .05, `triangle`, .14, 42, `bgm`), setTimeout(() => {
        tone(95, .08, `triangle`, .12, 36, `bgm`), noiseBurst(.03, .06, 550, `bgm`)
    }, 45)) : (tone(100, .16, `triangle`, .15, 30, `bgm`), noiseBurst(.08, .08, 350, `bgm`))
}

export function drumSnare() {
    noiseBurst(.06, .12, 3500, `bgm`), tone(220, .03, `square`, .04, 100, `bgm`)
}

export function drumHat(e = !1) {
    noiseBurst(e ? .05 : .02, e ? .045 : .03, e ? 9e3 : 7e3, `bgm`)
}

export function playBell(e, t) {
    let n = ensureAudioCtx(),
        r = getMasterGain();
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
    tone(e, .08, `sine`, t * .25, void 0, `bgm`)
}

/** Music-box pluck: bright short partials + soft sine body */
export function playMusicBoxNote(hz, peak = .08, dur = .45) {
    let n = ensureAudioCtx(),
        r = getMasterGain();
    if (!n || !r || u) return;
    if (n.state === `suspended`) {
        n.resume();
        return
    }
    let i = n.currentTime,
        a = Math.max(.001, peak * f),
        // music-box partials (slightly inharmonic)
        o = [1, 2.01, 3.02, 4.2, 5.4],
        s = [1, .55, .28, .14, .07];
    for (let t = 0; t < o.length; t++) {
        let c = n.createOscillator();
        c.type = `sine`;
        c.frequency.setValueAtTime(hz * o[t], i);
        let l = n.createGain();
        let attack = .004 + t * .002;
        let release = dur * (1 - t * .12);
        l.gain.setValueAtTime(1e-4, i);
        l.gain.exponentialRampToValueAtTime(a * s[t], i + attack);
        l.gain.exponentialRampToValueAtTime(1e-4, i + Math.max(attack + .05, release));
        c.connect(l), l.connect(r);
        c.start(i);
        c.stop(i + release + .05);
    }
}

/** Soft triad as music-box chord (root–third–fifth staggered) */
export function playMusicBoxTriad(rootDeg, oct = 12, peak = .07) {
    let delays = [0, 28, 52];
    let degs = [rootDeg, rootDeg + 2, rootDeg + 4];
    let peaks = [peak, peak * .78, peak * .62];
    for (let k = 0; k < 3; k++) {
        let deg = degs[k];
        let p = peaks[k];
        let d = delays[k];
        setTimeout(() => {
            try {
                playMusicBoxNote(midiToHz(degreeToMidi(deg, oct)), p, .55);
            } catch {}
        }, d);
    }
}

export function playDistorted(e, t) {
    let n = midiToHz(degreeToMidi(e, -12));
    tone(n, .12, `square`, t, void 0, `bgm`), tone(midiToHz(degreeToMidi(e + 4, -12)), .12, `square`, t * .75, void 0, `bgm`), tone(n * 2, .06, `square`, t * .35, void 0, `bgm`), noiseBurst(.03, t * .2, 1800, `bgm`)
}

export function playSlide(e, t, n) {
    let r = midiToHz(degreeToMidi(e, 12)),
        i = midiToHz(degreeToMidi(t, 12));
    tone(r, .16, `square`, n, i, `bgm`), tone(r * .5, .14, `triangle`, n * .4, i * .5, `bgm`)
}

export function playBrassFanfare(e, t, n) {
    let r = [0, 2, 4, 6, 7];
    for (let i = 0; i < r.length; i++) {
        let a = midiToHz(degreeToMidi(e + r[i], t)),
            o = n * (1 - i * .08);
        tone(a, .16, `triangle`, o, void 0, `bgm`), tone(a, .12, `square`, o * .42, a * (1 + (i - 2) * .0015), `bgm`)
    }
}

export function playFugueVoice(e, t, n, r = .14) {
    if (!Number.isFinite(e) || e < 40 || e > 2800) return;
    let i = Math.max(.02, t);
    n === 0 ? (tone(e, r, `square`, i, void 0, `bgm`), tone(e, r * .9, `triangle`, i * .55, void 0, `bgm`), tone(e * 2, r * .5, `triangle`, i * .18, void 0, `bgm`)) : n === 1 ? (tone(e, r * 1.05, `triangle`, i * 1.05, void 0, `bgm`), tone(e, r * .7, `square`, i * .35, void 0, `bgm`)) : n === 2 ? (tone(e, r * 1.1, `triangle`, i, void 0, `bgm`), tone(e * .5, r * .9, `triangle`, i * .35, void 0, `bgm`)) : n === 3 ? (tone(e, r * .95, `square`, i * .85, void 0, `bgm`), tone(e * 1.5, r * .4, `triangle`, i * .15, void 0, `bgm`)) : tone(e, r * 1.15, `triangle`, i * .9, void 0, `bgm`)
}

export function playChoirChord(e, t) {
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
        let r = midiToHz(degreeToMidi(e + n.d, n.o));
        r < 60 || r > 1400 || playFormant(r, .3, t * n.p, n.vow, n.gender)
    }
}

export function playBassVowel(e, t) {
    let n = midiToHz(degreeToMidi(e, 0));
    n < 50 || n > 900 || (playFormant(n, .22, t * 1.2, `o`, `m`), playFormant(Math.max(60, n * .5), .24, t * .7, `u`, `m`))
}
export var noiseBufCache = null;

export function getNoiseBuffer(e) {
    if (noiseBufCache && noiseBufCache.sampleRate === e.sampleRate) return noiseBufCache;
    let t = Math.max(1, Math.floor(e.sampleRate * .2)),
        n = e.createBuffer(1, t, e.sampleRate),
        r = n.getChannelData(0);
    for (let e = 0; e < r.length; e++) r[e] = Math.random() * 2 - 1;
    return noiseBufCache = n, n
}

export function playFormant(e, t, n, r = `a`, i = `m`) {
    try {
        if (u) return;
        let a = ensureAudioCtx(),
            o = getMasterGain();
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
        let oscA = a.createOscillator(),
            oscB = a.createOscillator();
        oscA.type = `sawtooth`, oscB.type = `sawtooth`, oscA.frequency.setValueAtTime(e, s), oscB.frequency.setValueAtTime(e * 1.005, s);
        let lfo = a.createOscillator();
        lfo.type = `sine`, lfo.frequency.value = i === `f` ? 5.6 : 5.1;
        let lfoGain = a.createGain();
        lfoGain.gain.value = Math.min(12, e * .009), lfo.connect(lfoGain), lfoGain.connect(oscA.frequency), lfoGain.connect(oscB.frequency);
        let mix = a.createGain();
        mix.gain.value = .4, oscA.connect(mix), oscB.connect(mix);
        let formantBus = a.createGain();
        formantBus.gain.value = 1;
        for (let [e, t, n] of [
                [d, 6, 1.15],
                [p, 8, .9],
                [m, 10, .45]
            ]) {
            let r = a.createBiquadFilter();
            r.type = `bandpass`, r.frequency.value = Math.min(7e3, Math.max(90, e)), r.Q.value = t;
            let i = a.createGain();
            i.gain.value = n, mix.connect(r), r.connect(i), i.connect(formantBus)
        }
        let body = a.createGain();
        body.gain.value = .32, mix.connect(body), body.connect(formantBus);
        try {
            let e = a.createBufferSource();
            e.buffer = getNoiseBuffer(a);
            let n = a.createBiquadFilter();
            n.type = `bandpass`, n.frequency.value = Math.min(6e3, p), n.Q.value = 3;
            let r = a.createGain();
            r.gain.value = .045, e.connect(n), n.connect(r), r.connect(formantBus), e.start(s), e.stop(s + Math.min(t, .2))
        } catch {}
        let env = a.createGain();
        env.gain.setValueAtTime(1e-4, s), env.gain.exponentialRampToValueAtTime(c, s + .03), env.gain.setValueAtTime(c * .9, s + Math.max(.05, t * .5)), env.gain.exponentialRampToValueAtTime(1e-4, s + t);
        let lp = a.createBiquadFilter();
        lp.type = `lowpass`, lp.frequency.value = i === `f` ? 4800 : 3800, formantBus.connect(env), env.connect(lp), lp.connect(o);
        let stopAt = s + t + .03;
        oscA.start(s), oscB.start(s), lfo.start(s), oscA.stop(stopAt), oscB.stop(stopAt), lfo.stop(stopAt)
    } catch {}
}

export function playWhistleTone(e, t, n = .14) {
    tone(e, n, `sine`, t, void 0, `bgm`), tone(e, n * .85, `triangle`, t * .45, void 0, `bgm`), noiseBurst(.02, t * .15, 6e3, `bgm`)
}

export function playWhistleArp(e, t, n) {
    let r = [0, 1, 2, 3, 4, 5];
    for (let i = 0; i < 6; i++) {
        let a = midiToHz(degreeToMidi(e + r[i], t + (i >= 4 ? 12 : 0))),
            o = n * (1 - i * .1);
        playWhistleTone(a, Math.max(.015, o), .13 + (i === 0 ? .04 : 0))
    }
}

export function playCanonLead(e, t = 12, n = .08) {
    let r = midiToHz(degreeToMidi(e, t));
    tone(r, .09, `triangle`, n, r * .985, `bgm`), tone(r, .05, `square`, n * .35, void 0, `bgm`), tone(r * 2, .04, `triangle`, n * .22, void 0, `bgm`)
}

export function playCanonFollow(e, t = .12) {
    let n = midiToHz(degreeToMidi(e, -12));
    tone(n, .14, `triangle`, t, n * .96, `bgm`), tone(n * .5, .1, `triangle`, t * .45, void 0, `bgm`)
}

export function playOrganStack(e, t, n) {
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
        let r = midiToHz(degreeToMidi(e + t.d, t.o));
        tone(r, .28, `triangle`, n * t.p, void 0, `bgm`), tone(r * 1.003, .22, `triangle`, n * t.p * .35, void 0, `bgm`)
    }
}

export function playOrganPedal(e) {
    let t = midiToHz(degreeToMidi(e, -12));
    tone(t, .32, `triangle`, .14, void 0, `bgm`), tone(t * .5, .36, `triangle`, .1, void 0, `bgm`), tone(t * 2, .2, `triangle`, .04, void 0, `bgm`)
}

export function playTriad(e, t, n, r) {
    let i = midiToHz(degreeToMidi(e, t)),
        a = midiToHz(degreeToMidi(e + 2, t)),
        o = midiToHz(degreeToMidi(e + 4, t));
    tone(i, .13, r, n, void 0, `bgm`), tone(a, .12, r, n * .72, void 0, `bgm`), tone(o, .12, r, n * .55, void 0, `bgm`)
}

export function playPluck(e, t = 12) {
    let n = midiToHz(degreeToMidi(e, t));
    tone(n, .07, `square`, .07, n * .97, `bgm`), tone(n * 2, .04, `square`, .03, void 0, `bgm`)
}

export function playBrassNote(e, t = 0) {
    let n = midiToHz(degreeToMidi(e, t));
    tone(n, .16, `triangle`, .08, void 0, `bgm`), tone(n, .12, `square`, .045, n * 1.01, `bgm`), tone(midiToHz(degreeToMidi(e + 4, t)), .12, `triangle`, .04, void 0, `bgm`)
}

export function playDrums(e) {
    let t = activePatch.drum,
        n = e % 16;
    if (activePatch.style === `baroque`) {
        if (activePatch.organ || activePatch.drum === 40) {
            n === 0 && tickIndex % 64 < 2 && noiseBurst(.02, .02, 400, `bgm`);
            return
        }
        if (activePatch.canon || activePatch.drum === 41) {
            n === 0 && drumKick(0), n === 8 && noiseBurst(.03, .035, 900, `bgm`), (n === 4 || n === 12) && noiseBurst(.025, .03, 2500, `bgm`), n % 4 == 2 && drumHat(!1);
            return
        }
        if (activePatch.whistle || activePatch.drum === 42) {
            n === 0 && tickIndex % 32 == 0 && noiseBurst(.015, .02, 3e3, `bgm`);
            return
        }
        if (activePatch.choir || activePatch.drum === 43) {
            (n === 0 || n === 8) && drumKick(1), (n === 4 || n === 12) && (noiseBurst(.05, .08, 4e3, `bgm`), tone(800, .02, `square`, .03, void 0, `bgm`)), (n === 6 || n === 14) && noiseBurst(.025, .04, 3500, `bgm`);
            return
        }
        let e = activePatch.drum >= 20 ? (activePatch.drum - 20) % 16 : Math.max(0, activePatch.drum - 10);
        e === 0 ? ((n === 0 || n === 8) && drumKick(1), (n === 4 || n === 12) && drumKick(0)) : e === 1 ? (n % 4 == 0 && drumKick(0), (n === 6 || n === 14) && drumKick(2), (n === 4 || n === 12) && drumSnare()) : e === 2 ? ((n === 0 || n === 3 || n === 6 || n === 8 || n === 11 || n === 14) && drumKick(0), (n === 4 || n === 12) && drumSnare(), n % 2 == 1 && drumHat(!1)) : e === 3 ? (n === 0 && drumKick(1), n === 8 && drumKick(3), (n === 4 || n === 12) && noiseBurst(.05, .06, 900, `bgm`)) : e === 4 ? (n === 0 && drumKick(1), n === 8 && drumKick(1), n === 12 && drumSnare(), n === 4 && drumHat(!0)) : e === 5 ? (n % 2 == 0 && drumKick(+(n % 4 == 0)), (n === 7 || n === 15) && drumKick(2), n % 4 == 1 && drumHat(!1)) : e === 6 ? ((n === 0 || n === 5 || n === 8 || n === 13) && drumKick(0), (n === 4 || n === 12) && drumSnare(), (n === 2 || n === 6 || n === 10 || n === 14) && drumHat(!1)) : e === 7 ? (n === 0 && drumKick(3), n === 10 && drumKick(0), n === 15 && noiseBurst(.06, .05, 600, `bgm`)) : e === 8 ? ((n === 0 || n === 8) && drumKick(1), (n === 2 || n === 6 || n === 10 || n === 14) && drumKick(0), (n === 4 || n === 12) && (drumSnare(), drumKick(0))) : e === 9 ? (n % 4 == 0 && drumKick(1), n % 4 == 2 && drumKick(0), (n === 4 || n === 12) && drumSnare(), n % 2 == 1 && drumHat(!0)) : e === 10 ? ((n === 0 || n === 7 || n === 8 || n === 15) && drumKick(2), (n === 4 || n === 12) && drumSnare()) : e === 11 ? ((n === 0 || n === 8) && drumKick(3), (n === 4 || n === 12) && noiseBurst(.04, .04, 500, `bgm`)) : e === 12 ? (n % 2 == 0 && drumKick(0), n % 4 == 3 && drumKick(2), (n === 4 || n === 6 || n === 12 || n === 14) && drumSnare(), drumHat(n % 3 == 0)) : e === 13 ? ((n === 0 || n === 8) && drumKick(1), (n === 4 || n === 12) && drumKick(1), (n === 2 || n === 10) && noiseBurst(.05, .05, 300, `bgm`)) : e === 14 ? (n === 0 && drumKick(0), (n === 3 || n === 6) && drumKick(0), n === 8 && drumKick(1), (n === 11 || n === 14) && drumKick(0), (n === 4 || n === 12) && drumSnare()) : ((n === 0 || n === 8) && drumKick(1), n === 4 && drumSnare(), n === 12 && (drumSnare(), drumKick(2)), (n === 14 || n === 15) && drumKick(0));
        return
    }
    if (bgmMode === `attract`) {
        (n === 0 || n === 8) && drumKickLight(), (n === 4 || n === 12) && drumHat(!1), n === 14 && drumSnare();
        return
    }
    t === 0 ? (n % 4 == 0 && drumKickLight(), (n === 4 || n === 12) && drumSnare(), n % 2 == 1 && drumHat(!1)) : t === 1 ? ((n === 0 || n === 6 || n === 8 || n === 14) && drumKickLight(), (n === 4 || n === 12) && drumSnare(), n % 2 == 0 && drumHat(n % 4 == 2)) : t === 2 ? ((n === 0 || n === 3 || n === 8 || n === 10) && drumKickLight(), (n === 4 || n === 11 || n === 14) && drumSnare(), drumHat(n % 3 == 0)) : t === 3 ? ((n === 0 || n === 8) && drumKickLight(), (n === 4 || n === 12) && drumSnare(), (n === 2 || n === 6 || n === 10 || n === 14) && drumHat(!0)) : t === 4 ? (n % 2 == 0 && drumKickLight(), (n === 4 || n === 6 || n === 12 || n === 14) && drumSnare(), n % 2 == 1 && drumHat(!1)) : ((n === 0 || n === 8) && drumKickLight(), (n === 4 || n === 12) && drumSnare(), n % 2 == 1 && drumHat(!1), n === 15 && Math.random() > .6 && noiseBurst(.08, .08, 5e3, `bgm`))
}

export function bgmResume() {
    if (u || bgmMode === `off`) return;
    let e = ensureAudioCtx(),
        t = getMasterGain();
    if (!e || !t) {
        scheduleNextTick();
        return
    }
    if (e.state === `suspended`) {
        e.resume().then(() => {
            !u && bgmMode !== `off` && scheduleNextTick()
        }), scheduleNextTick();
        return
    }
    let n = tickIndex++,
        r = n % 16,
        i = Math.floor(n / 8) % activePatch.prog.length,
        a = activePatch.prog[i];
    if (activePatch.fugue || activePatch.flavor === `silence` || activePatch.flavor === `bells`) {
        let e = r;
        e === 0 && tone(80, .04, `triangle`, .035, void 0, `bgm`), e === 8 && activePatch.flavor !== `silence` && noiseBurst(.02, .02, 2e3, `bgm`)
    } else if (activePatch.flavor === `abyss`) {
        // music box: almost no drums — soft tick only on bar
        r === 0 && n % 32 === 0 && noiseBurst(.012, .012, 4e3, `bgm`)
    } else if (activePatch.flavor === `dawn` || activePatch.flavor === `continuo`) {
        let e = r;
        (e === 0 || e === 8) && tone(70, .05, `triangle`, .05, void 0, `bgm`), (e === 4 || e === 12) && noiseBurst(.02, .025, 2500, `bgm`)
    } else if (activePatch.flavor === `iron` || activePatch.flavor === `storm` || activePatch.flavor === `chase`) playDrums(r);
    else if (activePatch.flavor) {
        let e = r;
        (e === 0 || e === 8) && tone(90, .05, `triangle`, .06, void 0, `bgm`), (e === 4 || e === 12) && noiseBurst(.03, .03, 3e3, `bgm`)
    } else playDrums(r);
    if (activePatch.style === `baroque`) {
        if (activePatch.choir) {
            try {
                let e = activePatch.leadEvery || 2;
                if (n % 8 == 0 && playFormant(midiToHz(degreeToMidi(a, -12)), .34, .1, `u`, `m`), n % e === 0) {
                    let t = Math.floor(n / e),
                        r = t % activePatch.lead.length,
                        i = activePatch.lead[r],
                        o = Math.floor(t / 8) % 4;
                    if (i >= 0) {
                        if (o === 0) playBassVowel(i, .12);
                        else if (o === 1) playChoirChord(i, activePatch.leadPeak ?? .09);
                        else if (o === 2) {
                            playChoirChord(i, (activePatch.leadPeak ?? .09) * 1.15);
                            let e = activePatch.counter[r];
                            e >= 0 && t % 2 == 0 && playFormant(midiToHz(degreeToMidi(e, 12)), .24, .08, `a`, `f`)
                        } else playChoirChord(i, activePatch.leadPeak ?? .09), t % 4 == 0 && playFormant(midiToHz(degreeToMidi(a + 4, 12)), .26, .07, `a`, `f`)
                    }
                }
                n % 32 == 28 && (playFormant(midiToHz(degreeToMidi(3, 0)), .3, .09, `a`, `m`), playFormant(midiToHz(degreeToMidi(3, 12)), .28, .07, `a`, `f`)), n % 32 == 30 && (playFormant(midiToHz(degreeToMidi(0, 0)), .32, .1, `o`, `m`), playFormant(midiToHz(degreeToMidi(0, 12)), .3, .08, `o`, `f`))
            } catch {}
            scheduleNextTick();
            return
        }
        if (activePatch.whistle) {
            let e = activePatch.leadEvery || 2;
            if (n % 16 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .25, `triangle`, .025, void 0, `bgm`), n % e === 0) {
                let t = Math.floor(n / e),
                    r = Math.floor(t / 16) % 2,
                    i = t % activePatch.lead.length;
                if (r === 0) {
                    let e = activePatch.lead[i];
                    e >= 0 && playWhistleArp(e, activePatch.leadOct ?? 12, activePatch.leadPeak ?? .07)
                } else {
                    let e = activePatch.counter[i];
                    e >= 0 && playWhistleArp(e, (activePatch.leadOct ?? 12) + 12, (activePatch.leadPeak ?? .07) * .9)
                }
            }
            if (n % 16 == 12) {
                let t = activePatch.lead[Math.floor(n / e) % activePatch.lead.length];
                t >= 0 && playWhistleTone(midiToHz(degreeToMidi(t, 24)), .04, .18)
            }
            scheduleNextTick();
            return
        }
        if (activePatch.canon) {
            let e = Math.max(2, activePatch.chordTicks || 4),
                t = Math.floor(n / 2);
            if (n % 16 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .2, `triangle`, .03, void 0, `bgm`), n % 2 == 0) {
                let e = t % activePatch.lead.length,
                    n = activePatch.lead[e];
                n >= 0 && (playCanonLead(n, activePatch.leadOct ?? 12, activePatch.leadPeak ?? .09), t % 8 == 0 && playCanonLead(n + 2, (activePatch.leadOct ?? 12) - 12, .035))
            }
            if (n % 2 == 0) {
                let n = t - e;
                if (n >= 0) {
                    let e = n % activePatch.lead.length,
                        t = activePatch.lead[e];
                    t >= 0 && (playCanonFollow(t, .13), n % 4 == 0 && tone(midiToHz(degreeToMidi(t, 0)), .08, `triangle`, .04, void 0, `bgm`))
                }
            }
            if (n % 8 == 5) {
                let e = activePatch.lead[(t + 2) % activePatch.lead.length];
                e >= 0 && playCanonLead(e + 4, 24, .03)
            }
            scheduleNextTick();
            return
        }
        if (activePatch.organ) {
            if (n % 8 == 0 && playOrganPedal(a), n % (activePatch.leadEvery || 4) === 0) {
                let e = Math.floor(n / (activePatch.leadEvery || 4)) % activePatch.lead.length,
                    t = activePatch.lead[e];
                if (t >= 0) {
                    playOrganStack(t, activePatch.leadOct ?? 12, activePatch.leadPeak ?? .08);
                    let n = activePatch.counter[e];
                    n >= 0 && playOrganStack(n, (activePatch.leadOct ?? 12) - 12, .04)
                }
            }
            n % 16 == 0 && playOrganStack(a, 0, .05), (n % 32 == 24 || n % 32 == 28) && (playOrganStack(4, 12, .07), playOrganPedal(4)), scheduleNextTick();
            return
        }
        if (activePatch.fugue && activePatch.fugueSubject) {
            let e = activePatch.fugueSubject,
                t = e.length,
                r = FUGUE_COUNTERS[Math.floor((activePatch.arr ?? 0) / 16) % 4] || FUGUE_COUNTERS[0],
                i = activePatch.arr != null && activePatch.arr >= 48 ? Math.max(10, t - 2) : activePatch.arr != null && activePatch.arr >= 24 ? Math.max(12, t - 1) : t,
                o = [0, 4, 0, 4, 7],
                s = [12, 0, 12, 24, 0],
                c = [.12, .11, .1, .095, .09];
            n % 8 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .2, `triangle`, .08, void 0, `bgm`), n % 16 == 0 && tone(midiToHz(degreeToMidi(a, -24)), .22, `triangle`, .05, void 0, `bgm`);
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
                    playFugueVoice(midiToHz(degreeToMidi(e + o[n] % 4, s[n])), c[n] * .55, n, .12);
                    continue
                }
                let f = e[(u % t + t) % t];
                f < 0 || (f += o[n], playFugueVoice(midiToHz(degreeToMidi(f, s[n])), c[n], n, .15))
            }
            l > u && l % (t * 2) == t - 1 && playBrassFanfare(a, 12, .05), l > d && l % t === t - 1 && playBrassFanfare(a + 4, 12, .045), scheduleNextTick();
            return
        }
        if (activePatch.flavor) {
            let e = activePatch.flavor,
                t = activePatch.leadEvery ?? 2,
                i = activePatch.leadPeak ?? .09,
                o = activePatch.leadOct ?? 12;
            if (e === `dawn`) {
                if (n % 8 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .22, `triangle`, .06, void 0, `bgm`), n % t === 0) {
                    let e = Math.floor(n / t) % activePatch.lead.length,
                        r = activePatch.lead[e];
                    r >= 0 && (tone(midiToHz(degreeToMidi(r, 12)), .14, `triangle`, i, void 0, `bgm`), tone(midiToHz(degreeToMidi(r, 12)), .1, `sine`, i * .4, void 0, `bgm`));
                    let a = activePatch.counter[e];
                    a >= 0 && tone(midiToHz(degreeToMidi(a, 0)), .13, `triangle`, i * .7, void 0, `bgm`)
                }
                n % 16 == 12 && tone(midiToHz(degreeToMidi(a + 4, 24)), .2, `sine`, .04, void 0, `bgm`), scheduleNextTick();
                return
            }
            if (e === `subject`) {
                let e = Math.floor(n / t),
                    r = activePatch.lead.length / 2;
                if (n % t === 0) {
                    let t = e % activePatch.lead.length,
                        n = activePatch.lead[t];
                    n >= 0 && (tone(midiToHz(degreeToMidi(n, 12)), .15, `square`, i * 1.1, void 0, `bgm`), tone(midiToHz(degreeToMidi(n, 12)), .12, `triangle`, i * .5, void 0, `bgm`))
                }
                if (e >= r && (n % 4 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .16, `triangle`, .09, void 0, `bgm`), n % t === 0)) {
                    let t = e % activePatch.counter.length,
                        n = activePatch.counter[t];
                    n >= 0 && tone(midiToHz(degreeToMidi(n, 0)), .12, `triangle`, i * .55, void 0, `bgm`)
                }
                scheduleNextTick();
                return
            }
            if (e === `continuo`) {
                if (n % 1 == 0 && n % 2 == 0) {
                    let e = Math.floor(n / 2) % activePatch.counter.length,
                        t = activePatch.counter[e];
                    t >= 0 && (tone(midiToHz(degreeToMidi(t, -12)), .12, `triangle`, .13, void 0, `bgm`), tone(midiToHz(degreeToMidi(t, -24)), .14, `triangle`, .06, void 0, `bgm`))
                }
                if (n % 4 == 2 && (tone(midiToHz(degreeToMidi(a, 12)), .08, `square`, .05, void 0, `bgm`), tone(midiToHz(degreeToMidi(a + 2, 12)), .08, `square`, .04, void 0, `bgm`), tone(midiToHz(degreeToMidi(a + 4, 12)), .08, `triangle`, .04, void 0, `bgm`)), n % t === 0) {
                    let e = Math.floor(n / t) % activePatch.lead.length,
                        r = activePatch.lead[e];
                    r >= 0 && tone(midiToHz(degreeToMidi(r, 12)), .1, `triangle`, i * .8, void 0, `bgm`)
                }
                scheduleNextTick();
                return
            }
            if (e === `bells`) {
                if (n % t === 0) {
                    let e = Math.floor(n / t) % activePatch.lead.length,
                        r = activePatch.lead[e];
                    if (r >= 0) {
                        playBell(midiToHz(degreeToMidi(r, o > 12 ? 12 : o)), i);
                        let t = activePatch.counter[e];
                        t >= 0 && n % 8 == 0 && playBell(midiToHz(degreeToMidi(t, 12)), i * .35)
                    }
                }
                n % 32 == 0 && noiseBurst(.15, .02, 800, `bgm`), scheduleNextTick();
                return
            }
            if (e === `chase`) {
                n % 2 == 0 && tone(midiToHz(degreeToMidi(a + (n % 8 == 0 ? 0 : 4), -12)), .08, `triangle`, .08, void 0, `bgm`);
                let e = activePatch.lead[n % activePatch.lead.length];
                e >= 0 && tone(midiToHz(degreeToMidi(e, 12)), .08, `square`, i, void 0, `bgm`);
                let t = activePatch.lead[(n + activePatch.lead.length - 1) % activePatch.lead.length];
                t >= 0 && tone(midiToHz(degreeToMidi(t + 3, 0)), .07, `triangle`, i * .65, void 0, `bgm`), n % 4 == 0 && tone(midiToHz(degreeToMidi(a, 24)), .05, `square`, .04, void 0, `bgm`), scheduleNextTick();
                return
            }
            if (e === `silence`) {
                if (n % t === 0) {
                    let e = Math.floor(n / t) % activePatch.lead.length,
                        r = activePatch.lead[e];
                    r >= 0 && (tone(midiToHz(degreeToMidi(r, 0)), .35, `sine`, i, void 0, `bgm`), tone(midiToHz(degreeToMidi(r, 0)), .3, `triangle`, i * .5, void 0, `bgm`))
                }
                n % 64 == 32 && noiseBurst(.2, .015, 400, `bgm`), scheduleNextTick();
                return
            }
            if (e === `iron`) {
                if (n % 4 == 0 && playDistorted(a, .1), n % t === 0) {
                    let e = Math.floor(n / t) % activePatch.lead.length,
                        r = activePatch.lead[e];
                    r >= 0 && (tone(midiToHz(degreeToMidi(r, 0)), .12, `square`, i, void 0, `bgm`), tone(midiToHz(degreeToMidi(r + 4, 0)), .12, `square`, i * .7, void 0, `bgm`))
                }(r === 0 || r === 8) && tone(60, .08, `square`, .1, 40, `bgm`), scheduleNextTick();
                return
            }
            if (e === `tear`) {
                if (n % t === 0) {
                    let e = Math.floor(n / t) % activePatch.lead.length,
                        r = activePatch.lead[e],
                        a = activePatch.lead[(e + activePatch.lead.length - 1) % activePatch.lead.length];
                    r >= 0 && a >= 0 && Math.abs(r - a) >= 4 ? playSlide(a, r, i) : r >= 0 && (tone(midiToHz(degreeToMidi(r, 12)), .12, `square`, i, void 0, `bgm`), tone(midiToHz(degreeToMidi(r, 24)), .06, `triangle`, i * .3, void 0, `bgm`))
                }
                n % 8 == 4 && tone(midiToHz(degreeToMidi(a, -12)), .1, `triangle`, .08, void 0, `bgm`), scheduleNextTick();
                return
            }
            if (e === `storm`) {
                n % 2 == 0 && tone(midiToHz(degreeToMidi(a + n % 4, -12)), .08, `triangle`, .09, void 0, `bgm`);
                let e = activePatch.lead[n % activePatch.lead.length];
                e >= 0 && playTriad(e, 12, i * .85, `square`);
                let t = activePatch.counter[n % activePatch.counter.length];
                t >= 0 && n % 2 == 1 && tone(midiToHz(degreeToMidi(t, 24)), .06, `square`, i * .45, void 0, `bgm`), r === 0 && playBrassFanfare(a, 0, .05), n % 3 == 0 && noiseBurst(.02, .03, 5e3, `bgm`), scheduleNextTick();
                return
            }
            if (e === `abyss`) {
                // ── 深海のバス: 三和音オルゴール ──
                let every = t;
                let peak = i;
                let oct = o > 12 ? o : 24;
                // コード三和音（prog ルート）を小節頭で箱を鳴らす
                if (n % 8 === 0) {
                    playMusicBoxTriad(a, 12, peak * .55);
                }
                // 中間拍で 3 度転回を薄く
                if (n % 8 === 4) {
                    playMusicBoxTriad(a, 0, peak * .28);
                }
                // メロディ: broken triad ラインを music-box pluck
                if (n % every === 0) {
                    let idx = Math.floor(n / every) % activePatch.lead.length;
                    let deg = activePatch.lead[idx];
                    if (deg >= 0) {
                        playMusicBoxNote(
                            midiToHz(degreeToMidi(deg, oct)),
                            peak,
                            .5,
                        );
                    }
                    let cdeg = activePatch.counter[idx];
                    if (cdeg >= 0) {
                        setTimeout(() => {
                            try {
                                playMusicBoxNote(
                                    midiToHz(degreeToMidi(cdeg, oct - 12)),
                                    peak * .4,
                                    .35,
                                );
                            } catch {}
                        }, 40);
                    }
                }
                // アルペジオ的に 1-3-5 を 2 拍おきに散らす
                if (n % 4 === 2) {
                    let step = Math.floor(n / 4) % 3;
                    let arpDeg = a + [0, 2, 4][step];
                    playMusicBoxNote(
                        midiToHz(degreeToMidi(arpDeg, 24)),
                        peak * .35,
                        .3,
                    );
                }
                scheduleNextTick();
                return
            }
            if (e === `cadence`) {
                if (n % 4 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .14, `triangle`, .1, void 0, `bgm`), n % t === 0) {
                    let e = Math.floor(n / t) % activePatch.lead.length,
                        r = activePatch.lead[e];
                    r >= 0 && (tone(midiToHz(degreeToMidi(r, 12)), .12, `square`, i, void 0, `bgm`), tone(midiToHz(degreeToMidi(r + 2, 12)), .12, `triangle`, i * .55, void 0, `bgm`), tone(midiToHz(degreeToMidi(r + 4, 12)), .12, `triangle`, i * .4, void 0, `bgm`))
                }
                r === 0 && playBrassFanfare(a, 12, .07), r === 8 && playBrassFanfare(a + 4, 12, .055), n % 32 == 30 && playBrassFanfare(0, 12, .08), scheduleNextTick();
                return
            }
        }
        let e = activePatch.bassMode ?? 1,
            t = activePatch.leadMode ?? 0,
            i = activePatch.gtrMode ?? 1,
            o = activePatch.brassMode ?? 1,
            s = activePatch.leadEvery ?? 2,
            c = activePatch.leadOct ?? 12,
            l = activePatch.gtrOct ?? 12,
            u = activePatch.brassOct ?? 0,
            d = activePatch.leadPeak ?? .09;
        if (e === 0) n % 4 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .16, `triangle`, .12, void 0, `bgm`);
        else if (e === 1) n % 2 == 0 && tone(midiToHz(degreeToMidi(n % 8 == 0 ? a : n % 8 == 2 ? a + 2 : n % 8 == 4 ? a + 4 : a + 3, -12)), .11, `triangle`, .11, void 0, `bgm`);
        else if (e === 2) {
            if (n % 2 == 0) {
                let e = [a, a, a + 4, a + 5][n / 2 % 4];
                tone(midiToHz(degreeToMidi(e, -12)), .1, `triangle`, .13, void 0, `bgm`), tone(midiToHz(degreeToMidi(e, -24)), .12, `triangle`, .06, void 0, `bgm`)
            }
        } else e === 3 ? n % 8 == 0 && tone(midiToHz(degreeToMidi(a, -12)), .18, `triangle`, .14, void 0, `bgm`) : e === 4 ? (n % 4 == 1 || n % 4 == 2) && tone(midiToHz(degreeToMidi(a + (n % 8 == 1 ? 0 : 4), -12)), .09, `triangle`, .1, void 0, `bgm`) : n % 2 == 0 && (tone(midiToHz(degreeToMidi(a, -12)), .1, `square`, .08, void 0, `bgm`), tone(midiToHz(degreeToMidi(a + 4, -12)), .1, `triangle`, .07, void 0, `bgm`));
        if (n % s === 0) {
            let e = Math.floor(n / s) % activePatch.lead.length,
                r = activePatch.lead[e];
            if (r >= 0) {
                if (t === 0 || t === 1) playTriad(r, c, d, activePatch.leadDuty);
                else if (t === 2) tone(midiToHz(degreeToMidi(r, c)), .12, activePatch.leadDuty, d * 1.15, void 0, `bgm`);
                else if (t === 3) {
                    let e = [0, 2, 4, 7][n / s % 4];
                    tone(midiToHz(degreeToMidi(r + e, c)), .08, `square`, d, void 0, `bgm`)
                } else if (t === 4) playBrassFanfare(r, c > 12 ? 12 : c, d * .7);
                else if (Math.floor(n / s) % 2 == 0) playTriad(r, c, d, activePatch.leadDuty);
                else {
                    let t = activePatch.counter[e] ?? r;
                    t >= 0 && tone(midiToHz(degreeToMidi(t, c)), .11, `square`, d, void 0, `bgm`)
                }
            }
        }
        if (i === 1 && n % 2 == 1) {
            let e = Math.floor(n / 2) % Math.max(1, activePatch.counter.length),
                t = activePatch.counter[e];
            t >= 0 ? playPluck(t, l) : n % 4 == 1 && playPluck(a + 4, l)
        } else if (i === 2) {
            let e = activePatch.counter[n % Math.max(1, activePatch.counter.length)];
            e >= 0 && n % 1 == 0 && (n % 2 == 0 || n % 3 == 0) && playPluck(e, l)
        } else if (i === 3 && n % 4 == 0) {
            let e = midiToHz(degreeToMidi(a, l));
            tone(e, .1, `square`, .08, void 0, `bgm`), tone(midiToHz(degreeToMidi(a + 4, l)), .1, `square`, .06, void 0, `bgm`), tone(e * 2, .06, `square`, .04, void 0, `bgm`)
        } else i === 4 && n % 8 == 2 && playPluck(a + 2, l);
        if (o === 1 && n % 4 == 0) playBrassNote(a, u);
        else if (o === 2 && n % 2 == 0) playBrassNote(a + (n / 2 % 2 == 0 ? 0 : 2), u);
        else if (o === 3 && r === 0) playBrassFanfare(a, u, .06);
        else if (o === 4 && n % 8 == 0) playTriad(a, u, .05, `triangle`);
        else if (o === 5 && n % 4 == 2) {
            let e = Math.floor(n / 2) % Math.max(1, activePatch.counter.length),
                t = activePatch.counter[e];
            t >= 0 && playBrassNote(t, u)
        }
        o === 3 && r === 8 && (activePatch.arr ?? 0) % 2 == 0 && playBrassNote(a + 4, u), scheduleNextTick();
        return
    }
    if (n % 2 == 0 && tone(midiToHz(degreeToMidi(n % 8 == 6 ? a + 4 : a, -12)), .09, `triangle`, bgmMode === `attract` ? .07 : .11, void 0, `bgm`), tone(midiToHz(degreeToMidi(pickArpStep(arpSteps(a), activePatch.arpStyle, n), 12)), .055, `square`, bgmMode === `attract` ? .035 : .055, void 0, `bgm`), n % 2 == 0) {
        let e = Math.floor(n / 2) % activePatch.lead.length,
            t = activePatch.lead[e];
        if (t >= 0) {
            let e = midiToHz(degreeToMidi(t, 12)),
                r = bgmMode === `attract` ? .07 : .1;
            tone(e, .1, activePatch.leadDuty, r, void 0, `bgm`), bgmMode !== `attract` && n % 4 == 0 && tone(e * 2, .06, `square`, r * .35, void 0, `bgm`)
        }
    }
    activePatch.style === `legacy` && r === 0 && [7, 5, 4, 2].forEach((e, t) => {
        setTimeout(() => tone(midiToHz(degreeToMidi(e, 24)), .05, `square`, .06, void 0, `bgm`), t * (activePatch.tempo * .45))
    }), scheduleNextTick()
}

export function scheduleNextTick() {
    if (tickTimer && clearTimeout(tickTimer), bgmMode === `off` || u) return;
    let e = bgmMode === `attract` && tickIndex % 2 == 1 ? activePatch.tempo * .06 : 0;
    tickTimer = setTimeout(bgmResume, Math.max(55, activePatch.tempo + e))
}

export function clearBgmTimer() {
    tickTimer &&= (clearTimeout(tickTimer), null)
}


// ── BGM scheduler ──
export function bgmStartScene(e, t = 1) {
    if (clearBgmTimer(), bgmMode = e, bgmStage = Math.max(1, t | 0), themeSeed = 0, tickIndex = 0, activePatch = makeChipPatch(e === `attract` ? 1 : bgmStage, !1), e === `attract` && (activePatch = {
            ...makeChipPatch(8, !1),
            tempo: 110,
            drum: 5,
            leadDuty: `triangle`
        }), u) return;
    let n = ensureAudioCtx();
    if (n && n.state === `suspended`) {
        n.resume().then(() => {
            !u && bgmMode === e && bgmResume()
        }), scheduleNextTick();
        return
    }
    bgmResume()
}

export function bgmBoss(e = 0, t = 1) {
    if (clearBgmTimer(), bgmMode = `boss`, themeSeed = ((e | 0) % 8 + 8) % 8, bgmStage = Math.max(1, t | 0), tickIndex = 0, activePatch = makeBossPatch(bgmStage), u) return;
    let n = ensureAudioCtx();
    if (n && n.state === `suspended`) {
        n.resume().then(() => {
            !u && bgmMode === `boss` && bgmResume()
        }), scheduleNextTick();
        return
    }
    bgmResume()
}

export function bgmStop(e = 0, t = 1) {
    if (clearBgmTimer(), bgmMode = `boss`, themeSeed = ((e | 0) % 8 + 8) % 8, bgmStage = Math.max(1, t | 0), tickIndex = 0, activePatch = makeChipPatch(bgmStage, !0), activePatch.style = `legacy`, activePatch.tempo = Math.max(70, activePatch.tempo - themeSeed), activePatch.arpStyle = (activePatch.arpStyle + themeSeed) % 4, u) return;
    let n = ensureAudioCtx();
    if (n && n.state === `suspended`) {
        n.resume().then(() => {
            !u && bgmMode === `boss` && bgmResume()
        }), scheduleNextTick();
        return
    }
    bgmResume()
}

export function bgmUnlock() {
    clearBgmTimer(), bgmMode = `off`
}

export function playBgmForMode(e, t = 1) {
    let n = Math.max(1, Math.min(64, t | 0));
    return e === `title` ? (bgmStartScene(`attract`), `TITLE THEME`) : e === `stage` ? (bgmStartScene(`play`, n), `STAGE ${String(n).padStart(2,`0`)} BGM`) : e === `legacy` ? (bgmStop((n - 1) % 8, n), `旧ボス ${String(n).padStart(2,`0`)} (CHIP)`) : (bgmBoss((n - 1) % 8, n), getBossThemeMeta(n).title)
}

export function soundCatalogMeta() {
    return {
        stages: 64,
        bosses: 64,
        labels: {
            title: `TITLE THEME`,
            stage: e => `STAGE ${String(e).padStart(2,`0`)}`,
            boss: e => getBossThemeMeta(e).title,
            legacy: e => `旧B${String(e).padStart(2,`0`)} CHIP`
        }
    }
}

