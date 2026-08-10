
ALTER TABLE ad_advertisers ADD COLUMN IF NOT EXISTS credit_sec INTEGER NOT NULL DEFAULT 0;
UPDATE ad_advertisers
SET credit_sec = GREATEST(credit_sec, FLOOR(credit_hours * 3600)::int)
WHERE credit_sec = 0 AND credit_hours > 0;

CREATE TABLE IF NOT EXISTS ad_watch_billing (
  player_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  billed_sec INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (player_id, video_id)
);
