# ATD26_science-art

AR（拡張現実）技術を用いた標本収集・管理アプリケーション。実世界の画像認識を通じて3Dモデルを取得し、ユーザーごとの取得履歴を永続化します。

---

## 🛠 技術スタック

### Frontend / Core

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **AR Engine**: MindAR.js (Web-based Image Tracking), A-Frame

### Backend / Infrastructure

- **BaaS**: Supabase (PostgreSQL / Auth / Storage)
- **Cache**: Redis (Upstash) - 統計データの高速集計に使用
- **Data Validation**: Zod
- **Data Fetching**: SWR (Stale-While-Revalidate)

### Development / Quality

- **Linter/Formatter**: ESLint, Prettier
- **Testing**: Vitest
- **Commit**: Commitlint, Lefthook (Pre-commit hook)

> [!TIP]
> 本プロジェクトは Vercel や Supabase の無料枠を最大限活用し、低コストで運用できるよう最適化されています。詳細は [アーキテクチャ設計書](./docs/ARCHITECTURE.md#6-運用コストとスケーラビリティ) を参照してください。

---

## 📖 開発ドキュメント

詳細なシステム設計については、以下の各仕様書を参照してください。

- [🏛️ アーキテクチャ設計書](./docs/ARCHITECTURE.md)
  - 3層構造、レンダリング戦略、キャッシュフロー、技術選定根拠
- [🦋 標本レンダリング設定仕様書](./docs/SPECIMENS.md)
  - 標本ごとの 3D 設定、シーン別演出ロジック、追加手順
- [🔌 API・サービス仕様書](./docs/API.md)
  - 標準レスポンス、認証、エラーコード、冪等性設計
- [🗄️ データベース設計書](./docs/DATABASE.md)
  - テーブル定義、複合ユニーク制約、インデックス戦略、Redisキャッシュ詳細

---

## 📂 プロジェクト構成 (Monorepo)

本プロジェクトは `pnpm workspaces` を採用し、ロジック層を独立したパッケージとして管理しています。

```text
.
├── backend/         # @app/backend パッケージ (ビジネスロジック、型定義)
├── frontend/        # Next.js プロジェクト (UIページ、APIルート)
│   └── __tests__/   # テストコード (Vitest)
├── docs/            # 設計仕様書一式
├── AR_dataset/      # AR素材のマスターデータ
├── scripts/         # 開発支援スクリプト
└── pnpm-workspace.yaml
```

---

## 🚀 セットアップ

### 1. 依存関係のインストール

プロジェクトルートで実行してください。

```bash
pnpm install
```

### 2. 環境変数の設定

`frontend/.env.local` を作成し、必要な値を入力してください。
詳細は `frontend/.env.local.example` を参照してください。

```bash
cp frontend/.env.local.example frontend/.env.local
```

### 3. 開発サーバーの起動

ルートディレクトリで実行可能です。

```bash
pnpm dev
```

---

## ✅ 開発ガイドライン

- **ビルド確認**: コミット前に必ず `pnpm build` が通ることを確認してください。
- **型安全性**: `any` の使用は原則禁止です。`backend/types` のスキーマを使用してください。
- **ドキュメント更新**: 仕様変更を伴う場合は、必ず `docs/` 内の各仕様書も更新してください。

---

© 2026 ATD26_SCIENCE-ART Project.
