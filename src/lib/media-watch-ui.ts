/**
 * GrokBuild-Promotion snapshot
 * layer: KERNEL
 * origin: src/lib/media-watch-ui.ts
 * note: Watch dialog, mute persist, grant history hover.
 * This is a reference extract. Imports (@/lib/db, @/lib/auth, game modules) belong to the HOST project.
 * Do not treat SWIPE FORCE grant keys / continue-coin names as part of the kernel.
 */

/**
 * YouTube media-watch (support view) dialog.
 * IMPORTANT: never rewrite the iframe each tick — YouTube blocks rapid reloads.
 * Build shell once; update countdown / buttons via textContent only.
 */

import {
  AD_WATCH_HOUR_SEC,
  AD_WATCH_HOURLY_MAX,
  AD_WATCH_LONG_START_SEC,
  adWatchRemaining,
  bumpLocalAdWatchCount,
  formatSec,
  fullWatchRewardLabel,
  loadLocalAdWatchCount,
  maxCoinsForVideo,
  pickAdVideoBiased,
  requiredWatchSec,
  unclaimedCoinsForVideo,
  watchMilestoneDefs,
  youtubeEmbedUrl,
  preferUnmutedAdAutoplay,
  getAdWatchVideos,
  type AdVideo,
  type WatchMilestone,
} from "@/components/game/engine/modes/media-watch";
import { setCoins } from "@/components/game/engine/meta/player-local";
import { fetchMediaCatalog } from "@/lib/media-catalog-api";
import { openUrlCushion } from "@/lib/url-cushion";

const MUTE_PERSIST_KEY = "sf-ad-mute-persist";
const MUTE_PREF_KEY = "sf-ad-mute-pref";

function loadMutePersist(): boolean {
  try {
    return localStorage.getItem(MUTE_PERSIST_KEY) === "1";
  } catch {
    return false;
  }
}

function loadSavedMutePref(): boolean | null {
  if (!loadMutePersist()) return null;
  try {
    const v = localStorage.getItem(MUTE_PREF_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
    return null;
  } catch {
    return null;
  }
}

function writeMutePersist(on: boolean, muted?: boolean) {
  try {
    if (on) {
      localStorage.setItem(MUTE_PERSIST_KEY, "1");
      if (typeof muted === "boolean") {
        localStorage.setItem(MUTE_PREF_KEY, muted ? "1" : "0");
      }
    } else {
      localStorage.setItem(MUTE_PERSIST_KEY, "0");
      localStorage.removeItem(MUTE_PREF_KEY);
    }
  } catch {
    /* private mode */
  }
}

function envStartMuted(): boolean {
  const saved = loadSavedMutePref();
  if (saved !== null) return saved;
  return !preferUnmutedAdAutoplay();
}

type YtPlayer = {
  getPlayerState: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  mute?: () => void;
  unMute?: () => void;
  isMuted?: () => boolean;
  destroy: () => void;
};
type YtNS = {
  Player: new (
    el: HTMLElement | string,
    opts: {
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YtPlayer }) => void;
        onStateChange?: (e: { data: number; target: YtPlayer }) => void;
      };
    },
  ) => YtPlayer;
};

declare global {
  interface Window {
    YT?: YtNS;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_PLAYING = 1;
const YT_BUFFERING = 3;

function loadYoutubeApi(): Promise<YtNS> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  return new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {
        /* */
      }
      if (window.YT) resolve(window.YT);
      else reject(new Error("YT missing"));
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => reject(new Error("yt api load fail"));
      document.head.appendChild(s);
    }
    let n = 0;
    const iv = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(iv);
        resolve(window.YT);
      } else if (++n > 100) {
        clearInterval(iv);
      }
    }, 100);
  });
}

function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

type CoinGrantRow = {
  claimedAt: string;
  videoId: string;
  label: string;
  reward: number;
  milestoneSec: number;
};

function parseHistory(raw: unknown): CoinGrantRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const o = (x || {}) as Record<string, unknown>;
      return {
        claimedAt: String(o.claimedAt || ""),
        videoId: String(o.videoId || ""),
        label: String(o.label || o.videoId || "広告").slice(0, 80),
        reward: Math.max(1, Number(o.reward) || 1),
        milestoneSec: Number(o.milestoneSec) || 0,
      };
    })
    .filter((r) => r.claimedAt || r.reward);
}

