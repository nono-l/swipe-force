/**
 * JPDOC: オプションの階層ナビ。
 */
/**
 * Options list cursor navigation (recovered oa / la decisions).
 */

export type OptRow = { kind: string; key?: string; label?: string };

/** Skip headers when moving by delta. */
export function optionsCursorStep(
  rows: readonly OptRow[],
  cursor: number,
  delta: number,
): number {
  if (!rows.length) return 0;
  let r = cursor;
  for (let e = 0; e < rows.length; e++) {
    r = (r + delta + rows.length) % rows.length;
    if (rows[r].kind !== "header") return r;
  }
  return cursor;
}

export type OptionsActivate =
  | { type: "back" }
  | { type: "title" }
  | { type: "submenu"; key: string }
  | { type: "toggle" }
  | { type: "locale" }
  | { type: "confirm_slider"; label: string }
  | { type: "adjust" }
  | { type: "noop" };

export function optionsActivate(row: OptRow | undefined): OptionsActivate {
  if (!row || row.kind === "header") return { type: "noop" };
  if (row.kind === "back") return { type: "back" };
  if (row.kind === "title") return { type: "title" };
  if (row.kind === "submenu") return { type: "submenu", key: row.key || "" };
  if (row.kind === "toggle") return { type: "toggle" };
  if (row.kind === "locale") return { type: "locale" };
  if (row.kind === "vol" || row.kind === "sense" || row.kind === "weapon") {
    return { type: "confirm_slider", label: row.label || "" };
  }
  return { type: "adjust" };
}

export type OptionsBackNav =
  | { type: "to_weapons_from_shot" }
  | { type: "to_main_from_weapons"; preferWeaponsSubmenu: boolean }
  | { type: "leave_options" };

export function optionsBackTarget(submenu: string): OptionsBackNav {
  if (submenu === "shot") return { type: "to_weapons_from_shot" };
  if (submenu === "weapons")
    return { type: "to_main_from_weapons", preferWeaponsSubmenu: true };
  return { type: "leave_options" };
}
