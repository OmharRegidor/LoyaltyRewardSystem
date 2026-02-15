-- Allow customers to read their own redemptions (fixes empty Wallet → Rewards tab)
CREATE POLICY "customers_select_own_redemptions"
  ON redemptions FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Allow business owners to read their business's redemptions
-- Allow active staff to read their business's redemptions
CREATE POLICY "business_select_own_redemptions"
  ON redemptions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR
    business_id IN (
      SELECT business_id FROM staff WHERE user_id = auth.uid() AND is_active = true
    )
  );
