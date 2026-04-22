"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Lock,
  Box,
  Wind,
  Bug,
  Leaf,
  Feather,
  Flower2,
  CircleDot,
  LucideIcon,
  MapPin,
} from "lucide-react";
import { Badge } from "../backend/types";

// ターゲットインデックスに基づいたアイコンの割り当て
const IconList: LucideIcon[] = [Bug, Flower2, Leaf, Feather, CircleDot, MapPin];

interface BadgeCardProps {
  badge: Badge;
  isAcquired: boolean;
  onSaveScroll?: () => void;
}

export const BadgeCard = ({
  badge,
  isAcquired,
  onSaveScroll,
}: BadgeCardProps) => {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);

  // インデックスに基づいてアイコンを選択（なければ CircleDot）
  const Icon = IconList[badge.target_index] || CircleDot;
  const locked = !isAcquired;

  // IDから一意な回転角を生成（NaNにならないように安全な実装）
  const rotation = useMemo(() => {
    if (!isAcquired) return 0;
    // IDの文字列を数値に変換して決定論的に回転方向を決める
    const charCodeSum = badge.id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return charCodeSum % 2 === 0 ? 1.5 : -1.5;
  }, [badge.id, isAcquired]);

  const handleOpenViewer = () => {
    if (onSaveScroll) onSaveScroll();
    router.push(
      `/viewer?model=${encodeURIComponent(badge.model_url)}&name=${encodeURIComponent(badge.name)}`,
    );
  };

  const handleRelease = () => {
    if (onSaveScroll) onSaveScroll();
    router.push(
      `/release?model=${encodeURIComponent(badge.model_url)}&name=${encodeURIComponent(badge.name)}`,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={!locked ? { scale: 1.02, rotate: 0, zIndex: 50 } : {}}
      viewport={{ once: true }}
      className="relative flex justify-center w-full group"
      style={{ rotate: `${rotation}deg` }}
    >
      {/* 貼り付け用のマスキングテープ */}
      {!locked && (
        <>
          <div className="tape -top-5 left-1/2 -translate-x-1/2 opacity-80" />
          <div className="tape -bottom-4 right-0 w-12 rotate-[45deg] opacity-40 scale-75" />
        </>
      )}

      <div
        onClick={() => !locked && !showActions && setShowActions(true)}
        className={`
          relative w-full max-w-[300px] min-h-[340px] p-8 flex flex-col items-center justify-center text-center transition-all duration-500
          ${locked ? "border-2 border-dashed border-[#3e2f28]/10 bg-white/30 grayscale sepia opacity-40" : "bg-[#fffdf5] shadow-md border border-[#dcd4c0]"}
        `}
      >
        <AnimatePresence mode="wait">
          {locked ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 border border-dashed border-[#3e2f28]/20 rounded-full flex items-center justify-center text-[#3e2f28]/20">
                <Lock size={24} strokeWidth={1} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-40">
                Uncharted Area
              </p>
            </motion.div>
          ) : showActions ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full flex flex-col items-center text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 text-[7px] opacity-30 font-mono">
                REG: {badge.id.slice(0, 8)}
              </div>

              <div className="w-full border-b border-[#3e2f28]/20 pb-4 mb-6">
                <p className="font-mono text-[7px] font-bold text-black/40 uppercase tracking-[0.2em] mb-1">
                  Journal Entry
                </p>
                <h2 className="text-xl font-bold italic font-serif leading-none">
                  {badge.name}
                </h2>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-[6px] uppercase font-bold opacity-30">
                    Status
                  </label>
                  <p className="text-[8px] font-mono font-bold text-blue-600">
                    PRESERVED
                  </p>
                </div>
                <div>
                  <label className="block text-[6px] uppercase font-bold opacity-30">
                    Type
                  </label>
                  <p className="text-[8px] font-mono">DIGITAL_SPECIMEN</p>
                </div>
              </div>

              {/* Action Protocols */}
              <div className="w-full space-y-2 border-t border-dashed border-black/10 pt-6">
                <button
                  onClick={handleOpenViewer}
                  className="w-full py-2.5 bg-[#3e2f28] text-[#fdfaf2] flex items-center justify-center gap-2 hover:bg-[#5a463b] transition-colors cursor-pointer"
                >
                  <Box size={14} strokeWidth={1.5} />
                  <span className="font-data text-[8px] uppercase tracking-[0.1em] font-bold text-white">
                    Observe
                  </span>
                </button>

                <button
                  onClick={handleRelease}
                  className="w-full py-2.5 border border-[#3e2f28] text-[#3e2f28] flex items-center justify-center gap-2 hover:bg-[#3e2f28]/5 transition-colors cursor-pointer"
                >
                  <Wind size={14} strokeWidth={1.5} />
                  <span className="font-data text-[8px] uppercase tracking-[0.1em] font-bold">
                    Release
                  </span>
                </button>

                <button
                  onClick={() => setShowActions(false)}
                  className="w-full pt-4 text-[7px] font-mono uppercase tracking-widest text-black/30 hover:text-black transition-colors text-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sketch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full cursor-pointer"
            >
              {/* スケッチアイコン */}
              <div className="relative p-6">
                <Icon
                  size={80}
                  strokeWidth={0.5}
                  className="text-[#3e2f28]/80 drop-shadow-sm"
                />
                <div className="absolute inset-0 border border-[#3e2f28]/10 rounded-full scale-125 border-dashed" />
              </div>

              <div className="space-y-1 mt-4">
                <h3 className="text-xl font-bold italic text-[#3e2f28]/90 font-serif leading-tight">
                  {badge.name}
                </h3>
                <p className="font-data text-[8px] text-[#3e2f28]/40 uppercase tracking-tighter">
                  OBSERVED AT NODE_{badge.id.slice(0, 4)}
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 opacity-30">
                <span className="w-8 h-[1px] bg-current" />
                <span className="text-[7px] font-mono uppercase tracking-[0.2em]">
                  Open Entry
                </span>
                <span className="w-8 h-[1px] bg-current" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
