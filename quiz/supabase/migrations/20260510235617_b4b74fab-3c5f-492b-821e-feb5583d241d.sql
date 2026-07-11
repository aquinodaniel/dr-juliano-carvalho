create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Anyone can insert leads"
  on public.leads for insert
  to anon, authenticated
  with check (true);

create policy "Authenticated can view leads"
  on public.leads for select
  to authenticated
  using (true);
