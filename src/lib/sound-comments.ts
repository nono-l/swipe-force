/** Sound-test comments, votes, URL reports/visits (local + API). */

import {
  sanitizeSoundComment,
  sanitizeUrlList,
} from "@/lib/sanitize-message";

export type SoundComment = {
  id: string;
  from: string;
  body: string;
  at: string;
  urls?: string[];
  /** legacy — no longer used in UI */
  kind?: string;
};

export type TrackVotes = {
  likes: number;
  dislikes: number;
  mine: number | null;
};

export const URL_REPORT_LABELS = [
  { id: "kami", label: "神", emoji: "✨", tone: "good" as const },
  { id: "affiliate", label: "アフィ", emoji: "💰", tone: "warn" as const },
  { id: "spam", label: "スパム", emoji: "🚫", tone: "bad" as const },
  { id: "gore", label: "グロ", emoji: "⚠️", tone: "bad" as const },
  { id: "fraud", label: "詐欺", emoji: "🚨", tone: "bad" as const },
  { id: "copyright", label: "著作権", emoji: "©️", tone: "warn" as const },
] as const;

export type UrlReportId = (typeof URL_REPORT_LABELS)[number]["id"];

export type UrlReportSummary = {
  counts: Record<string, number>;
  mine: string | null;
  visited?: boolean;
};

const LS_KEY = "swipe_force_sound_comments_v2";
const VOTE_LS = "swipe_force_sound_votes_v1";
const URL_REP_LS = "swipe_force_url_reports_v1";
const VISIT_LS = "swipe_force_url_visits_v1";

export function trackKey(
  kind: "title" | "stage" | "boss" | "legacy",
  n = 0,
): string {
  if (kind === "title") return "title";
  return `${kind}:${n}`;
}

export function trackLabel(
  kind: "title" | "stage" | "boss" | "legacy",
  n = 0,
  playing = "",
): string {
  if (playing) return playing;
  if (kind === "title") return "TITLE THEME";
  return `${kind.toUpperCase()} ${String(n).padStart(2, "0")}`;
}

function readAll(): Record<string, SoundComment[]> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") as Record<
      string,
      SoundComment[]
    >;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, SoundComment[]>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function readLocalComments(key: string): SoundComment[] {
  return readAll()[key] || [];
}

export function saveLocalComment(key: string, c: SoundComment) {
  const all = readAll();
  const list = all[key] || [];
  if (list.some((x) => x.id === c.id)) return;
  all[key] = [c, ...list].slice(0, 50);
  writeAll(all);
}

export function mergeComments(
  a: SoundComment[],
  b: SoundComment[],
): SoundComment[] {
  const map = new Map<string, SoundComment>();
  for (const c of [...a, ...b]) {
    if (!c?.id) continue;
    map.set(c.id, {
      ...c,
      urls: Array.isArray(c.urls) ? c.urls : [],
    });
  }
  return [...map.values()]
    .sort((x, y) => (y.at || "").localeCompare(x.at || ""))
    .slice(0, 50);
}

