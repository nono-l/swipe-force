/**
 * Mission clear / reject float texts (recovered mi).
 */

export type FloatText = {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
};

export function missionClearFloats(opts: {
  label: string;
  allClearCanMsg: boolean;
  cx: number;
  cy: number;
}): {
  toast: string;
  toastLife: number;
  bannerFrames: number;
  floats: FloatText[];
} {
  const floats: FloatText[] = [
    {
      x: opts.cx,
      y: opts.cy * 0.3,
      text: `${opts.label} CLEAR!`,
      color: "#ffff66",
      life: 100,
    },
    {
      x: opts.cx,
      y: opts.cy * 0.38,
      text: "¢+1 → sharer",
      color: "#ffcc66",
      life: 100,
    },
  ];
  if (opts.allClearCanMsg) {
    floats.push({
      x: opts.cx,
      y: opts.cy * 0.46,
      text: "ALL CLEAR · MSG 1x",
      color: "#ffaadd",
      life: 120,
    });
  }
  return {
    toast: `${opts.label} CLEAR!`,
    toastLife: 120,
    bannerFrames: 160,
    floats,
  };
}

export function missionTooFastFloats(opts: {
  label: string;
  cx: number;
  cy: number;
}): { toast: string; toastLife: number; floats: FloatText[] } {
  return {
    toast: `${opts.label} 早すぎ`,
    toastLife: 90,
    floats: [
      {
        x: opts.cx,
        y: opts.cy * 0.35,
        text: "TOO FAST",
        color: "#ff8888",
        life: 80,
      },
    ],
  };
}

export type FanmailGate =
  | { ok: true }
  | { ok: false; reason: "no_share" | "already" | "missions" | "busy" };

export function fanmailGate(opts: {
  sharerId: string | null | undefined;
  alreadySent: boolean;
  allMissionsClear: boolean;
  busy: boolean;
}): FanmailGate {
  if (!opts.sharerId) return { ok: false, reason: "no_share" };
  if (opts.alreadySent) return { ok: false, reason: "already" };
  if (!opts.allMissionsClear) return { ok: false, reason: "missions" };
  if (opts.busy) return { ok: false, reason: "busy" };
  return { ok: true };
}

export function fanmailGateMessage(reason: FanmailGate extends { ok: false } ? FanmailGate["reason"] : never): string {
  if (reason === "already") return "このシェアでは送信済み";
  if (reason === "missions") return "全ミッションクリア後に送信可";
  return "";
}
