/**
 * JPDOC: WebRTC シグナリング。データはブラウザ同士、ここは名簿と SDP/ICE だけ。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { createSignalingHandler } from "@/lib/multiplayer/signaling-handler";

let handlerPromise: Promise<ReturnType<typeof createSignalingHandler>> | undefined;

async function handleRtc(request: Request) {
  handlerPromise ??= (async () => {
    const sql = await getSql();
    return createSignalingHandler({
      query: (text, params) => sql.query(text, params),
    });
  })();
  const handle = await handlerPromise;
  return handle(request);
}

export const Route = createFileRoute("/api/rtc")({
  server: {
    handlers: {
      GET: async ({ request }) => handleRtc(request),
      POST: async ({ request }) => handleRtc(request),
    },
  },
});
