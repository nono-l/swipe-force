-- Self-serve "ad watch" continue-coin claims (YouTube embed mission)
CREATE TABLE IF NOT EXISTS ad_watch_claims (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL,
  video_id TEXT NOT NULL DEFAULT '',
  watch_sec INTEGER NOT NULL DEFAULT 0,
  day_jst TEXT NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS ad_watch_claims_player_day
  ON ad_watch_claims (player_id, day_jst);
