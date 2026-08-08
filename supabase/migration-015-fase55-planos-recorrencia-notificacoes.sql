-- Ametista Conversões — Fase 5.5: planos fixos (Validação/Escala/
-- Dominação), reuniões recorrentes automáticas por plano, e a tabela de
-- "última vez visto" que alimenta a bolinha de notificação no menu.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. Planos fixos: só 3 opções (chaves estáveis em minúsculo — os
--    rótulos em português ficam só no front). Linha que não bater com
--    nenhuma das 3 vira NULL; o gestor reatribui pela Central.
-- =========================================================
update public.clients set plan = null where plan is not null and plan not in ('validacao', 'escala', 'dominacao');

alter table public.clients
  add constraint clients_plan_check check (plan is null or plan in ('validacao', 'escala', 'dominacao'));

-- =========================================================
-- 2. Reuniões recorrentes automáticas por plano
--    Validação = mensal · Escala = quinzenal · Dominação = semanal
--    O sistema sempre mantém 3 reuniões futuras "Reunião" por cliente
--    cadastrado; ao concluir uma, outra é criada na hora pra repor.
-- =========================================================
alter table public.meetings add column recurring boolean not null default false;

create table public.client_meeting_recurrence (
  client_id uuid primary key references public.clients (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.client_meeting_recurrence
  for each row execute procedure public.set_updated_at();

alter table public.client_meeting_recurrence enable row level security;

create policy "admin_gestor_full_client_meeting_recurrence" on public.client_meeting_recurrence for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

-- Intervalo entre reuniões de acordo com o plano atual do cliente — é
-- consultado de novo a cada reposição, então uma troca de plano já muda
-- o ritmo das próximas reuniões automaticamente.
create or replace function public.meeting_recurrence_interval(p_plan text)
returns interval
language sql
immutable
as $$
  select case p_plan
    when 'validacao' then interval '1 month'
    when 'escala' then interval '2 weeks'
    when 'dominacao' then interval '1 week'
    else null
  end;
$$;

-- Ativa a recorrência do cliente e garante 3 reuniões "Reunião" futuras
-- (idempotente: rodar de novo só completa até 3, não duplica).
create or replace function public.enroll_client_meeting_recurrence(p_client_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_plan text;
  v_interval interval;
  v_scheduled_count int;
  v_last_date timestamptz;
  i int;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  select plan into v_plan from public.clients where id = p_client_id;
  if v_plan is null then
    raise exception 'Defina o plano do cliente (Validação, Escala ou Dominação) antes de configurar a recorrência.';
  end if;

  v_interval := public.meeting_recurrence_interval(v_plan);

  insert into public.client_meeting_recurrence (client_id, active)
  values (p_client_id, true)
  on conflict (client_id) do update set active = true;

  select count(*), max(date) into v_scheduled_count, v_last_date
    from public.meetings
    where client_id = p_client_id and recurring = true and status = 'scheduled';

  if v_last_date is null then
    v_last_date := now();
  end if;

  for i in 1..(3 - coalesce(v_scheduled_count, 0)) loop
    insert into public.meetings (title, client_id, date, status, recurring)
    values ('Reunião', p_client_id, v_last_date + (v_interval * i), 'scheduled', true);
  end loop;
end;
$$;

grant execute on function public.enroll_client_meeting_recurrence(uuid) to authenticated;

-- Liga/desliga a recorrência sem apagar histórico nem as reuniões já
-- agendadas.
create or replace function public.set_client_meeting_recurrence_active(p_client_id uuid, p_active boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  insert into public.client_meeting_recurrence (client_id, active)
  values (p_client_id, p_active)
  on conflict (client_id) do update set active = p_active;
end;
$$;

grant execute on function public.set_client_meeting_recurrence_active(uuid, boolean) to authenticated;

-- Marca uma reunião como concluída e, se o cliente tiver recorrência
-- ativa, repõe automaticamente até voltar a ter 3 reuniões agendadas.
create or replace function public.complete_meeting(meeting_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_recurrence_active boolean;
  v_plan text;
  v_interval interval;
  v_last_date timestamptz;
  v_scheduled_count int;
  i int;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  select client_id into v_client_id from public.meetings where id = meeting_id;
  if v_client_id is null then
    raise exception 'Reunião não encontrada';
  end if;

  update public.meetings set status = 'completed' where id = meeting_id;

  select active into v_recurrence_active from public.client_meeting_recurrence where client_id = v_client_id;

  if coalesce(v_recurrence_active, false) then
    select plan into v_plan from public.clients where id = v_client_id;
    v_interval := public.meeting_recurrence_interval(v_plan);

    if v_interval is not null then
      select count(*), max(date) into v_scheduled_count, v_last_date
        from public.meetings
        where client_id = v_client_id and recurring = true and status = 'scheduled';

      if v_last_date is null then
        v_last_date := now();
      end if;

      for i in 1..(3 - coalesce(v_scheduled_count, 0)) loop
        insert into public.meetings (title, client_id, date, status, recurring)
        values ('Reunião', v_client_id, v_last_date + (v_interval * i), 'scheduled', true);
      end loop;
    end if;
  end if;
end;
$$;

grant execute on function public.complete_meeting(uuid) to authenticated;

-- =========================================================
-- 3. Notificações no menu: última vez que cada usuário visitou cada aba
--    (a bolinha roxa some assim que a pessoa abre a aba de novo).
-- =========================================================
create table public.nav_last_seen (
  user_id uuid not null references auth.users (id) on delete cascade,
  nav_key text not null,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, nav_key)
);

alter table public.nav_last_seen enable row level security;

create policy "usuario_le_proprio_nav_last_seen" on public.nav_last_seen for select
  using (auth.uid() = user_id);

create policy "usuario_insere_proprio_nav_last_seen" on public.nav_last_seen for insert
  with check (auth.uid() = user_id);

create policy "usuario_atualiza_proprio_nav_last_seen" on public.nav_last_seen for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