function formatJstStamp(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 16) || "—";
  const d = new Date(t + 9 * 3600 * 1000);
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mo}/${day} ${hh}:${mm}`;
}

type WatchStatus = {
  used: number;
  remaining: number;
  coins: number;
  retryAfterMs: number;
  lastClaimedAt: string | null;
  lastWatchSec: number;
  totalWatchSec: number;
  hourKey: string;
  history: CoinGrantRow[];
};

async function fetchStatus(playerId: string): Promise<WatchStatus> {
  try {
    const data = (await (
      await fetch(
        `/api/share/media-watch?playerId=${encodeURIComponent(playerId)}`,
        { credentials: "same-origin" },
      )
    ).json().catch(() => ({}))) as Record<string, unknown>;
    if (data.ok) {
      return {
        used: Number(data.used) || 0,
        remaining: Number(data.remaining) ?? AD_WATCH_HOURLY_MAX,
        coins: Number(data.coins) || 0,
        retryAfterMs: Number(data.retryAfterMs) || 0,
        lastClaimedAt: (data.lastClaimedAt as string) || null,
        lastWatchSec: Number(data.lastWatchSec) || 0,
        totalWatchSec: Number(data.totalWatchSec) || 0,
        hourKey: String(data.hourKey || ""),
        history: parseHistory(data.history),
      };
    }
  } catch {
    /* */
  }
  const used = loadLocalAdWatchCount();
  return {
    used,
    remaining: adWatchRemaining(used),
    coins: 0,
    retryAfterMs: 0,
    lastClaimedAt: null,
    lastWatchSec: 0,
    totalWatchSec: 0,
    hourKey: "",
    history: [],
  };
}

async function billProgress(playerId: string, videoId: string, watchSec: number) {
  try {
    await fetch("/api/share/media-watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, videoId, watchSec, action: "progress" }),
    });
  } catch {
    /* */
  }
}

async function claimRemote(
  playerId: string,
  videoId: string,
  watchSec: number,
) {
  try {
    const data = (await (
      await fetch("/api/share/media-watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ playerId, videoId, watchSec }),
      })
    ).json().catch(() => ({}))) as Record<string, any>;
    if (!data.ok) {
      return {
        ok: false as const,
        reason: String(data.reason || "fail"),
        retryAfterMs: Number(data.retryAfterMs) || 0,
        minSec: data.minSec as number | undefined,
      };
    }
    const milestonesGranted = Array.isArray(data.milestonesGranted)
      ? data.milestonesGranted.map((g: any) => ({
          at: Number(g.at) || 0,
          reward: Number(g.reward) || 1,
        }))
      : [];
    return {
      ok: true as const,
      coins: Number(data.coins) || 0,
      remaining: Number(data.remaining) || 0,
      reward: Number(data.reward) || 1,
      granted: Number(data.granted) || Number(data.reward) || 1,
      nextMilestone: data.nextMilestone == null ? null : Number(data.nextMilestone),
      nextReward: data.nextReward == null ? null : Number(data.nextReward),
      milestonesGranted,
      totalWatchSec:
        data.totalWatchSec == null ? undefined : Number(data.totalWatchSec),
      history: parseHistory(data.history),
    };
  } catch {
    return { ok: false as const, reason: "network", retryAfterMs: 0 };
  }
}

function el(tag: string, style?: string, text?: string): HTMLElement {
  const n = document.createElement(tag);
  if (style) n.style.cssText = style;
  if (text != null) n.textContent = text;
  return n;
}

export type MediaWatchOpts = {
  playerId: string;
  preferredVideoId?: string | null;
  sfxUi?: () => void;
  sfxOk?: () => void;
  sfxFail?: () => void;
  onCoins?: (c: number) => void;
  onClose?: () => void;
};

export function openMediaWatchDialog(opts: MediaWatchOpts): void {

  const existing = document.getElementById("sf-media-watch-root");
  if (existing) existing.remove();

  const root = el(
    "div",
    "position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif",
  );
  root.id = "sf-media-watch-root";
  const card = el(
    "div",
    "width:min(440px,96vw);max-height:92vh;overflow:auto;background:#061018;border:1px solid #3a6;border-radius:12px;padding:14px 14px 12px;color:#def;box-shadow:0 12px 40px #000a",
  );
  root.appendChild(card);

  const histDock = el(
    "div",
    "position:fixed;left:10px;bottom:10px;z-index:99992;font-family:system-ui,sans-serif",
  );
  histDock.id = "sf-watch-grant-log";
  const histBtn = el(
    "button",
    "padding:8px 10px;border-radius:999px;border:1px solid #4a6;background:#0c1c16;color:#cfe;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px #000a;letter-spacing:.02em",
    "🪙 獲得履歴",
  ) as HTMLButtonElement;
  histBtn.type = "button";
  histBtn.setAttribute("aria-expanded", "false");
  const histPanel = el(
    "div",
    "display:none;position:absolute;left:0;bottom:calc(100% + 8px);width:min(280px,calc(100vw - 24px));max-height:min(46vh,320px);overflow:auto;padding:10px;border-radius:10px;background:#07140f;border:1px solid #3a6;color:#def;box-shadow:0 10px 28px #000c",
  );
  const histHead = el("div", "font-size:11px;font-weight:800;color:#9ef;margin-bottom:4px", "コイン獲得履歴");
  const histSum = el("div", "font-size:10px;color:#8ab;margin-bottom:8px;line-height:1.35");
  const histList = el("div", "display:flex;flex-direction:column;gap:6px");
  histPanel.append(histHead, histSum, histList);
  histDock.append(histBtn, histPanel);
  root.appendChild(histDock);
  document.body.appendChild(root);

  const head = el(
    "div",
    "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px",
  );
  const headLeft = el("div");
  const titleEl = el("div", "font-size:15px;font-weight:800;color:#9ef", "📺 広告視聴ミッション");
  const ruleEl = el("div", "font-size:10px;color:#8ab;margin-top:2px");
  headLeft.append(titleEl, ruleEl);
  const rewardBanner = el(
    "div",
    "background:linear-gradient(90deg,#1a2810,#102018);border:1px solid #4a6;border-radius:10px;padding:10px 12px;margin-bottom:10px;text-align:center",
  );
  const rewardMain = el("div", "font-size:13px;font-weight:900;color:#cfe;line-height:1.35");
  const rewardSub = el("div", "font-size:10px;color:#9ab;margin-top:4px");
  rewardBanner.append(rewardMain, rewardSub);
  const btnClose = el(
    "button",
    "background:#123;border:1px solid #456;color:#cde;border-radius:8px;padding:6px 10px;cursor:pointer",
    "閉じる",
  ) as HTMLButtonElement;
  btnClose.type = "button";
  head.append(headLeft, btnClose);

  const hype = el(
    "div",
    "background:linear-gradient(180deg,#1a1008,#0a1810);border:2px solid #364;border-radius:12px;padding:12px 10px;margin-bottom:10px;text-align:center",
  );
  const hypeBadge = el("div", "font-size:11px;font-weight:800;letter-spacing:.06em;color:#fe8;margin-bottom:4px", "⏱ NEXT COIN");
  const hypeTitle = el("div", "font-size:18px;font-weight:900;color:#fe8;line-height:1.2");
  const hypeTimer = el("div", "font-size:32px;font-weight:900;color:#fe8;margin:6px 0 2px;font-variant-numeric:tabular-nums;letter-spacing:0.04em");
  const hypeReward = el("div", "font-size:12px;color:#fca;font-weight:700");
  const hypeSub = el("div", "font-size:10px;color:#9ab;margin-top:6px");
  const hypeChannel = el(
    "button",
    "display:none;margin:10px auto 0;padding:10px 14px;border-radius:10px;border:1px solid #4af;background:linear-gradient(180deg,#1a3050,#102030);color:#def;font-weight:800;font-size:12px;cursor:pointer;max-width:100%",
  ) as HTMLButtonElement;
  hypeChannel.type = "button";
  const barOuter = el("div", "height:10px;background:#123;border-radius:5px;overflow:hidden;margin-top:10px;border:1px solid #234");
  const barInner = el("div", "height:100%;width:0%;background:linear-gradient(90deg,#2a6,#6c4);transition:width .35s");
  barOuter.appendChild(barInner);
  hype.append(hypeBadge, hypeTitle, hypeTimer, hypeReward, hypeSub, hypeChannel, barOuter);

  const metaLine = el("div", "font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4");
  const ladderLine = el("div", "font-size:10px;color:#cde;margin-top:2px");

  const frameWrap = el(
    "div",
    "position:relative;width:100%;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden;border:1px solid #345;margin-bottom:6px",
  );
  const iframe = document.createElement("iframe");
  iframe.id = "sf-yt-frame";
  iframe.title = "media";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
  const lockOverlay = el("div", "position:absolute;inset:0;z-index:2;background:transparent;cursor:default");
  lockOverlay.setAttribute("aria-hidden", "true");
  lockOverlay.addEventListener("contextmenu", (e) => e.preventDefault());
  lockOverlay.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  lockOverlay.addEventListener("click", () => {
    try {
      if (!ytPlayer) return;
      if (ytPlaying) ytPlayer.pauseVideo();
      else {
        try {
          if (ytMuted) ytPlayer.mute?.();
          else ytPlayer.unMute?.();
        } catch {
          /* */
        }
        ytPlayer.playVideo();
      }
    } catch {
      /* */
    }
  });
  frameWrap.append(iframe, lockOverlay);

  const lockBar = el(
    "div",
    "display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px",
  );
  const btnPlay = el(
    "button",
    "flex:1;min-width:120px;padding:10px;border-radius:8px;border:1px solid #456;background:#1a3020;color:#cfe;font-weight:800;cursor:pointer;font-size:13px",
    "▶ 再生",
  ) as HTMLButtonElement;
  btnPlay.type = "button";
  const btnPause = el(
    "button",
    "flex:1;min-width:120px;padding:10px;border-radius:8px;border:1px solid #456;background:#201818;color:#ecc;font-weight:800;cursor:pointer;font-size:13px",
    "⏸ 一時停止",
  ) as HTMLButtonElement;
  btnPause.type = "button";
  const lockNote = el(
    "div",
    "width:100%;font-size:9px;color:#678;line-height:1.35",
    "シーク・全画面は無効。未保存時は PC=音あり / スマホ=ミュート開始。保存チェックでこのブラウザの初期値を固定。",
  );

  const muteRow = el(
    "div",
    "width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid #345;background:#0a1520;margin-top:2px;box-sizing:border-box",
  );
  const muteLeft = el("div", "min-width:0;flex:1");
  const muteTitle = el("div", "font-size:12px;font-weight:800;color:#cfe", "🔇 ミュート");
  const muteHint = el("div", "font-size:10px;color:#8ab;margin-top:2px;line-height:1.35", "OFF（音あり）でノルマ 2倍速");
  muteLeft.append(muteTitle, muteHint);
  const muteToggle = el(
    "button",
    "flex-shrink:0;position:relative;width:76px;height:36px;border-radius:18px;border:1px solid #456;background:#1a2830;cursor:pointer;padding:0;transition:background .15s,border-color .15s",
  ) as HTMLButtonElement;
  muteToggle.type = "button";
  muteToggle.setAttribute("role", "switch");
  muteToggle.setAttribute("aria-checked", "true");
  muteToggle.setAttribute("aria-label", "ミュート");
  const muteKnob = el(
    "span",
    "position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:50%;background:#def;box-shadow:0 1px 4px #0008;transition:left .15s;pointer-events:none",
  );
  const muteOnLabel = el(
    "span",
    "position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:9px;font-weight:800;color:#9ab;pointer-events:none;opacity:0",
    "ON",
  );
  const muteOffLabel = el(
    "span",
    "position:absolute;right:7px;top:50%;transform:translateY(-50%);font-size:9px;font-weight:800;color:#8cf;pointer-events:none;opacity:1",
    "OFF",
  );
  muteToggle.append(muteOnLabel, muteOffLabel, muteKnob);
  muteRow.append(muteLeft, muteToggle);

  const persistRow = el(
    "div",
    "width:100%;display:flex;align-items:center;gap:8px;margin-top:2px;position:relative",
  );
  persistRow.setAttribute("title", "この選択はブラウザに保存なので、端末やブラウザ毎です");
  const persistCheck = document.createElement("input");
  persistCheck.type = "checkbox";
  persistCheck.id = "sf-ad-mute-persist";
  persistCheck.checked = loadMutePersist();
  persistCheck.style.cssText =
    "width:16px;height:16px;accent-color:#4a8;flex-shrink:0;cursor:pointer";
  const persistLabel = el(
    "label",
    "font-size:11px;color:#9bc;cursor:pointer;user-select:none;display:flex;align-items:center;gap:6px;flex-wrap:wrap",
  ) as HTMLLabelElement;
  persistLabel.htmlFor = "sf-ad-mute-persist";
  persistLabel.append("この選択を保存");
  const persistTip = el(
    "span",
    "display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;border:1px solid #689;color:#9cf;font-size:10px;font-weight:800;cursor:help;position:relative;flex-shrink:0",
    "?",
  );
  persistTip.setAttribute("tabindex", "0");
  persistTip.setAttribute(
    "aria-label",
    "この選択はブラウザに保存なので、端末やブラウザ毎です",
  );
  const persistBubble = el(
    "span",
    "display:none;position:absolute;left:50%;bottom:calc(100% + 7px);transform:translateX(-50%);z-index:8;width:220px;padding:7px 9px;border-radius:8px;background:#0c1820;border:1px solid #468;color:#def;font-size:10px;font-weight:600;line-height:1.45;box-shadow:0 6px 16px #000a;pointer-events:none;white-space:normal",
    "この選択はブラウザに保存なので、端末やブラウザ毎です",
  );
  persistTip.appendChild(persistBubble);
  const showTip = () => {
    persistBubble.style.display = "block";
  };
  const hideTip = () => {
    persistBubble.style.display = "none";
  };
  persistTip.addEventListener("mouseenter", showTip);
  persistTip.addEventListener("mouseleave", hideTip);
  persistTip.addEventListener("focus", showTip);
  persistTip.addEventListener("blur", hideTip);
  persistRow.addEventListener("mouseenter", showTip);
  persistRow.addEventListener("mouseleave", hideTip);
  persistLabel.appendChild(persistTip);
  persistRow.append(persistCheck, persistLabel);

  lockBar.append(btnPlay, btnPause, muteRow, persistRow, lockNote);

  const videoMeta = el("div", "font-size:10px;color:#789;margin-bottom:6px");
  const flashEl = el("div", "font-size:11px;color:#fc8;margin-bottom:8px");
  flashEl.style.display = "none";
  const actions = el("div", "display:flex;gap:8px;flex-wrap:wrap");
  const btnClaim = el(
    "button",
    "flex:1;min-width:140px;padding:12px;border-radius:8px;border:1px solid #345;background:#152028;color:#678;font-weight:900;font-size:14px;cursor:default",
    "…",
  ) as HTMLButtonElement;
  btnClaim.type = "button";
  btnClaim.disabled = true;
  const btnNext = el(
    "button",
    "padding:10px 12px;border-radius:8px;border:1px solid #456;background:#122;color:#9ab;cursor:pointer",
    "別広告",
  ) as HTMLButtonElement;
  btnNext.type = "button";
  actions.append(btnClaim, btnNext);
  const foot = el(
    "div",
    "font-size:9px;color:#567;margin-top:10px;line-height:1.4",
    `※ 未保存時: PCは音あり開始 / スマホはミュート開始。保存するとこのブラウザの初期値になります。\n※ 上限 ${AD_WATCH_HOURLY_MAX} 枚 / 時計の1時間（JST）。時が変わればリセット。`,
  );
  foot.style.whiteSpace = "pre-line";
  card.append(head, rewardBanner, hype, metaLine, ladderLine, frameWrap, lockBar, videoMeta, flashEl, actions, foot);

  let video: AdVideo | null = null;
  let defs: WatchMilestone[] = [];
  let used = loadLocalAdWatchCount();
  let remaining = adWatchRemaining(used);
  let retryAfterMs = 0;
  let lastClaimedAt: string | null = null;
  let totalWatchSec = 0;
  let elapsed = 0;
  let wallElapsed = 0;
  const startMuted = envStartMuted();
  let ytMuted = startMuted;
  let persistOn = loadMutePersist();
  let claimedAt = new Set<number>();
  let claiming = false;
  let flash = "";
  let walletCoins = 0;
  let grantHistory: CoinGrantRow[] = [];
  let histOpen = false;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let started = false;
  let lastNear = -1;
  let loadedVideoId = "";
  let ytPlaying = false;
  let ytReady = false;
  let ytPlayer: YtPlayer | null = null;
  let ytBindGen = 0;
  let autoplayAttempts = 0;
  let autoplayTimer: ReturnType<typeof setTimeout> | null = null;
  const clearAutoplayTimer = () => {
    if (autoplayTimer) {
      clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const ensureIframeEl = (): HTMLIFrameElement => {
    let f = frameWrap.querySelector("iframe") as HTMLIFrameElement | null;
    if (!f) {
      f = document.createElement("iframe");
      f.id = "sf-yt-frame";
      f.title = "media";
      f.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      f.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
      const ov = frameWrap.querySelector("[aria-hidden]");
      if (ov) frameWrap.insertBefore(f, ov);
      else frameWrap.appendChild(f);
    }
    return f;
  };

  const destroyPlayer = () => {
    clearAutoplayTimer();
    autoplayAttempts = 0;
    try {
      ytPlayer?.destroy();
    } catch {
      /* */
    }
    ytPlayer = null;
    ytPlaying = false;
    ytReady = false;
    if (!frameWrap.querySelector("iframe")) ensureIframeEl();
  };

  const close = () => {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
    destroyPlayer();
    root.remove();
    opts.onClose?.();
  };

  const applyWantedMute = () => {
    try {
      if (ytMuted) ytPlayer?.mute?.();
      else ytPlayer?.unMute?.();
    } catch {
      /* */
    }
  };

  const tryAutoplay = (force = false) => {
    if (!ytPlayer) return;
    try {
      applyWantedMute();
      ytPlayer.playVideo();
      autoplayAttempts++;
      clearAutoplayTimer();
      autoplayTimer = setTimeout(() => {
        if (!ytPlayer) return;
        try {
          const st = ytPlayer.getPlayerState?.();
          const playing = st === YT_PLAYING || st === YT_BUFFERING;
          ytPlaying = playing;
          if (!playing && (force || autoplayAttempts < 6)) {
            try {
              ytPlayer.mute?.();
            } catch {
              /* */
            }
            try {
              ytPlayer.playVideo();
            } catch {
              /* */
            }
            autoplayAttempts++;
            autoplayTimer = setTimeout(() => {
              try {
                const st2 = ytPlayer?.getPlayerState?.();
                const playing2 = st2 === YT_PLAYING || st2 === YT_BUFFERING;
                if (!playing2) {
                  ytPlayer?.mute?.();
                  ytPlayer?.playVideo();
                }
                applyWantedMute();
              } catch {
                /* */
              }
              paint();
            }, 800);
          } else if (playing) {
            ytPlaying = true;
            applyWantedMute();
          }
          paint();
        } catch {
          /* */
        }
      }, 400);
    } catch {
      /* */
    }
  };

  const bindYtPlayer = (videoId: string) => {
    const gen = ++ytBindGen;
    destroyPlayer();
    void loadYoutubeApi()
      .then((YT) => {
        if (gen !== ytBindGen || loadedVideoId !== videoId) return;
        try {
          const frameEl = ensureIframeEl();
          ytPlayer = new YT.Player(frameEl, {
            events: {
              onReady: () => {
                if (gen !== ytBindGen) return;
                ytReady = true;
                autoplayAttempts = 0;
                tryAutoplay(true);
                try {
                  const st = ytPlayer?.getPlayerState?.();
                  ytPlaying = st === YT_PLAYING || st === YT_BUFFERING;
                } catch {
                  ytPlaying = false;
                }
                try {
                  const d = Math.floor(ytPlayer?.getDuration?.() || 0);
                  if (video && d >= 10 && Math.abs(d - video.durationSec) > 2) {
                    video = { ...video, durationSec: d };
                    defs = watchMilestoneDefs(d);
                  }
                } catch {
                  /* */
                }
                paint();
              },
              onStateChange: (e) => {
                if (gen !== ytBindGen) return;
                ytPlaying = e.data === YT_PLAYING || e.data === YT_BUFFERING;
                paint();
              },
            },
          });
        } catch (err) {
          console.warn("[media-watch] YT.Player", err);
          ytPlaying = false;
          ytReady = false;
          paint();
        }
      })
      .catch(() => {
        ytPlaying = false;
        ytReady = false;
        paint();
      });
  };

  const ensureIframe = (v: AdVideo | null) => {
    if (!v) {
      if (loadedVideoId !== "") {
        loadedVideoId = "";
        destroyPlayer();
        const f = ensureIframeEl();
        f.removeAttribute("src");
        f.src = "about:blank";
      }
      return;
    }
    if (loadedVideoId === v.id) return;
    loadedVideoId = v.id;
    destroyPlayer();
    const f = ensureIframeEl();
    f.id = "sf-yt-frame";
    f.src = youtubeEmbedUrl(v.id, { mute: ytMuted });
    bindYtPlayer(v.id);
  };

  const nextUnclaimed = (): WatchMilestone | null => {
    for (const m of defs) if (!claimedAt.has(m.at)) return m;
    return null;
  };
  const pendingDefs = () => defs.filter((m) => elapsed >= m.at && !claimedAt.has(m.at));
  const pendingReward = () => pendingDefs().reduce((s, m) => s + m.reward, 0);

  const refreshHourlySlot = () => {
    void fetchStatus(opts.playerId).then((st) => {
      used = st.used;
      remaining = st.remaining;
      retryAfterMs = st.retryAfterMs;
      lastClaimedAt = st.lastClaimedAt;
      if (st.totalWatchSec > 0) totalWatchSec = st.totalWatchSec;
      paint();
    });
  };

  const renderHistory = () => {
    const n = grantHistory.length;
    const totalGot = grantHistory.reduce((s, r) => s + (Number(r.reward) || 0), 0);
    histBtn.textContent = n > 0 ? `🪙 獲得履歴 ${n}` : "🪙 獲得履歴";
    histSum.textContent =
      n > 0
        ? `直近 ${n} 件 · 合計 +${totalGot}枚${walletCoins > 0 ? ` · 残高 ${walletCoins}` : ""} · この時間 ${used}/${AD_WATCH_HOURLY_MAX}`
        : `まだありません · この時間 ${used}/${AD_WATCH_HOURLY_MAX}`;
    histList.replaceChildren();
    if (!n) {
      const empty = el("div", "font-size:11px;color:#678;line-height:1.4", "視聴してコインを受け取るとここに残ります");
      histList.appendChild(empty);
      return;
    }
    for (const row of grantHistory) {
      const item = el(
        "div",
        "padding:6px 7px;border-radius:8px;background:#0a1812;border:1px solid #234",
      );
      const top = el(
        "div",
        "display:flex;justify-content:space-between;gap:8px;align-items:baseline",
      );
      const when = el("div", "font-size:10px;color:#8ab;font-variant-numeric:tabular-nums", formatJstStamp(row.claimedAt));
      const plus = el("div", "font-size:12px;font-weight:900;color:#fe8", `+${row.reward}`);
      top.append(when, plus);
      const title = el(
        "div",
        "font-size:11px;color:#def;margin-top:2px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
        row.label || row.videoId || "広告",
      );
      title.title = row.label || row.videoId;
      const sub = el(
        "div",
        "font-size:9px;color:#678;margin-top:2px",
        row.milestoneSec > 0 ? `到達 ${formatSec(row.milestoneSec)}` : "",
      );
      item.append(top, title);
      if (row.milestoneSec > 0) item.appendChild(sub);
      histList.appendChild(item);
    }
  };

  const showHist = () => {
    histPanel.style.display = "block";
    histBtn.setAttribute("aria-expanded", "true");
  };
  const hideHist = () => {
    if (histOpen) return;
    histPanel.style.display = "none";
    histBtn.setAttribute("aria-expanded", "false");
  };
  histDock.addEventListener("mouseenter", showHist);
  histDock.addEventListener("mouseleave", hideHist);
  histDock.addEventListener("click", (e) => e.stopPropagation());
  histBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    opts.sfxUi?.();
    histOpen = !histOpen;
    if (histOpen) showHist();
    else {
      histPanel.style.display = "none";
      histBtn.setAttribute("aria-expanded", "false");
    }
  });

  const paint = () => {
    renderHistory();

    persistCheck.checked = persistOn;
    if (!video) {
      ruleEl.textContent = "いま再生できる広告はありません";
      hypeBadge.textContent = "📭 なし";
      hypeTitle.textContent = "再生できる動画がありません";
      hypeTimer.textContent = "—";
      hypeReward.textContent = "広告が登録・配信中になるまでお待ちください";
      hypeSub.textContent = "上限到達・OFF・未登録のときは表示されません";
      hypeChannel.style.display = "none";
      barInner.style.width = "0%";
      metaLine.textContent = `この時間帯 ${used}/${AD_WATCH_HOURLY_MAX} 枚 · 残り ${remaining} 枚（時でリセット）`;
      ladderLine.textContent = "梯子: ありません";
      videoMeta.textContent = "再生できる動画がありません";
      flash = flash || "再生できる動画がありません";
      flashEl.style.display = "block";
      flashEl.textContent = flash;
      btnClaim.textContent = "ありません";
      btnClaim.disabled = true;
      btnNext.disabled = true;
      frameWrap.style.display = "none";
      lockBar.style.display = "none";
      rewardBanner.style.display = "none";
      return;
    }
    frameWrap.style.display = "block";
    lockBar.style.display = "flex";
    rewardBanner.style.display = "block";
    btnNext.disabled = false;
    defs = watchMilestoneDefs(video.durationSec);
    const isHourVideo = video.durationSec >= AD_WATCH_HOUR_SEC;
    ruleEl.textContent = isHourVideo
      ? `最初の1時間は通常はしご · 以降15分ごとに +1枚`
      : video.durationSec >= AD_WATCH_LONG_START_SEC
        ? `1枚目 min(尺,60秒) · 5→10→20分…`
        : `必要 min(尺,60秒)`;
    const maxCoins = maxCoinsForVideo(video.durationSec);
    const leftCoins = unclaimedCoinsForVideo(video.durationSec, claimedAt);
    const takeable = Math.min(leftCoins, remaining);
    rewardMain.textContent = fullWatchRewardLabel(video.durationSec);
    if (maxCoins <= 0) rewardSub.textContent = "";
    else if (leftCoins <= 0) rewardSub.textContent = "この動画のコインは受け取り済みです";
    else if (remaining <= 0) {
      const slotLeftSec = Math.max(0, Math.ceil(retryAfterMs / 1000));
      rewardSub.textContent =
        slotLeftSec > 0
          ? `動画フルで最大${maxCoins}枚 · 枠再開まで ${formatCountdown(slotLeftSec)}`
          : `動画フルで最大${maxCoins}枚 · 枠が空き次第また受け取れます`;
    } else {
      rewardSub.textContent =
        takeable < maxCoins
          ? `残り受取可能 約${leftCoins}枚 · いまの枠で最大${takeable}枚（1時間上限 ${AD_WATCH_HOURLY_MAX}枚）`
          : `最後まで見るとはしご合計 ${maxCoins}枚（1時間上限 ${AD_WATCH_HOURLY_MAX}枚）`;
    }
    const pendReward = Math.min(pendingReward(), remaining);
    const ready = pendReward > 0 && remaining > 0 && !claiming;
    const next = nextUnclaimed();
    const nextLeft = next ? Math.max(0, next.at - elapsed) : 0;
    const prevAt = defs.filter((d) => next && d.at < next.at).pop()?.at || 0;
    const pctInSegment = next
      ? Math.min(100, Math.floor(((elapsed - prevAt) / Math.max(1, next.at - prevAt)) * 100))
      : 100;
    const urgent = !!(next && nextLeft > 0 && nextLeft <= 10);
    const veryUrgent = !!(next && nextLeft > 0 && nextLeft <= 3);
    const cdColor = ready ? "#6f6" : veryUrgent ? "#f66" : urgent ? "#fc6" : "#fe8";
    hype.style.borderColor = ready ? "#6a4" : veryUrgent ? "#a44" : urgent ? "#a84" : "#364";
    hypeBadge.style.color = cdColor;
    hypeTitle.style.color = cdColor;
    hypeTimer.style.color = cdColor;
    if (ready) {
      hypeBadge.textContent = claiming ? "⚡ 自動受取" : "🎉 READY";
      hypeTitle.textContent = claiming ? `コイン +${pendReward} 受取中…` : `コイン +${pendReward} 到達！`;
      hypeTimer.textContent = "00:00";
      hypeReward.textContent = "ノンストップで次の階段へ続きます";
      hypeSub.textContent = "自動受取します · 視聴を止めないで";
      barInner.style.width = "100%";
    } else if (remaining <= 0) {
      const slotLeftSec = Math.max(0, Math.ceil(retryAfterMs / 1000));
      hypeBadge.textContent = "⏳ 枠リセット待ち";
      hypeTitle.textContent =
        slotLeftSec > 0 ? `枠が空くまで あと ${formatCountdown(slotLeftSec)}` : "枠が空きました · まもなく再開";
      hypeTimer.textContent = slotLeftSec > 0 ? formatCountdown(slotLeftSec) : "00:00";
      hypeReward.textContent = "時計の『時』が変わるとリセット（例: 3:59→4:00）";
      hypeSub.textContent = slotLeftSec > 0 ? "視聴は続けてOK · 次の正時で自動再開" : "受取枠を再確認しています…";
      barInner.style.width = `${slotLeftSec > 0 ? Math.min(100, Math.max(0, 100 - (slotLeftSec / 3600) * 100)) : 100}%`;
    } else if (next) {
      hypeBadge.textContent = ytPlaying ? "⏱ NEXT COIN" : "⏸ PAUSED";
      hypeTitle.textContent = ytPlaying
        ? `あと ${formatCountdown(nextLeft)} で コイン +${Math.min(next.reward, remaining)}`
        : `停止中 · 再生するとカウント再開`;
      hypeTimer.textContent = formatCountdown(nextLeft);
      hypeReward.textContent = `コイン +${Math.min(next.reward, remaining)} まで`;
      hypeSub.textContent = ytPlaying
        ? `次の階段まで ${formatSec(nextLeft)} · ノンストップ視聴`
        : "再生すると次の階段カウントが再開します";
      barInner.style.width = `${pctInSegment}%`;
    } else {
      hypeBadge.textContent = "✓ CLEAR";
      hypeTitle.textContent = "全段階クリア！";
      hypeTimer.textContent = "--:--";
      hypeReward.textContent = "この動画の報酬は取り切りました";
      hypeSub.textContent = "別広告に切り替えて続きを";
      barInner.style.width = "100%";
    }
    const isClear = !ready && remaining > 0 && !next;
    const showCh = isClear && !!(video.showChannel && video.channelUrl);
    hypeChannel.style.display = showCh ? "inline-block" : "none";
    if (showCh) {
      hypeChannel.textContent = video.channelName
        ? `▶ ${video.channelName} のチャンネル`
        : "▶ YouTubeチャンネルを見る";
    }
    metaLine.textContent = `この時間帯 ${used}/${AD_WATCH_HOURLY_MAX} 枚 · 残り ${remaining} 枚（時でリセット）`;
    ladderLine.textContent =
      "梯子: " +
      defs
        .map((m) => `${claimedAt.has(m.at) ? "✓" : elapsed >= m.at ? "●" : "○"}+${m.reward}@${formatSec(m.at)}`)
        .join(" → ");
    const playLabel = !ytReady
      ? "読み込み中…"
      : ytPlaying
        ? "▶ 再生中（カウント中）"
        : "⏸ 停止中（カウント停止）";
    refreshMuteState();
    const rateLabel = ytMuted ? "ミュート 1×" : "🔊 2×カウント";
    videoMeta.textContent = `${video.label} · ${playLabel} · ${rateLabel} · ノルマ ${formatSec(elapsed)} / 尺 約${formatSec(video.durationSec)}`;
    btnPlay.disabled = !ytReady;
    btnPause.disabled = !ytReady;
    btnPlay.style.opacity = ytPlaying ? "0.55" : "1";
    btnPause.style.opacity = ytPlaying ? "1" : "0.55";
    btnPlay.textContent = ytPlaying ? "▶ 再生中" : "▶ 再生";
    btnPause.textContent = ytPlaying ? "⏸ 一時停止" : "⏸ 停止中";
    try {
      muteToggle.setAttribute("aria-checked", ytMuted ? "true" : "false");
      muteToggle.style.background = ytMuted ? "#1a4030" : "#1a3050";
      muteToggle.style.borderColor = ytMuted ? "#4a6" : "#6af";
      muteKnob.style.left = ytMuted ? "3px" : "43px";
      muteKnob.style.background = ytMuted ? "#bfe" : "#9cf";
      muteOnLabel.style.opacity = ytMuted ? "1" : "0";
      muteOffLabel.style.opacity = ytMuted ? "0" : "1";
      muteTitle.textContent = ytMuted ? "🔇 ミュート ON" : "🔊 ミュート OFF";
      muteTitle.style.color = ytMuted ? "#cfe" : "#9ef";
      muteHint.textContent = ytMuted ? "音なし · ノルマ 1倍速" : "音あり · ノルマ 2倍速で進行中";
      muteHint.style.color = ytMuted ? "#8ab" : "#8cf";
      muteToggle.disabled = !ytReady;
      muteToggle.style.opacity = ytReady ? "1" : "0.5";
    } catch {
      /* */
    }
    if (flash) {
      flashEl.style.display = "block";
      flashEl.textContent = flash;
    } else {
      flashEl.style.display = "none";
      flashEl.textContent = "";
    }
    if (claiming) {
      btnClaim.textContent = "送信中…";
      btnClaim.disabled = true;
    } else if (ready) {
      btnClaim.textContent = `🎁 コイン +${pendReward}（自動/タップ）`;
      btnClaim.disabled = false;
      btnClaim.style.cursor = "pointer";
    } else if (remaining <= 0) {
      const slotLeftSec = Math.max(0, Math.ceil(retryAfterMs / 1000));
      btnClaim.textContent = slotLeftSec > 0 ? `枠まで ${formatCountdown(slotLeftSec)}` : "枠再開中…";
      btnClaim.disabled = true;
    } else if (next) {
      btnClaim.textContent = ytPlaying
        ? `あと ${formatCountdown(nextLeft)} で +${Math.min(next.reward, remaining)}`
        : `⏸ 再生でカウント · あと ${formatCountdown(nextLeft)}`;
      btnClaim.disabled = true;
    } else {
      btnClaim.textContent = "受取済";
      btnClaim.disabled = true;
    }
  };

  const doClaim = async (auto = false) => {
    if (!video) return;
    const v = video;
    if (Math.min(pendingReward(), remaining) <= 0 || claiming || remaining <= 0) return;
    claiming = true;
    if (!auto) paint();
    const first = requiredWatchSec(video);
    const res = await claimRemote(opts.playerId, v.id, elapsed);
    claiming = false;
    if (!res.ok) {
      if (!auto) opts.sfxFail?.();
      if (res.reason === "hourly_cap" || res.reason === "daily_cap") {
        remaining = 0;
        retryAfterMs = res.retryAfterMs || 60000;
        flash = `1時間上限 · 枠まで ${formatCountdown(Math.ceil(retryAfterMs / 1000))}`;
      } else if (res.reason === "already") {
        for (const m of pendingDefs()) claimedAt.add(m.at);
        flash = auto ? "" : "この段階は受取済 · 次へ進みます";
      } else if (res.reason === "too_fast") {
        flash = `視聴不足（必要 ${formatSec(res.minSec ?? first)}）`;
      } else if (!auto) {
        flash = `受取失敗 (${res.reason})`;
      }
      paint();
      return;
    }
    if (res.milestonesGranted?.length) {
      for (const g of res.milestonesGranted) claimedAt.add(Number(g.at) || 0);
    } else {
      for (const m of defs) if (elapsed >= m.at) claimedAt.add(m.at);
    }
    used = AD_WATCH_HOURLY_MAX - res.remaining;
    remaining = res.remaining;
    lastClaimedAt = new Date().toISOString();
    if (res.totalWatchSec != null && res.totalWatchSec > 0) totalWatchSec = res.totalWatchSec;
    else totalWatchSec = Math.max(totalWatchSec, elapsed);
    bumpLocalAdWatchCount(res.granted);
    lastNear = -1;
    try {
      setCoins(opts.playerId, res.coins);
    } catch {
      /* */
    }
    opts.onCoins?.(res.coins);
    walletCoins = res.coins;
    if (res.history?.length) grantHistory = res.history;
    else {
      const nowIso = new Date().toISOString();
      const adds = (res.milestonesGranted?.length
        ? res.milestonesGranted
        : [{ at: elapsed, reward: res.reward }]
      ).map((g) => ({
        claimedAt: nowIso,
        videoId: v.id,
        label: v.label || v.id,
        reward: Number(g.reward) || res.reward || 1,
        milestoneSec: Number(g.at) || 0,
      }));
      grantHistory = [...adds, ...grantHistory].slice(0, 40);
    }
    opts.sfxOk?.();
    const nxt = nextUnclaimed();
    if (nxt && remaining > 0) flash = `GET +${res.reward}！ 次は ${formatSec(nxt.at)} で +${nxt.reward}（ノンストップ）`;
    else if (nxt && remaining <= 0) flash = `GET +${res.reward}！ 次の階段あり · いまは1時間上限`;
    else flash = `GET +${res.reward}！ この動画の梯子クリア  残高 ${res.coins}`;
    paint();
  };

  const refreshMuteState = () => {
    try {
      if (ytPlayer?.isMuted) ytMuted = !!ytPlayer.isMuted();
    } catch {
      /* */
    }
  };

  const startTimer = () => {
    if (started) return;
    started = true;
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      if (document.visibilityState !== "visible") {
        paint();
        return;
      }
      if (retryAfterMs > 0) {
        retryAfterMs = Math.max(0, retryAfterMs - 1000);
        if (retryAfterMs === 0 && remaining <= 0) refreshHourlySlot();
      }
      if (ytPlaying) {
        refreshMuteState();
        elapsed += ytMuted ? 1 : 2;
        wallElapsed += 1;
        if (video && wallElapsed > 0 && wallElapsed % 5 === 0) {
          void billProgress(opts.playerId, video.id, wallElapsed);
        }
        const nu = nextUnclaimed();
        if (nu && remaining > 0) {
          const left = nu.at - elapsed;
          if (left > 0 && left <= 10 && left !== lastNear) {
            lastNear = left;
            if (left <= 3) opts.sfxUi?.();
          }
          if (left <= 0) lastNear = -1;
        }
        if (!claiming && remaining > 0 && pendingReward() > 0) void doClaim(true);
      }
      paint();
    }, 1000);
  };

  const loadVideo = (v: AdVideo | null, resetProgress: boolean) => {
    video = v;
    defs = v ? watchMilestoneDefs(v.durationSec) : [];
    if (resetProgress) {
      claimedAt = new Set();
      elapsed = 0;
      wallElapsed = 0;
      lastNear = -1;
      ytMuted = persistOn ? (loadSavedMutePref() ?? envStartMuted()) : envStartMuted();
    }
    ensureIframe(v);
    if (v) {
      setTimeout(() => tryAutoplay(true), 300);
      setTimeout(() => tryAutoplay(false), 1200);
      setTimeout(() => tryAutoplay(false), 2500);
    }
    paint();
  };

  btnPlay.addEventListener("click", () => {
    opts.sfxUi?.();
    try {
      applyWantedMute();
      ytPlayer?.playVideo();
      setTimeout(() => {
        applyWantedMute();
        ytPlayer?.playVideo();
      }, 200);
    } catch {
      flash = "再生できませんでした";
      paint();
    }
  });
  btnPause.addEventListener("click", () => {
    opts.sfxUi?.();
    try {
      ytPlayer?.pauseVideo();
    } catch {
      /* */
    }
  });
  const applyMute = (muted: boolean) => {
    try {
      if (muted) {
        ytPlayer?.mute?.();
        ytMuted = true;
        flash = "🔇 ミュート ON · ノルマ 1倍速";
      } else {
        ytPlayer?.unMute?.();
        ytMuted = false;
        if (ytPlaying) {
          try {
            ytPlayer?.playVideo();
          } catch {
            /* */
          }
        }
        flash = "🔊 ミュート OFF · ノルマ 2倍速";
      }
      if (persistOn) writeMutePersist(true, ytMuted);
    } catch {
      flash = "ミュート切替に失敗しました";
    }
    paint();
  };
  muteToggle.addEventListener("click", () => {
    opts.sfxUi?.();
    applyMute(!ytMuted);
  });
  persistCheck.addEventListener("change", () => {
    opts.sfxUi?.();
    persistOn = persistCheck.checked;
    writeMutePersist(persistOn, persistOn ? ytMuted : undefined);
    flash = persistOn
      ? `このブラウザに保存しました（${ytMuted ? "ミュート ON" : "音あり"}）`
      : "保存を解除 · 次回は環境の初期値";
    paint();
  });
  hypeChannel.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = video?.channelUrl;
    if (!url) return;
    opts.sfxUi?.();
    openUrlCushion({
      trackKey: `ytch:${(video?.id || "ad").slice(0, 20)}`.slice(0, 32),
      url,
      contextLabel: video?.channelName
        ? `YouTube · ${video.channelName}`
        : "YouTube channel",
      playerId: opts.playerId || "",
      linked: false,
      requireLinkToOpen: false,
    });
  });
  btnClose.addEventListener("click", () => {
    opts.sfxUi?.();
    close();
  });
  btnNext.addEventListener("click", () => {
    if (claiming) return;
    opts.sfxUi?.();
    const next = pickAdVideoBiased(Date.now() + Math.random() * 1e6);
    if (!next) {
      flash = "再生できる動画がありません";
      paint();
      return;
    }
    let pick = next;
    if (video && pick.id === video.id) pick = pickAdVideoBiased(Date.now() + 99) || next;
    flash = "別広告に切替 · 次の報酬を狙え！";
    started = false;
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    loadVideo(pick, true);
    startTimer();
  });
  btnClaim.addEventListener("click", () => {
    void doClaim(false);
  });
  root.addEventListener("click", (e) => {
    if (e.target === root) {
      opts.sfxUi?.();
      close();
    }
  });

  void (async () => {
    const vids = await fetchMediaCatalog();
    const st = await fetchStatus(opts.playerId);
    used = st.used;
    remaining = st.remaining;
    retryAfterMs = st.retryAfterMs;
    lastClaimedAt = st.lastClaimedAt;
    totalWatchSec = st.totalWatchSec;
    grantHistory = st.history || [];
    if (st.coins > 0) {
      walletCoins = st.coins;
      try {
        setCoins(opts.playerId, st.coins);
        opts.onCoins?.(st.coins);
      } catch {
        /* */
      }
    }
    if (remaining <= 0) {
      flash =
        retryAfterMs > 0
          ? `1時間上限 · 枠まで ${formatCountdown(Math.ceil(retryAfterMs / 1000))}`
          : "1時間上限 · まもなく枠確認";
    } else if (!vids.videos.length) {
      flash = "再生できる動画がありません";
    }
    let first = pickAdVideoBiased(Date.now());
    const pref = String(opts.preferredVideoId || "").trim();
    if (pref) {
      const hit =
        vids.videos.find((v) => v.id === pref) ||
        getAdWatchVideos().find((v) => v.id === pref);
      if (hit) first = hit;
    }
    loadVideo(first || null, false);
    if (first) startTimer();
  })();
}
