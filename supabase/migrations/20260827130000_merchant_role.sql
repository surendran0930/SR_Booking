-- Step 1 of 2 for the Merchants feature — run this FIRST, on its own, and
-- let it finish before running 20260827130001_merchants.sql.
--
-- Postgres will not let a new enum value be used in the same transaction
-- it was added in ("unsafe use of new value of enum type"). Supabase's SQL
-- editor runs a whole pasted script as one transaction, so if this
-- statement were bundled together with the policies/functions that
-- reference 'MERCHANT', the run would fail. Keeping it as its own
-- migration/paste sidesteps that entirely.

alter type public.user_role add value 'MERCHANT';
