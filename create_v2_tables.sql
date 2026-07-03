-- SATÉLITE v2 — Rode este script no Supabase SQL Editor (Dashboard > SQL Editor)
-- Cria: profiles (plano + nicho/estilo permanentes), watchlist, saved_hooks,
-- scripts e usage_events (contagem de créditos mensais).

-- ============================================================
-- 1. PROFILES — dados permanentes do usuário + plano
-- ============================================================
create table if not exists public.profiles (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  niche                   text,
  style                   text,
  plan                    text not null default 'free' check (plan in ('free', 'criador', 'pro')),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan_renews_at          timestamptz,
  created_at              timestamptz default now() not null,
  updated_at              timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "select_own_profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "insert_own_profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Usuário pode editar nicho/estilo, mas NUNCA o próprio plano
-- (plano só muda via service role no webhook do Stripe).
create policy "update_own_profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.protect_plan_columns()
returns trigger as $$
begin
  -- service_role passa direto; usuário comum não altera colunas de plano
  if current_setting('request.jwt.claims', true)::jsonb ->> 'role' is distinct from 'service_role' then
    new.plan := old.plan;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.plan_renews_at := old.plan_renews_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_plan_columns_trigger on public.profiles;
create trigger protect_plan_columns_trigger
  before update on public.profiles
  for each row execute function public.protect_plan_columns();

-- ============================================================
-- 2. WATCHLIST — criadores acompanhados por nicho
-- ============================================================
create table if not exists public.watchlist (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  creator_name  text not null,
  handle        text,
  platform      text,
  niche         text not null,
  reason        text,
  created_at    timestamptz default now() not null
);

alter table public.watchlist enable row level security;

create policy "select_own_watchlist"
  on public.watchlist for select using (auth.uid() = user_id);
create policy "insert_own_watchlist"
  on public.watchlist for insert with check (auth.uid() = user_id);
create policy "delete_own_watchlist"
  on public.watchlist for delete using (auth.uid() = user_id);

create index if not exists watchlist_user_idx on public.watchlist (user_id, created_at desc);

-- ============================================================
-- 3. SAVED_HOOKS — ganchos favoritos do gerador
-- ============================================================
create table if not exists public.saved_hooks (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  hook_text   text not null,
  hook_type   text not null,
  source      text,
  created_at  timestamptz default now() not null
);

alter table public.saved_hooks enable row level security;

create policy "select_own_hooks"
  on public.saved_hooks for select using (auth.uid() = user_id);
create policy "insert_own_hooks"
  on public.saved_hooks for insert with check (auth.uid() = user_id);
create policy "delete_own_hooks"
  on public.saved_hooks for delete using (auth.uid() = user_id);

create index if not exists saved_hooks_user_idx on public.saved_hooks (user_id, created_at desc);

-- ============================================================
-- 4. SCRIPTS — roteiros gerados pelo roteirizador
-- ============================================================
create table if not exists public.scripts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  reference   text not null,
  niche       text not null,
  style       text not null,
  platform    text,
  result      jsonb not null,
  created_at  timestamptz default now() not null
);

alter table public.scripts enable row level security;

create policy "select_own_scripts"
  on public.scripts for select using (auth.uid() = user_id);
create policy "insert_own_scripts"
  on public.scripts for insert with check (auth.uid() = user_id);
create policy "delete_own_scripts"
  on public.scripts for delete using (auth.uid() = user_id);

create index if not exists scripts_user_idx on public.scripts (user_id, created_at desc);

-- ============================================================
-- 5. USAGE_EVENTS — consumo de créditos (1 linha = 1 geração de IA)
-- ============================================================
create table if not exists public.usage_events (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  kind        text not null check (kind in ('analyze', 'hooks', 'script')),
  created_at  timestamptz default now() not null
);

alter table public.usage_events enable row level security;

create policy "select_own_usage"
  on public.usage_events for select using (auth.uid() = user_id);
create policy "insert_own_usage"
  on public.usage_events for insert with check (auth.uid() = user_id);

create index if not exists usage_events_user_month_idx
  on public.usage_events (user_id, created_at desc);
