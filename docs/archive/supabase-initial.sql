-- Historical reference only. Not executed or needed by the local SQLite application.
begin;
create type public.app_role as enum ('administrador', 'tecnico');
create type public.equipment_status as enum ('Funcional', 'Con fallas', 'En mantenimiento');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check (length(trim(full_name)) between 1 and 160),
 role public.app_role not null default 'tecnico'
);
create function public.current_role() returns public.app_role language sql stable security definer set search_path = public as $$ select role from public.profiles where id = auth.uid() $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(id, full_name) values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1), 'Usuario'),160)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id, full_name) select id, left(coalesce(nullif(trim(raw_user_meta_data->>'full_name'), ''), split_part(email,'@',1), 'Usuario'),160) from auth.users on conflict do nothing;
create sequence public.equipment_code_seq;
create table public.equipment (
 id uuid primary key default gen_random_uuid(),
 code text not null unique default ('PC-' || lpad(nextval('public.equipment_code_seq')::text, 3, '0')),
 name text not null check(length(trim(name)) between 1 and 160),
 serial text not null check(length(trim(serial)) between 1 and 160),
 inventory text not null check(length(trim(inventory)) between 1 and 160),
 brand text not null check(length(trim(brand)) between 1 and 160),
 model text not null check(length(trim(model)) between 1 and 160),
 location text not null check(length(trim(location)) between 1 and 160),
 processor text not null check(length(trim(processor)) between 1 and 160),
 ram integer not null check(ram between 1 and 2048),
 storage_type text not null check(storage_type in ('SSD','HDD','NVMe','Híbrido')),
 storage_gb integer not null check(storage_gb between 1 and 1000000),
 os text not null check(length(trim(os)) between 1 and 160),
 architecture text not null check(architecture in ('64 bits','32 bits','ARM64')),
 status public.equipment_status not null default 'Funcional',
 observations text not null default '' check(length(observations)<=4000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index equipment_serial_unique on public.equipment(lower(trim(serial)));
create unique index equipment_inventory_unique on public.equipment(lower(trim(inventory)));
create table public.status_history (
 id uuid primary key default gen_random_uuid(), equipment_id uuid not null references public.equipment(id) on delete cascade,
 previous_status public.equipment_status, new_status public.equipment_status not null,
 changed_at timestamptz not null default now(), actor_id uuid references auth.users(id) on delete set null,
 actor_name text not null, reason text not null check(length(trim(reason)) between 1 and 2000)
);
create index history_equipment_date on public.status_history(equipment_id, changed_at desc);
-- All writes use RPCs. Direct browser writes have no privileges, even for administrators.
alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.status_history enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid());
create policy equipment_read on public.equipment for select to authenticated using (public.current_role() is not null);
create policy history_read on public.status_history for select to authenticated using (public.current_role() is not null);
revoke all on public.profiles, public.equipment, public.status_history from anon, authenticated;
grant select on public.profiles, public.equipment, public.status_history to authenticated;
revoke all on sequence public.equipment_code_seq from anon, authenticated;
create function public.save_equipment(p_id uuid, p_data jsonb, p_reason text, p_expected_updated_at timestamptz default null) returns uuid language plpgsql security definer set search_path = public as $$
declare v_role public.app_role := public.current_role(); v_old public.equipment; v_new public.equipment; v_id uuid; v_actor text;
begin
 if auth.uid() is null or v_role is null then raise exception 'No autorizado' using errcode='42501'; end if;
 -- Serialize capacity checks and all edits, preventing simultaneous inserts above 30.
 perform pg_advisory_xact_lock(8042030);
 select full_name into v_actor from public.profiles where id=auth.uid();
 if p_id is null then
  if v_role <> 'administrador' then raise exception 'Solo un administrador puede registrar equipos' using errcode='42501'; end if;
  if (select count(*) from public.equipment) >= 30 then raise exception 'Se alcanzó el límite de 30 computadoras'; end if;
 else
  select * into v_old from public.equipment where id=p_id for update;
  if not found then raise exception 'El equipo ya no existe'; end if;
  if p_expected_updated_at is null or v_old.updated_at <> p_expected_updated_at then raise exception 'Otro usuario modificó este equipo. Actualice y vuelva a intentarlo.'; end if;
 end if;
 if p_id is not null and v_role = 'tecnico' then
  if exists(select 1 from jsonb_object_keys(p_data) k where k not in ('status','observations')) then raise exception 'El técnico solo puede cambiar estado y observaciones' using errcode='42501'; end if;
  update public.equipment set status=(p_data->>'status')::public.equipment_status, observations=p_data->>'observations', updated_at=clock_timestamp() where id=p_id returning * into v_new;
 else
  v_new := jsonb_populate_record(null::public.equipment, p_data);
  if p_id is null then
   insert into public.equipment(name,serial,inventory,brand,model,location,processor,ram,storage_type,storage_gb,os,architecture,status,observations)
   values(v_new.name,v_new.serial,v_new.inventory,v_new.brand,v_new.model,v_new.location,v_new.processor,v_new.ram,v_new.storage_type,v_new.storage_gb,v_new.os,v_new.architecture,v_new.status,coalesce(v_new.observations,'')) returning * into v_new;
  else
   update public.equipment set name=v_new.name,serial=v_new.serial,inventory=v_new.inventory,brand=v_new.brand,model=v_new.model,location=v_new.location,processor=v_new.processor,ram=v_new.ram,storage_type=v_new.storage_type,storage_gb=v_new.storage_gb,os=v_new.os,architecture=v_new.architecture,status=v_new.status,observations=v_new.observations,updated_at=clock_timestamp() where id=p_id returning * into v_new;
  end if;
 end if;
 v_id := v_new.id;
 if p_id is null or v_old.status is distinct from v_new.status then
  if p_id is not null and length(trim(coalesce(p_reason,'')))=0 then raise exception 'Indique el motivo del cambio de estado'; end if;
  insert into public.status_history(equipment_id, previous_status,new_status,actor_id,actor_name,reason) values(v_id,v_old.status,v_new.status,auth.uid(),v_actor,case when p_id is null then 'Registro inicial del equipo' else trim(p_reason) end);
 end if;
 return v_id;
end $$;
create function public.delete_equipment(p_id uuid, p_expected_updated_at timestamptz) returns void language plpgsql security definer set search_path = public as $$
begin
 if public.current_role() is distinct from 'administrador' then raise exception 'No autorizado' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(8042030);
 delete from public.equipment where id=p_id and updated_at=p_expected_updated_at;
 if not found then raise exception 'El registro cambió o fue eliminado. Actualice la lista.'; end if;
end $$;
revoke execute on function public.save_equipment(uuid,jsonb,text,timestamptz), public.delete_equipment(uuid,timestamptz), public.handle_new_user() from public, anon;
grant execute on function public.save_equipment(uuid,jsonb,text,timestamptz), public.delete_equipment(uuid,timestamptz) to authenticated;
alter table public.equipment replica identity full;
alter publication supabase_realtime add table public.equipment;
commit;
