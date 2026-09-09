-- ==============================================================================
-- finTrack Purge All Dummy Data Script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- Cleans out all mock/dummy transactions, goals, category budgets, and fake numbers
-- ==============================================================================

-- 1. Wipe all expenses / transactions
truncate table public.expenses restart identity cascade;

-- 2. Wipe all goals and goal transactions
truncate table public.goal_transactions restart identity cascade;
truncate table public.goals restart identity cascade;

-- 3. Wipe category budgets table
truncate table public.category_budgets restart identity cascade;

-- 4. Reset all category budgets to 0 in categories table
update public.categories
set budget_amount = 0;

-- 5. Reset all monthly settings to 0 (clean slate, no dummy salary or budget)
update public.monthly_settings
set income = 0,
    monthly_budget = 0,
    savings_target = 0;

-- 6. Reset profile salary/budget defaults to 0
update public.profiles
set monthly_income = 0,
    monthly_budget = 0,
    savings_target = 0;

-- 7. Remove any mock test profiles (keeps real auth users)
delete from public.profiles
where email ilike '%@fintrack.local'
   or email ilike 'sarah%'
   or email ilike 'alex%'
   or email ilike 'you@%';

-- 8. Ensure handle_new_user() trigger function seeds 0 dummy budgets and 0 dummy salary
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
  assigned_role text := 'member';
begin
  select count(*) = 0 into is_first_user from public.profiles;
  if is_first_user or new.email ilike '%shrey%' or new.email ilike '%sjain%' then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, email, display_name, avatar_url, role, monthly_income, monthly_budget, savings_target)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    assigned_role,
    0,
    0,
    0
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  -- Seed Default Categories with ZERO dummy budgets
  insert into public.categories (user_id, name, icon, color, budget_amount, is_default)
  values
    (new.id, 'Food', '🍔', '#f97316', 0, true),
    (new.id, 'Transport', '🚗', '#06b6d4', 0, true),
    (new.id, 'Shopping', '🛍', '#ec4899', 0, true),
    (new.id, 'Bills', '🏠', '#ef4444', 0, true),
    (new.id, 'Entertainment', '🎬', '#8b5cf6', 0, true),
    (new.id, 'Health', '🏥', '#10b981', 0, true),
    (new.id, 'Education', '📚', '#3b82f6', 0, true),
    (new.id, 'Travel', '✈️', '#f59e0b', 0, true),
    (new.id, 'Subscriptions', '🔄', '#6366f1', 0, true),
    (new.id, 'Work', '💻', '#64748b', 0, true),
    (new.id, 'Personal', '❤️', '#f43f5e', 0, true),
    (new.id, 'Investment', '📈', '#14b8a6', 0, true),
    (new.id, 'Other', '💰', '#94a3b8', 0, true)
  on conflict do nothing;

  -- Seed Default Payment Methods
  insert into public.payment_methods (user_id, name, type, is_default)
  values
    (new.id, 'UPI', 'upi', true),
    (new.id, 'Credit Card', 'card', false),
    (new.id, 'Debit Card', 'card', false),
    (new.id, 'Cash', 'cash', false),
    (new.id, 'Bank Transfer', 'bank', false),
    (new.id, 'Other', 'other', false)
  on conflict do nothing;

  -- Seed Current Month Settings with 0 (user sets their own real salary/budget)
  insert into public.monthly_settings (user_id, month, year, income, monthly_budget, savings_target)
  values (
    new.id,
    extract(month from current_date)::integer,
    extract(year from current_date)::integer,
    0,
    0,
    0
  )
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;
