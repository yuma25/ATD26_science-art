# 🔌 API & Service Specifications

本アプリでは、フロントエンドとバックエンドの通信を `backend/services/badgeService.ts` に集約しています。

## 1. サービスメソッド (BadgeService)

### `getAllBadges()`

すべての標本（バッジ）のマスターデータを取得します。

- **Returns**: `Promise<Badge[]>`
- **Internal**: Supabase の `badges` テーブルから `target_index` 順に取得。

### `getAcquiredBadgeIds(userId)`

特定の冒険者が獲得済みの標本ID一覧を取得します。

- **Parameters**: `userId: string`
- **Returns**: `Promise<string[]>`
- **Internal**: `user_badges` テーブルを `user_id` でフィルタリング。

### `acquireBadge(userId, badgeId)`

新しい標本を発見したことを記録します。

- **Parameters**:
  - `userId: string`
  - `badgeId: string`
- **Returns**: `Promise<UserBadge | null>`
- **Internal**: `user_badges` テーブルへ新規行を挿入。

---

## 2. データ検証と信頼性

- **Zod Schema**: 取得したデータは `backend/types/index.ts` に定義された `BadgeSchema` により実行時に検証されます。
- **Error Handling**: 通信エラーやバリデーション失敗時は、`server/lib/logger` を通じて構造化ログが記録されます。
- **Prerendering Safety**: `useSearchParams` を含むページは、ビルド時のエラーを防ぐため `Suspense` 境界内で実行されます。
