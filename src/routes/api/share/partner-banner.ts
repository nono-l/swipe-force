/**
 * JPDOC: バナー画像・有効フラグ・表示/クリック課金。
 */
/**
 * Partner title-banner image upload (provisional).
 *
 * - Max 200 KB
 * - Wide aspect (1.5–5.0)
 * - 8 uploads per player per rolling 7 days
 * - Prefer Vercel Blob; fallback to data-URL in DB (dev / no token)
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const MAX_BYTES = 200 * 1024;
const WEEK_LIMIT = 8;
const MAX_OWNED = 200;
const WEEK_MS = 7 * 24 * 3600 * 1000;
const SUPER_ADMIN_PLAYER_ID = "uzwdbubkeggsdico0kgho";
const IMPRESS_SEC = 1;
const CLICK_SEC = 20 * 60;
const IMPRESS_COOLDOWN_MS = 10_000;
const CLICK_COOLDOWN_MS = 60_000;
const MIN_RATIO = 1.5;
const MAX_RATIO = 5.0;
const MIN_W = 120;
const MIN_H = 40;
const HREF_MAX = 500;

function normalizePlayerId(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
}

function newBannerId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(
    0,
    24,
  );
}

function normalizeBannerId(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 32);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

type BannerRow = {
  id: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  content_type: string;
  updated_at: string;
  href: string | null;
  active: number;
};

function mapBanner(row: BannerRow) {
  return {
    id: String(row.id || ""),
    url: String(row.url || ""),
    href: String(row.href || ""),
    width: Number(row.width) || 0,
    height: Number(row.height) || 0,
    bytes: Number(row.bytes) || 0,
    contentType: String(row.content_type || ""),
    updatedAt: String(row.updated_at || ""),
    active: Number(row.active) !== 0,
  };
}

function sanitizeHref(raw: unknown): { href: string; ok: boolean } {
  const s = String(raw || "").trim();
  if (!s) return { href: "", ok: true };
  if (s.length > HREF_MAX) return { href: "", ok: false };
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { href: "", ok: false };
    }
    return { href: u.toString(), ok: true };
  } catch {
    return { href: "", ok: false };
  }
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_banner_assets (
      owner_player_id TEXT PRIMARY KEY,
      url TEXT NOT NULL DEFAULT '',
      width INTEGER NOT NULL DEFAULT 0,
      height INTEGER NOT NULL DEFAULT 0,
      bytes INTEGER NOT NULL DEFAULT 0,
      content_type TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_banner_upload_log (
      id BIGSERIAL PRIMARY KEY,
      owner_player_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  try {
    await sql.query(
      `CREATE INDEX IF NOT EXISTS ad_banner_upload_log_owner_at
       ON ad_banner_upload_log (owner_player_id, created_at DESC)`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_banner_assets ADD COLUMN IF NOT EXISTS href TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_banner_assets ADD COLUMN IF NOT EXISTS id TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* */
  }
  try {
    const rows = await sql.query<{ owner_player_id: string; id: string }>(
      `SELECT owner_player_id, id FROM ad_banner_assets`,
    );
    for (const r of rows) {
      if (String(r.id || "").trim()) continue;
      await sql.query(
        `UPDATE ad_banner_assets SET id=$1
         WHERE owner_player_id=$2 AND (id='' OR id IS NULL)`,
        [newBannerId(), r.owner_player_id],
      );
    }
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_banner_assets DROP CONSTRAINT IF EXISTS ad_banner_assets_pkey`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ad_banner_assets_id_uq ON ad_banner_assets (id)`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `CREATE INDEX IF NOT EXISTS ad_banner_assets_owner_idx
       ON ad_banner_assets (owner_player_id)`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_banner_assets ADD COLUMN IF NOT EXISTS active INTEGER NOT NULL DEFAULT 1`,
    );
  } catch {
    /* */
  }
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_banner_events (
      id BIGSERIAL PRIMARY KEY,
      banner_id TEXT NOT NULL,
      owner_player_id TEXT NOT NULL DEFAULT '',
      viewer_player_id TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'impress',
      charged_sec INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT ''
    )
  `);
  try {
    await sql.query(
      `CREATE INDEX IF NOT EXISTS ad_banner_events_lookup
       ON ad_banner_events (banner_id, viewer_player_id, kind, created_at DESC)`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE ad_advertisers ADD COLUMN IF NOT EXISTS credit_sec INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* */
  }
  await sql.query(`
    CREATE TABLE IF NOT EXISTS game_admins (
      player_id TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      appointed_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_advertisers (
      player_id TEXT PRIMARY KEY,
      credit_hours REAL NOT NULL DEFAULT 0,
      total_credited REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT '',
      credit_sec INTEGER NOT NULL DEFAULT 0
    )
  `);
}

