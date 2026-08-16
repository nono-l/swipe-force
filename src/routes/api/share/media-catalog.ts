/**
 * Ad video admin + public list.
 *
 * GET  — list videos (+ stats). Query admin=1&playerId= for full admin fields + per-ID watch.
 * POST — admin upsert/delete/replaceAll
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import {
  resolveYoutubeChannel,
  sanitizeYoutubeChannelUrl,
} from "@/lib/youtube-channel";

const SUPER_ADMIN_PLAYER_ID = "uzwdbubkeggsdico0kgho";

function normalizePlayerId(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
}

function parseYouTubeVideoId(input: unknown): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(raw)) return raw.slice(0, 20);
  let s = raw.replace(/^[<\['"]+|[>\]'"]+$/g, "").trim();
  try {
    if (!/^https?:\/\//i.test(s) && /youtube|youtu\.be/i.test(s)) {
      s = "https://" + s.replace(/^\/\//, "");
    }
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      return sanitizeYtId(u.pathname.split("/").filter(Boolean)[0] || "");
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube.com")
    ) {
      const v = u.searchParams.get("v");
      if (v) return sanitizeYtId(v);
      const parts = u.pathname.split("/").filter(Boolean);
      const markers = new Set(["embed", "live", "shorts", "v", "e"]);
      for (let i = 0; i < parts.length; i++) {
        const p = (parts[i] || "").toLowerCase();
        if (markers.has(p) && parts[i + 1]) {
          return sanitizeYtId(parts[i + 1] || "");
        }
      }
      if (parts.length === 1) return sanitizeYtId(parts[0] || "");
    }
  } catch {
    /* */
  }
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{6,20})/,
    /youtu\.be\/([a-zA-Z0-9_-]{6,20})/,
    /\/embed\/([a-zA-Z0-9_-]{6,20})/,
    /\/live\/([a-zA-Z0-9_-]{6,20})/,
    /\/shorts\/([a-zA-Z0-9_-]{6,20})/,
    /\/v\/([a-zA-Z0-9_-]{6,20})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[1]) return sanitizeYtId(m[1]);
  }
  const tok = raw.match(/[a-zA-Z0-9_-]{11}/);
  return tok ? sanitizeYtId(tok[0]) : "";
}

function sanitizeYtId(id: string): string {
  return String(id || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 20);
}

function normalizeVideoId(raw: unknown): string {
  return parseYouTubeVideoId(raw);
}

export type AdVideoViewer = {
  playerId: string;
  /** From player_profiles when set */
  displayName: string;
  watchSec: number;
  claims: number;
  lastClaimedAt: string | null;
};

