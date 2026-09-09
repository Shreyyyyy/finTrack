-- ==============================================================================
-- finTrack Exclusive DB Admin Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Ensure role column exists
alter table public.profiles
add column if not exists role text not null default 'member'
check (role in ('admin', 'member'));

-- 2. Purge any demo or placeholder test profiles (strictly preserve real user data)
delete from public.profiles
where email in ('db_admin@fintrack.internal', 'user@fintrack.local')
   or id::text = 'usr-db-admin-master'
   or id::text like 'usr-%';

-- 3. Strictly demote all existing personal and standard accounts to 'member'
-- (Revoking admin rights from any previous auto-assigned accounts)
update public.profiles
set role = 'member'
where email not in ('dbadmin', 'db_admin') and email not ilike 'dbadmin%' and email not ilike 'db_admin%';

-- 4. If a real dbadmin account was registered, assign admin role (no @ required)
update public.profiles
set role = 'admin'
where email in ('dbadmin', 'db_admin') or email ilike 'dbadmin%' or email ilike 'db_admin%';

-- 5. Create secure is_admin() helper function
-- Strictly validates that role = 'admin' AND the account is dbadmin / db_admin
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

-- 5. Row Level Security (RLS) policies for Exclusive DB Admin Access
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

-- 6. Updated handle_new_user() trigger function
-- Normal users ALWAYS receive 'member' role. Only db_admin receives 'admin'.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  assigned_role text := 'member';
begin
  if new.email in ('dbadmin', 'db_admin') or new.email ilike 'dbadmin%' or new.email ilike 'db_admin%' then
    assigned_role := 'admin';
  else
    assigned_role := 'member';
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
    role = assigned_role,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;
