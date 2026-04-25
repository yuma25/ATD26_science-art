-- ==========================================
-- 🚀 ATD26_SCIENCE-ART: 真・完全版データベース初期化 SQL
-- ==========================================
-- 内容: テーブルリセット, party_size追加, 1-5インデックス同期, 自動トリガー設定
-- 重複データ（The Ancient Archive）を削除したクリーン版

-- 1. テーブルのリセット（依存関係順に削除）
drop table if exists public.user_badges;
drop table if exists public.badges;
drop table if exists public.profiles;

-- 2. テーブルの作成（日本時間デフォルト設定）

-- プロフィール（利用人数 party_size を含む）
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  party_size int default null, -- 利用人数
  created_at timestamp with time zone default (now() + interval '9 hours') not null,
  last_seen timestamp with time zone default (now() + interval '9 hours')
);

-- 標本マスタ
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  color text,
  model_url text not null,
  target_index int not null, -- MindARのインデックス (1-5)
  created_at timestamp with time zone default (now() + interval '9 hours') not null
);

-- 獲得記録
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  acquired_at timestamp with time zone default (now() + interval '9 hours') not null,
  unique(user_id, badge_id)
);

-- 3. セキュリティ制限の完全解除（全ユーザー開放）
alter table public.profiles disable row level security;
alter table public.badges disable row level security;
alter table public.user_badges disable row level security;

-- 全ての権限を公開（匿名ユーザーを含む）
grant all on public.profiles to anon, authenticated, service_role;
grant all on public.badges to anon, authenticated, service_role;
grant all on public.user_badges to anon, authenticated, service_role;

-- 4. 標本実データの登録（最新の1-5マッピング）
-- 💡 5つの標本のみを登録
insert into public.badges (name, description, color, model_url, target_index)
values 
  ('Common Blue', 'A delicate butterfly with iridescent wings.', '#3e2f28', '/butterfly.glb', 1),
  ('Leviathan', 'A massive creature from the deep ocean.', '#2563eb', '/whale.glb', 2),
  ('Moon Jelly', 'A translucent dweller of the coral reefs.', '#10b981', '/jellyfish.glb', 3),
  ('Antique Sword', 'A relic from a forgotten era.', '#f59e0b', '/sword.glb', 4),
  ('Great Wave', 'The power of the ocean captured in form.', '#ef4444', '/wave.glb', 5);

-- 5. 自動プロフィール作成トリガーの設定
-- ユーザー作成時にプロフィールを自動生成する関数
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- トリガーを auth.users に紐付け
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 既存ユーザーの同期
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
