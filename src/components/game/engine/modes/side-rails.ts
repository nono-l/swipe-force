/**
 * Left/right convenience rail button layouts.
 * Pure config — recovered-game draws and hits against these.
 */

export type GameMode = string;
export type TitleSub = "root" | "diff" | "extra" | string;

export type RailButton = {
  /** 0 = left rail, KEY_CLOUD_INBOX pass right rail x (wr) from caller */
  side: "left" | "right";
  y: number;
  label: string;
  sub: string;
  hot: boolean;
};

export type SideRailContext = {
  mode: GameMode;
  titleSub?: TitleSub;
  /** pause-shop vs stage shop */
  shopPaused?: boolean;
};

/**
 * Buttons to draw hasVisitedUrl side rails for the current mode.
 * Hit logic in game mirrors upper y<100 vs lower for play/shop.
 */
export function getSideRailButtons(ctx: SideRailContext): RailButton[] {
  const { mode, titleSub = "root", shopPaused = false } = ctx;
  const play =
    mode === "playing" || mode === "ready" || mode === "bossintro";

  if (play) {
    return [
      { side: "left", y: 48, label: "SHOP", sub: "開く", hot: true },
      { side: "left", y: 100, label: "BAG", sub: "アイテム", hot: true },
      { side: "left", y: 152, label: "OPT", sub: "設定", hot: false },
      { side: "right", y: 48, label: "OPT", sub: "設定", hot: true },
      { side: "right", y: 100, label: "BAG", sub: "アイテム", hot: true },
      { side: "right", y: 152, label: "SHOP", sub: "開く", hot: false },
    ];
  }

  if (mode === "shop") {
    const backSub = shopPaused ? "再開" : "次へ";
    return [
      { side: "left", y: 48, label: "BACK", sub: backSub, hot: true },
      { side: "right", y: 48, label: "BACK", sub: backSub, hot: true },
      { side: "left", y: 100, label: "BAG", sub: "アイテム", hot: false },
      { side: "right", y: 100, label: "BAG", sub: "アイテム", hot: false },
    ];
  }

  if (mode === "bag" || mode === "stageselect") {
    return [
      { side: "left", y: 48, label: "BACK", sub: "戻る", hot: true },
      { side: "right", y: 48, label: "BACK", sub: "戻る", hot: true },
    ];
  }

  if (mode === "options") {
    return [
      { side: "left", y: 48, label: "BACK", sub: "戻る", hot: true },
      { side: "right", y: 48, label: "BACK", sub: "戻る", hot: true },
    ];
  }

  if (mode === "attract" && (titleSub === "diff" || titleSub === "extra")) {
    return [
      { side: "left", y: 48, label: "BACK", sub: "タイトル", hot: true },
      { side: "right", y: 48, label: "BACK", sub: "タイトル", hot: true },
    ];
  }

  if (mode === "attract") {
    return [
      { side: "left", y: 48, label: "OPT", sub: "設定", hot: false },
      { side: "right", y: 48, label: "EXTRA", sub: "特典", hot: false },
    ];
  }

  if (
    mode === "soundtest" ||
    mode === "changelog" ||
    mode === "inbox"
  ) {
    return [
      { side: "left", y: 48, label: "BACK", sub: "戻る", hot: true },
      { side: "right", y: 48, label: "BACK", sub: "戻る", hot: true },
    ];
  }

  if (mode === "gameover") {
    return [
      { side: "left", y: 48, label: "TITLE", sub: "戻る", hot: true },
      { side: "right", y: 48, label: "SHARE", sub: "求助", hot: false },
    ];
  }

  if (mode === "name") {
    return [
      { side: "left", y: 48, label: "BACK", sub: "やめる", hot: false },
      { side: "right", y: 48, label: "BACK", sub: "やめる", hot: false },
    ];
  }

  if (mode === "stageclear") {
    return [
      { side: "left", y: 48, label: "…", sub: "待機", hot: false },
      { side: "right", y: 48, label: "…", sub: "待機", hot: false },
    ];
  }

  return [
    { side: "left", y: 48, label: "BACK", sub: "戻る", hot: false },
    { side: "right", y: 48, label: "BACK", sub: "戻る", hot: false },
  ];
}

/** Hint text under rails during play */
export function sideRailHints(mode: GameMode): {
  left?: string;
  right?: string;
} {
  if (mode === "playing" || mode === "ready" || mode === "bossintro") {
    return { left: "SHOP/BAG", right: "OPT/BAG" };
  }
  return {};
}

/** Play rail slot from Y: 0=upper, 1=mid(BAG), 2=lower */
export function playRailSlot(y: number): 0 | 1 | 2 {
  if (y < 90) return 0;
  if (y < 140) return 1;
  return 2;
}

/**
 * Map play side rail tap to action.
 * left: 0 shop, 1 bag, 2 opt
 * right: 0 opt, 1 bag, 2 shop
 */
export function playRailAction(
  left: boolean,
  slot: 0 | 1 | 2,
): "shop" | "bag" | "options" {
  if (slot === 1) return "bag";
  if (left) return slot === 0 ? "shop" : "options";
  return slot === 0 ? "options" : "shop";
}
