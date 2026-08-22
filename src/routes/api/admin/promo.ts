/**
 * JPDOC: プロモCRUD。管理者だけ。使用回数はユニークプレイヤー。
 */
/**
 * Admin promo codes (DB-backed).
 * GET    — list builtins + custom (auth staff)
 * POST   — upsert custom code
 * DELETE — remove custom code (?code=)
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { auth, authConfigured } from "@/lib/auth/server";
import {
  BUILTIN_PROMOS,
  formatGrantSummary,
  grantIsEmpty,
  isBuiltinCode,
  normalizeExpiresAt,
  normalizeMaxClaims,
  normalizePromoCode,
  parseGrantJson,
  sanitizeGrant,
  type GrantBundle,
  type PromoDefServer,
} from "@/lib/promo-server";

const SUPER_ADMIN_PLAYER_ID = "uzwdbubkeggsdico0kgho";

function makePlayerId(userId: string): string {
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const base = (clean || "user").slice(0, 20);
  return `u${base}`.slice(0, 32);
}

function normalizePlayerId(id: string | null | undefined): string {
  return String(id || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
}

async function sessionUser(request: Request) {
  if (!authConfigured) return null;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return null;
    return session.user as { id: string; name?: string | null };
  } catch {
    return null;
  }
}

async function ensureTables(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      grant_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS promo_claims (
      code TEXT NOT NULL,
      player_id TEXT NOT NULL,
      claimed_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (code, player_id)
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
    await sql.query(
      `ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* */
  }
  try {
    await sql.query(
      `ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_claims INTEGER NOT NULL DEFAULT 0`,
    );
  } catch {
    /* */
  }
}

