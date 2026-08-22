/**
 * JPDOC: SE 合成（オシレータ）。ファイルを持たない。
 */
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
const BASE_GAIN = 0.38;

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

/** Ensure context is running; safe to call from any gesture. */
export function unlockAudio(): void {
  const c = ac();
  if (!c) return;

  // iOS Safari: play a tiny silent buffer inside the user gesture
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* ignore */
  }

  const kick = () => {
    unlocked = true;
    applyMasterGain();
    if (!muted && scene !== "off") {
      clearScheduler();
      try {
        chipTick();
      } catch {
        scheduleNext();
      }
    }
  };

  if (c.state === "suspended" || c.state === "interrupted") {
    void c
      .resume()
      .then(() => kick())
      .catch(() => {
        unlocked = true;
      });
    unlocked = true;
  } else {
    kick();
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

function applyMasterGain() {
  if (!master) return;
  const c = ac();
  const v = muted ? 0 : BASE_GAIN * Math.max(0, Math.min(1, masterLevel));
  if (c) master.gain.setTargetAtTime(v, c.currentTime, 0.02);
  else master.gain.value = v;
}

export function setMuted(m: boolean): void {
  muted = m;
  applyMasterGain();
  if (m) {
    clearScheduler(); // keep scene so unmute can resume
  } else if (scene !== "off") {
    clearScheduler();
    chipTick();
  }
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
  if (!c || !m) return;
  if (c.state === "suspended") {
    // try resume; note may be skipped until unlocked
    void c.resume();
    return;
  }
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
  const c = ac();
  const m = out();
  if (!c || !m) return;
  if (c.state === "suspended") {
    void c.resume();
    return;
  }
  const lvl = bus === "bgm" ? bgmLevel : sfxLevel;
  if (lvl <= 0.001) return;
  peak *= lvl;
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
  /** lead melody scale degrees, -1 rest, 32+ steps */
  lead: number[];
  tempo: number; // ms per 16th-ish tick
  arpStyle: number; // 0 up 1 down 2 updown 3 alt
  drum: number;
  leadDuty: "square" | "triangle";
  /** chip = stage/keygen, baroque = new boss, legacy = old boss chip */
  style: "chip" | "baroque" | "legacy";
  /** counter-subject (2nd voice), same length as lead */
  counter: number[];
  /** story chapter label for UI */
  story?: string;
  /** true = real multi-voice fugue (星屑のフーガ only) */
  fugue?: boolean;
  /** pipe-organ sacred style (祈りの半終止) */
  organ?: boolean;
  /** acoustic guitar + bass canon (影のカノン) */
  canon?: boolean;
  /** whistle 6-note chords, Japanese doyo style (鏡像の答) */
  whistle?: boolean;
  /** sutra×gospel mixed choir 8-note (決意の和声) */
  choir?: boolean;
  /** named remaining boss flavors (曲名寄せ) */
  flavor?:
    | "dawn"
    | "subject"
    | "continuo"
    | "bells"
    | "chase"
    | "silence"
    | "iron"
    | "tear"
    | "storm"
    | "abyss"
    | "cadence";
  /** subject for fugue (scale degrees, -1 rest) */
  fugueSubject?: number[];
  /** arrangement fingerprint 0..63 */
  arr?: number;
  /** 0 pedal 1 walk 2 ostinato 3 sparse 4 syncop 5 power */
  bassMode?: number;
  /** 0 triad8 1 triad4 2 single 3 arpeggio 4 pentad 5 call-resp */
  leadMode?: number;
  /** 0 off 1 offbeat 2 16ths 3 power 4 sparse */
  gtrMode?: number;
  /** 0 off 1 stab 2 sustain 3 fanfare 4 pad 5 answer */
  brassMode?: number;
  leadEvery?: number;
  leadOct?: number;
  gtrOct?: number;
  brassOct?: number;
  chordTicks?: number;
  leadPeak?: number;
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
  // wide tempo range so stages feel different (70–130ms)
  let tempo = 70 + (s % 16) * 3 + ((s * 5) % 7);
  if (boss) tempo = 85 + bossId * 4 + (s % 5) * 2;
  if (!boss && s % 5 === 0) tempo = 72 + (s % 8) * 2;

  // per-stage lead duty / drum more distinct
  const drum = boss ? (s + 3) % 6 : (s * 2 + 1) % 6;
  const leadDuty: "square" | "triangle" =
    !boss && s % 4 === 0 ? "triangle" : s % 3 === 0 ? "triangle" : "square";

  return {
    tonic,
    scale,
    prog,
    lead,
    tempo: Math.max(68, Math.min(135, tempo)),
    arpStyle: (s * 3 + bossId) % 4,
    drum,
    leadDuty,
    style: boss ? "legacy" : "chip",
    counter: lead.map((d, i) => (i % 2 === 0 ? d : -1)),
  };
}

// —— Bach / orchestral-feeling boss themes (story arc over 64 bosses) ——

/** baroque-friendly scales */
const BACH_SCALES: number[][] = [
  [0, 2, 3, 5, 7, 8, 10], // natural minor
  [0, 2, 3, 5, 7, 8, 11], // harmonic minor
  [0, 2, 4, 5, 7, 9, 11], // major
  [0, 2, 3, 5, 7, 9, 10], // dorian
  [0, 2, 4, 5, 7, 8, 11], // harmonic major-ish
];

/** functional progressions (scale-degree roots) — circle & cadences */
const BACH_PROGS: number[][] = [
  [0, 3, 4, 0], // i–iv–V–i
  [0, 4, 0, 5, 3, 4, 0, 0], // I–V–I–vi–IV–V–I
  [0, 5, 3, 4, 0, 3, 4, 0], // circle walk
  [0, 2, 5, 4, 0, 3, 4, 0], // I–ii–vi–V
  [0, 3, 0, 4, 5, 4, 0, 0], // pedal i
  [4, 0, 5, 3, 4, 0, 4, 0], // half-cadence drama
  [0, 4, 5, 3, 0, 5, 4, 0], // rising tension
  [0, 3, 4, 5, 3, 4, 0, 0], // lament-ish
];

/** subjects (scale degrees) — 16 distinct heads so neighboring bosses differ */
const BACH_SUBJECTS: number[][] = [
  [0, 2, 4, 5, 4, 2, 0, -1, 5, 4, 2, 0, 2, 4, 7, 5],
  [0, -1, 0, 2, 3, 5, 7, 5, 3, 2, 0, 2, 5, 4, 2, 0],
  [4, 2, 0, 2, 4, 5, 7, -1, 7, 5, 4, 2, 0, 2, 4, 0],
  [0, 0, 2, 4, -1, 5, 4, 2, 0, 3, 2, 0, -1, 4, 5, 7],
  [7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0, -1, 0, 2, 4, 5],
  [0, 3, 5, 7, 5, 3, 0, -1, 2, 4, 5, 7, 9, 7, 5, 4],
  [0, 2, -1, 4, 5, 4, 2, 0, 5, 7, 5, 4, 2, 0, -1, 0],
  [2, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 3, 5, 4, 2, 0],
  // more contrast
  [0, 7, 5, 4, 2, 0, -1, 2, 4, 5, 7, -1, 5, 4, 2, 0],
  [0, 0, 0, 2, 4, 4, 5, 5, 7, 5, 4, 2, 0, -1, -1, 0],
  [5, 4, 2, 0, -1, -1, 0, 2, 4, 7, 5, 4, 2, 0, 2, 4],
  [0, 4, 7, 4, 0, 5, 9, 5, 0, 4, 7, 11, 7, 4, 0, -1],
  [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 1, 3],
  [7, 7, 5, 5, 4, 4, 2, 0, 2, 4, 5, 7, -1, 5, 4, 2],
  [0, 2, 4, -1, 7, 5, -1, 4, 2, 0, 2, 4, 5, -1, 7, 5],
  [4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 0, -1, 4, 5, 4, 0],
];

const STORY_ACTS = [
  { name: "I 序曲", from: 1, to: 16, feel: "solemn" as const },
  { name: "II 闘争", from: 17, to: 32, feel: "rising" as const },
  { name: "III 深淵", from: 33, to: 48, feel: "abyss" as const },
  { name: "IV 終局", from: 49, to: 64, feel: "finale" as const },
];

export function bossStoryMeta(stage: number): { act: string; title: string; feel: string } {
  const n = Math.max(1, Math.min(64, stage | 0));
  const act = STORY_ACTS.find((a) => n >= a.from && n <= a.to) || STORY_ACTS[0];
  const epithets = [
    "夜明けの対位",
    "第一主題",
    "影のカノン",
    "歩む通奏",
    "遠い鐘",
    "追走曲",
    "沈黙の前",
    "決意の和声",
    "星屑のフーガ",
    "鉄の序奏",
    "裂ける旋律",
    "祈りの半終止",
    "嵐の展開",
    "深海のバス",
    "鏡像の答",
    "最後のカデンツ",
  ];
  const epi = epithets[(n - 1) % epithets.length];
  return {
    act: act.name,
    title: `${act.name} · No.${String(n).padStart(2, "0")} ${epi}`,
    feel: act.feel,
  };
}

function invertSubject(sub: number[]): number[] {
  // melodic inversion around 0 (tonic)
  return sub.map((d) => (d < 0 ? -1 : Math.max(0, 7 - d)));
}

/** 星屑のフーガ — distinctive subjects (scale deg, -1 rest). Rhythmic rests make entries audible. */
const STAR_FUGUE_SUBJECTS: number[][] = [
  // rising star-dust leap then settle
  [0, -1, 2, 4, 7, -1, 5, 4, 2, 0, -1, 5, 7, 5, 4, 2],
  // dark stepwise with pause
  [0, 1, 3, -1, 5, 3, 1, 0, -1, 7, 5, 4, 2, -1, 0, 2],
  // angular motif
  [0, 4, -1, 2, 7, 4, -1, 0, 5, -1, 4, 2, 5, 7, -1, 4],
  // slow solemn
  [0, -1, -1, 4, 7, -1, 5, 4, -1, 2, 0, -1, 5, 4, 2, 0],
];

/** countersubject (plays under continuing entries) */
const STAR_FUGUE_CS: number[][] = [
  [4, 2, 0, -1, 2, 4, 5, 4, 2, -1, 0, 2, 4, -1, 2, 0],
  [5, 3, 1, 0, -1, 1, 3, 5, 3, -1, 1, 0, 2, 3, -1, 0],
  [7, 5, 4, 2, -1, 4, 2, 0, 2, 4, -1, 5, 4, 2, 0, -1],
  [2, 0, -1, 4, 2, 0, -1, 5, 4, 2, 0, -1, 4, 5, 4, 2],
];

/**
 * Real fugue layout: monophonic subject entries (not chord blocks),
 * real answer at +4 degrees, countersubject, then stretto.
 * Stages 9 / 25 / 41 / 57.
 */
function buildStarDustFugueTheme(stage: number, meta: { title: string }): Theme {
  const n = Math.max(1, Math.min(64, stage | 0));
  const v = Math.floor((n - 1) / 16) % 4; // 0..3 across acts
  const scale = BACH_SCALES[v % 2 === 0 ? 1 : 0];
  const tonics = [47, 50, 45, 52];
  // moderate — room for subject to be heard
  const tempos = [118, 108, 100, 92];
  const sub = STAR_FUGUE_SUBJECTS[v].slice();
  // tonal answer: most degrees +4 (dominant), rest stays rest
  const ans = sub.map((d) => (d < 0 ? -1 : d + 4));
  const cs = STAR_FUGUE_CS[v].slice();
  // lead for UI / fallback: subject + answer
  const lead = [...sub, ...ans];
  const counter = [...Array(sub.length).fill(-1), ...cs];
  return {
    tonic: tonics[v],
    scale,
    prog: [0, 0, 4, 0, 0, 3, 4, 0],
    lead,
    counter,
    tempo: tempos[v],
    arpStyle: 0,
    drum: 11, // light — don't bury the fugue
    leadDuty: "triangle",
    style: "baroque",
    story: meta.title,
    fugue: true,
    fugueSubject: sub,
    arr: n - 1,
    bassMode: 0,
    leadMode: 2,
    gtrMode: 0,
    brassMode: 0,
    leadEvery: 1, // every tick of subject step
    leadOct: 12,
    gtrOct: 12,
    brassOct: 0,
    chordTicks: 16,
    leadPeak: 0.1,
  };
}

/** Mutate a motif heavily so each boss is unique */
function mutateLead(base: number[], rnd: () => number, seed: number): number[] {
  const out = base.slice();
  // stretch to 32
  while (out.length < 32) out.push(...base);
  const lead = out.slice(0, 32);
  const restEvery = 4 + (seed % 5); // different rest placement
  for (let i = 0; i < lead.length; i++) {
    if (i % restEvery === restEvery - 1 && rnd() > 0.35) {
      lead[i] = -1;
      continue;
    }
    if (lead[i] < 0) continue;
    // interval jumps unique per seed
    if (rnd() > 0.55) {
      const jump = ((seed * 3 + i * 7) % 5) - 2;
      lead[i] = Math.max(0, Math.min(11, lead[i] + jump));
    }
    // occasional octave leap marker as high degree
    if (rnd() > 0.9) lead[i] = Math.min(12, lead[i] + 7);
  }
  // unique rhythmic signature: double some notes as held by removing neighbors
  if (seed % 3 === 0) {
    for (let i = 1; i < lead.length; i += 4) lead[i] = -1;
  } else if (seed % 3 === 1) {
    for (let i = 0; i < lead.length; i += 8) if (lead[i] >= 0) lead[i] = (lead[i] + 2) % 8;
  }
  return lead;
}

/**
 * 決意の和声 — sutra chant × gospel, mixed choir, 8-note harmony.
 * Low male-ish ranks + high female-ish ranks, call & response.
 * Stages 8 / 24 / 40 / 56.
 */
function buildResolveChoirTheme(stage: number, meta: { title: string }): Theme {
  const n = Math.max(1, Math.min(64, stage | 0));
  const v = Math.floor((n - 1) / 16) % 4;
  const scales = [
    [0, 2, 3, 5, 7, 8, 10], // minor solemn
    [0, 2, 4, 5, 7, 9, 11], // major gospel lift
    [0, 2, 3, 5, 7, 8, 11], // harmonic minor drama
    [0, 2, 4, 5, 7, 9, 10], // mixolydian praise
  ];
  const scale = scales[v];
  const tonics = [48, 50, 47, 52];
  // moderate — room for long held chords
  const tempos = [114, 108, 100, 118];

  // chant / gospel-like motifs: repeated tones + rising resolve
  const chants: number[][] = [
    // sutra pulse then open
    [0, 0, 0, 0, 2, 2, 0, -1, 0, 0, 3, 3, 5, 5, 4, 4, 0, 0, 0, 2, 4, 5, 7, 5, 4, 4, 2, 0, 0, 0, 4, 5],
    // gospel lift
    [0, 2, 4, 4, 5, 5, 7, -1, 5, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2, 0, 0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 0],
    // dark resolve
    [0, 0, 3, 3, 5, 5, 7, 7, 5, 5, 3, 3, 0, -1, 4, 4, 0, 0, 3, 5, 7, 8, 7, 5, 4, 4, 2, 0, 0, 4, 5, 7],
    // praise shout
    [0, 4, 7, 7, 5, 5, 4, -1, 0, 2, 4, 5, 7, 9, 7, 5, 4, 4, 2, 0, 5, 5, 7, 7, 9, 7, 5, 4, 2, 0, 0, 0],
  ];
  const lead = chants[v].slice();
  // antiphonal answer (up a 3rd / echo)
  const counter = lead.map((d) => (d < 0 ? -1 : d + 2));

  // gospel-leaning progressions with plagal / amen feel + resolve
  const progs = [
    [0, 0, 3, 4, 0, 5, 4, 0],
    [0, 4, 5, 0, 3, 4, 0, 0],
    [0, 0, 5, 4, 0, 3, 4, 0],
    [0, 5, 4, 0, 4, 5, 0, 0],
  ];

  return {
    tonic: tonics[v],
    scale,
    prog: progs[v],
    lead,
    counter,
    tempo: tempos[v],
    arpStyle: 0,
    drum: 43, // handclap / soft stomp gospel
    leadDuty: "triangle",
    style: "baroque",
    story: meta.title,
    choir: true,
    whistle: false,
    canon: false,
    organ: false,
    fugue: false,
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
    leadPeak: 0.065,
  };
}

/**
 * 鏡像の答 — whistle-like 6-note chords, Japanese children's-song (童謡) feel.
 * Call (subject) then mirror answer (inversion). Stages 15 / 31 / 47 / 63.
 */
function buildMirrorWhistleTheme(stage: number, meta: { title: string }): Theme {
  const n = Math.max(1, Math.min(64, stage | 0));
  const v = Math.floor((n - 1) / 16) % 4;
  // Japanese folk / doyo-friendly pentatonic & yonanuki-ish
  const scales = [
    [0, 2, 4, 7, 9], // major pentatonic
    [0, 2, 5, 7, 9], // yo-ish
    [0, 3, 5, 7, 10], // minor pentatonic
    [0, 2, 4, 5, 7, 9], // yonanuki-ish (no 4th/7th harshness)
  ];
  // pad scales to work with degMidi (needs length for wrapping)
  const scale = scales[v];
  const tonics = [60, 62, 57, 64]; // higher for whistle register
  const tempos = [118, 124, 110, 128]; // gentle walking tempos

  // short doyo-like phrases (original, not quotations)
  // simple arch melodies kids' songs use
  const calls: number[][] = [
    [0, 2, 4, 2, 0, -1, 4, 2, 0, 0, 2, 4, 7, 4, 2, 0, 0, 2, 4, 4, 2, 0, -1, 2, 4, 7, 4, 2, 0, 0, 2, 0],
    [0, 0, 2, 5, 5, 2, 0, -1, 5, 4, 2, 0, 2, 5, 7, 5, 0, 2, 5, 5, 2, 0, -1, 0, 2, 4, 5, 2, 0, 0, 2, 0],
    [0, 3, 5, 3, 0, -1, 5, 3, 0, 0, 3, 5, 7, 5, 3, 0, 5, 5, 3, 0, -1, 3, 5, 7, 5, 3, 0, 0, 3, 5, 3, 0],
    [0, 2, 4, 5, 4, 2, 0, -1, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, -1, 0, 2, 4, 5, 4, 2, 0, 2, 0, 0, 0],
  ];
  const lead = calls[v].slice();
  // 鏡像 = inversion answer (mirror)
  const counter = invertSubject(lead).map((d) => (d < 0 ? -1 : d));

  // gentle I–V–vi–IV-ish / open cadences in scale degrees
  const progs = [
    [0, 0, 4, 0, 5, 4, 0, 0],
    [0, 2, 0, 4, 0, 5, 4, 0],
    [0, 0, 3, 0, 5, 3, 0, 0],
    [0, 4, 0, 5, 0, 4, 0, 0],
  ];

  return {
    tonic: tonics[v],
    scale,
    prog: progs[v],
    lead,
    counter,
    tempo: tempos[v],
    arpStyle: 0,
    drum: 42, // soft soft — almost music-box room
    leadDuty: "triangle",
    style: "baroque",
    story: meta.title,
    whistle: true,
    canon: false,
    organ: false,
    fugue: false,
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
    leadPeak: 0.07,
  };
}

/**
 * 影のカノン — acoustic guitar lead + bass canon (comes in late / imitates).
 * Dux = nylon-ish pluck guitar, Comes = bass delayed by N steps.
 * Variants for stages 3 / 19 / 35 / 51.
 */
function buildShadowCanonTheme(stage: number, meta: { title: string }): Theme {
  const n = Math.max(1, Math.min(64, stage | 0));
  const v = Math.floor((n - 1) / 16) % 4;
  // intimate minor / dorian for “shadow”
  const scales = [
    [0, 2, 3, 5, 7, 8, 10],
    [0, 2, 3, 5, 7, 9, 10],
    [0, 2, 3, 5, 7, 8, 11],
    [0, 1, 3, 5, 7, 8, 10],
  ];
  const scale = scales[v];
  const tonics = [45, 47, 48, 50];
  // mid tempo — room for hearing the delay
  const tempos = [108, 100, 96, 112];
  // canon delay in 8th steps (comes enters after this)
  // stored in chordTicks as delay amount for the player
  const delays = [4, 6, 8, 5];

  // guitar-friendly subjects (mostly stepwise, open-string feel)
  const subjects: number[][] = [
    [0, 2, 4, 2, 0, -1, 4, 5, 7, 5, 4, 2, 0, 2, 4, 0, 5, 4, 2, 0, -1, 2, 4, 5, 4, 2, 0, 0, 2, 4, 2, 0],
    [0, 0, 2, 3, 5, 3, 2, 0, 4, 5, 7, 5, 4, 2, 0, -1, 0, 2, 4, 5, 4, 2, 0, 2, 5, 4, 2, 0, -1, 0, 2, 0],
    [4, 2, 0, 2, 4, 5, 4, 2, 0, -1, 0, 2, 4, 7, 5, 4, 2, 0, 2, 4, 5, -1, 4, 2, 0, 0, 2, 3, 5, 3, 2, 0],
    [0, 3, 5, 7, 5, 3, 0, -1, 2, 0, 2, 4, 5, 4, 2, 0, 5, 7, 5, 4, 2, 0, -1, 2, 4, 5, 4, 2, 0, 2, 0, 0],
  ];
  const lead = subjects[v].slice();
  // comes line same as dux (true canon at unison); player delays it
  const counter = lead.slice();

  const progs = [
    [0, 0, 3, 4, 0, 5, 4, 0],
    [0, 5, 3, 4, 0, 0, 4, 0],
    [0, 3, 0, 4, 5, 4, 0, 0],
    [0, 2, 3, 4, 0, 5, 4, 0],
  ];

  return {
    tonic: tonics[v],
    scale,
    prog: progs[v],
    lead,
    counter,
    tempo: tempos[v],
    arpStyle: 0,
    drum: 41, // soft finger-snap / light kit
    leadDuty: "square",
    style: "baroque",
    story: meta.title,
    canon: true,
    organ: false,
    fugue: false,
    arr: n - 1,
    bassMode: 1,
    leadMode: 2,
    gtrMode: 1,
    brassMode: 0,
    leadEvery: 2,
    leadOct: 12,
    gtrOct: 12,
    brassOct: 0,
    chordTicks: delays[v], // CANON DELAY steps
    leadPeak: 0.09,
  };
}

/**
 * 祈りの半終止 — pipe organ / sacred style.
 * Slow chorale, multi-rank stops, pedal, half-cadence (ends toward V).
 * Variants for stages 12 / 28 / 44 / 60.
 */
function buildPrayerOrganTheme(stage: number, meta: { title: string }): Theme {
  const n = Math.max(1, Math.min(64, stage | 0));
  const v = Math.floor((n - 1) / 16) % 4;
  // Aeolian / Dorian / Ionian-ish sacred colors
  const scales = [
    [0, 2, 3, 5, 7, 8, 10], // natural minor
    [0, 2, 3, 5, 7, 9, 10], // dorian
    [0, 2, 4, 5, 7, 9, 11], // major (bright chapel)
    [0, 2, 3, 5, 7, 8, 11], // harmonic minor (solemn)
  ];
  const scale = scales[v];
  // low organ pitch center
  const tonics = [41, 43, 45, 48]; // dark chapel → slightly brighter
  // hymn-like slow tempos
  const tempos = [132, 138, 126, 142];

  // chorale phrases (long notes, rests as phrase breaks)
  const chorales: number[][] = [
    // Amen-like rise then half-cadence prep
    [0, 0, 2, 2, 4, 4, 5, -1, 4, 4, 2, 2, 0, 0, 4, 4, 5, 5, 7, 7, 5, 4, 2, -1, 0, 0, 2, 4, 5, 5, 4, 4],
    // Dorian procession
    [0, 0, 0, 2, 3, 3, 5, 5, 7, 5, 3, 2, 0, -1, 5, 5, 4, 4, 2, 2, 0, 0, 4, 4, 5, 5, 7, 5, 4, 4, 5, 5],
    // Bright major prayer
    [0, 2, 4, 4, 5, 5, 4, -1, 2, 2, 0, 0, 4, 4, 5, 7, 9, 7, 5, 4, 2, 0, -1, 0, 4, 4, 5, 5, 7, 7, 5, 5],
    // Solemn harmonic minor
    [0, 0, 3, 3, 5, 5, 7, -1, 5, 4, 3, 2, 0, 0, 4, 4, 5, 5, 7, 8, 7, 5, 4, -1, 0, 2, 3, 5, 7, 7, 5, 4],
  ];
  const lead = chorales[v].slice();
  // organum fifth above (parallel)
  const counter = lead.map((d) => (d < 0 ? -1 : d + 4));

  // progressions that lean into half-cadence (… → V)
  // final cells emphasize scale degree 4 (dominant)
  const progs = [
    [0, 0, 3, 4, 0, 5, 4, 4], // i–iv–V, hang on V
    [0, 3, 0, 4, 5, 3, 4, 4],
    [0, 4, 0, 5, 3, 4, 4, 4],
    [0, 0, 5, 4, 0, 3, 4, 4],
  ];

  return {
    tonic: tonics[v],
    scale,
    prog: progs[v],
    lead,
    counter,
    tempo: tempos[v],
    arpStyle: 0,
    drum: 40, // organ kit: almost no percussion
    leadDuty: "triangle",
    style: "baroque",
    story: meta.title,
    organ: true,
    fugue: false,
    arr: n - 1,
    bassMode: 0,
    leadMode: 1,
    gtrMode: 0,
    brassMode: 0,
    leadEvery: 4, // long chorale notes
    leadOct: 12,
    gtrOct: 12,
    brassOct: 0,
    chordTicks: 16,
    leadPeak: 0.08,
  };
}


/** shared helper: make a Theme shell for named flavors */
function flavorShell(
  stage: number,
  meta: { title: string },
  flavor: NonNullable<Theme["flavor"]>,
  opts: Partial<Theme> & Pick<Theme, "tonic" | "scale" | "prog" | "lead" | "counter" | "tempo">,
): Theme {
  const n = Math.max(1, Math.min(64, stage | 0));
  return {
    tonic: opts.tonic,
    scale: opts.scale,
    prog: opts.prog,
    lead: opts.lead,
    counter: opts.counter,
    tempo: opts.tempo,
    arpStyle: opts.arpStyle ?? 0,
    drum: opts.drum ?? 20,
    leadDuty: opts.leadDuty ?? "triangle",
    style: "baroque",
    story: meta.title,
    flavor,
    fugue: false,
    organ: false,
    canon: false,
    whistle: false,
    choir: false,
    arr: n - 1,
    bassMode: opts.bassMode ?? 1,
    leadMode: opts.leadMode ?? 2,
    gtrMode: opts.gtrMode ?? 0,
    brassMode: opts.brassMode ?? 0,
    leadEvery: opts.leadEvery ?? 2,
    leadOct: opts.leadOct ?? 12,
    gtrOct: opts.gtrOct ?? 12,
    brassOct: opts.brassOct ?? 0,
    chordTicks: opts.chordTicks ?? 8,
    leadPeak: opts.leadPeak ?? 0.09,
  };
}

/** 夜明けの対位 — soft dawn, two intertwining rising lines */
function buildDawnCounterpoint(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const leads = [
    [0, 2, 4, 5, 4, 2, 0, -1, 2, 4, 7, 5, 4, 2, 0, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, -1, 4, 5, 4, 2, 0, 0],
    [0, 1, 3, 5, 3, 1, 0, -1, 3, 5, 7, 5, 3, 1, 0, 3, 0, 3, 5, 7, 8, 7, 5, 3, 1, -1, 5, 3, 1, 0, 0, 0],
    [0, 2, 0, 4, 2, 5, 4, -1, 0, 4, 7, 4, 2, 0, 2, 4, 5, 4, 2, 0, 4, 5, 7, 5, 4, -1, 2, 4, 2, 0, 0, 0],
    [0, 2, 4, 7, 9, 7, 5, 4, 2, -1, 0, 2, 4, 5, 4, 2, 0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, -1, 4, 2, 0, 0],
  ];
  const lead = leads[v];
  // second voice delayed by 4, often a 3rd above
  const counter = lead.map((d, i) => {
    const src = lead[(i + lead.length - 4) % lead.length];
    return src < 0 ? -1 : src + 2;
  });
  return flavorShell(stage, meta, "dawn", {
    tonic: [50, 52, 48, 53][v],
    scale: BACH_SCALES[0],
    prog: [0, 0, 3, 4, 0, 5, 4, 0],
    lead,
    counter,
    tempo: [104, 98, 92, 108][v],
    drum: 44,
    leadEvery: 2,
    leadOct: 12,
    leadPeak: 0.08,
  });
}

/** 第一主題 — bold monophonic subject, then accompaniment */
function buildFirstSubject(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const subjects = [
    [0, 2, 4, 7, -1, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0],
    [0, 4, 7, 4, 2, 0, -1, 5, 7, 5, 4, 2, 0, 2, 4, 0],
    [0, 1, 3, 5, 7, 5, 3, 1, 0, -1, 5, 3, 1, 0, 3, 5],
    [0, 2, 0, 5, 4, 2, 7, 5, 4, 2, 0, -1, 4, 5, 7, 0],
  ];
  const sub = subjects[v];
  const lead = [...sub, ...sub.map((d) => (d < 0 ? -1 : d + 0))];
  const counter = [...Array(16).fill(-1), ...sub.map((d) => (d < 0 ? -1 : d + 4))];
  return flavorShell(stage, meta, "subject", {
    tonic: [48, 50, 47, 52][v],
    scale: BACH_SCALES[v % 2 === 0 ? 1 : 0],
    prog: [0, 0, 0, 0, 4, 4, 0, 0],
    lead,
    counter,
    tempo: [110, 102, 96, 114][v],
    drum: 45,
    leadEvery: 2,
    leadOct: 12,
    leadPeak: 0.11,
    bassMode: 0,
  });
}

/** 歩む通奏 — walking basso continuo + sparse chords */
function buildWalkingContinuo(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  // walking degrees
  const walk = [0, 2, 4, 5, 4, 2, 0, 5, 4, 2, 0, 2, 4, 5, 7, 5];
  const lead = walk.map((d, i) => (i % 4 === 3 ? -1 : d + 4)); // upper sparsely
  const counter = walk.slice();
  return flavorShell(stage, meta, "continuo", {
    tonic: [45, 47, 43, 48][v],
    scale: BACH_SCALES[1],
    prog: [0, 4, 0, 5, 3, 4, 0, 0],
    lead,
    counter,
    tempo: [100, 94, 88, 106][v],
    drum: 46,
    leadEvery: 2,
    leadOct: 12,
    leadPeak: 0.07,
    bassMode: 2,
  });
}

/** 遠い鐘 — distant bells, sparse peals */
function buildDistantBells(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const peal = [
    [0, -1, -1, 4, -1, -1, 7, -1, 5, -1, -1, 4, -1, 2, -1, 0],
    [0, -1, 5, -1, -1, 7, -1, -1, 4, -1, 2, -1, 0, -1, 4, -1],
    [7, -1, -1, 4, -1, 0, -1, -1, 5, -1, 4, -1, 2, -1, 0, -1],
    [0, -1, -1, -1, 4, -1, -1, 7, -1, -1, 5, -1, 4, -1, 0, 0],
  ][v];
  const lead = [...peal, ...peal];
  const counter = peal.map((d) => (d < 0 ? -1 : d + 7));
  return flavorShell(stage, meta, "bells", {
    tonic: [53, 55, 50, 57][v],
    scale: BACH_SCALES[0],
    prog: [0, 0, 4, 0, 0, 3, 4, 0],
    lead,
    counter,
    tempo: [88, 82, 78, 94][v],
    drum: 47,
    leadEvery: 2,
    leadOct: 24,
    leadPeak: 0.1,
  });
}

/** 追走曲 — chase: fast call & response, running lines */
function buildChaseTheme(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const run = [
    [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 5, 7, 9, 7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0, 5, 4, 2, 0, 4, 2, 0, 0],
    [0, 1, 3, 5, 7, 8, 7, 5, 3, 1, 0, 3, 5, 7, 5, 3, 1, 0, 5, 3, 1, 0, 3, 5, 7, 5, 3, 1, 0, 1, 0, 0],
    [0, 4, 2, 5, 4, 7, 5, 4, 2, 0, 5, 7, 5, 4, 2, 4, 0, 2, 4, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 0],
    [0, 2, 0, 4, 2, 5, 4, 7, 5, 4, 2, 5, 7, 9, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 4, 2, 0],
  ][v];
  const counter = run.map((d, i) => (i % 2 === 0 ? -1 : (d + 3) % 10));
  return flavorShell(stage, meta, "chase", {
    tonic: [48, 50, 52, 47][v],
    scale: BACH_SCALES[v % 2],
    prog: [0, 4, 5, 0, 3, 4, 5, 0],
    lead: run,
    counter,
    tempo: [128, 134, 122, 140][v],
    drum: 48,
    leadEvery: 1,
    leadOct: 12,
    leadPeak: 0.1,
    bassMode: 4,
  });
}

/** 沈黙の前 — almost silence, hanging single tones */
function buildBeforeSilence(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const sparse = [
    [0, -1, -1, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, -1, -1, 2, -1, -1, -1, 0, -1, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1],
    [0, -1, -1, -1, 7, -1, -1, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, 2, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, 0, -1, -1, -1, -1, 3, -1, -1, -1, -1, 5, -1, -1, -1, -1, -1, -1, 0, -1, -1, -1, -1, 4, -1, -1, -1, -1, -1, -1, -1],
    [0, -1, -1, -1, -1, -1, 4, -1, -1, -1, -1, 7, -1, -1, -1, -1, 5, -1, -1, -1, -1, 2, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1],
  ][v];
  return flavorShell(stage, meta, "silence", {
    tonic: [43, 45, 41, 47][v],
    scale: BACH_SCALES[2 % BACH_SCALES.length],
    prog: [0, 0, 0, 0, 0, 0, 4, 0],
    lead: sparse,
    counter: sparse.map(() => -1),
    tempo: [72, 68, 64, 76][v],
    drum: 49,
    leadEvery: 2,
    leadOct: 0,
    leadPeak: 0.06,
  });
}

/** 鉄の序奏 — iron power, square march */
function buildIronOverture(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const march = [
    [0, 0, 4, 4, 0, 0, 5, 5, 0, 4, 0, 5, 4, 4, 0, 0],
    [0, 4, 0, 4, 7, 7, 5, 4, 0, 0, 4, 5, 4, 0, 0, 0],
    [0, 0, 0, 4, 4, 4, 5, 5, 7, 5, 4, 0, 4, 5, 0, 0],
    [0, 5, 4, 0, 0, 4, 5, 7, 5, 4, 0, 4, 0, 0, 0, 0],
  ][v];
  const lead = [...march, ...march];
  const counter = lead.map((d) => d + 4);
  return flavorShell(stage, meta, "iron", {
    tonic: [40, 43, 38, 45][v],
    scale: BACH_SCALES[1],
    prog: [0, 0, 4, 0, 5, 4, 0, 0],
    lead,
    counter,
    tempo: [108, 100, 96, 114][v],
    drum: 50,
    leadDuty: "square",
    leadEvery: 2,
    leadOct: 0,
    leadPeak: 0.12,
    bassMode: 5,
  });
}

/** 裂ける旋律 — torn leaps + slides */
function buildTearingMelody(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const jagged = [
    [0, 7, 2, 9, 4, 0, 11, 5, 2, 8, 0, 7, 4, 10, 2, 0],
    [0, 8, 1, 7, 3, 10, 0, 5, 9, 2, 6, 0, 7, 1, 4, 0],
    [0, 11, 4, 7, 0, 9, 2, 5, 12, 4, 0, 7, 3, 8, 0, 4],
    [0, 7, 0, 12, 5, 2, 9, 0, 6, 11, 3, 0, 8, 4, 0, 7],
  ][v];
  const lead = [...jagged, ...jagged.map((d) => Math.max(0, d - 2))];
  const counter = lead.map((d, i) => (i % 3 === 0 ? d : -1));
  return flavorShell(stage, meta, "tear", {
    tonic: [49, 51, 46, 54][v],
    scale: BACH_SCALES[(v + 2) % BACH_SCALES.length],
    prog: [0, 3, 5, 4, 0, 2, 4, 0],
    lead,
    counter,
    tempo: [112, 118, 106, 124][v],
    drum: 51,
    leadDuty: "square",
    leadEvery: 2,
    leadOct: 12,
    leadPeak: 0.11,
  });
}

/** 嵐の展開 — storm development, dense energy */
function buildStormDev(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const storm = [
    [0, 2, 4, 5, 7, 5, 4, 2, 5, 7, 9, 7, 5, 4, 2, 0, 4, 5, 7, 9, 11, 9, 7, 5, 4, 2, 0, 2, 4, 5, 4, 0],
    [0, 3, 5, 7, 8, 7, 5, 3, 0, 5, 7, 10, 7, 5, 3, 0, 3, 5, 7, 8, 10, 8, 7, 5, 3, 0, 5, 3, 0, 3, 5, 0],
    [0, 4, 7, 4, 2, 5, 9, 5, 4, 7, 11, 7, 5, 4, 2, 0, 4, 7, 5, 9, 7, 5, 4, 2, 0, 4, 5, 7, 5, 4, 0, 0],
    [0, 1, 4, 7, 5, 8, 4, 7, 2, 5, 9, 5, 0, 4, 7, 4, 1, 5, 8, 5, 2, 7, 10, 7, 0, 4, 0, 5, 4, 2, 0, 0],
  ][v];
  const counter = storm.map((d, i) => (i % 2 === 0 ? d + 2 : d - 1));
  return flavorShell(stage, meta, "storm", {
    tonic: [46, 48, 50, 44][v],
    scale: BACH_SCALES[v % BACH_SCALES.length],
    prog: [0, 4, 5, 3, 4, 5, 0, 4],
    lead: storm,
    counter,
    tempo: [136, 142, 130, 148][v],
    drum: 52,
    leadEvery: 1,
    leadOct: 12,
    leadPeak: 0.1,
    bassMode: 4,
    brassMode: 3,
  });
}

/** 深海のバス — deep bass focus, sub pressure */
function buildAbyssBass(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const deep = [
    [0, 0, 0, 2, 0, 0, 4, 0, 0, 0, 5, 0, 4, 2, 0, 0],
    [0, 0, 3, 0, 0, 5, 0, 0, 0, 2, 0, 0, 3, 0, 0, 0],
    [0, 2, 0, 0, 4, 0, 0, 5, 0, 4, 0, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 5, 0, 0, 3, 0, 0, 2, 0, 0, 0, 0],
  ][v];
  const lead = deep.map((d, i) => (i % 4 === 0 ? d + 7 : -1)); // sparse high ghosts
  return flavorShell(stage, meta, "abyss", {
    tonic: [36, 38, 35, 40][v],
    scale: BACH_SCALES[1],
    prog: [0, 0, 5, 0, 0, 3, 0, 0],
    lead: [...lead, ...lead],
    counter: [...deep, ...deep],
    tempo: [80, 74, 70, 86][v],
    drum: 53,
    leadEvery: 4,
    leadOct: 0,
    leadPeak: 0.07,
    bassMode: 2,
  });
}

/** 最後のカデンツ — final cadence, I–IV–V–I fanfares */
function buildFinalCadence(stage: number, meta: { title: string }): Theme {
  const v = Math.floor((Math.max(1, stage) - 1) / 16) % 4;
  const fanfare = [
    [0, 2, 4, 0, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 0],
    [0, 4, 7, 4, 0, 5, 4, 0, 2, 4, 5, 7, 5, 4, 0, 0],
    [0, 0, 4, 4, 5, 5, 0, 0, 4, 5, 7, 9, 7, 5, 4, 0],
    [0, 2, 0, 4, 5, 7, 5, 4, 0, 4, 5, 0, 4, 2, 0, 0],
  ][v];
  const lead = [...fanfare, ...fanfare];
  const counter = lead.map((d) => d + 2);
  return flavorShell(stage, meta, "cadence", {
    tonic: [48, 50, 52, 47][v],
    scale: BACH_SCALES[0],
    prog: [0, 3, 4, 0, 0, 3, 4, 0], // I IV V I
    lead,
    counter,
    tempo: [100, 96, 92, 108][v],
    drum: 54,
    leadDuty: "square",
    leadEvery: 2,
    leadOct: 12,
    leadPeak: 0.11,
    brassMode: 3,
  });
}

function buildBaroqueBossTheme(stage: number): Theme {
  const n = Math.max(1, Math.min(64, stage | 0));
  const s = n - 1;
  const meta = bossStoryMeta(n);

  if (meta.title.includes("星屑のフーガ")) {
    return buildStarDustFugueTheme(n, meta);
  }
  if (meta.title.includes("祈りの半終止")) {
    return buildPrayerOrganTheme(n, meta);
  }
  if (meta.title.includes("影のカノン")) {
    return buildShadowCanonTheme(n, meta);
  }
  if (meta.title.includes("鏡像の答")) {
    return buildMirrorWhistleTheme(n, meta);
  }
  if (meta.title.includes("決意の和声")) {
    return buildResolveChoirTheme(n, meta);
  }
  if (meta.title.includes("夜明けの対位")) {
    return buildDawnCounterpoint(n, meta);
  }
  if (meta.title.includes("第一主題")) {
    return buildFirstSubject(n, meta);
  }
  if (meta.title.includes("歩む通奏")) {
    return buildWalkingContinuo(n, meta);
  }
  if (meta.title.includes("遠い鐘")) {
    return buildDistantBells(n, meta);
  }
  if (meta.title.includes("追走曲")) {
    return buildChaseTheme(n, meta);
  }
  if (meta.title.includes("沈黙の前")) {
    return buildBeforeSilence(n, meta);
  }
  if (meta.title.includes("鉄の序奏")) {
    return buildIronOverture(n, meta);
  }
  if (meta.title.includes("裂ける旋律")) {
    return buildTearingMelody(n, meta);
  }
  if (meta.title.includes("嵐の展開")) {
    return buildStormDev(n, meta);
  }
  if (meta.title.includes("深海のバス")) {
    return buildAbyssBass(n, meta);
  }
  if (meta.title.includes("最後のカデンツ")) {
    return buildFinalCadence(n, meta);
  }

  const rnd = mulberry(n * 11003 + 777 + n * n);
  const actIdx = Math.max(0, STORY_ACTS.findIndex((a) => n >= a.from && n <= a.to));
  const epi = (n - 1) % 16; // epithet slot

  // —— unique scale / key per boss ——
  const scaleIdx = (s * 3 + actIdx + epi) % BACH_SCALES.length;
  const scale = BACH_SCALES[scaleIdx];
  const tonics = [40, 41, 43, 45, 46, 47, 48, 50, 52, 53, 55, 57];
  const tonic = tonics[(s * 5 + actIdx * 2) % tonics.length];

  // —— unique progression ——
  let prog = BACH_PROGS[(s * 7 + epi) % BACH_PROGS.length].slice();
  // per-stage inserts
  if (epi % 4 === 0) prog = [0, 0, ...prog];
  if (epi % 5 === 2) prog = [...prog, 4, 0, 5, 0];
  if (actIdx >= 2 && s % 2 === 0) prog = prog.map((d, i) => (i % 2 === 0 ? d : (d + 3) % 7));

  // —— unique melody ——
  const baseA = BACH_SUBJECTS[s % BACH_SUBJECTS.length];
  const baseB = BACH_SUBJECTS[(s * 5 + 3) % BACH_SUBJECTS.length];
  let lead = mutateLead([...baseA, ...baseB], rnd, s);
  // counter: delayed / inverted / dominant
  let counter: number[];
  const cMode = s % 4;
  if (cMode === 0) counter = [...Array(8).fill(-1), ...lead.slice(0, 24)];
  else if (cMode === 1) counter = invertSubject(lead);
  else if (cMode === 2) counter = lead.map((d) => (d < 0 ? -1 : d + 4));
  else counter = lead.map((d, i) => (i % 2 === 0 ? d : -1));

  // —— tempo: wide spread so ears catch difference ——
  // 72..138 depending on stage
  const tempo = Math.max(72, Math.min(138, 78 + (s % 16) * 3 + actIdx * 4 + (epi % 3) * 2));

  // arrangement modes — designed so neighbors differ
  const bassMode = (s + actIdx) % 6;
  const leadMode = (s * 2 + epi) % 6;
  const gtrMode = (s + 3) % 5;
  const brassMode = (s * 3 + 1) % 6;
  const leadEvery = [1, 2, 2, 4, 2, 1][(s + epi) % 6];
  const leadOct = [0, 12, 12, 24, 12, 0][s % 6];
  const gtrOct = [12, 12, 24, 0, 12][gtrMode];
  const brassOct = [0, 0, 12, 0, -12, 12][brassMode];
  const chordTicks = [4, 8, 8, 16, 8, 4][(s + actIdx) % 6];
  const leadDuty: "square" | "triangle" = s % 2 === 0 ? "triangle" : "square";
  // drum kit 0..15 unique-ish
  const drum = 20 + ((s * 3 + actIdx) % 16);

  // epithet-driven overrides for big character
  // 0 夜明け 1 第一主題 2 影のカノン 3 歩む通奏 4 遠い鐘 5 追走曲 6 沈黙 7 決意
  // 8 星屑 handled 9 鉄 10 裂ける 11 祈り 12 嵐 13 深海 14 鏡像 15 カデンツ
  let gtr = gtrMode;
  let brass = brassMode;
  let bass = bassMode;
  let leadM = leadMode;
  let tp = tempo;
  if (epi === 3) {
    // 通奏: bass heavy
    bass = 2;
    leadM = 2;
    gtr = 4;
    brass = 0;
  } else if (epi === 4) {
    // 鐘: sparse + pentad hits
    leadM = 4;
    bass = 3;
    gtr = 0;
    brass = 3;
    tp = Math.min(140, tp + 12);
  } else if (epi === 5) {
    // 追走: fast
    tp = Math.max(72, tp - 18);
    gtr = 2;
    bass = 4;
    leadM = 3;
  } else if (epi === 6) {
    // 沈黙: very sparse
    lead = lead.map((d, i) => (i % 3 !== 0 ? -1 : d));
    bass = 3;
    gtr = 0;
    brass = 1;
    tp += 10;
  } else if (epi === 9) {
    // 鉄: square + power
    bass = 5;
    brass = 3;
    gtr = 3;
    leadM = 0;
  } else if (epi === 10) {
    // 裂ける: jagged leaps already in mutate; dense brass
    brass = 2;
    gtr = 2;
    leadM = 1;
  } else if (epi === 12) {
    // 嵐: max energy
    tp = Math.max(72, tp - 22);
    bass = 4;
    gtr = 2;
    brass = 3;
    leadM = 3;
  } else if (epi === 13) {
    // 深海: low register
    bass = 1;
    leadM = 2;
    brass = 4;
    gtr = 4;
  } else if (epi === 15) {
    // カデンツ: clear I-V-I prog
    prog = [0, 4, 0, 0, 3, 4, 0, 0];
    brass = 3;
    leadM = 0;
  }

  return {
    tonic,
    scale,
    prog,
    lead,
    counter,
    tempo: Math.max(72, Math.min(140, tp)),
    arpStyle: (s + actIdx) % 4,
    drum,
    leadDuty,
    style: "baroque",
    story: meta.title,
    fugue: false,
    arr: s,
    bassMode: bass,
    leadMode: leadM,
    gtrMode: gtr,
    brassMode: brass,
    leadEvery: leadEvery,
    leadOct: epi === 13 ? 0 : leadOct,
    gtrOct: gtrOct,
    brassOct: epi === 13 ? -12 : brassOct,
    chordTicks,
    leadPeak: 0.07 + (s % 5) * 0.008,
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
/** deeper / longer kick for boss kits */
function bassDrum(kind: 0 | 1 | 2 | 3 = 0) {
  if (kind === 0) {
    // tight punch
    blip(120, 0.09, "triangle", 0.16, 38, "bgm");
    noise(0.03, 0.07, 500, "bgm");
  } else if (kind === 1) {
    // sub boom
    blip(70, 0.14, "triangle", 0.18, 32, "bgm");
    blip(110, 0.06, "sine" as OscillatorType, 0.08, 40, "bgm");
    noise(0.04, 0.05, 400, "bgm");
  } else if (kind === 2) {
    // double hit
    blip(130, 0.05, "triangle", 0.14, 42, "bgm");
    setTimeout(() => {
      blip(95, 0.08, "triangle", 0.12, 36, "bgm");
      noise(0.03, 0.06, 550, "bgm");
    }, 45);
  } else {
    // long hall kick
    blip(100, 0.16, "triangle", 0.15, 30, "bgm");
    noise(0.08, 0.08, 350, "bgm");
  }
}
function chipSnare() {
  noise(0.06, 0.12, 3500, "bgm");
  blip(220, 0.03, "square", 0.04, 100, "bgm");
}
function chipHat(open = false) {
  noise(open ? 0.05 : 0.02, open ? 0.045 : 0.03, open ? 9000 : 7000, "bgm");
}


/** distant bell: partials + long decay */
function bellTone(freq: number, peak: number) {
  const c = ac();
  const m = out();
  if (!c || !m || muted) return;
  if (c.state === "suspended") {
    void c.resume();
    return;
  }
  const t0 = c.currentTime;
  const lvl = Math.max(0.001, peak * bgmLevel);
  // inharmonic partials like a bell
  const parts = [1, 2.0, 2.76, 3.79, 5.1];
  const amps = [1, 0.45, 0.28, 0.15, 0.08];
  for (let i = 0; i < parts.length; i++) {
    const o = c.createOscillator();
    o.type = i === 0 ? "sine" : "triangle";
    o.frequency.setValueAtTime(freq * parts[i], t0);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(lvl * amps[i], t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55 + i * 0.05);
    o.connect(g);
    g.connect(m);
    o.start(t0);
    o.stop(t0 + 0.7);
  }
  // soft distant echo
  blip(freq, 0.08, "sine" as OscillatorType, peak * 0.25, undefined, "bgm");
}

/** iron hit: harsh square fifth */
function ironHit(deg: number, peak: number) {
  const f = hz(degMidi(deg, -12));
  blip(f, 0.12, "square", peak, undefined, "bgm");
  blip(hz(degMidi(deg + 4, -12)), 0.12, "square", peak * 0.75, undefined, "bgm");
  blip(f * 2, 0.06, "square", peak * 0.35, undefined, "bgm");
  noise(0.03, peak * 0.2, 1800, "bgm");
}

/** tear slide between degrees */
function tearSlide(degFrom: number, degTo: number, peak: number) {
  const f0 = hz(degMidi(degFrom, 12));
  const f1 = hz(degMidi(degTo, 12));
  blip(f0, 0.16, "square", peak, f1, "bgm");
  blip(f0 * 0.5, 0.14, "triangle", peak * 0.4, f1 * 0.5, "bgm");
}

/** brass 5-note chord: R–3–5–7–R(oct)  (金管5和音) — cadences only */
function brassPentad(deg: number, oct: number, peak: number) {
  const offs = [0, 2, 4, 6, 7]; // scale degrees → pentad
  for (let i = 0; i < offs.length; i++) {
    const f = hz(degMidi(deg + offs[i], oct));
    const p = peak * (1 - i * 0.08);
    blip(f, 0.16, "triangle", p, undefined, "bgm");
    blip(f, 0.12, "square", p * 0.42, f * (1 + (i - 2) * 0.0015), "bgm");
  }
}

/**
 * Monophonic fugue voice — one clear line (not a chord).
 * voice 0 = trumpet-ish, 1 = horn, 2 = trombone-ish, 3 = high clarino, 4 = soft alto
 */
function fugueVoice(
  freq: number,
  peak: number,
  voice: number,
  dur = 0.14,
) {
  if (!Number.isFinite(freq) || freq < 40 || freq > 2800) return;
  const p = Math.max(0.02, peak);
  // each voice different color so entries read as separate lines
  if (voice === 0) {
    // principal: bright brass
    blip(freq, dur, "square", p, undefined, "bgm");
    blip(freq, dur * 0.9, "triangle", p * 0.55, undefined, "bgm");
    blip(freq * 2, dur * 0.5, "triangle", p * 0.18, undefined, "bgm");
  } else if (voice === 1) {
    // answer: warmer, slightly darker
    blip(freq, dur * 1.05, "triangle", p * 1.05, undefined, "bgm");
    blip(freq, dur * 0.7, "square", p * 0.35, undefined, "bgm");
  } else if (voice === 2) {
    // middle: round
    blip(freq, dur * 1.1, "triangle", p, undefined, "bgm");
    blip(freq * 0.5, dur * 0.9, "triangle", p * 0.35, undefined, "bgm");
  } else if (voice === 3) {
    // high entry: thin bright
    blip(freq, dur * 0.95, "square", p * 0.85, undefined, "bgm");
    blip(freq * 1.5, dur * 0.4, "triangle", p * 0.15, undefined, "bgm");
  } else {
    // 5th voice: soft
    blip(freq, dur * 1.15, "triangle", p * 0.9, undefined, "bgm");
  }
}

/** mixed choir — lighter formant voices (game-realtime safe) */
function choirOctad(deg: number, peak: number) {
  // 4 strong parts (mobile WebAudio budget)
  const parts: {
    d: number;
    o: number;
    p: number;
    gender: "m" | "f";
    vow: "a" | "o" | "u" | "e" | "i";
  }[] = [
    { d: 0, o: -12, p: 1.0, gender: "m", vow: "o" },
    { d: 4, o: 0, p: 0.75, gender: "m", vow: "a" },
    { d: 0, o: 12, p: 0.85, gender: "f", vow: "a" },
    { d: 2, o: 12, p: 0.6, gender: "f", vow: "e" },
  ];
  for (const part of parts) {
    const f0 = hz(degMidi(deg + part.d, part.o));
    if (f0 < 60 || f0 > 1400) continue;
    voiceTone(f0, 0.3, peak * part.p, part.vow, part.gender);
  }
}

/** sutra-like mono chant — nasal male formants */
function sutraPulse(deg: number, peak: number) {
  const f = hz(degMidi(deg, 0));
  if (f < 50 || f > 900) return;
  voiceTone(f, 0.22, peak * 1.2, "o", "m");
  voiceTone(Math.max(60, f * 0.5), 0.24, peak * 0.7, "u", "m");
}

/** reuse one short noise buffer for breath */
let breathBuf: AudioBuffer | null = null;
function getBreathBuf(c: AudioContext): AudioBuffer {
  if (breathBuf && breathBuf.sampleRate === c.sampleRate) return breathBuf;
  const nLen = Math.max(1, Math.floor(c.sampleRate * 0.2));
  const buf = c.createBuffer(1, nLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  breathBuf = buf;
  return buf;
}

/**
 * Formant voice: saw → bandpass formants + vibrato.
 * Lightweight enough for the BGM tick loop.
 */
function voiceTone(
  f0: number,
  dur: number,
  peak: number,
  vowel: "a" | "o" | "u" | "e" | "i" = "a",
  gender: "m" | "f" = "m",
) {
  try {
    if (muted) return;
    const c = ac();
    const m = out();
    if (!c || !m) return;
    if (c.state === "suspended") {
      void c.resume();
      return;
    }
    if (bgmLevel <= 0.001) return;
    if (!Number.isFinite(f0) || f0 < 40 || f0 > 2000) return;

    const t0 = c.currentTime;
    // louder, always audible
    const lvl = Math.max(0.001, Math.min(0.38, peak * bgmLevel * 2.0));

    const table: Record<string, [number, number, number]> = {
      a: [750, 1150, 2500],
      o: [480, 850, 2400],
      u: [340, 650, 2200],
      e: [480, 1750, 2450],
      i: [290, 2100, 2900],
    };
    let [f1, f2, f3] = table[vowel] || table.a;
    if (gender === "f") {
      f1 *= 1.1;
      f2 *= 1.12;
      f3 *= 1.08;
    }

    const o1 = c.createOscillator();
    const o2 = c.createOscillator();
    o1.type = "sawtooth";
    o2.type = "sawtooth";
    o1.frequency.setValueAtTime(f0, t0);
    o2.frequency.setValueAtTime(f0 * 1.005, t0);

    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = gender === "f" ? 5.6 : 5.1;
    const lfoG = c.createGain();
    lfoG.gain.value = Math.min(12, f0 * 0.009);
    lfo.connect(lfoG);
    lfoG.connect(o1.frequency);
    lfoG.connect(o2.frequency);

    const src = c.createGain();
    src.gain.value = 0.4;
    o1.connect(src);
    o2.connect(src);

    // CRITICAL: mix gain must be 1 (was 0 → total silence)
    const mix = c.createGain();
    mix.gain.value = 1;

    for (const [ff, q, g] of [
      [f1, 6, 1.15],
      [f2, 8, 0.9],
      [f3, 10, 0.45],
    ] as [number, number, number][]) {
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = Math.min(7000, Math.max(90, ff));
      bp.Q.value = q;
      const fg = c.createGain();
      fg.gain.value = g;
      src.connect(bp);
      bp.connect(fg);
      fg.connect(mix);
    }
    // body path so it's never thin/silent
    const bodyG = c.createGain();
    bodyG.gain.value = 0.32;
    src.connect(bodyG);
    bodyG.connect(mix);

    try {
      const ns = c.createBufferSource();
      ns.buffer = getBreathBuf(c);
      const nbp = c.createBiquadFilter();
      nbp.type = "bandpass";
      nbp.frequency.value = Math.min(6000, f2);
      nbp.Q.value = 3;
      const ng = c.createGain();
      ng.gain.value = 0.045;
      ns.connect(nbp);
      nbp.connect(ng);
      ng.connect(mix);
      ns.start(t0);
      ns.stop(t0 + Math.min(dur, 0.2));
    } catch {
      /* ignore */
    }

    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(lvl, t0 + 0.03);
    env.gain.setValueAtTime(lvl * 0.9, t0 + Math.max(0.05, dur * 0.5));
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = gender === "f" ? 4800 : 3800;

    mix.connect(env);
    env.connect(lp);
    lp.connect(m);

    const stopAt = t0 + dur + 0.03;
    o1.start(t0);
    o2.start(t0);
    lfo.start(t0);
    o1.stop(stopAt);
    o2.stop(stopAt);
    lfo.stop(stopAt);
  } catch {
    /* never break BGM scheduler */
  }
}

/** whistle / ocarina-like tone (high, pure, slight air) */
function whistleTone(freq: number, peak: number, dur = 0.14) {
  // pure core
  blip(freq, dur, "sine" as OscillatorType, peak, undefined, "bgm");
  // airy edge
  blip(freq, dur * 0.85, "triangle", peak * 0.45, undefined, "bgm");
  // soft breath noise
  noise(0.02, peak * 0.15, 6000, "bgm");
}

/** 6-note whistle chord (童謡-friendly stack) */
function whistleHexad(deg: number, oct: number, peak: number) {
  // scale-degree stack: R 2 3 5 6 R+oct-ish → 6 voices
  const degOffs = [0, 1, 2, 3, 4, 5];
  for (let i = 0; i < 6; i++) {
    const f2 = hz(degMidi(deg + degOffs[i], oct + (i >= 4 ? 12 : 0)));
    const p = peak * (1 - i * 0.1);
    whistleTone(f2, Math.max(0.015, p), 0.13 + (i === 0 ? 0.04 : 0));
  }
}

/** nylon / acoustic guitar pluck (softer than square metal) */
function acGuitar(deg: number, oct = 12, peak = 0.08) {
  const f = hz(degMidi(deg, oct));
  // body: quick bright attack + warm body
  blip(f, 0.09, "triangle", peak, f * 0.985, "bgm");
  blip(f, 0.05, "square", peak * 0.35, undefined, "bgm");
  // string harmonic whisper
  blip(f * 2, 0.04, "triangle", peak * 0.22, undefined, "bgm");
}

/** upright / electric bass pluck for canon comes */
function acBass(deg: number, peak = 0.12) {
  const f = hz(degMidi(deg, -12));
  blip(f, 0.14, "triangle", peak, f * 0.96, "bgm");
  blip(f * 0.5, 0.1, "triangle", peak * 0.45, undefined, "bgm");
}

/** pipe organ rank: multi-stop sustained chord */
function organChord(deg: number, oct: number, peak: number) {
  // principal + octave + twelfth + fifteenth (organ stops)
  const stops = [
    { d: 0, o: oct, p: 1 },
    { d: 0, o: oct + 12, p: 0.55 }, // octave
    { d: 4, o: oct, p: 0.45 }, // fifth
    { d: 0, o: oct + 24, p: 0.28 }, // super octave
    { d: 2, o: oct, p: 0.35 }, // third (mixture-ish)
  ];
  for (const s of stops) {
    const f = hz(degMidi(deg + s.d, s.o));
    // long triangle = flue pipes; slight detune second rank
    blip(f, 0.28, "triangle", peak * s.p, undefined, "bgm");
    blip(f * 1.003, 0.22, "triangle", peak * s.p * 0.35, undefined, "bgm");
  }
}

/** organ pedal (16' + 8') */
function organPedal(deg: number) {
  const f = hz(degMidi(deg, -12));
  blip(f, 0.32, "triangle", 0.14, undefined, "bgm");
  blip(f * 0.5, 0.36, "triangle", 0.1, undefined, "bgm");
  blip(f * 2, 0.2, "triangle", 0.04, undefined, "bgm");
}

/** main melody as triad (root–3–5) */
function triadLead(deg: number, oct: number, peak: number, duty: OscillatorType) {
  const r = hz(degMidi(deg, oct));
  const third = hz(degMidi(deg + 2, oct));
  const fifth = hz(degMidi(deg + 4, oct));
  blip(r, 0.13, duty, peak, undefined, "bgm");
  blip(third, 0.12, duty, peak * 0.72, undefined, "bgm");
  blip(fifth, 0.12, duty, peak * 0.55, undefined, "bgm");
}

/** guitar-ish: bright square pluck + quick decay slide */
function guitarSub(deg: number, oct = 12) {
  const f = hz(degMidi(deg, oct));
  blip(f, 0.07, "square", 0.07, f * 0.97, "bgm");
  blip(f * 2, 0.04, "square", 0.03, undefined, "bgm");
}

/** brass-ish: fat mid triangle + square stab */
function brassSub(deg: number, oct = 0) {
  const f = hz(degMidi(deg, oct));
  blip(f, 0.16, "triangle", 0.08, undefined, "bgm");
  blip(f, 0.12, "square", 0.045, f * 1.01, "bgm");
  // power fifth
  blip(hz(degMidi(deg + 4, oct)), 0.12, "triangle", 0.04, undefined, "bgm");
}

function drums(beat16: number) {
  const d = theme.drum;
  const b = beat16 % 16;

  // boss story kits — 16 patterns (drum 20..35); organ (40) is sacred silence
  if (theme.style === "baroque") {
    if (theme.organ || theme.drum === 40) {
      // soft "room" only — no kit drums (chapel air)
      if (b === 0 && (tick % 64) < 2) noise(0.02, 0.02, 400, "bgm");
      return;
    }
    if (theme.canon || theme.drum === 41) {
      // light acoustic room: soft kick on 1, brush-ish hat
      if (b === 0) bassDrum(0);
      if (b === 8) noise(0.03, 0.035, 900, "bgm");
      if (b === 4 || b === 12) noise(0.025, 0.03, 2500, "bgm");
      if (b % 4 === 2) chipHat(false);
      return;
    }
    if (theme.whistle || theme.drum === 42) {
      // music-box room — almost no drums
      if (b === 0 && tick % 32 === 0) noise(0.015, 0.02, 3000, "bgm");
      return;
    }
    if (theme.choir || theme.drum === 43) {
      // gospel stomp + soft clap
      if (b === 0 || b === 8) bassDrum(1);
      if (b === 4 || b === 12) {
        noise(0.05, 0.08, 4000, "bgm"); // clap
        blip(800, 0.02, "square", 0.03, undefined, "bgm");
      }
      if (b === 6 || b === 14) noise(0.025, 0.04, 3500, "bgm");
      return;
    }
    const kit = theme.drum >= 20 ? (theme.drum - 20) % 16 : Math.max(0, theme.drum - 10);
    // kit 0-15 each clearly different
    if (kit === 0) {
      if (b === 0 || b === 8) bassDrum(1);
      if (b === 4 || b === 12) bassDrum(0);
    } else if (kit === 1) {
      if (b % 4 === 0) bassDrum(0);
      if (b === 6 || b === 14) bassDrum(2);
      if (b === 4 || b === 12) chipSnare();
    } else if (kit === 2) {
      if (b === 0 || b === 3 || b === 6 || b === 8 || b === 11 || b === 14) bassDrum(0);
      if (b === 4 || b === 12) chipSnare();
      if (b % 2 === 1) chipHat(false);
    } else if (kit === 3) {
      if (b === 0) bassDrum(1);
      if (b === 8) bassDrum(3);
      if (b === 4 || b === 12) noise(0.05, 0.06, 900, "bgm");
    } else if (kit === 4) {
      // half-time
      if (b === 0) bassDrum(1);
      if (b === 8) bassDrum(1);
      if (b === 12) chipSnare();
      if (b === 4) chipHat(true);
    } else if (kit === 5) {
      // double-time kicks
      if (b % 2 === 0) bassDrum(b % 4 === 0 ? 1 : 0);
      if (b === 7 || b === 15) bassDrum(2);
      if (b % 4 === 1) chipHat(false);
    } else if (kit === 6) {
      if (b === 0 || b === 5 || b === 8 || b === 13) bassDrum(0);
      if (b === 4 || b === 12) chipSnare();
      if (b === 2 || b === 6 || b === 10 || b === 14) chipHat(false);
    } else if (kit === 7) {
      // sparse distant
      if (b === 0) bassDrum(3);
      if (b === 10) bassDrum(0);
      if (b === 15) noise(0.06, 0.05, 600, "bgm");
    } else if (kit === 8) {
      if (b === 0 || b === 8) bassDrum(1);
      if (b === 2 || b === 6 || b === 10 || b === 14) bassDrum(0);
      if (b === 4 || b === 12) {
        chipSnare();
        bassDrum(0);
      }
    } else if (kit === 9) {
      // metal march
      if (b % 4 === 0) bassDrum(1);
      if (b % 4 === 2) bassDrum(0);
      if (b === 4 || b === 12) chipSnare();
      if (b % 2 === 1) chipHat(true);
    } else if (kit === 10) {
      if (b === 0 || b === 7 || b === 8 || b === 15) bassDrum(2);
      if (b === 4 || b === 12) chipSnare();
    } else if (kit === 11) {
      // prayer soft
      if (b === 0 || b === 8) bassDrum(3);
      if (b === 4 || b === 12) noise(0.04, 0.04, 500, "bgm");
    } else if (kit === 12) {
      // storm
      if (b % 2 === 0) bassDrum(0);
      if (b % 4 === 3) bassDrum(2);
      if (b === 4 || b === 6 || b === 12 || b === 14) chipSnare();
      chipHat(b % 3 === 0);
    } else if (kit === 13) {
      // deep pulse
      if (b === 0 || b === 8) bassDrum(1);
      if (b === 4 || b === 12) bassDrum(1);
      if (b === 2 || b === 10) noise(0.05, 0.05, 300, "bgm");
    } else if (kit === 14) {
      if (b === 0) bassDrum(0);
      if (b === 3 || b === 6) bassDrum(0);
      if (b === 8) bassDrum(1);
      if (b === 11 || b === 14) bassDrum(0);
      if (b === 4 || b === 12) chipSnare();
    } else {
      // cadence kit
      if (b === 0 || b === 8) bassDrum(1);
      if (b === 4) chipSnare();
      if (b === 12) {
        chipSnare();
        bassDrum(2);
      }
      if (b === 14 || b === 15) bassDrum(0);
    }
    return;
  }

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
    // sparse boss (legacy)
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
  if (!c || !m) {
    scheduleNext();
    return;
  }
  if (c.state === "suspended") {
    void c.resume().then(() => {
      if (!muted && scene !== "off") scheduleNext();
    });
    scheduleNext();
    return;
  }

  const t = tick++;
  const beat16 = t % 16;

  // chord changes every half bar (8 ticks)
  const chordIdx = Math.floor(t / 8) % theme.prog.length;
  const rootDeg = theme.prog[chordIdx];

  // —— drums ——
  // fugue / silence / bells: keep almost silent
  if (theme.fugue || theme.flavor === "silence" || theme.flavor === "bells") {
    const b = beat16;
    if (b === 0) blip(80, 0.04, "triangle", 0.035, undefined, "bgm");
    if (b === 8 && theme.flavor !== "silence") noise(0.02, 0.02, 2000, "bgm");
  } else if (theme.flavor === "dawn" || theme.flavor === "abyss" || theme.flavor === "continuo") {
    const b = beat16;
    if (b === 0 || b === 8) blip(70, 0.05, "triangle", 0.05, undefined, "bgm");
    if (b === 4 || b === 12) noise(0.02, 0.025, 2500, "bgm");
  } else if (theme.flavor === "iron" || theme.flavor === "storm" || theme.flavor === "chase") {
    drums(beat16);
  } else if (theme.flavor) {
    const b = beat16;
    if (b === 0 || b === 8) blip(90, 0.05, "triangle", 0.06, undefined, "bgm");
    if (b === 4 || b === 12) noise(0.03, 0.03, 3000, "bgm");
  } else {
    drums(beat16);
  }

  if (theme.style === "baroque") {
    // —— 決意の和声: お経×ゴスペル 混声8和音 ——
    if (theme.choir) {
      try {
        const every = theme.leadEvery || 2;
        // soft chest pedal
        if (t % 8 === 0) {
          voiceTone(hz(degMidi(rootDeg, -12)), 0.34, 0.1, "u", "m");
        }

        if (t % every === 0) {
          const step = Math.floor(t / every);
          const li = step % theme.lead.length;
          const deg = theme.lead[li];
          const phase = Math.floor(step / 8) % 4;
          if (deg >= 0) {
            if (phase === 0) {
              sutraPulse(deg, 0.12);
            } else if (phase === 1) {
              choirOctad(deg, theme.leadPeak ?? 0.09);
            } else if (phase === 2) {
              choirOctad(deg, (theme.leadPeak ?? 0.09) * 1.15);
              const cd = theme.counter[li];
              if (cd >= 0 && step % 2 === 0) {
                voiceTone(hz(degMidi(cd, 12)), 0.24, 0.08, "a", "f");
              }
            } else {
              choirOctad(deg, theme.leadPeak ?? 0.09);
              if (step % 4 === 0) {
                voiceTone(hz(degMidi(rootDeg + 4, 12)), 0.26, 0.07, "a", "f");
              }
            }
          }
        }

        if (t % 32 === 28) {
          voiceTone(hz(degMidi(3, 0)), 0.3, 0.09, "a", "m");
          voiceTone(hz(degMidi(3, 12)), 0.28, 0.07, "a", "f");
        }
        if (t % 32 === 30) {
          voiceTone(hz(degMidi(0, 0)), 0.32, 0.1, "o", "m");
          voiceTone(hz(degMidi(0, 12)), 0.3, 0.08, "o", "f");
        }
      } catch {
        /* keep drums/schedule alive */
      }

      scheduleNext();
      return;
    }

    // —— 鏡像の答: whistle 6-note chords, 童謡 call → mirror answer ——
    if (theme.whistle) {
      const every = theme.leadEvery || 2;
      // soft low drone (koto-ish pad, very quiet)
      if (t % 16 === 0) {
        blip(hz(degMidi(rootDeg, -12)), 0.25, "triangle", 0.025, undefined, "bgm");
      }

      if (t % every === 0) {
        const step = Math.floor(t / every);
        const phrase = Math.floor(step / 16) % 2; // 0 call, 1 answer
        const li = step % theme.lead.length;
        if (phrase === 0) {
          // 問い: subject in whistle hexads
          const deg = theme.lead[li];
          if (deg >= 0) {
            whistleHexad(deg, theme.leadOct ?? 12, theme.leadPeak ?? 0.07);
          }
        } else {
          // 答え: 鏡像 (inversion) in slightly higher whistle
          const deg = theme.counter[li];
          if (deg >= 0) {
            whistleHexad(deg, (theme.leadOct ?? 12) + 12, (theme.leadPeak ?? 0.07) * 0.9);
          }
        }
      }

      // gentle echo of last note every bar (like kids repeating)
      if (t % 16 === 12) {
        const deg = theme.lead[Math.floor(t / every) % theme.lead.length];
        if (deg >= 0) whistleTone(hz(degMidi(deg, 24)), 0.04, 0.18);
      }

      scheduleNext();
      return;
    }

    // —— 影のカノン: acoustic guitar (dux) + bass (comes) ——
    if (theme.canon) {
      const delay = Math.max(2, theme.chordTicks || 4); // comes delay in 8th-steps
      const step = Math.floor(t / 2);

      // optional soft root pad under (very quiet)
      if (t % 16 === 0) {
        blip(hz(degMidi(rootDeg, -12)), 0.2, "triangle", 0.03, undefined, "bgm");
      }

      // Dux — acoustic guitar (on 8ths)
      if (t % 2 === 0) {
        const li = step % theme.lead.length;
        const deg = theme.lead[li];
        if (deg >= 0) {
          acGuitar(deg, theme.leadOct ?? 12, theme.leadPeak ?? 0.09);
          // light double-stop 3rd on phrase starts
          if (step % 8 === 0) acGuitar(deg + 2, (theme.leadOct ?? 12) - 12, 0.035);
        }
      }

      // Comes — bass canon, delayed imitation of the same subject
      if (t % 2 === 0) {
        const comesStep = step - delay;
        if (comesStep >= 0) {
          const ci = comesStep % theme.lead.length;
          const deg = theme.lead[ci];
          if (deg >= 0) {
            acBass(deg, 0.13);
            // octave ghost
            if (comesStep % 4 === 0) {
              blip(hz(degMidi(deg, 0)), 0.08, "triangle", 0.04, undefined, "bgm");
            }
          }
        }
      }

      // sparse guitar answer fills (not breaking canon)
      if (t % 8 === 5) {
        const deg = theme.lead[(step + 2) % theme.lead.length];
        if (deg >= 0) acGuitar(deg + 4, 24, 0.03);
      }

      scheduleNext();
      return;
    }

    // —— 祈りの半終止: pipe organ sacred chorale ——
    if (theme.organ) {
      // pedal long notes
      if (t % 8 === 0) organPedal(rootDeg);
      // manuals: chorale (slow) + parallel fifth organum
      if (t % (theme.leadEvery || 4) === 0) {
        const li = Math.floor(t / (theme.leadEvery || 4)) % theme.lead.length;
        const deg = theme.lead[li];
        if (deg >= 0) {
          organChord(deg, theme.leadOct ?? 12, theme.leadPeak ?? 0.08);
          // organum / mixture fifth
          const cd = theme.counter[li];
          if (cd >= 0) organChord(cd, (theme.leadOct ?? 12) - 12, 0.04);
        }
      }
      // soft held pad on strong bars (swell)
      if (t % 16 === 0) {
        organChord(rootDeg, 0, 0.05);
      }
      // half-cadence glow: hang on dominant more often late in phrase
      if (t % 32 === 24 || t % 32 === 28) {
        organChord(4, 12, 0.07); // scale deg 4 = dominant color
        organPedal(4);
      }
      scheduleNext();
      return;
    }

    // —— 星屑のフーガ: monophonic imitation (subject → answer → CS → stretto) ——
    if (theme.fugue && theme.fugueSubject) {
      const sub = theme.fugueSubject;
      const SUB = sub.length; // typically 16
      const vIdx = Math.floor((theme.arr ?? 0) / 16) % 4;
      const cs = STAR_FUGUE_CS[vIdx] || STAR_FUGUE_CS[0];
      // entry gap = full subject length so each entry is clearly sequential
      // later acts slightly tighter (stretto earlier)
      const gap =
        theme.arr != null && theme.arr >= 48
          ? Math.max(10, SUB - 2)
          : theme.arr != null && theme.arr >= 24
            ? Math.max(12, SUB - 1)
            : SUB;
      // 5 voices: S (tonic) A (dom) S A S
      const TRANSPOSE = [0, 4, 0, 4, 7];
      const OCT = [12, 0, 12, 24, 0];
      const PEAK = [0.12, 0.11, 0.1, 0.095, 0.09];
      const NVOICE = 5;

      // soft continuo only — keep subject audible
      if (t % 8 === 0) {
        blip(hz(degMidi(rootDeg, -12)), 0.2, "triangle", 0.08, undefined, "bgm");
      }
      if (t % 16 === 0) {
        blip(hz(degMidi(rootDeg, -24)), 0.22, "triangle", 0.05, undefined, "bgm");
      }

      // one subject step per tick (leadEvery=1) for clear rhythm
      const step = t;
      const expoEnd = gap * NVOICE; // all voices have entered
      const strettoAt = expoEnd + SUB * 2;

      // —— exposition + free / stretto ——
      for (let v = 0; v < NVOICE; v++) {
        const ent = v * gap;
        if (step < ent) continue;

        let local = step - ent;
        // after full expo, enter stretto: re-entries every gap/2
        if (step >= strettoAt) {
          // stretto: denser overlapping subject heads
          const stGap = Math.max(4, Math.floor(gap / 2));
          const stEnt = v * stGap;
          if ((step - strettoAt) < stEnt) continue;
          local = (step - strettoAt - stEnt) % SUB;
        } else {
          // during/after expo: free counterpoint after one full subject
          if (local >= SUB) {
            // switch to countersubject under later voices
            const csi = (local - SUB) % cs.length;
            let cdeg = cs[csi];
            if (cdeg < 0) continue;
            // keep CS in that voice's register, slightly quieter
            const f = hz(degMidi(cdeg + TRANSPOSE[v] % 4, OCT[v]));
            fugueVoice(f, PEAK[v] * 0.55, v, 0.12);
            continue;
          }
        }

        const si = ((local % SUB) + SUB) % SUB;
        let deg = sub[si];
        if (deg < 0) continue;
        deg += TRANSPOSE[v];
        const f = hz(degMidi(deg, OCT[v]));
        fugueVoice(f, PEAK[v], v, 0.15);
      }

      // cadence brass only every long phrase (not every note!)
      if (step > expoEnd && step % (SUB * 2) === SUB - 1) {
        brassPentad(rootDeg, 12, 0.05);
      }
      if (step > strettoAt && step % SUB === SUB - 1) {
        brassPentad(rootDeg + 4, 12, 0.045);
      }

      scheduleNext();
      return;
    }

    // —— named flavor playback (曲名寄せ) ——
    if (theme.flavor) {
      const fl = theme.flavor;
      const every = theme.leadEvery ?? 2;
      const peak = theme.leadPeak ?? 0.09;
      const leadOct = theme.leadOct ?? 12;

      if (fl === "dawn") {
        // two rising lines, soft
        if (t % 8 === 0) {
          blip(hz(degMidi(rootDeg, -12)), 0.22, "triangle", 0.06, undefined, "bgm");
        }
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            blip(hz(degMidi(deg, 12)), 0.14, "triangle", peak, undefined, "bgm");
            blip(hz(degMidi(deg, 12)), 0.1, "sine" as OscillatorType, peak * 0.4, undefined, "bgm");
          }
          const cd = theme.counter[li];
          if (cd >= 0) {
            blip(hz(degMidi(cd, 0)), 0.13, "triangle", peak * 0.7, undefined, "bgm");
          }
        }
        // dawn shimmer
        if (t % 16 === 12) {
          blip(hz(degMidi(rootDeg + 4, 24)), 0.2, "sine" as OscillatorType, 0.04, undefined, "bgm");
        }
        scheduleNext();
        return;
      }

      if (fl === "subject") {
        // exposition: solo subject first, then add bass/CS
        const step = Math.floor(t / every);
        const expo = theme.lead.length / 2;
        if (t % every === 0) {
          const li = step % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            blip(hz(degMidi(deg, 12)), 0.15, "square", peak * 1.1, undefined, "bgm");
            blip(hz(degMidi(deg, 12)), 0.12, "triangle", peak * 0.5, undefined, "bgm");
          }
        }
        if (step >= expo) {
          if (t % 4 === 0) {
            blip(hz(degMidi(rootDeg, -12)), 0.16, "triangle", 0.09, undefined, "bgm");
          }
          if (t % every === 0) {
            const li = step % theme.counter.length;
            const cd = theme.counter[li];
            if (cd >= 0) blip(hz(degMidi(cd, 0)), 0.12, "triangle", peak * 0.55, undefined, "bgm");
          }
        }
        scheduleNext();
        return;
      }

      if (fl === "continuo") {
        // walking bass every tick-ish, harpsichord plucks on offbeats
        if (t % 1 === 0 && t % 2 === 0) {
          const wi = Math.floor(t / 2) % theme.counter.length;
          const wd = theme.counter[wi];
          if (wd >= 0) {
            blip(hz(degMidi(wd, -12)), 0.12, "triangle", 0.13, undefined, "bgm");
            blip(hz(degMidi(wd, -24)), 0.14, "triangle", 0.06, undefined, "bgm");
          }
        }
        if (t % 4 === 2) {
          // keyboard chord (thin)
          blip(hz(degMidi(rootDeg, 12)), 0.08, "square", 0.05, undefined, "bgm");
          blip(hz(degMidi(rootDeg + 2, 12)), 0.08, "square", 0.04, undefined, "bgm");
          blip(hz(degMidi(rootDeg + 4, 12)), 0.08, "triangle", 0.04, undefined, "bgm");
        }
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            blip(hz(degMidi(deg, 12)), 0.1, "triangle", peak * 0.8, undefined, "bgm");
          }
        }
        scheduleNext();
        return;
      }

      if (fl === "bells") {
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            bellTone(hz(degMidi(deg, leadOct > 12 ? 12 : leadOct)), peak);
            // distant softer answer delayed as quieter second peal
            const cd = theme.counter[li];
            if (cd >= 0 && t % 8 === 0) {
              bellTone(hz(degMidi(cd, 12)), peak * 0.35);
            }
          }
        }
        // wind under bells
        if (t % 32 === 0) noise(0.15, 0.02, 800, "bgm");
        scheduleNext();
        return;
      }

      if (fl === "chase") {
        // fast pursuit: lead runs, answer chases 1 step later
        if (t % 2 === 0) {
          blip(hz(degMidi(rootDeg + (t % 8 === 0 ? 0 : 4), -12)), 0.08, "triangle", 0.08, undefined, "bgm");
        }
        const deg = theme.lead[t % theme.lead.length];
        if (deg >= 0) {
          blip(hz(degMidi(deg, 12)), 0.08, "square", peak, undefined, "bgm");
        }
        const prev = theme.lead[(t + theme.lead.length - 1) % theme.lead.length];
        if (prev >= 0) {
          blip(hz(degMidi(prev + 3, 0)), 0.07, "triangle", peak * 0.65, undefined, "bgm");
        }
        if (t % 4 === 0) {
          blip(hz(degMidi(rootDeg, 24)), 0.05, "square", 0.04, undefined, "bgm");
        }
        scheduleNext();
        return;
      }

      if (fl === "silence") {
        // mostly empty air
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            blip(hz(degMidi(deg, 0)), 0.35, "sine" as OscillatorType, peak, undefined, "bgm");
            blip(hz(degMidi(deg, 0)), 0.3, "triangle", peak * 0.5, undefined, "bgm");
          }
        }
        if (t % 64 === 32) noise(0.2, 0.015, 400, "bgm");
        scheduleNext();
        return;
      }

      if (fl === "iron") {
        if (t % 4 === 0) ironHit(rootDeg, 0.1);
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            blip(hz(degMidi(deg, 0)), 0.12, "square", peak, undefined, "bgm");
            blip(hz(degMidi(deg + 4, 0)), 0.12, "square", peak * 0.7, undefined, "bgm");
          }
        }
        if (beat16 === 0 || beat16 === 8) {
          blip(60, 0.08, "square", 0.1, 40, "bgm");
        }
        scheduleNext();
        return;
      }

      if (fl === "tear") {
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          const prev = theme.lead[(li + theme.lead.length - 1) % theme.lead.length];
          if (deg >= 0 && prev >= 0 && Math.abs(deg - prev) >= 4) {
            tearSlide(prev, deg, peak);
          } else if (deg >= 0) {
            blip(hz(degMidi(deg, 12)), 0.12, "square", peak, undefined, "bgm");
            blip(hz(degMidi(deg, 24)), 0.06, "triangle", peak * 0.3, undefined, "bgm");
          }
        }
        if (t % 8 === 4) {
          blip(hz(degMidi(rootDeg, -12)), 0.1, "triangle", 0.08, undefined, "bgm");
        }
        scheduleNext();
        return;
      }

      if (fl === "storm") {
        if (t % 2 === 0) {
          blip(hz(degMidi(rootDeg + (t % 4), -12)), 0.08, "triangle", 0.09, undefined, "bgm");
        }
        const deg = theme.lead[t % theme.lead.length];
        if (deg >= 0) {
          triadLead(deg, 12, peak * 0.85, "square");
        }
        const cd = theme.counter[t % theme.counter.length];
        if (cd >= 0 && t % 2 === 1) {
          blip(hz(degMidi(cd, 24)), 0.06, "square", peak * 0.45, undefined, "bgm");
        }
        if (beat16 === 0) brassPentad(rootDeg, 0, 0.05);
        if (t % 3 === 0) noise(0.02, 0.03, 5000, "bgm");
        scheduleNext();
        return;
      }

      if (fl === "abyss") {
        // sub pressure
        if (t % 2 === 0) {
          const wi = Math.floor(t / 2) % theme.counter.length;
          const wd = theme.counter[wi];
          if (wd >= 0) {
            const f = hz(degMidi(wd, -24));
            blip(f, 0.2, "triangle", 0.16, undefined, "bgm");
            blip(f * 1.5, 0.16, "triangle", 0.05, undefined, "bgm");
            blip(Math.max(30, f * 0.5), 0.22, "sine" as OscillatorType, 0.08, undefined, "bgm");
          }
        }
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            blip(hz(degMidi(deg, 12)), 0.2, "sine" as OscillatorType, peak * 0.6, undefined, "bgm");
          }
        }
        if (t % 16 === 8) noise(0.12, 0.025, 300, "bgm");
        scheduleNext();
        return;
      }

      if (fl === "cadence") {
        // clear I-IV-V-I with fanfare
        if (t % 4 === 0) {
          blip(hz(degMidi(rootDeg, -12)), 0.14, "triangle", 0.1, undefined, "bgm");
        }
        if (t % every === 0) {
          const li = Math.floor(t / every) % theme.lead.length;
          const deg = theme.lead[li];
          if (deg >= 0) {
            blip(hz(degMidi(deg, 12)), 0.12, "square", peak, undefined, "bgm");
            blip(hz(degMidi(deg + 2, 12)), 0.12, "triangle", peak * 0.55, undefined, "bgm");
            blip(hz(degMidi(deg + 4, 12)), 0.12, "triangle", peak * 0.4, undefined, "bgm");
          }
        }
        if (beat16 === 0) brassPentad(rootDeg, 12, 0.07);
        if (beat16 === 8) brassPentad(rootDeg + 4, 12, 0.055);
        // amen-ish at phrase end
        if (t % 32 === 30) brassPentad(0, 12, 0.08);
        scheduleNext();
        return;
      }
    }

    const bassMode = theme.bassMode ?? 1;
    const leadMode = theme.leadMode ?? 0;
    const gtrMode = theme.gtrMode ?? 1;
    const brassMode = theme.brassMode ?? 1;
    const leadEvery = theme.leadEvery ?? 2;
    const leadOct = theme.leadOct ?? 12;
    const gtrOct = theme.gtrOct ?? 12;
    const brassOct = theme.brassOct ?? 0;
    const peak = theme.leadPeak ?? 0.09;

    // —— BASS ——
    if (bassMode === 0) {
      // pedal tonic
      if (t % 4 === 0) {
        const f = hz(degMidi(rootDeg, -12));
        blip(f, 0.16, "triangle", 0.12, undefined, "bgm");
      }
    } else if (bassMode === 1) {
      if (t % 2 === 0) {
        const walk =
          t % 8 === 0 ? rootDeg : t % 8 === 2 ? rootDeg + 2 : t % 8 === 4 ? rootDeg + 4 : rootDeg + 3;
        blip(hz(degMidi(walk, -12)), 0.11, "triangle", 0.11, undefined, "bgm");
      }
    } else if (bassMode === 2) {
      // ostinato 4-note
      if (t % 2 === 0) {
        const o = [rootDeg, rootDeg, rootDeg + 4, rootDeg + 5][(t / 2) % 4];
        blip(hz(degMidi(o, -12)), 0.1, "triangle", 0.13, undefined, "bgm");
        blip(hz(degMidi(o, -24)), 0.12, "triangle", 0.06, undefined, "bgm");
      }
    } else if (bassMode === 3) {
      // sparse
      if (t % 8 === 0) blip(hz(degMidi(rootDeg, -12)), 0.18, "triangle", 0.14, undefined, "bgm");
    } else if (bassMode === 4) {
      // syncop
      if (t % 4 === 1 || t % 4 === 2) {
        blip(hz(degMidi(rootDeg + (t % 8 === 1 ? 0 : 4), -12)), 0.09, "triangle", 0.1, undefined, "bgm");
      }
    } else {
      // power fifths
      if (t % 2 === 0) {
        blip(hz(degMidi(rootDeg, -12)), 0.1, "square", 0.08, undefined, "bgm");
        blip(hz(degMidi(rootDeg + 4, -12)), 0.1, "triangle", 0.07, undefined, "bgm");
      }
    }

    // —— LEAD ——
    if (t % leadEvery === 0) {
      const li = Math.floor(t / leadEvery) % theme.lead.length;
      const deg = theme.lead[li];
      if (deg >= 0) {
        if (leadMode === 0 || leadMode === 1) {
          triadLead(deg, leadOct, peak, theme.leadDuty);
        } else if (leadMode === 2) {
          blip(hz(degMidi(deg, leadOct)), 0.12, theme.leadDuty, peak * 1.15, undefined, "bgm");
        } else if (leadMode === 3) {
          // arpeggio run of triad
          const offs = [0, 2, 4, 7];
          const o = offs[(t / leadEvery) % 4];
          blip(hz(degMidi(deg + o, leadOct)), 0.08, "square", peak, undefined, "bgm");
        } else if (leadMode === 4) {
          brassPentad(deg, leadOct > 12 ? 12 : leadOct, peak * 0.7);
        } else {
          // call-response: alternate lead / counter pitch
          if (Math.floor(t / leadEvery) % 2 === 0) {
            triadLead(deg, leadOct, peak, theme.leadDuty);
          } else {
            const cd = theme.counter[li] ?? deg;
            if (cd >= 0) blip(hz(degMidi(cd, leadOct)), 0.11, "square", peak, undefined, "bgm");
          }
        }
      }
    }

    // —— GUITAR ——
    if (gtrMode === 1 && t % 2 === 1) {
      const ci = Math.floor(t / 2) % Math.max(1, theme.counter.length);
      const cd = theme.counter[ci];
      if (cd >= 0) guitarSub(cd, gtrOct);
      else if (t % 4 === 1) guitarSub(rootDeg + 4, gtrOct);
    } else if (gtrMode === 2) {
      // 16th-ish plucks
      const cd = theme.counter[t % Math.max(1, theme.counter.length)];
      if (cd >= 0 && t % 1 === 0) {
        if (t % 2 === 0 || t % 3 === 0) guitarSub(cd, gtrOct);
      }
    } else if (gtrMode === 3 && t % 4 === 0) {
      // power chord
      const f = hz(degMidi(rootDeg, gtrOct));
      blip(f, 0.1, "square", 0.08, undefined, "bgm");
      blip(hz(degMidi(rootDeg + 4, gtrOct)), 0.1, "square", 0.06, undefined, "bgm");
      blip(f * 2, 0.06, "square", 0.04, undefined, "bgm");
    } else if (gtrMode === 4 && t % 8 === 2) {
      guitarSub(rootDeg + 2, gtrOct);
    }

    // —— BRASS ——
    if (brassMode === 1 && t % 4 === 0) {
      brassSub(rootDeg, brassOct);
    } else if (brassMode === 2 && t % 2 === 0) {
      brassSub(rootDeg + ((t / 2) % 2 === 0 ? 0 : 2), brassOct);
    } else if (brassMode === 3 && beat16 === 0) {
      brassPentad(rootDeg, brassOct, 0.06);
    } else if (brassMode === 4 && t % 8 === 0) {
      // pad: soft long triad
      triadLead(rootDeg, brassOct, 0.05, "triangle");
    } else if (brassMode === 5 && t % 4 === 2) {
      const ci = Math.floor(t / 2) % Math.max(1, theme.counter.length);
      const cd = theme.counter[ci];
      if (cd >= 0) brassSub(cd, brassOct);
    }
    if (brassMode === 3 && beat16 === 8 && (theme.arr ?? 0) % 2 === 0) {
      brassSub(rootDeg + 4, brassOct);
    }

    scheduleNext();
    return;
  }

  // —— chip path (stage / attract / legacy boss) ——
  // bass (triangle, on 8ths)
  if (t % 2 === 0) {
    const bassDeg = t % 8 === 6 ? rootDeg + 4 : rootDeg;
    const f = hz(degMidi(bassDeg, -12));
    blip(f, 0.09, "triangle", scene === "attract" ? 0.07 : 0.11, undefined, "bgm");
  }

  // keygen-style fast arpeggio
  const notes = arpNotes(rootDeg);
  const ad = orderArp(notes, theme.arpStyle, t);
  const arpHz = hz(degMidi(ad, 12));
  blip(arpHz, 0.055, "square", scene === "attract" ? 0.035 : 0.055, undefined, "bgm");

  // main lead
  if (t % 2 === 0) {
    const li = Math.floor(t / 2) % theme.lead.length;
    const deg = theme.lead[li];
    if (deg >= 0) {
      const f = hz(degMidi(deg, 12));
      const peak = scene === "attract" ? 0.07 : 0.1;
      blip(f, 0.1, theme.leadDuty, peak, undefined, "bgm");
      if (scene !== "attract" && t % 4 === 0) {
        blip(f * 2, 0.06, "square", peak * 0.35, undefined, "bgm");
      }
    }
  }

  // legacy boss accent run
  if (theme.style === "legacy" && beat16 === 0) {
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
  const c = ac();
  if (c && c.state === "suspended") {
    // wait for unlockAudio from gesture; still arm scheduler retry
    void c.resume().then(() => {
      if (!muted && scene === kind) chipTick();
    });
    scheduleNext();
    return;
  }
  chipTick();
}

