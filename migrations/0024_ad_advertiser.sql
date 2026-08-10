-- Advertiser prepaid codes + balances + video ownership
CREATE TABLE IF NOT EXISTS ad_prepaid_codes (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  credit_hours REAL NOT NULL DEFAULT 1,
  max_claims INTEGER NOT NULL DEFAULT 1,
  claim_count INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT '',
  expires_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS ad_prepaid_claims (
  code TEXT NOT NULL,
  player_id TEXT NOT NULL,
  credit_hours REAL NOT NULL DEFAULT 0,
  claimed_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (code, player_id)
);

CREATE TABLE IF NOT EXISTS ad_advertisers (
  player_id TEXT PRIMARY KEY,
  credit_hours REAL NOT NULL DEFAULT 0,
  total_credited REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT ''
);

ALTER TABLE ad_videos ADD COLUMN IF NOT EXISTS owner_player_id TEXT NOT NULL DEFAULT '';
