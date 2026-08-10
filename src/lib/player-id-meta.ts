/** Local metadata for game player IDs (creation time). */

const META_KEY = "swipe_force_id_meta_v1";

export type PlayerIdMeta = {
  createdAt: string; // ISO
};

type MetaMap = Record<string, PlayerIdMeta>;

function loadMap(): MetaMap {
  try {
    const raw = JSON.parse(localStorage.getItem(META_KEY) || "{}") as MetaMap;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function saveMap(m: MetaMap) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function normalizeIso(raw: unknown): string {
  const s = String(raw || "").trim().slice(0, 40);
  if (!s) return "";
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toISOString();
}

/** Earliest non-empty ISO wins (ID birth stays oldest). */
export function earliestIso(...vals: (string | null | undefined)[]): string {
  let best = "";
  let bestMs = Infinity;
  for (const v of vals) {
    const iso = normalizeIso(v);
    if (!iso) continue;
    const ms = Date.parse(iso);
    if (ms < bestMs) {
      bestMs = ms;
      best = iso;
    }
  }
  return best;
}

/** Read creation time for a player id (may be empty if unknown). */
export function getIdCreatedAt(playerId: string): string {
  const id = String(playerId || "").replace(/[^a-z0-9]/gi, "").slice(0, 32);
  if (!id) return "";
  const m = loadMap();
  return normalizeIso(m[id]?.createdAt);
}

/**
 * Ensure creation time exists for this id.
 * - If missing, stamp now (or `prefer` if provided)
 * - If both exist, keep the earlier one
 */
export function ensureIdCreatedAt(
  playerId: string,
  prefer?: string | null,
): string {
  const id = String(playerId || "").replace(/[^a-z0-9]/gi, "").slice(0, 32);
  if (!id) return "";
  const m = loadMap();
  const prev = normalizeIso(m[id]?.createdAt);
  const pref = normalizeIso(prefer);
  const next = earliestIso(prev, pref) || prev || pref || new Date().toISOString();
  if (next !== prev) {
    m[id] = { createdAt: next };
    saveMap(m);
  }
  return next;
}


/** Apply cloud/local merge: keep earliest creation time. */
export function applyIdCreatedAt(
  playerId: string,
  cloudCreatedAt?: string | null,
): string {
  return ensureIdCreatedAt(playerId, cloudCreatedAt);
}

export function formatIdCreatedAt(iso: string): string {
  const s = normalizeIso(iso);
  if (!s) return "—";
  try {
    const d = new Date(s);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${mo}/${da} ${h}:${mi}`;
  } catch {
    return s.slice(0, 16);
  }
}