export function startBossBgm(vibe = 0, stage = 1) {
  clearScheduler();
  scene = "boss";
  bossId = ((vibe | 0) % 8 + 8) % 8;
  stageNum = Math.max(1, stage | 0);
  tick = 0;
  theme = buildBaroqueBossTheme(stageNum);
  if (muted) return;
  const c = ac();
  if (c && c.state === "suspended") {
    void c.resume().then(() => {
      if (!muted && scene === "boss") chipTick();
    });
    scheduleNext();
    return;
  }
  chipTick();
}

/** Old chip boss themes — archive for sound test */
export function startLegacyBossBgm(vibe = 0, stage = 1) {
  clearScheduler();
  scene = "boss";
  bossId = ((vibe | 0) % 8 + 8) % 8;
  stageNum = Math.max(1, stage | 0);
  tick = 0;
  theme = buildTheme(stageNum, true);
  theme.style = "legacy";
  theme.tempo = Math.max(70, theme.tempo - bossId);
  theme.arpStyle = (theme.arpStyle + bossId) % 4;
  if (muted) return;
  const c = ac();
  if (c && c.state === "suspended") {
    void c.resume().then(() => {
      if (!muted && scene === "boss") chipTick();
    });
    scheduleNext();
    return;
  }
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

export function currentBgmScene(): Scene {
  return scene;
}

export function currentThemeStory(): string | undefined {
  return theme.story;
}

/** Sound test: title / stage / new boss / legacy boss */
export function playSoundTestTrack(
  kind: "title" | "stage" | "boss" | "legacy",
  index = 1,
): string {
  const n = Math.max(1, Math.min(64, index | 0));
  if (kind === "title") {
    startBgm("attract");
    return "TITLE THEME";
  }
  if (kind === "stage") {
    startBgm("play", n);
    return `STAGE ${String(n).padStart(2, "0")} BGM`;
  }
  if (kind === "legacy") {
    startLegacyBossBgm((n - 1) % 8, n);
    return `旧ボス ${String(n).padStart(2, "0")} (CHIP)`;
  }
  startBossBgm((n - 1) % 8, n);
  return bossStoryMeta(n).title;
}

export function soundTestCatalog(): {
  stages: number;
  bosses: number;
  labels: {
    title: string;
    stage: (n: number) => string;
    boss: (n: number) => string;
    legacy: (n: number) => string;
  };
} {
  return {
    stages: 64,
    bosses: 64,
    labels: {
      title: "TITLE THEME",
      stage: (n) => `STAGE ${String(n).padStart(2, "0")}`,
      boss: (n) => bossStoryMeta(n).title,
      legacy: (n) => `旧B${String(n).padStart(2, "0")} CHIP`,
    },
  };
}
