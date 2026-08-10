-- Promo code expiry + max claims (0 / empty = unlimited / no expiry)
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TEXT NOT NULL DEFAULT '';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_claims INTEGER NOT NULL DEFAULT 0;
