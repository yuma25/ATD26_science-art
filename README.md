# 🦋 ATD26_SCIENCE-ART

**Immersive AR Specimen Collection & Journaling Experience**

「ATD26_SCIENCE-ART」は、AR（拡張現実）技術と「冒険者の手記」という世界観を融合させた、没入型の標本収集システムです。

---

## 🛠 開発の前提条件 (Prerequisites)

本プロジェクトの開発には、以下のツールがインストールされている必要があります。

- **Node.js**: `v22.14.0` 以上を推奨 (Next.js 16 / Turbopack 動作環境)
- **pnpm**: `v10.3.0` 以上 (高速なパッケージ管理と依存関係の厳格な制御のため)
- **Supabase CLI**: (任意) データベースの型生成やローカル開発を行う場合に必要
- **カメラデバイス**: AR機能のテストには、カメラ付きのモバイル端末またはPCが必要です。

---

## 🏛 アーキテクチャと設計 (Technical Deep Dive)

本プロジェクトは、保守性と拡張性を最大化するため、**「Separation of Concerns（関心の分離）」**を徹底しています。詳細は各ドキュメントを参照してください。

### 1. 全体構成 ([`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md))

Next.js 16 (App Router) を中心とし、`hooks` レイヤーで AR エンジンの状態管理を、`backend/services` レイヤーでデータ通信をカプセル化しています。

### 2. データ設計 ([`docs/DATABASE.md`](docs/DATABASE.md))

Supabase (PostgreSQL) を採用。データの増減に対してアプリが自動で追従する**「データ駆動型（Data Driven）」**の設計となっており、DBを更新するだけでロードマップが動的に構成されます。

### 3. API & 検証 ([`docs/API.md`](docs/API.md))

フロントエンドとバックエンドの通信には `BadgeService` を使用。

- **Zod**: 実行時のスキーマ検証により、不正なデータの混入を防止。
- **Unit Testing**: `Vitest` により、進捗計算などの核心ロジックの正しさを数学的に保証しています。

---

## 🚀 開発コマンド (Command Reference)

### プロジェクトの開始

```bash
pnpm install    # 依存関係のインストール
pnpm run dev    # 開発サーバー起動 (Turbopack 有効)
```

### 品質管理 (Quality Control)

本プロジェクトでは **Lefthook** を導入しており、コミット時に以下のチェックが自動で走ります。

| コマンド          | 内容                                                                       |
| :---------------- | :------------------------------------------------------------------------- |
| `pnpm run lint`   | ESLint による静的解析 (型チェック込)                                       |
| `pnpm run format` | Prettier による自動整形                                                    |
| `pnpm run test`   | **新規**: Vitest による単体テストの実行                                    |
| `pnpm run fix`    | Lintエラーの自動修正と整形を一括実行                                       |
| `pnpm run build`  | 本番ビルド検証。**ビルドおよびテストが通らないコードはコミットできません** |

---

## 📂 フォルダ構成の技術的意図

- **`app/`**: ルーティングと各ページの View を担当。AR、Viewer、Release の各モードを独立させています。
- **`backend/`**: Supabase への依存をここに閉じ込め、UI コンポーネントが直接 DB を意識しないようにしています。
- **`components/`**: 再利用可能な UI 部品。`BadgeCard` は獲得状況に応じた複雑なアニメーション（Framer Motion）をカプセル化しています。
- **`hooks/`**: `useAR` や `useHome` など、このアプリの「脳」となるステートフルなロジックを抽出しています。
- **`types/`**: グローバルな型定義（`model-viewer` 等）を管理し、TypeScript の補完を最大限に引き出します。

---

## 📝 開発の注意点

1. **PowerShell**: Windows環境では `&&` 連結が使えないため、コマンドは個別に実行してください。
2. **any の禁止**: 堅牢なビルドのため、`any` を使わず適切なインターフェースを定義してください。
3. **世界観**: デザイン変更時は `globals.css` の「Field Journal」の設計原則を遵守してください。
