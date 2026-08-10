CREATE TABLE IF NOT EXISTS continue_coins (
  player_id TEXT PRIMARY KEY,
  coins INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS share_awards (
  id SERIAL PRIMARY KEY,
  sharer_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  play_seconds DOUBLE PRECISION NOT NULL,
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS share_awards_sharer_idx ON share_awards (sharer_id);
