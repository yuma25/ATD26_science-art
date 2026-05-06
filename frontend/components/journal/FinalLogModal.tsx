"use client";

/**
 * モジュールのインポート
 */
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { Badge } from "@backend/types";

/**
 * FinalLogModalProps の説明：
 * @param show - モーダルを表示するかどうかのフラグ
 * @param onClose - モーダルを閉じるための関数
 * @param completionTime - 全標本を発見した日時（フォーマット済み文字列）
 * @param fullUserId - ユーザーのUUID（記念証に刻印するため）
 * @param badges - 発見した全標本のリスト
 */
interface FinalLogModalProps {
  show: boolean;
  onClose: () => void;
  completionTime: string;
  fullUserId: string;
  badges: Badge[];
}

/**
 * FinalLogModalコンポーネント本体
 * 全ての標本をコンプリートした際に表示される「達成記念証」です。
 * 紙の証明書のようなデザインを意識しています。
 */
export const FinalLogModal = ({
  show,
  onClose,
  completionTime,
  fullUserId,
  badges,
}: FinalLogModalProps) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-12">
          {/* 背景のオーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1a1512]/95 backdrop-blur-md no-print"
          />

          {/* 記念証本体（1行に凝縮したデザイン） */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="relative w-full max-w-2xl bg-[#fdfaf2] border-[2px] border-[#3e2f28] shadow-[20px_20px_0_rgba(0,0,0,0.4)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 装飾用の端切れ演出 */}
            <div className="absolute top-0 left-0 w-2 h-full bg-[#3e2f28]/10 border-r border-[#3e2f28]/5" />

            <div className="p-4 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10">
              {/* 1. タイトルとアイコン（左側 / モバイルでは上） */}
              <div className="flex items-center gap-4 border-b sm:border-b-0 sm:border-r border-[#3e2f28]/10 pb-4 sm:pb-0 sm:pr-8">
                <div className="w-12 h-12 bg-[#3e2f28] text-[#fdfaf2] rounded-full flex items-center justify-center flex-shrink-0">
                  <Award size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tighter text-[#3e2f28]">
                    FINAL LOG.
                  </h2>
                  <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#3e2f28]/40">
                    Complete Archive
                  </p>
                </div>
              </div>

              {/* 2. ログ詳細（中央 / 1行に情報を集約） */}
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-12 text-center sm:text-left">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-[#3e2f28]/30">
                    Timestamp
                  </p>
                  <p className="font-mono text-[10px] font-black text-[#3e2f28]">
                    {completionTime}
                  </p>
                </div>

                <div className="space-y-0.5 max-w-[150px] overflow-hidden">
                  <p className="text-[9px] font-black uppercase text-[#3e2f28]/30">
                    Explorer ID
                  </p>
                  <p className="font-mono text-[8px] font-bold text-[#3e2f28] truncate">
                    {fullUserId}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex gap-1">
                    {badges.map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-amber-400"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. 閉じる（右側 / モバイルでは下） */}
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-3 bg-[#3e2f28] text-[#fdfaf2] text-[9px] font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg active:scale-95"
              >
                Close
              </button>
            </div>

            {/* 下部の透かし装飾 */}
            <div className="absolute bottom-0 right-0 opacity-[0.03] pointer-events-none -mb-4 -mr-4">
              <Award size={120} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
