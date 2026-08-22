/**
 * JPDOC: ゲームオーバー画面。
 */
/**
 * Game over screen layout / styles (pure).
 */

export type GameOverView = {
  scoreText: string;
  coinText: string;
  coinColor: string;
  continue: {
    enabled: boolean;
    fill: string;
    stroke: string;
    label: string;
    labelColor: string;
  };
  shareStroke: string;
};

export function buildGameOverView(opts: {
  score: number;
  coins: number;
  frame: number;
  tutorial?: boolean;
}): GameOverView {
  const free = !!opts.tutorial;
  const e = free || opts.coins > 0;
  const t = e && opts.frame % 24 < 16;
  return {
    scoreText: `SCORE ${opts.score}`,
    coinText: free
      ? "TUTORIAL  ·  CONTINUE 0 COIN"
      : `CONTINUE COIN  ×${opts.coins}`,
    coinColor: free ? "#88ffee" : e ? "#ffee88" : "#887744",
    continue: {
      enabled: e,
      fill: e ? "#223300" : "#111111",
      stroke: e ? (t ? "#ffff00" : "#88aa00") : "#444444",
      label: free
        ? "▶ CONTINUE (FREE)"
        : e
          ? "▶ CONTINUE (−1 COIN)"
          : "▶ CONTINUE (コイン不足)",
      labelColor: e ? (t ? "#ffff66" : "#ccff88") : "#555555",
    },
    shareStroke: opts.frame % 30 < 18 ? "#ffaa44" : "#886622",
  };
}

export type NameEntryView = {
  best: string;
  current: string;
  letters: { ch: string; color: string }[];
};

export function buildNameEntryView(opts: {
  highScore: number;
  score: number;
  letters: string[];
  cursor: number;
  blinkFrame: number;
}): NameEntryView {
  return {
    best: String(Math.max(opts.highScore, 5e4)).padStart(7, "0"),
    current: String(opts.score).padStart(7, "0"),
    letters: opts.letters.map((ch, e) => ({
      ch,
      color:
        e === opts.cursor && opts.blinkFrame % 20 < 12 ? "#ffff00" : "#00ff00",
    })),
  };
}

export type StageBanner =
  | { kind: "ready"; stage: number }
  | { kind: "bossintro"; name: string; blink: boolean }
  | { kind: "stageclear"; autoShop: boolean };

export function stageBanner(
  mode: string,
  stage: number,
  bossName: string,
  frame: number,
  autoShop = true,
): StageBanner | null {
  if (mode === "ready") return { kind: "ready", stage };
  if (mode === "bossintro")
    return { kind: "bossintro", name: bossName, blink: frame % 12 < 6 };
  if (mode === "stageclear") return { kind: "stageclear", autoShop: !!autoShop };
  return null;
}
