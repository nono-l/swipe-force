/**
 * Audio public surface.
 * - ./sfx  — sound effects
 * - ./bgm  — music
 * - ./engine — full implementation (shared state)
 */
export * from "./sfx";
export * from "./bgm";
// context-level state & oscillators for advanced use
export {
  c, l, u, d, f, p, m, h,
  g, _, v, oe, b, x, S,
} from "./engine";
export * from "./boss-themes";
