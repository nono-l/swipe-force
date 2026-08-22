/**
 * JPDOC: プロモコードの核。付与は grant_json の文字列1本。カラムを種類ごとに増やさない。
 *
 * カーネルは中身の意味を知らない。期限・回数・二度渡ししない、だけを見る。
 */

export type GrantBundle = {
  stageTicket?: number;
  ptsX5?: number;
  ptsX10?: number;
  ptsPack?: number;
  /**
   * 特殊武器の解禁。カンマ区切り1文字列（DBは grant_json のみ）。
   * 例: "beam,flame" — 許可: beam (OPT-LASER), flame (FLAME)
   */
  unlocks?: string;
};

export type PromoDefServer = {
  code: string;
  label: string;
  grant: GrantBundle;
  custom: boolean;
  active?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  /** 使ったユニークプレイヤー数 */
  claimCount?: number;
  /** ISO 日時。空なら無期限 */
  expiresAt?: string;
  /** 0 なら無制限 */
  maxClaims?: number;
};

/** 期限を正規化。空・不正は ''。日付のみならその日の終端（UTC）。 */
export function normalizeExpiresAt(raw: unknown): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  // YYYY-MM-DD → その日の終わり UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const t = Date.parse(s + "T23:59:59.999Z");
    if (!Number.isFinite(t)) return "";
    return new Date(t).toISOString();
  }
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toISOString();
}

/** 0 は無制限。上限 1_000_000 */
export function normalizeMaxClaims(raw: unknown): number {
  const n = Math.floor(Number(raw) || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(1_000_000, n);
}

export function isPromoExpired(
  expiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  const exp = String(expiresAt || "").trim();
  if (!exp) return false;
  const t = Date.parse(exp);
  if (!Number.isFinite(t)) return false;
  return now > t;
}

export function isPromoSoldOut(
  maxClaims: number | null | undefined,
  claimCount: number | null | undefined,
): boolean {
  const max = normalizeMaxClaims(maxClaims);
  if (max <= 0) return false;
  return (Number(claimCount) || 0) >= max;
}

export function formatExpiresLabel(expiresAt: string | null | undefined): string {
  const exp = String(expiresAt || "").trim();
  if (!exp) return "期限なし";
  const t = Date.parse(exp);
  if (!Number.isFinite(t)) return "期限なし";
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `〜${y}/${m}/${da}`;
}

export function formatMaxClaimsLabel(
  maxClaims: number | null | undefined,
  claimCount?: number | null,
): string {
  const max = normalizeMaxClaims(maxClaims);
  const used = Number(claimCount) || 0;
  if (max <= 0) return `使用 ${used}回 / 上限なし`;
  return `使用 ${used}/${max}回`;
}

export const BUILTIN_PROMOS: PromoDefServer[] = [
  {
    code: "WELCOME",
    label: "ウェルカム",
    grant: { stageTicket: 1, ptsX5: 1, ptsPack: 1 },
    custom: false,
  },
  {
    code: "STAGEPASS",
    label: "ステージパス",
    grant: { stageTicket: 2 },
    custom: false,
  },
  {
    code: "PTS5",
    label: "PTS×5 配布",
    grant: { ptsX5: 1 },
    custom: false,
  },
  {
    code: "PTS10",
    label: "PTS×10 配布",
    grant: { ptsX10: 1 },
    custom: false,
  },
  {
    code: "PTS5K",
    label: "PTS+5000 配布",
    grant: { ptsPack: 1 },
    custom: false,
  },
  {
    code: "FORCE2026",
    label: "FORCE2026 キャンペーン",
    grant: { stageTicket: 2, ptsX10: 1, ptsPack: 2 },
    custom: false,
  },
  {
    code: "SWIPE",
    label: "SWIPE プロモ",
    grant: { stageTicket: 1, ptsX5: 1 },
    custom: false,
  },
];

export function normalizePromoCode(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 24);
}

function clampQty(n: unknown, max = 99): number {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(max, v));
}

/** Whitelist unlock tokens (keep in sync with weapon-unlocks.ts). */
const UNLOCK_OK = new Set(["beam", "flame"]);

export function normalizeUnlocksField(raw: unknown): string {
  if (raw == null || raw === "") return "";
  let parts: string[] = [];
  if (typeof raw === "string") parts = raw.split(/[\s,|+/]+/);
  else if (Array.isArray(raw)) parts = raw.map(String);
  else if (typeof raw === "object") {
    parts = Object.keys(raw as object).filter(
      (k) => !!(raw as Record<string, unknown>)[k],
    );
  }
  const out: string[] = [];
  for (const p of parts) {
    let id = String(p || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    if (id === "optlaser" || id === "opt-laser" || id === "laser") id = "beam";
    if (id === "fire" || id === "flamethrower") id = "flame";
    if (UNLOCK_OK.has(id) && !out.includes(id)) out.push(id);
  }
  return out.join(",");
}

export function sanitizeGrant(g: GrantBundle | null | undefined): GrantBundle {
  const out: GrantBundle = {};
  const t = clampQty(g?.stageTicket);
  const a = clampQty(g?.ptsX5);
  const b = clampQty(g?.ptsX10);
  const c = clampQty(g?.ptsPack);
  const u = normalizeUnlocksField(
    g && "unlocks" in (g as object) ? (g as GrantBundle).unlocks : "",
  );
  if (t) out.stageTicket = t;
  if (a) out.ptsX5 = a;
  if (b) out.ptsX10 = b;
  if (c) out.ptsPack = c;
  if (u) out.unlocks = u;
  return out;
}

export function grantIsEmpty(g: GrantBundle): boolean {
  return !(
    (g.stageTicket || 0) +
      (g.ptsX5 || 0) +
      (g.ptsX10 || 0) +
      (g.ptsPack || 0) ||
    (g.unlocks && g.unlocks.length > 0)
  );
}

export function parseGrantJson(raw: string | null | undefined): GrantBundle {
  try {
    return sanitizeGrant(JSON.parse(raw || "{}") as GrantBundle);
  } catch {
    return {};
  }
}

export function formatGrantSummary(g: GrantBundle): string {
  const parts: string[] = [];
  if (g.stageTicket) parts.push(`TICKET×${g.stageTicket}`);
  if (g.ptsX5) parts.push(`×5×${g.ptsX5}`);
  if (g.ptsX10) parts.push(`×10×${g.ptsX10}`);
  if (g.ptsPack) parts.push(`+5K×${g.ptsPack}`);
  if (g.unlocks) {
    const u = g.unlocks
      .split(",")
      .map((id) =>
        id === "beam" ? "OPT-LASER" : id === "flame" ? "FLAME" : id.toUpperCase(),
      )
      .join("+");
    if (u) parts.push(`UNLOCK:${u}`);
  }
  return parts.length ? parts.join(" ") : "なし";
}

export function isBuiltinCode(code: string): boolean {
  const c = normalizePromoCode(code);
  return BUILTIN_PROMOS.some((d) => d.code === c);
}

export function findBuiltin(code: string): PromoDefServer | null {
  const c = normalizePromoCode(code);
  return BUILTIN_PROMOS.find((d) => d.code === c) || null;
}
