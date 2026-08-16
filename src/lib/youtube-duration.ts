/**
 * Fetch YouTube video duration (seconds) via IFrame API — no Data API key.
 * Spins up a temporary off-screen player, reads getDuration(), destroys it.
 * Title via oEmbed (server proxy + noembed fallback).
 */

import { parseYouTubeVideoId } from "@/components/game/engine/modes/media-watch";

type YtPlayer = {
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
  cueVideoById: (id: string) => void;
};

type YtNS = {
  Player: new (
    el: HTMLElement | string,
    opts: {
      videoId?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YtPlayer }) => void;
        onError?: (e: { data: number }) => void;
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

function loadYoutubeApi(): Promise<YtNS> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
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
      if (window.YT?.Player) {
        clearInterval(iv);
        resolve(window.YT);
      } else if (++n > 100) {
        clearInterval(iv);
        reject(new Error("yt api timeout"));
      }
    }, 100);
  });
}

/**
 * @returns duration in whole seconds, or null if unavailable
 */
export async function fetchYouTubeDurationSec(
  videoIdOrUrl: string,
  timeoutMs = 12000,
): Promise<number | null> {
  const id = parseYouTubeVideoId(videoIdOrUrl);
  if (id.length < 6) return null;
  if (typeof document === "undefined") return null;

  const YT = await loadYoutubeApi();

  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.id = `sf-yt-dur-${id}-${Date.now()}`;
    host.style.cssText =
      "position:fixed;left:-9999px;top:0;width:120px;height:68px;opacity:0;pointer-events:none";
    document.body.appendChild(host);

    let settled = false;
    let player: YtPlayer | null = null;
    const finish = (sec: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poll);
      try {
        player?.destroy();
      } catch {
        /* */
      }
      host.remove();
      resolve(
        sec != null && Number.isFinite(sec) && sec > 0
          ? Math.max(1, Math.floor(sec))
          : null,
      );
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    // poll getDuration — sometimes 0 until metadata loads
    const poll = setInterval(() => {
      try {
        const d = player?.getDuration?.() ?? 0;
        if (d > 0) finish(d);
      } catch {
        /* */
      }
    }, 200);

    try {
      player = new YT.Player(host, {
        videoId: id,
        width: 120,
        height: 68,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            try {
              const d = e.target.getDuration();
              if (d > 0) finish(d);
              // else keep polling
            } catch {
              /* */
            }
          },
          onError: () => finish(null),
          onStateChange: (e) => {
            try {
              const d = e.target.getDuration();
              if (d > 0) finish(d);
            } catch {
              /* */
            }
          },
        },
      });
    } catch {
      finish(null);
    }
  });
}

/** Fetch video title via oEmbed (server proxy, then noembed fallback). */
export async function fetchYouTubeTitle(
  videoIdOrUrl: string,
): Promise<string | null> {
  const id = parseYouTubeVideoId(videoIdOrUrl);
  if (id.length < 6) return null;
  try {
    const res = await fetch(
      `/api/share/youtube-meta?id=${encodeURIComponent(id)}`,
      { credentials: "same-origin" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      title?: string | null;
    };
    if (data.ok && data.title) {
      return String(data.title).trim().slice(0, 80);
    }
  } catch {
    /* */
  }
  try {
    const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(watch)}`,
    );
    const data = (await res.json().catch(() => ({}))) as { title?: string };
    if (data.title) return String(data.title).trim().slice(0, 80);
  } catch {
    /* */
  }
  return null;
}

export type YouTubeMeta = {
  id: string;
  title: string | null;
  durationSec: number | null;
};

/** Parallel title + duration fetch for ad registration forms. */
export async function fetchYouTubeMeta(
  videoIdOrUrl: string,
): Promise<YouTubeMeta | null> {
  const id = parseYouTubeVideoId(videoIdOrUrl);
  if (id.length < 6) return null;
  const [title, durationSec] = await Promise.all([
    fetchYouTubeTitle(id),
    fetchYouTubeDurationSec(id),
  ]);
  return { id, title, durationSec };
}
