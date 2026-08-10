/**
 * Particle FX descriptors (recovered Pr).
 */

export type ParticleDesc = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
};

export function buildBurstParticles(
  x: number,
  y: number,
  color: string,
  count = 14,
  rand: () => number = Math.random,
): ParticleDesc[] {
  const out: ParticleDesc[] = [];
  for (let i = 0; i < count; i++) {
    const ang = rand() * Math.PI * 2;
    const spd = 0.5 + rand() * 2.8;
    out.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 18 + rand() * 18,
      max: 36,
      color,
      size: 1 + +(rand() > 0.6),
    });
  }
  return out;
}

export type LockBeamDesc = {
  tx: number;
  ty: number;
  life: number;
  color: string;
};

export type LockHitFx = {
  beam: LockBeamDesc;
  spark: ParticleDesc;
  dmg: number;
  target: { x: number; y: number; id?: number };
};

/** Recovered qr visuals + damage (caller applies Lr). */
export function buildLockonHits(opts: {
  targets: { x: number; y: number; id?: number }[];
  lockon: number;
  hyper: number;
}): LockHitFx[] {
  const e = opts.lockon;
  if (e <= 0 || !opts.targets.length) return [];
  const t = opts.hyper;
  const r = 1 + e + t;
  const color = t > 0 ? "#ff66ff" : "#00ffcc";
  return opts.targets.map((i) => ({
    beam: {
      tx: i.x,
      ty: i.y,
      life: 8 + e * 2,
      color,
    },
    spark: {
      x: i.x,
      y: i.y,
      vx: 0,
      vy: 0,
      life: 10,
      max: 10,
      color: "#ff2244",
      size: 3,
    },
    dmg: r,
    target: i,
  }));
}
