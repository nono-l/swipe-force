/**
 * JPDOC: 外部ID連携。プレイ時間と作成日時も保存。
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { auth, authConfigured } from "@/lib/auth/server";
import { sanitizeFanMessage } from "@/lib/sanitize-message";

function makePlayerId(userId: string): string {
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const base = (clean || "user").slice(0, 20);
  return `u${base}`.slice(0, 32);
}

async function sessionUser(request: Request) {
  if (!authConfigured) return null;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return null;
    return session.user as {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } catch {
    return null;
  }
}

const UP_KEYS = [
  "shot",
  "rate",
  "speed",
  "power",
  "option",
  "lockon",
  "missile",
  "particle",
  "hyper",
  "cluster",
  "overdrive",
  "beam",
  "flame",
] as const;

type UpMap = Record<(typeof UP_KEYS)[number], number>;

function parseUpgrades(raw: unknown): UpMap {
  const empty = Object.fromEntries(UP_KEYS.map((k) => [k, 0])) as UpMap;
  if (!raw || typeof raw !== "object") return empty;
  const o = raw as Record<string, unknown>;
  for (const k of UP_KEYS) {
    const n = Number(o[k]);
    empty[k] = Number.isFinite(n) ? Math.max(0, Math.min(99, n | 0)) : 0;
  }
  return empty;
}

function mergeUpgrades(a: UpMap, b: UpMap): UpMap {
  const out = { ...a };
  for (const k of UP_KEYS) out[k] = Math.max(a[k] || 0, b[k] || 0);
  return out;
}

type Msg = {
  id: string;
  from: string;
  body: string;
  at?: string;
  shareId?: string;
  source?: string;
  canThanks?: boolean;
  thanksSent?: boolean;
};

function parseInbox(raw: unknown): Msg[] {
  if (!Array.isArray(raw)) return [];
  const out: Msg[] = [];
  for (const item of raw.slice(0, 200)) {
    if (!item || typeof item !== "object") continue;
    const m = item as Record<string, unknown>;
    const id = String(m.id || "").slice(0, 64);
    const from = String(m.from || "")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 32);
    const bodyRaw = sanitizeFanMessage(m.body);
    if (!id || !from || !bodyRaw.ok) continue;
    out.push({
      id,
      from,
      body: bodyRaw.text,
      at: typeof m.at === "string" ? m.at.slice(0, 40) : undefined,
      shareId:
        typeof m.shareId === "string"
          ? m.shareId.replace(/[^a-z0-9]/gi, "").slice(0, 32)
          : undefined,
      source: m.source === "thanks" ? "thanks" : "mission",
      canThanks: m.source === "thanks" ? false : m.canThanks !== false,
      thanksSent: !!m.thanksSent || m.source === "thanks",
    });
  }
  return out;
}

function mergeInbox(a: Msg[], b: Msg[]): Msg[] {
  const map = new Map<string, Msg>();
  for (const m of [...a, ...b]) {
    const prev = map.get(m.id);
    if (!prev) map.set(m.id, m);
    else {
      map.set(m.id, {
        ...prev,
        ...m,
        thanksSent: prev.thanksSent || m.thanksSent,
        canThanks: prev.source === "thanks" || m.source === "thanks" ? false : prev.canThanks !== false && m.canThanks !== false,
      });
    }
  }
  return [...map.values()].slice(0, 200);
}

type StatsSnap = {
  playTimeSec: number;
  helpAsked: number;
  helpReceived: number;
  maxStageEasy: number;
  maxStageNormal: number;
  runs: number;
  totalKills: number;
  bossesDefeated: number;
  continuesUsed: number;
  hiScore: number;
  lastPlayedAt: string;
};

function emptyStats(): StatsSnap {
  return {
    playTimeSec: 0,
    helpAsked: 0,
    helpReceived: 0,
    maxStageEasy: 0,
    maxStageNormal: 0,
    runs: 0,
    totalKills: 0,
    bossesDefeated: 0,
    continuesUsed: 0,
    hiScore: 0,
    lastPlayedAt: "",
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function parseStats(raw: unknown, playTimeFallback = 0): StatsSnap {
  const base = emptyStats();
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  base.playTimeSec = clamp(
    Number(o.playTimeSec ?? playTimeFallback) || 0,
    0,
    1e9,
  );
  base.helpAsked = clamp(Number(o.helpAsked) || 0, 0, 1e7);
  base.helpReceived = clamp(Number(o.helpReceived) || 0, 0, 1e7);
  base.maxStageEasy = clamp(Number(o.maxStageEasy) || 0, 0, 999);
  base.maxStageNormal = clamp(Number(o.maxStageNormal) || 0, 0, 999);
  base.runs = clamp(Number(o.runs) || 0, 0, 1e7);
  base.totalKills = clamp(Number(o.totalKills) || 0, 0, 1e9);
  base.bossesDefeated = clamp(Number(o.bossesDefeated) || 0, 0, 1e7);
  base.continuesUsed = clamp(Number(o.continuesUsed) || 0, 0, 1e7);
  base.hiScore = clamp(Number(o.hiScore) || 0, 0, 1e12);
  base.lastPlayedAt = String(o.lastPlayedAt || "").slice(0, 40);
  return base;
}

function mergeStats(a: StatsSnap, b: StatsSnap): StatsSnap {
  const lastA = a.lastPlayedAt || "";
  const lastB = b.lastPlayedAt || "";
  return {
    playTimeSec: Math.max(a.playTimeSec, b.playTimeSec),
    helpAsked: Math.max(a.helpAsked, b.helpAsked),
    helpReceived: Math.max(a.helpReceived, b.helpReceived),
    maxStageEasy: Math.max(a.maxStageEasy, b.maxStageEasy),
    maxStageNormal: Math.max(a.maxStageNormal, b.maxStageNormal),
    runs: Math.max(a.runs, b.runs),
    totalKills: Math.max(a.totalKills, b.totalKills),
    bossesDefeated: Math.max(a.bossesDefeated, b.bossesDefeated),
    continuesUsed: Math.max(a.continuesUsed, b.continuesUsed),
    hiScore: Math.max(a.hiScore, b.hiScore),
    lastPlayedAt: lastA >= lastB ? lastA : lastB,
  };
}

async function ensureSaveColumns(sql: Awaited<ReturnType<typeof getSql>>) {
  try {
    await sql.query(
      `ALTER TABLE account_save ADD COLUMN IF NOT EXISTS play_time_sec INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE account_save ADD COLUMN IF NOT EXISTS stats_json TEXT NOT NULL DEFAULT '{}'`,
    );
  } catch {
    /* */
  }
}

