-- flo. database schema
-- Run this in the Supabase SQL editor at https://supabase.com/dashboard

-- briefings
create table if not exists briefings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  date date not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table briefings enable row level security;
create policy "Users own briefings" on briefings for all using (auth.uid() = user_id);

-- chats
create table if not exists chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
alter table chats enable row level security;
create policy "Users own chats" on chats for all using (auth.uid() = user_id);

-- schedules
create table if not exists schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  day_of_week text not null,
  start_time text not null,
  end_time text not null,
  subject text not null,
  room text,
  created_at timestamptz default now()
);
alter table schedules enable row level security;
create policy "Users own schedules" on schedules for all using (auth.uid() = user_id);

-- user_settings
create table if not exists user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  city_override text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table user_settings enable row level security;
create policy "Users own settings" on user_settings for all using (auth.uid() = user_id);

-- caldav_connections
create table if not exists caldav_connections (
  user_id uuid references auth.users(id) on delete cascade primary key,
  icloud_email text not null,
  app_password_encrypted text not null,
  created_at timestamptz default now()
);
alter table caldav_connections enable row level security;
create policy "Users own caldav" on caldav_connections for all using (auth.uid() = user_id);

-- aula_connections
create table if not exists aula_connections (
  user_id uuid references auth.users(id) on delete cascade primary key,
  username_encrypted text not null,
  password_encrypted text not null,
  created_at timestamptz default now()
);
alter table aula_connections enable row level security;
create policy "Users own aula" on aula_connections for all using (auth.uid() = user_id);

-- spotify_connections
create table if not exists spotify_connections (
  user_id uuid references auth.users(id) on delete cascade primary key,
  access_token text not null,
  refresh_token text not null,
  created_at timestamptz default now()
);
alter table spotify_connections enable row level security;
create policy "Users own spotify" on spotify_connections for all using (auth.uid() = user_id);
