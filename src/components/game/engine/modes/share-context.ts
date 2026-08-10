/**
 * X share context label from current game mode (recovered Wi).
 */

export type ShareContext =
  | "gameover"
  | "boss"
  | "shop"
  | "playing"
  | "title";

export function shareContextFromMode(opts: {
  mode: string;
  bossActive: boolean;
}): ShareContext {
  const p = opts.mode;
  if (p === "gameover") return "gameover";
  if (p === "bossintro" || (p === "playing" && opts.bossActive)) return "boss";
  if (p === "shop") return "shop";
  if (p === "playing" || p === "ready") return "playing";
  return "title";
}

export function shareToastMessage(context: ShareContext): string {
  return context === "gameover"
    ? "進行度つきでシェア · 助けを求めました"
    : "ハッシュタグ＆進行度つきでシェア";
}

export type SharePayload = {
  stage: number;
  score: number;
  difficulty: string;
  context: ShareContext;
  bossName?: string;
  lives: number;
  continueCoins: number;
};

export function buildSharePayload(opts: {
  playerId: string;
  stage: number;
  score: number;
  difficulty: string;
  mode: string;
  bossActive: boolean;
  bossName: string;
  lives: number;
  continueCoins: number;
}): { context: ShareContext; toast: string; payload: SharePayload } {
  const context = shareContextFromMode({
    mode: opts.mode,
    bossActive: opts.bossActive,
  });
  return {
    context,
    toast: shareToastMessage(context),
    payload: {
      stage: opts.stage,
      score: opts.score,
      difficulty: opts.difficulty,
      context,
      bossName:
        opts.bossActive || opts.mode === "bossintro"
          ? opts.bossName
          : undefined,
      lives: opts.lives,
      continueCoins: opts.continueCoins,
    },
  };
}
