-- Soft-delete + one thank-you per fan message
CREATE TABLE IF NOT EXISTS share_message_meta (
  message_id INTEGER PRIMARY KEY,
  deleted INTEGER NOT NULL DEFAULT 0,
  thanks_sent INTEGER NOT NULL DEFAULT 0
);

-- Thank-you notes delivered to the original visitor's inbox
CREATE TABLE IF NOT EXISTS share_thanks (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL UNIQUE,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT '',
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS share_thanks_to_idx ON share_thanks (to_id);
