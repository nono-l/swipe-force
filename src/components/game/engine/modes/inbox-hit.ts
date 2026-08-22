/**
 * JPDOC: 受信箱の当たり判定。
 */
/**
 * Inbox pointer hit testing (recovered fa inbox branch).
 */

export type InboxHit =
  | { type: "side_title" }
  | { type: "empty_title" }
  | { type: "list_back" }
  | { type: "open"; index: number }
  | { type: "thanks" }
  | { type: "delete" }
  | { type: "to_list" }
  | { type: "clear_detail" }
  | { type: "none" };

export function inboxPointerHit(opts: {
  x: number;
  y: number;
  left: number;
  right: number;
  fieldH: number;
  messageCount: number;
  detailOpen: boolean;
  cursor: number;
}): InboxHit {
  if (opts.x < opts.left || opts.x > opts.right) return { type: "side_title" };
  if (!opts.messageCount) return { type: "empty_title" };

  if (!opts.detailOpen) {
    if (opts.y > 364) return { type: "list_back" };
    const e = Math.max(
      0,
      Math.min(opts.cursor, Math.max(0, opts.messageCount - 5)),
    );
    for (let t = 0; t < Math.min(5, opts.messageCount - e); t++) {
      const r = 58 + t * 48;
      if (opts.y >= r - 2 && opts.y < r + 44) {
        return { type: "open", index: e + t };
      }
    }
    return { type: "none" };
  }

  // detail view
  if (opts.y >= opts.fieldH * 0.55 && opts.y < opts.fieldH * 0.65) {
    return { type: "thanks" };
  }
  if (opts.y >= opts.fieldH * 0.68 && opts.y < opts.fieldH * 0.78) {
    return { type: "delete" };
  }
  if (opts.y >= opts.fieldH * 0.8) return { type: "to_list" };
  return { type: "none" };
}
