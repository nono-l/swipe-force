/** Client helpers for partner title-banner images */

export type PartnerBanner = {
  id?: string;
  url: string;
  href?: string;
  width: number;
  height: number;
  bytes?: number;
  contentType?: string;
  updatedAt?: string;
  active?: boolean;
};

export type PartnerBannerStatus = {
  ok: boolean;
  weekLimit: number;
  weekUsed: number;
  weekRemaining: number;
  maxBytes: number;
  minRatio: number;
  maxRatio: number;
  maxOwned: number;
  banners: PartnerBanner[];
  banner: PartnerBanner | null;
  reason?: string;
};

function emptyStatus(reason: string): PartnerBannerStatus {
  return {
    ok: false,
    weekLimit: 8,
    weekUsed: 0,
    weekRemaining: 8,
    maxBytes: 200 * 1024,
    minRatio: 1.5,
    maxRatio: 5,
    maxOwned: 200,
    banners: [],
    banner: null,
    reason,
  };
}

export async function fetchPartnerBannerStatus(
  playerId: string,
): Promise<PartnerBannerStatus> {
  try {
    const res = await fetch(
      `/api/share/partner-banner?playerId=${encodeURIComponent(playerId)}`,
      { credentials: "same-origin" },
    );
    const data = (await res.json().catch(() => ({}))) as PartnerBannerStatus & {
      banners?: PartnerBanner[];
    };
    if (!data.ok) return emptyStatus(data.reason || "fail");
    const banners = Array.isArray(data.banners)
      ? data.banners
      : data.banner
        ? [data.banner]
        : [];
    return {
      ok: true,
      weekLimit: Number(data.weekLimit) || 8,
      weekUsed: Number(data.weekUsed) || 0,
      weekRemaining: Number(data.weekRemaining) || 0,
      maxBytes: Number(data.maxBytes) || 200 * 1024,
      minRatio: Number(data.minRatio) || 1.5,
      maxRatio: Number(data.maxRatio) || 5,
      maxOwned: Number(data.maxOwned) || 200,
      banners,
      banner: banners[0] || null,
    };
  } catch {
    return emptyStatus("network");
  }
}

export async function fetchBannerPool(): Promise<
  { id?: string; url: string; href?: string; ownerPlayerId?: string }[]
> {
  try {
    const res = await fetch("/api/share/partner-banner?pool=1", {
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      banners?: {
        id?: string;
        url: string;
        href?: string;
        ownerPlayerId?: string;
      }[];
    };
    if (!data.ok || !Array.isArray(data.banners)) return [];
    return data.banners.filter((b) => b?.url);
  } catch {
    return [];
  }
}

function rowIsBlack(
  data: Uint8ClampedArray,
  w: number,
  y: number,
  thr = 28,
): boolean {
  const off = y * w * 4;
  let dark = 0;
  const step = Math.max(1, Math.floor(w / 64));
  let n = 0;
  for (let x = 0; x < w; x += step) {
    const i = off + x * 4;
    const r = data[i]!,
      g = data[i + 1]!,
      b = data[i + 2]!;
    if (r < thr && g < thr && b < thr) dark++;
    n++;
  }
  return n > 0 && dark / n >= 0.9;
}

export function measureBlackBars(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): { topBlack: number; bottomBlack: number; contentHeight: number } {
  let top = 0;
  for (let y = 0; y < h; y++) {
    if (rowIsBlack(data, w, y)) top++;
    else break;
  }
  let bot = 0;
  for (let y = h - 1; y >= 0; y--) {
    if (rowIsBlack(data, w, y)) bot++;
    else break;
  }
  if (top + bot >= h - 2) {
    return { topBlack: 0, bottomBlack: 0, contentHeight: h };
  }
  return {
    topBlack: top,
    bottomBlack: bot,
    contentHeight: Math.max(1, h - top - bot),
  };
}

export function getScreenBottomBlackPx(): number {
  try {
    const v = (window as unknown as { __sfBannerMaxH?: number }).__sfBannerMaxH;
    if (v && v > 0) return v;
  } catch {
    /* */
  }
  try {
    const host = document.querySelector(".flex.h-dvh") as HTMLElement | null;
    const canvas = document.querySelector("canvas");
    if (host && canvas) {
      const hr = host.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const band = Math.round(hr.bottom - cr.bottom);
      const topBand = Math.round(cr.top - hr.top);
      return Math.max(44, Math.min(85, Math.max(band, topBand, 0) || 85));
    }
  } catch {
    /* */
  }
  return 85;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("read_fail"));
    r.readAsDataURL(file);
  });
}

