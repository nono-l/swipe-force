/**
 * JPDOC: P2PSync — スナップショット／イベント同期。観戦は host 権威。
 * close() は使い捨て。切断後は rejoin() で新しいメッシュ。
 */
import { P2PRoom } from "./p2p";
import type { PeerInfo, P2PRoomOptions } from "./p2p";

export type SyncRole = "host" | "peer";

export type SyncWire =
  | { type: "hello"; name: string; role: SyncRole }
  | { type: "snapshot"; seq: number; state: unknown }
  | { type: "request-snapshot" }
  | { type: "event"; id: string; payload: unknown }
  | { type: "ack"; id: string; by: string };

export interface P2PSyncOptions {
  room: string;
  selfId: string;
  name?: string;
  role?: SyncRole;
  iceServers?: RTCIceServer[];
  getSnapshot?: () => unknown;
  onSnapshot?: (state: unknown, from: string, seq: number) => void;
  onEvent?: (payload: unknown, from: string, id: string) => void;
  onAck?: (id: string, by: string) => void;
  onHello?: (from: string, name: string, role: SyncRole) => void;
  onPeersChanged?: (peers: PeerInfo[]) => void;
  onConnected?: () => void;
}

export function makeEventId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = (Math.random() * 256) | 0;
  }
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export class P2PSync {
  private opts: P2PSyncOptions;
  private roomInst: P2PRoom | null = null;
  private seq = 0;
  private readonly acked = new Set<string>();

  constructor(opts: P2PSyncOptions) {
    this.opts = opts;
  }

  get room(): P2PRoom | null {
    return this.roomInst;
  }

  start(): void {
    this.openRoom();
  }

  rejoin(): void {
    this.roomInst?.close();
    this.roomInst = null;
    this.openRoom();
  }

  stop(): void {
    this.roomInst?.close();
    this.roomInst = null;
  }

  publishSnapshot(state?: unknown): boolean {
    const p2p = this.roomInst;
    if (!p2p) return false;
    const snap = state ?? this.opts.getSnapshot?.();
    if (snap === undefined) return false;
    this.seq += 1;
    const msg: SyncWire = { type: "snapshot", seq: this.seq, state: snap };
    p2p.broadcast(msg);
    return true;
  }

  requestSnapshot(): void {
    this.roomInst?.send({ type: "request-snapshot" } satisfies SyncWire);
  }

  sendEvent(payload: unknown, toPeerId?: string): string {
    const id = makeEventId();
    const msg: SyncWire = { type: "event", id, payload };
    this.roomInst?.send(msg, toPeerId);
    return id;
  }

  ack(id: string): void {
    if (!id || this.acked.has(id)) return;
    this.acked.add(id);
    const msg: SyncWire = { type: "ack", id, by: this.opts.selfId };
    this.roomInst?.send(msg);
  }

  sendHello(): void {
    this.roomInst?.send({
      type: "hello",
      name: this.opts.name ?? this.opts.selfId,
      role: this.opts.role ?? "peer",
    } satisfies SyncWire);
  }

  private openRoom(): void {
    const roomOpts: P2PRoomOptions = {
      room: this.opts.room,
      selfId: this.opts.selfId,
      name: this.opts.name,
      iceServers: this.opts.iceServers,
      onPeersChanged: this.opts.onPeersChanged,
      onConnected: () => {
        this.sendHello();
        if (this.opts.role === "host") this.publishSnapshot();
        else this.requestSnapshot();
        this.opts.onConnected?.();
      },
      onMessage: (from, data) => this.onWire(from, data),
    };
    const p2p = new P2PRoom(roomOpts);
    this.roomInst = p2p;
    void p2p.join();
  }

  private onWire(from: string, data: unknown): void {
    const msg = data as SyncWire;
    if (!msg || typeof msg !== "object" || !("type" in msg)) return;

    if (msg.type === "hello") {
      this.opts.onHello?.(from, msg.name, msg.role);
      if (this.opts.role === "host") this.publishSnapshot();
      return;
    }
    if (msg.type === "request-snapshot") {
      if (this.opts.role === "host" || this.opts.getSnapshot) {
        this.publishSnapshot();
      }
      return;
    }
    if (msg.type === "snapshot") {
      this.opts.onSnapshot?.(msg.state, from, msg.seq);
      return;
    }
    if (msg.type === "event") {
      this.opts.onEvent?.(msg.payload, from, msg.id);
      if (this.opts.role === "host" && from !== this.opts.selfId) {
        this.ack(msg.id);
      }
      return;
    }
    if (msg.type === "ack") {
      this.opts.onAck?.(msg.id, msg.by);
    }
  }
}
