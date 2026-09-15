alter table missions alter column user_id set default auth.uid();
alter table checkins alter column user_id set default auth.uid();
alter table focus_sessions alter column user_id set default auth.uid();
alter table nag_logs alter column user_id set default auth.uid();