async function ensurePlayerColumns(sql: Awaited<ReturnType<typeof getSql>>) {
  try {
    await sql.query(
      `ALTER TABLE account_players ADD COLUMN IF NOT EXISTS created_at TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* */
  }
}

async function ensurePlayer(sql: Awaited<ReturnType<typeof getSql>>, user: { id: string; name?: string | null }, playerId: string) {
  await ensurePlayerColumns(sql);
  const now = new Date().toISOString();
  await sql.query(
    `INSERT INTO account_players (user_id, player_id, display_name, linked_at, created_at)
     VALUES ($1,$2,$3,$4,$4)
     ON CONFLICT (user_id) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       player_id = COALESCE(NULLIF(account_players.player_id, ''), EXCLUDED.player_id),
       linked_at = CASE
         WHEN account_players.linked_at IS NULL OR account_players.linked_at = ''
         THEN EXCLUDED.linked_at ELSE account_players.linked_at END,
       created_at = CASE
         WHEN account_players.created_at IS NULL OR account_players.created_at = ''
         THEN EXCLUDED.created_at ELSE account_players.created_at END`,
    [user.id, playerId, user.name ?? null, now],
  );
  await sql.query(
    `INSERT INTO continue_coins (player_id, coins) VALUES ($1, 0)
     ON CONFLICT (player_id) DO NOTHING`,
    [playerId],
  );
  await ensureSaveColumns(sql);
  await sql.query(
    `INSERT INTO account_save (player_id, easy_upgrades, inbox_json, play_time_sec, stats_json)
     VALUES ($1, '{}', '[]', 0, '{}')
     ON CONFLICT (player_id) DO NOTHING`,
    [playerId],
  );
}

function earliestIso(a: string, b: string): string {
  const ta = Date.parse(a || "");
  const tb = Date.parse(b || "");
  if (!Number.isFinite(ta) && !Number.isFinite(tb)) return "";
  if (!Number.isFinite(ta)) return b.slice(0, 40);
  if (!Number.isFinite(tb)) return a.slice(0, 40);
  return ta <= tb ? a.slice(0, 40) : b.slice(0, 40);
}

async function reassignMessages(
  sql: Awaited<ReturnType<typeof getSql>>,
  guestId: string,
  playerId: string,
) {
  if (!guestId || guestId === playerId) return;
  try {
    await sql.query(`UPDATE share_messages_v2 SET sharer_id=$1 WHERE sharer_id=$2`, [
      playerId,
      guestId,
    ]);
  } catch {
    /* table may miss */
  }
  try {
    await sql.query(`UPDATE share_thanks SET to_id=$1 WHERE to_id=$2`, [playerId, guestId]);
  } catch {
    /* ignore */
  }
  try {
    await sql.query(`UPDATE share_thanks SET from_id=$1 WHERE from_id=$2`, [playerId, guestId]);
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/api/account/link")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user) return Response.json({ linked: false, user: null });
        const playerId = makePlayerId(user.id);
        try {
          const sql = await getSql();
          await ensurePlayer(sql, user, playerId);
          const bal = await sql.query<{ coins: number }>(
            `SELECT coins FROM continue_coins WHERE player_id=$1`,
            [playerId],
          );
          const ap = await sql.query<{ created_at: string; linked_at: string }>(
            `SELECT COALESCE(created_at, '') AS created_at,
                    COALESCE(linked_at, '') AS linked_at
             FROM account_players WHERE player_id=$1 OR user_id=$2 LIMIT 1`,
            [playerId, user.id],
          );
          const idCreatedAt =
            earliestIso(ap[0]?.created_at || "", ap[0]?.linked_at || "") ||
            "";
          const save = await sql.query<{
            easy_upgrades: string;
            inbox_json: string;
            play_time_sec: number;
            stats_json: string;
          }>(
            `SELECT easy_upgrades, inbox_json,
                    COALESCE(play_time_sec, 0) AS play_time_sec,
                    COALESCE(stats_json, '{}') AS stats_json
             FROM account_save WHERE player_id=$1`,
            [playerId],
          );
          let easyUpgrades: UpMap = parseUpgrades({});
          let inbox: Msg[] = [];
          let stats = emptyStats();
          try {
            easyUpgrades = parseUpgrades(JSON.parse(save[0]?.easy_upgrades || "{}"));
          } catch {
            /* empty */
          }
          try {
            inbox = parseInbox(JSON.parse(save[0]?.inbox_json || "[]"));
          } catch {
            /* empty */
          }
          try {
            stats = parseStats(
              JSON.parse(save[0]?.stats_json || "{}"),
              Number(save[0]?.play_time_sec) || 0,
            );
            stats.playTimeSec = Math.max(
              stats.playTimeSec,
              Number(save[0]?.play_time_sec) || 0,
            );
          } catch {
            stats = parseStats({}, Number(save[0]?.play_time_sec) || 0);
          }
          return Response.json({
            linked: true,
            user: {
              id: user.id,
              name: user.name ?? null,
              email: user.email ?? null,
              image: user.image ?? null,
            },
            playerId,
            coins: Number(bal[0]?.coins) || 0,
            easyUpgrades,
            inbox,
            playTimeSec: stats.playTimeSec,
            stats,
            idCreatedAt,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({
            linked: true,
            offline: true,
            error: msg,
            user: {
              id: user.id,
              name: user.name ?? null,
              email: user.email ?? null,
              image: user.image ?? null,
            },
            playerId,
            coins: 0,
            easyUpgrades: parseUpgrades({}),
            inbox: [],
            playTimeSec: 0,
            stats: emptyStats(),
            idCreatedAt: "",
          });
        }
      },

      POST: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user) {
          return Response.json({ ok: false, reason: "auth" }, { status: 401 });
        }
        let body: {
          guestPlayerId?: string;
          guestCoins?: number;
          easyUpgrades?: unknown;
          inbox?: unknown;
          playTimeSec?: number;
          stats?: unknown;
          idCreatedAt?: string;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const guestPlayerId = String(body.guestPlayerId || "")
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 32);
        const guestCoins = Math.max(0, Math.min(9999, Number(body.guestCoins) || 0));
        const guestUp = parseUpgrades(body.easyUpgrades);
        const guestInbox = parseInbox(body.inbox);
        const guestStats = parseStats(body.stats, Number(body.playTimeSec) || 0);
        if (body.playTimeSec != null) {
          guestStats.playTimeSec = Math.max(
            guestStats.playTimeSec,
            clamp(Number(body.playTimeSec) || 0, 0, 1e9),
          );
        }
        const playerId = makePlayerId(user.id);

        try {
          const sql = await getSql();
          await ensurePlayer(sql, user, playerId);

          // coins: account + guest
          const existing = await sql.query<{ coins: number }>(
            `SELECT coins FROM continue_coins WHERE player_id=$1`,
            [playerId],
          );
          let coins = Number(existing[0]?.coins) || 0;
          if (guestPlayerId && guestPlayerId !== playerId && guestCoins > 0) {
            coins += guestCoins;
            await sql.query(`UPDATE continue_coins SET coins = 0 WHERE player_id=$1`, [
              guestPlayerId,
            ]);
          }
          await sql.query(
            `INSERT INTO continue_coins (player_id, coins) VALUES ($1, $2)
             ON CONFLICT (player_id) DO UPDATE SET coins = $2`,
            [playerId, coins],
          );

          // easy upgrades + inbox + stats: max-merge
          const save = await sql.query<{
            easy_upgrades: string;
            inbox_json: string;
            play_time_sec: number;
            stats_json: string;
          }>(
            `SELECT easy_upgrades, inbox_json,
                    COALESCE(play_time_sec, 0) AS play_time_sec,
                    COALESCE(stats_json, '{}') AS stats_json
             FROM account_save WHERE player_id=$1`,
            [playerId],
          );
          let cloudUp = parseUpgrades({});
          let cloudInbox: Msg[] = [];
          let cloudStats = emptyStats();
          try {
            cloudUp = parseUpgrades(JSON.parse(save[0]?.easy_upgrades || "{}"));
          } catch {
            /* */
          }
          try {
            cloudInbox = parseInbox(JSON.parse(save[0]?.inbox_json || "[]"));
          } catch {
            /* */
          }
          try {
            cloudStats = parseStats(
              JSON.parse(save[0]?.stats_json || "{}"),
              Number(save[0]?.play_time_sec) || 0,
            );
            cloudStats.playTimeSec = Math.max(
              cloudStats.playTimeSec,
              Number(save[0]?.play_time_sec) || 0,
            );
          } catch {
            cloudStats = parseStats({}, Number(save[0]?.play_time_sec) || 0);
          }
          const easyUpgrades = mergeUpgrades(cloudUp, guestUp);
          const inbox = mergeInbox(cloudInbox, guestInbox);
          const stats = mergeStats(cloudStats, guestStats);

          await sql.query(
            `INSERT INTO account_save (player_id, easy_upgrades, inbox_json, play_time_sec, stats_json, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (player_id) DO UPDATE
             SET easy_upgrades = $2, inbox_json = $3, play_time_sec = $4, stats_json = $5, updated_at = $6`,
            [
              playerId,
              JSON.stringify(easyUpgrades),
              JSON.stringify(inbox),
              stats.playTimeSec | 0,
              JSON.stringify(stats),
              new Date().toISOString(),
            ],
          );

          // ID creation time: keep earliest of cloud / guest
          const guestCreated = String(body.idCreatedAt || "").slice(0, 40);
          const ap = await sql.query<{ created_at: string }>(
            `SELECT COALESCE(created_at, '') AS created_at FROM account_players WHERE user_id=$1`,
            [user.id],
          );
          const mergedCreated = earliestIso(ap[0]?.created_at || "", guestCreated);
          if (mergedCreated) {
            await sql.query(
              `UPDATE account_players SET created_at = $2
               WHERE user_id = $1
                 AND (created_at IS NULL OR created_at = '' OR created_at > $2)`,
              [user.id, mergedCreated],
            );
          }
          const ap2 = await sql.query<{ created_at: string }>(
            `SELECT COALESCE(created_at, '') AS created_at FROM account_players WHERE user_id=$1`,
            [user.id],
          );
          const idCreatedAt = ap2[0]?.created_at || mergedCreated || "";

          // re-point live message tables guest → account
          await reassignMessages(sql, guestPlayerId, playerId);

          return Response.json({
            ok: true,
            playerId,
            coins,
            easyUpgrades,
            inbox,
            playTimeSec: stats.playTimeSec,
            stats,
            idCreatedAt,
            user: { id: user.id, name: user.name ?? null },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({
            ok: true,
            offline: true,
            playerId,
            coins: guestCoins,
            easyUpgrades: guestUp,
            inbox: guestInbox,
            playTimeSec: guestStats.playTimeSec,
            stats: guestStats,
            idCreatedAt: String(body.idCreatedAt || "").slice(0, 40),
            error: msg,
            user: { id: user.id, name: user.name ?? null },
          });
        }
      },
    },
  },
});

