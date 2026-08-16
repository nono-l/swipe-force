/**
 * Tutorial-run missions (Easy, launched only from the How-To page).
 * Rewards grant once per player — replay does not pay again.
 */

import { translate } from "@/lib/i18n";
import { addLocalCoins } from "@/lib/share";

export const TUTORIAL_KEY = "swipe_force_tutorial_v1";

export type TutorialMissionId =
  | "move"
  | "kills"
  | "boss_reach"
  | "shop"
  | "buy"
  | "boss_clear";

export type TutorialMission = {
  id: TutorialMissionId;
  coins: number;
  ticket: number;
  nameKey: string;
  hintKey: string;
};

export const TUTORIAL_MISSIONS: TutorialMission[] = [
  { id: "move", coins: 1, ticket: 0, nameKey: "tutorial.move", hintKey: "tutorial.moveHint" },
  { id: "kills", coins: 1, ticket: 0, nameKey: "tutorial.kills", hintKey: "tutorial.killsHint" },
  { id: "shop", coins: 1, ticket: 0, nameKey: "tutorial.shop", hintKey: "tutorial.shopHint" },
  { id: "buy", coins: 1, ticket: 1, nameKey: "tutorial.buy", hintKey: "tutorial.buyHint" },
  { id: "boss_reach", coins: 1, ticket: 0, nameKey: "tutorial.bossReach", hintKey: "tutorial.bossReachHint" },
  { id: "boss_clear", coins: 2, ticket: 0, nameKey: "tutorial.bossClear", hintKey: "tutorial.bossClearHint" },
];

export type TutorialClaim = {
  id: TutorialMissionId;
  at: number;
  coins: number;
  ticket: number;
};

type Store = { claimed: TutorialClaim[] };

function readStore(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(TUTORIAL_KEY) || "{}");
    const claimed = Array.isArray(raw?.claimed) ? raw.claimed : [];
    return {
      claimed: claimed
        .filter((c: TutorialClaim) => c && typeof c.id === "string")
        .map((c: TutorialClaim) => ({
          id: c.id,
          at: Number(c.at) || 0,
          coins: Number(c.coins) || 0,
          ticket: Number(c.ticket) || 0,
        })),
    };
  } catch {
    return { claimed: [] };
  }
}

function writeStore(s: Store) {
  try {
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify(s));
  } catch {
    /* */
  }
}

export function tutorialMission(id: TutorialMissionId): TutorialMission | undefined {
  return TUTORIAL_MISSIONS.find((m) => m.id === id);
}

export function isTutorialClaimed(id: TutorialMissionId): boolean {
  return readStore().claimed.some((c) => c.id === id);
}

export function tutorialClaims(): TutorialClaim[] {
  return readStore().claimed.slice().sort((a, b) => b.at - a.at);
}

export function tutorialProgress() {
  const claimed = readStore().claimed;
  const got = TUTORIAL_MISSIONS.filter((m) => claimed.some((c) => c.id === m.id)).length;
  const coins = claimed.reduce((s, c) => s + (c.coins || 0), 0);
  const ticket = claimed.reduce((s, c) => s + (c.ticket || 0), 0);
  const next = TUTORIAL_MISSIONS.find((m) => !claimed.some((c) => c.id === m.id)) || null;
  return { got, all: TUTORIAL_MISSIONS.length, coins, ticket, next };
}

export function missionLabel(id: TutorialMissionId): string {
  const m = tutorialMission(id);
  return m ? translate(m.nameKey) : id;
}

export function missionHint(id: TutorialMissionId): string {
  const m = tutorialMission(id);
  return m ? translate(m.hintKey) : "";
}

export function formatTutorialReward(coins: number, ticket: number): string {
  const bits: string[] = [];
  if (coins > 0) bits.push(translate("tutorial.claim", { n: coins }));
  if (ticket > 0) bits.push(translate("tutorial.ticket", { n: ticket }));
  return bits.join(" · ") || "—";
}

export type TutorialClaimResult =
  | { ok: true; already: true; id: TutorialMissionId }
  | {
      ok: true;
      already: false;
      id: TutorialMissionId;
      coins: number;
      ticket: number;
      balance: number;
    };

/** Grant once. Replay returns already=true and pays nothing. */
export function claimTutorialMission(
  id: TutorialMissionId,
  playerId: string,
): TutorialClaimResult {
  const def = tutorialMission(id);
  if (!def) return { ok: true, already: true, id };
  const store = readStore();
  if (store.claimed.some((c) => c.id === id)) {
    return { ok: true, already: true, id };
  }
  store.claimed.push({
    id,
    at: Date.now(),
    coins: def.coins,
    ticket: def.ticket,
  });
  writeStore(store);
  const balance = def.coins > 0 ? addLocalCoins(playerId, def.coins) : 0;
  return {
    ok: true,
    already: false,
    id,
    coins: def.coins,
    ticket: def.ticket,
    balance,
  };
}
