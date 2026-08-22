/**
 * JPDOC: コンティニューの可否。チュートリアルは0枚。
 */
/**
 * Continue-from-gameover pure state (recovered xi success branch).
 */

export type ContinueSeed = {
  lives: number;
  invulnFrames: number;
  shieldFrames: number;
  mode: "playing";
  readyFrames: number;
  float: {
    text: string;
    color: string;
    life: number;
    dy: number;
  };
};

export function buildContinueSeed(opts: {
  currentShield: number;
}): ContinueSeed {
  return {
    lives: 1,
    invulnFrames: 150,
    shieldFrames: Math.max(opts.currentShield, 180),
    mode: "playing",
    readyFrames: 0,
    float: {
      text: "CONTINUE!",
      color: "#66ffcc",
      life: 80,
      dy: -20,
    },
  };
}
