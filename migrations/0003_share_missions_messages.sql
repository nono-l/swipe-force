CREATE TABLE IF NOT EXISTS share_mission_done (
  sharer_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  play_seconds DOUBLE PRECISION NOT NULL,
  created_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (sharer_id, visitor_id, mission_id)
);

CREATE TABLE IF NOT EXISTS share_messages (
  id SERIAL PRIMARY KEY,
  sharer_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS share_messages_sharer_idx ON share_messages (sharer_id);