export async function prepareBannerUpload(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  bottomBlack: number;
  topBlack: number;
  maxHeightAllowed: number;
  screenBlackPx: number;
}> {
  const dataUrl = await fileToDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("img"));
    im.src = dataUrl;
  });
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const bars = measureBlackBars(imageData.data, w, h);

  const screenBlackPx = getScreenBottomBlackPx();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const PRACTICAL_H = 85;
  let maxHeightAllowed: number;
  if (bars.bottomBlack >= 24 && bars.bottomBlack <= 120) {
    maxHeightAllowed = bars.bottomBlack;
  } else if (bars.topBlack >= 24 && bars.topBlack <= 120) {
    maxHeightAllowed = bars.topBlack;
  } else {
    maxHeightAllowed = Math.round(
      Math.min(PRACTICAL_H, screenBlackPx || PRACTICAL_H) * Math.min(dpr, 1.5),
    );
  }
  maxHeightAllowed = Math.max(48, Math.min(120, maxHeightAllowed));

  let outW = w;
  let outH = h;
  let outUrl = dataUrl;
  if (h > maxHeightAllowed) {
    const scale = maxHeightAllowed / h;
    outW = Math.max(1, Math.round(w * scale));
    outH = maxHeightAllowed;
    const c2 = document.createElement("canvas");
    c2.width = outW;
    c2.height = outH;
    const g = c2.getContext("2d");
    if (g) {
      g.drawImage(img, 0, 0, outW, outH);
      outUrl = c2.toDataURL("image/jpeg", 0.88);
    }
  }

  return {
    dataUrl: outUrl,
    width: outW,
    height: outH,
    bottomBlack: bars.bottomBlack,
    topBlack: bars.topBlack,
    maxHeightAllowed,
    screenBlackPx,
  };
}

export async function uploadPartnerBanner(
  playerId: string,
  dataUrl: string,
): Promise<{
  ok: boolean;
  reason?: string;
  via?: string;
  weekRemaining?: number;
  weekUsed?: number;
  banner?: PartnerBanner;
}> {
  try {
    const res = await fetch("/api/share/partner-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "upload", dataUrl }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      via?: string;
      weekRemaining?: number;
      weekUsed?: number;
      banner?: PartnerBanner;
    };
    if (!data.ok) {
      return {
        ok: false,
        reason: data.reason || "fail",
        weekRemaining: data.weekRemaining,
        weekUsed: data.weekUsed,
      };
    }
    return {
      ok: true,
      via: data.via,
      weekRemaining: data.weekRemaining,
      weekUsed: data.weekUsed,
      banner: data.banner,
    };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function clearPartnerBanner(
  playerId: string,
  id?: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch("/api/share/partner-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "clear", id: id || "" }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
    };
    return data.ok ? { ok: true } : { ok: false, reason: data.reason || "fail" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function billPartnerBanner(
  playerId: string,
  id: string,
  kind: "impress" | "click",
): Promise<{ ok: boolean; chargedSec?: number; skipped?: boolean }> {
  try {
    const res = await fetch("/api/share/partner-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, id, action: kind }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      chargedSec?: number;
      skipped?: boolean;
    };
    if (!data.ok) return { ok: false };
    return {
      ok: true,
      chargedSec: Number(data.chargedSec) || 0,
      skipped: !!data.skipped,
    };
  } catch {
    return { ok: false };
  }
}

export async function setPartnerBannerActive(
  playerId: string,
  id: string,
  active: boolean,
): Promise<{
  ok: boolean;
  reason?: string;
  active?: boolean;
  banner?: PartnerBanner;
}> {
  try {
    const res = await fetch("/api/share/partner-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "active", id, active }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      active?: boolean;
      banner?: PartnerBanner;
    };
    if (!data.ok) return { ok: false, reason: data.reason || "fail" };
    return { ok: true, active: data.active !== false, banner: data.banner };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function savePartnerBannerHref(
  playerId: string,
  href: string,
  id?: string,
): Promise<{
  ok: boolean;
  reason?: string;
  href?: string;
  banner?: PartnerBanner;
}> {
  try {
    const res = await fetch("/api/share/partner-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "href", href, id: id || "" }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      href?: string;
      banner?: PartnerBanner;
    };
    if (!data.ok) return { ok: false, reason: data.reason || "fail" };
    return { ok: true, href: data.href || "", banner: data.banner };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export type BannerHistoryRow = {
  id: string;
  bannerId: string;
  ownerPlayerId: string;
  viewerPlayerId: string;
  displayName: string;
  kind: "impress" | "click";
  chargedSec: number;
  createdAt: string;
  href: string;
  url: string;
  width: number;
  height: number;
};

export async function fetchBannerHistory(
  playerId: string,
  opts?: { bannerId?: string; all?: boolean },
): Promise<{
  ok: boolean;
  impress: BannerHistoryRow[];
  clicks: BannerHistoryRow[];
  summary: { impress: number; clicks: number; viewers: number };
  reason?: string;
}> {
  const empty = {
    ok: false as const,
    impress: [] as BannerHistoryRow[],
    clicks: [] as BannerHistoryRow[],
    summary: { impress: 0, clicks: 0, viewers: 0 },
  };
  try {
    const res = await fetch("/api/share/partner-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        playerId,
        action: "ledger",
        id: opts?.bannerId || "",
        all: opts?.all ? 1 : 0,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      impress?: BannerHistoryRow[];
      clicks?: BannerHistoryRow[];
      summary?: { impress?: number; clicks?: number; viewers?: number };
      reason?: string;
      error?: string;
    };
    if (!data.ok) {
      return {
        ...empty,
        reason: data.reason || (res.ok ? "fail" : `http${res.status}`),
      };
    }
    return {
      ok: true,
      impress: Array.isArray(data.impress) ? data.impress : [],
      clicks: Array.isArray(data.clicks) ? data.clicks : [],
      summary: {
        impress: Number(data.summary?.impress) || 0,
        clicks: Number(data.summary?.clicks) || 0,
        viewers: Number(data.summary?.viewers) || 0,
      },
    };
  } catch {
    return { ...empty, reason: "network" };
  }
}
