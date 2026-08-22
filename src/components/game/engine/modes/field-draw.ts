/**
 * JPDOC: プレイフィールドの背景と弾。
 */
/**
 * canSendFanmailTo-playfield draw decisions (recovered qi field branch).
 */

export function shieldStrokeColor(frame: number): string {
  return frame % 8 < 4 ? "#66ffff" : "#2288aa";
}

export function invulnBlink(invulnFrames: number): boolean {
  return invulnFrames > 0 && Math.floor(invulnFrames / 3) % 2 === 0;
}

export function floatTextAlpha(life: number): number {
  return Math.min(1, life / 20);
}

export function particleAlpha(life: number, max: number): number {
  return Math.max(0, life / max);
}

export function lockonAlpha(life: number): number {
  return Math.min(1, life / 6);
}
