-- missions
create table missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  category text,
  deadline timestamptz,
  duration_min int,
  done boolean default false,
  urgent boolean default false,
  created_at timestamptz default now()
);

-- checkins (하루 1건, user_id + date 유니크)
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  applications int default 0,
  problems int default 0,
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- focus_sessions
create table focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mission_id uuid references missions(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_min int,
  completed boolean default false
);

-- nag_settings (유저당 1행)
create table nag_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  intensity int default 70,
  persona text default 'realist'
);

-- nag_logs
create table nag_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  context jsonb,
  content text not null,
  generated_at timestamptz default now(),
  regenerate_count int default 0
);

-- 인덱스 (자주 조회되는 조건)
create index idx_missions_user_deadline on missions(user_id, deadline);
create index idx_checkins_user_date on checkins(user_id, date);
create index idx_focus_sessions_user_started on focus_sessions(user_id, started_at);

-- RLS 활성화
alter table missions enable row level security;
alter table checkins enable row level security;
alter table focus_sessions enable row level security;
alter table nag_settings enable row level security;
alter table nag_logs enable row level security;

-- RLS 정책: 본인 데이터만 CRUD 가능
create policy "missions_own_rows" on missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "checkins_own_rows" on checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "focus_sessions_own_rows" on focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "nag_settings_own_rows" on nag_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "nag_logs_own_rows" on nag_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 신규 유저 가입 시 nag_settings 기본값 자동 생성 (선택)
create or replace function public.handle_new_user_nag_settings()
returns trigger as $$
begin
  insert into public.nag_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_nag_settings
  after insert on auth.users
  for each row execute procedure public.handle_new_user_nag_settings();