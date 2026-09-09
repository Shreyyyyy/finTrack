-- ==============================================================================
-- finTrack PostgreSQL Database Schema & Row Level Security (RLS) Policies
-- Designed for Supabase Free Tier ($0/month)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  currency text default 'INR',
  default_payment_method text default 'UPI',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  icon text not null default '💰',
  color text default '#10b981',
  budget_amount numeric default 0,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 3. Payment Methods Table
create table if not exists public.payment_methods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null,
  type text default 'other',
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 4. Expenses Table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  amount numeric not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  merchant text,
  note text,
  expense_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Monthly Settings (Income, Budget, Savings Target per month)
create table if not exists public.monthly_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  month integer not null check (month between 1 and 12),
  year integer not null,
  income numeric not null default 0,
  monthly_budget numeric not null default 0,
  savings_target numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, month, year)
);

-- 6. Category Budgets (per month individual category budgets)
create table if not exists public.category_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  category_id uuid references public.categories(id) on delete cascade not null,
  month integer not null check (month between 1 and 12),
  year integer not null,
  budget_amount numeric not null default 0,
  unique (user_id, category_id, month, year)
);

-- 7. Goals Table
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

-- 8. Goal Transactions Table
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

-- 9. API Keys (For Apple Shortcut Back Tap Authentication)
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  name text not null default 'Apple Shortcut',
  key_hash text not null unique,
  created_at timestamptz default now()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY SPEED
-- ==============================================================================
create index if not exists idx_expenses_user_date on public.expenses(user_id, expense_date desc);
create index if not exists idx_expenses_category on public.expenses(category_id);
create index if not exists idx_expenses_payment_method on public.expenses(payment_method_id);
create index if not exists idx_monthly_settings_user_period on public.monthly_settings(user_id, year, month);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_api_keys_hash on public.api_keys(key_hash);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.expenses enable row level security;
alter table public.monthly_settings enable row level security;
alter table public.category_budgets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_transactions enable row level security;
alter table public.api_keys enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can view all profiles" on public.profiles;
create policy "Users can view all profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Standard User Data Policies (Categories, Payment Methods, Expenses, Settings, etc.)
create policy "Users can manage categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage payment methods" on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Household Shared Expenses
drop policy if exists "Users can manage expenses" on public.expenses;
drop policy if exists "Users can view all expenses" on public.expenses;
create policy "Users can view all expenses" on public.expenses
  for select using (auth.role() = 'authenticated');

create policy "Users can insert own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own expenses" on public.expenses
  for update using (auth.uid() = user_id);

create policy "Users can delete own expenses" on public.expenses
  for delete using (auth.uid() = user_id);

create policy "Users can manage monthly settings" on public.monthly_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage category budgets" on public.category_budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage goal transactions" on public.goal_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage api keys" on public.api_keys;
create policy "Users can manage api keys" on public.api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Allow API key lookup" on public.api_keys;
create policy "Allow API key lookup" on public.api_keys
  for select to anon, authenticated using (true);

drop policy if exists "Allow quick expense insert" on public.expenses;
create policy "Allow quick expense insert" on public.expenses
  for insert to anon, authenticated with check (true);

