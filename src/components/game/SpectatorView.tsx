/**
 * JPDOC: 観戦専用キャンバス。host の薄い状態を描画するだけ。操作はしない。
 */
import * as React from "react";
import { P2PSync, isSpectatorFrame, type SpectatorFrame, type PeerInfo } from "@/lib/multiplayer";

const PLAY_W = 320;
const PLAY_H = 400;
const RAIL_W = 32;

function makePeerId(): string {
  const a = Math.random().toString(36).slice(2, 10);
  return `w${a}`;
}

function drawFrame(ctx: CanvasRenderingContext2D, frame: SpectatorFrame | null, peers: number) {
  ctx.fillStyle = "#001100";
  ctx.fillRect(0, 0, PLAY_W, PLAY_H);

  // rails
  ctx.fillStyle = "#0a1a0a";
  ctx.fillRect(0, 0, RAIL_W, PLAY_H);
  ctx.fillRect(PLAY_W - RAIL_W, 0, RAIL_W, PLAY_H);

  if (!frame) {
    ctx.fillStyle = "#7dff7d";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("WAITING FOR HOST…", PLAY_W / 2, PLAY_H / 2);
    ctx.fillText(`peers ${peers}`, PLAY_W / 2, PLAY_H / 2 + 14);
    return;
  }

  const shakeX = frame.shake ? (Math.random() - 0.5) * Math.min(4, frame.shake) : 0;
  const shakeY = frame.shake ? (Math.random() - 0.5) * Math.min(4, frame.shake) : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  for (const b of frame.bullets) {
    ctx.fillStyle = b.from === "p" ? "#aaffaa" : "#ff6666";
    ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, Math.max(1, b.w), Math.max(1, b.h));
  }

  for (const e of frame.enemies) {
    if (e.boss) {
      ctx.fillStyle = "#ff44aa";
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      const ratio = e.maxHp > 0 ? e.hp / e.maxHp : 0;
      ctx.fillStyle = "#330011";
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 6, e.w, 3);
      ctx.fillStyle = "#ff88cc";
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 6, e.w * ratio, 3);
    } else {
      const colors = ["#66ff66", "#88ffaa", "#aaff66", "#ccff88"];
      ctx.fillStyle = colors[e.type % colors.length] || "#66ff66";
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
    }
  }

  // player
  if (!frame.player.invuln || Math.floor(performance.now() / 80) % 2 === 0) {
    const px = frame.player.x;
    const py = frame.player.y;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(px, py - 8);
    ctx.lineTo(px - 7, py + 6);
    ctx.lineTo(px + 7, py + 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  ctx.fillStyle = "#7dff7d";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE ${frame.score}`, RAIL_W + 4, 12);
  ctx.fillText(`STAGE ${frame.stage}`, RAIL_W + 4, 24);
  ctx.fillText(`LIVES ${frame.lives}`, RAIL_W + 4, 36);
  ctx.fillText(`PTS ${frame.pts}`, RAIL_W + 4, 48);
  ctx.textAlign = "right";
  ctx.fillText(`WATCH`, PLAY_W - RAIL_W - 4, 12);
  ctx.fillText(frame.mode, PLAY_W - RAIL_W - 4, 24);
  if (frame.bossActive && frame.bossName) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff88cc";
    ctx.fillText(frame.bossName, PLAY_W / 2, 60);
  }
}

export function SpectatorView(props: { roomId: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const frameRef = React.useRef<SpectatorFrame | null>(null);
  const [status, setStatus] = React.useState("connecting…");
  const [peers, setPeers] = React.useState(0);
  const [seq, setSeq] = React.useState(0);

  React.useEffect(() => {
    const room = props.roomId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
    if (!room) {
      setStatus("invalid room");
      return;
    }
    const selfId = makePeerId();
    const sync = new P2PSync({
      room,
      selfId,
      name: "watcher",
      role: "peer",
      onConnected: () => setStatus("connected"),
      onPeersChanged: (list: PeerInfo[]) => {
        setPeers(list.filter((p) => p.connectionState === "connected").length);
      },
      onSnapshot: (state, _from, s) => {
        if (isSpectatorFrame(state)) {
          frameRef.current = state;
          setSeq(s);
          setStatus("live");
        }
      },
    });
    sync.start();
    return () => sync.stop();
  }, [props.roomId]);

  React.useEffect(() => {
    let raf = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) drawFrame(ctx, frameRef.current, peers);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [peers]);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-2 bg-black text-green-400">
      <canvas
        ref={canvasRef}
        width={PLAY_W}
        height={PLAY_H}
        className="block max-h-[85dvh] max-w-full"
        style={{
          aspectRatio: `${PLAY_W} / ${PLAY_H}`,
          imageRendering: "pixelated",
          background: "#001100",
        }}
      />
      <div className="font-mono text-xs opacity-80">
        room {props.roomId} · {status} · seq {seq} · links {peers}
      </div>
      <a href="/" className="font-mono text-xs underline opacity-70">
        back to title
      </a>
    </div>
  );
}
