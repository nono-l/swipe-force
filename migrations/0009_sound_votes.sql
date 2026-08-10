CREATE TABLE IF NOT EXISTS sound_votes (
  track_key TEXT NOT NULL,
  player_id TEXT NOT NULL,
  vote SMALLINT NOT NULL, -- 1 like, -1 dislike
  updated_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (track_key, player_id)
);
CREATE INDEX IF NOT EXISTS sound_votes_track_idx ON sound_votes (track_key);
