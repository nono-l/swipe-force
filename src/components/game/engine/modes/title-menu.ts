/**
 * Title attract menu rows (root / difficulty / extra).
 * Pure data — recovered-game draws and handles input.
 */

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
  extra6: [0.42, 0.5, 0.58, 0.66, 0.74, 0.84],
  extra7: [0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88],
} as const;

/** Hit-box heights (px) matching draw */
export const TITLE_HIT_H = {
  root: [18, 16, 16, 14, 14, 13],
  diff: [20, 20, 14, 14],
  extra6: [15, 15, 15, 14, 14, 13],
  extra7: [14, 14, 14, 14, 14, 13, 13],
} as const;

export function titleMenuLen(
  sub: TitleSub,
  ctx?: Pick<TitleMenuContext, "isPromoAdmin"> | boolean,
): number {
  if (sub === "extra") {
    const admin =
      typeof ctx === "boolean" ? ctx : !!(ctx && ctx.isPromoAdmin);
    return admin ? 7 : 6;
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
    fracs = ctx?.isPromoAdmin ? TITLE_YS.extra7 : TITLE_YS.extra6;
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
      ? [...TITLE_HIT_H.extra7]
      : [...TITLE_HIT_H.extra6];
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
        title: ctx.linked ? "♪ SOUND TEST" : "♪ SOUND TEST 🔒",
        sub: ctx.linked ? "全ステージ/ボス曲" : "連携で解放",
        h: 15,
      },
      {
        title: ctx.linked ? "👤 PROFILE" : "👤 PROFILE 🔒",
        sub: ctx.linked ? "表示名/紹介/シェア文" : "連携で設定",
        h: 15,
      },
      {
        title: "📊 DATA",
        sub: "時間・ヘルプ・強化",
        h: 15,
      },
      {
        title: "🎒 ITEMS",
        sub: "ログイン/プロモ配布",
        h: 14,
      },
      {
        title: "📺 AD WATCH",
        sub: "広告視聴でコイン",
        h: 14,
      },
      {
        title: "📣 ADVERTISER",
        sub: "広告主 · コード/配信",
        h: 13,
      },
    ];
    if (ctx.isPromoAdmin) {
      items.push({
        title: "🛠 PROMO",
        sub: "管理者 · 配布コード",
        h: 13,
      });
    }
    items.push({
      title: "◀ BACK",
      sub: "タイトルへ",
      h: 13,
    });
    return items;
  }

  if (sub === "diff") {
    return [
      {
        title: "EASY",
        sub:
          ctx.easyCarryLv > 0
            ? `強化引継ぎ ${ctx.easyCarryLv}Lv`
            : "強化が次プレイに残る",
        h: 20,
      },
      {
        title: "NORMAL",
        sub: "昭和の時代のゲームセンターのノーマル難易度です！！",
        h: 20,
      },
      {
        title: "◀ BACK",
        sub: "タイトルへ",
        h: 14,
      },
    ];
  }

  // root
  const ver = ctx.versionLabel.startsWith("v")
    ? ctx.versionLabel
    : `v${ctx.versionLabel}`;
  return [
    {
      title: "▶ START",
      sub: "難易度を選んで出撃",
      h: 18,
    },
    {
      title: "𝕏 SHARE",
      sub: "ミッションでコイン",
      h: 16,
    },
    {
      title: ctx.msgTitle,
      sub: ctx.msgSub,
      h: 16,
    },
    {
      title: "⚙ OPTIONS",
      sub: "",
      h: 15,
    },
    {
      title: "⭐ EXTRA",
      sub: ctx.linked ? "サウンド/プロフ/データ" : "連携特典 · サウンド他",
      h: 15,
    },
    {
      title: `📋 VER ${ver.replace(/^v/, "")}`,
      sub: "更新履歴",
      h: 13,
    },
  ];
}

/** Header label under logo */
export function titleSelectLabel(sub: TitleSub): string {
  if (sub === "extra") return "EXTRA";
  if (sub === "diff") return "DIFFICULTY";
  return "SELECT";
}
