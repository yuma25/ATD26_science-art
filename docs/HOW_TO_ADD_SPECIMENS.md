# 🎨 新しい標本（絵画）の追加手順

このドキュメントでは、アプリに新しいAR標本（バッジ）を追加する際の具体的な手順を解説します。
**現在のシステムは「データ駆動型」に進化しているため、プログラムのコード修正は原則不要です。**

---

## 1. データベース (Supabase) への登録

1.  Supabase Dashboard の **Table Editor** で `badges` テーブルを開きます。
2.  **Insert row** をクリックし、以下の情報を入力して保存します：
    - **`id`**: 任意のユニークなID (例: `new-art-001`)
    - **`name`**: 標本の表示名 (例: `Golden Phoenix`)
    - **`description`**: 標本の解説文
    - **`color`**: UIで使用するテーマカラーのHexコード (例: `#ffd700`)
    - **`model_url`**: 3Dモデルファイルへのパス (例: `/phoenix.glb`)
    - **`target_index`**: MindARコンパイル時のインデックス番号 (0から始まる連番)

---

## 2. アセットファイルの準備

1.  **3Dモデル**: `.glb` 形式のモデルファイルを `public/` フォルダに配置します。
2.  **ターゲットデータ**:
    - [MindAR Compile Tool](https://hiukim.github.io/mind-ar-js-doc/tools/compile) を使用します。
    - 新しい絵画の画像を追加してコンパイルし、生成された `targets.mind` を `public/targets.mind` に上書き保存します。
    - **注意**: `target_index` は、このツールで画像を登録した順番（0, 1, 2...）と一致させてください。

---

## 3. アイコンの割り当て（任意）

新しい標本に固有のアイコン（鳥や葉っぱなど）を表示したい場合は、以下のファイルを修正します。
（未設定の場合は、デフォルトのドットアイコンが表示されます）

- **場所**: `components/BadgeCard.tsx`
- **修正箇所**: `IconMap` 定数

```tsx
const IconMap: Record<string, LucideIcon> = {
  'butterfly-001': Bug,
  'new-art-001': Bird, // ここにIDとアイコンを追加
  ...
};
```

---

## ✅ システムの自動拡張について

`hooks/useAR.ts` は、DBに登録された `badges` の数に合わせて自動的にAR認識ターゲットを生成します。そのため、DBに10個のデータがあれば、自動的に10個のターゲットを認識できる状態でARカメラが起動します。
