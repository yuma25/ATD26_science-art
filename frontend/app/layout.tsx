import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";

/**
 * 【ルートレイアウト】
 * アプリケーション全体の基盤となるレイアウトファイルです。
 * すべてのページで共通のメタデータ設定やフォント、CSSの読み込みを行います。
 */

/**
 * --- メタデータの設定 ---
 * ブラウザのタブに表示されるタイトルや、検索エンジン向けの情報を定義します。
 * PWA（Progressive Web App）としての設定もここに含まれます。
 */
export const metadata: Metadata = {
  title: "ATD26_SCIENCE-ART",
  description: "ARと3D標本のフィールドジャーナル",
  // iOSでのWebアプリ化（ホーム画面に追加）した際の設定
  appleWebApp: {
    capable: true,
    title: "ATD26",
    statusBarStyle: "default",
  },
};

/**
 * --- ビューポートの設定 ---
 * 画面の表示領域やズームの挙動を制御します。
 * モバイル端末で意図しないズームを防ぎ、ネイティブアプリに近い操作感を実現します。
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // ユーザーによるピンチズームを禁止（操作性向上のため）
  viewportFit: "cover", // ノッチなどの領域まで画面を広げる
};

/**
 * --- ルートレイアウトコンポーネント ---
 * HTMLの骨格を定義します。
 */
export default function RootLayout({
  children,
}: {
  // children は、このレイアウトの中に表示される各ページの内容です
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body className="antialiased">
        {/* Meshopt デコーダー: 圧縮された3Dモデルを解凍するために必要 */}
        <Script
          id="meshopt-decoder"
          src="https://unpkg.com/meshoptimizer@0.21.0/meshopt_decoder.js"
          strategy="beforeInteractive"
        />
        {/* model-viewer - 詳細表示用 */}
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
          strategy="afterInteractive"
        />
        {/* 1. 各ページの内容をここに流し込みます */}
        {children}
      </body>
    </html>
  );
}
