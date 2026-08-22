/**
 * JPDOC: 曲への評価。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getLinkedPlayerId, unlinkedJson } from "@/lib/require-linked";

function trackKeyOk(k: string): string | null {
  const s = String(k || "").slice(0, 32);
  if (s === "title") return s;
  if (/^(stage|boss|legacy):\d{1,3}$/.test(s)) return s;
  return null;
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(
    `CREATE TABLE IF NOT EXISTS sound_votes (
      track_key TEXT NOT NULL,
      player_id TEXT NOT NULL,
      vote SMALLINT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (track_key, player_id)
    )`,
  );
}

export const Route = createFileRoute("/api/sound/votes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const trackKey = trackKeyOk(url.searchParams.get("track") || "");
        const playerId = (url.searchParams.get("playerId") || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        if (!trackKey) return Response.json({ likes: 0, dislikes: 0 }, { status: 400 });
        try {
          const sql = await getSql();
          await ensure(sql);
          const rows = await sql.query<{ vote: number; c: number }>(
            `SELECT vote, COUNT(*)::int AS c FROM sound_votes
             WHERE track_key = $1 GROUP BY vote`,
            [trackKey],
          );
          let likes = 0;
          let dislikes = 0;
          for (const r of rows) {
            if (Number(r.vote) === 1) likes = Number(r.c) || 0;
            if (Number(r.vote) === -1) dislikes = Number(r.c) || 0;
          }
          let mine: number | null = null;
          if (playerId) {
            const m = await sql.query<{ vote: number }>(
              `SELECT vote FROM sound_votes WHERE track_key = $1 AND player_id = $2`,
              [trackKey, playerId],
            );
            if (m[0]) mine = Number(m[0].vote);
          }
          return Response.json({ likes, dislikes, mine });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ likes: 0, dislikes: 0, mine: null, offline: true, error: msg });
        }
      },

      POST: async ({ request }) => {
        let body: { track?: string; playerId?: string; vote?: number };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const linked = await getLinkedPlayerId(request);
        if (!linked.ok) return unlinkedJson();
        const trackKey = trackKeyOk(body.track || "");
        const playerId = linked.playerId;
        const vote = Number(body.vote);
        if (!trackKey) return Response.json({ ok: false, reason: "track" }, { status: 400 });
        if (vote !== 1 && vote !== -1 && vote !== 0)
          return Response.json({ ok: false, reason: "vote" }, { status: 400 });

        try {
          const sql = await getSql();
          await ensure(sql);
          const at = new Date().toISOString();
          if (vote === 0) {
            await sql.query(
              `DELETE FROM sound_votes WHERE track_key = $1 AND player_id = $2`,
              [trackKey, playerId],
            );
          } else {
            await sql.query(
              `INSERT INTO sound_votes (track_key, player_id, vote, updated_at)
               VALUES ($1,$2,$3,$4)
               ON CONFLICT (track_key, player_id)
               DO UPDATE SET vote = EXCLUDED.vote, updated_at = EXCLUDED.updated_at`,
              [trackKey, playerId, vote, at],
            );
          }
          const rows = await sql.query<{ vote: number; c: number }>(
            `SELECT vote, COUNT(*)::int AS c FROM sound_votes
             WHERE track_key = $1 GROUP BY vote`,
            [trackKey],
          );
          let likes = 0;
          let dislikes = 0;
          for (const r of rows) {
            if (Number(r.vote) === 1) likes = Number(r.c) || 0;
            if (Number(r.vote) === -1) dislikes = Number(r.c) || 0;
          }
          return Response.json({ ok: true, likes, dislikes, mine: vote === 0 ? null : vote });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({
            ok: true,
            offline: true,
            error: msg,
            likes: vote === 1 ? 1 : 0,
            dislikes: vote === -1 ? 1 : 0,
            mine: vote === 0 ? null : vote,
          });
        }
      },
    },
  },
});
