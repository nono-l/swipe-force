/**
 * Prepaid codes for advertisers (admin issues, anyone with code redeems).
 *
 * GET  ?playerId= &admin=1  — admin: list codes / player: my balance
 * POST { playerId, action: "create"|"disable"|"redeem", ... }
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const SUPER_ADMIN_PLAYER_ID = "uzwdbubkeggsdico0kgho";

function normalizePlayerId(raw: unknown): string {
  return String(raw || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
}

function normalizeCode(raw: unknown): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_prepaid_codes (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      credit_hours REAL NOT NULL DEFAULT 1,
      max_claims INTEGER NOT NULL DEFAULT 1,
      claim_count INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      expires_at TEXT NOT NULL DEFAULT ''
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_prepaid_claims (
      code TEXT NOT NULL,
      player_id TEXT NOT NULL,
      credit_hours REAL NOT NULL DEFAULT 0,
      claimed_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (code, player_id)
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ad_advertisers (
      player_id TEXT PRIMARY KEY,
      credit_hours REAL NOT NULL DEFAULT 0,
      total_credited REAL NOT NULL DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS game_admins (
      player_id TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      appointed_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
    )
  `);
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

export const Route = createFileRoute("/api/share/ad-prepaid")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const playerId = normalizePlayerId(u.searchParams.get("playerId"));
        const admin = u.searchParams.get("admin") === "1";
        if (!playerId) {
          return Response.json({ ok: false, reason: "player" }, { status: 400 });
        }
        try {
          const sql = await getSql();
          await ensure(sql);
          const bal = await getBalance(sql, playerId);
          if (admin) {
            if (!(await isAdmin(sql, playerId))) {
              return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
            }
            const codes = await sql.query<{
              code: string;
              label: string;
              credit_hours: number;
              max_claims: number;
              claim_count: number;
              active: number;
              created_by: string;
              created_at: string;
              expires_at: string;
            }>(
              `SELECT code, label, credit_hours, max_claims, claim_count, active,
                      created_by, created_at, expires_at
               FROM ad_prepaid_codes
               ORDER BY created_at DESC`,
            );
            return Response.json({
              ok: true,
              admin: true,
              balance: bal,
              codes: codes.map((c) => ({
                code: c.code,
                label: c.label,
                creditHours: Number(c.credit_hours) || 0,
                maxClaims: Number(c.max_claims) || 1,
                claimCount: Number(c.claim_count) || 0,
                active: !!c.active,
                createdBy: c.created_by,
                createdAt: c.created_at,
                expiresAt: c.expires_at || null,
              })),
            });
          }
          // player: balance + my claims
          const claims = await sql.query<{
            code: string;
            credit_hours: number;
            claimed_at: string;
          }>(
            `SELECT code, credit_hours, claimed_at FROM ad_prepaid_claims
             WHERE player_id=$1 ORDER BY claimed_at DESC`,
            [playerId],
          );
          return Response.json({
            ok: true,
            admin: false,
            balance: bal,
            claims: claims.map((c) => ({
              code: c.code,
              creditHours: Number(c.credit_hours) || 0,
              claimedAt: c.claimed_at,
            })),
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
          code?: string;
          label?: string;
          creditHours?: number;
          maxClaims?: number;
          expiresAt?: string;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const playerId = normalizePlayerId(body.playerId);
        const action = String(body.action || "");
        if (!playerId) {
          return Response.json({ ok: false, reason: "player" }, { status: 400 });
        }
        try {
          const sql = await getSql();
          await ensure(sql);
          const now = new Date().toISOString();

          if (action === "create") {
            if (!(await isAdmin(sql, playerId))) {
              return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
            }
            let code = normalizeCode(body.code);
            if (!code) {
              // auto generate
              code = `AD${Date.now().toString(36).toUpperCase()}${Math.random()
                .toString(36)
                .slice(2, 6)
                .toUpperCase()}`.slice(0, 16);
            }
            const creditHours = Math.max(
              0.1,
              Math.min(100000, Number(body.creditHours) || 1),
            );
            const maxClaims = Math.max(
              1,
              Math.min(10000, Math.floor(Number(body.maxClaims) || 1)),
            );
            const label = String(body.label || code).slice(0, 40);
            const expiresAt = body.expiresAt
              ? String(body.expiresAt).slice(0, 40)
              : "";
            await sql.query(
              `INSERT INTO ad_prepaid_codes
                 (code, label, credit_hours, max_claims, claim_count, active, created_by, created_at, expires_at)
               VALUES ($1,$2,$3,$4,0,1,$5,$6,$7)
               ON CONFLICT (code) DO UPDATE SET
                 label = EXCLUDED.label,
                 credit_hours = EXCLUDED.credit_hours,
                 max_claims = EXCLUDED.max_claims,
                 active = 1,
                 expires_at = EXCLUDED.expires_at`,
              [code, label, creditHours, maxClaims, playerId, now, expiresAt],
            );
            return Response.json({ ok: true, code, creditHours, maxClaims, label });
          }

          if (action === "disable") {
            if (!(await isAdmin(sql, playerId))) {
              return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
            }
            const code = normalizeCode(body.code);
            if (!code) {
              return Response.json({ ok: false, reason: "code" }, { status: 400 });
            }
            await sql.query(
              `UPDATE ad_prepaid_codes SET active=0 WHERE code=$1`,
              [code],
            );
            return Response.json({ ok: true, code, active: false });
          }

          if (action === "redeem") {
            const code = normalizeCode(body.code);
            if (!code) {
              return Response.json({ ok: false, reason: "code" }, { status: 400 });
            }
            const rows = await sql.query<{
              code: string;
              credit_hours: number;
              max_claims: number;
              claim_count: number;
              active: number;
              expires_at: string;
            }>(
              `SELECT code, credit_hours, max_claims, claim_count, active, expires_at
               FROM ad_prepaid_codes WHERE code=$1`,
              [code],
            );
            const row = rows[0];
            if (!row || !row.active) {
              return Response.json({ ok: false, reason: "invalid" }, { status: 400 });
            }
            if (row.expires_at) {
              const exp = Date.parse(row.expires_at);
              if (Number.isFinite(exp) && exp < Date.now()) {
                return Response.json({ ok: false, reason: "expired" }, { status: 400 });
              }
            }
            if (Number(row.claim_count) >= Number(row.max_claims)) {
              return Response.json({ ok: false, reason: "sold_out" }, { status: 400 });
            }
            // already claimed by this player?
            const prev = await sql.query(
              `SELECT 1 AS n FROM ad_prepaid_claims WHERE code=$1 AND player_id=$2`,
              [code, playerId],
            );
            if (prev.length) {
              return Response.json({ ok: false, reason: "already" }, { status: 400 });
            }
            const creditHours = Number(row.credit_hours) || 0;
            const creditSec = Math.max(1, Math.floor(creditHours * 3600));
            await sql.query(
              `INSERT INTO ad_prepaid_claims (code, player_id, credit_hours, claimed_at)
               VALUES ($1,$2,$3,$4)`,
              [code, playerId, creditHours, now],
            );
            await sql.query(
              `UPDATE ad_prepaid_codes SET claim_count = claim_count + 1 WHERE code=$1`,
              [code],
            );
            await sql.query(
              `INSERT INTO ad_advertisers (player_id, credit_hours, total_credited, credit_sec, updated_at)
               VALUES ($1,$2,$2,$3,$4)
               ON CONFLICT (player_id) DO UPDATE SET
                 credit_hours = (ad_advertisers.credit_sec + $3) / 3600.0,
                 total_credited = ad_advertisers.total_credited + $2,
                 credit_sec = ad_advertisers.credit_sec + $3,
                 updated_at = EXCLUDED.updated_at`,
              [playerId, creditHours, creditSec, now],
            );
            const bal = await getBalance(sql, playerId);
            return Response.json({
              ok: true,
              code,
              credited: creditHours,
              creditedSec: creditSec,
              balance: bal,
            });
          }

          return Response.json({ ok: false, reason: "action" }, { status: 400 });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[ad-prepaid]", msg);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
