import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/share/spend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { playerId?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, coins: 0 }, { status: 400 });
        }
        const playerId = String(body.playerId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        if (!playerId) {
          return Response.json({ ok: false, coins: 0 }, { status: 400 });
        }
        try {
          const sql = await getSql();
          const rows = await sql<{ coins: number }>`
            SELECT coins FROM continue_coins WHERE player_id = ${playerId}
          `;
          const cur = Number(rows[0]?.coins) || 0;
          if (cur <= 0) {
            return Response.json({ ok: false, coins: 0 });
          }
          const next = cur - 1;
          await sql`
            UPDATE continue_coins
            SET coins = ${next}, updated_at = now()
            WHERE player_id = ${playerId}
          `;
          return Response.json({ ok: true, coins: next });
        } catch (e) {
          console.error("[share/spend]", e);
          return Response.json({ ok: false, coins: 0, offline: true }, { status: 500 });
        }
      },
    },
  },
});
