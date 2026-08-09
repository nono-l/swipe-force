/**
 * Procedural chiptune BGM/SFX — Konami-ish punch + keygen arps.
 * Square/triangle/noise only, no audio files.
 * iOS: call unlockAudio() on first gesture.
 */

type Scene = "attract" | "play" | "boss" | "off";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let unlocked = false;
/** 0..1 linear levels (applied under base gain) */
let masterLevel = 1;
let bgmLevel = 0.85;
let sfxLevel = 1;
const BASE_GAIN = 0.26;

const last: Record<string, number> = {};
function throttle(key: string, ms: number): boolean {
  const now = performance.now();
  if (now - (last[key] ?? 0) < ms) return false;
  last[key] = now;
  return true;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : BASE_GAIN * masterLevel;
    master.connect(ctx.destination);
  }
  return ctx;
}

function out(): GainNode | null {
  ac();
  return master;
}

export function unlockAudio(): void {
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
  applyMasterGain();
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

function applyMasterGain() {
  if (!master) return;
  const v = muted ? 0 : BASE_GAIN * Math.max(0, Math.min(1, masterLevel));
  master.gain.setTargetAtTime(v, ac()?.currentTime ?? 0, 0.02);
}

export function setMuted(m: boolean): void {
  muted = m;
  applyMasterGain();
  if (m) stopBgm();
}

export function toggleMute(): boolean {
  setMuted(!muted);
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

export function setMasterVol(v: number) {
  masterLevel = Math.max(0, Math.min(1, v));
  applyMasterGain();
}
export function setBgmVol(v: number) {
  bgmLevel = Math.max(0, Math.min(1, v));
}
export function setSfxVol(v: number) {
  sfxLevel = Math.max(0, Math.min(1, v));
}
export function getVolumes() {
  return { master: masterLevel, bgm: bgmLevel, sfx: sfxLevel, muted };
}

function envGain(c: AudioContext, dest: AudioNode, peak: number, a: number, d: number): GainNode {
  const g = c.createGain();
  const t = c.currentTime;
  // chip envelope: instant attack, fast decay
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + Math.max(0.001, a));
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  g.connect(dest);
  return g;
}

/** hard square/triangle blip (NES/Konami style). bus: sfx|bgm */
function blip(
  freq: number,
  dur: number,
  type: OscillatorType = "square",
  peak = 0.12,
  slideTo?: number,
  bus: "sfx" | "bgm" = "sfx",
) {
  if (muted) return;
  const c = ac();
  const m = out();
  if (!c || !m || c.state === "suspended") return;
  const lvl = bus === "bgm" ? bgmLevel : sfxLevel;
  if (lvl <= 0.001) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(20, freq), t0);
  if (slideTo != null) {
    o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  }
  const g = envGain(c, m, peak * lvl, 0.002, dur);
  o.connect(g);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

function noise(dur: number, peak = 0.15, lp = 4000, bus: "sfx" | "bgm" = "sfx") {
  if (muted) return;
  const lvl = bus === "bgm" ? bgmLevel : sfxLevel;
  if (lvl <= 0.001) return;
  peak *= lvl;
  const c = ac();
  const m = out();
  if (!c || !m || c.state === "suspended") return;
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(lp, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(Math.max(80, lp * 0.15), c.currentTime + dur);
  const g = envGain(c, m, peak, 0.001, dur);
  src.connect(f);
  f.connect(g);
  src.start();
  src.stop(c.currentTime + dur + 0.02);
}

function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// —— SFX (chip blips) ——

export function sfxShoot() {
  if (!throttle("shoot", 40)) return;
  blip(880, 0.04, "square", 0.07, 520);
}

export function sfxMissile() {
  if (!throttle("missile", 70)) return;
  blip(200, 0.1, "square", 0.09, 80);
  blip(400, 0.06, "square", 0.05, 150);
}

export function sfxParticle() {
  if (!throttle("particle", 80)) return;
  blip(1200, 0.08, "sawtooth", 0.08, 400);
  blip(600, 0.1, "square", 0.05);
}

export function sfxLockon() {
  if (!throttle("lock", 60)) return;
  blip(500, 0.04, "square", 0.06, 1400);
}

export function sfxHit() {
  if (!throttle("hit", 28)) return;
  blip(300, 0.03, "square", 0.05, 120);
}

export function sfxExplode(big = false) {
  if (!throttle(big ? "xbig" : "xsm", big ? 70 : 35)) return;
  noise(big ? 0.28 : 0.12, big ? 0.22 : 0.12, big ? 2200 : 1400);
  if (big) blip(100, 0.2, "triangle", 0.1, 40);
}

export function sfxPlayerHit() {
  if (!throttle("phit", 90)) return;
  noise(0.16, 0.2, 900);
  blip(180, 0.15, "square", 0.1, 50);
}

export function sfxBossWarn() {
  if (!throttle("boss", 400)) return;
  blip(220, 0.12, "square", 0.12);
  setTimeout(() => blip(220, 0.12, "square", 0.12), 140);
  setTimeout(() => blip(160, 0.2, "square", 0.14, 90), 280);
}

export function sfxStageClear() {
  if (!throttle("clear", 500)) return;
  // Konami-ish rising fanfare
  [523, 659, 784, 1046, 1318].forEach((f, i) => {
    setTimeout(() => blip(f, 0.1, "square", 0.1), i * 70);
  });
}

export function sfxGameOver() {
  if (!throttle("go", 500)) return;
  blip(400, 0.15, "square", 0.1, 200);
  setTimeout(() => blip(250, 0.2, "square", 0.1, 120), 150);
  setTimeout(() => blip(120, 0.35, "triangle", 0.12, 55), 320);
}

export function sfxBuy() {
  if (!throttle("buy", 70)) return;
  blip(660, 0.05, "square", 0.08);
  setTimeout(() => blip(990, 0.07, "square", 0.09), 45);
}

export function sfxBuyFail() {
  if (!throttle("buyfail", 90)) return;
  blip(160, 0.08, "square", 0.08, 90);
}

export function sfxUi() {
  if (!throttle("ui", 45)) return;
  blip(520, 0.03, "square", 0.05);
}

export function sfxStart() {
  if (!throttle("start", 300)) return;
  [440, 554, 659, 880].forEach((f, i) => {
    setTimeout(() => blip(f, 0.08, "square", 0.09), i * 60);
  });
}

// —— Chiptune engine: arps + lead + bass + noise kit ——

let scene: Scene = "off";
let bossId = 0;
let stageNum = 1;
let tick = 0;
let timeout: ReturnType<typeof setTimeout> | null = null;

/** scale degrees in semitones from tonic */
const SCALES: number[][] = [
  [0, 2, 3, 5, 7, 8, 10], // natural minor — keygen classic
  [0, 2, 3, 5, 7, 8, 11], // harmonic minor — dramatic
  [0, 2, 4, 5, 7, 9, 10], // mixolydian
  [0, 2, 3, 5, 7, 9, 10], // dorian
  [0, 1, 3, 5, 7, 8, 10], // phrygian
  [0, 2, 4, 5, 7, 9, 11], // major (brighter stages)
  [0, 2, 4, 6, 7, 9, 11], // lydian
  [0, 2, 3, 5, 6, 8, 10], // locrian-ish dark
];

/** chord as scale-degree triads+ for arpeggio (root,3,5,7,oct) */
type Theme = {
  tonic: number; // midi
  scale: number[];
  /** progression of scale roots (degree index) */
  prog: number[];
  /** lead melody scale degrees, -1 rest, 32 steps */
  lead: number[];
  tempo: number; // ms per 16th-ish tick
  arpStyle: number; // 0 up 1 down 2 updown 3 alt
  drum: number;
  leadDuty: "square" | "triangle";
};

function mulberry(seed: number): () => number {
  let t = (seed >>> 0) + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** classic keygen/chiptune melody cells (scale degrees) */
const LEAD_CELLS: number[][] = [
  [0, 2, 4, 5, 4, 2, 0, -1, 5, 4, 2, 0, 2, 4, 5, 7],
  [0, -1, 0, 3, 5, -1, 7, 5, 4, 2, 0, 2, 4, -1, 5, 4],
  [4, 5, 7, 5, 4, 2, 0, -1, 0, 2, 4, 5, 7, 9, 7, 5],
  [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 0, 0, -1, -1],
  [7, 5, 4, 2, 0, 2, 4, 5, 4, -1, 2, 0, -1, 2, 4, 0],
  [0, 2, -1, 5, 4, 2, 0, 5, 7, 5, 4, 2, 0, -1, 4, 5],
  [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 1, 3],
  [5, 4, 2, 0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, -1],
];

const PROG_BANK: number[][] = [
  [0, 5, 3, 4], // i VI III IV-ish
  [0, 3, 4, 0],
  [0, 4, 5, 3],
  [0, 5, 0, 4],
  [0, 2, 3, 4],
  [5, 4, 0, 3],
  [0, 3, 0, 5],
  [0, 4, 0, 5],
];

function buildTheme(stage: number, boss: boolean): Theme {
  const s = ((Math.max(1, stage) - 1) % 64 + 64) % 64;
  const rnd = mulberry(s * 7919 + (boss ? 4242 : 17) + bossId * 99);
  const scale = SCALES[(s + (boss ? bossId : 0)) % SCALES.length];
  // tonic midi — chip range
  const tonics = [45, 47, 48, 50, 52, 53, 55, 57]; // A2..A3 area
  const tonic = tonics[s % tonics.length] - (boss ? 2 : 0);

  let prog = PROG_BANK[s % PROG_BANK.length].slice();
  if (boss) prog = [0, 0, 3, 4, 0, 5, 4, 0]; // more driving

  // 32-step lead from two cells + mutation
  const a = LEAD_CELLS[s % LEAD_CELLS.length];
  const b = LEAD_CELLS[(s * 3 + 1) % LEAD_CELLS.length];
  const lead = [...a, ...b];
  for (let i = 0; i < lead.length; i++) {
    if (rnd() > 0.85 && lead[i] >= 0) {
      lead[i] = Math.max(0, Math.min(scale.length + 1, lead[i] + (rnd() > 0.5 ? 1 : -1)));
    }
    if (boss && i % 8 === 7) lead[i] = -1; // breath
  }

  // keygen = faster arps; konami stage = mid; boss = punchy
  let tempo = 95 + (s % 12) * 4; // ms per tick (~16th)
  if (boss) tempo = 85 + bossId * 4 + (s % 5) * 2;
  if (!boss && s % 5 === 0) tempo = 78 + (s % 4) * 3; // faster keygen stages

  return {
    tonic,
    scale,
    prog,
    lead,
    tempo: Math.max(70, Math.min(140, tempo)),
    arpStyle: (s + bossId) % 4,
    drum: (s + (boss ? 3 : 0)) % 6,
    leadDuty: s % 3 === 0 ? "triangle" : "square",
  };
}

let theme: Theme = buildTheme(1, false);

function degMidi(degree: number, oct = 0): number {
  const sc = theme.scale;
  let d = degree;
  let o = oct;
  while (d < 0) {
    d += sc.length;
    o -= 12;
  }
  // allow degrees beyond scale length → next octaves
  while (d >= sc.length) {
    d -= sc.length;
    o += 12;
  }
  return theme.tonic + sc[d] + o;
}

/** fast chip arpeggio tones for current chord */
function arpNotes(rootDeg: number): number[] {
  // R, 3, 5, 7, R+oct (in scale degrees)
  return [rootDeg, rootDeg + 2, rootDeg + 4, rootDeg + 6, rootDeg + 7];
}

function orderArp(notes: number[], style: number, t: number): number {
  const n = notes.length;
  if (style === 0) return notes[t % n]; // up
  if (style === 1) return notes[n - 1 - (t % n)]; // down
  if (style === 2) {
    // up-down
    const cycle = n * 2 - 2;
    const p = t % cycle;
    return p < n ? notes[p] : notes[cycle - p];
  }
  // alt pinpon
  return notes[t % 2 === 0 ? 0 : 2 + (t % 3)];
}

function chipKick() {
  blip(140, 0.07, "triangle", 0.14, 45, "bgm");
  noise(0.025, 0.06, 600, "bgm");
}
function chipSnare() {
  noise(0.06, 0.12, 3500, "bgm");
  blip(220, 0.03, "square", 0.04, 100, "bgm");
}
function chipHat(open = false) {
  noise(open ? 0.05 : 0.02, open ? 0.045 : 0.03, open ? 9000 : 7000, "bgm");
}

function drums(beat16: number) {
  const d = theme.drum;
  const b = beat16 % 16;
  if (scene === "attract") {
    if (b === 0 || b === 8) chipKick();
    if (b === 4 || b === 12) chipHat(false);
    if (b === 14) chipSnare();
    return;
  }
  // various chip kits
  if (d === 0) {
    // four-on-floor 8bit
    if (b % 4 === 0) chipKick();
    if (b === 4 || b === 12) chipSnare();
    if (b % 2 === 1) chipHat(false);
  } else if (d === 1) {
    // konami gallop-ish
    if (b === 0 || b === 6 || b === 8 || b === 14) chipKick();
    if (b === 4 || b === 12) chipSnare();
    if (b % 2 === 0) chipHat(b % 4 === 2);
  } else if (d === 2) {
    // keygen break
    if (b === 0 || b === 3 || b === 8 || b === 10) chipKick();
    if (b === 4 || b === 11 || b === 14) chipSnare();
    chipHat(b % 3 === 0);
  } else if (d === 3) {
    // sparse boss
    if (b === 0 || b === 8) chipKick();
    if (b === 4 || b === 12) chipSnare();
    if (b === 2 || b === 6 || b === 10 || b === 14) chipHat(true);
  } else if (d === 4) {
    // double-time feel
    if (b % 2 === 0) chipKick();
    if (b === 4 || b === 6 || b === 12 || b === 14) chipSnare();
    if (b % 2 === 1) chipHat(false);
  } else {
    // classic 2&4
    if (b === 0 || b === 8) chipKick();
    if (b === 4 || b === 12) chipSnare();
    if (b % 2 === 1) chipHat(false);
    if (b === 15 && Math.random() > 0.6) noise(0.08, 0.08, 5000, "bgm");
  }
}

function chipTick() {
  if (muted || scene === "off") return;
  const c = ac();
  const m = out();
  if (!c || !m || c.state === "suspended") return;

  const t = tick++;
  const beat16 = t % 16;

  // chord changes every half bar (8 ticks)
  const chordIdx = Math.floor(t / 8) % theme.prog.length;
  const rootDeg = theme.prog[chordIdx];

  // —— noise drums ——
  drums(beat16);

  // —— bass (triangle, on 8ths) ——
  if (t % 2 === 0) {
    const bassDeg = t % 8 === 6 ? rootDeg + 4 : rootDeg; // walk to 5th
    const f = hz(degMidi(bassDeg, -12));
    blip(f, 0.09, "triangle", scene === "attract" ? 0.07 : 0.11, undefined, "bgm");
  }

  // —— keygen-style fast arpeggio (every tick) ——
  const notes = arpNotes(rootDeg);
  const ad = orderArp(notes, theme.arpStyle, t);
  const arpHz = hz(degMidi(ad, scene === "boss" ? 12 : 12));
  // quieter under lead; classic thin square arp
  blip(arpHz, 0.055, "square", scene === "attract" ? 0.035 : 0.055, undefined, "bgm");

  // —— main lead melody (8th notes-ish) ——
  if (t % 2 === 0) {
    const li = Math.floor(t / 2) % theme.lead.length;
    const deg = theme.lead[li];
    if (deg >= 0) {
      const f = hz(degMidi(deg, 12));
      const peak = scene === "attract" ? 0.07 : 0.1;
      blip(f, 0.1, theme.leadDuty, peak, undefined, "bgm");
      // echo octave (Konami thick lead)
      if (scene !== "attract" && t % 4 === 0) {
        blip(f * 2, 0.06, "square", peak * 0.35, undefined, "bgm");
      }
    }
  }

  // —— boss accent: short descending run every bar ——
  if (scene === "boss" && beat16 === 0) {
    [7, 5, 4, 2].forEach((d, i) => {
      setTimeout(
        () => blip(hz(degMidi(d, 24)), 0.05, "square", 0.06, undefined, "bgm"),
        i * (theme.tempo * 0.45),
      );
    });
  }

  scheduleNext();
}

function scheduleNext() {
  if (timeout) clearTimeout(timeout);
  if (scene === "off" || muted) return;
  // slight humanize only on attract; chip prefers tight grid
  const swing = scene === "attract" && tick % 2 === 1 ? theme.tempo * 0.06 : 0;
  timeout = setTimeout(chipTick, Math.max(55, theme.tempo + swing));
}

function clearScheduler() {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }
}

export function startBgm(kind: "attract" | "play", stage = 1) {
  clearScheduler();
  scene = kind;
  stageNum = Math.max(1, stage | 0);
  bossId = 0;
  tick = 0;
  theme = kind === "attract" ? buildTheme(1, false) : buildTheme(stageNum, false);
  if (kind === "attract") {
    theme = {
      ...buildTheme(8, false),
      tempo: 110,
      drum: 5,
      leadDuty: "triangle",
    };
  }
  if (muted) return;
  chipTick();
}

export function startBossBgm(vibe = 0, stage = 1) {
  clearScheduler();
  scene = "boss";
  bossId = ((vibe | 0) % 8 + 8) % 8;
  stageNum = Math.max(1, stage | 0);
  tick = 0;
  theme = buildTheme(stageNum, true);
  // vibe tweaks tempo/arp
  theme.tempo = Math.max(70, theme.tempo - bossId);
  theme.arpStyle = (theme.arpStyle + bossId) % 4;
  if (muted) return;
  chipTick();
}

export function stopBgm() {
  clearScheduler();
  scene = "off";
}

export function currentBossBgmId(): number {
  return bossId;
}

export function currentStageBgm(): number {
  return stageNum;
}
