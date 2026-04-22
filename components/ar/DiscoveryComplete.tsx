"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface DiscoveryCompleteProps {
  badgeName: string;
  onClose: () => void;
}

export const DiscoveryComplete = ({
  badgeName,
  onClose,
}: DiscoveryCompleteProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-8 pointer-events-auto cursor-pointer"
      onClick={onClose}
    >
      {/* 完了の刻印演出 */}
      <motion.div
        initial={{ scale: 2, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: -5, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="w-48 h-48 border-8 border-double border-white rounded-full flex flex-col items-center justify-center text-white relative shadow-[0_0_30px_rgba(255,255,255,0.3)]"
      >
        <Check size={80} strokeWidth={3} />
        <div className="absolute -bottom-2 bg-white text-black px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] rotate-12">
          Recorded
        </div>
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-white text-3xl font-black italic font-serif tracking-tight">
          {badgeName}
        </h2>
        <p className="text-white/60 font-mono text-[10px] uppercase tracking-[0.5em]">
          Discovery Complete
        </p>
      </div>

      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-12 text-white/40 font-mono text-[8px] uppercase tracking-widest"
      >
        Tap to continue
      </motion.div>
    </motion.div>
  );
};
