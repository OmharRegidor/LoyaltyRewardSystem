-- Migration: Fix booking RLS policies for business owners
-- Ensures business owners can view and manage their bookings
--
-- Problem: The original booking RLS policies from packages/shared/supabase/migrations
-- may not have been applied to production, leaving only the public access policies.

-- Drop and recreate the business owner policy to ensure it exists
DROP POLICY IF EXISTS "Business owners can manage all bookings" ON public.bookings;
CREATE POLICY "Business owners can manage all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Drop and recreate staff view policy
DROP POLICY IF EXISTS "Staff can view and update their assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view their business bookings" ON public.bookings;
CREATE POLICY "Staff can view their business bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = bookings.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

-- Drop and recreate staff update policy
DROP POLICY IF EXISTS "Staff can update booking status" ON public.bookings;
CREATE POLICY "Staff can update booking status"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = bookings.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

-- Ensure customers can view their own bookings
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = bookings.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Ensure customers can cancel their own bookings
DROP POLICY IF EXISTS "Customers can cancel their own bookings" ON public.bookings;
CREATE POLICY "Customers can cancel their own bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = bookings.customer_id
      AND customers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'cancelled'
  );