async function isStaff(
  sql: Awaited<ReturnType<typeof getSql>>,
  playerId: string,
): Promise<boolean> {
  const id = normalizePlayerId(playerId);
  if (!id) return false;
  if (id === SUPER_ADMIN_PLAYER_ID) return true;
  try {
    const rows = await sql.query<{ n: number }>(
      `SELECT 1 AS n FROM game_admins WHERE player_id=$1 LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function requireStaff(request: Request) {
  const user = await sessionUser(request);
  if (!user) return { ok: false as const, status: 401 as const, reason: "auth" };
  const me = makePlayerId(user.id);
  try {
    const sql = await getSql();
    await ensureTables(sql);
    if (!(await isStaff(sql, me))) {
      return { ok: false as const, status: 403 as const, reason: "forbidden", me };
    }
    return { ok: true as const, me, sql };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, status: 500 as const, reason: "db", error: msg, me };
  }
}

async function claimCountsByCode(
  sql: Awaited<ReturnType<typeof getSql>>,
): Promise<Record<string, number>> {
  try {
    const rows = await sql.query<{ code: string; n: number }>(
      `SELECT code, COUNT(*)::int AS n FROM promo_claims GROUP BY code`,
    );
    const out: Record<string, number> = {};
    for (const r of rows) {
      const c = normalizePromoCode(r.code);
      if (c) out[c] = Number(r.n) || 0;
    }
    return out;
  } catch {
    return {};
  }
}

async function listCustom(
  sql: Awaited<ReturnType<typeof getSql>>,
  counts: Record<string, number>,
): Promise<PromoDefServer[]> {
  const rows = await sql.query<{
    code: string;
    label: string;
    grant_json: string;
    active: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    expires_at: string;
    max_claims: number;
  }>(
    `SELECT code, label, grant_json, active, created_by, created_at, updated_at,
            COALESCE(expires_at, '') AS expires_at,
            COALESCE(max_claims, 0) AS max_claims
     FROM promo_codes ORDER BY updated_at DESC, code ASC`,
  );
  return rows.map((r) => {
    const code = normalizePromoCode(r.code);
    return {
      code,
      label: String(r.label || r.code).slice(0, 40),
      grant: parseGrantJson(r.grant_json),
      custom: true,
      active: Number(r.active) !== 0,
      createdBy: normalizePlayerId(r.created_by),
      createdAt: String(r.created_at || ""),
      updatedAt: String(r.updated_at || ""),
      claimCount: counts[code] || 0,
      expiresAt: normalizeExpiresAt(r.expires_at),
      maxClaims: normalizeMaxClaims(r.max_claims),
    };
  });
}

export const Route = createFileRoute("/api/admin/promo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const gate = await requireStaff(request);
        if (!gate.ok) {
          return Response.json(
            { ok: false, reason: gate.reason, error: "error" in gate ? gate.error : undefined },
            { status: gate.status },
          );
        }
        try {
          const counts = await claimCountsByCode(gate.sql);
          const customs = await listCustom(gate.sql, counts);
          const customCodes = new Set(customs.map((c) => c.code));
          const builtins = BUILTIN_PROMOS.filter((b) => !customCodes.has(b.code)).map(
            (b) => ({
              ...b,
              claimCount: counts[b.code] || 0,
            }),
          );
          const totalClaims = Object.values(counts).reduce((a, b) => a + b, 0);
          return Response.json({
            ok: true,
            me: gate.me,
            builtins,
            customs,
            items: [...builtins, ...customs],
            claimCounts: counts,
            totalClaims,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        const gate = await requireStaff(request);
        if (!gate.ok) {
          return Response.json(
            { ok: false, reason: gate.reason },
            { status: gate.status },
          );
        }
        let body: {
          code?: string;
          label?: string;
          grant?: GrantBundle;
          active?: boolean;
          expiresAt?: string;
          maxClaims?: number;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const code = normalizePromoCode(body.code);
        if (!code || code.length < 2) {
          return Response.json({ ok: false, reason: "bad_code" }, { status: 400 });
        }
        if (isBuiltinCode(code)) {
          return Response.json({ ok: false, reason: "builtin_locked" }, { status: 400 });
        }
        const grant = sanitizeGrant(body.grant);
        if (grantIsEmpty(grant)) {
          return Response.json({ ok: false, reason: "empty_grant" }, { status: 400 });
        }
        const label = String(body.label || code).trim().slice(0, 40) || code;
        const active = body.active === false ? 0 : 1;
        const expiresAt = normalizeExpiresAt(body.expiresAt);
        const maxClaims = normalizeMaxClaims(body.maxClaims);
        const now = new Date().toISOString();
        try {
          await gate.sql.query(
            `INSERT INTO promo_codes
               (code, label, grant_json, active, created_by, created_at, updated_at, expires_at, max_claims)
             VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8)
             ON CONFLICT (code) DO UPDATE SET
               label = EXCLUDED.label,
               grant_json = EXCLUDED.grant_json,
               active = EXCLUDED.active,
               updated_at = EXCLUDED.updated_at,
               expires_at = EXCLUDED.expires_at,
               max_claims = EXCLUDED.max_claims`,
            [code, label, JSON.stringify(grant), active, gate.me, now, expiresAt, maxClaims],
          );
          const counts = await claimCountsByCode(gate.sql);
          const def: PromoDefServer = {
            code,
            label,
            grant,
            custom: true,
            active: active === 1,
            createdBy: gate.me,
            updatedAt: now,
            expiresAt,
            maxClaims,
            claimCount: counts[code] || 0,
          };
          return Response.json({
            ok: true,
            def,
            summary: formatGrantSummary(grant),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },

      DELETE: async ({ request }) => {
        const gate = await requireStaff(request);
        if (!gate.ok) {
          return Response.json(
            { ok: false, reason: gate.reason },
            { status: gate.status },
          );
        }
        const u = new URL(request.url);
        let code = normalizePromoCode(u.searchParams.get("code") || "");
        if (!code) {
          try {
            const body = (await request.json()) as { code?: string };
            code = normalizePromoCode(body.code);
          } catch {
            /* */
          }
        }
        if (!code) {
          return Response.json({ ok: false, reason: "bad_code" }, { status: 400 });
        }
        if (isBuiltinCode(code)) {
          return Response.json({ ok: false, reason: "builtin_locked" }, { status: 400 });
        }
        try {
          await gate.sql.query(`DELETE FROM promo_codes WHERE code=$1`, [code]);
          // keep claims history for audit, or delete? keep claims so re-create doesn't re-grant
          return Response.json({ ok: true, code });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
