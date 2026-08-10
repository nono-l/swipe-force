/**
 * Ambient FX lifetimes each frame (stars, floats, particles).
 */

export type Star = { x: number; y: number; s: number; sp: number };
export type FloatText = { y: number; life: number };
export type LifeObj = { life: number };
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

export function tickStars(
  stars: Star[],
  mode: string,
  fieldH: number,
  left: number,
  width: number,
): void {
  const mul = mode === "playing" ? 1 : 0.3;
  for (const e of stars) {
    e.y += e.sp * mul;
    if (e.y > fieldH) {
      e.y = 0;
      e.x = left + Math.random() * width;
    }
  }
}

export function tickFloats(floats: FloatText[]): void {
  for (let e = floats.length - 1; e >= 0; e--) {
    floats[e].y -= 0.45;
    floats[e].life--;
    if (floats[e].life <= 0) floats.splice(e, 1);
  }
}

export function tickLifetimes(list: LifeObj[]): void {
  for (let e = list.length - 1; e >= 0; e--) {
    list[e].life--;
    if (list[e].life <= 0) list.splice(e, 1);
  }
}

export function tickParticles(parts: Particle[]): void {
  for (let e = parts.length - 1; e >= 0; e--) {
    const t = parts[e];
    t.x += t.vx;
    t.y += t.vy;
    t.life--;
    if (t.life <= 0) parts.splice(e, 1);
  }
}

export function decayTimers(t: {
  shake: number;
  shopToast: number;
  optToast: number;
  stToast: number;
  shareToast: number;
  missionBanner: number;
  missionToast: number;
  shield: number;
  celebrate: number;
}): typeof t {
  let we = t.shake;
  if (we > 0) we *= 0.85;
  if (we < 0.2) we = 0;
  return {
    shake: we,
    shopToast: Math.max(0, t.shopToast - 1),
    optToast: Math.max(0, t.optToast - 1),
    stToast: Math.max(0, t.stToast - 1),
    shareToast: Math.max(0, t.shareToast - 1),
    missionBanner: Math.max(0, t.missionBanner - 1),
    missionToast: Math.max(0, t.missionToast - 1),
    shield: Math.max(0, t.shield - 1),
    celebrate: Math.max(0, t.celebrate - 1),
  };
}
