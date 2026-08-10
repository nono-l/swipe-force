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
  versionLabel: string; // e.g. "1.5.0" or "v1.5.0"
};

/** Y positions as fractions of playfield height Z */
export const TITLE_YS = {
  root: [0.42, 0.5, 0.58, 0.66, 0.74, 0.83],
  diff: [0.44, 0.56, 0.68, 0.8],
  extra: [0.44, 0.54, 0.64, 0.74, 0.84],
} as const;

/** Hit-box heights (px) matching draw */
export const TITLE_HIT_H = {
  root: [18, 16, 16, 14, 14, 13],
  diff: [20, 20, 14, 14],
  extra: [16, 16, 16, 14, 14],
} as const;

export function titleMenuLen(sub: TitleSub): number {
  if (sub === "extra") return 4;
  if (sub === "diff") return 3;
  return 6;
}

export function titleMenuYs(sub: TitleSub, Z: number): number[] {
  const fr =
    sub === "extra"
      ? TITLE_YS.extra
      : sub === "diff"
        ? TITLE_YS.diff
        : TITLE_YS.root;
  return fr.map((f) => Z * f);
}

export function titleHitHeights(sub: TitleSub): number[] {
  if (sub === "extra") return [...TITLE_HIT_H.extra];
  if (sub === "diff") return [...TITLE_HIT_H.diff];
  return [...TITLE_HIT_H.root];
}

export function buildTitleMenu(
  sub: TitleSub,
  ctx: TitleMenuContext,
): TitleMenuItem[] {
  if (sub === "extra") {
    return [
      {
        title: ctx.linked ? "♪ SOUND TEST" : "♪ SOUND TEST 🔒",
        sub: ctx.linked ? "全ステージ/ボス曲" : "連携で解放",
        h: 16,
      },
      {
        title: ctx.linked ? "👤 PROFILE" : "👤 PROFILE 🔒",
        sub: ctx.linked ? "表示名/紹介/シェア文" : "連携で設定",
        h: 16,
      },
      {
        title: "📊 DATA",
        sub: "時間・ヘルプ・強化",
        h: 16,
      },
      {
        title: "◀ BACK",
        sub: "タイトルへ",
        h: 14,
      },
    ];
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
