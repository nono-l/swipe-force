/**
 * JPDOC: 64面マップチップの並べとスクロール方向。
 */
/**
 * SWIPE FORCE — Xevious-style map chips for all 64 stages.
 * Tiles are procedural 16×16 chips (atlas), layouts are seeded tilemaps.
 * Draw under stars/entities in the playfield.
 */

import { STAGE_COUNT, stageIndex } from "@/lib/stages";

export const TILE = 16;
/** Field inner width is 224 → 14 tiles across */
export const MAP_COLS = 14;
/** Long vertical strip (scrolls during stage) */
export const MAP_ROWS = 100;

export type BiomeId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StageMapDef = {
  stage: number;
  index: number;
  biome: BiomeId;
  biomeName: string;
  /** row-major tile ids, length MAP_COLS * MAP_ROWS */
  tiles: Uint8Array;
  scrollSpeed: number;
};

const BIOME_NAMES = [
  "GRASSLAND",
  "DESERT",
  "COAST",
  "GRID CITY",
  "TUNDRA",
  "MAGMA",
  "NEON CORE",
  "VOID EDGE",
] as const;

/** 16 chip types */
export const CHIP = {
  BASE: 0,
  DIRT: 1,
  ROCK: 2,
  WATER: 3,
  TREE: 4,
  FORT: 5,
  FORT2: 6,
  HAZARD: 7,
  ROAD_H: 8,
  ROAD_V: 9,
  CRATER: 10,
  SAND: 11,
  METAL: 12,
  LIGHT: 13,
  EDGE: 14,
  SPECIAL: 15,
} as const;

type Palette = {
  deep: string;
  base: string;
  mid: string;
  hi: string;
  accent: string;
  water: string;
  rock: string;
  road: string;
  metal: string;
  hazard: string;
};

