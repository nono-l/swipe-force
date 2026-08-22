/**
 * JPDOC: バナー文字プリセットのクラウド。
 */
/**
 * Text style presets for strip editor.
 * Path avoids "banner"/"ad" for ad-blockers.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

function normalizePlayerId(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS strip_text_presets (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      payload TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  try {
    await sql.query(
      `CREATE INDEX IF NOT EXISTS strip_text_presets_player
       ON strip_text_presets (player_id, updated_at DESC)`,
    );
  } catch {
    /* */
  }
}

function parsePayload(raw: string, id: string, name: string, updatedAt: string) {
  try {
    const o = JSON.parse(raw || "{}") as Record<string, unknown>;
    return {
      id,
      name: name || String(o.name || "テキスト"),
      text: String(o.text || "").slice(0, 80),
      fontSize: Number(o.fontSize) || 28,
      fontFamily: String(o.fontFamily || "system-ui,sans-serif").slice(0, 160),
      color: String(o.color || "#ffffff").slice(0, 20),
      bold: o.bold !== false,
      rot: Number(o.rot) || 0,
      opacity: Math.max(0, Math.min(100, Math.round(Number(o.opacity ?? 100)))),
      shadow: !!o.shadow,
      shadowBlur: Number(o.shadowBlur) || 6,
      shadowColor: String(o.shadowColor || "#000000").slice(0, 20),
      outline: !!o.outline,
      outlineWidth: Number(o.outlineWidth) || 3,
      outlineColor: String(o.outlineColor || "#000000").slice(0, 20),
      updatedAt,
      source: "cloud" as const,
    };
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/share/strip-presets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const sql = await getSql();
          await ensure(sql);
          const url = new URL(request.url);
          const playerId = normalizePlayerId(url.searchParams.get("playerId"));
          if (playerId.length < 4) {
            return json({ ok: false, reason: "bad_player" }, 400);
          }
          const rows = await sql.query<{
            id: string;
            name: string;
            payload: string;
            updated_at: string;
          }>(
            `SELECT id, name, payload, updated_at FROM strip_text_presets
             WHERE player_id=$1
             ORDER BY updated_at DESC
             LIMIT 60`,
            [playerId],
          );
          const presets = rows
            .map((r) =>
              parsePayload(
                String(r.payload || ""),
                String(r.id),
                String(r.name || ""),
                String(r.updated_at || ""),
              ),
            )
            .filter(Boolean);
          return json({ ok: true, presets });
        } catch (e) {
          console.error("[strip-presets] GET", e);
          return json({ ok: false, reason: "server" }, 500);
        }
      },

      POST: async ({ request }) => {
        try {
          const sql = await getSql();
          await ensure(sql);
          const body = (await request.json().catch(() => ({}))) as {
            playerId?: string;
            action?: string;
            id?: string;
            preset?: Record<string, unknown>;
          };
          const playerId = normalizePlayerId(body.playerId);
          if (playerId.length < 4) {
            return json({ ok: false, reason: "bad_player" }, 400);
          }
          const action = String(body.action || "upsert");

          if (action === "delete") {
            const id = String(body.id || "").slice(0, 40);
            if (!id) return json({ ok: false, reason: "bad_id" }, 400);
            await sql.query(
              `DELETE FROM strip_text_presets WHERE id=$1 AND player_id=$2`,
              [id, playerId],
            );
            return json({ ok: true, deleted: id });
          }

          const p = body.preset || {};
          const id =
            String(p.id || body.id || `t${Date.now().toString(36)}`).slice(
              0,
              40,
            ) || `t${Date.now()}`;
          const name = String(p.name || p.text || "テキスト").slice(0, 40);
          const updatedAt = new Date().toISOString();
          const payload = JSON.stringify({
            text: String(p.text || "").slice(0, 80),
            fontSize: Number(p.fontSize) || 28,
            fontFamily: String(p.fontFamily || "system-ui,sans-serif").slice(
              0,
              160,
            ),
            color: String(p.color || "#ffffff").slice(0, 20),
            bold: p.bold !== false,
            rot: Number(p.rot) || 0,
            opacity: Math.max(0, Math.min(100, Math.round(Number(p.opacity ?? 100)))),
            shadow: !!p.shadow,
            shadowBlur: Number(p.shadowBlur) || 6,
            shadowColor: String(p.shadowColor || "#000000").slice(0, 20),
            outline: !!p.outline,
            outlineWidth: Number(p.outlineWidth) || 3,
            outlineColor: String(p.outlineColor || "#000000").slice(0, 20),
            name,
          });

          // cap per player
          const cnt = await sql.query<{ n: number }>(
            `SELECT COUNT(*)::int AS n FROM strip_text_presets WHERE player_id=$1`,
            [playerId],
          );
          const n = Number(cnt[0]?.n) || 0;
          const exists = await sql.query<{ id: string }>(
            `SELECT id FROM strip_text_presets WHERE id=$1 AND player_id=$2`,
            [id, playerId],
          );
          if (!exists[0] && n >= 40) {
            return json({ ok: false, reason: "limit" }, 400);
          }

          await sql.query(
            `INSERT INTO strip_text_presets (id, player_id, name, payload, updated_at)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               payload = EXCLUDED.payload,
               updated_at = EXCLUDED.updated_at
             WHERE strip_text_presets.player_id = EXCLUDED.player_id`,
            [id, playerId, name, payload, updatedAt],
          );

          // ownership guard: if id owned by other, skip
          const check = await sql.query<{ player_id: string }>(
            `SELECT player_id FROM strip_text_presets WHERE id=$1`,
            [id],
          );
          if (check[0] && String(check[0].player_id) !== playerId) {
            return json({ ok: false, reason: "forbidden" }, 403);
          }

          const preset = parsePayload(payload, id, name, updatedAt);
          return json({ ok: true, preset });
        } catch (e) {
          console.error("[strip-presets] POST", e);
          return json({ ok: false, reason: "server" }, 500);
        }
      },
    },
  },
});
