-- ================================================================
-- stutosed (courses.stutosed.in) — Supabase PostgreSQL Database Schema
-- Run this script in your Supabase Project -> SQL Editor
-- ================================================================

-- 1. PROFILES TABLE (Sync with Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Trigger to auto-create profile on Auth Signup (Google OAuth / Email)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. COURSES TABLE
create table if not exists public.courses (
  id text primary key,
  name text not null,
  subname text not null,
  teacher text not null,
  subject text not null,
  thumb text not null,
  is_parmar boolean default false,
  is_pratham boolean default false,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.courses enable row level security;
create policy "Courses are viewable by everyone." on public.courses for select using (true);

-- 3. LECTURES TABLE
create table if not exists public.lectures (
  id uuid default gen_random_uuid() primary key,
  course_id text references public.courses(id) on delete cascade not null,
  tab_id text default 'videos',
  subject_name text,
  title text not null,
  url text not null,
  type text not null check (type in ('hls', 'youtube', 'pdf', 'external', 'unknown')),
  lecture_number integer default 0,
  attachment_links jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_lectures_course_id on public.lectures(course_id);
create index if not exists idx_lectures_subject_name on public.lectures(subject_name);

alter table public.lectures enable row level security;
create policy "Lectures are viewable by everyone." on public.lectures for select using (true);

-- 4. USER WATCH HISTORY TABLE
create table if not exists public.user_watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  lecture_url text not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lecture_url)
);

create index if not exists idx_watch_history_user on public.user_watch_history(user_id);

alter table public.user_watch_history enable row level security;
create policy "Users can view own watch history." on public.user_watch_history for select using (auth.uid() = user_id);
create policy "Users can insert/update own watch history." on public.user_watch_history for insert with check (auth.uid() = user_id);
create policy "Users can delete own watch history." on public.user_watch_history for delete using (auth.uid() = user_id);

-- 5. USER COURSE MEMORY (LAST PLAYED RESUME)
create table if not exists public.user_course_memory (
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  last_tab_id text not null,
  last_lecture_url text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, course_id)
);

alter table public.user_course_memory enable row level security;
create policy "Users can view own course memory." on public.user_course_memory for select using (auth.uid() = user_id);
create policy "Users can insert/update own course memory." on public.user_course_memory for insert with check (auth.uid() = user_id);
create policy "Users can update own course memory." on public.user_course_memory for update using (auth.uid() = user_id);
