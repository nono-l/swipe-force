CREATE TABLE IF NOT EXISTS sound_url_reports (
  track_key TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  url TEXT NOT NULL,
  player_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (track_key, url_hash, player_id)
);
CREATE INDEX IF NOT EXISTS sound_url_reports_url_idx ON sound_url_reports (track_key, url_hash);
