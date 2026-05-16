"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BadgeService } from "@backend/services/badgeService";
import { signInAnonymously, supabase } from "@backend/lib/supabase";

/**
 * 【ホーム画面用カスタムフック】
 * SWR を使用して、データのキャッシュと高速な表示を実現します。
 */
export const useHome = () => {
  // 1. 基本的な標本リストの取得 (SWR)
  const {
    data: allBadges = [],
    isLoading: loadingBadges,
    isValidating: validatingBadges,
  } = useSWR("all-badges", () => BadgeService.getAllBadges(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // 2. ユーザーセッションとIDの管理
  const { data: sessionData, mutate: mutateSession } = useSWR(
    "user-session",
    async () => {
      if (!supabase) return null;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
  );

  const user = sessionData?.user;
  const userId = user?.id || "";

  // 3. ユーザー固有データの取得 (SWR)
  const {
    data: acquiredRows = [],
    isLoading: loadingAcquired,
    isValidating: validatingAcquired,
    mutate: mutateAcquired,
  } = useSWR(
    userId ? `acquired-${userId}` : null,
    () => BadgeService.getAcquiredBadges(userId),
    { revalidateOnFocus: true },
  );

  const {
    data: profile,
    isLoading: loadingProfile,
    isValidating: validatingProfile,
    mutate: mutateProfile,
  } = useSWR(
    userId ? `profile-${userId}` : null,
    () => BadgeService.getProfile(userId),
    { revalidateOnFocus: true },
  );

  // --- 状態の集計 ---

  // 「本当にデータがなくて待機が必要な状態」か判定
  const initialLoading =
    loadingBadges || (userId !== "" && (loadingAcquired || loadingProfile));

  // バックグラウンドでの同機中か判定
  const syncing = validatingBadges || validatingAcquired || validatingProfile;

  // カメラ権限の状態
  const [cameraPermission, setCameraPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");

  // --- 計算・加工 ---
  const acquiredBadgeIds = useMemo(
    () => acquiredRows.map((r) => r.badge_id),
    [acquiredRows],
  );

  const sortedBadges = useMemo(() => {
    if (allBadges.length === 0) return [];
    const acquisitionMap = new Map(
      acquiredRows.map((r) => [r.badge_id, r.acquired_at]),
    );

    return [...allBadges].sort((a, b) => {
      const tA = acquisitionMap.get(a.id);
      const tB = acquisitionMap.get(b.id);
      if (tA && tB) return new Date(tA).getTime() - new Date(tB).getTime();
      if (tA) return -1;
      if (tB) return 1;
      return a.target_index - b.target_index;
    });
  }, [allBadges, acquiredRows]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return (
      user.app_metadata?.provider === "email" && !(user.is_anonymous ?? false)
    );
  }, [user]);

  const displayId = useMemo(() => {
    if (!userId) return "";
    if (isAdmin) return `STAFF-ADMIN-${userId.slice(0, 4).toUpperCase()}`;
    return userId;
  }, [userId, isAdmin]);

  /**
   * --- 認証イベントの監視 ---
   */
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      console.log(`🔐 認証イベント検知: ${event}`);
      void mutateSession();
      if (event === "SIGNED_OUT") {
        void mutateAcquired([], false);
        void mutateProfile(null, false);
      }
    });
    return () => subscription.unsubscribe();
  }, [mutateSession, mutateAcquired, mutateProfile]);

  return {
    /** 並び替え済みの標本リスト */
    badges: sortedBadges,
    /** 獲得済みの標本IDリスト */
    acquiredBadgeIds,
    /** データの検証（同期）中かどうか */
    syncing,
    /** 初回データ読み込み中かどうか */
    initialLoading,
    /** ユーザーのフルID (UUID) */
    fullUserId: userId,
    /** 表示用のユーザーID */
    displayId,
    /** パーティ人数 */
    partySize: profile?.party_size ?? (userId ? null : undefined),
    /** 景品交換済みかどうか */
    isExchanged: profile?.is_exchanged ?? false,
    /** パーティ人数入力画面を表示すべきかどうか */
    showPartyInput:
      !isAdmin &&
      !initialLoading &&
      (userId === "" ||
        (profile !== undefined &&
          (profile?.party_size === undefined || profile?.party_size === null))),
    /** カメラ権限の状態 */
    cameraPermission,
    /** 特定の標本を獲得済みかどうかを判定する関数 */
    isAcquired: (id: string) => acquiredBadgeIds.includes(id),
    /**
     * カメラの使用許可をリクエストする関数
     * @returns {Promise<boolean>} 許可された場合は true、拒否された場合は false
     */
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
    /**
     * パーティ人数を更新する関数
     * 匿名ログインが必要な場合は自動的に行います。
     * @param {number} size - 更新するパーティ人数
     * @returns {Promise<boolean>} 更新に成功したかどうか
     */
    updatePartySize: async (size: number) => {
      const u = await signInAnonymously();
      if (!u) return false;
      const ok = await BadgeService.updateProfile(u.id, { party_size: size });
      if (ok) {
        void mutateProfile();
        void mutateSession();
      }
      return ok;
    },
    /**
     * 景品交換を実行する関数
     * @returns {Promise<boolean>} 更新に成功したかどうか
     */
    exchangePrize: async () => {
      if (!userId) return false;
      const ok = await BadgeService.updateProfile(userId, {
        is_exchanged: true,
      });
      if (ok) {
        void mutateProfile();
      }
      return ok;
    },
    /**
     * 獲得状況とプロフィール情報を再取得（リフレッシュ）する関数
     */
    refresh: async () => {
      await Promise.all([mutateAcquired(), mutateProfile()]);
    },
  };
};
