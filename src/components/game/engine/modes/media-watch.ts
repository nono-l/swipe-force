/**
 * JPDOC: 視聴のはしご計算。数字は変えてよいが形は核。
 */
/**
 * "Ad watch" continue-coin mission — YouTube embed.
 *
 * Videos come from admin config (server).
 * Rewards:
 * - 1st: min(video length, 60s)
 * - First hour ladder: 5/10/20/40m
 * - After 1h: every 15m +1
 * - Real-time cap: 4 coins / rolling hour
 */

import { translate } from "@/lib/i18n";

export const AD_WATCH_MAX_SEC = 60;
export const AD_WATCH_FLOOR_SEC = 10;
export const AD_WATCH_LONG_START_SEC = 5 * 60;
export const AD_WATCH_HOUR_SEC = 60 * 60;
export const AD_WATCH_QUARTER_SEC = 15 * 60;
export const AD_WATCH_QUARTER_REWARD = 1;
export const AD_WATCH_HOUR_REWARD = AD_WATCH_QUARTER_REWARD;
export const AD_WATCH_HOURLY_MAX = 4;
export const AD_WATCH_MIN_SEC = AD_WATCH_MAX_SEC;
export const AD_WATCH_DAILY_MAX = AD_WATCH_HOURLY_MAX;
export const AD_WATCH_REWARD = 1;

export type AdVideo = {
  id: string;
  label: string;
  durationSec: number;
  /** cumulative display/play seconds (lower = higher priority chance) */
  totalWatchSec?: number;
  /** ISO created_at or epoch ms — newer = higher priority chance */
  createdAt?: string;
  createdAtMs?: number;
  /** Advertiser-owned (credit-consuming) ads get much higher show priority */
  paid?: boolean;
  ownerPlayerId?: string;
  /** true = 一人1回（はしごのみ）。false = 同じ動画から何度でも */
  claimOnce?: boolean;
  /** CLEAR画面にチャンネルリンクを出す（デフォルトOFF） */
  showChannel?: boolean;
  channelUrl?: string;
  channelName?: string;
};

export type WatchMilestone = {
  at: number;
  reward: number;
  label: string;
};

let runtimeVideos: AdVideo[] = [];

export function getAdWatchVideos(): readonly AdVideo[] {
  return runtimeVideos;
}

export function setAdWatchVideos(list: readonly AdVideo[]): void {
  runtimeVideos = list
    .map((v) => sanitizeVideo(v))
    .filter((v): v is AdVideo => !!v);
}

function sanitizeVideo(v: Partial<AdVideo> | null | undefined): AdVideo | null {
  const id = parseYouTubeVideoId(String(v?.id || ""));
  if (id.length < 6) return null;
  const durationSec = Math.max(
    AD_WATCH_FLOOR_SEC,
    Math.min(24 * 3600, Math.floor(Number(v?.durationSec) || 60)),
  );
  const label = String(v?.label || id).slice(0, 40);
  const totalWatchSec = Math.max(0, Math.floor(Number(v?.totalWatchSec) || 0));
  let createdAtMs = Math.floor(Number(v?.createdAtMs) || 0);
  if (!createdAtMs && v?.createdAt) {
    const p = Date.parse(String(v.createdAt));
    if (Number.isFinite(p)) createdAtMs = p;
  }
  const ownerPlayerId = String(v?.ownerPlayerId || "").slice(0, 32);
  const extra = v as {
    paid?: unknown;
    claimOnce?: unknown;
    showChannel?: unknown;
    channelUrl?: unknown;
    channelName?: unknown;
  };
  const paid =
    extra.paid === true ||
    extra.paid === 1 ||
    extra.paid === "1" ||
    (!!ownerPlayerId && ownerPlayerId.length >= 4);
  const showChannel =
    extra.showChannel === true ||
    extra.showChannel === 1 ||
    extra.showChannel === "1";
  const channelUrl = String(extra.channelUrl || "").trim().slice(0, 240);
  const channelName = String(extra.channelName || "").trim().slice(0, 80);
  return {
    id,
    label,
    durationSec,
    totalWatchSec,
    createdAt: v?.createdAt ? String(v.createdAt) : undefined,
    createdAtMs: createdAtMs || undefined,
    paid,
    ownerPlayerId: ownerPlayerId || undefined,
    claimOnce: extra.claimOnce === true || extra.claimOnce === 1 || extra.claimOnce === "1",
    showChannel: showChannel && !!channelUrl,
    channelUrl: showChannel ? channelUrl || undefined : undefined,
    channelName: showChannel ? channelName || undefined : undefined,
  };
}

