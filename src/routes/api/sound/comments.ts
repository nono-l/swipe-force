/**
 * JPDOC: サウンドコメント。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getLinkedPlayerId, unlinkedJson } from "@/lib/require-linked";
import {
  sanitizeSoundComment,
  sanitizeUrlList,
  sanitizeCommentKind,
} from "@/lib/sanitize-message";

function trackKeyOk(k: string): string | null {
  const s = String(k || "").slice(0, 32);
  if (s === "title") return s;
  if (/^(stage|boss|legacy):\d{1,3}$/.test(s)) return s;
  return null;
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(
    `CREATE TABLE IF NOT EXISTS sound_comments (
      id SERIAL PRIMARY KEY,
      track_key TEXT NOT NULL,
      player_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ''
    )`,
  );
  // additive columns (ignore if exist)
  try {
    await sql.query(`ALTER TABLE sound_comments ADD COLUMN urls_json TEXT DEFAULT '[]'`);
  } catch {
    /* exists */
  }
  try {
    await sql.query(`ALTER TABLE sound_comments ADD COLUMN kind TEXT DEFAULT 'note'`);
  } catch {
    /* exists */
  }
}

function parseUrls(raw: string | null | undefined): string[] {
  try {
    const j = JSON.parse(raw || "[]");
    const r = sanitizeUrlList(j);
    return r.ok ? r.urls : [];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/api/sound/comments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const trackKey = trackKeyOk(url.searchParams.get("track") || "");
        if (!trackKey) return Response.json({ comments: [] }, { status: 400 });
        try {
          const sql = await getSql();
          await ensure(sql);
          const rows = await sql.query<{
            id: number;
            player_id: string;
            body: string;
            created_at: string;
            urls_json: string | null;
            kind: string | null;
          }>(
            `SELECT id, player_id, body, created_at,
                    COALESCE(urls_json, '[]') AS urls_json,
                    COALESCE(kind, 'note') AS kind
             FROM sound_comments
             WHERE track_key = $1
             ORDER BY id DESC
             LIMIT 50`,
            [trackKey],
          );
          const comments = [];
          for (const r of rows) {
            const body = sanitizeSoundComment(r.body === " " ? "（リンク）" : r.body);
            // allow placeholder link-only posts
            const text =
              body.ok ? body.text : r.body === " " || !r.body ? "（リンク）" : "";
            if (!text && !parseUrls(r.urls_json).length) continue;
            comments.push({
              id: String(r.id),
              from: String(r.player_id).replace(/[^a-z0-9]/gi, "").slice(0, 32),
              body: text || "（リンク）",
              at: r.created_at || "",
              urls: parseUrls(r.urls_json),
              kind: sanitizeCommentKind(r.kind),
            });
          }
          return Response.json({ comments });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ comments: [], error: msg, offline: true });
        }
      },

      POST: async ({ request }) => {
        let body: {
          track?: string;
          playerId?: string;
          body?: string;
          urls?: unknown;
          kind?: unknown;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const linked = await getLinkedPlayerId(request);
        if (!linked.ok) return unlinkedJson();
        const trackKey = trackKeyOk(body.track || "");
        const playerId = linked.playerId;
        const kind = sanitizeCommentKind(body.kind);
        const urls = sanitizeUrlList(body.urls);
        if (!urls.ok)
          return Response.json({ ok: false, reason: urls.reason }, { status: 400 });

        let text = "";
        const rawBody = typeof body.body === "string" ? body.body : "";
        if (rawBody.trim() && rawBody.trim() !== " ") {
          const sanitized = sanitizeSoundComment(rawBody);
          if (!sanitized.ok)
            return Response.json({ ok: false, reason: sanitized.reason }, { status: 400 });
          text = sanitized.text;
        }
        if (!text && urls.urls.length === 0)
          return Response.json({ ok: false, reason: "empty" }, { status: 400 });
        if (!text) text = " "; // link-only

        if (!trackKey) return Response.json({ ok: false, reason: "track" }, { status: 400 });
        try {
          const sql = await getSql();
          await ensure(sql);
          const cnt = await sql.query<{ c: number }>(
            `SELECT COUNT(*)::int AS c FROM sound_comments
             WHERE track_key = $1 AND player_id = $2`,
            [trackKey, playerId],
          );
          if ((Number(cnt[0]?.c) || 0) >= 5) {
            return Response.json({ ok: false, reason: "limit" }, { status: 429 });
          }
          const at = new Date().toISOString();
          const urlsJson = JSON.stringify(urls.urls);
          const ins = await sql.query<{ id: number }>(
            `INSERT INTO sound_comments (track_key, player_id, body, created_at, urls_json, kind)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [trackKey, playerId, text, at, urlsJson, kind],
          );
          return Response.json({
            ok: true,
            comment: {
              id: String(ins[0]?.id || Date.now()),
              from: playerId,
              body: text === " " ? "（リンク）" : text,
              at,
              urls: urls.urls,
              kind,
            },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({
            ok: true,
            offline: true,
            error: msg,
            comment: {
              id: `local_${Date.now()}`,
              from: playerId,
              body: text === " " ? "（リンク）" : text,
              at: new Date().toISOString(),
              urls: urls.urls,
              kind,
            },
          });
        }
      },
    },
  },
});
