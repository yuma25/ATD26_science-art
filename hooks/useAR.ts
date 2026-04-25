"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, signInAnonymously } from "../backend/lib/supabase";
import { Badge } from "../backend/types";
import { BadgeService } from "../backend/services/badgeService";

export const useAR = () => {
  const [status, setStatus] = useState<"init" | "loading" | "started">("init");
  const [isFound, setIsFound] = useState(false);
  const [progress, setProgress] = useState(0);
  const [acquired, setAcquired] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 💡 修正：クロージャ問題を避けるため Ref で最新のバッジ情報を保持
  const allBadgesRef = useRef<Badge[]>([]);
  useEffect(() => {
    allBadgesRef.current = allBadges;
  }, [allBadges]);

  const progressRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const acquiredRef = useRef(false);
  const acquiredBadgeIdsRef = useRef<string[]>([]);

  // A-Frame / MindAR の型定義
  interface AFrameScene extends HTMLElement {
    systems?: {
      "mindar-image-system"?: {
        start: () => void;
        stop: () => void;
        controller?: unknown;
      };
    };
  }

  interface MindARAttribute {
    targetIndex: number;
  }

  const cleanupAR = useCallback(() => {
    console.log("🧹 AR Cleanup...");
    if (timerRef.current) clearInterval(timerRef.current);
    const sceneEl = document.querySelector("a-scene") as AFrameScene | null;

    // MindAR システムを明示的に停止 (A-Frame が消える前に)
    const mindarSystem = sceneEl?.systems?.["mindar-image-system"];
    if (mindarSystem && mindarSystem.controller) {
      try {
        mindarSystem.stop();
      } catch (e) {
        console.error("Failed to stop MindAR system", e);
      }
    }

    if (sceneEl) sceneEl.remove();

    // ビデオストリームを完全に停止
    document.querySelectorAll("video").forEach((v) => {
      try {
        const s = v.srcObject as MediaStream | null;
        if (s) {
          s.getTracks().forEach((t) => {
            t.stop();
            console.log("🛑 Track stopped:", t.label);
          });
        }
      } catch (e) {
        console.error("Failed to stop video track", e);
      }
      v.remove();
    });
  }, []);

  const handleSuccess = useCallback(async (badgeId: string) => {
    if (acquiredRef.current) return;
    setAcquired(true);
    acquiredRef.current = true;
    setShowSuccess(true);

    // 💡 修正：獲得済みリストに即座に追加し、再認識時のゲージ表示を防ぐ
    if (!acquiredBadgeIdsRef.current.includes(badgeId)) {
      acquiredBadgeIdsRef.current.push(badgeId);
    }

    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // 💡 プロフィールが消えている場合に備えて同期を試みる
      await BadgeService.acquireBadge(user.id, badgeId);
    }
  }, []);

  const startProgress = useCallback(
    (badgeId: string) => {
      if (acquiredRef.current) return;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        progressRef.current += 2;
        setProgress(Math.floor(progressRef.current));
        if (progressRef.current >= 100) {
          clearInterval(timerRef.current!);
          handleSuccess(badgeId);
        }
      }, 30);
    },
    [handleSuccess],
  );

  const resetProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!acquiredRef.current) {
      progressRef.current = 0;
      setProgress(0);
    }
  }, []);

  // 💡 修正：独自のカメラ起動を削除（MindARに一任する）
  const setupCamera = async () => {
    console.log("🎥 MindAR will handle camera initialization.");
    return true;
  };

  const setupListeners = useCallback(() => {
    console.log("🔍 Attaching MindAR listeners to targets...");
    const targets = document.querySelectorAll("[mindar-image-target]");
    console.log(`Found ${targets.length} target elements in DOM.`);
    const ghostEl = document.querySelector("#ghost");

    targets.forEach((targetEl) => {
      // 💡 修正：要素をクローンせず、フラグを使って二重登録を防止する
      // これにより MindAR エンジンとの紐付けを壊さずに多重登録を防ぐ
      const el = targetEl as HTMLElement & { _listenerAttached?: boolean };
      if (el._listenerAttached) {
        console.log("⏭ Listener already attached, skipping.");
        return;
      }
      el._listenerAttached = true;

      const attr = targetEl.getAttribute("mindar-image-target") as
        | string
        | MindARAttribute
        | null;
      let index = -1;

      if (typeof attr === "object" && attr !== null) {
        index = attr.targetIndex;
      } else if (typeof attr === "string") {
        const match = attr.match(/targetIndex:\s*(\d+)/);
        if (match) index = parseInt(match[1]);
      }

      console.log(`Setting up listener for Target Index: ${index}`);

      if (index === -1) return;

      targetEl.addEventListener("targetFound", () => {
        console.log(`🎯 TARGET_FOUND: Index ${index}`);
        const badge = allBadgesRef.current.find(
          (b) => b.target_index === index,
        );
        if (!badge) return;

        setActiveBadge(badge);
        setIsFound(true);
        ghostEl?.setAttribute("visible", "false");
        document
          .querySelector(`#model-container-${index}`)
          ?.setAttribute("visible", "true");

        const alreadyHad = acquiredBadgeIdsRef.current.includes(badge.id);
        setAcquired(alreadyHad);
        acquiredRef.current = alreadyHad;

        if (!alreadyHad) {
          // 💡 修正：解析開始前に数値をリセット
          progressRef.current = 0;
          setProgress(0);
          startProgress(badge.id);
        }
      });

      targetEl.addEventListener("targetLost", () => {
        console.log(`💨 TARGET_LOST: Index ${index}`);
        setIsFound(false);
        ghostEl?.setAttribute("visible", "true");
        document
          .querySelector(`#model-container-${index}`)
          ?.setAttribute("visible", "false");
        resetProgress();
      });
    });
  }, [startProgress, resetProgress]);

  useEffect(() => {
    const init = async () => {
      const user = await signInAnonymously();
      if (user) {
        const [badges, myAcquiredIds] = await Promise.all([
          BadgeService.getAllBadges(),
          BadgeService.getAcquiredBadgeIds(user.id),
        ]);
        setAllBadges(badges);
        acquiredBadgeIdsRef.current = myAcquiredIds;
        setIsLoaded(true);
      }
    };
    init();
    return () => cleanupAR();
  }, [cleanupAR]);

  return {
    status,
    setStatus,
    isFound,
    progress,
    acquired,
    showSuccess,
    isExiting,
    activeBadge,
    allBadges,
    isLoaded,
    setupCamera,
    setupListeners,
    navigateHome: useCallback(() => {
      setIsExiting(true);
      cleanupAR();
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    }, [cleanupAR]),
    setShowSuccess,
  };
};
