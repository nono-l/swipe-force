# Audio

| File | Role |
|------|------|
| `sfx.ts` | Sound effects API (one-shots) |
| `bgm.ts` | Music / BGM API + sound-test helpers |
| `engine.ts` | Shared implementation (Web Audio state, oscillators, sequencers) |

Import from `sfx` or `bgm` in new code. The recovered game still pulls short names through `recovered-support`.
