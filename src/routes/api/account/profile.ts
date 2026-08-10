import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { auth, authConfigured } from "@/lib/auth/server";
import {
  sanitizeProfileName,
  sanitizeProfileBio,
  sanitizeProfileShare,
} from "@/lib/sanitize-message";

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
    return session.user as { id: string; name?: string | null };
  } catch {
    return null;
  }
}

function playerIdOk(raw: string): string | null {
  const s = String(raw || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 32);
  return s.length >= 4 ? s : null;
}

async function ensure(sql: Awaited<ReturnType<typeof getSql>>) {
  await sql.query(
    `CREATE TABLE IF NOT EXISTS player_profiles (
      player_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      share_blurb TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )`,
  );
  try {
    await sql.query(
      `ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS share_blurb TEXT NOT NULL DEFAULT ''`,
    );
  } catch {
    /* older PG without IF NOT EXISTS on ADD COLUMN — ignore */
  }
}

export type PublicProfile = {
  playerId: string;
  displayName: string;
  bio: string;
  shareBlurb: string;
  hasProfile: boolean;
};

export const Route = createFileRoute("/api/account/profile")({
  server: {
    handlers: {
      /** Public read — for visitors helping a share */
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const playerId = playerIdOk(u.searchParams.get("playerId") || "");
        if (!playerId)
          return Response.json({ ok: false, reason: "player" }, { status: 400 });
        try {
          const sql = await getSql();
          await ensure(sql);
          const rows = await sql.query<{
            display_name: string;
            bio: string;
            share_blurb: string;
          }>(
            `SELECT display_name, bio, COALESCE(share_blurb,'') AS share_blurb
             FROM player_profiles WHERE player_id = $1`,
            [playerId],
          );
          const row = rows[0];
          const displayName = row?.display_name || "";
          const bio = row?.bio || "";
          const shareBlurb = row?.share_blurb || "";
          const hasProfile = !!(displayName || bio || shareBlurb);
          return Response.json({
            ok: true,
            playerId,
            displayName,
            bio,
            shareBlurb,
            hasProfile,
          } satisfies PublicProfile & { ok: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({
            ok: true,
            playerId,
            displayName: "",
            bio: "",
            shareBlurb: "",
            hasProfile: false,
            offline: true,
            error: msg,
          });
        }
      },

      /** Linked only — save own profile */
      POST: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user)
          return Response.json({ ok: false, reason: "link_required" }, { status: 401 });
        let body: { displayName?: string; bio?: string; shareBlurb?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, reason: "bad_json" }, { status: 400 });
        }
        const nameS = sanitizeProfileName(body.displayName ?? "");
        // allow empty name to clear? require name if setting profile
        if (!nameS.ok) {
          // empty name + empty bio + empty share = clear profile
          const bioEmpty =
            !body.bio ||
            (typeof body.bio === "string" && !body.bio.trim());
          const shareEmpty =
            !body.shareBlurb ||
            (typeof body.shareBlurb === "string" && !body.shareBlurb.trim());
          if (nameS.reason === "empty" && bioEmpty && shareEmpty) {
            const playerId = makePlayerId(user.id);
            try {
              const sql = await getSql();
              await ensure(sql);
              await sql.query(`DELETE FROM player_profiles WHERE player_id = $1`, [
                playerId,
              ]);
              return Response.json({
                ok: true,
                playerId,
                displayName: "",
                bio: "",
                shareBlurb: "",
                hasProfile: false,
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              return Response.json({ ok: false, offline: true, error: msg }, { status: 500 });
            }
          }
          return Response.json({ ok: false, reason: nameS.reason }, { status: 400 });
        }
        const bioS = sanitizeProfileBio(body.bio ?? "");
        if (!bioS.ok)
          return Response.json({ ok: false, reason: bioS.reason }, { status: 400 });
        const shareS = sanitizeProfileShare(body.shareBlurb ?? "");
        if (!shareS.ok)
          return Response.json({ ok: false, reason: shareS.reason }, { status: 400 });

        const playerId = makePlayerId(user.id);
        const at = new Date().toISOString();
        try {
          const sql = await getSql();
          await ensure(sql);
          await sql.query(
            `INSERT INTO player_profiles (player_id, display_name, bio, share_blurb, updated_at)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (player_id)
             DO UPDATE SET display_name = EXCLUDED.display_name,
               bio = EXCLUDED.bio,
               share_blurb = EXCLUDED.share_blurb,
               updated_at = EXCLUDED.updated_at`,
            [playerId, nameS.text, bioS.text, shareS.text, at],
          );
          return Response.json({
            ok: true,
            playerId,
            displayName: nameS.text,
            bio: bioS.text,
            shareBlurb: shareS.text,
            hasProfile: true,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, offline: true, error: msg }, { status: 500 });
        }
      },
    },
  },
});