-- ==============================================================================
-- DEDICATED QUICK EXPENSE RPC (SECURITY DEFINER) FOR SHORTCUTS & WEBHOOKS
-- ==============================================================================
create or replace function public.log_quick_expense(
  p_api_key text,
  p_amount numeric,
  p_category text default null,
  p_payment text default null,
  p_note text default null,
  p_merchant text default null,
  p_date text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_category_id uuid := null;
  v_payment_method_id uuid := null;
  v_expense_date date;
  v_clean_key text;
  v_expense record;
begin
  v_clean_key := trim(p_api_key);

  -- 1. Find user from api_keys table
  select user_id into v_user_id
  from public.api_keys
  where key_hash = v_clean_key
  limit 1;

  -- Fallback: If not in api_keys table yet, match primary user for valid fintrack prefix
  if v_user_id is null and (v_clean_key like 'fintrack_sec_%' or v_clean_key like 'fintrack_%') then
    select id into v_user_id
    from public.profiles
    order by created_at asc
    limit 1;

    -- Also automatically register this key into api_keys so subsequent calls are fast
    if v_user_id is not null then
      insert into public.api_keys (user_id, name, key_hash)
      values (v_user_id, 'iPhone Back Tap (Auto)', v_clean_key)
      on conflict (key_hash) do nothing;
    end if;
  end if;

  if v_user_id is null then
    return json_build_object(
      'success', false,
      'error', 'Unauthorized. API key not recognized. Please copy the key from your finTrack settings.'
    );
  end if;

  -- 2. Resolve Category ID
  if p_category is not null and trim(p_category) != '' then
    if trim(p_category) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      v_category_id := trim(p_category)::uuid;
    else
      select id into v_category_id
      from public.categories
      where (user_id = v_user_id or is_default = true)
        and lower(name) like '%' || lower(trim(p_category)) || '%'
      order by (user_id = v_user_id) desc
      limit 1;
    end if;
  end if;

  -- Fallback to default category
  if v_category_id is null then
    select id into v_category_id
    from public.categories
    where (user_id = v_user_id or is_default = true)
    order by is_default desc
    limit 1;
  end if;

  -- 3. Resolve Payment Method ID
  if p_payment is not null and trim(p_payment) != '' then
    if trim(p_payment) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      v_payment_method_id := trim(p_payment)::uuid;
    else
      select id into v_payment_method_id
      from public.payment_methods
      where (user_id = v_user_id or is_default = true)
        and lower(name) like '%' || lower(trim(p_payment)) || '%'
      order by (user_id = v_user_id) desc
      limit 1;
    end if;
  end if;

  -- Fallback to default payment method
  if v_payment_method_id is null then
    select id into v_payment_method_id
    from public.payment_methods
    where (user_id = v_user_id or is_default = true)
    order by is_default desc
    limit 1;
  end if;

  -- 4. Resolve Date
  begin
    v_expense_date := coalesce(p_date::date, current_date);
  exception when others then
    v_expense_date := current_date;
  end;

  -- 5. Insert Expense
  insert into public.expenses (
    user_id,
    amount,
    category_id,
    payment_method_id,
    merchant,
    note,
    expense_date
  ) values (
    v_user_id,
    p_amount,
    v_category_id,
    v_payment_method_id,
    p_merchant,
    coalesce(p_note, p_category, 'iPhone Quick Entry'),
    v_expense_date
  )
  returning * into v_expense;

  return json_build_object(
    'success', true,
    'message', 'Expense added ✓: ₹' || trim(to_char(p_amount, 'FM999,999,999.00')) || ' for ' || coalesce(p_category, 'Expense'),
    'expense', row_to_json(v_expense)
  );
end;
$$;

grant execute on function public.log_quick_expense to anon, authenticated, service_role;


-- ==============================================================================
-- AUTOMATIC SEEDING ON USER SIGNUP TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 1. Create Profile (with Google OAuth metadata)
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  );

  -- 2. Seed Default Categories (zero dummy budget)
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
    (new.id, 'Other', '💰', '#94a3b8', 0, true);

  -- 3. Seed Default Payment Methods
  insert into public.payment_methods (user_id, name, type, is_default)
  values
    (new.id, 'UPI', 'upi', true),
    (new.id, 'Credit Card', 'card', false),
    (new.id, 'Debit Card', 'card', false),
    (new.id, 'Cash', 'cash', false),
    (new.id, 'Bank Transfer', 'bank', false),
    (new.id, 'Other', 'other', false);

  -- 4. Seed Current Month Settings (all 0 until user sets real income/budget)
  insert into public.monthly_settings (user_id, month, year, income, monthly_budget, savings_target)
  values (
    new.id,
    extract(month from current_date)::integer,
    extract(year from current_date)::integer,
    0,
    0,
    0
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run after auth.users creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
