-- Ametista Conversões — Fase 2: papéis de usuário (RBAC)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (menu lateral "SQL Editor" > "New query"), depois clique em "Run".
-- É seguro rodar isso uma única vez, logo depois de criar o projeto.

-- 1. Tipo com os três papéis possíveis no sistema.
create type public.user_role as enum ('admin', 'gestor', 'cliente');

-- 2. Tabela com uma linha por usuário, guardando o papel dele.
--    (Nas Fases 3+ esta tabela ganha mais colunas, mas o "id" e o "role"
--    já ficam definidos aqui.)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role public.user_role not null default 'cliente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Segurança: cada pessoa só pode LER a própria linha.
--    De propósito não existe uma política de UPDATE aqui: se qualquer
--    usuário logado pudesse atualizar a própria linha, ele poderia trocar
--    o próprio "role" para "admin" sozinho, direto pelo navegador. Trocar
--    o papel de alguém só pode ser feito pelo painel do Supabase (que usa
--    uma conexão privilegiada, sem passar por essa regra).
alter table public.profiles enable row level security;

create policy "Usuário lê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- 4. Sempre que alguém se cadastra (tela de Registro), cria automaticamente
--    a linha correspondente em "profiles", já com o papel padrão "cliente".
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
