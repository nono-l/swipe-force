/**
 * YouTube ad-watch dialog.
 * IMPORTANT: never rewrite the iframe each tick — YouTube blocks rapid reloads.
 * Build shell once; update countdown / buttons via textContent only.
 */

import {
  AD_WATCH_HOUR_SEC,
  AD_WATCH_HOURLY_MAX,
  AD_WATCH_LONG_START_SEC,
  AD_WATCH_MAX_SEC,
  AD_WATCH_QUARTER_REWARD,
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
  type AdVideo,
  type WatchMilestone,
} from "@/components/game/engine/modes/ad-watch";
import { setCoins } from "@/components/game/engine/meta/player-local";
import { fetchAdVideos } from "@/lib/ad-videos-api";


/** YouTube IFrame API loader (once) */
type YtPlayer = {
  getPlayerState: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
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
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
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
    // if script already there, poll briefly
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


export type AdWatchDialogOpts = {
  playerId: string;
  sfxUi?: () => void;
  sfxOk?: () => void;
  sfxFail?: () => void;
  onCoins?: (coins: number) => void;
  onClose?: () => void;
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function formatRetry(ms: number): string {
  if (ms <= 0) return "";
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `約${m}分後に枠が空きます`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `約${h}時間${r}分後` : `約${h}時間後`;
}

function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

async function fetchStatus(playerId: string): Promise<{
  used: number;
  remaining: number;
  coins: number;
  retryAfterMs: number;
  lastClaimedAt: string | null;
  lastWatchSec: number;
  totalWatchSec: number;
  hourKey: string;
}> {
  try {
    const res = await fetch(
      `/api/share/ad-watch?playerId=${encodeURIComponent(playerId)}`,
      { credentials: "same-origin" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      used?: number;
      remaining?: number;
      coins?: number;
      retryAfterMs?: number;
      lastClaimedAt?: string | null;
      lastWatchSec?: number;
      totalWatchSec?: number;
      hourKey?: string;
    };
    if (data.ok) {
      return {
        used: Number(data.used) || 0,
        remaining: Number(data.remaining) ?? AD_WATCH_HOURLY_MAX,
        coins: Number(data.coins) || 0,
        retryAfterMs: Number(data.retryAfterMs) || 0,
        lastClaimedAt: data.lastClaimedAt || null,
        lastWatchSec: Number(data.lastWatchSec) || 0,
        totalWatchSec: Number(data.totalWatchSec) || 0,
        hourKey: String(data.hourKey || ""),
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
  };
}


async function billProgress(
  playerId: string,
  videoId: string,
  watchSec: number,
): Promise<void> {
  try {
    await fetch("/api/share/ad-watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        playerId,
        videoId,
        watchSec,
        action: "progress",
      }),
    });
  } catch {
    /* */
  }
}

async function claimRemote(
  playerId: string,
  videoId: string,
  watchSec: number,
): Promise<
  | {
      ok: true;
      coins: number;
      remaining: number;
      reward: number;
      granted: number;
      nextMilestone: number | null;
      nextReward: number | null;
      milestonesGranted: { at: number; reward: number }[];
      totalWatchSec?: number;
    }
  | {
      ok: false;
      reason: string;
      retryAfterMs?: number;
      minSec?: number;
    }
> {
  try {
    const res = await fetch("/api/share/ad-watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, videoId, watchSec }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      coins?: number;
      remaining?: number;
      reward?: number;
      granted?: number;
      retryAfterMs?: number;
      minSec?: number;
      nextMilestone?: number | null;
      nextReward?: number | null;
      milestonesGranted?: { at?: number; reward?: number }[];
      totalWatchSec?: number;
    };
    if (!data.ok) {
      return {
        ok: false,
        reason: data.reason || "fail",
        retryAfterMs: Number(data.retryAfterMs) || 0,
        minSec: data.minSec,
      };
    }
    const milestonesGranted = Array.isArray(data.milestonesGranted)
      ? data.milestonesGranted.map((g) => ({
          at: Number(g.at) || 0,
          reward: Number(g.reward) || 1,
        }))
      : [];
    return {
      ok: true,
      coins: Number(data.coins) || 0,
      remaining: Number(data.remaining) || 0,
      reward: Number(data.reward) || 1,
      granted: Number(data.granted) || Number(data.reward) || 1,
      nextMilestone:
        data.nextMilestone == null ? null : Number(data.nextMilestone),
      nextReward: data.nextReward == null ? null : Number(data.nextReward),
      milestonesGranted,
      totalWatchSec:
        data.totalWatchSec == null ? undefined : Number(data.totalWatchSec),
    };
  } catch {
    return { ok: false, reason: "network" };
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (style) n.style.cssText = style;
  if (text != null) n.textContent = text;
  return n;
}

export function openAdWatchDialog(opts: AdWatchDialogOpts): void {
  const existing = document.getElementById("sf-ad-watch-root");
  if (existing) existing.remove();

  const root = el(
    "div",
    "position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,sans-serif",
  );
  root.id = "sf-ad-watch-root";

  const card = el(
    "div",
    "width:min(440px,96vw);max-height:92vh;overflow:auto;background:#061018;border:1px solid #3a6;border-radius:12px;padding:14px 14px 12px;color:#def;box-shadow:0 12px 40px #000a",
  );
  root.appendChild(card);
  document.body.appendChild(root);

  // ── static shell (iframe lives here forever until video change) ──
  const head = el(
    "div",
    "display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px",
  );
  const headLeft = el("div");
  const titleEl = el(
    "div",
    "font-size:15px;font-weight:800;color:#9ef",
    "📺 広告視聴ミッション",
  );
  const ruleEl = el("div", "font-size:10px;color:#8ab;margin-top:2px");
  headLeft.append(titleEl, ruleEl);
  const rewardBanner = el(
    "div",
    "background:linear-gradient(90deg,#1a2810,#102018);border:1px solid #4a6;border-radius:10px;padding:10px 12px;margin-bottom:10px;text-align:center",
  );
  const rewardMain = el(
    "div",
    "font-size:13px;font-weight:900;color:#cfe;line-height:1.35",
  );
  const rewardSub = el(
    "div",
    "font-size:10px;color:#9ab;margin-top:4px",
  );
  rewardBanner.append(rewardMain, rewardSub);
  const btnClose = el(
    "button",
    "background:#123;border:1px solid #456;color:#cde;border-radius:8px;padding:6px 10px;cursor:pointer",
    "閉じる",
  ) as HTMLButtonElement;
  btnClose.type = "button";
  head.append(headLeft, btnClose);

  // hype box
  const hype = el(
    "div",
    "background:linear-gradient(180deg,#1a1008,#0a1810);border:2px solid #364;border-radius:12px;padding:12px 10px;margin-bottom:10px;text-align:center",
  );
  const hypeBadge = el(
    "div",
    "font-size:11px;font-weight:800;letter-spacing:.06em;color:#fe8;margin-bottom:4px",
    "⏱ NEXT COIN",
  );
  const hypeTitle = el(
    "div",
    "font-size:18px;font-weight:900;color:#fe8;line-height:1.2",
  );
  const hypeTimer = el(
    "div",
    "font-size:32px;font-weight:900;color:#fe8;margin:6px 0 2px;font-variant-numeric:tabular-nums;letter-spacing:0.04em",
  );
  const hypeReward = el(
    "div",
    "font-size:12px;color:#fca;font-weight:700",
  );
  const hypeSub = el("div", "font-size:10px;color:#9ab;margin-top:6px");
  const barOuter = el(
    "div",
    "height:10px;background:#123;border-radius:5px;overflow:hidden;margin-top:10px;border:1px solid #234",
  );
  const barInner = el(
    "div",
    "height:100%;width:0%;background:linear-gradient(90deg,#2a6,#6c4);transition:width .35s",
  );
  barOuter.appendChild(barInner);
  hype.append(hypeBadge, hypeTitle, hypeTimer, hypeReward, hypeSub, barOuter);

  const metaLine = el(
    "div",
    "font-size:11px;color:#9bc;margin-bottom:8px;line-height:1.4",
  );
  const ladderLine = el("div", "font-size:10px;color:#cde;margin-top:2px");

  // iframe host — NEVER cleared on tick
  const frameWrap = el(
    "div",
    "position:relative;width:100%;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden;border:1px solid #345;margin-bottom:6px",
  );
  const iframe = document.createElement("iframe");
  iframe.id = "sf-ad-yt-frame";
  iframe.title = "ad";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  // no fullscreen attribute intentional; sandbox-ish restrictions via params
  iframe.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;border:0";
  // Block direct interaction with YouTube chrome (seek / logo / share)
  const lockOverlay = el(
    "div",
    "position:absolute;inset:0;z-index:2;background:transparent;cursor:default",
  );
  lockOverlay.setAttribute("aria-hidden", "true");
  lockOverlay.addEventListener("contextmenu", (e) => e.preventDefault());
  lockOverlay.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
  // Center tap still can toggle play via our handler (not through YT UI)
  lockOverlay.addEventListener("click", () => {
    try {
      if (!ytPlayer) return;
      if (ytPlaying) ytPlayer.pauseVideo();
      else ytPlayer.playVideo();
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
    "シーク・全画面・キーボード操作は無効。操作は上の再生/停止のみ（YouTubeロゴは仕様上残る場合あり）。",
  );
  lockBar.append(btnPlay, btnPause, lockNote);

  const videoMeta = el("div", "font-size:10px;color:#789;margin-bottom:6px");
  const flashEl = el("div", "font-size:11px;color:#fc8;margin-bottom:8px");
  flashEl.style.display = "none";

  const actions = el(
    "div",
    "display:flex;gap:8px;flex-wrap:wrap",
  );
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
    `※ 再生中だけカウント。操作は再生/停止のみ。\n※ 上限 ${AD_WATCH_HOURLY_MAX} 枚 / 時計の1時間（JST）。時が変わればリセット。`,
  );
  foot.style.whiteSpace = "pre-line";

  card.append(
    head,
    rewardBanner,
    hype,
    metaLine,
    ladderLine,
    frameWrap,
    lockBar,
    videoMeta,
    flashEl,
    actions,
    foot,
  );

  // ── state ──
  let video: AdVideo | null = null;
  let defs: WatchMilestone[] = [];
  let used = loadLocalAdWatchCount();
  let remaining = adWatchRemaining(used);
  let retryAfterMs = 0;
  let lastClaimedAt: string | null = null;
  let lastWatchSec = 0;
  let totalWatchSec = 0;
  let elapsed = 0;
  let claimedAt = new Set<number>();
  let claiming = false;
  let flash = "";
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let started = false;
  let lastNear = -1;
  let loadedVideoId = "";
  /** true only while YouTube reports PLAYING (or buffering mid-play) */
  let ytPlaying = false;
  let ytReady = false;
  let ytPlayer: YtPlayer | null = null;
  let ytBindGen = 0;

  const ensureIframeEl = () => {
    let f = frameWrap.querySelector("iframe") as HTMLIFrameElement | null;
    if (!f) {
      f = document.createElement("iframe");
      f.id = "sf-ad-yt-frame";
      f.title = "ad";
      f.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      f.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;border:0";
      // put iframe under overlay
      const ov = frameWrap.querySelector("[aria-hidden]") as HTMLElement | null;
      if (ov) frameWrap.insertBefore(f, ov);
      else frameWrap.appendChild(f);
    }
    if (!frameWrap.querySelector("[aria-hidden]")) {
      const ov = el(
        "div",
        "position:absolute;inset:0;z-index:2;background:transparent;cursor:default",
      );
      ov.setAttribute("aria-hidden", "true");
      ov.addEventListener("contextmenu", (e) => e.preventDefault());
      ov.addEventListener("click", () => {
        try {
          if (!ytPlayer) return;
          if (ytPlaying) ytPlayer.pauseVideo();
          else ytPlayer.playVideo();
        } catch {
          /* */
        }
      });
      frameWrap.appendChild(ov);
    }
    return f;
  };

  const destroyPlayer = () => {
    try {
      ytPlayer?.destroy();
    } catch {
      /* */
    }
    ytPlayer = null;
    ytPlaying = false;
    ytReady = false;
    // YT.Player.destroy() may remove the iframe — recreate shell
    if (!frameWrap.querySelector("iframe")) {
      ensureIframeEl();
    }
  };

  const close = () => {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
    destroyPlayer();
    root.remove();
    opts.onClose?.();
  };

  const bindYtPlayer = (videoId: string) => {
    const gen = ++ytBindGen;
    destroyPlayer();
    // Give iframe a moment after src set, then attach API
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
                // autoplay may already be going
                try {
                  const st = ytPlayer?.getPlayerState?.();
                  ytPlaying = st === YT_PLAYING || st === YT_BUFFERING;
                } catch {
                  ytPlaying = false;
                }
                // Sync real duration into local ladder (server still uses admin-saved length)
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
                // 1 playing, 3 buffering count as "再生中"; pause/end/cued stop
                ytPlaying = e.data === YT_PLAYING || e.data === YT_BUFFERING;
                paint();
              },
            },
          });
        } catch (err) {
          console.warn("[ad-watch] YT.Player", err);
          // fallback: if API fails, don't auto-count (safer)
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

  /** Load iframe only when video id actually changes */
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
    f.id = "sf-ad-yt-frame";
    f.src = youtubeEmbedUrl(v.id);
    bindYtPlayer(v.id);
  };

  const nextUnclaimed = (): WatchMilestone | null => {
    for (const m of defs) {
      if (!claimedAt.has(m.at)) return m;
    }
    return null;
  };

  const pendingDefs = () =>
    defs.filter((m) => elapsed >= m.at && !claimedAt.has(m.at));

  const pendingReward = () =>
    pendingDefs().reduce((s, m) => s + m.reward, 0);

  const paint = () => {
    if (!video) {
      ruleEl.textContent = "いま再生できる広告はありません";
      hypeBadge.textContent = "📭 なし";
      hypeBadge.style.color = "#aaa";
      hypeTitle.textContent = "再生できる動画がありません";
      hypeTitle.style.color = "#ccc";
      hypeTimer.textContent = "—";
      hypeTimer.style.color = "#666";
      hypeReward.textContent = "広告が登録・配信中になるまでお待ちください";
      hypeSub.textContent = "上限到達・OFF・未登録のときは表示されません";
      barInner.style.width = "0%";
      {
      let lastTxt = "";
      if (lastClaimedAt) {
        try {
          const d = new Date(lastClaimedAt);
          const j = new Date(d.getTime() + 9 * 3600 * 1000);
          lastTxt = ` · 前回 ${j.getUTCHours()}:${String(j.getUTCMinutes()).padStart(2, "0")}`;
        } catch {
          lastTxt = " · 受取済あり";
        }
      }
      const cum =
        totalWatchSec > 0
          ? ` · 累計視聴 ${formatSec(totalWatchSec)}`
          : "";
      metaLine.textContent = `この時間帯 ${used}/${AD_WATCH_HOURLY_MAX} 枚 · 残り ${remaining} 枚（時でリセット）${lastTxt}${cum}`;
    }
      ladderLine.textContent = "梯子: ありません";
      videoMeta.textContent = "再生できる動画がありません";
      flash = flash || "再生できる動画がありません";
      flashEl.style.display = "block";
      flashEl.textContent = flash;
      btnClaim.textContent = "ありません";
      btnClaim.disabled = true;
      btnNext.disabled = true;
      btnNext.textContent = "なし";
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
      ? `最初の1時間は通常はしご · 以降15分ごとに +${AD_WATCH_QUARTER_REWARD}枚`
      : video.durationSec >= AD_WATCH_LONG_START_SEC
        ? `1枚目 min(尺,${AD_WATCH_MAX_SEC}秒) · 5→10→20分…`
        : `必要 min(尺,${AD_WATCH_MAX_SEC}秒)`;

    const maxCoins = maxCoinsForVideo(video.durationSec);
    const leftCoins = unclaimedCoinsForVideo(video.durationSec, claimedAt);
    const takeable = Math.min(leftCoins, remaining);
    rewardMain.textContent = fullWatchRewardLabel(video.durationSec);
    if (maxCoins <= 0) {
      rewardSub.textContent = "";
    } else if (leftCoins <= 0) {
      rewardSub.textContent = "この動画のコインは受け取り済みです";
    } else if (remaining <= 0) {
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

    const pending = pendingDefs();
    const pendReward = Math.min(pendingReward(), remaining);
    const ready = pendReward > 0 && remaining > 0 && !claiming;
    const next = nextUnclaimed();
    const nextLeft = next ? Math.max(0, next.at - elapsed) : 0;
    const prevAt =
      defs.filter((d) => next && d.at < next.at).pop()?.at || 0;
    const pctInSegment = next
      ? Math.min(
          100,
          Math.floor(
            ((elapsed - prevAt) / Math.max(1, next.at - prevAt)) * 100,
          ),
        )
      : 100;

    const urgent = !!(next && nextLeft > 0 && nextLeft <= 10);
    const veryUrgent = !!(next && nextLeft > 0 && nextLeft <= 3);
    const cdColor = ready
      ? "#6f6"
      : veryUrgent
        ? "#f66"
        : urgent
          ? "#fc6"
          : "#fe8";
    const border = ready
      ? "#6a4"
      : veryUrgent
        ? "#a44"
        : urgent
          ? "#a84"
          : "#364";

    hype.style.borderColor = border;
    hype.style.boxShadow = ready
      ? "0 0 18px #4f48"
      : veryUrgent
        ? "0 0 16px #f448"
        : urgent
          ? "0 0 12px #fa64"
          : "none";
    hypeBadge.style.color = cdColor;
    hypeTitle.style.color = cdColor;
    hypeTimer.style.color = cdColor;

    if (ready) {
      const after = nextUnclaimed(); // same as current pending head
      hypeBadge.textContent = claiming ? "⚡ 自動受取" : "🎉 READY";
      hypeTitle.textContent = claiming
        ? `コイン +${pendReward} 受取中…`
        : `コイン +${pendReward} 到達！`;
      hypeTimer.textContent = "00:00";
      hypeReward.textContent = "ノンストップで次の階段へ続きます";
      hypeSub.textContent = "自動受取します · 視聴を止めないで";
      barInner.style.width = "100%";
      barInner.style.background = "linear-gradient(90deg,#2a6,#6c4)";
    } else if (remaining <= 0) {
      const slotLeftSec = Math.max(0, Math.ceil(retryAfterMs / 1000));
      hypeBadge.textContent = "⏳ 枠リセット待ち";
      hypeTitle.textContent =
        slotLeftSec > 0
          ? `枠が空くまで あと ${formatCountdown(slotLeftSec)}`
          : "枠が空きました · まもなく再開";
      hypeTimer.textContent =
        slotLeftSec > 0 ? formatCountdown(slotLeftSec) : "00:00";
      hypeReward.textContent = "時計の『時』が変わるとリセット（例: 3:59→4:00）";
      hypeSub.textContent =
        slotLeftSec > 0
          ? "視聴は続けてOK · 次の正時で自動再開"
          : "受取枠を再確認しています…";
      // progress within the wait window (assume max 1h)
      const waitPct =
        slotLeftSec > 0
          ? Math.min(100, Math.max(0, 100 - (slotLeftSec / 3600) * 100))
          : 100;
      barInner.style.width = `${waitPct}%`;
      barInner.style.background = "linear-gradient(90deg,#a63,#fc6)";
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
      barInner.style.background = veryUrgent
        ? "linear-gradient(90deg,#a33,#f66)"
        : urgent
          ? "linear-gradient(90deg,#a63,#fc6)"
          : "linear-gradient(90deg,#2a6,#6c4)";
    } else {
      hypeBadge.textContent = "✓ CLEAR";
      hypeTitle.textContent = "全段階クリア！";
      hypeTimer.textContent = "--:--";
      hypeReward.textContent = "この動画の報酬は取り切りました";
      hypeSub.textContent = "別広告に切り替えて続きを";
      barInner.style.width = "100%";
    }

    {
      let lastTxt = "";
      if (lastClaimedAt) {
        try {
          const d = new Date(lastClaimedAt);
          const j = new Date(d.getTime() + 9 * 3600 * 1000);
          lastTxt = ` · 前回 ${j.getUTCHours()}:${String(j.getUTCMinutes()).padStart(2, "0")}`;
        } catch {
          lastTxt = " · 受取済あり";
        }
      }
      const cum =
        totalWatchSec > 0
          ? ` · 累計視聴 ${formatSec(totalWatchSec)}`
          : "";
      metaLine.textContent = `この時間帯 ${used}/${AD_WATCH_HOURLY_MAX} 枚 · 残り ${remaining} 枚（時でリセット）${lastTxt}${cum}`;
    }
    ladderLine.textContent =
      "梯子: " +
      defs
        .map((m) => {
          const mark = claimedAt.has(m.at)
            ? "✓"
            : elapsed >= m.at
              ? "●"
              : "○";
          return `${mark}+${m.reward}@${formatSec(m.at)}`;
        })
        .join(" → ");

    const playLabel = !ytReady
      ? "読み込み中…"
      : ytPlaying
        ? "▶ 再生中（カウント中）"
        : "⏸ 停止中（カウント停止）";
    videoMeta.textContent = `${video.label} · ${playLabel} · 視聴 ${formatSec(elapsed)} / 尺 約${formatSec(video.durationSec)}`;
    btnPlay.disabled = !ytReady;
    btnPause.disabled = !ytReady;
    btnPlay.style.opacity = ytPlaying ? "0.55" : "1";
    btnPause.style.opacity = ytPlaying ? "1" : "0.55";
    btnPlay.textContent = ytPlaying ? "▶ 再生中" : "▶ 再生";
    btnPause.textContent = ytPlaying ? "⏸ 一時停止" : "⏸ 停止中";
    lockBar.style.display = "flex";
    frameWrap.style.display = "block";

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
      btnClaim.style.cursor = "default";
      btnClaim.style.borderColor = "#345";
      btnClaim.style.background = "#152028";
      btnClaim.style.color = "#678";
      btnClaim.style.boxShadow = "none";
    } else if (ready) {
      btnClaim.textContent = claiming
        ? `自動受取中 +${pendReward}…`
        : `🎁 コイン +${pendReward}（自動/タップ）`;
      btnClaim.disabled = claiming;
      btnClaim.style.cursor = claiming ? "default" : "pointer";
      btnClaim.style.borderColor = "#8c4";
      btnClaim.style.background = "linear-gradient(180deg,#2a5020,#1a4020)";
      btnClaim.style.color = "#efe";
      btnClaim.style.boxShadow = "0 0 14px #4a46";
    } else if (remaining <= 0) {
      const slotLeftSec = Math.max(0, Math.ceil(retryAfterMs / 1000));
      btnClaim.textContent =
        slotLeftSec > 0
          ? `枠まで ${formatCountdown(slotLeftSec)}`
          : "枠再開中…";
      btnClaim.disabled = true;
      btnClaim.style.cursor = "default";
      btnClaim.style.borderColor = "#654";
      btnClaim.style.background = "#201808";
      btnClaim.style.color = "#fc8";
      btnClaim.style.boxShadow = "none";
    } else if (next) {
      btnClaim.textContent = ytPlaying
        ? `あと ${formatCountdown(nextLeft)} で +${Math.min(next.reward, remaining)}`
        : `⏸ 再生でカウント · あと ${formatCountdown(nextLeft)}`;
      btnClaim.disabled = true;
      btnClaim.style.cursor = "default";
      btnClaim.style.borderColor = "#345";
      btnClaim.style.background = "#152028";
      btnClaim.style.color = "#678";
      btnClaim.style.boxShadow = "none";
    } else {
      btnClaim.textContent = "受取済";
      btnClaim.disabled = true;
      btnClaim.style.cursor = "default";
      btnClaim.style.borderColor = "#345";
      btnClaim.style.background = "#152028";
      btnClaim.style.color = "#678";
      btnClaim.style.boxShadow = "none";
    }
  };


  const doClaim = async (auto = false) => {
    if (!video) return;
    const pendReward = Math.min(pendingReward(), remaining);
    if (pendReward <= 0 || claiming || remaining <= 0) return;
    claiming = true;
    if (!auto) paint();
    const first = requiredWatchSec(video);
    const res = await claimRemote(opts.playerId, video.id, elapsed);
    claiming = false;
    if (!res.ok) {
      if (!auto) opts.sfxFail?.();
      if (res.reason === "hourly_cap" || res.reason === "daily_cap") {
        remaining = 0;
        retryAfterMs = res.retryAfterMs || 60_000;
        flash = `1時間上限 · 枠まで ${formatCountdown(Math.ceil(retryAfterMs / 1000))}`;
      } else if (res.reason === "already") {
        // mark reached milestones claimed locally so we advance the ladder
        for (const m of pendingDefs()) claimedAt.add(m.at);
        flash = auto ? "" : "この段階は受取済 · 次へ進みます";
      } else if (res.reason === "too_fast") {
        flash = `視聴不足（必要 ${formatSec(res.minSec ?? first)}）`;
      } else {
        if (!auto) flash = `受取失敗 (${res.reason})`;
      }
      paint();
      return;
    }
    // Mark only granted milestones when server reports them; else all pending
    if (res.milestonesGranted?.length) {
      for (const g of res.milestonesGranted) claimedAt.add(Number(g.at) || 0);
    } else {
      for (const m of defs) {
        if (elapsed >= m.at) claimedAt.add(m.at);
      }
    }
    used = AD_WATCH_HOURLY_MAX - res.remaining;
    remaining = res.remaining;
    lastClaimedAt = new Date().toISOString();
    lastWatchSec = elapsed;
    if (res.totalWatchSec != null && res.totalWatchSec > 0) {
      totalWatchSec = res.totalWatchSec;
    } else {
      totalWatchSec = Math.max(totalWatchSec, elapsed);
    }
    bumpLocalAdWatchCount(res.granted);
    lastNear = -1;
    try {
      setCoins(opts.playerId, res.coins);
    } catch {
      /* */
    }
    opts.onCoins?.(res.coins);
    opts.sfxOk?.();
    const next = nextUnclaimed();
    if (next && remaining > 0) {
      flash = `GET +${res.reward}！ 次は ${formatSec(next.at)} で +${next.reward}（ノンストップ）`;
    } else if (next && remaining <= 0) {
      flash = `GET +${res.reward}！ 次の階段あり · いまは1時間上限`;
    } else {
      flash = `GET +${res.reward}！ この動画の梯子クリア  残高 ${res.coins}`;
    }
    paint();
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
      // Always count down until the hourly slot reopens
      if (retryAfterMs > 0) {
        retryAfterMs = Math.max(0, retryAfterMs - 1000);
        if (retryAfterMs === 0 && remaining <= 0) {
          // window edge — re-fetch real remaining
          void refreshHourlySlot();
        }
      }
      if (ytPlaying) {
        elapsed += 1;
        if (video && elapsed > 0 && elapsed % 5 === 0) {
          void billProgress(opts.playerId, video.id, elapsed);
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
        // Non-stop claim when a slot is free
        if (!claiming && remaining > 0 && pendingReward() > 0) {
          void doClaim(true);
        }
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
      lastNear = -1;
    }
    ensureIframe(v);
    paint();
  };

  btnPlay.addEventListener("click", () => {
    opts.sfxUi?.();
    try {
      ytPlayer?.playVideo();
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
    if (video && pick.id === video.id) {
      pick = pickAdVideoBiased(Date.now() + 99) || next;
    }
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

  // initial — load admin video list first (no surprise built-ins)
  void (async () => {
    const vids = await fetchAdVideos();
    const st = await fetchStatus(opts.playerId);
    used = st.used;
    remaining = st.remaining;
    retryAfterMs = st.retryAfterMs;
    lastClaimedAt = st.lastClaimedAt;
    lastWatchSec = st.lastWatchSec;
    totalWatchSec = st.totalWatchSec;
    if (st.coins > 0) {
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
    const first = pickAdVideoBiased(Date.now());
    loadVideo(first, false);
    // always run timer: slot countdown when capped, claims when open
    if (first) startTimer();
  })();
}