export type AdVideoRow = {
  id: string;
  label: string;
  durationSec: number;
  maxDisplayHours: number;
  active: boolean;
  sortOrder: number;
  totalWatchSec: number;
  totalClaims: number;
  remainingDisplaySec: number | null;
  exhausted: boolean;
  createdAt: string;
  /** Who registered this ad (empty = platform/admin) */
  ownerPlayerId: string;
  ownerDisplayName: string;
  ownerKind: "platform" | "advertiser";
  claimOnce?: boolean;
  showChannel?: boolean;
  channelUrl?: string;
  channelName?: string;
  viewers?: AdVideoViewer[];
  viewerCount?: number;
};

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_videos (
      video_id TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      duration_sec INTEGER NOT NULL DEFAULT 180,
      max_display_hours REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT '',
      owner_player_id TEXT NOT NULL DEFAULT ''
    )
  `);
  try {
    await sql.query(
      `ALTER TABLE ad_videos ADD COLUMN IF NOT EXISTS owner_player_id TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_videos ADD COLUMN IF NOT EXISTS claim_once INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_videos ADD COLUMN IF NOT EXISTS show_channel INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_videos ADD COLUMN IF NOT EXISTS channel_url TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_videos ADD COLUMN IF NOT EXISTS channel_name TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* */
  }
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_video_stats (
      video_id TEXT PRIMARY KEY,
      total_watch_sec INTEGER NOT NULL DEFAULT 0,
      total_claims INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS game_admins (
      player_id TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      appointed_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
    )
  `);
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS ad_watch_claims (
        id BIGSERIAL PRIMARY KEY,
        player_id TEXT NOT NULL,
        video_id TEXT NOT NULL DEFAULT '',
        watch_sec INTEGER NOT NULL DEFAULT 0,
        day_jst TEXT NOT NULL DEFAULT '',
        claimed_at TEXT NOT NULL DEFAULT ''
      )
    `);
    await sql.query(
      `ALTER TABLE ad_watch_claims ADD COLUMN IF NOT EXISTS reward INTEGER NOT NULL DEFAULT 1`,
    );
    await sql.query(
      `ALTER TABLE ad_watch_claims ADD COLUMN IF NOT EXISTS milestone_sec INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* */
  }

  try {
    const cnt = await sql.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM ad_videos`,
    );
    if ((Number(cnt[0]?.n) || 0) === 0) {
      const legacy = await sql.query<{ value_text: string }>(
        `SELECT value_text FROM game_settings WHERE key=$1`,
        ["ad_watch_videos"],
      );
      const raw = String(legacy[0]?.value_text || "");
      if (raw.trim()) {
        const now = new Date().toISOString();
        let order = 0;
        for (const line of raw.split(/\r?\n/)) {
          const t = line.trim();
          if (!t || t.startsWith("#")) continue;
          const parts = t.split(/\s+/);
          const id = normalizeVideoId(parts[0]);
          if (id.length < 6) continue;
          let durationSec = 180;
          let label = id;
          if (parts[1] && /^\d+$/.test(parts[1])) {
            durationSec = Math.max(10, Math.min(86400, Number(parts[1])));
            if (parts.length > 2) label = parts.slice(2).join(" ").slice(0, 40);
          } else if (parts.length > 1) {
            label = parts.slice(1).join(" ").slice(0, 40);
          }
          await sql.query(
            `INSERT INTO ad_videos
               (video_id, label, duration_sec, max_display_hours, active, sort_order, created_at, updated_at)
             VALUES ($1,$2,$3,0,1,$4,$5,$5)
             ON CONFLICT (video_id) DO NOTHING`,
            [id, label, durationSec, order++, now],
          );
        }
      }
    }
  } catch {
    /* */
  }
}