async function isAdminPlayer(
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

async function syncAdvertiserSec(sql: Awaited<ReturnType<typeof getSql>>) {
  try {
    await sql.query(`
      UPDATE ad_advertisers
      SET credit_sec = GREATEST(
        COALESCE(credit_sec, 0),
        FLOOR(COALESCE(credit_hours, 0) * 3600)::int
      )
      WHERE COALESCE(credit_sec, 0) = 0 AND COALESCE(credit_hours, 0) > 0
    `);
  } catch {
    /* */
  }
}

async function consumeOwnerCredits(
  sql: Awaited<ReturnType<typeof getSql>>,
  ownerId: string,
  seconds: number,
  nowIso: string,
): Promise<number> {
  const owner = normalizePlayerId(ownerId);
  const need = Math.max(0, Math.floor(seconds) || 0);
  if (!owner || need <= 0) return 0;
  if (await isAdminPlayer(sql, owner)) return 0;
  await syncAdvertiserSec(sql);
  const before = await sql.query<{ credit_sec: number }>(
    `SELECT COALESCE(credit_sec, 0)::int AS credit_sec FROM ad_advertisers WHERE player_id=$1`,
    [owner],
  );
  const have = Math.max(0, Number(before[0]?.credit_sec) || 0);
  const taken = Math.min(have, need);
  if (taken <= 0) return 0;
  await sql.query(
    `UPDATE ad_advertisers
     SET credit_sec = GREATEST(0, COALESCE(credit_sec, 0) - $2),
         updated_at = $3
     WHERE player_id=$1`,
    [owner, taken, nowIso],
  );
  return taken;
}

async function lastEventAt(
  sql: Awaited<ReturnType<typeof getSql>>,
  bannerId: string,
  viewerId: string,
  kind: string,
): Promise<number> {
  try {
    const rows = await sql.query<{ created_at: string }>(
      `SELECT created_at FROM ad_banner_events
       WHERE banner_id=$1 AND viewer_player_id=$2 AND kind=$3
       ORDER BY created_at DESC LIMIT 1`,
      [bannerId, viewerId, kind],
    );
    const t = Date.parse(String(rows[0]?.created_at || ""));
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

async function weekUploadCount(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
): Promise<number> {
  const since = new Date(Date.now() - WEEK_MS).toISOString();
  try {
    const rows = await sql.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM ad_banner_upload_log
       WHERE owner_player_id=$1 AND created_at >= $2::timestamptz`,
      [playerId, since],
    );
    return Math.max(0, Number(rows[0]?.n) || 0);
  } catch {
    try {
      const rows = await sql.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM ad_banner_upload_log
         WHERE owner_player_id=$1 AND created_at >= $2`,
        [playerId, since],
      );
      return Math.max(0, Number(rows[0]?.n) || 0);
    } catch {
      return 0;
    }
  }
}

function readImageMeta(
  buf: Buffer,
): { width: number; height: number; mime: string } | null {
  if (buf.length < 24) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height, mime: "image/png" };
    return null;
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1]!;
      if (marker === 0xd9 || marker === 0xda) break;
      const len = buf.readUInt16BE(i + 2);
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        if (width > 0 && height > 0) return { width, height, mime: "image/jpeg" };
        return null;
      }
      i += 2 + len;
    }
    return null;
  }
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    if (buf.toString("ascii", 12, 16) === "VP8X" && buf.length >= 30) {
      const width = 1 + buf[24]! + (buf[25]! << 8) + (buf[26]! << 16);
      const height = 1 + buf[27]! + (buf[28]! << 8) + (buf[29]! << 16);
      if (width > 0 && height > 0) return { width, height, mime: "image/webp" };
    }
    if (buf.toString("ascii", 12, 16) === "VP8 " && buf.length >= 30) {
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      if (width > 0 && height > 0) return { width, height, mime: "image/webp" };
    }
  }
  return null;
}

