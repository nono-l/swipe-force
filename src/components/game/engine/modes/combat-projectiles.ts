/**
 * JPDOC: 弾の移動と寿命。
 */
/**
 * Pure projectile / bullet descriptors for player & enemy fire.
 * Callers push onto the bullet array and play SFX.
 */

export type BulletDesc = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  from: "p" | "e";
  dmg: number;
  kind: "normal" | "missile" | "particle" | "beam" | "flame" | string;
  targetId: number;
  life: number;
  turn: number;
};

export type ShotLevels = {
  shot: number;
  overdrive: number;
  power: number;
  option: number;
};

/** Main shot + option pods (recovered Hr geometry). */
export function buildPlayerShots(
  px: number,
  py: number,
  lv: ShotLevels,
): BulletDesc[] {
  const e = lv.shot;
  const t = Math.max(0, e - 1);
  const n = lv.overdrive;
  const r = lv.power;
  const i = Math.max(0, t - 3);
  const a = 1 + r + +(n > 0) + Math.floor(i / 2);
  const out: BulletDesc[] = [];
  const w = 2 + +(r > 1) + +(i > 4);
  const h = 6 + Math.min(14, r) + Math.floor(i / 3);

  if (e > 0) {
    const dirs: { dx: number; dy: number }[] = [
      { dx: 0, dy: -6.5 - i * 0.05 },
    ];
    if (t >= 1)
      dirs.push({ dx: -1.2, dy: -6.2 }, { dx: 1.2, dy: -6.2 });
    if (t >= 2)
      dirs.push({ dx: -2.2, dy: -5.6 }, { dx: 2.2, dy: -5.6 });
    if (t >= 3)
      dirs.push({ dx: -3.2, dy: -5 }, { dx: 3.2, dy: -5 });
    if (t >= 6)
      dirs.push({ dx: -4, dy: -4.4 }, { dx: 4, dy: -4.4 });
    if (t >= 12)
      dirs.push({ dx: -4.8, dy: -3.8 }, { dx: 4.8, dy: -3.8 });
    for (const d of dirs) {
      out.push({
        x: px,
        y: py - 10,
        vx: d.dx,
        vy: d.dy,
        w,
        h,
        from: "p",
        dmg: a,
        kind: "normal",
        targetId: 0,
        life: 120,
        turn: 0,
      });
    }
  }

  const o = lv.option;
  const od = Math.max(1, a - 1);
  if (o >= 1) {
    out.push({
      x: px - 16,
      y: py - 4,
      vx: 0,
      vy: -5.5,
      w: 2,
      h: 5,
      from: "p",
      dmg: od,
      kind: "normal",
      targetId: 0,
      life: 120,
      turn: 0,
    });
  }
  if (o >= 2) {
    out.push({
      x: px + 16,
      y: py - 4,
      vx: 0,
      vy: -5.5,
      w: 2,
      h: 5,
      from: "p",
      dmg: od,
      kind: "normal",
      targetId: 0,
      life: 120,
      turn: 0,
    });
  }
  return out;
}

export function buildMissiles(opts: {
  px: number;
  py: number;
  missile: number;
  cluster: number;
  targets: { id: number }[];
}): BulletDesc[] {
  const e = opts.missile;
  if (e <= 0) return [];
  const t = opts.cluster;
  const n = e + (t > 0 ? t + 1 : 0);
  const r = opts.targets;
  const i = 2 + e + t;
  const out: BulletDesc[] = [];
  for (let t = 0; t < n; t++) {
    const a = r[t % Math.max(1, r.length)];
    const o = -Math.PI / 2 + (t - (n - 1) / 2) * 0.35;
    out.push({
      x: opts.px + Math.cos(o) * 6,
      y: opts.py - 6,
      vx: Math.cos(o) * 2.5,
      vy: Math.sin(o) * 2.5 - 1.5,
      w: 4,
      h: 4,
      from: "p",
      dmg: i,
      kind: "missile",
      targetId: a ? a.id : 0,
      life: 160,
      turn: 0.12 + e * 0.03,
    });
  }
  return out;
}

