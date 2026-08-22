/**
 * JPDOC: 与ダメージと撃破。
 */
/**
 * Enemy damage / kill outcomes (recovered Lr pure).
 */

export type Damageable = {
  hp: number;
  flash: number;
  x: number;
  y: number;
  score: number;
  pts: number;
  boss?: boolean;
};

export type DamageOutcome =
  | {
      type: "survive";
      flash: number;
      spark: { x: number; y: number; color: string; count: number };
    }
  | {
      type: "kill";
      flash: number;
      scoreAdd: number;
      ptsAdd: number;
      boss: boolean;
      burst: { x: number; y: number; color: string; count: number };
      float: {
        x: number;
        y: number;
        text: string;
        color: string;
        life: number;
      };
      shake: number;
      stageClear: boolean;
      missionBoss: boolean;
    };

export function applyEnemyDamage(
  e: Damageable,
  dmg: number,
  impactX: number,
  impactY: number,
): DamageOutcome {
  e.hp -= dmg;
  e.flash = 6;
  if (e.hp > 0) {
    return {
      type: "survive",
      flash: 6,
      spark: { x: impactX, y: impactY, color: "#ffffff", count: 3 },
    };
  }
  const boss = !!e.boss;
  return {
    type: "kill",
    flash: 6,
    scoreAdd: e.score,
    ptsAdd: e.pts,
    boss,
    burst: {
      x: e.x,
      y: e.y,
      color: boss ? "#ff66ff" : "#ffaa00",
      count: boss ? 28 : 12,
    },
    float: {
      x: e.x,
      y: e.y,
      text: `+${e.pts}`,
      color: "#ffff66",
      life: 40,
    },
    shake: boss ? 12 : 0,
    stageClear: boss,
    missionBoss: boss,
  };
}
