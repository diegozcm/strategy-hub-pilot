
-- 1) Tabela para perfis de acesso por módulo
create table if not exists public.user_module_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id uuid not null references public.system_modules(id) on delete cascade,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id, role)
);

-- Trigger para manter updated_at
drop trigger if exists trg_user_module_roles_updated_at on public.user_module_roles;
create trigger trg_user_module_roles_updated_at
before update on public.user_module_roles
for each row
execute function public.update_updated_at_column();

-- 2) RLS
alter table public.user_module_roles enable row level security;

-- Admins podem gerenciar (insert/update/delete/select)
drop policy if exists "Admins can manage user_module_roles" on public.user_module_roles;
create policy "Admins can manage user_module_roles"
on public.user_module_roles
as permissive
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Usuários podem visualizar seus próprios registros
drop policy if exists "Users can view own user_module_roles" on public.user_module_roles;
create policy "Users can view own user_module_roles"
on public.user_module_roles
as permissive
for select
to authenticated
using (auth.uid() = user_id);

-- 3) Função para definir perfis de um usuário em um módulo (idempotente)
create or replace function public.set_user_module_roles(
  _admin_id uuid,
  _user_id uuid,
  _module_id uuid,
  _roles public.app_role[]
) returns boolean
language plpgsql
security definer
as $$
begin
  -- Verifica permissão de admin
  if not public.has_role(_admin_id, 'admin'::public.app_role) then
    raise exception 'Apenas administradores podem alterar perfis por módulo';
  end if;

  -- Ativar/upsert para cada role informado
  insert into public.user_module_roles (user_id, module_id, role, active)
  select _user_id, _module_id, r, true
  from unnest(_roles) as r
  on conflict (user_id, module_id, role) do update
    set active = true,
        updated_at = now();

  -- Desativar os que não estão na lista informada
  update public.user_module_roles
  set active = false,
      updated_at = now()
  where user_id = _user_id
    and module_id = _module_id
    and role not in (select * from unnest(_roles));

  return true;
end;
$$;

-- 4) Função helper para buscar roles por módulo agregados
create or replace function public.get_user_module_roles(_user_id uuid)
returns table(module_id uuid, roles public.app_role[])
language sql
stable
security definer
as $$
  select umr.module_id,
         array_agg(umr.role order by umr.role) filter (where umr.active) as roles
  from public.user_module_roles umr
  where umr.user_id = _user_id
    and umr.active = true
  group by umr.module_id;
$$;

-- 5) Índices úteis
create index if not exists idx_user_module_roles_user_module on public.user_module_roles (user_id, module_id);
create index if not exists idx_user_module_roles_active on public.user_module_roles (active);
