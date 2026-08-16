/**
 * Title attract menu rows (root / difficulty / extra).
 * Pure data — recovered-game draws and handles input.
 */

import { t } from "@/lib/i18n";

export type TitleSub = "root" | "diff" | "extra" | string;

export type TitleMenuItem = {
  title: string;
  sub: string;
  h: number;
};

export type TitleMenuContext = {
  linked: boolean;
  easyCarryLv: number;
  /** inbox / mission message line */
  msgTitle: string;
  msgSub: string;
  versionLabel: string; // e.g. "1.5.0"
  /** promo admin menu (linked allow-list only) */
  isPromoAdmin?: boolean;
};

/** Y positions as fractions of playfield height Z */
export const TITLE_YS = {
  root: [0.42, 0.5, 0.58, 0.66, 0.74, 0.83],
  diff: [0.44, 0.56, 0.68, 0.8],
  extra7: [0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.89],
  extra8: [0.385, 0.455, 0.525, 0.595, 0.665, 0.735, 0.805, 0.885],
} as const;

export const TITLE_HIT_H = {
  root: [22, 20, 20, 18, 18, 16],
  diff: [26, 26, 18, 18],
  extra7: [26, 26, 26, 26, 26, 26, 24],
  extra8: [24, 24, 24, 24, 24, 24, 24, 22],
} as const;

export function titleMenuLen(
  sub: TitleSub,
  ctx?: Pick<TitleMenuContext, "isPromoAdmin"> | boolean,
): number {
  if (sub === "extra") {
    const admin =
      typeof ctx === "boolean" ? ctx : !!(ctx && ctx.isPromoAdmin);
    return admin ? 8 : 7;
  }
  if (sub === "diff") return 3;
  return 6;
}

export function titleMenuYs(
  sub: TitleSub,
  Z: number,
  ctx?: Pick<TitleMenuContext, "isPromoAdmin">,
): number[] {
  let fracs: readonly number[];
  if (sub === "extra") {
    fracs = ctx?.isPromoAdmin ? TITLE_YS.extra8 : TITLE_YS.extra7;
  } else if (sub === "diff") {
    fracs = TITLE_YS.diff;
  } else {
    fracs = TITLE_YS.root;
  }
  return fracs.map((f) => Z * f);
}

export function titleHitHeights(
  sub: TitleSub,
  ctx?: Pick<TitleMenuContext, "isPromoAdmin">,
): number[] {
  if (sub === "extra") {
    return ctx?.isPromoAdmin
      ? [...TITLE_HIT_H.extra8]
      : [...TITLE_HIT_H.extra7];
  }
  if (sub === "diff") return [...TITLE_HIT_H.diff];
  return [...TITLE_HIT_H.root];
}

export function buildTitleMenu(
  sub: TitleSub,
  ctx: TitleMenuContext,
): TitleMenuItem[] {
  if (sub === "extra") {
    const items: TitleMenuItem[] = [
      {
        title: ctx.linked ? t("title.sound") : `${t("title.sound")} 🔒`,
        sub: ctx.linked ? t("title.soundSub") : t("common.locked"),
        h: 22,
      },
      {
        title: ctx.linked ? t("title.profile") : `${t("title.profile")} 🔒`,
        sub: ctx.linked ? t("title.profileSub") : t("common.locked"),
        h: 22,
      },
      {
        title: t("title.data"),
        sub: t("title.dataSub"),
        h: 22,
      },
      {
        title: t("title.items"),
        sub: t("title.itemsSub"),
        h: 22,
      },
      {
        title: t("title.watch"),
        sub: t("title.watchSub"),
        h: 22,
      },
      {
        title: ctx.linked ? t("title.partner") : `${t("title.partner")} 🔒`,
        sub: ctx.linked ? t("title.partnerSub") : t("common.locked"),
        h: 22,
      },
    ];
    if (ctx.isPromoAdmin) {
      items.push({
        title: t("title.promo"),
        sub: t("title.promoSub"),
        h: 20,
      });
    }
    items.push({
      title: t("title.back"),
      sub: t("title.backSub"),
      h: 20,
    });
    return items;
  }

  if (sub === "diff") {
    return [
      {
        title: "EASY",
        sub:
          ctx.easyCarryLv > 0
            ? t("title.easyCarry", { n: ctx.easyCarryLv })
            : t("title.easySub"),
        h: 26,
      },
      {
        title: "NORMAL",
        sub: t("title.normalSub"),
        h: 26,
      },
      {
        title: t("title.back"),
        sub: t("title.backSub"),
        h: 18,
      },
    ];
  }

  const ver = ctx.versionLabel.startsWith("v")
    ? ctx.versionLabel
    : `v${ctx.versionLabel}`;
  return [
    {
      title: t("title.start"),
      sub: t("title.startSub"),
      h: 22,
    },
    {
      title: t("title.share"),
      sub: t("title.shareSub"),
      h: 20,
    },
    {
      title: ctx.msgTitle,
      sub: ctx.msgSub,
      h: 20,
    },
    {
      title: t("title.options"),
      sub: "",
      h: 18,
    },
    {
      title: t("title.extraItem"),
      sub: ctx.linked ? t("title.extraSubLinked") : t("title.extraSubGuest"),
      h: 18,
    },
    {
      title: `📋 VER ${ver.replace(/^v/, "")}`,
      sub: t("title.verSub"),
      h: 16,
    },
  ];
}

export function titleSelectLabel(sub: TitleSub): string {
  if (sub === "extra") return t("title.extra");
  if (sub === "diff") return t("title.difficulty");
  return t("title.select");
}
