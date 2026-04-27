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
import { useHome } from "../hooks/useHome";
import { BadgeCard } from "../components/BadgeCard";
import { calculateProgress } from "../backend/lib/logic";
import { useScrollManager } from "../hooks/useScrollManager";

export default function Home() {
  const {
    badges,
    syncing,
    fullUserId,
    partySize,
    showPartyInput,
    cameraPermission,
    isAcquired,
    requestCameraPermission,
    updatePartySize,
  } = useHome();

  const { saveScroll, restoreScroll } = useScrollManager();

  // コンプリート時刻をメモ化して再計算を抑制
  const acquiredCount = badges.filter((b) => isAcquired(b.id)).length;
  const isComplete = badges.length > 0 && acquiredCount === badges.length;
  const progressPercentage = calculateProgress(badges.length, acquiredCount);

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

  // マウント後の処理
  useEffect(() => {
    if (!syncing && badges.length > 0) {
      const timer = setTimeout(() => {
        restoreScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [syncing, badges, restoreScroll]);

  const handleLaunchAR = async () => {
    if (cameraPermission !== "granted") {
      const ok = await requestCameraPermission();
      if (!ok) return;
    }
    saveScroll();
    window.location.href = "/ar";
  };

  return (
    <div className="min-h-screen font-serif selection:bg-[#d4c5a9] text-[#3e2f28] flex flex-col relative">
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#e8e2d2]/90 backdrop-blur-md px-4 sm:px-8 py-6 sm:py-10 flex items-center justify-between border-b border-[#3e2f28]/10 shadow-sm">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <Compass
              size={20}
              className="text-[#3e2f28]/60 flex-shrink-0"
              strokeWidth={1.5}
            />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight italic whitespace-nowrap">
              ATD26_SCIENCE-ART
            </h1>
          </div>
          <div className="pl-7 sm:pl-9 flex items-center gap-3 text-[#3e2f28]/60">
            {fullUserId && (
              <p className="font-mono text-[7px] sm:text-[10px] font-bold tracking-tight opacity-70 break-all leading-tight max-w-[180px] sm:max-w-none">
                ID: {fullUserId}
              </p>
            )}
            {typeof partySize === "number" && partySize > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-bold border-l border-[#3e2f28]/10 pl-3 h-3">
                <Users size={10} />
                <span>{partySize}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <AnimatePresence>
            {syncing && (
              <RefreshCcw
                size={14}
                className="animate-spin text-[#3e2f28]/20"
              />
            )}
          </AnimatePresence>
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

      <main className="max-w-xl mx-auto px-8 pt-40 sm:pt-56 pb-40 relative flex-1 w-full z-10">
        <div className="relative">
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

          <div className="relative z-10 flex flex-col items-center mt-60">
            <motion.button
              disabled={!isComplete}
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
              <div className="bg-[#3e2f28]/5 p-4 mb-8 text-left border-l-2 border-[#3e2f28]/20">
                <div className="text-[10px] text-[#3e2f28]/70 font-bold">
                  【分担入力のお願い】
                </div>
                <p className="text-[10px] text-[#3e2f28]/70 mt-1 opacity-80">
                  グループで複数台のスマホをご利用の場合は、全員の合計が正しくなるように分担して入力してください。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      void updatePartySize(num);
                    }}
                    className="py-4 border border-[#3e2f28]/10 hover:bg-[#3e2f28] hover:text-white transition-all font-mono font-bold text-lg"
                  >
                    {num === 6 ? "5+" : num}
                  </button>
                ))}
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
