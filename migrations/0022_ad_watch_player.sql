-- Per-player last claim + clock-hour usage
CREATE TABLE IF NOT EXISTS ad_watch_player (
  player_id TEXT PRIMARY KEY,
  last_claimed_at TEXT NOT NULL DEFAULT '',
  last_video_id TEXT NOT NULL DEFAULT '',
  last_watch_sec INTEGER NOT NULL DEFAULT 0,
  hour_key TEXT NOT NULL DEFAULT '',
  hour_coins INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT ''
);
