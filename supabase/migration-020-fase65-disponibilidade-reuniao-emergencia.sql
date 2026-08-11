-- Ametista Conversões — Fase 6.5.1: disponibilidade semanal do gestor
-- e reunião de emergência (restrita a clientes do plano Dominação).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. Horários que o gestor marca como indisponíveis, por dia da
--    semana (0=domingo...6=sábado, igual ao Date.getDay() do
--    JavaScript) — presença de uma linha = bloqueado.
-- =========================================================
create table public.manager_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  time_slot text not null,
  created_at timestamptz not null default now(),
  unique (weekday, time_slot)
);

alter table public.manager_availability_blocks enable row level security;

create policy "admin_gestor_full_availability_blocks" on public.manager_availability_blocks for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

create policy "cliente_le_availability_blocks" on public.manager_availability_blocks for select
  using (public.current_user_role() = 'cliente');

-- =========================================================
-- 2. Reunião de emergência: pedido avulso, 1x/mês, só pra clientes do
--    plano Dominação — não tem relação com a recorrência automática
--    da Fase 5.5 (migration-015), que continua igual.
-- =========================================================
alter table public.meetings add column is_emergency boolean not null default false;

-- Toda a validação mora aqui dentro (não dá pra garantir "só
-- Dominação" + "1x/mês" + "fora dos horários bloqueados" só com RLS
-- declarativo) — mesmo padrão de função "security definer" já usado
-- em complete_meeting/cancel_meeting/enroll_client_meeting_recurrence.
create or replace function public.request_emergency_meeting(p_date timestamptz, p_meeting_link text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_plan text;
  v_weekday smallint;
  v_time_slot text;
  v_already_requested boolean;
  v_blocked boolean;
  v_meeting_id uuid;
begin
  if public.current_user_role() <> 'cliente' then
    raise exception 'Só clientes podem solicitar reunião de emergência';
  end if;
  v_client_id := public.current_user_client_id();

  select plan into v_plan from public.clients where id = v_client_id;
  if v_plan is distinct from 'dominacao' then
    raise exception 'Reunião de emergência disponível apenas para o plano Dominação';
  end if;

  select exists(
    select 1 from public.meetings
    where client_id = v_client_id and is_emergency = true
      and date_trunc('month', created_at) = date_trunc('month', now())
  ) into v_already_requested;
  if v_already_requested then
    raise exception 'Você já solicitou uma reunião de emergência este mês';
  end if;

  -- Convertido pro fuso da agência antes de extrair dia da
  -- semana/horário — o banco opera em UTC por padrão, e sem isso o
  -- cálculo fica errado pra horários perto da meia-noite.
  v_weekday := extract(dow from p_date at time zone 'America/Sao_Paulo');
  v_time_slot := to_char(p_date at time zone 'America/Sao_Paulo', 'HH24:MI');

  select exists(
    select 1 from public.manager_availability_blocks
    where weekday = v_weekday and time_slot = v_time_slot
  ) into v_blocked;
  if v_blocked then
    raise exception 'Esse horário não está disponível';
  end if;

  insert into public.meetings (title, client_id, date, meeting_link, status, is_emergency)
  values ('Reunião de emergência', v_client_id, p_date, p_meeting_link, 'scheduled', true)
  returning id into v_meeting_id;

  return v_meeting_id;
end;
$$;

grant execute on function public.request_emergency_meeting(timestamptz, text) to authenticated;
