-- Ametista Conversões — dados de exemplo dos ajustes na Fase 4.3
--
-- Como usar: rode DEPOIS do migration-006-phase4-fixes.sql. Copie tudo,
-- cole no SQL Editor do Supabase e clique em "Run".
--
-- A única aprovação de exemplo da Fase 3 já foi respondida durante os
-- testes da Fase 4.3, então adiciono 2 novas em status "pending" para
-- dar pra testar Aprovar / Rejeitar / Pedir revisão de novo.
insert into public.approvals (title, client_id, file_url, file_type, status, feedback) values
  ('Banner campanha de inverno', '11111111-1111-1111-1111-111111111111', 'https://exemplo.com/arquivos/banner-inverno.pdf', 'application/pdf', 'pending', null),
  ('Roteiro de vídeo institucional', '11111111-1111-1111-1111-111111111111', 'https://exemplo.com/arquivos/roteiro-institucional.pdf', 'application/pdf', 'pending', null);
