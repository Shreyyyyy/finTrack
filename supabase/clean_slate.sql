-- ==============================================================================
-- finTrack Clean Slate Purge Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- WARNING: This deletes all existing expenses, goals, and test transactions.
-- ==============================================================================

-- 1. Truncate all expenses
truncate table public.expenses restart identity cascade;

-- 2. Truncate all goals and goal transactions
truncate table public.goal_transactions restart identity cascade;
truncate table public.goals restart identity cascade;

-- 3. Truncate category budgets
truncate table public.category_budgets restart identity cascade;

-- 4. Reset monthly settings to zero defaults
update public.monthly_settings
set income = 0,
    monthly_budget = 0,
    savings_target = 0;

-- 5. Remove any mock test profiles (keeps real auth users)
delete from public.profiles
where email ilike '%@fintrack.local'
   or email ilike 'sarah%'
   or email ilike 'alex%'
   or email ilike 'you@%';
