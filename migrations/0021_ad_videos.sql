-- Admin-managed ad videos + watch stats
CREATE TABLE IF NOT EXISTS ad_videos (
  video_id TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  duration_sec INTEGER NOT NULL DEFAULT 180,
  max_display_hours REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS ad_video_stats (
  video_id TEXT PRIMARY KEY,
  total_watch_sec INTEGER NOT NULL DEFAULT 0,
  total_claims INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT ''
);
