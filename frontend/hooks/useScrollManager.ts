"use client";

import { useCallback } from "react";

/**
 * 【スクロール位置管理フック】
 * ページ遷移の際にスクロール位置を記憶し、戻ってきた時に元の位置に自動でスクロールさせます。
 * これにより、冒険者が「手記（ジャーナル）」のどこを読んでいたかを維持します。
 */

const SCROLL_STORAGE_KEY = "specimens_journal_scroll_pos";

export const useScrollManager = () => {
  /**
   * --- スクロール位置の保存 ---
   * 現在の縦スクロール位置をブラウザの「sessionStorage」に一時保存します。
   */
  const saveScroll = useCallback(() => {
    // サーバーサイド（Node.js）では window がないのでチェックします
    if (typeof window === "undefined") return;

    sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString());
    console.log(`📍 スクロール位置を保存しました: ${window.scrollY}px`);
  }, []);

  /**
   * --- スクロール位置の復元 ---
   * 保存されていた位置へスクロールを即座に戻します。
   */
  const restoreScroll = useCallback(() => {
    if (typeof window === "undefined") return;

    // 1. 保存されている値があるか確認（早期リターン）
    const savedPos = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!savedPos) {
      return;
    }

    // 2. 指定された位置へアニメーションなしで即座に移動します
    window.scrollTo({
      top: parseInt(savedPos, 10),
      behavior: "instant",
    });

    // 3. 一度戻したら古いデータはクリアします
    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
    console.log(`🔄 スクロール位置を復元しました: ${savedPos}px`);
  }, []);

  return { saveScroll, restoreScroll };
};
