-- Map Better Auth user -> game player_id (continue coins etc.)
CREATE TABLE IF NOT EXISTS account_players (
  user_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  linked_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS account_players_player_idx ON account_players (player_id);
