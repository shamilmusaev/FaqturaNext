-- 0036 added p_bank_name as a new parameter, which created a second overload
-- of update_organization instead of replacing the old one (different
-- signature = different function to Postgres). Calls without p_bank_name
-- now match both overloads via their defaults, causing:
--   "Could not choose the best candidate function"
-- Drop the stale 15-param overload so only the 16-param version remains.

drop function if exists public.update_organization(
  uuid, text, text, text, jsonb, text, text, text, text,
  numeric, int, text, text, text, text
);
