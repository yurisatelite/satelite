-- SATÉLITE v3 — Pipeline de Projetos (Tema → Referência → Ganchos → Roteiro)
-- Rode no Supabase SQL Editor.

create table if not exists public.projects (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  title          text not null,
  topic          text,
  reference      text,
  niche          text,
  style          text,
  platform       text default 'instagram',
  hooks          jsonb,
  selected_hook  text,
  script         jsonb,
  status         text not null default 'tema'
                 check (status in ('tema', 'referencia', 'ganchos', 'roteiro', 'concluido')),
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "select_own_projects"
  on public.projects for select using (auth.uid() = user_id);
create policy "insert_own_projects"
  on public.projects for insert with check (auth.uid() = user_id);
create policy "update_own_projects"
  on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete_own_projects"
  on public.projects for delete using (auth.uid() = user_id);

create index if not exists projects_user_idx on public.projects (user_id, updated_at desc);
