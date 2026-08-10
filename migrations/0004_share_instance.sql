-- One share click = one share_id; missions & one message bound to that instance
CREATE TABLE IF NOT EXISTS share_instances (
  share_id TEXT PRIMARY KEY,
  sharer_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS share_mission_v2 (
  share_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  play_seconds DOUBLE PRECISION NOT NULL,
  created_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (share_id, visitor_id, mission_id)
);

CREATE TABLE IF NOT EXISTS share_messages_v2 (
  id SERIAL PRIMARY KEY,
  share_id TEXT NOT NULL,
  sharer_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE UNIQUE INDEX IF NOT EXISTS share_messages_v2_once
  ON share_messages_v2 (share_id, visitor_id);

CREATE INDEX IF NOT EXISTS share_messages_v2_sharer_idx
  ON share_messages_v2 (sharer_id);
