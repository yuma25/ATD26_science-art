# 📑 AI Development Log (ATD26)

プロジェクトの進化と決定事項を記録します。

---
## 🚩 現在の進捗状況

### コア・インフラ・状態
- [x] プロジェクト構成: monorepo / Next.js 16 / backend パッケージ
- [x] AI 開発ログ・指示ファイルの整備
- [x] AR 認証ロジックの整備 (MindAR / A-Frame)
- [x] Supabase 連携 (匿名ログイン、プロフィール自動作成、獲得記録)
- [x] UI/UX の整備: ホーム、ジャーナル、詳細ビューワー、AR画面の統一
- [x] ロジックの整備 (Start / Goal の進捗計算、獲得済みチェック)
- [x] 標本別設定 (Specimens) の物理的分離と動的読み込み
- [x] 開発・品質管理: CI/CD (GitHub Actions)、lefthook、vitest
- [x] データベース構成の整理: `description`, `color` カラムの削除
- [x] 標本名の日本語化: データベース `name` カラムへの日本語名（蝶、クジラ等）の統合
- [x] バグ修正: `BadgeService.acquireBadge` のクライアントサイド呼び出し対応
- [x] **データベースのJST統一**: 格納時間をすべて日本時間（JST）に統一

## 💡 技術的なハイライト
- **データベースのJST統一**: DB側で `now() + interval '9 hours'` をデフォルト値やトリガーで使用することで、TypeScript側でのUTC計算を排除し、管理画面での視認性とロジックの単純化を実現。
- **環境抽象化**: `BadgeService` によりサーバー/クライアントを意識せずにデータアクセスが可能。

### 2026-05-05
- **データベースの時間格納をJSTに統一**:
  - `reset_database.sql`: `last_seen` 自動更新トリガーの追加とデフォルト値のJST化。
  - `badgeService.ts` / `profile/sync/route.ts`: TypeScript側からの `new Date().toISOString()` 送信を削除。
  - `stats/route.ts`: DBから取得したJST文字列を解析するための `parseJST` ヘルパー導入。
  - `logger.ts`: システムログのタイムスタンプをJST（+09:00付記）に変更。
  - `docs/DATABASE.md`: タイムスタンプの扱いに関する記述を更新。
- **データベースとドキュメントの整合性更新**:
  - `badges` テーブルから不要なカラムを削除し、標本名を日本語で統一。
  - 翻訳レイヤーを廃止し、DBの値を直接表示する構造に変更。

### 2026-05-06
- **ドキュメントの監査と品質向上**: ARCHITECTURE.md, DATABASE.md, README.md の整合性を確認し、品質を向上。
- **運用コスト分析の明文化**: Vercel無料枠内での運用可能性を技術的に検証し、ARCHITECTURE.md に「運用コストとスケーラビリティ」セクションとして追加。
- **アセットの点検とAPI仕様の詳細化**: 3Dモデルのファイルサイズを点検し、API.md にキャッシュ戦略とリクエスト例を追記。SPECIMENS.md にモデル最適化の指針を追加。