export function parseYouTubeVideoId(input: string | null | undefined): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(raw)) return raw.slice(0, 20);

  let s = raw.replace(/^[<\['"]+|[>\]'"]+$/g, "").trim();
  try {
    if (!/^https?:\/\//i.test(s) && /youtube|youtu\.be/i.test(s)) {
      s = "https://" + s.replace(/^\/\//, "");
    }
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      return sanitizeYtId(u.pathname.split("/").filter(Boolean)[0] || "");
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube.com")
    ) {
      const v = u.searchParams.get("v");
      if (v) return sanitizeYtId(v);
      const parts = u.pathname.split("/").filter(Boolean);
      const markers = new Set(["embed", "live", "shorts", "v", "e"]);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]!.toLowerCase();
        if (markers.has(p) && parts[i + 1]) return sanitizeYtId(parts[i + 1]!);
      }
      if (parts.length === 1) return sanitizeYtId(parts[0]!);
    }
  } catch {
    /* */
  }
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{6,20})/,
    /youtu\.be\/([a-zA-Z0-9_-]{6,20})/,
    /\/embed\/([a-zA-Z0-9_-]{6,20})/,
    /\/live\/([a-zA-Z0-9_-]{6,20})/,
    /\/shorts\/([a-zA-Z0-9_-]{6,20})/,
    /\/v\/([a-zA-Z0-9_-]{6,20})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[1]) return sanitizeYtId(m[1]);
  }
  const tok = raw.match(/[a-zA-Z0-9_-]{11}/);
  return tok ? sanitizeYtId(tok[0]) : "";
}

function sanitizeYtId(id: string): string {
  return String(id || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 20);
}

