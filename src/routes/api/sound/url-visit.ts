import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getLinkedPlayerId, unlinkedJson } from "@/lib/require-linked";
import { sanitizeUrlList } from "@/lib/sanitize-message";

function trackKeyOk(k: string): string | null {
  const s = String(k || "").slice(0, 32);
  if (s === "title") return s;
  if (/^(stage|boss|legacy):\d{1,3}$/.test(s)) return s;
  if (/^prof:[a-z0-9]{4,24}$/i.test(s)) return s;
  return null;
}

function urlHash(url: string): string {
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(
    `CREATE TABLE IF NOT EXISTS sound_url_visits (
      track_key TEXT NOT NULL,
      url_hash TEXT NOT NULL,
      url TEXT NOT NULL,
      player_id TEXT NOT NULL,
      visited_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (track_key, url_hash, player_id)
    )`,
  );
}

export const Route = createFileRoute("/api/sound/url-visit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const trackKey = trackKeyOk(u.searchParams.get("track") || "");
        const playerId = (u.searchParams.get("playerId") || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const urlRaw = u.searchParams.get("url") || "";
        const cleaned = sanitizeUrlList([urlRaw]);
        if (!trackKey || !playerId || !cleaned.ok || !cleaned.urls[0]) {
          return Response.json({ visited: false }, { status: 400 });
        }
        const url = cleaned.urls[0];
        const hash = urlHash(url);
        try {
          const sql = await getSql();
          await ensure(sql);
          const rows = await sql.query<{ n: number }>(
            `SELECT 1 AS n FROM sound_url_visits
             WHERE track_key = $1 AND url_hash = $2 AND player_id = $3 LIMIT 1`,
            [trackKey, hash, playerId],
          );
          return Response.json({ visited: rows.length > 0 });
        } catch {
          return Response.json({ visited: false, offline: true });
        }
      },
      POST: async ({ request }) => {
        let body: { track?: string; playerId?: string; url?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false }, { status: 400 });
        }
        const linked = await getLinkedPlayerId(request);
        if (!linked.ok) return unlinkedJson();
        const trackKey = trackKeyOk(body.track || "");
        const playerId = linked.playerId;
        const cleaned = sanitizeUrlList([body.url || ""]);
        if (!trackKey || !cleaned.ok || !cleaned.urls[0]) {
          return Response.json({ ok: false, reason: "bad" }, { status: 400 });
        }
        const url = cleaned.urls[0];
        const hash = urlHash(url);
        const at = new Date().toISOString();
        try {
          const sql = await getSql();
          await ensure(sql);
          await sql.query(
            `INSERT INTO sound_url_visits (track_key, url_hash, url, player_id, visited_at)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (track_key, url_hash, player_id)
             DO UPDATE SET visited_at = EXCLUDED.visited_at, url = EXCLUDED.url`,
            [trackKey, hash, url, playerId, at],
          );
          return Response.json({ ok: true, visited: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: true, visited: true, offline: true, error: msg });
        }
      },
    },
  },
});
