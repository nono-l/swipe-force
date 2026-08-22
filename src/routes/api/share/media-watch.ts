/**
 * JPDOC: 視聴の請求。時が変われば時間上限リセット。1秒=1クレジット。
 */
/**
 * Ad-watch continue-coin claims + advertiser credit billing.
 *
 * 1 watched second = 1 ad credit (owner ads only; platform free).
 * Cap: 4 coins / JST clock hour.
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const HOURLY_MAX = 4;
const MAX_SEC = 60;
const FLOOR_SEC = 10;
const LONG_START = 5 * 60;
const HOUR_SEC = 60 * 60;
const QUARTER_SEC = 15 * 60;
const QUARTER_REWARD = 1;
const JST_OFFSET_MS = 9 * 3600 * 1000;

function jstHourStartMs(now = Date.now()): number {
  const jst = new Date(now + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();
  const h = jst.getUTCHours();
  return Date.UTC(y, m, d, h, 0, 0, 0) - JST_OFFSET_MS;
}

function jstHourStartIso(now = Date.now()): string {
  return new Date(jstHourStartMs(now)).toISOString();
}

function msUntilNextJstHour(now = Date.now()): number {
  return Math.max(0, jstHourStartMs(now) + 3600 * 1000 - now);
}

function jstHourLabel(now = Date.now()): string {
  const jst = new Date(now + JST_OFFSET_MS);
  return `${jst.getUTCHours()}時台`;
}

function jstHourKey(now = Date.now()): string {
  const jst = new Date(now + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const h = String(jst.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}`;
}

function normalizeId(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
}

function normalizeVideo(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 20);
}

type Milestone = { at: number; reward: number };

function firstNeed(dur: number): number {
  return Math.min(MAX_SEC, Math.max(FLOOR_SEC, Math.floor(dur) || MAX_SEC));
}

function unlockedNow(
  durationSec: number,
  watchSec: number,
  already: Set<number>,
): Milestone[] {
  const ms = milestones(durationSec);
  const first = ms[0]?.at || MAX_SEC;
  const out = ms.filter((m) => watchSec >= m.at && !already.has(m.at));
  const ladderLeft = ms.some((m) => !already.has(m.at));
  if (ladderLeft) return out;
  let last = 0;
  for (const m of ms) last = Math.max(last, m.at);
  for (const a of already) last = Math.max(last, a);
  let at = last + first;
  while (at <= watchSec) {
    if (!already.has(at)) out.push({ at, reward: 1 });
    at += first;
  }
  return out;
}

function milestones(durationSec: number): Milestone[] {
  const dur = Math.max(0, Math.floor(durationSec) || 0);
  const out: Milestone[] = [];
  if (dur <= 0) return out;
  const first = firstNeed(dur);
  out.push({ at: first, reward: 1 });
  if (dur >= LONG_START) {
    let t = LONG_START;
    for (let i = 0; i < 8 && t < HOUR_SEC && t <= dur; i++) {
      if (t > first) out.push({ at: t, reward: 1 });
      t *= 2;
    }
  }
  if (dur >= HOUR_SEC) {
    for (let at = HOUR_SEC, n = 0; at <= dur && n < 48; at += QUARTER_SEC, n++) {
      if (!out.some((m) => m.at === at)) {
        out.push({ at, reward: QUARTER_REWARD });
      }
    }
  }
  return out;
}

async function ensureTables(sql: Awaited<ReturnType<typeof getSql>>) {
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
  try {
    await sql.query(
      `ALTER TABLE ad_watch_claims ADD COLUMN IF NOT EXISTS milestone_sec INTEGER NOT NULL DEFAULT 0`,
    );
    await sql.query(
      `ALTER TABLE ad_watch_claims ADD COLUMN IF NOT EXISTS reward INTEGER NOT NULL DEFAULT 1`,
    );
  } catch {
    /* */
  }
  await sql.query(`
    CREATE TABLE IF NOT EXISTS continue_coins (
      player_id TEXT PRIMARY KEY,
      coins INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_watch_player (
      player_id TEXT PRIMARY KEY,
      last_claimed_at TEXT NOT NULL DEFAULT '',
      last_video_id TEXT NOT NULL DEFAULT '',
      last_watch_sec INTEGER NOT NULL DEFAULT 0,
      total_watch_sec INTEGER NOT NULL DEFAULT 0,
      hour_key TEXT NOT NULL DEFAULT '',
      hour_coins INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  try {
    await sql.query(
      `ALTER TABLE ad_watch_player ADD COLUMN IF NOT EXISTS total_watch_sec INTEGER NOT NULL DEFAULT 0`,
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
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_watch_billing (
      player_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      billed_sec INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (player_id, video_id)
    )
  `);
}

