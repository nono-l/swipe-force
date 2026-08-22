/**
 * JPDOC: 危険URLの報告。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getLinkedPlayerId, unlinkedJson } from "@/lib/require-linked";
import { sanitizeUrlList } from "@/lib/sanitize-message";

/** Fixed report / reaction labels */
export const URL_REPORT_REASONS = [
  "kami", // 神
  "affiliate", // アフィリンク
  "spam", // スパム
  "gore", // グロ
  "fraud", // 詐欺
  "copyright", // 著作権
] as const;

export type UrlReportReason = (typeof URL_REPORT_REASONS)[number];

function reasonOk(r: string): r is UrlReportReason {
  return (URL_REPORT_REASONS as readonly string[]).includes(r);
}

function trackKeyOk(k: string): string | null {
  const s = String(k || "").slice(0, 32);
  if (s === "title") return s;
  if (/^(stage|boss|legacy):\d{1,3}$/.test(s)) return s;
  // profile self-intro links
  if (/^prof:[a-z0-9]{4,24}$/i.test(s)) return s;
  // partner banner destinations
  if (/^bnr:[a-z0-9_-]{3,28}$/i.test(s)) return s;
  return null;
}

/** simple stable hash for URL (not crypto) */
function urlHash(url: string): string {
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

async function ensureVisits(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(
    `CREATE TABLE IF NOT EXISTS sound_url_visits (
      track_key TEXT NOT NULL,
      url_hash TEXT NOT NULL,
      url TEXT NOT NULL,
      player_id TEXT NOT NULL,
      visited_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (track_key, url_hash, player_id)
    )`,
  );
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await ensureVisits(sql);
  await sql.query(
    `CREATE TABLE IF NOT EXISTS sound_url_reports (
      track_key TEXT NOT NULL,
      url_hash TEXT NOT NULL,
      url TEXT NOT NULL,
      player_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (track_key, url_hash, player_id)
    )`,
  );
}

export const Route = createFileRoute("/api/sound/url-report")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const trackKey = trackKeyOk(u.searchParams.get("track") || "");
        const playerId = (u.searchParams.get("playerId") || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const urlsRaw = u.searchParams.get("urls") || "[]";
        let urls: string[] = [];
        try {
          urls = JSON.parse(urlsRaw);
        } catch {
          urls = [];
        }
        const cleaned = sanitizeUrlList(urls);
        if (!trackKey || !cleaned.ok)
          return Response.json({ reports: {} }, { status: 400 });

        try {
          const sql = await getSql();
          await ensure(sql);
          const reports: Record<
            string,
            { counts: Record<string, number>; mine: string | null; visited: boolean }
          > = {};

          for (const url of cleaned.urls) {
            const hash = urlHash(url);
            const rows = await sql.query<{ reason: string; c: number }>(
              `SELECT reason, COUNT(*)::int AS c FROM sound_url_reports
               WHERE track_key = $1 AND url_hash = $2
               GROUP BY reason`,
              [trackKey, hash],
            );
            const counts: Record<string, number> = {};
            for (const r of URL_REPORT_REASONS) counts[r] = 0;
            for (const row of rows) {
              if (reasonOk(row.reason)) counts[row.reason] = Number(row.c) || 0;
            }
            let mine: string | null = null;
            let visited = false;
            if (playerId) {
              const m = await sql.query<{ reason: string }>(
                `SELECT reason FROM sound_url_reports
                 WHERE track_key = $1 AND url_hash = $2 AND player_id = $3`,
                [trackKey, hash, playerId],
              );
              if (m[0] && reasonOk(m[0].reason)) mine = m[0].reason;
              const v = await sql.query<{ n: number }>(
                `SELECT 1 AS n FROM sound_url_visits
                 WHERE track_key = $1 AND url_hash = $2 AND player_id = $3 LIMIT 1`,
                [trackKey, hash, playerId],
              );
              visited = v.length > 0;
            }
            reports[url] = { counts, mine, visited };
          }
          return Response.json({ reports });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ reports: {}, offline: true, error: msg });
        }
      },

      POST: async ({ request }) => {
        let body: {
          track?: string;
          playerId?: string;
          url?: string;
          reason?: string;
          clear?: boolean;
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
        const urlList = sanitizeUrlList([body.url || ""]);
        if (!trackKey) return Response.json({ ok: false, reason: "track" }, { status: 400 });
        if (!urlList.ok || !urlList.urls[0])
          return Response.json({ ok: false, reason: "url" }, { status: 400 });
        const url = urlList.urls[0];
        const hash = urlHash(url);
        const clear = !!body.clear;
        const reason = String(body.reason || "");
        if (!clear && !reasonOk(reason))
          return Response.json({ ok: false, reason: "label" }, { status: 400 });

        try {
          const sql = await getSql();
          await ensure(sql);
          // must have opened the real link (2nd cushion) before rating
          const visited = await sql.query<{ n: number }>(
            `SELECT 1 AS n FROM sound_url_visits
             WHERE track_key = $1 AND url_hash = $2 AND player_id = $3 LIMIT 1`,
            [trackKey, hash, playerId],
          );
          if (!visited.length) {
            return Response.json(
              { ok: false, reason: "not_visited" },
              { status: 403 },
            );
          }
          const at = new Date().toISOString();
          if (clear) {
            await sql.query(
              `DELETE FROM sound_url_reports
               WHERE track_key = $1 AND url_hash = $2 AND player_id = $3`,
              [trackKey, hash, playerId],
            );
          } else {
            // toggle: same reason again clears
            const existing = await sql.query<{ reason: string }>(
              `SELECT reason FROM sound_url_reports
               WHERE track_key = $1 AND url_hash = $2 AND player_id = $3`,
              [trackKey, hash, playerId],
            );
            if (existing[0]?.reason === reason) {
              await sql.query(
                `DELETE FROM sound_url_reports
                 WHERE track_key = $1 AND url_hash = $2 AND player_id = $3`,
                [trackKey, hash, playerId],
              );
            } else {
              await sql.query(
                `INSERT INTO sound_url_reports (track_key, url_hash, url, player_id, reason, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6)
                 ON CONFLICT (track_key, url_hash, player_id)
                 DO UPDATE SET reason = EXCLUDED.reason, updated_at = EXCLUDED.updated_at, url = EXCLUDED.url`,
                [trackKey, hash, url, playerId, reason, at],
              );
            }
          }
          const rows = await sql.query<{ reason: string; c: number }>(
            `SELECT reason, COUNT(*)::int AS c FROM sound_url_reports
             WHERE track_key = $1 AND url_hash = $2
             GROUP BY reason`,
            [trackKey, hash],
          );
          const counts: Record<string, number> = {};
          for (const r of URL_REPORT_REASONS) counts[r] = 0;
          for (const row of rows) {
            if (reasonOk(row.reason)) counts[row.reason] = Number(row.c) || 0;
          }
          const m = await sql.query<{ reason: string }>(
            `SELECT reason FROM sound_url_reports
             WHERE track_key = $1 AND url_hash = $2 AND player_id = $3`,
            [trackKey, hash, playerId],
          );
          const mine =
            m[0] && reasonOk(m[0].reason) ? m[0].reason : null;
          return Response.json({ ok: true, counts, mine });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, offline: true, error: msg }, { status: 500 });
        }
      },
    },
  },
});
