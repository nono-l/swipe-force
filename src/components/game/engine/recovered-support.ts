// @ts-nocheck
/**
 * Recovered support barrel.
 *
 *   audio/     sfx + bgm + engine
 *   meta/      sanitize, sound social, version, bosses, share, shop/playfield
 *   modes/     shop/options notes & bgmSetBgmVol-exports
 */
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";

// ── Audio ──
export * from "./audio/engine";

// ── Meta modules ──
export * from "./meta/sanitize";
export * from "./meta/sound_social";
export * from "./meta/version";
export * from "./meta/bosses";
export * from "./meta/share";
export * from "./meta/playfield_shop";

function __toESM(mod, _isNodeMode) {
  if (mod && mod.__esModule) return mod;
  const target = Object.create(null);
  if (mod != null) {
    for (const k of Object.keys(mod)) {
      if (k !== "default") {
        try { target[k] = mod[k]; } catch {}
      }
    }
  }
  target.default = mod;
  return target;
}
const e = __toESM;
const n = () => React;
const t = () => ({ jsx, jsxs });

/** React namespace for recovered UI (`s.useRef` / `s.useEffect`) */
export var s = e(n(), 1);
