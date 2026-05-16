# 🗄️ データベース構築ガイド (SQL)

本ドキュメントは、アプリケーションの動作に必要な Supabase (PostgreSQL) のテーブル構造と初期データを定義する最新の SQL コードです。

---

## 1. テーブル定義と初期化

以下の SQL を Supabase の SQL Editor で実行することで、データベースを構築できます。タイムスタンプはすべて日本時間 (JST) で統一されています。

```sql
-- ==========================================
-- 🎨 ATD26_SCIENCE-ART: データベース初期化 SQL
-- ==========================================

-- 1. 既存のテーブルを削除（リセット用）
drop table if exists public.user_badges;
drop table if exists public.badges;
drop table if exists public.profiles;

-- 2. プロフィール（来場者管理）
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  party_size int default null, -- 来場人数
  is_exchanged boolean default false, -- 景品交換済みフラグ
  created_at timestamp default (now() + interval '9 hours') not null,
  last_seen timestamp default (now() + interval '9 hours')
);

-- 3. 作品マスター（バッジ）
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  artist text, -- 作者名を追加
  model_url text not null, -- AR表示用の3Dモデルパス
  image_url text not null, -- 詳細表示用の2D画像パス
  target_index int not null, -- MindARのマーカー番号 (0-5)
  created_at timestamp default (now() + interval '9 hours') not null
);

-- 4. ユーザー獲得記録
create table public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  acquired_at timestamp default (now() + interval '9 hours') not null,
  unique(user_id, badge_id)
);

-- 5. セキュリティ設定（RLSの無効化：開発時のみ）
alter table public.profiles disable row level security;
alter table public.badges disable row level security;
alter table public.user_badges disable row level security;

grant all on public.profiles to anon, authenticated, service_role;
grant all on public.badges to anon, authenticated, service_role;
grant all on public.user_badges to anon, authenticated, service_role;

-- 6. 初期データの投入
insert into public.badges (name, artist, model_url, image_url, target_index)
values
  ('sample', 'sample', '/butterfly.glb', '/images/paintings/painting_0.jpg', 0),
  ('お母さんの初水族館', '川越あけみ', '/whale.glb', '/images/paintings/painting_1.jpg', 1),
  ('ヤドカリ', '高山那月', '/shellcrab.glb', '/images/paintings/painting_2.jpg', 2),
  ('海底の置く', '可部谷清楓', '/sword.glb', '/images/paintings/painting_3.jpg', 3),
  ('よすが', '中西玲奈', '/wave.glb', '/images/paintings/painting_4.jpg', 4),
  ('遊々海月', '石垣実莉', '/jellyfish.glb', '/images/paintings/painting_5.jpg', 5);

-- 7. 自動プロファイル作成トリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. アクティビティ自動更新トリガー
create or replace function public.handle_update_last_seen()
returns trigger as $$
begin
  new.last_seen = now() + interval '9 hours';
  return new;
end;
$$ language plpgsql;
create trigger tr_update_last_seen
  before update on public.profiles
  for each row execute procedure public.handle_update_last_seen();

-- 9. インデックスの追加（検索の高速化とCPU負荷軽減）
create index idx_badges_target_index on public.badges(target_index);
create index idx_user_badges_user_id on public.user_badges(user_id);

```

---

## 2. SQLの役割解説

- **JST統一**: `now() + interval '9 hours'` を使用することで、データベースレベルで日本時間に変換して格納しています。
- **カスケード削除**: ユーザーが削除された際、紐付くプロフィールや獲得履歴も自動的に削除されます。
- **複合ユニーク制約**: 同一ユーザーによる同一作品の重複獲得をデータベースレベルで防止しています。
