/**
 * Share-mission HUD strips (title ti + in-play ei).
 */

export type MissionDef = {
  id: string;
  label: string;
  detail: string;
};

export type MissionChip = {
  id: string;
  label: string;
  done: boolean;
  mark: string;
  color: string;
  markColor: string;
  x: number;
};

export function buildMissionChips(
  missions: readonly MissionDef[],
  doneMap: Record<string, boolean>,
  startX = 100,
  step = 36,
): MissionChip[] {
  let e = startX;
  return missions.map((t) => {
    const n = !!doneMap[t.id];
    const chip: MissionChip = {
      id: t.id,
      label: t.label,
      done: n,
      mark: n ? "✓" : "·",
      color: n ? "#ffff66" : "#557766",
      markColor: n ? "#88ff88" : "#445544",
      x: e,
    };
    e += step;
    return chip;
  });
}

export function missionNextLine(
  missions: readonly MissionDef[],
  doneMap: Record<string, boolean>,
  allClear: boolean,
): string | null {
  if (allClear) return "ALL CLEAR · メッセージ送信可";
  const t = missions.find((e) => !doneMap[e.id]);
  return t ? `NEXT: ${t.detail} → ¢+1` : null;
}

export type TitleMissionRow = {
  id: string;
  line: string;
  color: string;
  y: number;
};

export function buildTitleMissionRows(
  missions: readonly MissionDef[],
  doneMap: Record<string, boolean>,
  startY = 118,
  step = 10,
): TitleMissionRow[] {
  let t = startY;
  return missions.map((e) => {
    const n = !!doneMap[e.id];
    const row: TitleMissionRow = {
      id: e.id,
      line: `${n ? "✓" : "○"} ${e.detail}  →  ¢+1`,
      color: n ? "#88ff88" : "#aabbcc",
      y: t,
    };
    t += step;
    return row;
  });
}

export function titleMissionFooter(
  allClear: boolean,
  msgSent: boolean,
): string | null {
  if (!allClear) return null;
  return msgSent
    ? "このシェアではMSG送信済"
    : "全クリア! このシェアでMSG 1回";
}
