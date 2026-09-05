-- Ametista Conversões — corrige FK que impedia apagar clientes com conta
-- de acesso vinculada (Fase 26).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Causa raiz: `profiles.client_id` (migration-002) foi criada sem "on
-- delete", então o Postgres usa o padrão (restrict) — apagar um cliente
-- que tem uma conta de login vinculada (profiles.client_id = esse cliente)
-- falha com violação de chave estrangeira. Corrige pra "on delete set
-- null": apagar o cliente desvincula a conta (ela some da lista de
-- "contas com acesso" e volta a não ter cliente nenhum), em vez de travar
-- a exclusão.

alter table public.profiles drop constraint if exists profiles_client_id_fkey;

alter table public.profiles
  add constraint profiles_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete set null;
