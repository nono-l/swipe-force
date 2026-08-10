CREATE TABLE IF NOT EXISTS sound_url_visits (
  track_key TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  url TEXT NOT NULL,
  player_id TEXT NOT NULL,
  visited_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (track_key, url_hash, player_id)
);
