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
- **Data Validation**: Zod
- **Data Fetching**: SWR (Stale-While-Revalidate)

### Development / Quality

- **Linter/Formatter**: ESLint, Prettier
- **Testing**: Vitest
- **Commit**: Commitlint, Lefthook

---

## 📖 開発ドキュメント

詳細なシステム設計については、以下の各仕様書を参照してください。

- [🏛️ アーキテクチャ設計書](./docs/ARCHITECTURE.md)
  - システム構成、レイヤー責務、技術的選定根拠
- [🔌 API・サービス仕様書](./docs/API.md)
  - エンドポイント定義、レスポンス形式、エラーハンドリング、冪等性設計
- [🗄️ データベース設計書](./docs/DATABASE.md)
  - テーブル定義、リレーション、インデックス戦略、整合性制約

---

## 📂 プロジェクト構成 (Monorepo)

本プロジェクトは `pnpm workspaces` を用いたモノレポ構成を採用しており、フロントエンドとバックエンドの責務を物理的に分離しています。

```text
.
├── backend/         # @app/backend パッケージ (ビジネスロジック、型定義、共通ライブラリ)
├── frontend/        # Next.js プロジェクト (UIページ、APIルート)
├── docs/            # 設計仕様書 (ARCHITECTURE, API, DATABASE)
├── AR_dataset/      # AR素材のマスターデータ
├── scripts/         # 開発支援スクリプト
└── pnpm-workspace.yaml
```

---

## 🚀 セットアップ

### 1. 依存関係のインストール

プロジェクトルートで実行してください。ワークスペース全体の依存関係がインストールされます。

```bash
pnpm install
```

### 2. 環境変数の設定

`frontend/` ディレクトリ内に `.env.local` を作成してください。

```bash
cp .env.local.example frontend/.env.local
```

### 3. 開発サーバーの起動

```bash
pnpm --filter frontend dev
```

---

## ✅ 開発ガイドライン

- **ビルド確認**: コミット前に必ず `pnpm run build` が通ることを確認してください。
- **型安全性**: `any` の使用を避け、`backend/types` で定義されたスキーマを優先してください。
- **コミットメッセージ**: Conventional Commits に準拠してください。

---

© 2026 ATD26_SCIENCE-ART Project.
