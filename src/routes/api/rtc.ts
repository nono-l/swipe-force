/**
 * JPDOC: WebRTC シグナリング。データはブラウザ同士、ここは名簿と SDP/ICE だけ。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { createSignalingHandler } from "@/lib/multiplayer/signaling-handler";

export const Route = createFileRoute("/api/rtc")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sql = await getSql();
        const handle = createSignalingHandler({
          query: (text, params) => sql.query(text, params),
        });
        return handle(request);
      },
      POST: async ({ request }) => {
        const sql = await getSql();
        const handle = createSignalingHandler({
          query: (text, params) => sql.query(text, params),
        });
        return handle(request);
      },
    },
  },
});
