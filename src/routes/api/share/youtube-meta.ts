/**
 * Server-side YouTube metadata (title) via oEmbed — no API key.
 * Client uses this to avoid CORS issues with youtube.com/oembed.
 */

import { createFileRoute } from "@tanstack/react-router";

function normalizeVideoId(raw: unknown): string {
  const s = String(raw || "").trim();
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(s)) return s.slice(0, 20);
  // light parse for common URLs
  try {
    const u = new URL(
      /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/\//, "")}`,
    );
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      return (u.pathname.split("/").filter(Boolean)[0] || "").slice(0, 20);
    }
    if (host.includes("youtube")) {
      const v = u.searchParams.get("v");
      if (v) return v.slice(0, 20);
      const parts = u.pathname.split("/").filter(Boolean);
      const i = parts.findIndex((p) =>
        ["embed", "shorts", "live", "v"].includes(p),
      );
      if (i >= 0 && parts[i + 1]) return parts[i + 1]!.slice(0, 20);
    }
  } catch {
    /* */
  }
  return "";
}

export const Route = createFileRoute("/api/share/youtube-meta")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const id = normalizeVideoId(
          u.searchParams.get("id") || u.searchParams.get("v") || "",
        );
        if (id.length < 6) {
          return Response.json(
            { ok: false, reason: "id" },
            { status: 400 },
          );
        }
        const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
        try {
          const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
          const res = await fetch(oembed, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) {
            return Response.json({
              ok: false,
              reason: "oembed",
              status: res.status,
              id,
            });
          }
          const data = (await res.json()) as {
            title?: string;
            author_name?: string;
            thumbnail_url?: string;
          };
          const title = String(data.title || "").trim().slice(0, 80);
          return Response.json({
            ok: true,
            id,
            title: title || null,
            author: data.author_name ? String(data.author_name).slice(0, 80) : null,
            thumbnail: data.thumbnail_url
              ? String(data.thumbnail_url).slice(0, 300)
              : null,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json(
            { ok: false, reason: "fetch", error: msg, id },
            { status: 502 },
          );
        }
      },
    },
  },
});
