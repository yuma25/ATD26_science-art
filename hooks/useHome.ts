"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "../backend/types";
import { BadgeService } from "../backend/services/badgeService";
import { signInAnonymously } from "../backend/lib/supabase";

export const useHome = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [acquiredBadgeIds, setAcquiredBadgeIds] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [fullUserId, setFullUserId] = useState<string>("");

  // undefined: ロード中, null: 未設定, number: 設定済み
  const [partySize, setPartySize] = useState<number | null | undefined>(
    undefined,
  );

  const [cameraPermission, setCameraPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const isLoadingRef = useRef(false);

  /**
   * 初期データのロード
   */
  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setSyncing(true);

    try {
      const user = await signInAnonymously();
      if (user) {
        setFullUserId(user.id);
        const [allBadges, acquiredRows, profile] = await Promise.all([
          BadgeService.getAllBadges(),
          BadgeService.getAcquiredBadges(user.id),
          BadgeService.getProfile(user.id),
        ]);

        console.log(`[useHome] Profile from DB:`, profile);

        // party_size の判定（数値が設定されていればそれを使い、なければ null で入力を促す）
        if (profile && typeof profile.party_size === "number") {
          setPartySize(profile.party_size);
        } else {
          setPartySize(null);
        }

        const myAcquiredIds = acquiredRows.map((r) => r.badge_id);
        setAcquiredBadgeIds(myAcquiredIds);

        const acquisitionMap = new Map(
          acquiredRows.map((r) => [r.badge_id, r.acquired_at]),
        );
        const sortedBadges = [...allBadges].sort((a, b) => {
          const tA = acquisitionMap.get(a.id);
          const tB = acquisitionMap.get(b.id);
          if (tA && tB) return new Date(tA).getTime() - new Date(tB).getTime();
          if (tA) return -1;
          if (tB) return 1;
          return a.target_index - b.target_index;
        });
        setBadges(sortedBadges);
      }
    } catch (error) {
      console.error("❌ Roadmap Load Error:", error);
    } finally {
      setSyncing(false);
      isLoadingRef.current = false;
    }
  }, []);

  const updatePartySize = async (size: number) => {
    if (!fullUserId) return;
    setPartySize(size);
    const ok = await BadgeService.updateProfile(fullUserId, {
      party_size: size,
    });
    if (ok) {
      // 💡 確実に保存されたことを確認するため再ロード
      await loadData();
    }
    return ok;
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
  }, [loadData]);

  useEffect(() => {
    const checkPermission = async () => {
      if (typeof window !== "undefined" && navigator.permissions?.query) {
        try {
          const result = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          setCameraPermission(result.state as "prompt" | "granted" | "denied");
          result.onchange = () =>
            setCameraPermission(
              result.state as "prompt" | "granted" | "denied",
            );
        } catch (e) {
          console.warn("Permissions API not supported", e);
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
    partySize,
    showPartyInput: partySize === null,
    cameraPermission,
    isAcquired,
    requestCameraPermission: async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        setCameraPermission("granted");
        return true;
      } catch {
        setCameraPermission("denied");
        return false;
      }
    },
    updatePartySize,
    refresh: loadData,
  };
};
