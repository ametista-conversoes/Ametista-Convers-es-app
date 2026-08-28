-- Ametista Conversões — Fase 20 (achado ao vivo, testando a integração
-- do Google Ads pela primeira vez com uma conta real): corrige um bug
-- real em `log_digital_asset_connection_event()` (gatilho
-- `trg_digital_asset_connections_audit`, criado na migration-036).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- O bug: a função monta a severidade do log de auditoria com
-- `case when NEW.status = 'error' then 'high' else 'low' end` — essa
-- expressão é do tipo `text`, mas `audit_logs.severity` é do tipo enum
-- `severity_level`, e o Postgres não faz esse cast sozinho. Resultado:
-- TODA mudança de status de uma conexão de integração (`connected`,
-- `error`, ou de volta pra `disconnected`) sempre falhava dentro do
-- gatilho com o erro 'column "severity" is of type severity_level but
-- expression is of type text' — e como o gatilho roda dentro da MESMA
-- transação do UPDATE que o disparou, a falha desfazia o UPDATE
-- inteiro. Na prática: nenhuma conexão OAuth (Google Ads/Meta Ads)
-- jamais conseguiu ser marcada como "conectada" de verdade desde que
-- esse gatilho foi criado — o `/callback` da Edge Function "integrations"
-- terminava sempre respondendo sucesso pro navegador (porque as duas
-- atualizações de status, ali, não conferiam erro nenhum — corrigido
-- separadamente no código da Fase 20.1), mas o banco continuava com o
-- status antigo por trás. Só foi descoberto agora porque essa foi a
-- primeira vez testando com uma conta real do Google Ads (antes só
-- havia contas de teste vazias, nunca usadas pra completar esse fluxo
-- de verdade).
--
-- A correção é só adicionar `::public.severity_level` no fim da
-- expressão — mesmo valor, só com o tipo certo.

create or replace function public.log_digital_asset_connection_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_asset_name text;
  v_label text;
begin
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    select client_id, name into v_client_id, v_asset_name from public.digital_assets where id = NEW.digital_asset_id;

    v_label := case NEW.status
      when 'connected' then 'conectada'
      when 'error' then 'com erro'
      when 'disconnected' then 'desconectada'
      else NEW.status
    end;

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values (
      'Integração ' || NEW.provider || ' de "' || coalesce(v_asset_name, 'ativo removido') || '" ' || v_label,
      'digital_asset_connection', NEW.id, v_client_id,
      (case when NEW.status = 'error' then 'high' else 'low' end)::public.severity_level
    );
  end if;
  return NEW;
end;
$$;
