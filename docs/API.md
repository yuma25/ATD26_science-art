# APIおよびサービス仕様書

### システムの相互運用性とセキュリティ設計

本アプリケーションは、API レイヤーを介して高度なセキュリティ制御、データのバリデーション、およびトラフィック管理を実装しています。

---

## 1. 共通レスポンス形式 (Standard Response)

全ての API は一貫した JSON 構造を返します。これにより、フロントエンドでのエラー処理を統一できます。

### ✅ 成功時 (Success: 200 OK)

```json
{
  "success": true,
  "data": { ... } // 取得または更新されたオブジェクト
}
```

### ❌ 失敗時 (Failure: 4xx / 5xx)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE", // 文字列定数 (例: INVALID_REQUEST)
    "message": "ユーザー向けメッセージ",
    "details": { ... } // (任意) バリデーションエラーの詳細など
  }
}
```

---

## 2. 認証と認可 (Authentication & Authorization)

### 認証方式

- **Supabase Auth (匿名認証)**: ユーザー登録不要で一意の ID を発行。
- **JWT (JSON Web Token)**: リクエストヘッダー `Authorization: Bearer <token>` を介して正当性を検証。

### 認可

- **RLS (Row Level Security)**: データベースレベルで自分自身のデータのみ操作可能に制限。
- **Service Role**: 管理者用 API ルートでは `supabaseAdmin` を使用し、安全に全データの集計を実施。

---

## 3. セキュリティとトラフィック制御

### レートリミティング

- **API レベル**: Upstash Redis を使用したスライディングウィンドウ方式のレートリミットを推奨（将来的な拡張予定）。
- **CORS**: 同一オリジンからのリクエストのみを許可。

### キャッシュ戦略 (Cache-Control)

- **静的マスターデータ (`/api/v1/badges`)**: `s-maxage=3600, stale-while-revalidate` を設定し、エッジキャッシュを有効化。
- **動的データ (`/api/v1/admin/stats`)**: Redis によるサーバーサイドキャッシュ（5分）に加え、ブラウザ側での短期キャッシュを許容。

### セッション管理

- 認証セッションは Cookie に安全に保存され、CSRF 対策（SameSite=Lax）が施されています。

---

## 4. 主要エンドポイント (API Endpoints)

### `GET /api/v1/badges`

- すべてのバッジのマスターリストを取得。

### `POST /api/v1/badges/acquire`

- 新しいバッジの獲得を記録。
- **リクエストボディ**:
  ```json
  {
    "badge_id": "uuid-string"
  }
  ```
- **レスポンス (200 OK)**:
  - 新規獲得時: `{ "success": true, "data": { "acquired": true } }`
  - 獲得済み時: `{ "success": true, "data": { "acquired": false, "message": "ALREADY_ACQUIRED" } }`
- **冪等性**: 重複リクエスト時はエラーを返さず、獲得済みフラグと共に成功を返却します。

### `GET /api/v1/admin/stats`

- 管理者用統計データを取得（Redis キャッシュ適用済み）。

---

## 5. エラーコード一覧

| コード             | HTTP ステータス | 定義                 |
| :----------------- | :-------------- | :------------------- |
| `INVALID_REQUEST`  | 400             | バリデーション失敗。 |
| `UNAUTHORIZED`     | 401             | 認証エラー。         |
| `FORBIDDEN`        | 403             | 権限不足。           |
| `ALREADY_ACQUIRED` | 200 (Success)   | 既に獲得済み。       |
| `SERVER_ERROR`     | 500             | 内部エラー。         |
