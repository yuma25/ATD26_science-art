"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Compass, RefreshCcw, Camera } from "lucide-react";

interface AppHeaderProps {
  fullUserId: string;
  syncing: boolean;
  onLaunchAR: () => void;
}

export const AppHeader = ({
  fullUserId,
  syncing,
  onLaunchAR,
}: AppHeaderProps) => {
  return (
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

      <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
        <AnimatePresence>
          {syncing && (
            <RefreshCcw size={14} className="animate-spin text-[#3e2f28]/20" />
          )}
        </AnimatePresence>
        <button
          onClick={onLaunchAR}
          className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#3e2f28] text-[#fdfaf2] rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl border border-white/5"
        >
          <div className="relative flex items-center justify-center">
            <Camera
              size={18}
              strokeWidth={1.5}
              className="group-hover:rotate-12 transition-transform"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border border-white/30 rounded-full"
            />
          </div>
          <span className="font-data text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] pt-0.5">
            Scan
          </span>
        </button>
      </div>
    </header>
  );
};
