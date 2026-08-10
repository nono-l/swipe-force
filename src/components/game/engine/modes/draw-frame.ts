/**
 * Top-level draw mode routing (recovered qi).
 */

export type DrawRoute =
  | "attract"
  | "changelog"
  | "soundtest"
  | "shop"
  | "options"
  | "field";

export function drawRoute(mode: string): DrawRoute {
  if (mode === "attract") return "attract";
  if (mode === "changelog") return "changelog";
  if (mode === "soundtest") return "soundtest";
  if (mode === "shop") return "shop";
  if (mode === "options") return "options";
  return "field";
}

export function fieldDrawsEntities(mode: string): boolean {
  return (
    mode === "playing" ||
    mode === "ready" ||
    mode === "stageclear" ||
    mode === "bossintro"
  );
}

export function fieldShowsHud(mode: string): boolean {
  return mode !== "name" && mode !== "inbox";
}
