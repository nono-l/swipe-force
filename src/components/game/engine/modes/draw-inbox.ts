/**
 * JPDOC: 受信箱の描画。
 */
/**
 * Inbox list / detail view-models (pure).
 */

export type InboxMsg = {
  from: string;
  body: string;
  source?: string;
  thanksSent?: boolean;
};

export function wrapInboxBody(
  body: string,
  chunk = 18,
  maxChunks = 3,
): string[] {
  const lines: string[] = [];
  for (let i = 0; i < maxChunks; i++) {
    const start = i * chunk;
    if (start >= body.length) break;
    // last chunk for 40-char cap style: first two 18, then 4
    if (i === 2) {
      lines.push(body.slice(start, start + 4));
      break;
    }
    lines.push(body.slice(start, start + chunk));
  }
  return lines;
}

export type InboxListRow = {
  index: number;
  y: number;
  selected: boolean;
  kindLabel: string;
  kindColor: string;
  fromLine: string;
  bodyPreview: string;
  status: string;
  statusColor: string;
  sourceTag: string;
};

export function buildInboxListRows(opts: {
  messages: InboxMsg[];
  cursor: number;
  canThanks: (m: InboxMsg) => boolean;
  pageSize?: number;
  rowH?: number;
  baseY?: number;
}): { windowStart: number; rows: InboxListRow[] } {
  const page = opts.pageSize ?? 5;
  const rowH = opts.rowH ?? 48;
  const baseY = opts.baseY ?? 58;
  const maxStart = Math.max(0, opts.messages.length - page);
  const windowStart = Math.max(0, Math.min(opts.cursor, maxStart));
  const rows: InboxListRow[] = [];
  for (let t = 0; t < Math.min(page, opts.messages.length - windowStart); t++) {
    const index = windowStart + t;
    const n = opts.messages[index];
    const thanks = n.source === "thanks";
    let status: string;
    let statusColor: string;
    if (opts.canThanks(n)) {
      status = "お礼可";
      statusColor = "#ffcc66";
    } else if (thanks) {
      status = "受信お礼";
      statusColor = "#668866";
    } else if (n.thanksSent) {
      status = "お礼済";
      statusColor = "#668866";
    } else {
      status = "—";
      statusColor = "#668866";
    }
    rows.push({
      index,
      y: baseY + t * rowH,
      selected: index === opts.cursor,
      kindLabel: thanks ? "お礼" : "完走",
      kindColor: thanks ? "#ffcc88" : "#88aacc",
      fromLine: `${thanks ? "お礼" : "完走"} From ${n.from.slice(0, 8)}`,
      bodyPreview: n.body.slice(0, 20),
      status,
      statusColor,
      sourceTag: n.source === "mission" ? "完走MSG" : "お礼MSG",
    });
  }
  return { windowStart, rows };
}

export type InboxDetailView = {
  header: string;
  fromLine: string;
  bodyLines: string[];
  thanksState: "can" | "thanks_msg" | "already";
  thanksLabel: string;
};

export function buildInboxDetail(
  e: InboxMsg,
  canThanks: boolean,
): InboxDetailView {
  const thanks = e.source === "thanks";
  let thanksState: InboxDetailView["thanksState"];
  let thanksLabel: string;
  if (canThanks) {
    thanksState = "can";
    thanksLabel = "🙏 お礼を送る (1回)";
  } else if (thanks) {
    thanksState = "thanks_msg";
    thanksLabel = "お礼MSG · 返信不可";
  } else {
    thanksState = "already";
    thanksLabel = "この通にはお礼送信済み";
  }
  return {
    header: thanks ? "お礼メッセージ" : "ミッション完了メッセージ",
    fromLine: `From ${e.from}`,
    bodyLines: wrapInboxBody(e.body),
    thanksState,
    thanksLabel,
  };
}
