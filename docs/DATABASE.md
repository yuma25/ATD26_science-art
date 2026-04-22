# 🗄️ Database Design

本プロジェクトは **Supabase (PostgreSQL)** を使用して、標本データと冒険者の記録を永続化しています。

## 1. テーブル定義 (Table Definitions)

### `badges` (標本マスタ)

図鑑に登録される標本の基本データ。

| カラム名       | 型        | 説明                         |
| :------------- | :-------- | :--------------------------- |
| `id`           | uuid (PK) | 標本の固有ID                 |
| `name`         | text      | 標本名                       |
| `description`  | text      | 由来や特徴の解説             |
| `color`        | text      | UI表現用のカラーコード (Hex) |
| `model_url`    | text      | 3Dモデル（.glb）のパス       |
| `target_index` | int       | MindAR ターゲット番号        |

### `user_badges` (獲得記録)

冒険者が実際に発見した記録（スタンプ）。

| カラム名      | 型          | 説明                           |
| :------------ | :---------- | :----------------------------- |
| `id`          | uuid (PK)   | 獲得記録の固有ID               |
| `user_id`     | uuid        | 冒険者のID (Auth.users 参照)   |
| `badge_id`    | uuid        | 発見した標本のID (Badges 参照) |
| `acquired_at` | timestamptz | 獲得した日時 (JST)             |

---

## 2. セキュリティと権限 (Security & RLS)

Supabase の **Row Level Security (RLS)** を活用し、安全なデータアクセスを実現しています。

- **`badges`**:
  - `SELECT`: すべての認証済みユーザーに許可。
- **`user_badges`**:
  - `SELECT`: 自分の `user_id` に紐づく記録のみ閲覧可能。
  - `INSERT`: 自分の `user_id` としてのみ新規追加が可能。

---

## 3. インデックス (Performance)

検索パフォーマンス向上のため、以下のインデックスを設定しています：

- `user_badges (user_id)`: ユーザーごとの獲得状況を高速に取得。
- `badges (target_index)`: AR認識時のデータ照合を高速化。
