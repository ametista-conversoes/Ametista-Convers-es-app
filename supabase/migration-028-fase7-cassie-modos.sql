-- Ametista Conversões — Fase 7.1 (retrabalho): Cassie com os 4 modos
-- (Assistente, Analista, Consultora, Auditora), liberados por plano do
-- cliente, e conversa própria do gestor sobre um cliente.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Apaga as mensagens de teste que já existem em cassie_messages (dado
-- de teste desta sessão, sem valor pra manter) porque a estrutura da
-- tabela muda: antes uma conversa era isolada só por client_id, agora
-- é isolada por conversation_owner_id (quem está de fato conversando
-- — o cliente, ou um gestor específico falando sobre aquele cliente),
-- pra a conversa do gestor sobre um cliente não se misturar com a
-- conversa do próprio cliente.

truncate table public.cassie_messages;

alter table public.cassie_messages
  add column conversation_owner_id uuid not null references auth.users (id) on delete cascade,
  add column mode text not null check (mode in ('assistente', 'analista', 'consultora', 'auditora'));

create index on public.cassie_messages (conversation_owner_id, created_at);

drop policy "cliente_le_proprias_cassie_messages" on public.cassie_messages;

-- Continua sem policy de insert — só a Edge Function "cassie" escreve,
-- com a service role, mesmo padrão de antes.
create policy "usuario_le_propria_conversa_cassie" on public.cassie_messages for select
  using (conversation_owner_id = auth.uid());

-- Nova: permite o botão "Limpar Histórico" apagar direto pelo Supabase
-- client, sem precisar de rota nova na Edge Function.
create policy "usuario_apaga_propria_conversa_cassie" on public.cassie_messages for delete
  using (conversation_owner_id = auth.uid());