async function loadVideoDurations(
  sql: Awaited<ReturnType<typeof getSql>>,
): Promise<Record<string, number>> {
  try {
    const rows = await sql.query<{ video_id: string; duration_sec: number }>(
      `SELECT video_id, duration_sec FROM ad_videos WHERE active = 1`,
    );
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.video_id] = Math.max(10, Number(r.duration_sec) || 180);
    }
    return map;
  } catch {
    return {};
  }
}

function durationOf(videoId: string, map: Record<string, number>): number {
  return map[videoId] ?? 0;
}

/**
 * 1 watched second = 1 ad credit.
 * Platform ads (no owner) are free.
 */
async function consumeAdvertiserCredits(
  sql: Awaited<ReturnType<typeof getSql>>,
  videoId: string,
  seconds: number,
  nowIso: string,
): Promise<number> {
  const sec = Math.max(0, Math.floor(seconds) || 0);
  if (!sec) return 0;
  const own = await sql.query<{ owner_player_id: string }>(
    `SELECT COALESCE(owner_player_id, '') AS owner_player_id FROM ad_videos WHERE video_id=$1`,
    [videoId],
  );
  const owner = String(own[0]?.owner_player_id || "").slice(0, 32);
  if (!owner) return 0;

  await sql.query(
    `UPDATE ad_advertisers
     SET credit_sec = GREATEST(credit_sec, FLOOR(credit_hours * 3600)::int)
     WHERE player_id=$1 AND credit_sec = 0 AND credit_hours > 0`,
    [owner],
  );

  const before = await sql.query<{ credit_sec: number }>(
    `SELECT COALESCE(credit_sec, 0)::int AS credit_sec FROM ad_advertisers WHERE player_id=$1`,
    [owner],
  );
  const bal = Math.max(0, Number(before[0]?.credit_sec) || 0);
  if (bal <= 0) return 0;
  const take = Math.min(bal, sec);
  await sql.query(
    `UPDATE ad_advertisers
     SET credit_sec = GREATEST(0, credit_sec - $2),
         credit_hours = GREATEST(0, credit_sec - $2) / 3600.0,
         updated_at = $3
     WHERE player_id = $1`,
    [owner, take, nowIso],
  );
  return take;
}

async function ownerCredit(
  sql: Awaited<ReturnType<typeof getSql>>,
  videoId: string,
): Promise<number | null> {
  try {
    const rows = await sql.query<{ credit_sec: number | null; owner: string }>(
      `SELECT COALESCE(a.credit_sec, 0)::int AS credit_sec,
              COALESCE(v.owner_player_id, '') AS owner
       FROM ad_videos v
       LEFT JOIN ad_advertisers a ON a.player_id = v.owner_player_id
       WHERE v.video_id=$1`,
      [videoId],
    );
    if (!rows[0] || !rows[0].owner) return null;
    return Math.max(0, Number(rows[0].credit_sec) || 0);
  } catch {
    return null;
  }
}

