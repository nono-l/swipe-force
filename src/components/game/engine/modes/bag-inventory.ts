/**
 * Gift-only consumable bag (local). Stage ticket, PTS mult tickets, PTS packs.
 * Obtained via login bonus / promo links — not sold in shop.
 */

export const BAG_KEY = "swipe_force_bag_v1";
export const BAG_PENDING_KEY = "swipe_force_bag_pending_v1";

export type BagStock = {
  stageTicket: number;
  ptsX5: number;
  ptsX10: number;
  ptsPack: number;
};

export type BagPending = {
  /** Applied on next / current normal run PTS gains */
  ptsMult: 1 | 5 | 10;
  /** 0 = none; 1+ = start stage override */
  startStage: number;
};

export const EMPTY_BAG: BagStock = {
  stageTicket: 0,
  ptsX5: 0,
  ptsX10: 0,
  ptsPack: 0,
};

export const EMPTY_PENDING: BagPending = {
  ptsMult: 1,
  startStage: 0,
};

/** Legacy shop id → bag field (kept for grant/tools mapping) */
export const SHOP_ID_TO_BAG: Record<string, keyof BagStock> = {
  stage_ticket: "stageTicket",
  pts_x5: "ptsX5",
  pts_x10: "ptsX10",
  pts_pack: "ptsPack",
};

export function isStockableShopId(id: string): boolean {
  return id in SHOP_ID_TO_BAG;
}

export function bagFieldForShopId(id: string): keyof BagStock | null {
  return SHOP_ID_TO_BAG[id] ?? null;
}

function clampStock(n: number, max = 99): number {
  return Math.max(0, Math.min(max, n | 0));
}

export function loadBag(raw: string | null): BagStock {
  if (!raw) return { ...EMPTY_BAG };
  try {
    const t = JSON.parse(raw) as Partial<BagStock>;
    return {
      stageTicket: clampStock(Number(t.stageTicket) || 0),
      ptsX5: clampStock(Number(t.ptsX5) || 0),
      ptsX10: clampStock(Number(t.ptsX10) || 0),
      ptsPack: clampStock(Number(t.ptsPack) || 0),
    };
  } catch {
    return { ...EMPTY_BAG };
  }
}

export function serializeBag(b: BagStock): string {
  return JSON.stringify({
    stageTicket: clampStock(b.stageTicket),
    ptsX5: clampStock(b.ptsX5),
    ptsX10: clampStock(b.ptsX10),
    ptsPack: clampStock(b.ptsPack),
  });
}

export function loadPending(raw: string | null): BagPending {
  if (!raw) return { ...EMPTY_PENDING };
  try {
    const t = JSON.parse(raw) as Partial<BagPending>;
    const m = Number(t.ptsMult) || 1;
    const ptsMult: 1 | 5 | 10 = m === 10 ? 10 : m === 5 ? 5 : 1;
    return {
      ptsMult,
      startStage: Math.max(0, Math.min(999, Number(t.startStage) || 0)),
    };
  } catch {
    return { ...EMPTY_PENDING };
  }
}

export function serializePending(p: BagPending): string {
  return JSON.stringify({
    ptsMult: p.ptsMult === 10 || p.ptsMult === 5 ? p.ptsMult : 1,
    startStage: Math.max(0, p.startStage | 0),
  });
}

export function addBagStock(
  bag: BagStock,
  field: keyof BagStock,
  amount = 1,
  max = 99,
): BagStock {
  return {
    ...bag,
    [field]: clampStock((bag[field] || 0) + amount, max),
  };
}

export function consumeBagStock(
  bag: BagStock,
  field: keyof BagStock,
  amount = 1,
): { ok: boolean; bag: BagStock } {
  if ((bag[field] || 0) < amount) return { ok: false, bag };
  return {
    ok: true,
    bag: { ...bag, [field]: clampStock((bag[field] || 0) - amount) },
  };
}

/** Max cleared stage for stage select (at least 1 if any clear). */
export function maxSelectableStage(
  diff: "easy" | "normal" | string,
  stats: { maxStageEasy: number; maxStageNormal: number },
): number {
  if (diff === "normal") return Math.max(0, stats.maxStageNormal | 0);
  return Math.max(0, stats.maxStageEasy | 0);
}

export type BagRow =
  | { kind: "header"; label: string }
  | {
      kind: "claim_login";
      label: string;
      desc: string;
    }
  | {
      kind: "item";
      key: keyof BagStock;
      label: string;
      desc: string;
      stock: number;
      action: "use_stage" | "use_x5" | "use_x10" | "use_pack" | "locked";
      lockedReason?: string;
    }
  | { kind: "status"; label: string; value: string }
  | { kind: "back"; label: string };

