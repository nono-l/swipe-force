/**
 * Title screen menu row colors / link button styles (pure).
 */

export function titleMenuRowColors(
  index: number,
  selected: boolean,
  blinkOn: boolean,
): { title: string; sub: string; fill?: string; stroke: string } {
  const a = selected;
  // root menu indices used for special highlight fills
  const fill =
    a
      ? index === 3
        ? "#221100"
        : index === 4
          ? "#220022"
          : index === 5
            ? "#002233"
            : index === 6
              ? "#001a22"
              : "#003300"
      : undefined;
  const stroke = a
    ? index === 3
      ? "#ffaa44"
      : index === 4
        ? "#ff88cc"
        : index === 5
          ? "#66ccff"
          : index === 6
            ? "#44ffcc"
            : "#ffff00"
    : "#005500";

  const title =
    index === 0
      ? a
        ? "#88ff88"
        : "#55aa55"
      : index === 1
        ? a
          ? "#ffaa66"
          : "#aa6644"
        : index === 3
          ? a
            ? "#ffcc66"
            : "#aa8844"
          : index === 4
            ? a
              ? "#ffaadd"
              : "#aa6688"
            : index === 5
              ? a
                ? "#aaddff"
                : "#5588aa"
              : a && blinkOn
                ? "#ffffff"
                : "#00ff88";

  return {
    title,
    sub: a ? "#ccffcc" : "#446644",
    fill,
    stroke,
  };
}

export function titleLinkStyle(linked: boolean): {
  fill: string;
  stroke: string;
  text: string;
  textColor: string;
} {
  return {
    fill: linked ? "#0a3020" : "#1a2030",
    stroke: linked ? "#66ffaa" : "#6688aa",
    text: linked ? "LINK" : "LINK", // caller may override with name
    textColor: linked ? "#aaffcc" : "#aaccff",
  };
}

export function titleInboxLabels(opts: {
  canSendFanmail: boolean;
  alreadySent: boolean;
  inboxCount: number;
}): { title: string; sub: string } {
  if (opts.canSendFanmail) {
    return { title: "✉ MSG", sub: "このシェアへの1回送信" };
  }
  if (opts.alreadySent) {
    return { title: "✉ SENT", sub: "このシェアは送信済" };
  }
  if (opts.inboxCount > 0) {
    return {
      title: `✉ INBOX(${opts.inboxCount})`,
      sub: "届いたメッセージ",
    };
  }
  return { title: "✉ INBOX", sub: "届いたメッセージ" };
}
