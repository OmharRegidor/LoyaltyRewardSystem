-- Drop the stale 5-arg add_stamp overload.
--
-- A previous migration (20260416000000_fix_race_conditions_and_idempotency)
-- introduced a 6-arg add_stamp(..., p_idempotency_key TEXT DEFAULT NULL).
-- Because PostgreSQL CREATE OR REPLACE FUNCTION matches on full signature, the
-- old 5-arg add_stamp(uuid,uuid,uuid,uuid,text) was left behind as a separate
-- overload instead of being replaced. PostgREST then can't disambiguate
-- between the two when callers omit p_idempotency_key, so .rpc('add_stamp', ...)
-- with 5 named params fails with PGRST203 — silently masked as a generic 500
-- on the staff Ring Up Sale + Stamp path.
--
-- Depends on: 20260416000000_fix_race_conditions_and_idempotency.sql
-- (which creates the 6-arg version that must remain after this drop).
-- IF EXISTS makes this drop idempotent on databases where the stale overload
-- was never created.

DROP FUNCTION IF EXISTS public.add_stamp(uuid, uuid, uuid, uuid, text);
