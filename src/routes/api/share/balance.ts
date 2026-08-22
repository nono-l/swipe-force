/**
 * JPDOC: コイン残高。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/share/balance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const playerId = (url.searchParams.get("playerId") || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        if (!playerId) {
          return Response.json({ coins: 0 }, { status: 400 });
        }
        try {
          const sql = await getSql();
          const rows = await sql.query<{ coins: number }>(
            "SELECT coins FROM continue_coins WHERE player_id = $1",
            [playerId],
          );
          const coins = rows[0]?.coins ?? 0;
          return Response.json({ coins: Number(coins) || 0 });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[share/balance]", msg);
          return Response.json({ coins: 0, offline: true, error: msg });
        }
      },
    },
  },
});