export function buildParticles(opts: {
  px: number;
  py: number;
  particle: number;
  overdrive: number;
}): BulletDesc[] {
  const e = opts.particle;
  if (e <= 0) return [];
  const t = opts.overdrive;
  const n = 4 + e * 2 + t * 3;
  const r = 4 + e + t * 2;
  const out: BulletDesc[] = [
    {
      x: opts.px,
      y: opts.py - 14,
      vx: 0,
      vy: -9 - e,
      w: r,
      h: 14 + e * 2,
      from: "p",
      dmg: n,
      kind: "particle",
      targetId: 0,
      life: 90,
      turn: 0,
    },
  ];
  if (t >= 1) {
    for (const s of [-1, 1]) {
      out.push({
        x: opts.px + s * 10,
        y: opts.py - 10,
        vx: s * 0.8,
        vy: -8,
        w: r - 1,
        h: 12,
        from: "p",
        dmg: n - 1,
        kind: "particle",
        targetId: 0,
        life: 90,
        turn: 0,
      });
    }
  }
  if (t >= 2) {
    for (const s of [-1, 1]) {
      out.push({
        x: opts.px,
        y: opts.py - 8,
        vx: s * 2.5,
        vy: -7,
        w: 5,
        h: 10,
        from: "p",
        dmg: Math.floor(n * 0.7),
        kind: "particle",
        targetId: 0,
        life: 80,
        turn: 0,
      });
    }
  }
  return out;
}

export function buildBeams(opts: {
  px: number;
  py: number;
  beam: number;
  power: number;
  option: number;
}): BulletDesc[] {
  const e = opts.beam;
  if (e <= 0) return [];
  const t = opts.power;
  const n = 4 + e * 2 + Math.floor(t / 2);
  const r = 36 + e * 5;
  const i: number[] = [];
  if (opts.option >= 1) i.push(-16);
  if (opts.option >= 2) i.push(16);
  if (!i.length) i.push(0);
  return i.map((off) => ({
    x: opts.px + off,
    y: opts.py - r / 2 - 8,
    vx: 0,
    vy: -16 - e * 0.4,
    w: 3 + Math.floor(e / 4),
    h: r,
    from: "p" as const,
    dmg: n,
    kind: "beam",
    targetId: 0,
    life: 16 + e,
    turn: 0,
  }));
}

export function buildFlames(
  opts: {
    px: number;
    py: number;
    flame: number;
    power: number;
  },
  rand: () => number = Math.random,
): BulletDesc[] {
  const e = opts.flame;
  if (e <= 0) return [];
  const t = opts.power;
  const n = 3 + Math.min(8, e);
  const r = 1 + Math.floor(e / 2) + Math.floor(t / 4);
  const out: BulletDesc[] = [];
  for (let k = 0; k < n; k++) {
    const spread = 0.35 + e * 0.04;
    const ang = -Math.PI / 2 + (rand() - 0.5) * spread;
    const spd = 2.2 + rand() * 1.4 + e * 0.08;
    out.push({
      x: opts.px + (rand() - 0.5) * 6,
      y: opts.py - 8,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      w: 5 + Math.floor(e / 3),
      h: 5 + Math.floor(e / 3),
      from: "p",
      dmg: r,
      kind: "flame",
      targetId: 0,
      life: 14 + e,
      turn: 0,
    });
  }
  return out;
}

export type EnemyFireSource = {
  x: number;
  y: number;
  w: number;
  h: number;
  boss?: boolean;
  bossId?: number;
  type?: number;
};

/** Enemy / boss volleys (recovered Vr). */
export function buildEnemyFire(
  e: EnemyFireSource,
  playerX: number,
  playerY: number,
  atk: number,
): BulletDesc[] {
  const out: BulletDesc[] = [];
  if (e.boss) {
    const t = atk;
    const n = 3 + (t % 4);
    for (let r = 0; r < n; r++) {
      const i =
        Math.atan2(playerY - e.y, playerX - e.x) +
        (r - (n - 1) / 2) * 0.22;
      const a = 1.4 + (t % 3) * 0.25;
      out.push({
        x: e.x,
        y: e.y + e.h * 0.3,
        vx: Math.cos(i) * a,
        vy: Math.sin(i) * a,
        w: 3,
        h: 3,
        from: "e",
        dmg: 1,
        kind: "normal",
        targetId: 0,
        life: 200,
        turn: 0,
      });
    }
    if (t % 3 === 0) {
      for (let s = -2; s <= 2; s++) {
        out.push({
          x: e.x + s * 8,
          y: e.y + 10,
          vx: s * 0.3,
          vy: 1.8,
          w: 3,
          h: 4,
          from: "e",
          dmg: 1,
          kind: "normal",
          targetId: 0,
          life: 180,
          turn: 0,
        });
      }
    }
  } else if ((e.type ?? 0) >= 1) {
    const t = Math.atan2(playerY - e.y, playerX - e.x);
    out.push({
      x: e.x,
      y: e.y + 6,
      vx: Math.cos(t) * 1.6,
      vy: Math.sin(t) * 1.6,
      w: 3,
      h: 3,
      from: "e",
      dmg: 1,
      kind: "normal",
      targetId: 0,
      life: 160,
      turn: 0,
    });
  }
  return out;
}