async function isAdmin(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
): Promise<boolean> {
  const id = normalizePlayerId(playerId);
  if (!id) return false;
  if (id === SUPER_ADMIN_PLAYER_ID) return true;
  try {
    const rows = await sql.query(
      `SELECT 1 AS n FROM game_admins WHERE player_id=$1 LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

function formatWatchHuman(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}分${r}秒` : `${m}分`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}時間${rm}分` : `${h}時間`;
}

async function listVideos(
  sql: Awaited<ReturnType<typeof getSql>>,
  opts: { activeOnly: boolean; includeViewers?: boolean },
): Promise<AdVideoRow[]> {
  await ensure(sql);
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS player_profiles (
        player_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT '',
        bio TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT ''
      )
    `);
  } catch {
    /* */
  }

  const rows = await sql.query<{
    video_id: string;
    label: string;
    duration_sec: number;
    max_display_hours: number;
    active: number;
    sort_order: number;
    created_at: string | null;
    owner_player_id: string | null;
    owner_display_name: string | null;
    claim_once: number | null;
    show_channel: number | null;
    channel_url: string | null;
    channel_name: string | null;
    total_watch_sec: number | null;
    total_claims: number | null;
  }>(
    `SELECT v.video_id, v.label, v.duration_sec, v.max_display_hours, v.active, v.sort_order,
            COALESCE(v.created_at, '') AS created_at,
            COALESCE(v.owner_player_id, '') AS owner_player_id,
            COALESCE(op.display_name, '') AS owner_display_name,
            COALESCE(v.claim_once, 0) AS claim_once,
            COALESCE(v.show_channel, 0) AS show_channel,
            COALESCE(v.channel_url, '') AS channel_url,
            COALESCE(v.channel_name, '') AS channel_name,
            COALESCE(s.total_watch_sec, 0) AS total_watch_sec,
            COALESCE(s.total_claims, 0) AS total_claims
     FROM ad_videos v
     LEFT JOIN ad_video_stats s ON s.video_id = v.video_id
     LEFT JOIN player_profiles op ON op.player_id = v.owner_player_id
     ${opts.activeOnly ? "WHERE v.active = 1" : ""}
     ORDER BY v.sort_order ASC, v.created_at DESC`,
  );

  let viewersByVideo = new Map<string, AdVideoViewer[]>();
  if (opts.includeViewers && rows.length) {
    try {
      // ensure profiles table exists for left join
      try {
        await sql.query(`
          CREATE TABLE IF NOT EXISTS player_profiles (
            player_id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL DEFAULT '',
            bio TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT ''
          )
        `);
      } catch {
        /* */
      }
      const ids = rows.map((r) => r.video_id);
      const vrows = await sql.query<{
        video_id: string;
        player_id: string;
        display_name: string | null;
        watch_sec: number;
        claims: number;
        last_at: string | null;
      }>(
        `SELECT c.video_id,
                c.player_id,
                COALESCE(p.display_name, '') AS display_name,
                COALESCE(MAX(c.watch_sec), 0)::int AS watch_sec,
                COALESCE(SUM(CASE WHEN c.reward > 0 THEN c.reward ELSE 1 END), 0)::int AS claims,
                MAX(c.claimed_at) AS last_at
         FROM ad_watch_claims c
         LEFT JOIN player_profiles p ON p.player_id = c.player_id
         WHERE c.video_id = ANY($1::text[])
         GROUP BY c.video_id, c.player_id, p.display_name`,
        [ids],
      );
      for (const vr of vrows) {
        const vid = String(vr.video_id || "");
        const list = viewersByVideo.get(vid) || [];
        list.push({
          playerId: String(vr.player_id || "").slice(0, 32),
          displayName: String(vr.display_name || "").slice(0, 40),
          watchSec: Math.max(0, Number(vr.watch_sec) || 0),
          claims: Math.max(0, Number(vr.claims) || 0),
          lastClaimedAt: vr.last_at ? String(vr.last_at) : null,
        });
        viewersByVideo.set(vid, list);
      }
      for (const [k, list] of viewersByVideo) {
        list.sort((a, b) => b.watchSec - a.watchSec || b.claims - a.claims);
        viewersByVideo.set(k, list.slice(0, 200));
      }
    } catch (e) {
      console.warn("[media-catalog] viewers query", e);
      viewersByVideo = new Map();
    }
  }

  return rows.map((r) => {
    const maxH = Number(r.max_display_hours) || 0;
    const watch = Number(r.total_watch_sec) || 0;
    const maxSec = maxH > 0 ? Math.floor(maxH * 3600) : null;
    const remaining =
      maxSec == null ? null : Math.max(0, maxSec - watch);
    const exhausted = maxSec != null && watch >= maxSec;
    const viewers = opts.includeViewers
      ? viewersByVideo.get(r.video_id) || []
      : undefined;
    const viewerWatchSum = viewers
      ? viewers.reduce((s, v) => s + v.watchSec, 0)
      : 0;
    const totalWatchSec = Math.max(watch, viewerWatchSum);
    const ownerPlayerId = String(r.owner_player_id || "").slice(0, 32);
    const ownerDisplayName = String(r.owner_display_name || "").slice(0, 40);
    return {
      id: r.video_id,
      label: String(r.label || r.video_id).slice(0, 40),
      durationSec: Math.max(10, Number(r.duration_sec) || 180),
      maxDisplayHours: maxH,
      active: !!r.active && !exhausted,
      sortOrder: Number(r.sort_order) || 0,
      totalWatchSec,
      totalClaims: Number(r.total_claims) || 0,
      remainingDisplaySec: remaining,
      exhausted,
      createdAt: String(r.created_at || ""),
      ownerPlayerId,
      ownerDisplayName,
      ownerKind: ownerPlayerId ? "advertiser" : "platform",
      claimOnce: Number(r.claim_once) !== 0,
      showChannel: Number(r.show_channel) !== 0,
      channelUrl: String(r.channel_url || "").slice(0, 240),
      channelName: String(r.channel_name || "").slice(0, 80),
      viewers,
      viewerCount: viewers ? viewers.length : undefined,
    };
  });
}

