import { AppFooter } from "@/components/layout/AppFooter";

/**
 * 【メインレイアウト】
 * ホーム画面やその他の主要なページで共通して使用されるレイアウトです。
 * フッターなどの共通UIコンポーネントを配置します。
 */
export default function MainLayout({
  children,
}: {
  // 表示される各ページのコンテンツ
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 1. ページのメインコンテンツを表示します */}
      {children}

      {/* 2. 画面下部に共通のフッター（ナビゲーション）を配置します */}
      <AppFooter />
    </>
  );
}
