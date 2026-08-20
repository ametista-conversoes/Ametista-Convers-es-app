-- Ametista Conversões — Fase 8.4b: chat de refinamento das sugestões
-- de headlines/textos ("Comunicação Persuasiva"), persistido (mesmo
-- desenho de cassie_messages, Fase 7.1), escopado por cliente +
-- formulário em vez de só por cliente.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

create table public.persuasive_copy_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  connection_id uuid references public.digital_asset_connections (id) on delete cascade,
  conversation_owner_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index on public.persuasive_copy_messages (conversation_owner_id, client_id, connection_id, created_at);

alter table public.persuasive_copy_messages enable row level security;

-- Sem policy de insert — só a Edge Function "CASSIE" escreve, com a
-- service role, mesmo padrão de cassie_messages.
create policy "usuario_le_propria_conversa_persuasiva" on public.persuasive_copy_messages for select
  using (conversation_owner_id = auth.uid());
