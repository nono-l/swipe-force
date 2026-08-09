/**
 * 64 stage bosses for SWIPE FORCE.
 * Each has name, palette, size, move/attack archetypes (behavior via index).
 */

export type BossDef = {
  id: number; // 0..63
  name: string;
  /** visual archetype 0..7 */
  shape: number;
  /** movement archetype 0..7 */
  move: number;
  /** attack archetype 0..11 */
  atk: number;
  /** jazz-punk BGM mood 0..7 */
  vibe: number;
  w: number;
  h: number;
  c1: string;
  c2: string;
  c3: string;
};

const NAMES: string[] = [
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
];

const PALETTES: [string, string, string][] = [
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
];

function buildBosses(): BossDef[] {
  const list: BossDef[] = [];
  for (let i = 0; i < 64; i++) {
    const pal = PALETTES[i % PALETTES.length];
    const shape = i % 8;
    const move = (i * 3) % 8;
    const atk = (i * 5 + Math.floor(i / 8)) % 12;
    const vibe = (i + Math.floor(i / 8)) % 8;
    // size varies
    const w = 40 + (i % 5) * 4 + (shape === 3 || shape === 7 ? 8 : 0);
    const h = 32 + (i % 4) * 3 + (shape === 2 ? 6 : 0);
    list.push({
      id: i,
      name: NAMES[i] ?? `BOSS-${i + 1}`,
      shape,
      move,
      atk,
      vibe,
      w,
      h,
      c1: pal[0],
      c2: pal[1],
      c3: pal[2],
    });
  }
  return list;
}

export const BOSSES: BossDef[] = buildBosses();

export function bossForStage(stage: number): BossDef {
  // stage 1 → index 0, wraps after 64
  const idx = ((Math.max(1, stage) - 1) % 64 + 64) % 64;
  return BOSSES[idx];
}

export function bossById(id: number): BossDef {
  return BOSSES[((id % 64) + 64) % 64];
}
