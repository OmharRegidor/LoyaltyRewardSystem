-- Per-business module overrides for Enterprise subscriptions
-- NULL = use plan default, true/false = override
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS module_booking_override BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS module_pos_override BOOLEAN DEFAULT NULL;