export function buildBagRows(opts: {
  bag: BagStock;
  pending: BagPending;
  difficulty: string;
  inRun: boolean;
  maxStage: number;
  runPtsMult?: number;
  loginReady?: boolean;
  loginSummary?: string;
}): BagRow[] {
  const rows: BagRow[] = [
    { kind: "header", label: "— 配布アイテム · ショップ非売品 —" },
  ];

  if (opts.loginReady) {
    rows.push({
      kind: "claim_login",
      label: "LOGIN BONUS",
      desc: opts.loginSummary
        ? `受取 → ${opts.loginSummary}`
        : "本日の配布を受け取る",
    });
  } else {
    rows.push({
      kind: "status",
      label: "LOGIN",
      value: "受取済(本日)",
    });
  }

  const multActive =
    opts.pending.ptsMult > 1 ||
    (opts.runPtsMult != null && opts.runPtsMult > 1);
  const normalOk = opts.difficulty === "normal" || !opts.inRun;

  rows.push({
    kind: "item",
    key: "stageTicket",
    label: "STAGE TICKET",
    desc: "クリア済みまでスキップ",
    stock: opts.bag.stageTicket,
    action:
      opts.bag.stageTicket > 0 && opts.maxStage >= 1 ? "use_stage" : "locked",
    lockedReason:
      opts.bag.stageTicket <= 0
        ? "在庫なし"
        : opts.maxStage < 1
          ? "未クリア"
          : undefined,
  });

  rows.push({
    kind: "item",
    key: "ptsX5",
    label: "PTS ×5",
    desc: "NORMAL専用 · 重複不可",
    stock: opts.bag.ptsX5,
    action:
      opts.bag.ptsX5 > 0 && normalOk && !multActive ? "use_x5" : "locked",
    lockedReason:
      opts.bag.ptsX5 <= 0
        ? "在庫なし"
        : multActive
          ? "倍率使用中"
          : !normalOk
            ? "NORMALのみ"
            : undefined,
  });

  rows.push({
    kind: "item",
    key: "ptsX10",
    label: "PTS ×10",
    desc: "NORMAL専用 · 重複不可",
    stock: opts.bag.ptsX10,
    action:
      opts.bag.ptsX10 > 0 && normalOk && !multActive ? "use_x10" : "locked",
    lockedReason:
      opts.bag.ptsX10 <= 0
        ? "在庫なし"
        : multActive
          ? "倍率使用中"
          : !normalOk
            ? "NORMALのみ"
            : undefined,
  });

  rows.push({
    kind: "item",
    key: "ptsPack",
    label: "PTS +5000",
    desc: "NORMALラン中に即時",
    stock: opts.bag.ptsPack,
    action:
      opts.bag.ptsPack > 0 && opts.inRun && opts.difficulty === "normal"
        ? "use_pack"
        : "locked",
    lockedReason:
      opts.bag.ptsPack <= 0
        ? "在庫なし"
        : !opts.inRun
          ? "ラン中のみ"
          : opts.difficulty !== "normal"
            ? "NORMALのみ"
            : undefined,
  });

  rows.push({
    kind: "status",
    label: "PTS倍率",
    value:
      opts.runPtsMult != null && opts.runPtsMult > 1
        ? `×${opts.runPtsMult} 発動中`
        : opts.pending.ptsMult > 1
          ? `×${opts.pending.ptsMult} 準備中`
          : "なし",
  });
  rows.push({
    kind: "status",
    label: "開始STAGE",
    value:
      opts.pending.startStage > 0 ? `S${opts.pending.startStage}` : "通常(1)",
  });
  rows.push({
    kind: "status",
    label: "到達記録",
    value: opts.maxStage > 0 ? `S${opts.maxStage}` : "—",
  });
  rows.push({
    kind: "status",
    label: "入手",
    value: "ログイン/プロモ",
  });
  rows.push({ kind: "back", label: "◀ BACK" });
  return rows;
}

export function buildStageSelectRows(
  maxStage: number,
  cursorHint = 1,
): { stage: number; label: string; sub: string }[] {
  const rows: { stage: number; label: string; sub: string }[] = [];
  const hi = Math.max(1, maxStage | 0);
  for (let s = 1; s <= hi; s++) {
    rows.push({
      stage: s,
      label: `STAGE ${String(s).padStart(2, "0")}`,
      sub: s === cursorHint ? "選択中" : "チケットで開始",
    });
  }
  rows.push({ stage: 0, label: "◀ BACK", sub: "バッグへ" });
  return rows;
}
