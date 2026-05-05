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
      {/* 
        show が false の場合は AnimatePresence によって
        フェードアウトアニメーションを伴って消えます。
      */}
      {show && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-12">
          {/* 背景のオーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#3e2f28]/90 backdrop-blur-xl no-print"
          />

          {/* 記念証本体（カード部分） */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-lg bg-[#fdfaf2] p-10 sm:p-16 border-[2px] border-[#3e2f28] shadow-[30px_30px_0_rgba(0,0,0,0.2)] text-center my-auto"
            onClick={(e) => e.stopPropagation()} // カード部分のクリックで閉じないようにする
          >
            <div className="relative z-10 space-y-12">
              {/* ヘッダーエリア：勲章アイコンとタイトル */}
              <div className="border-b-2 border-[#3e2f28] pb-10">
                <Award
                  size={64}
                  className="mx-auto text-[#3e2f28] mb-6"
                  strokeWidth={1}
                />
                <h2 className="text-5xl font-black italic text-[#3e2f28] tracking-tighter">
                  FINAL LOG.
                </h2>
              </div>

              {/* 内容エリア：達成メッセージ、日時、ユーザーID */}
              <div className="space-y-8 py-4 text-[#3e2f28]">
                <div className="space-y-1">
                  <p className="text-xl font-bold italic">全標本の記録完了</p>
                  {/* 発見した標本数を示すインジケーターバー */}
                  <div className="flex justify-center gap-1.5 mt-3">
                    {badges.map((_, i) => (
                      <div key={i} className="w-6 h-1 bg-[#3e2f28]/40" />
                    ))}
                  </div>
                </div>

                {/* 完了時刻の刻印 */}
                <div className="space-y-1">
                  <p className="font-mono text-xs font-black">
                    {completionTime}
                  </p>
                </div>

                {/* ユーザーID（デジタル署名のような扱い） */}
                <div className="space-y-1 pt-4">
                  <p className="font-mono text-[9px] font-bold opacity-60 px-8 break-all leading-tight">
                    {fullUserId}
                  </p>
                </div>
              </div>

              {/* フッター：閉じるボタン */}
              <div className="pt-10 border-t border-[#3e2f28]/10">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-[#3e2f28] text-[#fdfaf2] text-[10px] font-black uppercase tracking-widest hover:bg-[#000] transition-all shadow-xl"
                >
                  戻る
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