export async function fetchTrackComments(key: string): Promise<SoundComment[]> {
  const local = readLocalComments(key);
  try {
    const res = await fetch(
      `/api/sound/comments?track=${encodeURIComponent(key)}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return local;
    const data = (await res.json()) as { comments?: SoundComment[] };
    const remote = Array.isArray(data.comments) ? data.comments : [];
    const merged = mergeComments(local, remote);
    const all = readAll();
    all[key] = merged;
    writeAll(all);
    return merged;
  } catch {
    return local;
  }
}

export async function postTrackComment(
  key: string,
  playerId: string,
  text: string,
  urls: string[] = [],
): Promise<{ ok: boolean; reason?: string; comment?: SoundComment }> {
  const urlOk = sanitizeUrlList(urls);
  if (!urlOk.ok) return { ok: false, reason: urlOk.reason };

  let bodyText = "";
  if (text.trim()) {
    const sanitized = sanitizeSoundComment(text);
    if (!sanitized.ok) return { ok: false, reason: sanitized.reason };
    bodyText = sanitized.text;
  }
  if (!bodyText && urlOk.urls.length === 0) {
    return { ok: false, reason: "empty" };
  }

  try {
    const res = await fetch("/api/sound/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        track: key,
        playerId,
        body: bodyText || " ",
        urls: urlOk.urls,
        kind: "note",
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      reason?: string;
      comment?: SoundComment;
    };
    if (data.comment) {
      saveLocalComment(key, data.comment);
      return { ok: true, comment: data.comment };
    }
    if (!res.ok)
      return {
        ok: false,
        reason: data.reason || (res.status === 401 ? "link_required" : "fail"),
      };
    return { ok: !!data.ok, reason: data.reason };
  } catch {
    return { ok: false, reason: "link_required" };
  }
}

// —— votes ——

function readVotesAll(): Record<string, TrackVotes> {
  try {
    return JSON.parse(localStorage.getItem(VOTE_LS) || "{}") as Record<
      string,
      TrackVotes
    >;
  } catch {
    return {};
  }
}

function writeVotesAll(all: Record<string, TrackVotes>) {
  try {
    localStorage.setItem(VOTE_LS, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export async function fetchTrackVotes(
  track: string,
  playerId: string,
): Promise<TrackVotes> {
  const local = readVotesAll()[track] || { likes: 0, dislikes: 0, mine: null };
  try {
    const res = await fetch(
      `/api/sound/votes?track=${encodeURIComponent(track)}&playerId=${encodeURIComponent(playerId)}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return local;
    const data = (await res.json()) as TrackVotes;
    const next: TrackVotes = {
      likes: Number(data.likes) || 0,
      dislikes: Number(data.dislikes) || 0,
      mine:
        data.mine === 1 || data.mine === -1
          ? data.mine
          : data.mine == null
            ? null
            : Number(data.mine) || null,
    };
    const all = readVotesAll();
    all[track] = next;
    writeVotesAll(all);
    return next;
  } catch {
    return local;
  }
}

export async function postTrackVote(
  track: string,
  playerId: string,
  vote: 1 | -1,
): Promise<TrackVotes> {
  // toggle: same vote again clears
  const cur = readVotesAll()[track] || { likes: 0, dislikes: 0, mine: null };
  const send = cur.mine === vote ? 0 : vote;
  try {
    const res = await fetch("/api/sound/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ track, playerId, vote: send }),
    });
    const data = (await res.json()) as TrackVotes & { ok?: boolean };
    if (res.ok || data.likes != null) {
      const next: TrackVotes = {
        likes: Number(data.likes) || 0,
        dislikes: Number(data.dislikes) || 0,
        mine:
          data.mine === 1 || data.mine === -1
            ? data.mine
            : data.mine == null
              ? null
              : Number(data.mine) || null,
      };
      const all = readVotesAll();
      all[track] = next;
      writeVotesAll(all);
      return next;
    }
  } catch {
    /* offline optimistic */
  }
  // optimistic local
  let likes = cur.likes;
  let dislikes = cur.dislikes;
  if (cur.mine === 1) likes = Math.max(0, likes - 1);
  if (cur.mine === -1) dislikes = Math.max(0, dislikes - 1);
  let mine: number | null = send === 0 ? null : send;
  if (send === 1) likes++;
  if (send === -1) dislikes++;
  const next = { likes, dislikes, mine };
  const all = readVotesAll();
  all[track] = next;
  writeVotesAll(all);
  return next;
}

// —— URL reports / visits ——

function urlRepKey(track: string, url: string) {
  return `${track}::${url}`;
}

function readUrlRepAll(): Record<string, UrlReportSummary> {
  try {
    return JSON.parse(localStorage.getItem(URL_REP_LS) || "{}") as Record<
      string,
      UrlReportSummary
    >;
  } catch {
    return {};
  }
}

