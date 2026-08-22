/**
 * JPDOC: 観戦用の薄い状態。内部クロージャ全部は出さない。
 */
export type SpectatorEnemy = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  boss: boolean;
  type: number;
};

export type SpectatorBullet = {
  x: number;
  y: number;
  w: number;
  h: number;
  from: "p" | "e";
  kind: string;
};

export type SpectatorFrame = {
  v: 1;
  mode: string;
  stage: number;
  score: number;
  pts: number;
  lives: number;
  player: { x: number; y: number; invuln: boolean };
  enemies: SpectatorEnemy[];
  bullets: SpectatorBullet[];
  bossName: string;
  bossActive: boolean;
  shake: number;
  difficulty: string;
};

/** Cap lists so WebRTC datachannel stays light. */
const MAX_ENEMIES = 40;
const MAX_BULLETS = 80;

export function buildSpectatorFrame(input: {
  mode: string;
  stage: number;
  score: number;
  pts: number;
  lives: number;
  player: { x: number; y: number };
  invuln: number;
  enemies: Array<{
    id: number;
    x: number;
    y: number;
    w: number;
    h: number;
    hp: number;
    maxHp: number;
    boss?: boolean;
    type?: number;
  }>;
  bullets: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    from: "p" | "e";
    kind?: string;
  }>;
  bossName: string;
  bossActive: boolean;
  shake: number;
  difficulty: string;
}): SpectatorFrame {
  return {
    v: 1,
    mode: String(input.mode || "attract"),
    stage: input.stage | 0,
    score: input.score | 0,
    pts: input.pts | 0,
    lives: input.lives | 0,
    player: {
      x: Number(input.player?.x) || 0,
      y: Number(input.player?.y) || 0,
      invuln: (input.invuln | 0) > 0,
    },
    enemies: (input.enemies || []).slice(0, MAX_ENEMIES).map((e) => ({
      id: e.id | 0,
      x: Number(e.x) || 0,
      y: Number(e.y) || 0,
      w: Number(e.w) || 12,
      h: Number(e.h) || 12,
      hp: Number(e.hp) || 0,
      maxHp: Number(e.maxHp) || 1,
      boss: !!e.boss,
      type: e.type | 0,
    })),
    bullets: (input.bullets || []).slice(0, MAX_BULLETS).map((b) => ({
      x: Number(b.x) || 0,
      y: Number(b.y) || 0,
      w: Number(b.w) || 2,
      h: Number(b.h) || 4,
      from: b.from === "e" ? "e" : "p",
      kind: String(b.kind || "normal"),
    })),
    bossName: String(input.bossName || ""),
    bossActive: !!input.bossActive,
    shake: Math.max(0, Number(input.shake) || 0),
    difficulty: String(input.difficulty || "easy"),
  };
}

export function isSpectatorFrame(v: unknown): v is SpectatorFrame {
  return !!v && typeof v === "object" && (v as SpectatorFrame).v === 1;
}
