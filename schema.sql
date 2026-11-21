-- 1. ADIM: Supabase > SQL Editor'de çalıştır
create table plans(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, day date not null, time text,
  weight int not null default 1, done boolean not null default false,
  remind_at timestamptz, notified boolean not null default false,
  created_at timestamptz default now());
create index on plans(user_id,day);
create index on plans(remind_at) where notified=false;
create table push_subs(
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text unique not null, sub jsonb not null);
alter table plans enable row level security;
alter table push_subs enable row level security;
create policy own on plans for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy own on push_subs for all using(user_id=auth.uid()) with check(user_id=auth.uid());

-- 2. ADIM: notify fonksiyonunu deploy ettikten sonra çalıştır (PROJE_REF ve ANON_KEY'i değiştir)
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('notify','* * * * *',$$select net.http_post(url:='https://PROJE_REF.supabase.co/functions/v1/notify',headers:='{"Authorization":"Bearer ANON_KEY"}'::jsonb)$$);
