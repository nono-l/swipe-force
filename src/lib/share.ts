/** Client helpers for share-referral continue coins + missions. */

import { sanitizeFanMessage } from "@/lib/sanitize-message";

export const PLAYER_KEY = "swipe_force_player_v1";
export const COIN_KEY = "swipe_force_coins_v1";
export const LEDGER_KEY = "swipe_force_coin_ledger_v1";
export const MISSION_KEY = "swipe_force_missions_v1";
export const MSG_KEY = "swipe_force_msgs_v1";
export const MSG_SENT_KEY = "swipe_force_msg_sent_v1";
export const MIN_BOSS1_SECONDS = 10;

export type MissionId = "m1" | "m2" | "m3" | "m4";

export const MISSIONS: {
  id: MissionId;
  label: string;
  detail: string;
  minSec: number;
  coins: number; // always 1 each
}[] = [
  { id: "m1", label: "M1", detail: "1面ボス到達", minSec: 10, coins: 1 },
  { id: "m2", label: "M2", detail: "2面ボス撃破", minSec: 25, coins: 1 },
  { id: "m3", label: "M3", detail: "3面ボス撃破", minSec: 45, coins: 1 },
  { id: "m4", label: "M4", detail: "4面ボス撃破", minSec: 70, coins: 1 },
];

export function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem(PLAYER_KEY);
    if (!id || id.length < 6) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map((b) => (b % 36).toString(36))
        .join("");
      localStorage.setItem(PLAYER_KEY, id);
      try {
        // lazy import avoided — stamp via dynamic inline to not cycle
        const metaKey = "swipe_force_id_meta_v1";
        const m = JSON.parse(localStorage.getItem(metaKey) || "{}") as Record<
          string,
          { createdAt?: string }
        >;
        if (!m[id]?.createdAt) {
          m[id] = { createdAt: new Date().toISOString() };
          localStorage.setItem(metaKey, JSON.stringify(m));
        }
      } catch {
        /* ignore */
      }
    } else {
      try {
        const metaKey = "swipe_force_id_meta_v1";
        const m = JSON.parse(localStorage.getItem(metaKey) || "{}") as Record<
          string,
          { createdAt?: string }
        >;
        if (!m[id]?.createdAt) {
          m[id] = { createdAt: new Date().toISOString() };
          localStorage.setItem(metaKey, JSON.stringify(m));
        }
      } catch {
        /* ignore */
      }
    }
    return id;
  } catch {
    return "guest";
  }
}

export function readLocalCoins(playerId: string): number {
  try {
    const ledger = JSON.parse(localStorage.getItem(LEDGER_KEY) || "{}") as Record<
      string,
      number
    >;
    if (typeof ledger[playerId] === "number") return Math.max(0, ledger[playerId] | 0);
    const legacy = Number(localStorage.getItem(COIN_KEY) || "0");
    return Math.max(0, legacy | 0);
  } catch {
    return 0;
  }
}

export function writeLocalCoins(playerId: string, coins: number) {
  try {
    const ledger = JSON.parse(localStorage.getItem(LEDGER_KEY) || "{}") as Record<
      string,
      number
    >;
    ledger[playerId] = Math.max(0, coins | 0);
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
    localStorage.setItem(COIN_KEY, String(ledger[playerId]));
  } catch {
    /* ignore */
  }
}

export function addLocalCoins(playerId: string, delta: number): number {
  const next = Math.max(0, readLocalCoins(playerId) + delta);
  writeLocalCoins(playerId, next);
  return next;
}

type MissionMap = Partial<Record<MissionId, boolean>>;
/** key = shareId (one share click) */
type MissionStore = Record<string, MissionMap>;

