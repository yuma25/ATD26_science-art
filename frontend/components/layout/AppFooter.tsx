"use client";

/**
 * モジュールのインポート
 * Next.jsのリンクコンポーネントを読み込みます。
 */
import Link from "next/link";

/**
 * AppFooterコンポーネント本体
 * ページ下部に表示される共通のフッターです。
 * コピーライト表記と、管理者向けのログイン画面（Archive Access）へのリンクを提供します。
 */
export const AppFooter = () => {
  return (
    <footer className="py-12 border-t border-[#3e2f28]/5 bg-black/[0.01] text-center select-none z-10">
      <div className="max-w-xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 opacity-40 hover:opacity-100 transition-opacity">
        {/* プロジェクトのコピーライト */}
        <p className="text-[12px] font-bold uppercase tracking-[0.2em]">
          ©ATD26_SCIENCE-ART
        </p>

        {/* 管理者ログイン（アーカイブアクセス）へのリンク */}
        <Link
          href="/admin/login"
          className="text-[10px] font-bold uppercase tracking-[0.2em] border border-[#3e2f28]/30 px-2 py-1 rounded hover:bg-[#3e2f28] hover:text-[#e8e2d2] transition-colors"
        >
          管理者ログイン
        </Link>
      </div>
    </footer>
  );
};
