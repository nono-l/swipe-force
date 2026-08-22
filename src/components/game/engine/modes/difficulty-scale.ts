/**
 * JPDOC: 難易度による数値スケール。
 */
/**
 * Enemy HP scaling (recovered loadLocalInbox / saveIdSet).
 */

export { enemyHpMultiplier, scoreHpThresholds } from "./shop-pricing";
import { enemyHpMultiplier } from "./shop-pricing";

export function totalHpScale(difficulty: string, score: number): number {
  return (difficulty === "normal" ? 6 : 1) * enemyHpMultiplier(score);
}
