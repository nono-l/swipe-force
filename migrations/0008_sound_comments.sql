CREATE TABLE IF NOT EXISTS sound_comments (
  id SERIAL PRIMARY KEY,
  track_key TEXT NOT NULL,
  player_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS sound_comments_track_idx ON sound_comments (track_key);