export function parseAdVideoConfigText(raw: string): AdVideo[] {
  const out: AdVideo[] = [];
  const seen = new Set<string>();
  for (const line of String(raw || "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("//")) continue;
    const parts = t.split(/\s+/);
    const id = parseYouTubeVideoId(parts[0] || "");
    if (id.length < 6 || seen.has(id)) continue;
    seen.add(id);
    let durationSec = 180;
    let label = id;
    if (parts[1] && /^\d+$/.test(parts[1])) {
      durationSec = Math.max(10, Math.min(24 * 3600, Number(parts[1])));
      if (parts.length > 2) label = parts.slice(2).join(" ").slice(0, 40);
    } else if (parts.length > 1) {
      label = parts.slice(1).join(" ").slice(0, 40);
    }
    const v = sanitizeVideo({ id, label, durationSec });
    if (v) out.push(v);
  }
  return out;
}

export function formatAdVideoConfigText(list: readonly AdVideo[]): string {
  return list
    .map((v) => `${v.id}  ${v.durationSec}  ${v.label}`)
    .join("\n");
}

export const AD_WATCH_VIDEOS: readonly AdVideo[] = [];

export function requiredWatchSec(
  video: Pick<AdVideo, "durationSec"> | number | null | undefined,
): number {
  const dur =
    typeof video === "number"
      ? video
      : Math.floor(Number(video?.durationSec) || AD_WATCH_MAX_SEC);
  return Math.min(AD_WATCH_MAX_SEC, Math.max(AD_WATCH_FLOOR_SEC, dur));
}

export function watchMilestoneDefs(durationSec: number): WatchMilestone[] {
  const dur = Math.max(0, Math.floor(durationSec) || 0);
  const out: WatchMilestone[] = [];
  if (dur <= 0) return out;

  const firstAt = requiredWatchSec(dur);
  out.push({ at: firstAt, reward: 1, label: `1枚@${formatSec(firstAt)}` });

  if (dur >= AD_WATCH_LONG_START_SEC) {
    let t = AD_WATCH_LONG_START_SEC;
    let n = 2;
    for (let i = 0; i < 8 && t < AD_WATCH_HOUR_SEC && t <= dur; i++) {
      if (t > firstAt) {
        out.push({ at: t, reward: 1, label: `${n}枚@${formatSec(t)}` });
        n += 1;
      }
      t *= 2;
    }
  }

  if (dur >= AD_WATCH_HOUR_SEC) {
    for (
      let at = AD_WATCH_HOUR_SEC, k = 0;
      at <= dur && k < 48;
      at += AD_WATCH_QUARTER_SEC, k++
    ) {
      if (!out.some((m) => m.at === at)) {
        out.push({
          at,
          reward: AD_WATCH_QUARTER_REWARD,
          label: `+${AD_WATCH_QUARTER_REWARD}枚@${formatSec(at)}`,
        });
      }
    }
  }

  return out;
}

/** Total coins if watched to the end (ignores hourly cap). */
export function maxCoinsForVideo(durationSec: number): number {
  return watchMilestoneDefs(durationSec).reduce((s, m) => s + m.reward, 0);
}

/** Next +1 after this hour's ladder is done (same video, repeat). */
export function nextRepeatAt(
  durationSec: number,
  claimedAts: ReadonlySet<number>,
): number {
  const defs = watchMilestoneDefs(durationSec);
  const first = defs[0]?.at || AD_WATCH_MAX_SEC;
  let last = defs[defs.length - 1]?.at || first;
  for (const at of claimedAts) {
    if (at > last) last = at;
  }
  return last + first;
}

export function nextPayableDef(
  durationSec: number,
  claimedAts: ReadonlySet<number>,
  opts?: { once?: boolean },
): WatchMilestone | null {
  const defs = watchMilestoneDefs(durationSec);
  for (const m of defs) {
    if (!claimedAts.has(m.at)) return m;
  }
  if (opts?.once) return null;
  const at = nextRepeatAt(durationSec, claimedAts);
  return { at, reward: 1, label: `+1@${formatSec(at)}` };
}

export function unclaimedCoinsForVideo(
  durationSec: number,
  claimedAts: ReadonlySet<number>,
): number {
  return watchMilestoneDefs(durationSec)
    .filter((m) => !claimedAts.has(m.at))
    .reduce((s, m) => s + m.reward, 0);
}

/**
 * Player-facing copy:
 * 「この動画を最後まで見ると コンティニューコイン〇枚」
 */
export function fullWatchRewardLabel(durationSec: number): string {
  const n = maxCoinsForVideo(durationSec);
  if (n <= 0) return "この動画ではコインは貰えません";
  return translate("watch.fullWatch", { n });
}

export function watchMilestones(durationSec: number): number[] {
  return watchMilestoneDefs(durationSec).map((m) => m.at);
}

export function coinsUnlockedAt(
  durationSec: number,
  watchSec: number,
): number {
  const w = Math.floor(watchSec) || 0;
  return watchMilestoneDefs(durationSec)
    .filter((m) => w >= m.at)
    .reduce((s, m) => s + m.reward, 0);
}

export function nextMilestone(
  durationSec: number,
  watchSec: number,
): number | null {
  const w = Math.floor(watchSec) || 0;
  for (const m of watchMilestoneDefs(durationSec)) {
    if (m.at > w) return m.at;
  }
  return null;
}

export function nextMilestoneDef(
  durationSec: number,
  watchSec: number,
): WatchMilestone | null {
  const w = Math.floor(watchSec) || 0;
  for (const m of watchMilestoneDefs(durationSec)) {
    if (m.at > w) return m;
  }
  return null;
}

export function videoById(id: string): AdVideo | null {
  const clean = parseYouTubeVideoId(id);
  return runtimeVideos.find((v) => v.id === clean) || null;
}

const LOCAL_HOUR_KEY = "swipe_force_ad_watch_hour_v2";
const LOCAL_VIDEOS_KEY = "swipe_force_ad_videos_cache_v1";
const JST_OFFSET_MS = 9 * 3600 * 1000;

/** e.g. "2026-08-10T15" for 15:00–15:59 JST */
export function jstClockHourKey(now = Date.now()): string {
  const jst = new Date(now + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const h = String(jst.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}`;
}

export function msUntilNextJstClockHour(now = Date.now()): number {
  const jst = new Date(now + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();
  const h = jst.getUTCHours();
  const nextUtc = Date.UTC(y, m, d, h + 1, 0, 0, 0) - JST_OFFSET_MS;
  return Math.max(0, nextUtc - now);
}

export function loadLocalAdWatchTimestamps(now = Date.now()): number[] {
  try {
    const raw = localStorage.getItem(LOCAL_HOUR_KEY);
    if (!raw) return [];
    const t = JSON.parse(raw) as { hourKey?: string; times?: number[] };
    if (t.hourKey !== jstClockHourKey(now)) return [];
    const arr = Array.isArray(t.times) ? t.times : [];
    return arr.map((n) => Number(n) || 0).slice(-40);
  } catch {
    return [];
  }
}

export function loadLocalAdWatchCount(now = Date.now()): number {
  return loadLocalAdWatchTimestamps(now).length;
}

export function bumpLocalAdWatchCount(
  coins = 1,
  now = Date.now(),
): number {
  const add = Math.max(1, Math.min(20, coins | 0));
  const hourKey = jstClockHourKey(now);
  const times = [...loadLocalAdWatchTimestamps(now)];
  for (let i = 0; i < add; i++) times.push(now + i);
  try {
    localStorage.setItem(
      LOCAL_HOUR_KEY,
      JSON.stringify({ hourKey, times }),
    );
  } catch {
    /* */
  }
  return times.length;
}

export function cacheAdVideosLocal(list: readonly AdVideo[]): void {
  try {
    localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(list));
  } catch {
    /* */
  }
  setAdWatchVideos(list);
}

export function loadCachedAdVideos(): AdVideo[] {
  try {
    const raw = localStorage.getItem(LOCAL_VIDEOS_KEY);
    if (!raw) return [];
    const t = JSON.parse(raw);
    const arr = Array.isArray(t) ? t : [];
    return arr
      .map((v: Partial<AdVideo>) => sanitizeVideo(v))
      .filter((v: AdVideo | null): v is AdVideo => !!v);
  } catch {
    return [];
  }
}

export function pickAdVideo(seed = Date.now()): AdVideo | null {
  return pickAdVideoBiased(seed);
}

/**
 * Priority:
 * 1) Paid advertiser ads (credit-consuming) dominate platform/admin free ads (~96%).
 * 2) Within pool: random axis either newer OR lower totalWatchSec, then weighted.
 */
export function pickAdVideoBiased(seed = Date.now()): AdVideo | null {
  const list = [...(runtimeVideos.length ? runtimeVideos : loadCachedAdVideos())];
  if (!list.length) return null;
  if (list.length === 1) return list[0]!;

  const isPaid = (v: AdVideo) =>
    !!(v.paid || (v.ownerPlayerId && v.ownerPlayerId.length >= 4));
  const paid = list.filter(isPaid);
  const free = list.filter((v) => !isPaid(v));

  // Credit-consuming ads first; platform only as rare filler.
  let pool = list;
  if (paid.length && free.length) {
    pool = Math.random() < 0.96 ? paid : free;
  } else if (paid.length) {
    pool = paid;
  } else {
    pool = free.length ? free : list;
  }

  const mode: "new" | "short" = Math.random() < 0.5 ? "new" : "short";

  const ranked = pool
    .map((v) => {
      const watch = Math.max(0, Number(v.totalWatchSec) || 0);
      const created =
        Number(v.createdAtMs) ||
        (v.createdAt ? Date.parse(v.createdAt) : 0) ||
        0;
      return { v, watch, created };
    })
    .sort((a, b) => {
      if (mode === "new") {
        if (a.created !== b.created) return b.created - a.created;
        return a.watch - b.watch;
      }
      if (a.watch !== b.watch) return a.watch - b.watch;
      return b.created - a.created;
    });

  const n = ranked.length;
  const weights = ranked.map((_, rank) => {
    const w = n - rank;
    return w * w;
  });
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let r = Math.random() * total;
  let acc = 0;
  for (let i = 0; i < ranked.length; i++) {
    acc += weights[i]!;
    if (r <= acc) return ranked[i]!.v;
  }
  return ranked[0]!.v;
}

/** Desktop (mouse + hover) can autoplay with sound after a click. Mobile needs mute. */
export function preferUnmutedAdAutoplay(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return false;
  if (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) {
    return false;
  }
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const fineHover = window.matchMedia?.(
    "(hover: hover) and (pointer: fine)",
  )?.matches;
  if (coarse && !fineHover) return false;
  return true;
}

export function youtubeEmbedUrl(
  videoId: string,
  opts?: { mute?: boolean; autoplay?: boolean },
): string {
  const id = parseYouTubeVideoId(videoId);
  const muted = !!opts?.mute;
  // Muted start: autoplay is reliable. Unmuted: only request autoplay where
  // the browser will allow sound (desktop / saved unmuted default).
  const autoplay =
    opts?.autoplay != null ? !!opts.autoplay : muted || preferUnmutedAdAutoplay();
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    controls: "0",
    disablekb: "1",
    fs: "0",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    playsinline: "1",
    cc_load_policy: "0",
    enablejsapi: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "",
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function adWatchRemaining(
  used: number,
  max = AD_WATCH_HOURLY_MAX,
): number {
  return Math.max(0, max - Math.max(0, used | 0));
}

export function formatSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}分${r}秒` : `${m}分`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}時間${rm}分` : `${h}時間`;
}
