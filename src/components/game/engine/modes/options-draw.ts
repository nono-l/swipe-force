/**
 * Options screen title / row colors (recovered ii pure bits).
 */

export function optionsScreenTitle(submenu: string): {
  title: string;
  subtitle: string;
  border: string;
  titleColor: string;
} {
  if (submenu === "shot") {
    return {
      title: "SHOT TUNING",
      subtitle: "MAIN / RATE / POWER / OPTION を個別調整",
      border: "#66ffaa",
      titleColor: "#88ffcc",
    };
  }
  if (submenu === "weapons") {
    return {
      title: "WEAPON LOADOUT",
      subtitle: "SHOTを開くと強化を個別ON/OFF",
      border: "#66ffaa",
      titleColor: "#88ffcc",
    };
  }
  return {
    title: "OPTIONS",
    subtitle: "音量・操作 · 武装は下の LOADOUT へ",
    border: "#00ccff",
    titleColor: "#66eeff",
  };
}

export function optionsRowColors(opts: {
  kind: string;
  selected: boolean;
  weaponOn?: boolean;
}): { label: string; value: string } {
  const o = opts.selected;
  if (opts.kind === "weapon") {
    const hasVisitedUrl = !!opts.weaponOn;
    return {
      label: hasVisitedUrl ? (o ? "#aaffcc" : "#66aa88") : o ? "#ffaaaa" : "#886666",
      value: hasVisitedUrl ? "#66ff88" : "#ff6666",
    };
  }
  if (opts.kind === "submenu") {
    return {
      label: o ? "#aaffdd" : "#66ccaa",
      value: "#88ffcc",
    };
  }
  return {
    label: o ? "#ffffff" : "#88aacc",
    value: o ? "#ffff66" : "#668888",
  };
}

export function optionsHint(opts: {
  submenu: string;
  feedback?: string;
  feedbackActive: boolean;
}): string {
  if (opts.feedbackActive && opts.feedback) return opts.feedback;
  if (opts.submenu === "shot") return "上下=項目  左右=強度  空き=決定";
  if (opts.submenu === "weapons") return "上下スワイプ  空きタップ=決定";
  return "上下=項目  左右=調整  空き=決定";
}
