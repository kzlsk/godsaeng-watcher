alter table missions drop constraint missions_user_id_fkey;
alter table missions add constraint missions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table checkins drop constraint checkins_user_id_fkey;
alter table checkins add constraint checkins_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table focus_sessions drop constraint focus_sessions_user_id_fkey;
alter table focus_sessions add constraint focus_sessions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table nag_settings drop constraint nag_settings_user_id_fkey;
alter table nag_settings add constraint nag_settings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table nag_logs drop constraint nag_logs_user_id_fkey;
alter table nag_logs add constraint nag_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;