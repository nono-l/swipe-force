-- Appointed game admins (super admin is hard-coded in app, not stored here)
CREATE TABLE IF NOT EXISTS game_admins (
  player_id TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  appointed_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS game_admins_created_idx ON game_admins (created_at);
