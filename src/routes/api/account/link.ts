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

async function ensurePlayer(sql: Awaited<ReturnType<typeof getSql>>, user: { id: string; name?: string | null }, playerId: string) {
  await sql.query(
    `INSERT INTO account_players (user_id, player_id, display_name)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name`,
    [user.id, playerId, user.name ?? null],
  );
  await sql.query(
    `INSERT INTO continue_coins (player_id, coins) VALUES ($1, 0)
     ON CONFLICT (player_id) DO NOTHING`,
    [playerId],
  );
  await sql.query(
    `INSERT INTO account_save (player_id, easy_upgrades, inbox_json)
     VALUES ($1, '{}', '[]')
     ON CONFLICT (player_id) DO NOTHING`,
    [playerId],
  );
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
          const save = await sql.query<{ easy_upgrades: string; inbox_json: string }>(
            `SELECT easy_upgrades, inbox_json FROM account_save WHERE player_id=$1`,
            [playerId],
          );
          let easyUpgrades: UpMap = parseUpgrades({});
          let inbox: Msg[] = [];
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

          // easy upgrades: max-merge
          const save = await sql.query<{ easy_upgrades: string; inbox_json: string }>(
            `SELECT easy_upgrades, inbox_json FROM account_save WHERE player_id=$1`,
            [playerId],
          );
          let cloudUp = parseUpgrades({});
          let cloudInbox: Msg[] = [];
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
          const easyUpgrades = mergeUpgrades(cloudUp, guestUp);
          const inbox = mergeInbox(cloudInbox, guestInbox);

          await sql.query(
            `INSERT INTO account_save (player_id, easy_upgrades, inbox_json, updated_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (player_id) DO UPDATE
             SET easy_upgrades = $2, inbox_json = $3, updated_at = $4`,
            [
              playerId,
              JSON.stringify(easyUpgrades),
              JSON.stringify(inbox),
              new Date().toISOString(),
            ],
          );

          // re-point live message tables guest → account
          await reassignMessages(sql, guestPlayerId, playerId);

          return Response.json({
            ok: true,
            playerId,
            coins,
            easyUpgrades,
            inbox,
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
            error: msg,
            user: { id: user.id, name: user.name ?? null },
          });
        }
      },
    },
  },
});