function parseDataUrl(raw: string): { mime: string; buf: Buffer } | null {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-z0-9+/=\s]+)$/i.exec(
    String(raw || "").trim(),
  );
  if (!m) return null;
  let mime = m[1]!.toLowerCase();
  if (mime === "image/jpg") mime = "image/jpeg";
  try {
    const buf = Buffer.from(m[2]!.replace(/\s+/g, ""), "base64");
    if (!buf.length) return null;
    return { mime, buf };
  } catch {
    return null;
  }
}

async function putBlob(
  playerId: string,
  buf: Buffer,
  mime: string,
): Promise<{ url: string; via: "blob" | "data" }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";
  if (token) {
    try {
      const { put } = await import("@vercel/blob");
      const ext =
        mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const blob = await put(
        `partner-banners/${playerId}/${Date.now()}.${ext}`,
        buf,
        {
          access: "public",
          contentType: mime,
          token,
          addRandomSuffix: true,
        },
      );
      if (blob?.url) return { url: blob.url, via: "blob" };
    } catch (e) {
      console.warn("[partner-banner] blob put failed", e);
    }
  }
  const b64 = buf.toString("base64");
  return { url: `data:${mime};base64,${b64}`, via: "data" };
}

async function queryBannerLedger(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
  bannerId: string,
  wantAll: boolean,
) {
  let rows: {
    id: string;
    banner_id: string;
    owner_player_id: string;
    viewer_player_id: string;
    kind: string;
    charged_sec: number;
    created_at: string;
    display_name?: string | null;
    href?: string | null;
    url?: string | null;
    width?: number | null;
    height?: number | null;
  }[] = [];
  try {
    rows = await sql.query(
      `SELECT e.id AS id, e.banner_id, e.owner_player_id, e.viewer_player_id,
              e.kind, e.charged_sec, e.created_at,
              COALESCE(p.display_name, '') AS display_name,
              COALESCE(b.href, '') AS href,
              COALESCE(b.url, '') AS url,
              COALESCE(b.width, 0) AS width,
              COALESCE(b.height, 0) AS height
       FROM ad_banner_events e
       LEFT JOIN player_profiles p ON p.player_id = e.viewer_player_id
       LEFT JOIN ad_banner_assets b ON b.id = e.banner_id
       WHERE (e.owner_player_id = $1 OR $2 = 1)
         AND ($3 = '' OR e.banner_id = $3)
       ORDER BY e.created_at DESC
       LIMIT 300`,
      [playerId, wantAll ? 1 : 0, bannerId],
    );
  } catch {
    rows = await sql.query(
      `SELECT e.id AS id, e.banner_id, e.owner_player_id, e.viewer_player_id,
              e.kind, e.charged_sec, e.created_at
       FROM ad_banner_events e
       WHERE (e.owner_player_id = $1 OR $2 = 1)
         AND ($3 = '' OR e.banner_id = $3)
       ORDER BY e.created_at DESC
       LIMIT 300`,
      [playerId, wantAll ? 1 : 0, bannerId],
    );
  }
  const list = Array.isArray(rows) ? rows : [];
  const events = list.map((r) => ({
    id: String(r.id ?? ""),
    bannerId: String(r.banner_id || ""),
    ownerPlayerId: String(r.owner_player_id || "").slice(0, 32),
    viewerPlayerId: String(r.viewer_player_id || "").slice(0, 32),
    displayName: String(r.display_name || "").slice(0, 40),
    kind: r.kind === "click" ? "click" : "impress",
    chargedSec: Math.max(0, Number(r.charged_sec) || 0),
    createdAt: String(r.created_at || ""),
    href: String(r.href || ""),
    url: String(r.url || ""),
    width: Number(r.width) || 0,
    height: Number(r.height) || 0,
  }));
  const impress = events.filter((e) => e.kind === "impress");
  const clicks = events.filter((e) => e.kind === "click");
  const viewers = new Set(events.map((e) => e.viewerPlayerId).filter(Boolean));
  return {
    ok: true as const,
    impress,
    clicks,
    summary: {
      impress: impress.length,
      clicks: clicks.length,
      viewers: viewers.size,
    },
  };
}

