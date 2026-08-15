-- Ametista Conversões — Fase 7: aprovação automática de arquivos que
-- ficam 48h sem resposta do cliente ("Aprovado por atraso").
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

alter table public.approvals add column if not exists auto_approved boolean not null default false;

-- Roda como job agendado (pg_cron), sem sessão de usuário logado — por
-- isso, diferente das outras funções do projeto, não checa
-- current_user_role(). Replica exatamente o que respond_to_approval já
-- faz ao aprovar (migration-005/migration-014): também cria a linha em
-- file_items, senão o arquivo aprovado nunca apareceria na aba
-- "Arquivos".
create or replace function public.auto_approve_overdue_approvals()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  overdue_ids uuid[];
begin
  select array_agg(id) into overdue_ids
    from public.approvals
    where status = 'pending' and created_at < now() - interval '48 hours';

  if overdue_ids is null then
    return;
  end if;

  insert into public.file_items (name, client_id, file_url, file_type, status)
  select title, client_id, file_url, file_type, 'approved'
    from public.approvals
    where id = any(overdue_ids);

  update public.approvals
    set status = 'approved', auto_approved = true
    where id = any(overdue_ids);
end;
$$;

create extension if not exists pg_cron;

-- A cada 30 minutos — é só lógica dentro do próprio banco (sem chamar
-- API externa), então não precisa passar por Edge Function feito o job
-- de sincronização do Google/Meta (migration-019).
select cron.schedule(
  'auto-approve-overdue-approvals',
  '*/30 * * * *',
  $$ select public.auto_approve_overdue_approvals(); $$
);
