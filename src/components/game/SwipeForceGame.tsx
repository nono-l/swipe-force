/**
 * SWIPE FORCE — main game component.
 *
 * Layout:
 *   SwipeForceGame.tsx            ← public entry (this file)
 *   engine/recovered-game.tsx     ← canvas loop (recovered, behavior frozen)
 *   engine/recovered-support.ts   ← audio / share / comments / bosses
 *   engine/README.md              ← refactor notes
 *   @/lib/*                       ← typed helpers (profile, stats, APIs)
 */
export { SwipeForceGameCanvas as SwipeForceGame } from "./engine/recovered-game";
export { SwipeForceGameCanvas as default } from "./engine/recovered-game";
