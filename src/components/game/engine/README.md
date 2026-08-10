# Game engine layout

| Path | Role |
|------|------|
| `recovered-game.tsx` | Canvas loop (~2.9k lines, thinning) |
| `recovered-support.ts` | Barrel re-export |
| `audio/` | SFX · BGM · engine · boss-themes |
| `meta/` | sanitize · sound_social · version · bosses · player-local · share-net · account-cloud |
| `modes/` | title · options · shop · side-rails · sound-test-meta · list-scroll |
| `ui/` | account · sound comment viewer/composer |
| `@/lib/stages` | 64 stage/boss roster |

## Refactor rules
1. No gameplay changes while splitting.
2. Pure data → `modes/*` / `@/lib/*`.
3. Fixed HTML dialogs → `ui/*` with injected handlers.
