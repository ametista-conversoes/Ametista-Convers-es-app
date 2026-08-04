-- Ajuste: adiciona a coluna "email" na tabela profiles, para você conseguir
-- ver o e-mail de cada pessoa direto no Table Editor (sem precisar cruzar
-- com a lista de Authentication > Users).
--
-- Como usar: SQL Editor > New query > cole isto > Run.
-- (Só precisa rodar uma vez. Se você já apagou e recriou as contas de teste
-- depois de rodar isto, elas já vêm com o e-mail preenchido sozinhas.)

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
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
