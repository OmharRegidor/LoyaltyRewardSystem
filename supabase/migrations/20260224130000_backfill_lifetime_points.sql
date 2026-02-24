-- Backfill: lifetime_points was never updated by the old add_customer_points function.
-- Set lifetime_points = total_points for any customer where lifetime_points fell behind.
UPDATE customers
SET lifetime_points = total_points
WHERE lifetime_points < total_points;
