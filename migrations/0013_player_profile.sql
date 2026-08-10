-- public-readable player profiles (link perk)
ALTER TABLE account_save ADD COLUMN IF NOT EXISTS profile_json TEXT NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS player_profiles (
  player_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS player_profiles_updated_idx ON player_profiles (updated_at);