async function bumpVideoStats(
  sql: Awaited<ReturnType<typeof getSql>>,
  videoId: string,
  watchDeltaSec: number,
  claimCount: number,
  nowIso: string,
) {
  const dWatch = Math.max(0, Math.floor(watchDeltaSec) || 0);
  const dClaim = Math.max(0, Math.floor(claimCount) || 0);
  if (!dWatch && !dClaim) return;
  await sql.query(
    `INSERT INTO ad_video_stats (video_id, total_watch_sec, total_claims, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (video_id) DO UPDATE SET
       total_watch_sec = ad_video_stats.total_watch_sec + $2,
       total_claims = ad_video_stats.total_claims + $3,
       updated_at = EXCLUDED.updated_at`,
    [videoId, dWatch, dClaim, nowIso],
  );
  if (dWatch > 0) {
    await consumeAdvertiserCredits(sql, videoId, dWatch, nowIso);
  }
}

async function billWatchProgress(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
  videoId: string,
  watchSec: number,
  nowIso: string,
  opts?: { maxBill?: number },
): Promise<{ billed: number; ownerCreditSec: number | null }> {
  const w = Math.max(0, Math.floor(watchSec) || 0);
  const prev = await sql.query<{ billed_sec: number }>(
    `SELECT billed_sec FROM ad_watch_billing WHERE player_id=$1 AND video_id=$2`,
    [playerId, videoId],
  );
  const prevB = Math.max(0, Number(prev[0]?.billed_sec) || 0);
  const delta = Math.max(0, w - prevB);
  if (delta <= 0) {
    return { billed: 0, ownerCreditSec: await ownerCredit(sql, videoId) };
  }
  const cap = Math.max(1, Math.floor(opts?.maxBill ?? 3600));
  const bill = Math.min(delta, cap);
  await bumpVideoStats(sql, videoId, bill, 0, nowIso);
  const newBilled = prevB + bill;
  await sql.query(
    `INSERT INTO ad_watch_billing (player_id, video_id, billed_sec, updated_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (player_id, video_id) DO UPDATE SET
       billed_sec = EXCLUDED.billed_sec,
       updated_at = EXCLUDED.updated_at`,
    [playerId, videoId, newBilled, nowIso],
  );
  return { billed: bill, ownerCreditSec: await ownerCredit(sql, videoId) };
}

type PlayerAdState = {
  used: number;
  hourKey: string;
  lastClaimedAt: string | null;
  lastVideoId: string;
  lastWatchSec: number;
  totalWatchSec: number;
};

async function loadPlayerAdState(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
  now = Date.now(),
): Promise<PlayerAdState> {
  const curKey = jstHourKey(now);
  const rows = await sql.query<{
    last_claimed_at: string;
    last_video_id: string;
    last_watch_sec: number;
    total_watch_sec: number | null;
    hour_key: string;
    hour_coins: number;
  }>(
    `SELECT last_claimed_at, last_video_id, last_watch_sec,
            COALESCE(total_watch_sec, last_watch_sec, 0) AS total_watch_sec,
            hour_key, hour_coins
     FROM ad_watch_player WHERE player_id=$1`,
    [playerId],
  );
  if (rows[0]) {
    const r = rows[0];
    const storedKey = String(r.hour_key || "");
    const used =
      storedKey === curKey ? Math.max(0, Number(r.hour_coins) || 0) : 0;
    const lastW = Math.max(0, Number(r.last_watch_sec) || 0);
    const totalW = Math.max(lastW, Number(r.total_watch_sec) || 0);
    return {
      used,
      hourKey: curKey,
      lastClaimedAt: r.last_claimed_at ? String(r.last_claimed_at) : null,
      lastVideoId: String(r.last_video_id || ""),
      lastWatchSec: lastW,
      totalWatchSec: totalW,
    };
  }
  return {
    used: 0,
    hourKey: curKey,
    lastClaimedAt: null,
    lastVideoId: "",
    lastWatchSec: 0,
    totalWatchSec: 0,
  };
}