function readMissionStore(): MissionStore {
  try {
    return JSON.parse(localStorage.getItem(MISSION_KEY) || "{}") as MissionStore;
  } catch {
    return {};
  }
}
function writeMissionStore(s: MissionStore) {
  try {
    localStorage.setItem(MISSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function newShareId(): string {
  try {
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => (b % 36).toString(36))
      .join("");
  } catch {
    return `s${Date.now().toString(36)}`;
  }
}

export function getMissionProgress(shareId: string): MissionMap {
  if (!shareId) return {};
  return { ...readMissionStore()[shareId] };
}

export function isMissionDone(shareId: string, id: MissionId): boolean {
  return !!getMissionProgress(shareId)[id];
}

export function markMissionDone(shareId: string, id: MissionId) {
  const s = readMissionStore();
  s[shareId] = { ...(s[shareId] || {}), [id]: true };
  writeMissionStore(s);
}

export function allMissionsDone(shareId: string): boolean {
  const p = getMissionProgress(shareId);
  return MISSIONS.every((m) => p[m.id]);
}

/** one fan-mail per share instance (share click), not per sharer forever */
export function hasSentFanMessage(shareId: string, visitorId: string): boolean {
  if (!shareId || !visitorId) return false;
  try {
    const s = JSON.parse(localStorage.getItem(MSG_SENT_KEY) || "{}") as Record<
      string,
      boolean
    >;
    return !!s[`${visitorId}>${shareId}`];
  } catch {
    return false;
  }
}

export function markFanMessageSent(shareId: string, visitorId: string) {
  try {
    const s = JSON.parse(localStorage.getItem(MSG_SENT_KEY) || "{}") as Record<
      string,
      boolean
    >;
    s[`${visitorId}>${shareId}`] = true;
    localStorage.setItem(MSG_SENT_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function canSendFanMessage(
  shareId: string,
  sharerId: string,
  visitorId: string,
): boolean {
  return (
    !!shareId &&
    !!sharerId &&
    !!visitorId &&
    sharerId !== visitorId &&
    allMissionsDone(shareId) &&
    !hasSentFanMessage(shareId, visitorId)
  );
}

export type ShareLink = { ref: string | null; sid: string | null };

export function parseShareFromUrl(): ShareLink {
  try {
    const u = new URL(window.location.href);
    const refRaw = u.searchParams.get("ref") || u.searchParams.get("share");
    const sidRaw = u.searchParams.get("sid") || u.searchParams.get("s");
    const ref = refRaw
      ? refRaw.replace(/[^a-z0-9]/gi, "").slice(0, 32)
      : null;
    const sid = sidRaw
      ? sidRaw.replace(/[^a-z0-9]/gi, "").slice(0, 32)
      : null;
    // both required — no missions without a real share instance id
    if (!ref || ref.length < 4 || !sid || sid.length < 4) {
      return { ref: null, sid: null };
    }
    return { ref, sid };
  } catch {
    return { ref: null, sid: null };
  }
}

/** @deprecated use parseShareFromUrl */
export function parseRefFromUrl(): string | null {
  return parseShareFromUrl().ref;
}

export function shareUrl(playerId: string, shareId: string): string {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("ref", playerId);
    u.searchParams.set("sid", shareId);
    u.hash = "";
    return u.toString();
  } catch {
    return `?ref=${playerId}&sid=${shareId}`;
  }
}

export type ShareProgress = {
  stage?: number;
  score?: number;
  difficulty?: "easy" | "normal" | string;
  /** where they tapped share */
  context?: "title" | "playing" | "gameover" | "boss" | "shop" | "ready";
  bossName?: string;
  lives?: number;
  continueCoins?: number;
};

function progressHelpLine(p: ShareProgress): string {
  const st = Math.max(1, p.stage || 1);
  const diff =
    p.difficulty === "normal" ? "NORMAL" : p.difficulty === "easy" ? "EASY" : "";
  const sc =
    typeof p.score === "number" && p.score > 0
      ? ` SCORE ${String(p.score).padStart(7, "0")}`
      : "";
  const ctx = p.context || "title";

  if (ctx === "gameover") {
    return [
      `🆘 助けて！ ${diff} STAGE ${st} で撃沈${sc}`,
      p.bossName ? `ボス「${p.bossName}」手前/戦いでやられました` : `進行: ${st}面目安`,
      "遊んでミッションクリアしてくれるとコンティニューできます",
    ].join("\n");
  }
  if (ctx === "boss") {
    return [
      `⚔️ ボス戦中！ ${diff} STAGE ${st}${p.bossName ? `「${p.bossName}」` : ""}${sc}`,
      "応援プレイ（ミッション）でシェア主にコインが入ります",
    ].join("\n");
  }
  if (ctx === "playing" || ctx === "ready" || ctx === "shop") {
    return [
      `🚀 進行中 ${diff} STAGE ${st}${sc}`,
      `いま ${st}面あたりで助けを求めてます`,
      "M1=1面ボス到達 / M2~4=2~4面ボス撃破 → コイン1枚ずつ",
    ].join("\n");
  }
  // title / default
  return [
    `📣 一緒に遊んで助けて！（${diff || "SWIPE FORCE"}）`,
    "ミッションクリアでシェア主にコンティニューコイン🎁",
    "M1:1面ボス到達 / M2~4:各面ボス撃破（各1枚）",
  ].join("\n");
}

export function openTwitterShare(
  playerId: string,
  progress: ShareProgress = {},
  profile?: { displayName?: string; bio?: string; shareBlurb?: string },
): string {
  const shareId = newShareId();
  const url = shareUrl(playerId, shareId);
  const help = progressHelpLine(progress);
  const tags = ["SWIPEFORCE","GrokBuild","シューティング","indiegames"].map(
    (t) => t.trim(),
  );
  // hashtags without # in the param
  const hashtagParam = tags.filter(Boolean).join(",");
  const who =
    profile?.displayName && profile.displayName.trim()
      ? `パイロット「${profile.displayName.trim().slice(0, 16)}」`
      : "";
  // dedicated 40-char share template (not the long self-intro)
  const blurb =
    profile?.shareBlurb && profile.shareBlurb.trim()
      ? profile.shareBlurb.trim().slice(0, 40)
      : "";
  const text = [
    "SWIPE FORCE",
    who ? `${who}が助けを求めています` : "",
    blurb,
    help,
    "",
    `#SWIPEFORCE #GrokBuild #シューティング`,
    url,
  ]
    .filter((line) => line !== "")
    .join("\n");
  const intent =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` +
    `&hashtags=${encodeURIComponent(hashtagParam)}`;
  window.open(intent, "_blank", "noopener,noreferrer");
  return shareId;
}

export async function fetchBalance(playerId: string): Promise<number> {
  const local = readLocalCoins(playerId);
  try {
    const res = await fetch(`/api/share/balance?playerId=${encodeURIComponent(playerId)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return local;
    const data = (await res.json()) as { coins?: number };
    const remote = Math.max(0, Number(data.coins) || 0);
    const best = Math.max(local, remote);
    writeLocalCoins(playerId, best);
    if (best > remote) {
      void fetch("/api/share/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, coins: best }),
      });
    }
    return best;
  } catch {
    return local;
  }
}

export async function completeMission(opts: {
  sharerId: string;
  shareId: string;
  visitorId: string;
  missionId: MissionId;
  playSeconds: number;
}): Promise<{ ok: boolean; reason?: string; already?: boolean; coins?: number }> {
  const { sharerId, shareId, visitorId, missionId, playSeconds } = opts;
  const def = MISSIONS.find((m) => m.id === missionId);
  if (!def) return { ok: false, reason: "bad" };
  if (!sharerId || !shareId || sharerId === visitorId) return { ok: false, reason: "self" };
  // no synthetic/legacy sids (must come from SHARE button's sid)
  if (shareId.length < 6 || shareId.startsWith("leg")) {
    return { ok: false, reason: "share" };
  }
  if (playSeconds < def.minSec) return { ok: false, reason: "too_fast" };

  if (isMissionDone(shareId, missionId)) {
    return { ok: true, already: true, coins: readLocalCoins(sharerId) };
  }

  // local first — 1 coin per mission stage (per share instance)
  markMissionDone(shareId, missionId);
  const localCoins = addLocalCoins(sharerId, def.coins);

  try {
    const res = await fetch("/api/share/mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharerId, shareId, visitorId, missionId, playSeconds }),
    });
    if (!res.ok) return { ok: true, reason: "local_only", coins: localCoins };
    const data = (await res.json()) as {
      ok?: boolean;
      coins?: number;
      reason?: string;
      already?: boolean;
    };
    if (data.ok === false) {
      if (data.reason === "self" || data.reason === "too_fast") {
        // rollback
        const s = readMissionStore();
        if (s[sharerId]) {
          delete s[sharerId][missionId];
          writeMissionStore(s);
        }
        addLocalCoins(sharerId, -1);
        return { ok: false, reason: data.reason };
      }
    }
    const coins = Math.max(localCoins, Number(data.coins) || 0);
    writeLocalCoins(sharerId, coins);
    return { ok: true, already: !!data.already, coins };
  } catch {
    return { ok: true, reason: "local_only", coins: localCoins };
  }
}

/** @deprecated use completeMission */
export async function awardShareCoin(opts: {
  sharerId: string;
  shareId: string;
  visitorId: string;
  playSeconds: number;
}) {
  return completeMission({ ...opts, missionId: "m1" });
}

export async function spendContinueCoin(playerId: string): Promise<{
  ok: boolean;
  coins: number;
}> {
  const local = readLocalCoins(playerId);
  if (local <= 0) return { ok: false, coins: 0 };
  const after = addLocalCoins(playerId, -1);
  try {
    const res = await fetch("/api/share/spend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; coins?: number };
      if (data.ok === false) {
        const coins = Math.max(0, Number(data.coins) || 0);
        writeLocalCoins(playerId, coins);
        return { ok: false, coins };
      }
      const coins = Math.min(after, Math.max(0, Number(data.coins) ?? after));
      writeLocalCoins(playerId, coins);
      return { ok: true, coins };
    }
  } catch {
    /* local */
  }
  return { ok: true, coins: after };
}

export type FanMessage = {
  id: string;
  from: string;
  body: string;
  at?: string;
  shareId?: string;
  /** mission = ミッション完走MSG / thanks = お礼 */
  source: "mission" | "thanks";
  /**
   * true only on mission-complete messages.
   * thanks messages always false — お礼のお礼を防ぐ
   */
  canThanks: boolean;
  thanksSent: boolean;
};

/** お礼ボタン表示・送信可否（ミッション完了MSGのみ） */
export function canAttachThanks(m: FanMessage | null | undefined): boolean {
  if (!m) return false;
  return m.source === "mission" && m.canThanks === true && m.thanksSent !== true;
}

/** normalize legacy local rows (kind?) into flagged FanMessage */
export function normalizeFanMessage(
  m: Partial<FanMessage> & { kind?: string },
): FanMessage | null {
  if (!m?.id || !m.from || m.body == null || m.body === "") return null;
  const source: "mission" | "thanks" =
    m.source === "thanks" || m.kind === "thanks" ? "thanks" : "mission";
  if (source === "thanks") {
    return {
      id: String(m.id),
      from: String(m.from),
      body: String(m.body),
      at: m.at,
      shareId: m.shareId,
      source: "thanks",
      canThanks: false,
      thanksSent: true,
    };
  }
  return {
    id: String(m.id),
    from: String(m.from),
    body: String(m.body),
    at: m.at,
    shareId: m.shareId,
    source: "mission",
    // explicit false sticks; otherwise mission msgs can receive thanks
    canThanks: m.canThanks === false ? false : true,
    thanksSent: !!m.thanksSent,
  };
}

const DELETED_KEY = "swipe_force_inbox_deleted_v1";
const THANKS_KEY = "swipe_force_thanks_sent_v1";

function readIdSet(key: string): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}
function writeIdSet(key: string, s: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

export function readLocalInbox(playerId: string): FanMessage[] {
  try {
    const all = JSON.parse(localStorage.getItem(MSG_KEY) || "{}") as Record<
      string,
      unknown[]
    >;
    const deleted = readIdSet(DELETED_KEY);
    const thanks = readIdSet(THANKS_KEY);
    return (all[playerId] || [])
      .map((raw) =>
        normalizeFanMessage(raw as Partial<FanMessage> & { kind?: string }),
      )
      .filter((m): m is FanMessage => !!m && !deleted.has(m.id))
      .map((m) =>
        thanks.has(m.id) ? { ...m, thanksSent: true, canThanks: m.canThanks } : m,
      );
  } catch {
    return [];
  }
}

function pushLocalMessage(ownerId: string, msg: FanMessage) {
  const n = normalizeFanMessage(msg);
  if (!n) return;
  try {
    const all = JSON.parse(localStorage.getItem(MSG_KEY) || "{}") as Record<
      string,
      FanMessage[]
    >;
    const list = all[ownerId] || [];
    const next = [n, ...list.filter((m) => m.id !== n.id)];
    all[ownerId] = next.slice(0, 200);
    localStorage.setItem(MSG_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function removeLocalMessage(ownerId: string, messageId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(MSG_KEY) || "{}") as Record<
      string,
      FanMessage[]
    >;
    all[ownerId] = (all[ownerId] || []).filter((m) => m.id !== messageId);
    localStorage.setItem(MSG_KEY, JSON.stringify(all));
    const deleted = readIdSet(DELETED_KEY);
    deleted.add(messageId);
    writeIdSet(DELETED_KEY, deleted);
  } catch {
    /* ignore */
  }
}

export async function deleteInboxMessage(opts: {
  playerId: string;
  messageId: string;
}): Promise<{ ok: boolean; reason?: string }> {
  removeLocalMessage(opts.playerId, opts.messageId);
  try {
    const res = await fetch("/api/share/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        playerId: opts.playerId,
        messageId: opts.messageId,
      }),
    });
    if (!res.ok) return { ok: true, reason: "local_only" };
    const data = (await res.json()) as { ok?: boolean; reason?: string };
    if (data.ok === false) return { ok: false, reason: data.reason };
    return { ok: true };
  } catch {
    return { ok: true, reason: "local_only" };
  }
}

