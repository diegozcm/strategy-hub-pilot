
-- 1) Reforço de regra na função: bloquear roles para o módulo Startup HUB
create or replace function public.set_user_module_roles(
  _admin_id uuid,
  _user_id uuid,
  _module_id uuid,
  _roles public.app_role[]
)
returns boolean
language plpgsql
security definer
as $function$
declare
  v_slug text;
begin
  -- Verifica permissão de admin
  if not public.has_role(_admin_id, 'admin'::public.app_role) then
    raise exception 'Apenas administradores podem alterar perfis por módulo';
  end if;

  -- Obter slug do módulo
  select sm.slug into v_slug
  from public.system_modules sm
  where sm.id = _module_id;

  -- Bloquear para Startup HUB
  if v_slug = 'startup-hub' then
    raise exception 'Perfis por módulo (admin/manager/member) não se aplicam ao Startup HUB. Use os perfis Startup/Mentor.';
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
$function$;

-- 2) Trigger para impedir INSERT/UPDATE em user_module_roles para o Startup HUB
create or replace function public.prevent_roles_for_startup_hub()
returns trigger
language plpgsql
as $function$
declare
  v_slug text;
  v_module_id uuid;
begin
  -- Verificar o module_id que estará no registro final
  v_module_id := coalesce(new.module_id, old.module_id);

  select sm.slug into v_slug
  from public.system_modules sm
  where sm.id = v_module_id;

  if v_slug = 'startup-hub' then
    raise exception 'Não é permitido gravar roles em user_module_roles para o módulo Startup HUB';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_no_roles_startup_hub_ins on public.user_module_roles;
drop trigger if exists trg_no_roles_startup_hub_upd on public.user_module_roles;

create trigger trg_no_roles_startup_hub_ins
before insert on public.user_module_roles
for each row
execute function public.prevent_roles_for_startup_hub();

create trigger trg_no_roles_startup_hub_upd
before update of module_id on public.user_module_roles
for each row
execute function public.prevent_roles_for_startup_hub();

-- 3) Limpeza de dados já existentes para o Startup HUB (se houver)
delete from public.user_module_roles
where module_id in (select id from public.system_modules where slug = 'startup-hub');
