/**
 * Claim a promo code for a player (guest or linked).
 * POST { code, playerId }
 * - resolves built-in or DB custom codes
 * - one claim per (code, player_id)
 * - respects expires_at + max_claims on custom codes
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import {
  findBuiltin,
  formatGrantSummary,
  grantIsEmpty,
  isPromoExpired,
  isPromoSoldOut,
  normalizeExpiresAt,
  normalizeMaxClaims,
  normalizePromoCode,
  parseGrantJson,
  type GrantBundle,
  type PromoDefServer,
} from "@/lib/promo-server";

function normalizePlayerId(id: string | null | undefined): string {
  return String(id || "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 32);
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

async function countClaims(
  sql: Awaited<ReturnType<typeof getSql>>,
  code: string,
): Promise<number> {
  try {
    const rows = await sql.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM promo_claims WHERE code=$1`,
      [code],
    );
    return Number(rows[0]?.n) || 0;
  } catch {
    return 0;
  }
}

async function findCustom(
  sql: Awaited<ReturnType<typeof getSql>>,
  code: string,
): Promise<PromoDefServer | null> {
  const rows = await sql.query<{
    code: string;
    label: string;
    grant_json: string;
    active: number;
    expires_at: string;
    max_claims: number;
  }>(
    `SELECT code, label, grant_json, active,
            COALESCE(expires_at, '') AS expires_at,
            COALESCE(max_claims, 0) AS max_claims
     FROM promo_codes WHERE code=$1 LIMIT 1`,
    [code],
  );
  const r = rows[0];
  if (!r) return null;
  if (Number(r.active) === 0) return null;
  const grant = parseGrantJson(r.grant_json);
  if (grantIsEmpty(grant)) return null;
  return {
    code: normalizePromoCode(r.code),
    label: String(r.label || r.code).slice(0, 40),
    grant,
    custom: true,
    active: true,
    expiresAt: normalizeExpiresAt(r.expires_at),
    maxClaims: normalizeMaxClaims(r.max_claims),
  };
}

export const Route = createFileRoute("/api/promo/claim")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { code?: string; playerId?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const code = normalizePromoCode(body.code);
        const playerId = normalizePlayerId(body.playerId);
        if (!code || code.length < 2) {
          return Response.json({ ok: false, reason: "invalid", code }, { status: 400 });
        }
        if (!playerId || playerId.length < 4) {
          return Response.json({ ok: false, reason: "player", code }, { status: 400 });
        }

        try {
          const sql = await getSql();
          await ensureTables(sql);

          const existing = await sql.query<{ n: number }>(
            `SELECT 1 AS n FROM promo_claims WHERE code=$1 AND player_id=$2 LIMIT 1`,
            [code, playerId],
          );
          if (existing.length) {
            return Response.json({
              ok: false,
              reason: "already",
              code,
              playerId,
            });
          }

          let def = await findCustom(sql, code);
          if (!def) def = findBuiltin(code);
          if (!def || grantIsEmpty(def.grant)) {
            return Response.json({ ok: false, reason: "invalid", code }, { status: 404 });
          }

          // expiry / max only apply to custom DB codes (and if set on def)
          if (isPromoExpired(def.expiresAt)) {
            return Response.json({
              ok: false,
              reason: "expired",
              code,
              expiresAt: def.expiresAt || "",
            });
          }

          const claimCount = await countClaims(sql, code);
          if (isPromoSoldOut(def.maxClaims, claimCount)) {
            return Response.json({
              ok: false,
              reason: "sold_out",
              code,
              claimCount,
              maxClaims: def.maxClaims || 0,
            });
          }

          const now = new Date().toISOString();
          try {
            await sql.query(
              `INSERT INTO promo_claims (code, player_id, claimed_at) VALUES ($1,$2,$3)`,
              [code, playerId, now],
            );
          } catch {
            return Response.json({
              ok: false,
              reason: "already",
              code,
              playerId,
            });
          }

          const after = claimCount + 1;
          return Response.json({
            ok: true,
            code,
            playerId,
            label: def.label,
            grant: def.grant as GrantBundle,
            summary: formatGrantSummary(def.grant),
            custom: !!def.custom,
            claimedAt: now,
            claimCount: after,
            maxClaims: def.maxClaims || 0,
            expiresAt: def.expiresAt || "",
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json(
            { ok: false, reason: "db", error: msg, code },
            { status: 500 },
          );
        }
      },

      GET: async ({ request }) => {
        const u = new URL(request.url);
        const code = normalizePromoCode(u.searchParams.get("code") || "");
        const playerId = normalizePlayerId(u.searchParams.get("playerId") || "");
        if (!code) {
          return Response.json({ ok: false, reason: "invalid" }, { status: 400 });
        }
        try {
          const sql = await getSql();
          await ensureTables(sql);
          let def = await findCustom(sql, code);
          if (!def) def = findBuiltin(code);
          if (!def) {
            return Response.json({ ok: false, reason: "invalid", code }, { status: 404 });
          }
          const claimCount = await countClaims(sql, code);
          let claimed = false;
          if (playerId) {
            const rows = await sql.query<{ n: number }>(
              `SELECT 1 AS n FROM promo_claims WHERE code=$1 AND player_id=$2 LIMIT 1`,
              [code, playerId],
            );
            claimed = rows.length > 0;
          }
          const expired = isPromoExpired(def.expiresAt);
          const soldOut = isPromoSoldOut(def.maxClaims, claimCount);
          return Response.json({
            ok: true,
            code: def.code,
            label: def.label,
            grant: def.grant,
            summary: formatGrantSummary(def.grant),
            custom: !!def.custom,
            claimed,
            claimCount,
            maxClaims: def.maxClaims || 0,
            expiresAt: def.expiresAt || "",
            expired,
            soldOut,
            available: !expired && !soldOut,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