async function savePlayerAdState(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
  opts: {
    lastClaimedAt: string;
    lastVideoId: string;
    lastWatchSec: number;
    totalWatchSec: number;
    hourKey: string;
    hourCoins: number;
  },
) {
  const lastW = Math.max(0, Math.floor(opts.lastWatchSec) || 0);
  const totalW = Math.max(lastW, Math.floor(opts.totalWatchSec) || 0);
  await sql.query(
    `INSERT INTO ad_watch_player
       (player_id, last_claimed_at, last_video_id, last_watch_sec, total_watch_sec, hour_key, hour_coins, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$2)
     ON CONFLICT (player_id) DO UPDATE SET
       last_claimed_at = EXCLUDED.last_claimed_at,
       last_video_id = EXCLUDED.last_video_id,
       last_watch_sec = EXCLUDED.last_watch_sec,
       total_watch_sec = EXCLUDED.total_watch_sec,
       hour_key = EXCLUDED.hour_key,
       hour_coins = EXCLUDED.hour_coins,
       updated_at = EXCLUDED.updated_at`,
    [
      playerId,
      opts.lastClaimedAt,
      opts.lastVideoId,
      lastW,
      totalW,
      opts.hourKey,
      Math.max(0, Math.floor(opts.hourCoins) || 0),
    ],
  );
}

async function coinsUsedRecent(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
  now = Date.now(),
) {
  const st = await loadPlayerAdState(sql, playerId, now);
  return {
    used: st.used,
    oldestInWindow: st.lastClaimedAt,
    hourStart: jstHourStartIso(now),
    lastClaimedAt: st.lastClaimedAt,
    lastVideoId: st.lastVideoId,
    lastWatchSec: st.lastWatchSec,
    totalWatchSec: st.totalWatchSec,
    hourKey: st.hourKey,
  };
}

async function claimedMilestones(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
  videoId: string,
  now = Date.now(),
  allTime = false,
): Promise<Set<number>> {
  const since = allTime ? "1970-01-01T00:00:00.000Z" : jstHourStartIso(now);
  const rows = await sql.query<{ milestone_sec: number; watch_sec: number }>(
    `SELECT COALESCE(milestone_sec, 0) AS milestone_sec, watch_sec
     FROM ad_watch_claims
     WHERE player_id=$1 AND video_id=$2 AND claimed_at >= $3`,
    [playerId, videoId, since],
  );
  const set = new Set<number>();
  for (const r of rows) {
    const m = Number(r.milestone_sec) || 0;
    if (m > 0) set.add(m);
    else {
      const w = Number(r.watch_sec) || 0;
      if (w > 0) set.add(w);
    }
  }
  return set;
}

type HistoryRow = {
  claimedAt: string;
  videoId: string;
  label: string;
  reward: number;
  milestoneSec: number;
};

async function loadClaimHistory(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
): Promise<HistoryRow[]> {
  try {
    const rows = await sql.query<{
      claimed_at: string;
      video_id: string;
      reward: number;
      milestone_sec: number;
      watch_sec: number;
      label: string | null;
    }>(
      `SELECT c.claimed_at, c.video_id,
              COALESCE(c.reward, 1) AS reward,
              COALESCE(c.milestone_sec, 0) AS milestone_sec,
              COALESCE(c.watch_sec, 0) AS watch_sec,
              COALESCE(NULLIF(v.label, ''), '') AS label
       FROM ad_watch_claims c
       LEFT JOIN ad_videos v ON v.video_id = c.video_id
       WHERE c.player_id=$1
       ORDER BY c.claimed_at DESC
       LIMIT 40`,
      [playerId],
    );
    return rows.map((r) => ({
      claimedAt: String(r.claimed_at || ""),
      videoId: String(r.video_id || ""),
      label: String(r.label || r.video_id || "広告"),
      reward: Math.max(1, Number(r.reward) || 1),
      milestoneSec: Number(r.milestone_sec) || Number(r.watch_sec) || 0,
    }));
  } catch {
    return [];
  }
}

function msUntilSlot(_oldest: string | null, used: number, now = Date.now()) {
  if (used < HOURLY_MAX) return 0;
  return msUntilNextJstHour(now);
}

