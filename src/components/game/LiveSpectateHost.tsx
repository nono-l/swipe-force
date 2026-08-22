/**
 * JPDOC: ホスト側の観戦配信バー。薄い状態を 10〜15Hz で publish。
 */
import * as React from "react";
import { P2PSync, type PeerInfo } from "@/lib/multiplayer";

declare global {
  interface Window {
    __sfSpectatorGetFrame?: () => unknown;
  }
}

function makeRoomId(): string {
  return `sf${Math.random().toString(36).slice(2, 8)}`;
}

function makePeerId(): string {
  return `h${Math.random().toString(36).slice(2, 10)}`;
}

export function LiveSpectateHost() {
  const [room, setRoom] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("idle");
  const [viewers, setViewers] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const syncRef = React.useRef<P2PSync | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    syncRef.current?.stop();
    syncRef.current = null;
    setRoom(null);
    setStatus("idle");
    setViewers(0);
  }, []);

  const start = React.useCallback(() => {
    stop();
    const roomId = makeRoomId();
    const selfId = makePeerId();
    const sync = new P2PSync({
      room: roomId,
      selfId,
      name: "host",
      role: "host",
      getSnapshot: () => {
        try {
          return window.__sfSpectatorGetFrame?.() ?? undefined;
        } catch {
          return undefined;
        }
      },
      onConnected: () => setStatus("live"),
      onPeersChanged: (list: PeerInfo[]) => {
        setViewers(list.filter((p) => p.connectionState === "connected").length);
      },
      onHello: () => {
        sync.publishSnapshot();
      },
    });
    syncRef.current = sync;
    setRoom(roomId);
    setStatus("connecting…");
    sync.start();
    // ~12 Hz snapshot
    timerRef.current = setInterval(() => {
      sync.publishSnapshot();
    }, 80);
  }, [stop]);

  React.useEffect(() => () => stop(), [stop]);

  const watchUrl =
    room && typeof window !== "undefined"
      ? `${window.location.origin}/?watch=${encodeURIComponent(room)}`
      : "";

  const copyLink = async () => {
    if (!watchUrl) return;
    try {
      await navigator.clipboard.writeText(watchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        window.prompt("Copy watch URL", watchUrl);
      } catch {}
    }
  };

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-1/2 z-[80] w-[min(96vw,360px)] -translate-x-1/2"
      style={{ fontFamily: "ui-monospace, monospace" }}
    >
      <div className="pointer-events-auto rounded border border-green-700/60 bg-black/85 px-3 py-2 text-[11px] text-green-300 shadow-lg backdrop-blur">
        {!room ? (
          <button
            type="button"
            onClick={start}
            className="w-full rounded bg-green-800/40 px-2 py-1.5 text-left hover:bg-green-700/50"
          >
            LIVE 観戦を開始（状態同期）
          </button>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span>
                LIVE {status} · viewers {viewers}
              </span>
              <button
                type="button"
                onClick={stop}
                className="rounded bg-red-900/50 px-2 py-0.5 text-red-200 hover:bg-red-800/60"
              >
                停止
              </button>
            </div>
            <div className="break-all text-[10px] text-green-500/90">{watchUrl}</div>
            <button
              type="button"
              onClick={copyLink}
              className="rounded bg-green-800/40 px-2 py-1 hover:bg-green-700/50"
            >
              {copied ? "コピーした" : "観戦リンクをコピー"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
