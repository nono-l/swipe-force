/**
 * JPDOC: 連携必須APIの共通ガード。
 */
/**
 * Server helper: sound-test social features require linked account session.
 */
import { auth, authConfigured } from "@/lib/auth/server";

export function playerIdFromUserId(userId: string): string {
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const base = (clean || "user").slice(0, 20);
  return `u${base}`.slice(0, 32);
}

export async function getLinkedPlayerId(
  request: Request,
): Promise<{ ok: true; playerId: string; userId: string } | { ok: false }> {
  if (!authConfigured) {
    // Auth not wired in this environment — still require client to send
    // a "linked-shaped" playerId (starts with u) and block pure guest ids.
    return { ok: false };
  }
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return { ok: false };
    return {
      ok: true,
      userId: session.user.id,
      playerId: playerIdFromUserId(session.user.id),
    };
  } catch {
    return { ok: false };
  }
}

export function unlinkedJson(status = 401) {
  return Response.json(
    { ok: false, reason: "link_required", error: "account_link_required" },
    { status },
  );
}
