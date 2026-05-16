# ATD26_SCIENCE-ART

AR（拡張現実）技術を用いた絵画コレクション・管理アプリケーション。実世界の画像認識を通じて3D作品を発見し、獲得した作品のデジタル図録（2D画像）をユーザーごとに永続化します。

---

## 🛠 技術スタック

### Frontend / Core

- **Framework**: Next.js 16 (App Router / Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **AR Engine**: MindAR.js (Web-based Image Tracking), A-Frame
- **Data Fetching**: SWR (Stale-While-Revalidate) - 画面遷移時の高速表示とキャッシュ管理を実現

### Backend / Infrastructure

- **BaaS**: Supabase (PostgreSQL / Auth / Storage)
- **Cache**: Redis (Upstash) - 統計データの高速集計、レートリミットに使用
- **Data Validation**: Zod

### Development / Quality

- **Linter/Formatter**: ESLint, Prettier
- **Testing**: Vitest
- **Commit**: Commitlint, Lefthook (Pre-commit hook)

> [!TIP]
> 本プロジェクトは Vercel や Supabase の無料枠を最大限活用し、低コストで運用できるよう最適化されています（Next.js の `standalone` モード出力、SWR による多層キャッシュ等）。詳細は [アーキテクチャ設計書](./docs/ARCHITECTURE.md#6-運用コストとスケーラビリティ) を参照してください。

---

## 📖 開発ドキュメント

詳細なシステム設計については、以下の各仕様書を参照してください。

- [🏛️ アーキテクチャ設計書](./docs/ARCHITECTURE.md)
  - 3層構造、レンダリング戦略、キャッシュフロー、技術選定根拠
- [🦋 作品レンダリング設定仕様書](./docs/SPECIMENS.md)
  - 作品ごとの 3D 設定、シーン別演出ロジック、追加手順
- [🔌 API・サービス仕様書](./docs/API.md)
  - 標準レスポンス、認証、エラーコード、冪等性設計
- [🗄️ データベース設計書](./docs/DATABASE.md)
  - テーブル定義、複合ユニーク制約、インデックス戦略、Redisキャッシュ詳細
- [⚖️ ライセンス・法的事項](./THIRD_PARTY_LICENSES.md)
  - 使用ライブラリの帰属表示、プライバシーポリシー、利用規約

---

## ⚖️ ライセンスと法的事項

本プロジェクトはプロフェッショナルな標準に基づき、以下の法的ドキュメントを整備しています。

- **[MIT License](./LICENSE)**: プロジェクト本体のライセンス。
- **[サードパーティ通知](./THIRD_PARTY_LICENSES.md)**: MindAR.js (TensorFlow.js, OpenCV.js 含む)、Next.js 等の主要ライブラリの帰属表示。
- **[プライバシーポリシー](./docs/LEGAL/PRIVACY_POLICY.md)**: ARカメラ利用（映像はデバイス内処理のみ）、データ収集に関するポリシー。
- **[利用規約](./docs/LEGAL/TERMS_OF_SERVICE.md)**: 知的財産権の保護、AR利用時の安全上の免責事項。

---

## 📂 プロジェクト構成 (Monorepo)

本プロジェクトは `pnpm workspaces` を採用したモノレポ構成となっており、フロントエンドとバックエンド（ビジネスロジック・型定義）を物理的に分離して管理しています。

```text
.
├── backend/            # @app/backend パッケージ
│   ├── lib/            # ビジネスロジック、ユーティリティ
│   │   └── specimens/  # 作品ごとの 3D 設定 (座標、アニメーション、ライティング)
│   ├── services/       # 外部サービス (Supabase, Redis) との連携ロジック
│   └── types/          # アプリ全体で共有される Zod スキーマおよび型定義
├── frontend/           # Next.js 16 プロジェクト
│   ├── app/            # App Router (AR画面、ビューワー、管理画面、APIルート)
│   ├── components/     # React コンポーネント (UIパーツ、AR制御、手記UI)
│   ├── hooks/          # カスタムフック (SWR, 状態管理, カメラ制御)
│   ├── public/         # 静的アセット (3Dモデル .glb, マーカーデータ .mind, 画像)
│   └── __tests__/      # 単体・統合テストコード (Vitest)
├── docs/               # プロジェクトドキュメント
│   ├── LEGAL/          # プライバシーポリシー、利用規約
│   └── (その他)         # 各種設計仕様書
├── AR_dataset/         # AR マーカー作成用の元データ (管理用)
└── pnpm-workspace.yaml # モノレポ設定
```

---

## 🚀 セットアップ

### 1. プロジェクトの初期化

依存関係をインストールします。

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
