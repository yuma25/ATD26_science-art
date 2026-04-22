"use client";

import { useCallback } from "react";

const SCROLL_STORAGE_KEY = "specimens_journal_scroll_pos";

export const useScrollManager = () => {
  /**
   * 現在のスクロール位置を一時保存する
   */
  const saveScroll = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString());
    }
  }, []);

  /**
   * 保存された位置へスクロールを戻す（即時）
   */
  const restoreScroll = useCallback(() => {
    if (typeof window !== "undefined") {
      const savedPos = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (savedPos) {
        window.scrollTo({
          top: parseInt(savedPos, 10),
          behavior: "instant", // アニメーションなしで即座に移動
        });
        // 一度戻したらクリアする
        sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      }
    }
  }, []);

  return { saveScroll, restoreScroll };
};
