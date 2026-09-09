-- ==============================================================================
-- finTrack DB Admin & Role Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Add role column to profiles if it doesn't already exist
alter table public.profiles
add column if not exists role text not null default 'member'
check (role in ('admin', 'member'));

-- 2. Create is_admin() helper function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() 
      and role = 'admin'
      and (
        email in ('dbadmin', 'db_admin') 
        or email ilike 'dbadmin%' 
        or email ilike 'db_admin%'
      )
  );
end;
$$ language plpgsql security definer;

-- 3. Preserve only real users, purge any demo data, and enforce roles
delete from public.profiles
where email in ('db_admin@fintrack.internal', 'user@fintrack.local')
   or id::text in ('usr-db-admin-master', 'usr-dbadmin')
   or id::text like 'usr-%';

-- Demote all standard user accounts to 'member' (strictly no unverified admins)
update public.profiles
set role = 'member'
where email not in ('dbadmin', 'db_admin') and email not ilike 'dbadmin%' and email not ilike 'db_admin%';

-- Only the dedicated dbadmin / db_admin login is granted admin privileges (no @ required)
update public.profiles
set role = 'admin'
where email in ('dbadmin', 'db_admin') or email ilike 'dbadmin%' or email ilike 'db_admin%';

-- 4. Enable Row Level Security (RLS) policies for Admin Access
drop policy if exists "Admins can view and manage all profiles" on public.profiles;
create policy "Admins can view and manage all profiles" on public.profiles
  for all using (public.is_admin() or auth.uid() = id);

drop policy if exists "Admins can view all expenses" on public.expenses;
create policy "Admins can view all expenses" on public.expenses
  for all using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "Admins can view all goals" on public.goals;
create policy "Admins can view all goals" on public.goals
  for all using (public.is_admin() or auth.uid() = user_id);

drop policy if exists "Admins can view all monthly settings" on public.monthly_settings;
create policy "Admins can view all monthly settings" on public.monthly_settings
  for all using (public.is_admin() or auth.uid() = user_id);

-- 5. Updated handle_new_user() trigger function
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text := 'member';
begin
  if new.email in ('dbadmin', 'db_admin') or new.email ilike 'dbadmin%' or new.email ilike 'db_admin%' then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null),
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  -- Seed Default Categories (zero dummy budget)
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

  -- Seed Current Month Settings (all 0 until user sets their salary)
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