export async function sendThanksMessage(opts: {
  playerId: string;
  messageId: string;
  text: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const clean = sanitizeFanMessage(opts.text);
  if (!clean.ok) return { ok: false, reason: clean.reason };

  // local gate: only mission-complete msgs
  const inbox = readLocalInbox(opts.playerId);
  const target = inbox.find((m) => m.id === opts.messageId);
  if (target && !canAttachThanks(target)) {
    return { ok: false, reason: target.thanksSent ? "already" : "not_mission" };
  }
  if (readIdSet(THANKS_KEY).has(opts.messageId)) {
    return { ok: false, reason: "already" };
  }

  try {
    const res = await fetch("/api/share/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "thanks",
        playerId: opts.playerId,
        messageId: opts.messageId,
        text: clean.text,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        ok?: boolean;
        reason?: string;
        to?: string;
      };
      if (data.ok === false) {
        if (data.reason === "already") {
          const s = readIdSet(THANKS_KEY);
          s.add(opts.messageId);
          writeIdSet(THANKS_KEY, s);
        }
        return { ok: false, reason: data.reason };
      }
      const s = readIdSet(THANKS_KEY);
      s.add(opts.messageId);
      writeIdSet(THANKS_KEY, s);
      try {
        const all = JSON.parse(localStorage.getItem(MSG_KEY) || "{}") as Record<
          string,
          FanMessage[]
        >;
        const list = all[opts.playerId] || [];
        all[opts.playerId] = list
          .map((m) => normalizeFanMessage(m))
          .filter((m): m is FanMessage => !!m)
          .map((m) =>
            m.id === opts.messageId
              ? { ...m, thanksSent: true, canThanks: true, source: "mission" as const }
              : m,
          );
        localStorage.setItem(MSG_KEY, JSON.stringify(all));
        if (data.to) {
          // お礼は canThanks:false — 連鎖不可
          pushLocalMessage(data.to, {
            id: `tlocal-${opts.messageId}`,
            from: opts.playerId,
            body: clean.text,
            at: new Date().toISOString(),
            source: "thanks",
            canThanks: false,
            thanksSent: true,
          });
        }
      } catch {
        /* ignore */
      }
      return { ok: true };
    }
    return { ok: false, reason: "net" };
  } catch {
    return { ok: false, reason: "net" };
  }
}

