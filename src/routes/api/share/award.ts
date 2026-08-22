/**
 * JPDOC: シェア報酬（コンティニューコイン）の付与。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const MIN_SECONDS = 10;

export const Route = createFileRoute("/api/share/award")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { sharerId?: string; visitorId?: string; playSeconds?: number };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const sharerId = String(body.sharerId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const visitorId = String(body.visitorId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const playSeconds = Number(body.playSeconds);
        if (!sharerId || !visitorId) {
          return Response.json({ ok: false, reason: "ids" }, { status: 400 });
        }
        if (sharerId === visitorId) {
          return Response.json({ ok: false, reason: "self" });
        }
        if (!Number.isFinite(playSeconds) || playSeconds < MIN_SECONDS) {
          return Response.json({ ok: false, reason: "too_fast" });
        }
        try {
          const sql = await getSql();
          await sql.query(
            "INSERT INTO share_awards (sharer_id, visitor_id, play_seconds) VALUES ($1, $2, $3)",
            [sharerId, visitorId, playSeconds],
          );
          await sql.query(
            `INSERT INTO continue_coins (player_id, coins) VALUES ($1, 1)
             ON CONFLICT (player_id) DO UPDATE
             SET coins = continue_coins.coins + 1, updated_at = now()`,
            [sharerId],
          );
          const rows = await sql.query<{ coins: number }>(
            "SELECT coins FROM continue_coins WHERE player_id = $1",
            [sharerId],
          );
          return Response.json({ ok: true, coins: Number(rows[0]?.coins) || 1 });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[share/award]", msg);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
