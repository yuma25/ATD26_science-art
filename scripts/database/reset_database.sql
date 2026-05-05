-- ==========================================
-- 💡 ATD26_SCIENCE-ART: データベース初期化 SQL
-- ==========================================
-- 内容: テーブルリセット, party_size追加, 0-5インデックス同期, 自動トリガー設定

-- 1. テーブルのリセット
drop table if exists public.user_badges;
drop table if exists public.badges;
drop table if exists public.profiles;

-- 2. テーブルの作成

-- プロフィール（パーティー人数 party_size を含む）
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  party_size int default null, -- 利用人数
  created_at timestamp default (now() + interval '9 hours') not null,
  last_seen timestamp default (now() + interval '9 hours')
);

-- 標本マスター
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  model_url text not null,
  target_index int not null, -- MindARのインデックス (0-5)
  created_at timestamp default (now() + interval '9 hours') not null
);

-- 獲得記録
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  acquired_at timestamp default (now() + interval '9 hours') not null,
  unique(user_id, badge_id)
);

-- 3. セキュリティ設定
alter table public.profiles disable row level security;
alter table public.badges disable row level security;
alter table public.user_badges disable row level security;

-- 権限の付与
grant all on public.profiles to anon, authenticated, service_role;
grant all on public.badges to anon, authenticated, service_role;
grant all on public.user_badges to anon, authenticated, service_role;

-- 4. 標本データの登録 (0-5 インデックス)
insert into public.badges (name, model_url, target_index)
values
  ('蝶', '/butterfly.glb', 0),
  ('クジラ', '/whale.glb', 1),
  ('ヤドカリ', '/shellcrab.glb', 2),
  ('剣', '/sword.glb', 3),
  ('波', '/wave.glb', 4),
  ('クラゲ', '/jellyfish.glb', 5);

-- 5. プロフィール自動作成トリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- トリガーの登録
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. last_seen 自動更新トリガー (日本時間)
create or replace function public.handle_update_last_seen()
returns trigger as $$
begin
  new.last_seen = now() + interval '9 hours';
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_update_last_seen on public.profiles;
create trigger tr_update_last_seen
  before update on public.profiles
  for each row execute procedure public.handle_update_last_seen();

-- 既存ユーザーの同期
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

