/**
 * JPDOC: オプション描画。
 */
/**
 * Options screen title / row colors (recovered ii pure bits).
 */

import { translate } from "@/lib/i18n";

export function optionsScreenTitle(submenu: string): {
  title: string;
  subtitle: string;
  border: string;
  titleColor: string;
} {
  if (submenu === "shot") {
    return {
      title: translate("options.shotTitle"),
      subtitle: translate("options.shotSub"),
      border: "#66ffaa",
      titleColor: "#88ffcc",
    };
  }
  if (submenu === "weapons") {
    return {
      title: translate("options.wepTitle"),
      subtitle: translate("options.wepSub"),
      border: "#66ffaa",
      titleColor: "#88ffcc",
    };
  }
  return {
    title: translate("options.title"),
    subtitle: translate("options.subtitle"),
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
  if (opts.kind === "title") {
    return {
      label: o ? "#ffcc88" : "#cc8844",
      value: o ? "#ffaa44" : "#886633",
    };
  }
  if (opts.kind === "locale") {
    return {
      label: o ? "#ddeeff" : "#88aacc",
      value: o ? "#aaccff" : "#6688aa",
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
