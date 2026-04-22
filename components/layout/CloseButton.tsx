"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CloseButtonProps {
  onClick?: () => void;
  className?: string;
}

export const CloseButton = ({ onClick, className = "" }: CloseButtonProps) => {
  const router = useRouter();

  const handleClose = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClose}
      className={`fixed top-6 right-6 z-[200] w-12 h-12 flex items-center justify-center bg-[#e8e2d2]/80 backdrop-blur-md border border-[#3e2f28]/10 rounded-full text-[#3e2f28]/60 hover:text-[#3e2f28] hover:bg-[#e8e2d2] transition-all shadow-sm active:scale-90 ${className}`}
      aria-label="閉じる"
    >
      <X size={24} strokeWidth={1.5} />
    </button>
  );
};
