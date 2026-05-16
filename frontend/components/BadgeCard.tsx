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

interface BadgeCardProps {
  badge: Badge;
  isAcquired: boolean;
  onSaveScroll?: () => void;
}

/**
 * コンパクトに設計された確認ステップ付き標本カード
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
            <div className="text-center px-1">
              <h3
                className={`text-sm font-bold italic font-serif leading-tight ${locked ? "opacity-20" : "text-[#3e2f28]"}`}
              >
                {locked ? "???" : badge.name}
              </h3>
              {!locked && (
                <p className="text-[7px] font-mono text-[#3e2f28]/30 uppercase tracking-widest mt-0.5">
                  RECORDED
                </p>
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
