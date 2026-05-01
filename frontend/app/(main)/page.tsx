"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RefreshCcw,
  Camera,
  MapPin,
  Compass,
  Flag,
  History,
  Users,
} from "lucide-react";
import { useHome } from "@/hooks/useHome";
import { BadgeCard } from "@/components/BadgeCard";
import { calculateProgress } from "@backend/lib/logic";
import { useScrollManager } from "@/hooks/useScrollManager";
import { FinalLogModal } from "@/components/journal/FinalLogModal";

import { useRouter } from "next/navigation"; // 💡 追加

/**
 * 【ホーム画面（冒険者の手記）】
 * アプリのメイン画面です。標本の一覧表示、進捗状況の確認、
 * ARカメラの起動など、主要な機能が集約されています。
 */
export default function Home() {
  // --- カスタムフックから状態と関数を取得 ---
  const {
    badges, // 標本データの一覧
    syncing, // 同期中フラグ
    fullUserId, // 内部処理用ID
    displayId, // 💡 表示用ID
    partySize, // 来場人数
    showPartyInput, // 人数入力モーダルの表示フラグ
    cameraPermission, // カメラ権限の状態
    isAcquired, // 指定したIDの標本獲得済みか判定する関数
    requestCameraPermission, // カメラ権限をリクエストする関数
    updatePartySize, // 人数を更新する関数
  } = useHome();

  const { saveScroll, restoreScroll } = useScrollManager(); // スクロール位置の管理
  const router = useRouter(); // 💡 画面遷移のために追加

  const [showFinalLog, setShowFinalLog] = useState(false); // コンプリート記念モーダルの表示管理
  const [inputValue, setInputValue] = useState("1"); // 💡 人数入力用の状態

  // --- 進捗状況の計算 ---
  // 1. 獲得済みの標本数をカウントします
  const acquiredCount = badges.filter((b) => isAcquired(b.id)).length;
  // 2. すべての標本を集めたか判定します
  const isComplete = badges.length > 0 && acquiredCount === badges.length;
  // 3. 進捗率（0-100%）を計算します
  const progressPercentage = calculateProgress(badges.length, acquiredCount);

  // 4. コンプリートした時刻を整形します（メモ化して再計算を抑制）
  const completionTime = useMemo(() => {
    if (!isComplete) return "";
    return new Date().toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [isComplete]);

  // --- ライフサイクル処理 ---
  // マウント時や同期完了時にスクロール位置を復元します
  useEffect(() => {
    // 同期が完了し、データが存在する場合に実行
    if (!syncing && badges.length > 0) {
      const timer = setTimeout(() => {
        restoreScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [syncing, badges, restoreScroll]);

  // --- ユーザーアクション ---
  /**
   * ARカメラを起動します
   */
  const handleLaunchAR = async () => {
    // 1. カメラ権限がない場合はリクエストします
    if (cameraPermission !== "granted") {
      const ok = await requestCameraPermission();
      if (!ok) return; // 権限が得られなければ中断
    }
    // 2. 現在のスクロール位置を保存します
    saveScroll();
    // 3. AR画面へ遷移します
    window.location.href = "/ar";
  };

  return (
    <div className="min-h-screen font-serif selection:bg-[#d4c5a9] text-[#3e2f28] flex flex-col relative">
      {/* --- ヘッダー領域 --- */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#e8e2d2]/90 backdrop-blur-md px-4 sm:px-8 py-6 sm:py-10 flex items-center justify-between border-b border-[#3e2f28]/10 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 管理者ログイン画面への入り口（下手に隠さず、アイコンとして配置） */}
            <button
              onClick={() => router.push("/admin/login")}
              className="focus:outline-none active:scale-95 transition-transform group relative"
              title="管理者ログイン"
            >
              <Compass
                size={20}
                className="text-[#3e2f28]/60 flex-shrink-0 group-hover:text-[#3e2f28]"
                strokeWidth={1.5}
              />
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                ADMIN
              </span>
            </button>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight italic whitespace-nowrap">
              ATD26_SCIENCE-ART
            </h1>
          </div>
          <div className="pl-7 sm:pl-9 flex items-center gap-3 text-[#3e2f28]/60">
            {/* 表示用IDの表示（管理者の場合は専用形式） */}
            {displayId && (
              <p className="font-mono text-[7px] sm:text-[10px] font-bold tracking-tight opacity-70 break-all leading-tight max-w-[180px] sm:max-w-none">
                ID: {displayId}
              </p>
            )}
            {/* 人数情報の表示 */}
            {typeof partySize === "number" && partySize > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-bold border-l border-[#3e2f28]/10 pl-3 h-3">
                <Users size={10} />
                <span>{partySize}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          {/* 同期中のインジケーター */}
          <AnimatePresence>
            {syncing && (
              <RefreshCcw
                size={14}
                className="animate-spin text-[#3e2f28]/20"
              />
            )}
          </AnimatePresence>
          {/* ARカメラ起動ボタン */}
          <button
            onClick={() => {
              void handleLaunchAR();
            }}
            className="group relative w-10 h-10 sm:w-12 sm:h-12 bg-[#3e2f28] text-[#fdfaf2] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-lg"
          >
            <Camera size={18} strokeWidth={1} />
          </button>
        </div>
      </header>

      {/* --- メインコンテンツ領域 --- */}
      <main className="max-w-xl mx-auto px-8 pt-40 sm:pt-56 pb-40 relative flex-1 w-full z-10">
        <div className="relative">
          {/* タイムラインの中央線と進捗ゲージ */}
          <div className="absolute left-[50%] top-0 bottom-0 w-[4px] -translate-x-1/2 overflow-hidden opacity-40">
            <div className="absolute inset-0 w-full h-full border-l border-dashed border-[#3e2f28]/10" />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 w-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] z-10"
              style={{
                maxHeight: isComplete
                  ? "calc(100% - 100px)"
                  : "calc(100% - 200px)",
              }}
            />
          </div>

          {/* 入口（Entry）アイコン */}
          <div className="relative z-10 flex flex-col items-center mb-40">
            <div className="relative">
              <div className="absolute inset-0 -m-4 border border-[#3e2f28]/10 rounded-full scale-110 border-dashed animate-[spin_30s_linear_infinite]" />
              <div className="w-24 h-24 bg-[#fdfaf2] border-2 border-[#3e2f28]/60 rounded-full flex flex-col items-center justify-center shadow-lg rotate-[-8deg]">
                <Flag
                  size={28}
                  className="text-[#3e2f28]/80 mb-1"
                  strokeWidth={1.5}
                />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                  Entry
                </span>
              </div>
            </div>
          </div>

          {/* 標本カード一覧 */}
          <div className="space-y-60 relative z-20">
            {badges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isAcquired={isAcquired(badge.id)}
                onSaveScroll={saveScroll}
              />
            ))}
          </div>

          {/* ゴール（完了）ボタン */}
          <div className="relative z-10 flex flex-col items-center mt-60">
            <motion.button
              disabled={!isComplete}
              onClick={() => isComplete && setShowFinalLog(true)}
              whileHover={isComplete ? { scale: 1.1, rotate: 0 } : {}}
              whileTap={isComplete ? { scale: 0.9 } : {}}
              className={`w-24 h-24 border-2 flex flex-col items-center justify-center transition-all duration-1000 rotate-[5deg] relative ${isComplete ? "bg-[#3e2f28] text-[#fdfaf2] border-[#3e2f28] shadow-[20px_20px_0_rgba(0,0,0,0.1)] cursor-pointer goal-aura" : "bg-[#fdfaf2] text-[#3e2f28]/10 border-[#3e2f28]/10 cursor-not-allowed"}`}
            >
              {isComplete && (
                <div className="absolute inset-0 bg-amber-400/10 blur-2xl rounded-full animate-pulse" />
              )}
              {isComplete ? (
                <History size={40} className="relative z-10" />
              ) : (
                <MapPin size={40} strokeWidth={1} className="relative z-10" />
              )}
            </motion.button>
          </div>
        </div>
      </main>

      {/* 完了記念モーダル */}
      <FinalLogModal
        show={showFinalLog}
        onClose={() => setShowFinalLog(false)}
        completionTime={completionTime}
        fullUserId={fullUserId}
        badges={badges}
      />

      {/* 初回来場時の人数入力モーダル */}
      {/* --- 来場確認モーダル（自由入力版） --- */}
      <AnimatePresence>
        {showPartyInput && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#3e2f28]/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative w-full max-w-sm bg-[#fdfaf2] p-10 border-2 border-[#3e2f28] shadow-[20px_20px_0_rgba(0,0,0,0.3)] text-center"
            >
              <Users
                size={40}
                className="mx-auto mb-6 text-[#3e2f28]/40"
                strokeWidth={1}
              />
              <h2 className="text-2xl font-black italic mb-2">ご来場の確認</h2>
              <p className="text-[11px] font-bold text-[#3e2f28]/60 mb-8">
                この端末で何名分の来場を登録しますか？
              </p>

              <div className="space-y-8">
                {/* 💡 自由入力フォーム：手記に合うアナログなデザイン */}
                <div className="relative group">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-[#3e2f28]/5 border-2 border-[#3e2f28]/20 rounded-none py-6 text-center font-mono font-bold text-4xl focus:border-[#3e2f28] focus:bg-white transition-all outline-none"
                    placeholder="1"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#3e2f28]/40 group-focus-within:text-[#3e2f28]">
                    名
                  </div>
                </div>

                <div className="bg-[#3e2f28]/5 p-4 text-left border-l-2 border-[#3e2f28]/20">
                  <p className="text-[10px] text-[#3e2f28]/70 font-bold leading-relaxed">
                    グループで複数台のスマホをご利用の場合は、全員の合計が正しくなるように分担して入力してください。
                  </p>
                </div>

                <button
                  onClick={() => {
                    const num = parseInt(inputValue);
                    if (!isNaN(num) && num > 0) {
                      void updatePartySize(num);
                    }
                  }}
                  className="w-full bg-[#3e2f28] text-[#e8e2d2] py-5 font-black uppercase tracking-[0.3em] hover:bg-[#523f35] transition-colors shadow-lg active:scale-[0.98]"
                >
                  記録を開始する
                </button>

                {/* 💡 管理者用エントリポイント：控えめなリンクとして配置 */}
                <div className="pt-4 border-t border-[#3e2f28]/10">
                  <button
                    onClick={() => router.push("/admin/login")}
                    className="text-[9px] font-bold text-[#3e2f28]/30 hover:text-[#3e2f28]/60 transition-colors uppercase tracking-[0.2em]"
                  >
                    — Administrator Access —
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="h-20" />
      <span className="hidden">{completionTime}</span>
    </div>
  );
}