const BIOME_PAL: readonly Palette[] = [
  // grassland
  {
    deep: "#0a2810",
    base: "#1a5020",
    mid: "#2a7030",
    hi: "#4a9048",
    accent: "#88cc44",
    water: "#1a4868",
    rock: "#3a4838",
    road: "#5a5038",
    metal: "#4a5850",
    hazard: "#886622",
  },
  // desert
  {
    deep: "#2a1808",
    base: "#6a4820",
    mid: "#8a6830",
    hi: "#c0a050",
    accent: "#e8c868",
    water: "#306878",
    rock: "#5a4030",
    road: "#7a6038",
    metal: "#6a5850",
    hazard: "#cc6622",
  },
  // coast
  {
    deep: "#081828",
    base: "#1a4050",
    mid: "#2a6070",
    hi: "#48a0a8",
    accent: "#88e0d0",
    water: "#104868",
    rock: "#3a4850",
    road: "#486068",
    metal: "#406070",
    hazard: "#2288aa",
  },
  // grid city
  {
    deep: "#101018",
    base: "#202030",
    mid: "#303048",
    hi: "#505068",
    accent: "#44aaff",
    water: "#183048",
    rock: "#383848",
    road: "#2a2a38",
    metal: "#486878",
    hazard: "#ff4466",
  },
  // tundra
  {
    deep: "#102028",
    base: "#304858",
    mid: "#507088",
    hi: "#a0c0d0",
    accent: "#e0f0ff",
    water: "#204060",
    rock: "#485868",
    road: "#607888",
    metal: "#688898",
    hazard: "#66aacc",
  },
  // magma
  {
    deep: "#180808",
    base: "#401010",
    mid: "#682018",
    hi: "#a04020",
    accent: "#ff6622",
    water: "#401818",
    rock: "#302018",
    road: "#503028",
    metal: "#604040",
    hazard: "#ff2200",
  },
  // neon
  {
    deep: "#080818",
    base: "#101028",
    mid: "#201840",
    hi: "#402868",
    accent: "#00ffaa",
    water: "#102040",
    rock: "#281838",
    road: "#181830",
    metal: "#304060",
    hazard: "#ff00aa",
  },
  // void
  {
    deep: "#04040c",
    base: "#0c0c18",
    mid: "#181828",
    hi: "#303048",
    accent: "#aa66ff",
    water: "#101028",
    rock: "#1a1a28",
    road: "#141420",
    metal: "#282840",
    hazard: "#ff4488",
  },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function biomeForStage(stage: number): BiomeId {
  return (stageIndex(stage) >> 3) as BiomeId; // 0..7 every 8 stages
}

export function biomeName(stage: number): string {
  return BIOME_NAMES[biomeForStage(stage)];
}

function setTile(tiles: Uint8Array, c: number, r: number, id: number) {
  if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return;
  tiles[r * MAP_COLS + c] = id & 15;
}

function getTile(tiles: Uint8Array, c: number, r: number): number {
  if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return CHIP.BASE;
  return tiles[r * MAP_COLS + c] ?? CHIP.BASE;
}

/** Build one stage map (deterministic). */
export function buildStageMap(stage: number): StageMapDef {
  const index = stageIndex(stage);
  const biome = biomeForStage(stage);
  const rnd = mulberry32(0x5f4e_0000 ^ (index * 0x9e37) ^ (biome * 0x85eb));
  const tiles = new Uint8Array(MAP_COLS * MAP_ROWS);
  tiles.fill(CHIP.BASE);

  // base variation
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const n = rnd();
      if (biome === 1 && n < 0.35) setTile(tiles, c, r, CHIP.SAND);
      else if (biome === 2 && n < 0.22) setTile(tiles, c, r, CHIP.WATER);
      else if (biome === 4 && n < 0.18) setTile(tiles, c, r, CHIP.SAND);
      else if (n < 0.08) setTile(tiles, c, r, CHIP.DIRT);
      else if (n < 0.12) setTile(tiles, c, r, CHIP.EDGE);
    }
  }

  // vertical river / ravine
  if (biome === 0 || biome === 2 || biome === 4 || biome === 5) {
    let x = 3 + Math.floor(rnd() * (MAP_COLS - 6));
    for (let r = 0; r < MAP_ROWS; r++) {
      x += rnd() < 0.35 ? (rnd() < 0.5 ? -1 : 1) : 0;
      x = Math.max(1, Math.min(MAP_COLS - 2, x));
      setTile(tiles, x, r, CHIP.WATER);
      if (rnd() < 0.55) setTile(tiles, x + (rnd() < 0.5 ? -1 : 1), r, CHIP.WATER);
    }
  }

  // roads / paths
  {
    let x = 2 + Math.floor(rnd() * (MAP_COLS - 4));
    for (let r = 0; r < MAP_ROWS; r++) {
      if (r % 17 === 0) x = 2 + Math.floor(rnd() * (MAP_COLS - 4));
      setTile(tiles, x, r, CHIP.ROAD_V);
      if (rnd() < 0.15) setTile(tiles, x + 1, r, CHIP.ROAD_V);
      // occasional cross road
      if (r % 11 === 5) {
        for (let c = 0; c < MAP_COLS; c++) {
          if (getTile(tiles, c, r) !== CHIP.WATER) setTile(tiles, c, r, CHIP.ROAD_H);
        }
      }
    }
  }

  // rocks / trees / craters
  for (let i = 0; i < 90 + index * 2; i++) {
    const c = Math.floor(rnd() * MAP_COLS);
    const r = Math.floor(rnd() * MAP_ROWS);
    if (getTile(tiles, c, r) === CHIP.WATER) continue;
    const pick = rnd();
    if (pick < 0.35) setTile(tiles, c, r, CHIP.ROCK);
    else if (pick < 0.55) setTile(tiles, c, r, CHIP.TREE);
    else if (pick < 0.7) setTile(tiles, c, r, CHIP.CRATER);
    else if (pick < 0.85) setTile(tiles, c, r, CHIP.DIRT);
    else setTile(tiles, c, r, CHIP.HAZARD);
  }

  // fort / base clusters every ~12 rows (Xevious ground targets feel)
  for (let baseR = 6; baseR < MAP_ROWS - 4; baseR += 10 + Math.floor(rnd() * 6)) {
    const bc = 2 + Math.floor(rnd() * (MAP_COLS - 5));
    const br = baseR + Math.floor(rnd() * 3);
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const id =
          dx === 1 && dy === 1
            ? CHIP.SPECIAL
            : rnd() < 0.5
              ? CHIP.FORT
              : CHIP.FORT2;
        setTile(tiles, bc + dx, br + dy, id);
      }
    }
    // approach metal pads near boss end (high rows)
    if (baseR > MAP_ROWS * 0.65) {
      for (let dx = -1; dx < 4; dx++) setTile(tiles, bc + dx, br - 1, CHIP.METAL);
    }
  }

  // neon / city grids
  if (biome === 3 || biome === 6) {
    for (let r = 0; r < MAP_ROWS; r += 4) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (c % 4 === 0) setTile(tiles, c, r, CHIP.METAL);
        if (r % 8 === 0 && getTile(tiles, c, r) === CHIP.BASE)
          setTile(tiles, c, r, CHIP.LIGHT);
      }
    }
  }

  // late-stage density (boss approach corridor)
  for (let r = MAP_ROWS - 18; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (c === 0 || c === MAP_COLS - 1) setTile(tiles, c, r, CHIP.METAL);
      else if (rnd() < 0.08) setTile(tiles, c, r, CHIP.LIGHT);
    }
  }

  const scrollSpeed = 0.55 + (index % 8) * 0.06 + Math.floor(index / 16) * 0.04;

  return {
    stage: Math.max(1, stage | 0),
    index,
    biome,
    biomeName: BIOME_NAMES[biome],
    tiles,
    scrollSpeed,
  };
}

