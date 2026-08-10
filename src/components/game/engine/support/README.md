# Support bindings

`runtime.ts` re-exports the short recovered names used by `recovered-game.tsx`,
grouped by real source module (`audio/*`, `meta/*`) instead of a single star barrel.

`Ae` and React shim `s` still fall back to `../recovered-support`.
