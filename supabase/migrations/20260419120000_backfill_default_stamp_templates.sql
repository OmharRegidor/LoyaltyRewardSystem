-- Backfill: ensure every business with loyalty_mode = 'stamps' has an active
-- stamp_card_templates row. Covers businesses that set stamps mode before
-- the auto-create-on-mode-switch change shipped, so the mobile brand screen
-- and public pages can render the full loyalty card UI immediately instead
-- of falling back to a tiny "visit to start collecting" badge.
--
-- Defaults match the settings-page auto-create path and the mobile
-- useBrandRewards hook's fallback defaults (10 stamps).
-- Idempotent via NOT EXISTS; safe to re-run.

INSERT INTO stamp_card_templates (
  business_id,
  title,
  total_stamps,
  reward_title,
  reward_description,
  reward_image_url,
  min_purchase_amount,
  auto_reset,
  is_active,
  milestones
)
SELECT
  b.id,
  'Loyalty Card',
  10,
  'Free Reward',
  NULL,
  NULL,
  0,
  TRUE,
  TRUE,
  '[]'::jsonb
FROM businesses b
WHERE b.loyalty_mode = 'stamps'
  AND NOT EXISTS (
    SELECT 1
    FROM stamp_card_templates t
    WHERE t.business_id = b.id
      AND t.is_active = TRUE
  );
