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
    console.log("👆 CloseButton clicked");
    // 独自の処理が渡されている場合はそれを実行
    if (onClick) {
      onClick();
      return;
    }

    // 履歴がある場合は戻り、そうでない場合はホームへ強制移動
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      onClick={handleClose}
      type="button"
      className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] w-12 h-12 flex items-center justify-center bg-[#e8e2d2] border-2 border-[#3e2f28]/30 rounded-full text-[#3e2f28] shadow-2xl active:scale-90 pointer-events-auto touch-manipulation cursor-pointer ${className}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label="閉じる"
    >
      {/* Lucide의「X」アイコンを表示 */}
      <X size={26} strokeWidth={2.5} />
    </button>
  );
};
