/**
 * SWIPE FORCE — 64 stages (wrap forever after FINAL SWIPE).
 *
 * Single source of truth for stage/boss roster used by gameplay,
 * BGM vibe selection, and sound test labels.
 */

export const STAGE_COUNT = 64;

export type StageBossDef = {
  /** 0..63 */
  id: number;
  name: string;
  /** visual archetype 0..7 */
  shape: number;
  /** movement archetype 0..7 */
  move: number;
  /** attack archetype 0..11 */
  atk: number;
  /** BGM mood / boss theme family 0..7 */
  vibe: number;
  w: number;
  h: number;
  c1: string;
  c2: string;
  c3: string;
};

export type StageDef = {
  /** 1-based stage number (mod STAGE_COUNT for roster) */
  stage: number;
  /** 0..63 index into roster */
  index: number;
  boss: StageBossDef;
  /** short label e.g. "STAGE 01" */
  label: string;
  /** BGM vibe for boss fight */
  bossVibe: number;
};

/** Boss display names (stage order) */
export const STAGE_BOSS_NAMES: readonly string[] = [
  // 0-15
  "SWF-CORE",
  "HEXA-CLAW",
  "VOID SERPENT",
  "RAID TITAN",
  "OMEGA FORCE",
  "NEON HYDRA",
  "GRID WRAITH",
  "PULSE REAVER",
  "ARC BEETLE",
  "VECTOR MANTIS",
  "BIT KRAKEN",
  "SYNTH GOLIATH",
  "ORBIT SPIDER",
  "NOVA SCORPION",
  "CHROME LOCUST",
  "LASER MOTH",
  // 16-31
  "PHANTOM DISC",
  "STORM WEDGE",
  "ION COBRA",
  "PLASMA SHARK",
  "QUASAR FIST",
  "ECHO DRAGON",
  "STATIC WOLF",
  "FLUX RAVEN",
  "PRISM MANTLE",
  "CYBER LOTUS",
  "DARK DIODE",
  "WARP HORNET",
  "NULL SENTRY",
  "RIFT CRAB",
  "GLITCH OWL",
  "BYTE BASILISK",
  // 32-47
  "SAW ANGEL",
  "THORN CROWN",
  "MAGNET HYENA",
  "TURBO VIPER",
  "CRYSTAL TOAD",
  "SMOKE JACKAL",
  "VOLT SCYTHE",
  "MIRROR LOOM",
  "ASH PHOENIX",
  "RUST COLOSSUS",
  "FROST DRIFTER",
  "EMBER WHEEL",
  "TOXIC ORBITER",
  "SILENT ABYSS",
  "HOWL ENGINE",
  "CROWN ZERO",
  // 48-63
  "JAZZ KNIFE",
  "PUNK ORBIT",
  "SWING REAPER",
  "RIFF DEMON",
  "BEBOP SPIKE",
  "MOSH TITAN",
  "SAX WRAITH",
  "DISTORT KING",
  "BLUE NOTE-X",
  "POWER CHORD",
  "WALKING BASS",
  "CRASH CYMBAL",
  "ALTO STRIKER",
  "FUZZ SERAPH",
  "TEMPO BREAKER",
  "FINAL SWIPE",
] as const;

/** 16 palettes, cycled across 64 bosses */
export const STAGE_PALETTES: readonly [string, string, string][] = [
  ["#aa44ff", "#44ffcc", "#ff66ff"],
  ["#ff44aa", "#220033", "#ff88cc"],
  ["#66ffaa", "#228866", "#ffffff"],
  ["#8866ff", "#ff44ff", "#44ffcc"],
  ["#ff2288", "#00ffcc", "#aa44ff"],
  ["#ffcc00", "#ff6600", "#ffff88"],
  ["#00aaff", "#004488", "#88eeff"],
  ["#ff3333", "#880000", "#ffaaaa"],
  ["#88ff00", "#335500", "#ccff66"],
  ["#ff00ff", "#440044", "#ffaaff"],
  ["#00ff88", "#003322", "#aaffcc"],
  ["#ffaa44", "#663300", "#ffe0aa"],
  ["#aaaaff", "#222266", "#ddddff"],
  ["#ff6688", "#440022", "#ffccd0"],
  ["#66ffee", "#004444", "#ccffff"],
  ["#ffee00", "#444400", "#ffffaa"],
] as const;

function buildBoss(id: number): StageBossDef {
  const pal = STAGE_PALETTES[id % STAGE_PALETTES.length];
  const shape = id % 8;
  const move = (id * 3) % 8;
  const atk = (id * 5 + Math.floor(id / 8)) % 12;
  const vibe = (id + Math.floor(id / 8)) % 8;
  const w = 40 + (id % 5) * 4 + (shape === 3 || shape === 7 ? 8 : 0);
  const h = 32 + (id % 4) * 3 + (shape === 2 ? 6 : 0);
  return {
    id,
    name: STAGE_BOSS_NAMES[id] ?? `BOSS-${id + 1}`,
    shape,
    move,
    atk,
    vibe,
    w,
    h,
    c1: pal[0],
    c2: pal[1],
    c3: pal[2],
  };
}

/** Full 64-boss roster (stage index 0 = stage 1) */
export const STAGE_BOSSES: readonly StageBossDef[] = Array.from(
  { length: STAGE_COUNT },
  (_, i) => buildBoss(i),
);

export function stageIndex(stage: number): number {
  return ((Math.max(1, stage | 0) - 1) % STAGE_COUNT + STAGE_COUNT) % STAGE_COUNT;
}

/** Boss for 1-based stage number (wraps every 64). */
export function bossForStage(stage: number): StageBossDef {
  return STAGE_BOSSES[stageIndex(stage)];
}

export function bossById(id: number): StageBossDef {
  return STAGE_BOSSES[((id % STAGE_COUNT) + STAGE_COUNT) % STAGE_COUNT];
}

/** Full stage record for UI / BGM / spawn. */
export function stageDef(stage: number): StageDef {
  const index = stageIndex(stage);
  const boss = STAGE_BOSSES[index];
  return {
    stage: Math.max(1, stage | 0),
    index,
    boss,
    label: `STAGE ${String(index + 1).padStart(2, "0")}`,
    bossVibe: boss.vibe,
  };
}

/** All 64 stages as StageDef (stage 1..64). */
export const STAGES: readonly StageDef[] = Array.from(
  { length: STAGE_COUNT },
  (_, i) => stageDef(i + 1),
);

// —— aliases matching older @/lib/bosses ——
export type BossDef = StageBossDef;
export const BOSSES = STAGE_BOSSES;