function writeUrlRepAll(all: Record<string, UrlReportSummary>) {
  try {
    localStorage.setItem(URL_REP_LS, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function readVisits(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(VISIT_LS) || "{}") as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}

function writeVisits(v: Record<string, boolean>) {
  try {
    localStorage.setItem(VISIT_LS, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(URL_REPORT_LABELS.map((x) => [x.id, 0]));
}

export function hasLocalUrlVisit(track: string, url: string): boolean {
  return !!readVisits()[urlRepKey(track, url)];
}

export async function fetchUrlReports(
  track: string,
  urls: string[],
  playerId: string,
): Promise<Record<string, UrlReportSummary>> {
  if (!urls.length) return {};
  const localAll = readUrlRepAll();
  const local: Record<string, UrlReportSummary> = {};
  for (const u of urls) {
    local[u] = localAll[urlRepKey(track, u)] || {
      counts: emptyCounts(),
      mine: null,
      visited: hasLocalUrlVisit(track, u),
    };
  }
  try {
    const res = await fetch(
      `/api/sound/url-report?track=${encodeURIComponent(track)}&playerId=${encodeURIComponent(playerId)}&urls=${encodeURIComponent(JSON.stringify(urls))}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return local;
    const data = (await res.json()) as {
      reports?: Record<string, UrlReportSummary>;
    };
    const reports = data.reports || {};
    const all = readUrlRepAll();
    for (const [u, sum] of Object.entries(reports)) {
      const next = {
        ...sum,
        visited: sum.visited || hasLocalUrlVisit(track, u),
      };
      all[urlRepKey(track, u)] = next;
      local[u] = next;
    }
    writeUrlRepAll(all);
    return local;
  } catch {
    return local;
  }
}

export async function postUrlReport(
  track: string,
  url: string,
  playerId: string,
  reason: UrlReportId,
): Promise<UrlReportSummary & { ok: boolean; reason?: string }> {
  try {
    const res = await fetch("/api/sound/url-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ track, playerId, url, reason }),
    });
    const data = (await res.json()) as UrlReportSummary & {
      ok?: boolean;
      reason?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        reason: data.reason || "fail",
        counts: data.counts || emptyCounts(),
        mine: null,
        visited: false,
      };
    }
    if (data && data.counts) {
      const all = readUrlRepAll();
      const sum: UrlReportSummary = {
        counts: data.counts,
        mine: data.mine ?? null,
        visited: true,
      };
      all[urlRepKey(track, url)] = sum;
      writeUrlRepAll(all);
      return { ok: true, ...sum };
    }
  } catch {
    /* offline */
  }
  if (!hasLocalUrlVisit(track, url)) {
    return {
      ok: false,
      reason: "not_visited",
      counts: emptyCounts(),
      mine: null,
      visited: false,
    };
  }
  const all = readUrlRepAll();
  const k = urlRepKey(track, url);
  const cur = all[k] || {
    counts: emptyCounts(),
    mine: null as string | null,
    visited: true,
  };
  const counts = { ...cur.counts };
  if (cur.mine && counts[cur.mine] != null) {
    counts[cur.mine] = Math.max(0, (counts[cur.mine] || 0) - 1);
  }
  let mine: string | null = reason;
  if (cur.mine === reason) {
    mine = null;
  } else {
    counts[reason] = (counts[reason] || 0) + 1;
  }
  const next = { counts, mine, visited: true };
  all[k] = next;
  writeUrlRepAll(all);
  return { ok: true, ...next };
}

export async function markUrlVisited(
  track: string,
  url: string,
  playerId: string,
  opts?: { allowGuest?: boolean },
): Promise<boolean> {
  try {
    const res = await fetch("/api/sound/url-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ track, playerId, url }),
    });
    if (res.status === 401) {
      if (!opts?.allowGuest) return false;
    } else if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!data.ok && !opts?.allowGuest) return false;
    }
  } catch {
    if (!opts?.allowGuest) return false;
  }
  const visits = readVisits();
  visits[urlRepKey(track, url)] = true;
  writeVisits(visits);
  const all = readUrlRepAll();
  const k = urlRepKey(track, url);
  const cur = all[k] || {
    counts: emptyCounts(),
    mine: null as string | null,
  };
  all[k] = { ...cur, visited: true };
  writeUrlRepAll(all);
  return true;
}

export async function checkUrlVisited(
  track: string,
  url: string,
  playerId: string,
): Promise<boolean> {
  if (hasLocalUrlVisit(track, url)) return true;
  try {
    const res = await fetch(
      `/api/sound/url-visit?track=${encodeURIComponent(track)}&playerId=${encodeURIComponent(playerId)}&url=${encodeURIComponent(url)}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { visited?: boolean };
    if (data.visited) {
      const visits = readVisits();
      visits[urlRepKey(track, url)] = true;
      writeVisits(visits);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
