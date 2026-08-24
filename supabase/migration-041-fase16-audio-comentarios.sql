-- Ametista Conversões — Fase 16.2: áudio nos comentários.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- "content" continua not null — mensagem de áudio grava um texto de
-- reserva ali ("Mensagem de voz"); quem manda de verdade é audio_url
-- presente ou não. Sem mudança de RLS (colunas novas, mesmas
-- políticas já cobrem update/insert/select de comments).

alter table public.comments add column audio_url text;
alter table public.comments add column audio_duration_seconds integer;
