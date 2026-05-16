"use client";

/**
 * モジュールのインポート
 * アニメーション用のframer-motionと、チェックマークアイコンを読み込みます。
 */
import { motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * DiscoveryCompleteProps の説明：
 * @param badgeName - 発見した標本の名前
 * @param artistName - 作者名
 * @param onClose - 画面を閉じるための関数
 * @param isLast - 最後の1つかどうか
 */
interface DiscoveryCompleteProps {
  badgeName: string;
  artistName?: string;
  onClose: () => void;
  isLast?: boolean;
}

/**
 * DiscoveryCompleteコンポーネント本体
 * ARで標本を認識した直後に表示される「発見完了」の演出画面です。
 */
export const DiscoveryComplete = ({
  badgeName,
  artistName,
  onClose,
  isLast = false,
}: DiscoveryCompleteProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-8 pointer-events-auto cursor-pointer p-6"
      onClick={onClose}
    >
      {/* 
         【演出】完了の刻印
       */}
      <motion.div
        initial={{ scale: 2, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: -5, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className={`w-48 h-48 border-8 border-double rounded-full flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(255,255,255,0.4)] ${
          isLast
            ? "border-amber-400 text-amber-400 bg-black/40"
            : "border-white text-white"
        }`}
      >
        {isLast ? (
          <div className="text-center">
            <div className="text-4xl font-black mb-1">ALL</div>
            <Check size={60} strokeWidth={4} />
          </div>
        ) : (
          <Check size={80} strokeWidth={3} />
        )}
        <div
          className={`absolute -bottom-2 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] rotate-12 ${
            isLast ? "bg-amber-400 text-black" : "bg-white text-black"
          }`}
        >
          {isLast ? "コンプリート！" : "記録完了"}
        </div>
      </motion.div>

      {/* 発見した標本の名前を表示 */}
      <div className="text-center space-y-2">
        <h2
          className={`text-3xl font-black italic font-serif tracking-tight ${isLast ? "text-amber-400" : "text-white"}`}
        >
          {badgeName}
        </h2>
        {artistName && (
          <p className="text-white/80 font-medium text-sm">{artistName}</p>
        )}
        <p className="text-white/60 font-mono text-[10px] uppercase tracking-[0.5em] pt-2">
          {isLast ? "全ての記録に成功しました" : "発見成功"}
        </p>
      </div>

      {/* 💡 全収集完了時の特別な案内メッセージ */}
      {isLast && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-amber-500 text-black px-6 py-4 rounded-xl text-center shadow-2xl border-2 border-white/50"
        >
          <p className="text-xs font-black mb-1">🎁 景品獲得のチャンス！</p>
          <p className="text-[14px] font-bold leading-tight">
            ホーム画面に戻り
            <br />
            「景品引き換えチケット」を
            <br />
            運営スタッフに提示してください
          </p>
        </motion.div>
      )}

      {/* ユーザーにタップを促す点滅メッセージ */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-6 text-white/40 font-mono text-[8px] uppercase tracking-widest"
      >
        画面をタップして閉じる
      </motion.div>
    </motion.div>
  );
};
