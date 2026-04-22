"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "../backend/types";
import { BadgeService } from "../backend/services/badgeService";
import { signInAnonymously } from "../backend/lib/supabase";

export const useHome = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [acquiredBadgeIds, setAcquiredBadgeIds] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(true);
  const [fullUserId, setFullUserId] = useState<string>("");
  const [cameraPermission, setCameraPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");

  /**
   * カメラの先行許可リクエスト
   */
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
      return true;
    } catch (err) {
      console.warn("Camera permission denied or failed:", err);
      setCameraPermission("denied");
      return false;
    }
  }, []);

  /**
   * 初期データのロード
   */
  const loadData = useCallback(async () => {
    setSyncing(true);
    try {
      const user = await signInAnonymously();
      if (user) {
        setFullUserId(user.id);
        const [allBadges, myAcquiredIds] = await Promise.all([
          BadgeService.getAllBadges(),
          BadgeService.getAcquiredBadgeIds(user.id),
        ]);

        // 1. 5つのモック標本（獲得済み）
        const mockBadges: Badge[] = Array.from({ length: 5 }).map((_, i) => ({
          id: `mock-specimen-00${i + 1}`,
          name: `Specimen ${String.fromCharCode(65 + i)}`,
          description: `Historical Archive Record`,
          color: ["#3e2f28", "#2563eb", "#10b981", "#f59e0b", "#ef4444"][i],
          model_url: "/butterfly.glb",
          target_index: 999,
        }));

        // 2. 6番目の枠（実データがあれば採用、なければ未知の枠として表示）
        const realBadge = allBadges[0] || {
          id: "unknown-specimen-006",
          name: "Unknown Specimen",
          description: "Yet to be discovered in the wild.",
          color: "#8b5cf6",
          model_url: "/butterfly.glb",
          target_index: 0,
        };

        const displayBadges = [...mockBadges, realBadge];
        setBadges(displayBadges);

        // 3. 獲得済みリストの設定
        const mockIds = mockBadges.map((b) => b.id);
        setAcquiredBadgeIds([...mockIds, ...myAcquiredIds]);
      }
    } catch (error) {
      console.error("❌ Roadmap Load Error:", error);
    } finally {
      setSyncing(false);
    }
  }, []);

  // データロードとカメラ要求用
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();

    // 💡 サイトアクセス時にカメラアクセスを要求
    requestCameraPermission();

    window.addEventListener("focus", loadData);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadData();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", loadData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadData, requestCameraPermission]);

  // パーミッション監視用
  useEffect(() => {
    const checkPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          setCameraPermission(result.state as "prompt" | "granted" | "denied");
          result.onchange = () => {
            setCameraPermission(
              result.state as "prompt" | "granted" | "denied",
            );
          };
        } catch (e) {
          console.warn("Permissions API not supported for camera", e);
        }
      }
    };
    checkPermission();
  }, []);

  const isAcquired = (id: string) => acquiredBadgeIds.includes(id);

  return {
    badges,
    acquiredBadgeIds,
    syncing,
    fullUserId,
    cameraPermission,
    isAcquired,
    requestCameraPermission,
    refresh: loadData,
  };
};
