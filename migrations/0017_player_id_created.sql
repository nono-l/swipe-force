-- When the linked player ID was first created / linked
ALTER TABLE account_players ADD COLUMN IF NOT EXISTS created_at TEXT NOT NULL DEFAULT '';