// —— atlas cache ——
const atlasCache = new Map<BiomeId, HTMLCanvasElement>();

function paintChip(
  g: CanvasRenderingContext2D,
  id: number,
  pal: Palette,
  ox: number,
  oy: number,
) {
  const T = TILE;
  const fill = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(ox + x, oy + y, w, h);
  };
  // base
  fill(0, 0, T, T, pal.base);
  // noise dots
  g.fillStyle = pal.mid;
  for (let i = 0; i < 6; i++) {
    const x = (i * 5 + id * 3) % (T - 2);
    const y = (i * 7 + id * 2) % (T - 2);
    g.fillRect(ox + 1 + x, oy + 1 + y, 1, 1);
  }

  switch (id) {
    case CHIP.DIRT:
      fill(0, 0, T, T, pal.deep);
      fill(2, 2, T - 4, T - 4, pal.mid);
      break;
    case CHIP.ROCK:
      fill(3, 3, 10, 10, pal.rock);
      fill(4, 4, 4, 3, pal.hi);
      fill(8, 9, 3, 2, pal.deep);
      break;
    case CHIP.WATER:
      fill(0, 0, T, T, pal.water);
      g.fillStyle = pal.hi;
      g.globalAlpha = 0.35;
      fill(1, 4, 6, 1, pal.hi);
      fill(8, 10, 5, 1, pal.hi);
      g.globalAlpha = 1;
      break;
    case CHIP.TREE:
      fill(6, 9, 4, 5, pal.deep);
      fill(3, 3, 10, 8, pal.accent);
      fill(5, 2, 6, 4, pal.hi);
      break;
    case CHIP.FORT:
      fill(1, 1, T - 2, T - 2, pal.metal);
      fill(3, 3, T - 6, T - 6, pal.deep);
      fill(5, 5, 6, 6, pal.accent);
      break;
    case CHIP.FORT2:
      fill(0, 0, T, T, pal.metal);
      fill(2, 2, T - 4, 4, pal.road);
      fill(4, 8, 8, 5, pal.deep);
      break;
    case CHIP.HAZARD:
      fill(0, 0, T, T, pal.hazard);
      fill(2, 2, T - 4, T - 4, pal.deep);
      g.fillStyle = pal.hi;
      fill(4, 4, 2, 8, pal.hi);
      fill(10, 4, 2, 8, pal.hi);
      break;
    case CHIP.ROAD_H:
      fill(0, 4, T, 8, pal.road);
      fill(0, 7, T, 1, pal.hi);
      break;
    case CHIP.ROAD_V:
      fill(4, 0, 8, T, pal.road);
      fill(7, 0, 1, T, pal.hi);
      break;
    case CHIP.CRATER:
      fill(2, 2, 12, 12, pal.deep);
      fill(4, 4, 8, 8, pal.rock);
      fill(6, 6, 3, 3, pal.mid);
      break;
    case CHIP.SAND:
      fill(0, 0, T, T, pal.hi);
      g.fillStyle = pal.mid;
      for (let i = 0; i < 8; i++)
        g.fillRect(ox + (i * 3) % 15, oy + (i * 5) % 15, 2, 1);
      break;
    case CHIP.METAL:
      fill(0, 0, T, T, pal.metal);
      fill(1, 1, T - 2, 1, pal.hi);
      fill(1, T - 2, T - 2, 1, pal.deep);
      fill(3, 5, 10, 6, pal.deep);
      break;
    case CHIP.LIGHT:
      fill(0, 0, T, T, pal.base);
      fill(5, 5, 6, 6, pal.accent);
      fill(6, 6, 4, 4, pal.hi);
      break;
    case CHIP.EDGE:
      fill(0, 0, T, T, pal.deep);
      fill(0, 0, T, 2, pal.mid);
      break;
    case CHIP.SPECIAL:
      fill(0, 0, T, T, pal.metal);
      fill(2, 2, T - 4, T - 4, pal.accent);
      fill(5, 5, 6, 6, pal.hi);
      break;
    default:
      break;
  }
  // pixel border for chip readability
  g.strokeStyle = "rgba(0,0,0,0.25)";
  g.strokeRect(ox + 0.5, oy + 0.5, T - 1, T - 1);
}

