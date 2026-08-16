/**
 * Title-screen random media banner (bottom-left).
 * Uses catalog videos; thumbnail from YouTube (no heavy embed on title).
 */

import type { AdVideo } from "./media-watch";
import { pickAdVideoBiased, getAdWatchVideos } from "./media-watch";
import { translate } from "@/lib/i18n";

/** Banner rect in play-field coords (bottom-left of center field) */
export const TITLE_BANNER = {
  x: 56,
  y: 350,
  w: 118,
  h: 32,
} as const;

const ROTATE_MS = 12_000;
const THUMB_CACHE = new Map<string, HTMLImageElement | "fail">();

export type TitleBannerState = {
  video: AdVideo | null;
  /** last pick time */
  pickedAt: number;
  /** pulse / fade 0..1 */
  flash: number;
};

export function createTitleBannerState(): TitleBannerState {
  return { video: null, pickedAt: 0, flash: 0 };
}

export function titleBannerHit(x: number, y: number): boolean {
  const b = TITLE_BANNER;
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function thumbUrl(id: string): string {
  // mqdefault = 320x180, light enough for canvas
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

export function preloadBannerThumb(videoId: string): void {
  const id = String(videoId || "").slice(0, 20);
  if (!id || THUMB_CACHE.has(id)) return;
  const img = new Image();
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.onload = () => {
    THUMB_CACHE.set(id, img);
  };
  img.onerror = () => {
    THUMB_CACHE.set(id, "fail");
  };
  img.src = thumbUrl(id);
}

export function getBannerThumb(
  videoId: string,
): HTMLImageElement | null {
  const v = THUMB_CACHE.get(videoId);
  if (!v || v === "fail") return null;
  return v;
}

/** Pick / rotate random catalog video for title banner */
export function tickTitleBanner(
  st: TitleBannerState,
  now = Date.now(),
): TitleBannerState {
  const pool = getAdWatchVideos();
  if (!pool.length) {
    return { ...st, video: null };
  }
  const needNew =
    !st.video ||
    !pool.some((v) => v.id === st.video!.id) ||
    now - st.pickedAt >= ROTATE_MS;
  if (!needNew) {
    // soft flash decay
    return { ...st, flash: Math.max(0, st.flash - 0.04) };
  }
  // avoid same id when possible
  let pick = pickAdVideoBiased(now + Math.random() * 9999);
  if (st.video && pick && pick.id === st.video.id && pool.length > 1) {
    pick = pickAdVideoBiased(now + 42_001) || pick;
  }
  if (pick) preloadBannerThumb(pick.id);
  return {
    video: pick,
    pickedAt: now,
    flash: 1,
  };
}

export type BannerDrawOp =
  | { type: "fill"; x: number; y: number; w: number; h: number; c: string }
  | { type: "stroke"; x: number; y: number; w: number; h: number; c: string }
  | {
      type: "image";
      img: HTMLImageElement;
      x: number;
      y: number;
      w: number;
      h: number;
      alpha: number;
    }
  | {
      type: "text";
      text: string;
      x: number;
      y: number;
      c: string;
      size: number;
      align?: CanvasTextAlign;
    };

/** Pure draw ops for the banner slot */
export function titleBannerDrawOps(
  st: TitleBannerState,
  frame: number,
): BannerDrawOp[] {
  const b = TITLE_BANNER;
  const ops: BannerDrawOp[] = [];
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.08);
  const border =
    st.flash > 0
      ? `rgba(160,255,120,${0.5 + st.flash * 0.5})`
      : `rgba(80,160,100,${0.55 + pulse * 0.25})`;

  ops.push({ type: "fill", x: b.x, y: b.y, w: b.w, h: b.h, c: "#041008" });
  ops.push({
    type: "stroke",
    x: b.x + 0.5,
    y: b.y + 0.5,
    w: b.w - 1,
    h: b.h - 1,
    c: border,
  });

  if (!st.video) {
    ops.push({
      type: "fill",
      x: b.x + 2,
      y: b.y + 2,
      w: b.w - 4,
      h: b.h - 4,
      c: "#0a2010",
    });
    ops.push({
      type: "text",
      text: "📺 BANNER",
      x: b.x + b.w / 2,
      y: b.y + 7,
      c: "#66aa77",
      size: 7,
      align: "center",
    });
    ops.push({
      type: "text",
      text: translate("bannerWanted"),
      x: b.x + b.w / 2,
      y: b.y + 18,
      c: "#88cc99",
      size: 7,
      align: "center",
    });
    return ops;
  }

  const thumb = getBannerThumb(st.video.id);
  const thumbW = 48;
  const thumbH = b.h - 4;
  const tx = b.x + 2;
  const ty = b.y + 2;
  if (thumb) {
    ops.push({
      type: "image",
      img: thumb,
      x: tx,
      y: ty,
      w: thumbW,
      h: thumbH,
      alpha: 0.95,
    });
  } else {
    ops.push({
      type: "fill",
      x: tx,
      y: ty,
      w: thumbW,
      h: thumbH,
      c: "#0a1810",
    });
    ops.push({
      type: "text",
      text: "▶",
      x: tx + thumbW / 2,
      y: ty + 10,
      c: "#4a8",
      size: 10,
      align: "center",
    });
    preloadBannerThumb(st.video.id);
  }

  const label = (st.video.label || st.video.id).slice(0, 10);
  const textX = b.x + thumbW + 6;
  ops.push({
    type: "text",
    text: "SPONSORED",
    x: textX,
    y: b.y + 5,
    c: "#668866",
    size: 5,
    align: "left",
  });
  ops.push({
    type: "text",
    text: label,
    x: textX,
    y: b.y + 14,
    c: "#aadcbb",
    size: 6,
    align: "left",
  });
  ops.push({
    type: "text",
    text: "タップで視聴",
    x: textX,
    y: b.y + 23,
    c: frame % 40 < 28 ? "#88cc66" : "#557744",
    size: 5,
    align: "left",
  });
  return ops;
}
