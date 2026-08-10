/** Persistent player stats (local). */

import {
  readLocalEasyUpgrades,
  type EasyUpgrades,
  readLocalProfile,
} from "@/lib/account";
import { readLocalCoins, getOrCreatePlayerId } from "@/lib/share";

const KEY = "swipe_force_stats_v1";

export type PlayerStats = {
  playTimeSec: number;
  helpAsked: number;
  helpReceived: number;
  maxStageEasy: number;
  maxStageNormal: number;
  runs: number;
  totalKills: number;
  bossesDefeated: number;
  continuesUsed: number;
  hiScore: number;
  lastPlayedAt: string;
};

const EMPTY: PlayerStats = {
  playTimeSec: 0,
  helpAsked: 0,
  helpReceived: 0,
  maxStageEasy: 0,
  maxStageNormal: 0,
  runs: 0,
  totalKills: 0,
  bossesDefeated: 0,
  continuesUsed: 0,
  hiScore: 0,
  lastPlayedAt: "",
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function readStats(): PlayerStats {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<PlayerStats>;
    return {
      playTimeSec: clamp(Number(p.playTimeSec) || 0, 0, 1e9),
      helpAsked: clamp(Number(p.helpAsked) || 0, 0, 1e7),
      helpReceived: clamp(Number(p.helpReceived) || 0, 0, 1e7),
      maxStageEasy: clamp(Number(p.maxStageEasy) || 0, 0, 999),
      maxStageNormal: clamp(Number(p.maxStageNormal) || 0, 0, 999),
      runs: clamp(Number(p.runs) || 0, 0, 1e7),
      totalKills: clamp(Number(p.totalKills) || 0, 0, 1e9),
      bossesDefeated: clamp(Number(p.bossesDefeated) || 0, 0, 1e7),
      continuesUsed: clamp(Number(p.continuesUsed) || 0, 0, 1e7),
      hiScore: clamp(Number(p.hiScore) || 0, 0, 1e12),
      lastPlayedAt: String(p.lastPlayedAt || "").slice(0, 40),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeStats(s: PlayerStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function patchStats(partial: Partial<PlayerStats>) {
  const cur = readStats();
  const next = { ...cur, ...partial, lastPlayedAt: new Date().toISOString() };
  writeStats(next);
  return next;
}

export function addPlayTime(sec: number) {
  if (!(sec > 0)) return readStats();
  const cur = readStats();
  return patchStats({ playTimeSec: cur.playTimeSec + sec });
}

export function noteHelpAsked() {
  const cur = readStats();
  return patchStats({ helpAsked: cur.helpAsked + 1 });
}

export function noteHelpReceived(n = 1) {
  const cur = readStats();
  return patchStats({ helpReceived: cur.helpReceived + Math.max(0, n | 0) });
}

export function noteRunStart() {
  const cur = readStats();
  return patchStats({ runs: cur.runs + 1 });
}

export function noteStage(diff: "easy" | "normal", stage: number) {
  const cur = readStats();
  if (diff === "easy") {
    return patchStats({ maxStageEasy: Math.max(cur.maxStageEasy, stage | 0) });
  }
  return patchStats({ maxStageNormal: Math.max(cur.maxStageNormal, stage | 0) });
}

export function noteKill(n = 1) {
  const cur = readStats();
  return patchStats({ totalKills: cur.totalKills + n });
}

export function noteBossClear() {
  const cur = readStats();
  return patchStats({ bossesDefeated: cur.bossesDefeated + 1 });
}

export function noteContinue() {
  const cur = readStats();
  return patchStats({ continuesUsed: cur.continuesUsed + 1 });
}

export function noteHiScore(score: number) {
  const cur = readStats();
  if (score > cur.hiScore) return patchStats({ hiScore: score | 0 });
  return cur;
}

export function formatPlayTime(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}時間${m}分`;
  if (m > 0) return `${m}分${r}秒`;
  return `${r}秒`;
}

export function easyUpgradeSummary(up?: EasyUpgrades): string {
  const u = up || readLocalEasyUpgrades();
  const parts: string[] = [];
  const keys: (keyof EasyUpgrades)[] = [
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
  ];
  for (const k of keys) {
    if (u[k] > 0) parts.push(`${k.toUpperCase()}${u[k]}`);
  }
  return parts.length ? parts.join(" ") : "（なし）";
}

export function buildStatusLines(playerId?: string): string[] {
  const st = readStats();
  const pid = playerId || getOrCreatePlayerId();
  const coins = readLocalCoins(pid);
  const prof = readLocalProfile();
  const up = readLocalEasyUpgrades();
  const upTotal = Object.values(up).reduce((a, b) => a + b, 0);
  return [
    `ID ${pid}`,
    `総プレイ ${formatPlayTime(st.playTimeSec)}`,
    `ラン ${st.runs}  撃破 ${st.totalKills}  ボス ${st.bossesDefeated}`,
    `最高到達 E${st.maxStageEasy} / N${st.maxStageNormal}`,
    `ハイスコア ${st.hiScore}`,
    `ヘルプ求めた ${st.helpAsked}  貰った ${st.helpReceived}`,
    `コンティニュー使用 ${st.continuesUsed}  コイン ×${coins}`,
    `EASY強化 合計${upTotal}Lv`,
    easyUpgradeSummary(up).slice(0, 42),
    prof.hasProfile
      ? `プロフ ${prof.displayName || "—"}`
      : `プロフ 未設定`,
    prof.shareBlurb ? `シェア文 ${prof.shareBlurb.slice(0, 28)}` : `シェア文 未設定`,
  ];
}