function getAtlas(biome: BiomeId): HTMLCanvasElement {
  const hit = atlasCache.get(biome);
  if (hit) return hit;
  const pal = BIOME_PAL[biome]!;
  const c = document.createElement("canvas");
  c.width = TILE * 16;
  c.height = TILE;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  for (let id = 0; id < 16; id++) paintChip(g, id, pal, id * TILE, 0);
  atlasCache.set(biome, c);
  return c;
}

const mapCache = new Map<number, StageMapDef>();

export function getStageMap(stage: number): StageMapDef {
  const index = stageIndex(stage);
  let m = mapCache.get(index);
  if (!m) {
    m = buildStageMap(stage);
    mapCache.set(index, m);
  }
  return m;
}

/** Prefetch all 64 maps (cheap Uint8Array builds). */
export function warmAllStageMaps(): void {
  for (let i = 1; i <= STAGE_COUNT; i++) getStageMap(i);
}

/**
 * Draw scrolling map into playfield.
 * scrollY grows over time; map tiles move downward (Xevious feel).
 * Low rows = stage start (near bottom of view), high rows = ahead (enter from top).
 */
export function drawStageMap(
  ctx: CanvasRenderingContext2D,
  stage: number,
  scrollY: number,
  fieldX: number,
  fieldY: number,
  fieldW: number,
  fieldH: number,
): void {
  const map = getStageMap(stage);
  const atlas = getAtlas(map.biome);
  const T = TILE;
  const mapHpx = MAP_ROWS * T;
  const sy = ((scrollY % mapHpx) + mapHpx) % mapHpx;
  const yShift = sy % T;
  const baseRow = Math.floor(sy / T);

  ctx.save();
  ctx.beginPath();
  ctx.rect(fieldX, fieldY, fieldW, fieldH);
  ctx.clip();
  ctx.imageSmoothingEnabled = false;

  // Terrain scrolls DOWN; new chips enter from top (fly-up STG).
  // Screen top = higher map rows (ahead), bottom = lower rows (behind).
  const rowsOnScreen = Math.ceil(fieldH / T) + 2;
  for (let i = -1; i < rowsOnScreen; i++) {
    const row =
      (((baseRow + rowsOnScreen - 1 - i) % MAP_ROWS) + MAP_ROWS) % MAP_ROWS;
    const y = fieldY + i * T + yShift;
    if (y > fieldY + fieldH || y + T < fieldY) continue;
    for (let c = 0; c < MAP_COLS; c++) {
      const id = map.tiles[row * MAP_COLS + c] ?? 0;
      const x = fieldX + c * T;
      ctx.drawImage(atlas, id * T, 0, T, T, x, Math.round(y), T, T);
    }
  }

  // subtle scanline / depth
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = fieldY; y < fieldY + fieldH; y += 4) {
    ctx.fillRect(fieldX, y, fieldW, 1);
  }

  ctx.restore();
}

export function stageMapLabel(stage: number): string {
  const m = getStageMap(stage);
  return `${m.biomeName} · MAP ${String(m.index + 1).padStart(2, "0")}`;
}
