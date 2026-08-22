/**
 * JPDOC: スペック表示。
 */
/**
 * Canvas-free draw specs for bullets / grunts / shake.
 * Game loop applies Q/l with these values.
 */

export type RectSpec = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

export type BulletLike = {
  x: number;
  y: number;
  w: number;
  h: number;
  from?: string;
  kind?: string;
  life?: number;
};

/** Rects for one bullet (local coords absolute). */
export function bulletRects(e: BulletLike, powerLevel: number): RectSpec[] {
  if (e.from === "e") {
    return [
      {
        x: e.x - e.w / 2,
        y: e.y - e.h / 2,
        w: e.w,
        h: e.h,
        color: "#ff3333",
      },
    ];
  }
  if (e.kind === "missile") {
    return [
      { x: e.x - 2, y: e.y - 2, w: 4, h: 4, color: "#ffaa00" },
      { x: e.x - 1, y: e.y + 2, w: 2, h: 3, color: "#ff4400" },
    ];
  }
  if (e.kind === "particle") {
    return [
      {
        x: e.x - e.w / 2,
        y: e.y - e.h / 2,
        w: e.w,
        h: e.h,
        color: "#66eeff",
      },
      {
        x: e.x - e.w / 4,
        y: e.y - e.h / 2,
        w: e.w / 2,
        h: e.h,
        color: "#ffffff",
      },
    ];
  }
  if (e.kind === "beam") {
    return [
      {
        x: e.x - e.w / 2,
        y: e.y - e.h / 2,
        w: e.w,
        h: e.h,
        color: "#88ffff",
      },
      {
        x: e.x - 1,
        y: e.y - e.h / 2,
        w: 2,
        h: e.h,
        color: "#ffffff",
      },
    ];
  }
  if (e.kind === "flame") {
    const t = (e.life ?? 0) > 8 ? "#ffee44" : "#ff6622";
    return [
      {
        x: e.x - e.w / 2,
        y: e.y - e.h / 2,
        w: e.w,
        h: e.h,
        color: t,
      },
      {
        x: e.x - e.w / 4,
        y: e.y - e.h / 4,
        w: e.w / 2,
        h: e.h / 2,
        color: "#ffffff",
      },
    ];
  }
  return [
    {
      x: e.x - e.w / 2,
      y: e.y - e.h / 2,
      w: e.w,
      h: e.h,
      color: powerLevel >= 2 ? "#ffaa44" : "#ffff44",
    },
  ];
}

/** Relative rects for grunt types 0..3 (origin at enemy center). */
export function gruntLocalRects(type: number): RectSpec[] {
  if (type === 0) {
    return [
      { x: -6, y: -5, w: 12, h: 10, color: "#ff4466" },
      { x: -3, y: 3, w: 6, h: 4, color: "#ffaa00" },
    ];
  }
  if (type === 1) {
    return [
      { x: -8, y: -6, w: 16, h: 12, color: "#44aaff" },
      { x: -4, y: -2, w: 8, h: 6, color: "#aaddff" },
    ];
  }
  if (type === 2) {
    return [
      { x: -6, y: -6, w: 12, h: 12, color: "#ff3333" },
      { x: -9, y: -2, w: 18, h: 4, color: "#ff8888" },
      { x: -2, y: -2, w: 4, h: 4, color: "#ffff00" },
    ];
  }
  // type 3 dual
  return [
    { x: -14, y: -8, w: 10, h: 16, color: "#aa44ff" },
    { x: 4, y: -8, w: 10, h: 16, color: "#aa44ff" },
    { x: -10, y: -4, w: 20, h: 12, color: "#44ffcc" },
    { x: -6, y: -10, w: 12, h: 6, color: "#ff88ff" },
  ];
}

export function screenShakeOffset(
  shake: number,
  rand: () => number = Math.random,
): { x: number; y: number } {
  if (!shake) return { x: 0, y: 0 };
  return {
    x: (rand() - 0.5) * shake,
    y: (rand() - 0.5) * shake,
  };
}

export function starColor(size: number): string {
  return size > 1 ? "#aaffaa" : "#446644";
}
