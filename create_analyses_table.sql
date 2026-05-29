-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

create table if not exists public.analyses (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  platform    text        not null,
  input       text        not null,
  niche       text        not null,
  style       text        not null,
  result      jsonb       not null,
  created_at  timestamptz default now() not null
);

alter table public.analyses enable row level security;

create policy "select_own_analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "insert_own_analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create index analyses_user_created_idx
  on public.analyses (user_id, created_at desc);