export async function sendFanMessage(opts: {
  sharerId: string;
  shareId: string;
  visitorId: string;
  text: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const clean = sanitizeFanMessage(opts.text);
  if (!clean.ok) return { ok: false, reason: clean.reason };
  const text = clean.text;
  if (!opts.shareId) return { ok: false, reason: "share" };
  if (!allMissionsDone(opts.shareId)) return { ok: false, reason: "missions" };
  if (opts.sharerId === opts.visitorId) return { ok: false, reason: "self" };
  if (hasSentFanMessage(opts.shareId, opts.visitorId)) {
    return { ok: false, reason: "already" };
  }

  const localId = `flocal-${opts.shareId}-${opts.visitorId}`;
  const payload: FanMessage = {
    id: localId,
    from: opts.visitorId,
    body: text,
    at: new Date().toISOString(),
    shareId: opts.shareId,
    source: "mission",
    canThanks: true,
    thanksSent: false,
  };

  try {
    const res = await fetch("/api/share/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fan",
        sharerId: opts.sharerId,
        shareId: opts.shareId,
        visitorId: opts.visitorId,
        text,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (data.ok === false) {
        if (data.reason === "already") {
          markFanMessageSent(opts.shareId, opts.visitorId);
        }
        return { ok: false, reason: data.reason };
      }
      markFanMessageSent(opts.shareId, opts.visitorId);
      pushLocalMessage(opts.sharerId, payload);
      return { ok: true };
    }
    markFanMessageSent(opts.shareId, opts.visitorId);
    pushLocalMessage(opts.sharerId, payload);
    return { ok: true, reason: "local_only" };
  } catch {
    markFanMessageSent(opts.shareId, opts.visitorId);
    pushLocalMessage(opts.sharerId, payload);
    return { ok: true, reason: "local_only" };
  }
}

export async function fetchInbox(playerId: string): Promise<FanMessage[]> {
  const local = readLocalInbox(playerId);
  const deleted = readIdSet(DELETED_KEY);
  const thanks = readIdSet(THANKS_KEY);
  try {
    const res = await fetch(
      `/api/share/message?playerId=${encodeURIComponent(playerId)}`,
    );
    if (!res.ok) return local;
    const data = (await res.json()) as { messages?: unknown[] };
    const remote = (data.messages || [])
      .map((raw) =>
        normalizeFanMessage(raw as Partial<FanMessage> & { kind?: string }),
      )
      .filter((m): m is FanMessage => !!m && !deleted.has(m.id));

    const byId = new Map<string, FanMessage>();
    for (const m of local) byId.set(m.id, m);
    for (const m of remote) {
      const prev = byId.get(m.id);
      const merged = normalizeFanMessage({
        ...prev,
        ...m,
        thanksSent: m.thanksSent || thanks.has(m.id) || prev?.thanksSent,
      });
      if (merged) byId.set(m.id, merged);
    }
    try {
      const all = JSON.parse(localStorage.getItem(MSG_KEY) || "{}") as Record<
        string,
        FanMessage[]
      >;
      all[playerId] = [...byId.values()];
      localStorage.setItem(MSG_KEY, JSON.stringify(all));
    } catch {
      /* ignore */
    }
    return [...byId.values()];
  } catch {
    return local;
  }
}
