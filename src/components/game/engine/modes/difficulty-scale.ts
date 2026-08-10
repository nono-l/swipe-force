/**
 * Enemy HP scaling (recovered Xn / Yn).
 */

export { enemyHpMultiplier, scoreHpThresholds } from "./shop-pricing";
import { enemyHpMultiplier } from "./shop-pricing";

export function totalHpScale(difficulty: string, score: number): number {
  return (difficulty === "normal" ? 6 : 1) * enemyHpMultiplier(score);
}
