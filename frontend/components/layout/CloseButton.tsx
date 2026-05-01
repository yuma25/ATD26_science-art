"use client";

/**
 * モジュールのインポート
 */
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * CloseButtonProps の説明：
 * @param onClick - ボタンが押されたときに実行する独自の関数。指定しない場合は「前のページに戻る」動作になります。
 * @param className - ボタンのスタイルを外部から調整するための追加クラス名
 */
interface CloseButtonProps {
  onClick?: () => void;
  className?: string;
}

/**
 * CloseButtonコンポーネント本体
 * 画面の右上に固定表示される「×」ボタンです。
 * AR画面や3Dビューワーなどを閉じるために使用されます。
 */
export const CloseButton = ({ onClick, className = "" }: CloseButtonProps) => {
  const router = useRouter();

  /**
   * ハンドラー関数：ボタンクリック時の動作を決定します。
   */
  const handleClose = () => {
    // 独自の処理が渡されている場合はそれを実行し、
    // そうでない場合はブラウザの履歴を一つ戻します。
    if (onClick) {
      onClick();
      return;
    }

    router.back();
  };

  return (
    <button
      onClick={handleClose}
      className={`fixed top-6 right-6 z-[200] w-12 h-12 flex items-center justify-center bg-[#e8e2d2]/80 backdrop-blur-md border border-[#3e2f28]/10 rounded-full text-[#3e2f28]/60 hover:text-[#3e2f28] hover:bg-[#e8e2d2] transition-all shadow-sm active:scale-90 ${className}`}
      aria-label="閉じる"
    >
      {/* Lucide의「X」アイコンを表示 */}
      <X size={24} strokeWidth={1.5} />
    </button>
  );
};
