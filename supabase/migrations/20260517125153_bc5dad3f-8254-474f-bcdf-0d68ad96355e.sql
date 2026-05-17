
alter table public.user_settings
  add column if not exists onboarding_complete boolean default false;

create table if not exists public.profiles (
  user_id uuid primary key,
  email text,
  full_name text,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  stripe_customer_id text,
  last_active_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles self read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = user_id);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

alter table public.admins enable row level security;

create policy "admins read all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.admins a
      where a.email = (auth.jwt() ->> 'email')
    )
  );

create policy "admins update all profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.admins a
      where a.email = (auth.jwt() ->> 'email')
    )
  );

create policy "admins read admins" on public.admins
  for select using (
    exists (
      select 1 from public.admins a
      where a.email = (auth.jwt() ->> 'email')
    )
  );

insert into public.admins (email)
values ('alfredcasper1010@gmail.com')
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select exists(select 1 from public.admins where email = new.email) into is_admin;
  insert into public.profiles (user_id, email, full_name, plan)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', case when is_admin then 'plus' else 'free' end)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