function sanitizeInput(v: Record<string, unknown>): {
  id: string;
  label: string;
  durationSec: number;
  maxDisplayHours: number;
  active: boolean;
  sortOrder: number;
  claimOnce: boolean;
  showChannel: boolean;
  channelUrl: string;
  channelName: string;
} | null {
  const id = normalizeVideoId(v.id ?? v.videoId);
  if (id.length < 6) return null;
  return {
    id,
    label: String(v.label || id).slice(0, 40),
    durationSec: Math.max(
      10,
      Math.min(86400, Math.floor(Number(v.durationSec) || 180)),
    ),
    maxDisplayHours: Math.max(
      0,
      Math.min(100000, Number(v.maxDisplayHours) || 0),
    ),
    active:
      v.active === false || v.active === 0 || v.active === "0" ? false : true,
    sortOrder: Math.max(0, Math.floor(Number(v.sortOrder) || 0)),
    claimOnce:
      v.claimOnce === true || v.claimOnce === 1 || v.claimOnce === "1",
    showChannel:
      v.showChannel === true || v.showChannel === 1 || v.showChannel === "1",
    channelUrl: sanitizeYoutubeChannelUrl(v.channelUrl),
    channelName: String(v.channelName || "").trim().slice(0, 80),
  };
}


async function advertiserCreditMap(
  sql: Awaited<ReturnType<typeof getSql>>,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    await sql.query(
      `ALTER TABLE ad_advertisers ADD COLUMN IF NOT EXISTS credit_sec INTEGER NOT NULL DEFAULT 0`,
    );
    await sql.query(
      `UPDATE ad_advertisers
       SET credit_sec = GREATEST(credit_sec, FLOOR(credit_hours * 3600)::int)
       WHERE credit_sec = 0 AND credit_hours > 0`,
    );
    const rows = await sql.query<{ player_id: string; credit_sec: number }>(
      `SELECT player_id, credit_sec FROM ad_advertisers`,
    );
    for (const r of rows) {
      map.set(String(r.player_id), Math.max(0, Number(r.credit_sec) || 0));
    }
  } catch {
    /* */
  }
  return map;
}