export const Route = createFileRoute("/api/share/partner-banner")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const sql = await getSql();
          await ensure(sql);
          const url = new URL(request.url);
          const pool = url.searchParams.get("pool") === "1";
          const playerId = normalizePlayerId(url.searchParams.get("playerId"));

          if (pool) {
            await syncAdvertiserSec(sql);
            const rows = await sql.query<{
              id: string;
              url: string;
              owner_player_id: string;
              width: number;
              height: number;
              href: string | null;
            }>(
              `SELECT b.id, b.url, b.owner_player_id, b.width, b.height, COALESCE(b.href,'') AS href
               FROM ad_banner_assets b
               LEFT JOIN ad_advertisers a ON a.player_id = b.owner_player_id
               WHERE b.url <> '' AND COALESCE(b.active, 1) <> 0
                 AND (
                   b.owner_player_id = $1
                   OR EXISTS (SELECT 1 FROM game_admins g WHERE g.player_id = b.owner_player_id)
                   OR COALESCE(a.credit_sec, 0) > 0
                 )
               ORDER BY b.updated_at DESC
               LIMIT 200`,
              [SUPER_ADMIN_PLAYER_ID],
            );
            return json({
              ok: true,
              banners: rows.map((r) => ({
                id: String(r.id || ""),
                url: String(r.url || ""),
                href: String(r.href || ""),
                ownerPlayerId: String(r.owner_player_id || "").slice(0, 32),
                width: Number(r.width) || 0,
                height: Number(r.height) || 0,
              })),
              rates: { impressSec: IMPRESS_SEC, clickSec: CLICK_SEC },
            });
          }

          if (playerId.length < 4) {
            return json({ ok: false, reason: "bad_player" }, 400);
          }

          const used = await weekUploadCount(sql, playerId);
          const rows = await sql.query<BannerRow>(
            `SELECT id, url, width, height, bytes, content_type, updated_at,
                    COALESCE(href,'') AS href, COALESCE(active, 1) AS active
             FROM ad_banner_assets
             WHERE owner_player_id=$1
             ORDER BY updated_at DESC`,
            [playerId],
          );
          const banners = rows.map(mapBanner);
          return json({
            ok: true,
            weekLimit: WEEK_LIMIT,
            weekUsed: used,
            weekRemaining: Math.max(0, WEEK_LIMIT - used),
            maxBytes: MAX_BYTES,
            minRatio: MIN_RATIO,
            maxRatio: MAX_RATIO,
            maxOwned: MAX_OWNED,
            banners,
            banner: banners[0] || null,
          });
        } catch (e) {
          console.error("[partner-banner] GET", e);
          return json({ ok: false, reason: "server" }, 500);
        }
      },

      POST: async ({ request }) => {
        try {
          const sql = await getSql();
          await ensure(sql);
          const body = (await request.json().catch(() => ({}))) as {
            playerId?: string;
            action?: string;
            dataUrl?: string;
            href?: string;
            id?: string;
            active?: boolean | number | string;
            all?: boolean | number | string;
          };
          const playerId = normalizePlayerId(body.playerId);
          if (playerId.length < 4) {
            return json({ ok: false, reason: "bad_player" }, 400);
          }
          const action = String(body.action || "upload");
          const bannerId = normalizeBannerId(body.id);

          if (action === "clear") {
            if (bannerId) {
              await sql.query(
                `DELETE FROM ad_banner_assets
                 WHERE owner_player_id=$1 AND id=$2`,
                [playerId, bannerId],
              );
            } else {
              await sql.query(
                `DELETE FROM ad_banner_assets WHERE owner_player_id=$1`,
                [playerId],
              );
            }
            return json({ ok: true, cleared: true, id: bannerId || null });
          }

          if (action === "ledger" || action === "events") {
            const admin = await isAdminPlayer(sql, playerId);
            const wantAll =
              admin &&
              (body.all === true || body.all === 1 || body.all === "1");
            try {
              return json(
                await queryBannerLedger(sql, playerId, bannerId, wantAll),
              );
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error("[partner-banner] ledger", msg);
              return json({ ok: false, reason: "db", error: msg }, 500);
            }
          }

          if (action === "impress" || action === "click") {
            if (!bannerId) return json({ ok: false, reason: "bad_id" }, 400);
            const kind = action === "click" ? "click" : "impress";
            const charge = kind === "click" ? CLICK_SEC : IMPRESS_SEC;
            const cool =
              kind === "click" ? CLICK_COOLDOWN_MS : IMPRESS_COOLDOWN_MS;
            const nowIso = new Date().toISOString();
            const rows = await sql.query<{
              id: string;
              owner_player_id: string;
              active: number;
              url: string;
            }>(
              `SELECT id, owner_player_id, COALESCE(active,1) AS active, url
               FROM ad_banner_assets WHERE id=$1`,
              [bannerId],
            );
            const row = rows[0];
            if (!row || !row.url) {
              return json({ ok: false, reason: "not_found" }, 404);
            }
            if (Number(row.active) === 0) {
              return json({ ok: false, reason: "inactive" }, 400);
            }
            const owner = normalizePlayerId(row.owner_player_id);
            const last = await lastEventAt(sql, bannerId, playerId, kind);
            if (last && Date.now() - last < cool) {
              return json({
                ok: true,
                skipped: true,
                kind,
                chargedSec: 0,
              });
            }
            const chargedSec = await consumeOwnerCredits(
              sql,
              owner,
              charge,
              nowIso,
            );
            await sql.query(
              `INSERT INTO ad_banner_events
                 (banner_id, owner_player_id, viewer_player_id, kind, charged_sec, created_at)
               VALUES ($1,$2,$3,$4,$5,$6)`,
              [bannerId, owner, playerId, kind, chargedSec, nowIso],
            );
            return json({
              ok: true,
              kind,
              chargedSec,
              requestedSec: charge,
            });
          }

          if (action === "active" || action === "set_active") {
            if (!bannerId) {
              return json({ ok: false, reason: "bad_id" }, 400);
            }
            const on =
              body.active === false ||
              body.active === 0 ||
              body.active === "0"
                ? 0
                : 1;
            const now = new Date().toISOString();
            await sql.query(
              `UPDATE ad_banner_assets
               SET active=$3, updated_at=$4
               WHERE owner_player_id=$1 AND id=$2`,
              [playerId, bannerId, on, now],
            );
            const rows = await sql.query<BannerRow>(
              `SELECT id, url, width, height, bytes, content_type, updated_at,
                      COALESCE(href,'') AS href, COALESCE(active, 1) AS active
               FROM ad_banner_assets WHERE owner_player_id=$1 AND id=$2`,
              [playerId, bannerId],
            );
            if (!rows[0]) return json({ ok: false, reason: "not_found" }, 404);
            return json({
              ok: true,
              active: on === 1,
              banner: mapBanner(rows[0]),
            });
          }

          if (action === "href" || action === "set_href") {
            const parsedHref = sanitizeHref(body.href);
            if (!parsedHref.ok) {
              return json({ ok: false, reason: "bad_href" }, 400);
            }
            const now = new Date().toISOString();
            if (bannerId) {
              await sql.query(
                `UPDATE ad_banner_assets
                 SET href=$3, updated_at=$4
                 WHERE owner_player_id=$1 AND id=$2`,
                [playerId, bannerId, parsedHref.href, now],
              );
              const rows = await sql.query<BannerRow>(
                `SELECT id, url, width, height, bytes, content_type, updated_at,
                        COALESCE(href,'') AS href, COALESCE(active, 1) AS active
                 FROM ad_banner_assets WHERE owner_player_id=$1 AND id=$2`,
                [playerId, bannerId],
              );
              if (!rows[0]) return json({ ok: false, reason: "not_found" }, 404);
              return json({
                ok: true,
                href: parsedHref.href,
                banner: mapBanner(rows[0]),
              });
            }
            await sql.query(
              `UPDATE ad_banner_assets
               SET href=$2, updated_at=$3
               WHERE owner_player_id=$1`,
              [playerId, parsedHref.href, now],
            );
            return json({ ok: true, href: parsedHref.href });
          }

          const used = await weekUploadCount(sql, playerId);
          if (used >= WEEK_LIMIT) {
            return json(
              {
                ok: false,
                reason: "week_limit",
                weekLimit: WEEK_LIMIT,
                weekUsed: used,
                weekRemaining: 0,
              },
              429,
            );
          }
          const owned = await sql.query<{ n: number }>(
            `SELECT COUNT(*)::int AS n FROM ad_banner_assets WHERE owner_player_id=$1`,
            [playerId],
          );
          if ((Number(owned[0]?.n) || 0) >= MAX_OWNED) {
            return json(
              { ok: false, reason: "slot_limit", maxOwned: MAX_OWNED },
              400,
            );
          }

          const parsed = parseDataUrl(String(body.dataUrl || ""));
          if (!parsed) {
            return json({ ok: false, reason: "bad_image" }, 400);
          }
          if (parsed.buf.length > MAX_BYTES) {
            return json(
              {
                ok: false,
                reason: "too_large",
                maxBytes: MAX_BYTES,
                bytes: parsed.buf.length,
              },
              400,
            );
          }
          const meta = readImageMeta(parsed.buf);
          if (!meta) {
            return json({ ok: false, reason: "bad_format" }, 400);
          }
          const mime = meta.mime || parsed.mime;
          if (meta.width < MIN_W || meta.height < MIN_H) {
            return json(
              {
                ok: false,
                reason: "too_small",
                width: meta.width,
                height: meta.height,
                minW: MIN_W,
                minH: MIN_H,
              },
              400,
            );
          }
          const ratio = meta.width / meta.height;
          if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
            return json(
              {
                ok: false,
                reason: "bad_ratio",
                ratio: Math.round(ratio * 100) / 100,
                minRatio: MIN_RATIO,
                maxRatio: MAX_RATIO,
                width: meta.width,
                height: meta.height,
              },
              400,
            );
          }

          const stored = await putBlob(playerId, parsed.buf, mime);
          const now = new Date().toISOString();
          const id = newBannerId();
          await sql.query(
            `INSERT INTO ad_banner_assets
               (owner_player_id, url, width, height, bytes, content_type, updated_at, href, id, active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'',$8,1)`,
            [
              playerId,
              stored.url,
              meta.width,
              meta.height,
              parsed.buf.length,
              mime,
              now,
              id,
            ],
          );
          await sql.query(
            `INSERT INTO ad_banner_upload_log (owner_player_id, created_at)
             VALUES ($1, $2::timestamptz)`,
            [playerId, now],
          );

          const weekUsed = used + 1;
          return json({
            ok: true,
            via: stored.via,
            weekLimit: WEEK_LIMIT,
            weekUsed,
            weekRemaining: Math.max(0, WEEK_LIMIT - weekUsed),
            banner: {
              id,
              url: stored.url,
              href: "",
              width: meta.width,
              height: meta.height,
              bytes: parsed.buf.length,
              contentType: mime,
              updatedAt: now,
              active: true,
            },
          });
        } catch (e) {
          console.error("[partner-banner] POST", e);
          return json({ ok: false, reason: "server" }, 500);
        }
      },
    },
  },
});
