/**
 * Advertiser portal API — manage own ad videos with prepaid credit.
 *
 * GET  ?playerId=
 * POST { playerId, action: "save"|"delete", video? , videoId? }
 *
 * Budget: credit_hours on ad_advertisers.
 * Assigned: SUM(max_display_hours) of owned active videos.
 * Remaining free to assign = credit - assigned.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";


const SUPER_ADMIN_PLAYER_ID = "uzwdbubkeggsdico0kgho";

async function isAdmin(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
): Promise<boolean> {
  const id = normalizePlayerId(playerId);
  if (!id) return false;
  if (id === SUPER_ADMIN_PLAYER_ID) return true;
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS game_admins (
        player_id TEXT PRIMARY KEY,
        label TEXT NOT NULL DEFAULT '',
        appointed_by TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    const rows = await sql.query(
      `SELECT 1 AS n FROM game_admins WHERE player_id=$1 LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

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
      return (u.pathname.split("/").filter(Boolean)[0] || "")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 20);
    }
    if (host.includes("youtube")) {
      const v = u.searchParams.get("v");
      if (v) return v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20);
      const parts = u.pathname.split("/").filter(Boolean);
      for (let i = 0; i < parts.length; i++) {
        if (
          ["embed", "live", "shorts", "v", "e"].includes(
            (parts[i] || "").toLowerCase(),
          ) &&
          parts[i + 1]
        ) {
          return String(parts[i + 1])
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .slice(0, 20);
        }
      }
    }
  } catch {
    /* */
  }
  const m = s.match(/(?:v=|youtu\.be\/|live\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,20})/);
  return m?.[1]?.slice(0, 20) || "";
}

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
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  try {
    await sql.query(
      `ALTER TABLE ad_videos ADD COLUMN IF NOT EXISTS owner_player_id TEXT NOT NULL DEFAULT ''`,
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
    CREATE TABLE IF NOT EXISTS ad_advertisers (
      player_id TEXT PRIMARY KEY,
      credit_hours REAL NOT NULL DEFAULT 0,
      total_credited REAL NOT NULL DEFAULT 0,
      credit_sec INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  try {
    await sql.query(
      `ALTER TABLE ad_advertisers ADD COLUMN IF NOT EXISTS credit_sec INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* */
  }
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
  } catch {
    /* */
  }
}

async function getBalance(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
) {
  try {
    await sql.query(
      `ALTER TABLE ad_advertisers ADD COLUMN IF NOT EXISTS credit_sec INTEGER NOT NULL DEFAULT 0`,
    );
    await sql.query(
      `UPDATE ad_advertisers
       SET credit_sec = GREATEST(credit_sec, FLOOR(credit_hours * 3600)::int)
       WHERE player_id=$1 AND credit_sec = 0 AND credit_hours > 0`,
      [playerId],
    );
  } catch {
    /* */
  }
  const rows = await sql.query<{
    credit_hours: number;
    total_credited: number;
    credit_sec: number;
  }>(
    `SELECT credit_hours, total_credited, COALESCE(credit_sec, 0) AS credit_sec
     FROM ad_advertisers WHERE player_id=$1`,
    [playerId],
  );
  const creditSec = Math.max(0, Number(rows[0]?.credit_sec) || 0);
  return {
    creditHours: creditSec > 0 ? creditSec / 3600 : Number(rows[0]?.credit_hours) || 0,
    creditSec,
    totalCredited: Number(rows[0]?.total_credited) || 0,
  };
}

async function listMine(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
) {
  const rows = await sql.query<{
    video_id: string;
    label: string;
    duration_sec: number;
    max_display_hours: number;
    active: number;
    total_watch_sec: number | null;
    total_claims: number | null;
  }>(
    `SELECT v.video_id, v.label, v.duration_sec, v.max_display_hours, v.active,
            COALESCE(s.total_watch_sec, 0) AS total_watch_sec,
            COALESCE(s.total_claims, 0) AS total_claims
     FROM ad_videos v
     LEFT JOIN ad_video_stats s ON s.video_id = v.video_id
     WHERE v.owner_player_id = $1
     ORDER BY v.updated_at DESC`,
    [playerId],
  );

  // per-video viewer summary (count + total max watch)
  const vids = rows.map((r) => r.video_id);
  let viewerCounts = new Map<string, number>();
  if (vids.length) {
    try {
      const vc = await sql.query<{ video_id: string; n: number }>(
        `SELECT video_id, COUNT(DISTINCT player_id)::int AS n
         FROM ad_watch_claims WHERE video_id = ANY($1::text[])
         GROUP BY video_id`,
        [vids],
      );
      for (const r of vc) viewerCounts.set(r.video_id, Number(r.n) || 0);
    } catch {
      viewerCounts = new Map();
    }
  }

  return rows.map((r) => {
    const maxH = Number(r.max_display_hours) || 0;
    const watch = Number(r.total_watch_sec) || 0;
    const exhausted = maxH > 0 && watch >= maxH * 3600;
    return {
      id: r.video_id,
      label: String(r.label || r.video_id).slice(0, 40),
      durationSec: Math.max(10, Number(r.duration_sec) || 180),
      maxDisplayHours: maxH,
      active: !!r.active && !exhausted,
      exhausted,
      totalWatchSec: watch,
      totalClaims: Number(r.total_claims) || 0,
      viewerCount: viewerCounts.get(r.video_id) || 0,
      remainingDisplaySec:
        maxH > 0 ? Math.max(0, Math.floor(maxH * 3600) - watch) : null,
    };
  });
}


async function listAll(sql: Awaited<ReturnType<typeof getSql>>) {
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
    owner_player_id: string | null;
    owner_display_name: string | null;
    total_watch_sec: number | null;
    total_claims: number | null;
  }>(
    `SELECT v.video_id, v.label, v.duration_sec, v.max_display_hours, v.active,
            COALESCE(v.owner_player_id, '') AS owner_player_id,
            COALESCE(p.display_name, '') AS owner_display_name,
            COALESCE(s.total_watch_sec, 0) AS total_watch_sec,
            COALESCE(s.total_claims, 0) AS total_claims
     FROM ad_videos v
     LEFT JOIN ad_video_stats s ON s.video_id = v.video_id
     LEFT JOIN player_profiles p ON p.player_id = v.owner_player_id
     ORDER BY v.updated_at DESC`,
  );
  const vids = rows.map((r) => r.video_id);
  let viewerCounts = new Map<string, number>();
  if (vids.length) {
    try {
      const vc = await sql.query<{ video_id: string; n: number }>(
        `SELECT video_id, COUNT(DISTINCT player_id)::int AS n
         FROM ad_watch_claims WHERE video_id = ANY($1::text[])
         GROUP BY video_id`,
        [vids],
      );
      for (const r of vc) viewerCounts.set(r.video_id, Number(r.n) || 0);
    } catch {
      viewerCounts = new Map();
    }
  }
  return rows.map((r) => {
    const maxH = Number(r.max_display_hours) || 0;
    const watch = Number(r.total_watch_sec) || 0;
    const exhausted = maxH > 0 && watch >= maxH * 3600;
    const ownerPlayerId = String(r.owner_player_id || "").slice(0, 32);
    return {
      id: r.video_id,
      label: String(r.label || r.video_id).slice(0, 40),
      durationSec: Math.max(10, Number(r.duration_sec) || 180),
      maxDisplayHours: maxH,
      active: !!r.active && !exhausted,
      exhausted,
      totalWatchSec: watch,
      totalClaims: Number(r.total_claims) || 0,
      viewerCount: viewerCounts.get(r.video_id) || 0,
      remainingDisplaySec:
        maxH > 0 ? Math.max(0, Math.floor(maxH * 3600) - watch) : null,
      ownerPlayerId,
      ownerDisplayName: String(r.owner_display_name || "").slice(0, 40),
      ownerKind: (ownerPlayerId ? "advertiser" : "platform") as
        | "advertiser"
        | "platform",
    };
  });
}

function assignedHours(videos: { maxDisplayHours: number; active: boolean }[]) {
  return videos
    .filter((v) => v.active)
    .reduce((s, v) => s + (Number(v.maxDisplayHours) || 0), 0);
}

export const Route = createFileRoute("/api/share/ad-advertiser")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const playerId = normalizePlayerId(u.searchParams.get("playerId"));
        const wantAll = u.searchParams.get("all") === "1";
        if (!playerId) {
          return Response.json({ ok: false, reason: "player" }, { status: 400 });
        }
        try {
          const sql = await getSql();
          await ensure(sql);
          const admin = await isAdmin(sql, playerId);
          const bal = await getBalance(sql, playerId);
          const videos = await listMine(sql, playerId);
          const assigned = assignedHours(videos);
          let allVideos: Awaited<ReturnType<typeof listAll>> | undefined;
          if (admin && wantAll) {
            allVideos = await listAll(sql);
          }
          return Response.json({
            ok: true,
            playerId,
            scope: admin && wantAll ? "admin_all" : "owned_only",
            isAdmin: admin,
            balance: bal,
            assignedHours: assigned,
            freeHours: Math.max(0, bal.creditHours - assigned),
            isAdvertiser: bal.totalCredited > 0 || videos.length > 0,
            videos,
            allVideos: allVideos || undefined,
            allCount: allVideos ? allVideos.length : undefined,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        let body: {
          playerId?: string;
          action?: string;
          videoId?: string;
          video?: {
            id?: string;
            label?: string;
            durationSec?: number;
            maxDisplayHours?: number;
            active?: boolean;
          };
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const playerId = normalizePlayerId(body.playerId);
        const action = String(body.action || "save");
        if (!playerId) {
          return Response.json({ ok: false, reason: "player" }, { status: 400 });
        }
        try {
          const sql = await getSql();
          await ensure(sql);
          const bal = await getBalance(sql, playerId);
          const now = new Date().toISOString();

          if (action === "delete") {
            const id = parseYouTubeVideoId(body.videoId || body.video?.id);
            if (id.length < 6) {
              return Response.json({ ok: false, reason: "video" }, { status: 400 });
            }
            const own = await sql.query(
              `SELECT 1 AS n FROM ad_videos WHERE video_id=$1 AND owner_player_id=$2`,
              [id, playerId],
            );
            if (!own.length) {
              return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
            }
            await sql.query(`DELETE FROM ad_videos WHERE video_id=$1`, [id]);
            const videos = await listMine(sql, playerId);
            const assigned = assignedHours(videos);
            return Response.json({
              ok: true,
              videos,
              balance: bal,
              assignedHours: assigned,
              freeHours: Math.max(0, bal.creditHours - assigned),
            });
          }

          // save
          if (bal.totalCredited <= 0 && bal.creditHours <= 0) {
            // allow if already has videos (edge) but new advertisers need prepaid
            const existing = await listMine(sql, playerId);
            if (!existing.length) {
              return Response.json(
                { ok: false, reason: "no_credit", message: "プリペイドコードを登録してください" },
                { status: 403 },
              );
            }
          }

          const raw = body.video || {};
          const id = parseYouTubeVideoId(raw.id);
          if (id.length < 6) {
            return Response.json({ ok: false, reason: "video" }, { status: 400 });
          }
          const label = String(raw.label || id).slice(0, 40);
          const durationSec = Math.max(
            10,
            Math.min(86400, Math.floor(Number(raw.durationSec) || 180)),
          );
          const maxDisplayHours = Math.max(
            0.1,
            Math.min(100000, Number(raw.maxDisplayHours) || 1),
          );
          const active =
            raw.active === false || raw.active === 0 ? false : true;

          // ownership check if exists
          const exist = await sql.query<{ owner_player_id: string }>(
            `SELECT owner_player_id FROM ad_videos WHERE video_id=$1`,
            [id],
          );
          if (exist[0] && String(exist[0].owner_player_id || "") !== playerId) {
            // platform/admin video or other advertiser
            if (String(exist[0].owner_player_id || "") !== "") {
              return Response.json(
                { ok: false, reason: "taken", message: "この動画は他の広告主のものです" },
                { status: 403 },
              );
            }
            return Response.json(
              { ok: false, reason: "taken", message: "この動画は運営登録済みです" },
              { status: 403 },
            );
          }

          // budget: sum other owned videos + this one
          const mine = await listMine(sql, playerId);
          const others = mine
            .filter((v) => v.id !== id && v.active)
            .reduce((s, v) => s + v.maxDisplayHours, 0);
          const need = others + (active ? maxDisplayHours : 0);
          if (need > bal.creditHours + 1e-6) {
            return Response.json(
              {
                ok: false,
                reason: "budget",
                message: `表示時間の予算不足（必要 ${need.toFixed(1)}h / 所持 ${bal.creditHours.toFixed(1)}h）`,
                freeHours: Math.max(0, bal.creditHours - others),
              },
              { status: 400 },
            );
          }

          await sql.query(
            `INSERT INTO ad_videos
               (video_id, label, duration_sec, max_display_hours, active, sort_order, created_at, updated_at, owner_player_id)
             VALUES ($1,$2,$3,$4,$5,100,$6,$6,$7)
             ON CONFLICT (video_id) DO UPDATE SET
               label = EXCLUDED.label,
               duration_sec = EXCLUDED.duration_sec,
               max_display_hours = EXCLUDED.max_display_hours,
               active = EXCLUDED.active,
               updated_at = EXCLUDED.updated_at,
               owner_player_id = EXCLUDED.owner_player_id`,
            [
              id,
              label,
              durationSec,
              maxDisplayHours,
              active ? 1 : 0,
              now,
              playerId,
            ],
          );

          const videos = await listMine(sql, playerId);
          const assigned = assignedHours(videos);
          return Response.json({
            ok: true,
            saved: id,
            videos,
            balance: bal,
            assignedHours: assigned,
            freeHours: Math.max(0, bal.creditHours - assigned),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[ad-advertiser]", msg);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
