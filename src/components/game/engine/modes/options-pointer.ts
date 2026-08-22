/**
 * JPDOC: オプションのポインタ。
 */
/**
 * Options pointer down/up pure decisions (recovered sa / ua).
 */

export type OptionsDown = {
  sideBack: boolean;
  rowIndex: number; // -1 none
  selectRow: boolean;
};

export function optionsPointerDown(opts: {
  x: number;
  y: number;
  left: number;
  right: number;
  rowAtY: (y: number) => number;
  rowKind: (index: number) => string | undefined;
}): OptionsDown {
  if (opts.x < opts.left || opts.x > opts.right) {
    return { sideBack: true, rowIndex: -1, selectRow: false };
  }
  const n = opts.rowAtY(opts.y);
  const kind = n >= 0 ? opts.rowKind(n) : undefined;
  return {
    sideBack: false,
    rowIndex: n,
    selectRow: n >= 0 && kind !== "header",
  };
}

export type OptionsUp =
  | { type: "ignore" }
  | { type: "activate"; cursor: number }
  | { type: "select"; cursor: number };

/**
 * After drag: if scrolled, ignore. Else hit row / empty activates cursor.
 */
export function optionsPointerUp(opts: {
  dragged: boolean;
  x: number;
  y: number;
  left: number;
  right: number;
  cursor: number;
  rowAtY: (y: number) => number;
  rowKind: (index: number) => string | undefined;
}): OptionsUp {
  if (opts.dragged) return { type: "ignore" };
  if (opts.x < opts.left || opts.x > opts.right) return { type: "ignore" };
  const n = opts.rowAtY(opts.y);
  if (n < 0) return { type: "activate", cursor: opts.cursor };
  const kind = opts.rowKind(n);
  if (!kind || kind === "header") return { type: "activate", cursor: opts.cursor };
  if (n === opts.cursor) return { type: "activate", cursor: opts.cursor };
  return { type: "select", cursor: n };
}