export const Route = createFileRoute("/api/share/media-watch")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const playerId = normalizeId(u.searchParams.get("playerId"));
        const videoId = normalizeVideo(u.searchParams.get("videoId") || "");
        if (!playerId || playerId.length < 4) {
          return Response.json({ ok: false, reason: "player" }, { status: 400 });
        }
        const now = Date.now();
        try {
          const sql = await getSql();
          await ensureTables(sql);
          const st = await coinsUsedRecent(sql, playerId, now);
          const { used, oldestInWindow, lastClaimedAt, lastVideoId, lastWatchSec, totalWatchSec, hourKey } =
            st;
          const bal = await sql.query<{ coins: number }>(
            `SELECT coins FROM continue_coins WHERE player_id=$1`,
            [playerId],
          );
          const vmap = await loadVideoDurations(sql);
          const history = await loadClaimHistory(sql, playerId);
          const dur = videoId ? durationOf(videoId, vmap) : 0;
          const ms = dur > 0 ? milestones(dur) : [];
          return Response.json({
            ok: true,
            playerId,
            used,
            remaining: Math.max(0, HOURLY_MAX - used),
            hourlyMax: HOURLY_MAX,
            windowSec: 3600,
            hourLabel: jstHourLabel(now),
            hourKey,
            resetMode: "jst_clock_hour",
            retryAfterMs: msUntilSlot(oldestInWindow, used, now),
            lastClaimedAt,
            lastVideoId: lastVideoId || undefined,
            lastWatchSec,
            totalWatchSec,
            minSec: ms[0]?.at || MAX_SEC,
            maxSec: MAX_SEC,
            hourReward: QUARTER_REWARD,
            milestones: ms,
            reward: 1,
            coins: Number(bal[0]?.coins) || 0,
            videoId: videoId || undefined,
            configured: Object.keys(vmap).length,
            history,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        let body: {
          playerId?: string;
          videoId?: string;
          watchSec?: number;
          action?: string;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const playerId = normalizeId(body.playerId);
        const videoId = normalizeVideo(body.videoId);
        const watchSec = Math.floor(Number(body.watchSec) || 0);
        const action = String(body.action || "claim");
        if (!playerId || playerId.length < 4) {
          return Response.json({ ok: false, reason: "player" }, { status: 400 });
        }
        if (!videoId || videoId.length < 6) {
          return Response.json({ ok: false, reason: "video" }, { status: 400 });
        }
        const now = Date.now();
        const nowIso = new Date(now).toISOString();
        try {
          const sql = await getSql();
          await ensureTables(sql);

          if (action === "progress") {
            const bill = await billWatchProgress(
              sql,
              playerId,
              videoId,
              watchSec,
              nowIso,
              { maxBill: 15 },
            );
            return Response.json({
              ok: true,
              action: "progress",
              billed: bill.billed,
              ownerCreditSec: bill.ownerCreditSec,
            });
          }

          const vmap = await loadVideoDurations(sql);
          const dur = durationOf(videoId, vmap);
          if (!dur) {
            return Response.json({
              ok: false,
              reason: "not_configured",
              message: "この動画は広告リストにありません",
            });
          }

          // Owner out of credits → stop serving
          const oc = await ownerCredit(sql, videoId);
          if (oc !== null && oc <= 0) {
            return Response.json({
              ok: false,
              reason: "no_credit",
              message: "この広告のクレジットが尽きました",
            });
          }

          const ms = milestones(dur);
          const first = ms[0]?.at || MAX_SEC;
          if (!Number.isFinite(watchSec) || watchSec < first) {
            return Response.json({
              ok: false,
              reason: "too_fast",
              minSec: first,
              watchSec,
            });
          }

          const hourState = await coinsUsedRecent(sql, playerId, now);
          const { used, oldestInWindow, hourKey } = hourState;
          if (used >= HOURLY_MAX) {
            return Response.json({
              ok: false,
              reason: "hourly_cap",
              used,
              hourlyMax: HOURLY_MAX,
              remaining: 0,
              hourKey,
              lastClaimedAt: hourState.lastClaimedAt,
              lastWatchSec: hourState.lastWatchSec,
              totalWatchSec: hourState.totalWatchSec,
              retryAfterMs: msUntilSlot(oldestInWindow, used, now),
            });
          }

          const modeRow = await sql.query<{ claim_once: number }>(
            `SELECT COALESCE(claim_once, 0)::int AS claim_once FROM ad_videos WHERE video_id=$1`,
            [videoId],
          );
          const claimOnce = Number(modeRow[0]?.claim_once) !== 0;
          const already = await claimedMilestones(
            sql,
            playerId,
            videoId,
            now,
            claimOnce,
          );
          const unlocked = claimOnce
            ? ms.filter((m) => watchSec >= m.at && !already.has(m.at))
            : unlockedNow(dur, watchSec, already);
          if (!unlocked.length) {
            // still bill watch time
            await billWatchProgress(sql, playerId, videoId, watchSec, nowIso, {
              maxBill: 7200,
            });
            return Response.json({
              ok: false,
              reason: "already",
              used,
              remaining: Math.max(0, HOURLY_MAX - used),
              milestones: ms,
            });
          }

          let room = HOURLY_MAX - used;
          const granted: Milestone[] = [];
          for (const m of unlocked) {
            if (room <= 0) break;
            const give = Math.min(m.reward, room);
            if (give <= 0) break;
            await sql.query(
              `INSERT INTO ad_watch_claims
                 (player_id, video_id, watch_sec, day_jst, claimed_at, milestone_sec, reward)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                playerId,
                videoId,
                watchSec,
                nowIso.slice(0, 10),
                nowIso,
                m.at,
                give,
              ],
            );
            granted.push({ at: m.at, reward: give });
            room -= give;
          }

          const reward = granted.reduce((s, g) => s + g.reward, 0);
          if (reward <= 0) {
            return Response.json({
              ok: false,
              reason: "hourly_cap",
              used,
              remaining: 0,
              retryAfterMs: msUntilSlot(oldestInWindow, used, now),
            });
          }

          const bill = await billWatchProgress(
            sql,
            playerId,
            videoId,
            watchSec,
            nowIso,
            { maxBill: 7200 },
          );
          await bumpVideoStats(sql, videoId, 0, reward, nowIso);

          await sql.query(
            `INSERT INTO continue_coins (player_id, coins, updated_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (player_id) DO UPDATE SET
               coins = continue_coins.coins + $2,
               updated_at = EXCLUDED.updated_at`,
            [playerId, reward, nowIso],
          );
          const bal = await sql.query<{ coins: number }>(
            `SELECT coins FROM continue_coins WHERE player_id=$1`,
            [playerId],
          );
          const coins = Number(bal[0]?.coins) || reward;
          const nextUsed = used + reward;
          const prevTotal = Number(hourState.totalWatchSec) || 0;
          const totalWatchSec = prevTotal + bill.billed;
          await savePlayerAdState(sql, playerId, {
            lastClaimedAt: nowIso,
            lastVideoId: videoId,
            lastWatchSec: watchSec,
            totalWatchSec,
            hourKey,
            hourCoins: nextUsed,
          });
          const nextMs = ms.find((m) => m.at > watchSec) || null;
          const history = await loadClaimHistory(sql, playerId);
          return Response.json({
            ok: true,
            coins,
            reward,
            granted: reward,
            milestonesGranted: granted,
            used: nextUsed,
            remaining: Math.max(0, HOURLY_MAX - nextUsed),
            hourlyMax: HOURLY_MAX,
            hourLabel: jstHourLabel(now),
            hourKey,
            resetMode: "jst_clock_hour",
            lastClaimedAt: nowIso,
            lastVideoId: videoId,
            lastWatchSec: watchSec,
            totalWatchSec,
            billedSec: bill.billed,
            ownerCreditSec: bill.ownerCreditSec,
            hourReward: QUARTER_REWARD,
            minSec: first,
            videoId,
            nextMilestone: nextMs?.at ?? null,
            nextReward: nextMs?.reward ?? null,
            history,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[media-watch]", msg);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
