/**
 * JPDOC: /api/rtc 用シグナリング。GET poll + POST signal/leave。
 */
import type { PeerRow, RtcPollResponse, SignalRow } from "./p2p";

const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const PEER_TTL_SECONDS = 30;
const SIGNAL_TTL_SECONDS = 60;
const MAX_PAYLOAD = 32_768;

export type QueryFn = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

export function createSignalingHandler(opts: {
  query: QueryFn;
  peerTtlSeconds?: number;
  signalTtlSeconds?: number;
}) {
  const query = opts.query;
  const peerTtl = opts.peerTtlSeconds ?? PEER_TTL_SECONDS;
  const signalTtl = opts.signalTtlSeconds ?? SIGNAL_TTL_SECONDS;
  let schemaPromise: Promise<void> | undefined;

  const ensureSchema = (): Promise<void> => {
    schemaPromise ??= (async () => {
      await query(
        `CREATE TABLE IF NOT EXISTS webrtc_peers (
           room TEXT NOT NULL,
           peer_id TEXT NOT NULL,
           name TEXT NOT NULL DEFAULT '',
           last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
           PRIMARY KEY (room, peer_id)
         )`,
      );
      await query(
        `CREATE TABLE IF NOT EXISTS webrtc_signals (
           id BIGSERIAL PRIMARY KEY,
           room TEXT NOT NULL,
           to_peer TEXT NOT NULL,
           from_peer TEXT NOT NULL,
           kind TEXT NOT NULL,
           payload JSONB NOT NULL,
           created_at TIMESTAMPTZ NOT NULL DEFAULT now()
         )`,
      );
      await query(
        `CREATE INDEX IF NOT EXISTS webrtc_signals_inbox
           ON webrtc_signals (room, to_peer, id)`,
      );
    })().catch((err) => {
      schemaPromise = undefined;
      throw err;
    });
    return schemaPromise;
  };

  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  }

  async function roster(room: string): Promise<PeerRow[]> {
    const rows = await query<{ peer_id: string; name: string }>(
      `SELECT peer_id, name FROM webrtc_peers
       WHERE room = $1 AND last_seen > now() - make_interval(secs => $2)
       ORDER BY peer_id LIMIT 32`,
      [room, peerTtl],
    );
    return rows.map((r) => ({ id: r.peer_id, name: r.name }));
  }

  async function touchPeer(room: string, peer: string, name: string) {
    await query(
      `INSERT INTO webrtc_peers (room, peer_id, name, last_seen)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (room, peer_id)
       DO UPDATE SET last_seen = now(), name = EXCLUDED.name`,
      [room, peer, name],
    );
  }

  async function prune() {
    await Promise.all([
      query(
        `DELETE FROM webrtc_signals WHERE created_at < now() - make_interval(secs => $1)`,
        [signalTtl],
      ),
      query(
        `DELETE FROM webrtc_peers WHERE last_seen < now() - make_interval(secs => $1)`,
        [peerTtl],
      ),
    ]);
  }

  async function handleGet(url: URL): Promise<Response> {
    const room = url.searchParams.get("room") ?? "";
    const peer = url.searchParams.get("peer") ?? "";
    const name = (url.searchParams.get("name") ?? "").slice(0, 64);
    const since = Number(url.searchParams.get("since") ?? 0);
    if (!ID_RE.test(room) || !ID_RE.test(peer) || !Number.isFinite(since) || since < 0) {
      return json({ error: "invalid query" }, 400);
    }
    await ensureSchema();
    if (since === 0 || Math.random() < 0.02) await prune();
    await touchPeer(room, peer, name);
    const rows = await query<{
      id: number;
      from_peer: string;
      kind: SignalRow["kind"];
      payload: unknown;
    }>(
      `SELECT id, from_peer, kind, payload FROM webrtc_signals
       WHERE room = $1 AND to_peer = $2 AND id > $3
       ORDER BY id LIMIT 200`,
      [room, peer, since],
    );
    const body: RtcPollResponse = {
      peers: await roster(room),
      signals: rows.map((r) => ({
        id: Number(r.id),
        from: r.from_peer,
        kind: r.kind,
        payload: r.payload,
      })),
    };
    return json(body);
  }

  async function handlePost(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid JSON" }, 400);
    }
    if (!body || typeof body !== "object") return json({ error: "invalid request" }, 400);
    const msg = body as Record<string, unknown>;
    await ensureSchema();

    if (msg.op === "signal") {
      const room = String(msg.room ?? "");
      const from = String(msg.from ?? "");
      const to = String(msg.to ?? "");
      const kind = String(msg.kind ?? "");
      if (
        !ID_RE.test(room) ||
        !ID_RE.test(from) ||
        !ID_RE.test(to) ||
        !["offer", "answer", "ice"].includes(kind)
      ) {
        return json({ error: "invalid request" }, 400);
      }
      if (msg.payload === undefined) return json({ error: "invalid request" }, 400);
      const encoded = JSON.stringify(msg.payload);
      if (encoded.length > MAX_PAYLOAD) return json({ error: "payload too large" }, 400);
      await query(
        `INSERT INTO webrtc_signals (room, to_peer, from_peer, kind, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [room, to, from, kind, encoded],
      );
      return json({ ok: true });
    }

    if (msg.op === "leave") {
      const room = String(msg.room ?? "");
      const peer = String(msg.peer ?? "");
      if (!ID_RE.test(room) || !ID_RE.test(peer)) {
        return json({ error: "invalid request" }, 400);
      }
      await query(`DELETE FROM webrtc_peers WHERE room = $1 AND peer_id = $2`, [
        room,
        peer,
      ]);
      return json({ ok: true });
    }

    return json({ error: "invalid request" }, 400);
  }

  return async function handleSignaling(request: Request): Promise<Response> {
    try {
      if (request.method === "GET") return await handleGet(new URL(request.url));
      if (request.method === "POST") return await handlePost(request);
      return json({ error: "method not allowed" }, 405);
    } catch (error) {
      console.error("[rtc] signaling:", error);
      return json({ error: "signaling failed" }, 500);
    }
  };
}
