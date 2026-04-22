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
    const userRes = await supabase?.auth.getUser();
    if (userRes?.data.user) {
      await BadgeService.acquireBadge(userRes.data.user.id, badgeId);
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
    console.log("🔍 Attaching MindAR listeners...");
    const targets = document.querySelectorAll("[mindar-image-target]");
    const ghostEl = document.querySelector("#ghost");

    targets.forEach((targetEl) => {
      const attr = targetEl.getAttribute("mindar-image-target") as
        | string
        | MindARAttribute
        | null;
      let index = -1;

      if (typeof attr === "object" && attr !== null) {
        // A-Frame が既にオブジェクトとして解析している場合
        index = attr.targetIndex;
      } else if (typeof attr === "string") {
        // まだ文字列として残っている場合
        const match = attr.match(/targetIndex:\s*(\d+)/);
        if (match) index = parseInt(match[1]);
      }

      if (index === -1) return;

      targetEl.addEventListener("targetFound", () => {
        const badge = allBadges.find((b) => b.target_index === index);
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
        if (!alreadyHad) startProgress(badge.id);
      });

      targetEl.addEventListener("targetLost", () => {
        setIsFound(false);
        ghostEl?.setAttribute("visible", "true");
        document
          .querySelector(`#model-container-${index}`)
          ?.setAttribute("visible", "false");
        resetProgress();
      });
    });
  }, [allBadges, startProgress, resetProgress]);

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
