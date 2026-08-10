-- Promo codes (admin-managed) + per-player claims
CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  grant_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS promo_claims (
  code TEXT NOT NULL,
  player_id TEXT NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (code, player_id)
);

CREATE INDEX IF NOT EXISTS promo_claims_player_idx ON promo_claims (player_id);
