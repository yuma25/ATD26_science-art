"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { Badge } from "../../backend/types";

interface FinalLogModalProps {
  show: boolean;
  onClose: () => void;
  completionTime: string;
  fullUserId: string;
  badges: Badge[];
}

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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                  onClick={onClose}
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
  );
};
