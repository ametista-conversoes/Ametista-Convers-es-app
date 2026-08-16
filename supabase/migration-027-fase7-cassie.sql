-- Ametista Conversões — Fase 7.1: Cassie IA (chat do portal do
-- cliente, via API da OpenAI).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

create table public.cassie_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index on public.cassie_messages (client_id, created_at);

alter table public.cassie_messages enable row level security;

-- Só leitura pro cliente — quem escreve (a mensagem dele e a resposta
-- da Cassie) é sempre a Edge Function "cassie", com a service role
-- (mesmo padrão de performance_snapshots, que só a função
-- "integrations" escreve).
create policy "cliente_le_proprias_cassie_messages" on public.cassie_messages for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());
