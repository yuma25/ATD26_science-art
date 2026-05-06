-- ==========================================
-- 🎨 ATD26_SCIENCE-ART: データベース初期化 SQL
-- ==========================================
-- 構成: バッジ（絵画作品）、来場人数管理、ARマーカー連携

-- 1. 既存のテーブルを削除
drop table if exists public.user_badges;
drop table if exists public.badges;
drop table if exists public.profiles;

-- 2. テーブルの作成

-- プロフィール（来場者管理）
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  party_size int default null, -- 来場人数
  is_exchanged boolean default false, -- 景品交換済みフラグ
  created_at timestamp default (now() + interval '9 hours') not null,
  last_seen timestamp default (now() + interval '9 hours')
);

-- バッジ（絵画作品マスター）
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  model_url text not null, -- AR表示用の3Dモデルパス
  image_url text not null, -- 詳細表示用の2D画像パス
  target_index int not null, -- MindARのマーカー番号 (0-5)
  created_at timestamp default (now() + interval '9 hours') not null
);

-- ユーザー獲得記録
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  acquired_at timestamp default (now() + interval '9 hours') not null,
  unique(user_id, badge_id)
);

-- 3. セキュリティ設定（開発用の一時的な緩和）
alter table public.profiles disable row level security;
alter table public.badges disable row level security;
alter table public.user_badges disable row level security;

grant all on public.profiles to anon, authenticated, service_role;
grant all on public.badges to anon, authenticated, service_role;
grant all on public.user_badges to anon, authenticated, service_role;

-- 4. 作品データの投入（ダミー）
insert into public.badges (name, model_url, image_url, target_index)
values
  ('蝶', '/butterfly.glb', '/images/paintings/painting_0.jpg', 0),
  ('クジラ', '/whale.glb', '/images/paintings/painting_1.jpg', 1),
  ('ヤドカリ', '/shellcrab.glb', '/images/paintings/painting_2.jpg', 2),
  ('剣', '/sword.glb', '/images/paintings/painting_3.jpg', 3),
  ('波', '/wave.glb', '/images/paintings/painting_4.jpg', 4),
  ('クラゲ', '/jellyfish.glb', '/images/paintings/painting_5.jpg', 5);

-- 5. 新規ユーザー作成時の自動プロファイル作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. アクティビティ更新（JST）
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

-- 既存ユーザーのプロファイル作成（もしあれば）
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
