-- ==============================================================================
-- finTrack Useful Database Architecture & Full Supabase Integration Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure UUID extension is available
create extension if not exists "uuid-ossp";

-- 2. Add default financial fields to profiles table
alter table public.profiles
add column if not exists monthly_income numeric not null default 0,
add column if not exists monthly_budget numeric not null default 0,
add column if not exists savings_target numeric not null default 0,
add column if not exists role text not null default 'member' check (role in ('admin', 'member'));

-- 3. Ensure monthly_settings table exists with proper unique constraints and columns
create table if not exists public.monthly_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2020),
  income numeric not null default 0,
  monthly_budget numeric not null default 0,
  savings_target numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, month, year)
);

-- 4. Ensure goals and goal_transactions tables exist
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0,
  deadline date,
  monthly_contribution numeric default 0,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'paused')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.goal_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  goal_id uuid references public.goals(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('deposit', 'withdraw')),
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

-- 5. Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.expenses enable row level security;
alter table public.monthly_settings enable row level security;
alter table public.goals enable row level security;
alter table public.goal_transactions enable row level security;

-- 6. Helper function for admin check
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 7. RLS Policies: Profiles
drop policy if exists "Users can view and update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 8. RLS Policies: Monthly Settings
drop policy if exists "Users can manage monthly settings" on public.monthly_settings;
create policy "Users can manage monthly settings" on public.monthly_settings
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 9. RLS Policies: Goals & Transactions
drop policy if exists "Users can manage goals" on public.goals;
create policy "Users can manage goals" on public.goals
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can manage goal transactions" on public.goal_transactions;
create policy "Users can manage goal transactions" on public.goal_transactions
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 10. RLS Policies: Categories & Payment Methods
drop policy if exists "Users can manage categories" on public.categories;
create policy "Users can manage categories" on public.categories
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can manage payment methods" on public.payment_methods;
create policy "Users can manage payment methods" on public.payment_methods
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- 11. RLS Policies: Expenses
drop policy if exists "Users can manage expenses" on public.expenses;
drop policy if exists "Users can view all expenses" on public.expenses;
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;

create policy "Users can view expenses" on public.expenses
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert expenses" on public.expenses
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "Users can update expenses" on public.expenses
  for update using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete expenses" on public.expenses
  for delete using (auth.uid() = user_id or public.is_admin());

-- 12. RPC to ensure defaults are populated for any user
create or replace function public.ensure_user_defaults(target_user_id uuid)
returns void as $$
declare
  curr_month int := extract(month from current_date)::integer;
  curr_year int := extract(year from current_date)::integer;
begin
  -- 1. Ensure Categories exist
  if not exists (select 1 from public.categories where user_id = target_user_id) then
    insert into public.categories (user_id, name, icon, color, budget_amount, is_default)
    values
      (target_user_id, 'Food', '🍔', '#f97316', 0, true),
      (target_user_id, 'Transport', '🚗', '#06b6d4', 0, true),
      (target_user_id, 'Shopping', '🛍', '#ec4899', 0, true),
      (target_user_id, 'Bills & Utilities', '🏠', '#ef4444', 0, true),
      (target_user_id, 'Entertainment', '🎬', '#8b5cf6', 0, true),
      (target_user_id, 'Health & Medical', '🏥', '#10b981', 0, true),
      (target_user_id, 'Education & Books', '📚', '#3b82f6', 0, true),
      (target_user_id, 'Travel & Trips', '✈️', '#f59e0b', 0, true),
      (target_user_id, 'Subscriptions', '🔄', '#6366f1', 0, true),
      (target_user_id, 'Personal Care', '❤️', '#f43f5e', 0, true),
      (target_user_id, 'Investments', '📈', '#14b8a6', 0, true),
      (target_user_id, 'General / Other', '💰', '#94a3b8', 0, true);
  end if;

  -- 2. Ensure Payment Methods exist
  if not exists (select 1 from public.payment_methods where user_id = target_user_id) then
    insert into public.payment_methods (user_id, name, type, is_default)
    values
      (target_user_id, 'UPI', 'upi', true),
      (target_user_id, 'Credit Card', 'card', false),
      (target_user_id, 'Debit Card', 'card', false),
      (target_user_id, 'Cash', 'cash', false),
      (target_user_id, 'Net Banking', 'bank', false);
  end if;

  -- 3. Ensure Current Monthly Setting exists (zeroed out until user sets their real salary/budget)
  if not exists (select 1 from public.monthly_settings where user_id = target_user_id and month = curr_month and year = curr_year) then
    insert into public.monthly_settings (user_id, month, year, income, monthly_budget, savings_target)
    values (target_user_id, curr_month, curr_year, 0, 0, 0);
  end if;
end;
$$ language plpgsql security definer;
