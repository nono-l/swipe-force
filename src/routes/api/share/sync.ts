import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

/** Best-effort: raise server balance to match offline-awarded local max. */
export const Route = createFileRoute("/api/share/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { playerId?: string; coins?: number };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false }, { status: 400 });
        }
        const playerId = String(body.playerId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const coins = Math.max(0, Math.min(9999, Number(body.coins) || 0));
        if (!playerId) return Response.json({ ok: false }, { status: 400 });
        try {
          const sql = await getSql();
          await sql`
            INSERT INTO continue_coins (player_id, coins)
            VALUES (${playerId}, ${coins})
            ON CONFLICT (player_id) DO UPDATE
            SET coins = GREATEST(continue_coins.coins, EXCLUDED.coins),
                updated_at = now()
          `;
          const rows = await sql<{ coins: number }>`
            SELECT coins FROM continue_coins WHERE player_id = ${playerId}
          `;
          return Response.json({ ok: true, coins: Number(rows[0]?.coins) || coins });
        } catch (e) {
          console.error("[share/sync]", e);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