export const Route = createFileRoute("/api/share/media-catalog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const admin = u.searchParams.get("admin") === "1";
        const playerId = normalizePlayerId(u.searchParams.get("playerId"));
        try {
          const sql = await getSql();
          if (admin) {
            if (!(await isAdmin(sql, playerId))) {
              return Response.json(
                { ok: false, reason: "forbidden" },
                { status: 403 },
              );
            }
            const videos = await listVideos(sql, {
              activeOnly: false,
              includeViewers: true,
            });
            return Response.json({
              ok: true,
              admin: true,
              videos,
              count: videos.length,
            });
          }
          const all = await listVideos(sql, {
            activeOnly: true,
            includeViewers: false,
          });
          // Hide advertiser videos whose credit_sec is depleted (1 sec watch = 1 credit)
          const creditOk = await advertiserCreditMap(sql);
          const videos = all.filter((v) => {
            if (v.exhausted) return false;
            if (!v.ownerPlayerId) return true; // platform
            return (creditOk.get(v.ownerPlayerId) || 0) > 0;
          });
          return Response.json({
            ok: true,
            admin: false,
            videos: videos.map((v) => ({
              id: v.id,
              label: v.label,
              durationSec: v.durationSec,
              totalWatchSec: v.totalWatchSec,
              createdAt: v.createdAt,
              createdAtMs: v.createdAt ? Date.parse(v.createdAt) || 0 : 0,
              paid: v.ownerKind === "advertiser" && !!v.ownerPlayerId,
              ownerPlayerId: v.ownerPlayerId || undefined,
              claimOnce: !!v.claimOnce,
              showChannel: !!v.showChannel,
              channelUrl: v.showChannel ? v.channelUrl || "" : "",
              channelName: v.showChannel ? v.channelName || "" : "",
            })),
            pickHint: "paid_first_then_new_or_short",
            count: videos.length,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json(
            { ok: false, reason: "db", error: msg },
            { status: 500 },
          );
        }
      },

      POST: async ({ request }) => {
        let body: {
          playerId?: string;
          action?: string;
          video?: Record<string, unknown>;
          videos?: Record<string, unknown>[];
          videoId?: string;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, reason: "bad_json" },
            { status: 400 },
          );
        }
        const playerId = normalizePlayerId(body.playerId);
        const action = String(body.action || "save");
        try {
          const sql = await getSql();
          if (!(await isAdmin(sql, playerId))) {
            return Response.json(
              { ok: false, reason: "forbidden" },
              { status: 403 },
            );
          }
          await ensure(sql);
          const now = new Date().toISOString();

          if (action === "delete") {
            const id = normalizeVideoId(body.videoId || body.video?.id);
            if (id.length < 6) {
              return Response.json(
                { ok: false, reason: "video" },
                { status: 400 },
              );
            }
            await sql.query(`DELETE FROM ad_videos WHERE video_id=$1`, [id]);
            const videos = await listVideos(sql, {
              activeOnly: false,
              includeViewers: true,
            });
            return Response.json({ ok: true, videos, count: videos.length });
          }

          if (action === "replaceAll" && Array.isArray(body.videos)) {
            await sql.query(`DELETE FROM ad_videos`);
            let order = 0;
            for (const raw of body.videos) {
              const v = sanitizeInput(raw || {});
              if (!v) continue;
              if (v.showChannel && !v.channelUrl) {
                const ch = await resolveYoutubeChannel(v.id);
                if (ch) {
                  v.channelUrl = ch.url;
                  v.channelName = v.channelName || ch.name;
                }
              }
              await sql.query(
                `INSERT INTO ad_videos
                   (video_id, label, duration_sec, max_display_hours, active, sort_order, created_at, updated_at, claim_once, show_channel, channel_url, channel_name)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11)`,
                [
                  v.id,
                  v.label,
                  v.durationSec,
                  v.maxDisplayHours,
                  v.active ? 1 : 0,
                  v.sortOrder || order,
                  now,
                  v.claimOnce ? 1 : 0,
                  v.showChannel ? 1 : 0,
                  v.showChannel ? v.channelUrl : "",
                  v.showChannel ? v.channelName : "",
                ],
              );
              order += 1;
            }
            const videos = await listVideos(sql, {
              activeOnly: false,
              includeViewers: true,
            });
            return Response.json({ ok: true, videos, count: videos.length });
          }

          const v = sanitizeInput(body.video || {});
          if (!v) {
            return Response.json(
              { ok: false, reason: "video" },
              { status: 400 },
            );
          }
          if (v.showChannel && !v.channelUrl) {
            const ch = await resolveYoutubeChannel(v.id);
            if (ch) {
              v.channelUrl = ch.url;
              v.channelName = v.channelName || ch.name;
            }
          }
          await sql.query(
            `INSERT INTO ad_videos
               (video_id, label, duration_sec, max_display_hours, active, sort_order, created_at, updated_at, claim_once, show_channel, channel_url, channel_name)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11)
             ON CONFLICT (video_id) DO UPDATE SET
               label = EXCLUDED.label,
               duration_sec = EXCLUDED.duration_sec,
               max_display_hours = EXCLUDED.max_display_hours,
               active = EXCLUDED.active,
               sort_order = EXCLUDED.sort_order,
               updated_at = EXCLUDED.updated_at,
               claim_once = EXCLUDED.claim_once,
               show_channel = EXCLUDED.show_channel,
               channel_url = EXCLUDED.channel_url,
               channel_name = EXCLUDED.channel_name`,
            [
              v.id,
              v.label,
              v.durationSec,
              v.maxDisplayHours,
              v.active ? 1 : 0,
              v.sortOrder,
              now,
              v.claimOnce ? 1 : 0,
              v.showChannel ? 1 : 0,
              v.showChannel ? v.channelUrl : "",
              v.showChannel ? v.channelName : "",
            ],
          );
          const videos = await listVideos(sql, {
            activeOnly: false,
            includeViewers: true,
          });
          return Response.json({
            ok: true,
            videos,
            count: videos.length,
            saved: v.id,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[media-catalog]", msg);
          return Response.json(
            { ok: false, reason: "db", error: msg },
            { status: 500 },
          );
        }
      },
    },
  },
});

// silence unused helper warning in some builds
void formatWatchHuman;
