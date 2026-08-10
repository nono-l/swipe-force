import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const MIN: Record<string, number> = {
  m1: 10,
  m2: 25,
  m3: 45,
  m4: 70,
};

export const Route = createFileRoute("/api/share/mission")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: {
          sharerId?: string;
          shareId?: string;
          visitorId?: string;
          missionId?: string;
          playSeconds?: number;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const sharerId = String(body.sharerId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const shareId = String(body.shareId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const visitorId = String(body.visitorId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const missionId = String(body.missionId || "").slice(0, 8);
        const playSeconds = Number(body.playSeconds);
        if (!sharerId || !shareId || !visitorId || !MIN[missionId]) {
          return Response.json({ ok: false, reason: "ids" }, { status: 400 });
        }
        // require real share instance id (no empty / synthetic leg*)
        if (shareId.length < 6 || shareId.startsWith("leg")) {
          return Response.json({ ok: false, reason: "share" }, { status: 400 });
        }
        if (sharerId === visitorId) {
          return Response.json({ ok: false, reason: "self" });
        }
        if (!Number.isFinite(playSeconds) || playSeconds < MIN[missionId]) {
          return Response.json({ ok: false, reason: "too_fast" });
        }
        try {
          const sql = await getSql();
          await sql.query(
            `INSERT INTO share_instances (share_id, sharer_id)
             VALUES ($1, $2)
             ON CONFLICT (share_id) DO NOTHING`,
            [shareId, sharerId],
          );
          const exists = await sql.query(
            `SELECT 1 FROM share_mission_v2
             WHERE share_id=$1 AND visitor_id=$2 AND mission_id=$3`,
            [shareId, visitorId, missionId],
          );
          if (exists.length) {
            const bal = await sql.query<{ coins: number }>(
              "SELECT coins FROM continue_coins WHERE player_id=$1",
              [sharerId],
            );
            return Response.json({
              ok: true,
              already: true,
              coins: Number(bal[0]?.coins) || 0,
            });
          }
          await sql.query(
            `INSERT INTO share_mission_v2 (share_id, visitor_id, mission_id, play_seconds)
             VALUES ($1,$2,$3,$4)`,
            [shareId, visitorId, missionId, playSeconds],
          );
          await sql.query(
            `INSERT INTO continue_coins (player_id, coins) VALUES ($1, 1)
             ON CONFLICT (player_id) DO UPDATE
             SET coins = continue_coins.coins + 1, updated_at = ''`,
            [sharerId],
          );
          const rows = await sql.query<{ coins: number }>(
            "SELECT coins FROM continue_coins WHERE player_id=$1",
            [sharerId],
          );
          return Response.json({
            ok: true,
            coins: Number(rows[0]?.coins) || 1,
            missionId,
            shareId,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[share/mission]", msg);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
