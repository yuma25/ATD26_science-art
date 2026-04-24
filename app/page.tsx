"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCcw,
  Camera,
  MapPin,
  Compass,
  Flag,
  Award,
  History,
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
    cameraPermission,
    isAcquired,
    requestCameraPermission,
  } = useHome();

  const { saveScroll, restoreScroll } = useScrollManager();

  const [showFinalLog, setShowFinalLog] = useState(false);
  const [completionTime, setCompletionTime] = useState("");

  const acquiredCount = badges.filter((b) => isAcquired(b.id)).length;
  const isComplete = badges.length > 0 && acquiredCount === badges.length;
  const progressPercentage = calculateProgress(badges.length, acquiredCount);

  // 💡 修正：データロード完了時にスクロール位置を復元
  useEffect(() => {
    if (!syncing && badges.length > 0) {
      const timer = setTimeout(() => {
        restoreScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [syncing, badges, restoreScroll]);

  // コンプリート時に一度だけ時刻を記録
  useEffect(() => {
    if (isComplete && !completionTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompletionTime(
        new Date().toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
  }, [isComplete, completionTime]);

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
      {/* Header Section */}
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
          <div className="pl-7 sm:pl-9">
            <p className="font-mono text-[9px] sm:text-[11px] text-[#3e2f28]/60 font-bold uppercase tracking-widest truncate max-w-[200px] sm:max-w-none">
              ID: {fullUserId}
            </p>
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
            onClick={handleLaunchAR}
            className="group relative w-10 h-10 sm:w-12 sm:h-12 bg-[#3e2f28] text-[#fdfaf2] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-lg"
          >
            <Camera size={18} strokeWidth={1} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-8 pt-40 sm:pt-56 pb-40 relative flex-1 w-full z-10">
        <div className="relative">
          {/* Roadmap Path (Dynamic SVG) */}
          <div className="absolute left-[50%] top-0 bottom-0 w-[4px] -translate-x-1/2 overflow-hidden opacity-40">
            {/* Background Path (Dashed) */}
            <div className="absolute inset-0 w-full h-full border-l border-dashed border-[#3e2f28]/10" />

            {/* Active Path (Soft Amber Glow) */}
            <motion.div
              initial={{ height: 0 }}
              animate={{
                height: `${progressPercentage}%`,
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 w-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] z-10"
              style={{
                maxHeight: isComplete
                  ? "calc(100% - 100px)"
                  : "calc(100% - 200px)",
              }}
            />
          </div>

          {/* Start Marker */}
          <div className="relative z-10 flex flex-col items-center mb-40">
            <div className="relative">
              <div className="absolute inset-0 -m-4 border border-[#3e2f28]/10 rounded-full scale-110 border-dashed animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-0 -m-2 border border-[#3e2f28]/20 rounded-full" />

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
            <div className="mt-16 flex flex-col gap-1 items-center opacity-30">
              <div className="w-1 h-1 bg-amber-500 rounded-full" />
              <div className="w-1 h-1 bg-amber-500 rounded-full" />
              <div className="w-1 h-1 bg-amber-500 rounded-full" />
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

          {/* Goal Marker */}
          <div className="relative z-10 flex flex-col items-center mt-60">
            <motion.button
              disabled={!isComplete}
              onClick={() => setShowFinalLog(true)}
              whileHover={isComplete ? { scale: 1.1, rotate: 0 } : {}}
              whileTap={isComplete ? { scale: 0.9 } : {}}
              className={`w-24 h-24 border-2 flex flex-col items-center justify-center transition-all duration-1000 rotate-[5deg] relative ${
                isComplete
                  ? "bg-[#3e2f28] text-[#fdfaf2] border-[#3e2f28] shadow-[20px_20px_0_rgba(0,0,0,0.1)] cursor-pointer goal-aura"
                  : "bg-[#fdfaf2] text-[#3e2f28]/10 border-[#3e2f28]/10 cursor-not-allowed"
              }`}
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
            <div className="mt-8 text-center">
              <p
                className={`font-black text-[12px] uppercase tracking-[0.6em] ${isComplete ? "text-[#3e2f28]" : "opacity-20"}`}
              >
                {isComplete ? "The Last Page" : "Undiscovered"}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Final Discovery Log Modal */}
      <AnimatePresence>
        {showFinalLog && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFinalLog(false)}
              className="fixed inset-0 bg-[#3e2f28]/90 backdrop-blur-xl no-print"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#fdfaf2] p-10 sm:p-16 border-[2px] border-[#3e2f28] shadow-[30px_30px_0_rgba(0,0,0,0.2)] text-center my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative z-10 space-y-12">
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

                <div className="space-y-8 py-4 text-[#3e2f28]">
                  <div className="space-y-1">
                    <p className="text-xl font-bold italic">
                      All Specimens Recorded
                    </p>
                    <div className="flex justify-center gap-1.5 mt-3">
                      {badges.map((_, i) => (
                        <div key={i} className="w-6 h-1 bg-[#3e2f28]/40" />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-mono text-xs font-black">
                      {completionTime}
                    </p>
                  </div>

                  <div className="space-y-1 pt-4">
                    <p className="font-mono text-[9px] font-bold opacity-60 px-8 break-all leading-tight">
                      {fullUserId}
                    </p>
                  </div>
                </div>

                <div className="pt-10 border-t border-[#3e2f28]/10">
                  <button
                    onClick={() => setShowFinalLog(false)}
                    className="w-full py-4 bg-[#3e2f28] text-[#fdfaf2] text-[10px] font-black uppercase tracking-widest hover:bg-[#000] transition-all shadow-xl"
                  >
                    Return to Journal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-12 border-t border-[#3e2f28]/5 bg-black/[0.01] text-center select-none z-10">
        <div className="max-w-xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 opacity-40">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em]">
            ©ATD26_SCIENCE-ART
          </p>
        </div>
      </footer>
    </div>
  );
}
