"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Lock,
  Box,
  Bug,
  CircleDot,
  LucideIcon,
  MapPin,
  Waves,
  Sword,
  Shell,
  X,
} from "lucide-react";
import { Badge } from "@backend/types";

/**
 * アイコンリスト
 */
const IconList: LucideIcon[] = [Bug, MapPin, Shell, Sword, Waves, CircleDot];

/**
 * BadgeCardコンポーネントのプロパティ
 * @interface BadgeCardProps
 * @property {Badge} badge - 表示対象の標本データ
 * @property {boolean} isAcquired - ユーザーがこの標本を獲得済みかどうか
 * @property {() => void} [onSaveScroll] - 詳細画面に遷移する前に現在のスクロール位置を保存するための関数
 */
interface BadgeCardProps {
  badge: Badge;
  isAcquired: boolean;
  onSaveScroll?: () => void;
}

/**
 * 【標本カード】
 * 図鑑（ホーム画面）で各標本の状態を表示するカードコンポーネントです。
 * 未獲得の場合はロック表示となり、獲得済みの場合は詳細ビューアーへのリンクが有効になります。
 * 誤操作防止のため、クリック時に「観察開始」の確認ステップを設けています。
 *
 * @param {BadgeCardProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 標本カードのUI
 */
export const BadgeCard = ({
  badge,
  isAcquired,
  onSaveScroll,
}: BadgeCardProps) => {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const Icon = IconList[badge.target_index] || CircleDot;
  const locked = !isAcquired;

  const handleOpenViewer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (locked) return;
    if (onSaveScroll) onSaveScroll();
    router.push(
      `/viewer?image=${encodeURIComponent(badge.image_url)}&name=${encodeURIComponent(badge.name)}&artist=${encodeURIComponent(badge.artist || "")}`,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full flex justify-center"
    >
      <div
        onClick={() => !locked && setShowConfirm(true)}
        className={`
          relative w-full max-w-[180px] min-h-[220px] p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 overflow-hidden
          ${
            locked
              ? "border border-dashed border-[#3e2f28]/10 bg-black/5 opacity-40"
              : "bg-white shadow-sm border border-[#3e2f28]/5 cursor-pointer hover:shadow-md"
          }
        `}
      >
        {/* 表面のコンテンツ：確認画面が表示されていない時のみ表示 */}
        {!showConfirm && (
          <>
            {/* アイコンエリア */}
            <div className={`p-3 rounded-full ${locked ? "" : "bg-[#fdfaf2]"}`}>
              {locked ? (
                <Lock size={20} className="text-[#3e2f28]/20" strokeWidth={1} />
              ) : (
                <Icon size={32} className="text-[#3e2f28]/80" strokeWidth={1} />
              )}
            </div>

            {/* テキストエリア */}
            <div className="text-center px-1 w-full overflow-hidden">
              <h3
                className={`font-bold italic font-serif leading-tight whitespace-nowrap ${
                  locked ? "opacity-20" : "text-[#3e2f28]"
                } ${
                  (locked ? 3 : badge.name.length) > 10
                    ? "text-[10px]"
                    : "text-sm"
                }`}
              >
                {locked ? "???" : badge.name}
              </h3>
              {!locked && (
                <>
                  {badge.artist && (
                    <p
                      className={`font-bold text-[#3e2f28]/60 mt-0.5 whitespace-nowrap ${
                        badge.artist.length > 10 ? "text-[8px]" : "text-[9px]"
                      }`}
                    >
                      {badge.artist}
                    </p>
                  )}
                  <p className="text-[7px] font-mono text-[#3e2f28]/30 uppercase tracking-widest mt-1">
                    RECORDED
                  </p>
                </>
              )}
            </div>

            {/* 下部の装飾（未選択時） */}
            {!locked && (
              <div className="flex items-center gap-1 text-[6px] font-bold text-[#3e2f28]/10 uppercase mt-1">
                <span>View Details</span>
              </div>
            )}
          </>
        )}

        {/* --- 確認用オーバーレイ (インライン) --- */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#3e2f28] z-50 p-4 flex flex-col items-center justify-center text-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowConfirm(false)}
                className="absolute top-1 right-1 p-1.5 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>

              <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.1em]">
                Open Archive?
              </p>

              <button
                onClick={handleOpenViewer}
                className="w-full py-2 bg-white text-[#3e2f28] flex items-center justify-center gap-1.5 hover:bg-[#e8e2d2] transition-colors shadow-lg"
              >
                <Box size={12} strokeWidth={1.5} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  観察開始
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
