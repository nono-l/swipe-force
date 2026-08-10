-- Cloud save for linked accounts: easy upgrades + inbox snapshot
CREATE TABLE IF NOT EXISTS account_save (
  player_id TEXT PRIMARY KEY,
  easy_upgrades TEXT NOT NULL DEFAULT '{}',
  inbox_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT ''
);
