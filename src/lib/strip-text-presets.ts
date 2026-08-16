/**
 * Reusable text styles for the strip/banner editor.
 * - Always: localStorage
 * - Linked: also Postgres (per player)
 */

export type StripTextPreset = {
  id: string;
  name: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  rot: number;
  opacity: number;
  shadow: boolean;
  shadowBlur: number;
  shadowColor: string;
  outline: boolean;
  outlineWidth: number;
  outlineColor: string;
  updatedAt: string;
  source?: "local" | "cloud";
};

const LS_KEY = "sf_strip_text_presets_v1";
const MAX_LOCAL = 40;
const MAX_NAME = 40;
const MAX_TEXT = 80;

function uid(): string {
  return `t${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitize(p: Partial<StripTextPreset> & { text?: string }): StripTextPreset | null {
  const text = String(p.text ?? "").slice(0, MAX_TEXT);
  if (!text.trim() && !String(p.name || "").trim()) return null;
  return {
    id: String(p.id || uid()).slice(0, 40),
    name: String(p.name || text.slice(0, 20) || "テキスト").slice(0, MAX_NAME),
    text: text || "テキスト",
    fontSize: Math.max(10, Math.min(96, Number(p.fontSize) || 28)),
    fontFamily: String(p.fontFamily || "system-ui,sans-serif").slice(0, 160),
    color: String(p.color || "#ffffff").slice(0, 20),
    bold: p.bold !== false,
    rot: Math.max(-180, Math.min(180, Number(p.rot) || 0)),
    opacity: Math.max(0, Math.min(100, Math.round(Number(p.opacity ?? 100)))),
    shadow: !!p.shadow,
    shadowBlur: Math.max(0, Math.min(24, Number(p.shadowBlur) || 6)),
    shadowColor: String(p.shadowColor || "#000000").slice(0, 20),
    outline: !!p.outline,
    outlineWidth: Math.max(1, Math.min(12, Number(p.outlineWidth) || 3)),
    outlineColor: String(p.outlineColor || "#000000").slice(0, 20),
    updatedAt: String(p.updatedAt || new Date().toISOString()),
    source: p.source,
  };
}

export function loadLocalTextPresets(): StripTextPreset[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => sanitize({ ...(x as object), source: "local" }))
      .filter((x): x is StripTextPreset => !!x)
      .slice(0, MAX_LOCAL);
  } catch {
    return [];
  }
}

export function saveLocalTextPresets(list: StripTextPreset[]): void {
  try {
    const clean = list
      .map((x) => sanitize(x))
      .filter((x): x is StripTextPreset => !!x)
      .slice(0, MAX_LOCAL);
    localStorage.setItem(LS_KEY, JSON.stringify(clean));
  } catch {
    /* quota */
  }
}

export function upsertLocalTextPreset(
  preset: Omit<StripTextPreset, "updatedAt" | "source"> & {
    id?: string;
    updatedAt?: string;
  },
): StripTextPreset {
  const list = loadLocalTextPresets();
  const full = sanitize({
    ...preset,
    id: preset.id || uid(),
    updatedAt: new Date().toISOString(),
    source: "local",
  })!;
  const i = list.findIndex((x) => x.id === full.id);
  if (i >= 0) list[i] = full;
  else list.unshift(full);
  saveLocalTextPresets(list);
  return full;
}

export function removeLocalTextPreset(id: string): void {
  saveLocalTextPresets(loadLocalTextPresets().filter((x) => x.id !== id));
}

export async function fetchCloudTextPresets(
  playerId: string,
): Promise<StripTextPreset[]> {
  if (!playerId || playerId.length < 4) return [];
  try {
    const res = await fetch(
      `/api/share/strip-presets?playerId=${encodeURIComponent(playerId)}`,
      { credentials: "same-origin" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      presets?: StripTextPreset[];
    };
    if (!data.ok || !Array.isArray(data.presets)) return [];
    return data.presets
      .map((x) => sanitize({ ...x, source: "cloud" }))
      .filter((x): x is StripTextPreset => !!x);
  } catch {
    return [];
  }
}

export async function saveCloudTextPreset(
  playerId: string,
  preset: StripTextPreset,
): Promise<{ ok: boolean; reason?: string; preset?: StripTextPreset }> {
  try {
    const res = await fetch("/api/share/strip-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "upsert", preset }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      preset?: StripTextPreset;
    };
    if (!data.ok) return { ok: false, reason: data.reason || "fail" };
    return {
      ok: true,
      preset: data.preset
        ? sanitize({ ...data.preset, source: "cloud" }) || undefined
        : preset,
    };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function deleteCloudTextPreset(
  playerId: string,
  id: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch("/api/share/strip-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ playerId, action: "delete", id }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
    };
    return data.ok ? { ok: true } : { ok: false, reason: data.reason || "fail" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

/** Merge local + cloud (cloud wins on same id) */
export function mergePresets(
  local: StripTextPreset[],
  cloud: StripTextPreset[],
): StripTextPreset[] {
  const map = new Map<string, StripTextPreset>();
  for (const p of local) map.set(p.id, { ...p, source: "local" });
  for (const p of cloud) map.set(p.id, { ...p, source: "cloud" });
  return [...map.values()].sort((a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || ""),
  );
}

export async function loadAllTextPresets(
  playerId?: string | null,
): Promise<StripTextPreset[]> {
  const local = loadLocalTextPresets();
  if (!playerId) return local;
  const cloud = await fetchCloudTextPresets(playerId);
  return mergePresets(local, cloud);
}
