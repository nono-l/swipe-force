/**
 * canSendFanmailTo-field overlay draw specs: stage banners (recovered qi).
 */

export type OverlayText = {
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  align?: CanvasTextAlign;
};

export type OverlayRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
};

export type FieldOverlay = {
  rects: OverlayRect[];
  texts: OverlayText[];
};

export function stageBannerOverlay(
  ban:
    | { kind: "ready"; stage: number }
    | { kind: "bossintro"; name: string; blink: boolean }
    | { kind: "stageclear"; autoShop?: boolean }
    | null
    | undefined,
  fieldW: number,
  fieldH: number,
): FieldOverlay | null {
  if (!ban) return null;
  const cx = fieldW / 2;
  if (ban.kind === "ready") {
    const biomes = [
      "GRASSLAND",
      "DESERT",
      "COAST",
      "GRID CITY",
      "TUNDRA",
      "MAGMA",
      "NEON CORE",
      "VOID EDGE",
    ] as const;
    const bi = (((Math.max(1, ban.stage | 0) - 1) % 64) >> 3) as number;
    return {
      rects: [],
      texts: [
        {
          text: `STAGE ${ban.stage}`,
          x: cx,
          y: fieldH / 2 - 18,
          color: "#00ffaa",
          size: 16,
          align: "center",
        },
        {
          text: biomes[bi] ?? "FIELD",
          x: cx,
          y: fieldH / 2 + 2,
          color: "#88ccaa",
          size: 8,
          align: "center",
        },
        {
          text: "GET READY",
          x: cx,
          y: 220,
          color: "#ffffff",
          size: 10,
          align: "center",
        },
      ],
    };
  }
  if (ban.kind === "bossintro") {
    return {
      rects: [
        {
          x: 58,
          y: fieldH / 2 - 40,
          w: 204,
          h: 70,
          fill: "#220011",
          stroke: ban.blink ? "#ff2244" : "#880000",
        },
      ],
      texts: [
        {
          text: "WARNING!",
          x: cx,
          y: fieldH / 2 - 28,
          color: "#ff2244",
          size: 16,
          align: "center",
        },
        {
          text: "BOSS APPROACHING",
          x: cx,
          y: fieldH / 2 - 6,
          color: "#ffaa00",
          size: 10,
          align: "center",
        },
        {
          text: ban.name,
          x: cx,
          y: 214,
          color: "#ff66ff",
          size: 12,
          align: "center",
        },
      ],
    };
  }
  // stageclear
  return {
    rects: [],
    texts: [
      {
        text: "STAGE CLEAR",
        x: cx,
        y: fieldH / 2 - 8,
        color: "#ffff00",
        size: 14,
        align: "center",
      },
      {
        text: "BOSS DEFEATED",
        x: cx,
        y: 212,
        color: "#ff66ff",
        size: 10,
        align: "center",
      },
      {
        text: ban.autoShop === false ? "→ NEXT STAGE" : "→ POWER SHOP",
        x: cx,
        y: 228,
        color: "#ffff66",
        size: 9,
        align: "center",
      },
    ],
  };
}

export function scanlineFill(): string {
  return "rgba(0,0,0,0.12)";
}
