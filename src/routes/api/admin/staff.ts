/**
 * Game staff (appointed admins). Super admin is hard-coded client+server.
 * GET  — list (auth optional; returns super + appointed)
 * POST — appoint (caller must be admin)
 * DELETE — remove appointed (caller must be admin; cannot remove super)
 */

import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { auth, authConfigured } from "@/lib/auth/server";

/** Fixed root admin — never stored/removable */
export const SUPER_ADMIN_PLAYER_ID = "uzwdbubkeggsdico0kgho";

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

async function ensureTable(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS game_admins (
      player_id TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      appointed_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
    )
  `);
}

async function listAppointed(sql: Awaited<ReturnType<typeof getSql>>) {
  try {
    await ensureTable(sql);
    const rows = await sql.query<{
      player_id: string;
      label: string;
      appointed_by: string;
      created_at: string;
    }>(
      `SELECT player_id, label, appointed_by, created_at FROM game_admins ORDER BY created_at ASC`,
    );
    return rows.map((r) => ({
      playerId: normalizePlayerId(r.player_id),
      label: String(r.label || "").slice(0, 40),
      appointedBy: normalizePlayerId(r.appointed_by),
      createdAt: String(r.created_at || ""),
      fixed: false as const,
    }));
  } catch {
    return [];
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
    await ensureTable(sql);
    const rows = await sql.query<{ n: number }>(
      `SELECT 1 AS n FROM game_admins WHERE player_id=$1 LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/admin/staff")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const superEntry = {
          playerId: SUPER_ADMIN_PLAYER_ID,
          label: "固定管理者",
          appointedBy: "",
          createdAt: "",
          fixed: true as const,
        };
        try {
          const sql = await getSql();
          const appointed = await listAppointed(sql);
          const user = await sessionUser(request);
          const me = user ? makePlayerId(user.id) : null;
          const staff = me ? await isStaff(sql, me) : false;
          return Response.json({
            ok: true,
            superAdminId: SUPER_ADMIN_PLAYER_ID,
            me,
            isStaff: staff,
            isSuper: me === SUPER_ADMIN_PLAYER_ID,
            staff: [superEntry, ...appointed.filter((a) => a.playerId !== SUPER_ADMIN_PLAYER_ID)],
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({
            ok: true,
            offline: true,
            error: msg,
            superAdminId: SUPER_ADMIN_PLAYER_ID,
            me: null,
            isStaff: false,
            isSuper: false,
            staff: [superEntry],
          });
        }
      },

      POST: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user) {
          return Response.json({ ok: false, reason: "auth" }, { status: 401 });
        }
        const me = makePlayerId(user.id);
        let body: { playerId?: string; label?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const target = normalizePlayerId(body.playerId);
        if (!target || target.length < 4) {
          return Response.json({ ok: false, reason: "bad_id" }, { status: 400 });
        }
        if (target === SUPER_ADMIN_PLAYER_ID) {
          return Response.json({ ok: false, reason: "already_super" }, { status: 400 });
        }
        const label = String(body.label || target).trim().slice(0, 40);

        try {
          const sql = await getSql();
          if (!(await isStaff(sql, me))) {
            return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
          }
          await ensureTable(sql);
          const now = new Date().toISOString();
          await sql.query(
            `INSERT INTO game_admins (player_id, label, appointed_by, created_at)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (player_id) DO UPDATE SET label = EXCLUDED.label`,
            [target, label, me, now],
          );
          const appointed = await listAppointed(sql);
          return Response.json({
            ok: true,
            superAdminId: SUPER_ADMIN_PLAYER_ID,
            staff: [
              {
                playerId: SUPER_ADMIN_PLAYER_ID,
                label: "固定管理者",
                appointedBy: "",
                createdAt: "",
                fixed: true,
              },
              ...appointed.filter((a) => a.playerId !== SUPER_ADMIN_PLAYER_ID),
            ],
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },

      DELETE: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user) {
          return Response.json({ ok: false, reason: "auth" }, { status: 401 });
        }
        const me = makePlayerId(user.id);
        let body: { playerId?: string };
        try {
          body = await request.json();
        } catch {
          // also allow ?playerId=
          try {
            const u = new URL(request.url);
            body = { playerId: u.searchParams.get("playerId") || "" };
          } catch {
            return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
          }
        }
        const target = normalizePlayerId(body.playerId);
        if (!target) {
          return Response.json({ ok: false, reason: "bad_id" }, { status: 400 });
        }
        if (target === SUPER_ADMIN_PLAYER_ID) {
          return Response.json({ ok: false, reason: "fixed" }, { status: 400 });
        }

        try {
          const sql = await getSql();
          if (!(await isStaff(sql, me))) {
            return Response.json({ ok: false, reason: "forbidden" }, { status: 403 });
          }
          await ensureTable(sql);
          await sql.query(`DELETE FROM game_admins WHERE player_id=$1`, [target]);
          const appointed = await listAppointed(sql);
          return Response.json({
            ok: true,
            superAdminId: SUPER_ADMIN_PLAYER_ID,
            staff: [
              {
                playerId: SUPER_ADMIN_PLAYER_ID,
                label: "固定管理者",
                appointedBy: "",
                createdAt: "",
                fixed: true,
              },
              ...appointed.filter((a) => a.playerId !== SUPER_ADMIN_PLAYER_ID),
            ],
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, reason: "db", error: msg }, { status: 500 });
        }
      },
    },
  },
});
