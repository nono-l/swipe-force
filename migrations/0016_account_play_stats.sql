-- Linked account: play time + player stats snapshot
ALTER TABLE account_save ADD COLUMN IF NOT EXISTS play_time_sec INTEGER NOT NULL DEFAULT 0;
ALTER TABLE account_save ADD COLUMN IF NOT EXISTS stats_json TEXT NOT NULL DEFAULT '{}';
