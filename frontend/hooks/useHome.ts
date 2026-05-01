"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@backend/types";
import { BadgeService } from "@backend/services/badgeService";
import { signInAnonymously, supabase } from "@backend/lib/supabase";

/**
 * 【ホーム画面用カスタムフック】
 * データのロード、ユーザー情報の管理、カメラ権限の確認など、
 * メイン画面（冒険者の手記）で必要な機能をまとめて提供します。
 */
export const useHome = () => {
  // --- 状態管理 (State) ---
  const [badges, setBadges] = useState<Badge[]>([]); // 標本リスト
  const [acquiredBadgeIds, setAcquiredBadgeIds] = useState<string[]>([]); // 獲得済みIDリスト
  const [syncing, setSyncing] = useState(false); // 同期中フラグ
  const [fullUserId, setFullUserId] = useState<string>(""); // 内部処理用ID
  const [displayId, setDisplayId] = useState<string>(""); // 💡 画面表示用ID
  const [isAdmin, setIsAdmin] = useState(false); // 💡 管理者フラグ

  // partySize の状態: undefined (確認中), null (未設定), number (設定済み)
  const [partySize, setPartySize] = useState<number | null | undefined>(
    undefined,
  );

  // カメラ権限の状態
  const [cameraPermission, setCameraPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");

  const isLoadingRef = useRef(false); // 二重ロード防止用

  /**
   * --- データのロード ---
   * サーバーから最新の標本データと獲得状況を取得します。
   */
  const loadData = useCallback(async (signal?: AbortSignal) => {
    // すでにロード中なら何もしない（早期リターン）
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setSyncing(true);

    try {
      if (!supabase) {
        console.warn(
          "⚠️ Supabase クライアントが初期化されていません。環境変数（NEXT_PUBLIC_SUPABASE_URL 等）を確認してください。",
        );
        return;
      }

      // 1. セッションがあるか確認
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        // --- ログイン済みユーザー（管理者または復帰ユーザー）の処理 ---
        const realId = user.id;
        setFullUserId(realId);

        const isEmailUser = user.app_metadata?.provider === "email";
        const isAnonymous = user.is_anonymous ?? false;
        const adminActive = !!(isEmailUser && !isAnonymous);

        setIsAdmin(adminActive);

        if (adminActive) {
          setDisplayId(`STAFF-ADMIN-${realId.slice(0, 4).toUpperCase()}`);
          // 管理者は常に最新状態を維持するため同期
          await BadgeService.updateProfile(realId, {});
        } else {
          setDisplayId(realId);
        }

        // データの取得 (signalを渡してキャンセル可能に)
        const [allBadges, acquiredRows, profile] = await Promise.all([
          BadgeService.getAllBadges(signal),
          BadgeService.getAcquiredBadges(realId, signal),
          BadgeService.getProfile(realId, signal),
        ]);

        // 人数設定の判定
        if (profile && typeof profile.party_size === "number") {
          setPartySize(profile.party_size);
        } else {
          setPartySize(null);
        }

        // 獲得状況の整理
        const myAcquiredIds = acquiredRows.map((r) => r.badge_id);
        setAcquiredBadgeIds(myAcquiredIds);

        // 並び替え
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
      } else {
        // --- 未ログインユーザー（新規ゲスト）の処理 ---
        // 💡 IDはまだ発行せず、公開データのみ取得します
        setFullUserId("");
        setDisplayId("");
        setIsAdmin(false);
        setPartySize(null); // 入力モーダルを表示させる
        setAcquiredBadgeIds([]);

        const allBadges = await BadgeService.getAllBadges();
        setBadges(allBadges);
      }
    } catch (error) {
      console.error("❌ ロード中にエラーが発生しました:", error);
    } finally {
      setSyncing(false);
      isLoadingRef.current = false;
    }
  }, []);

  /**
   * --- ユーザー情報の更新 ---
   * 💡 ここで初めてユーザーIDが発行され、DBに保存されます
   */
  const updatePartySize = async (size: number) => {
    try {
      setSyncing(true);

      // 1. このタイミングで初めて匿名サインインを実行（ID発行）
      const user = await signInAnonymously();
      if (!user) throw new Error("Sign-in failed");

      const userId = user.id;
      setFullUserId(userId);
      setDisplayId(userId);

      // 2. 人数とプロフィールの保存
      setPartySize(size);
      const ok = await BadgeService.updateProfile(userId, {
        party_size: size,
      });

      if (ok) {
        await loadData(); // 最新状態に更新
      }
      return ok;
    } catch (error) {
      console.error("❌ 登録エラー:", error);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  /**
   * --- カメラ権限の管理 ---
   */
  useEffect(() => {
    const checkPermission = async () => {
      if (typeof window === "undefined" || !navigator.permissions?.query)
        return;

      try {
        const result = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setCameraPermission(result.state as "prompt" | "granted" | "denied");

        // 権限が変わった時に自動で反映
        result.onchange = () =>
          setCameraPermission(result.state as "prompt" | "granted" | "denied");
      } catch (e) {
        console.warn("Permissions API がサポートされていません", e);
      }
    };
    checkPermission();
  }, []);

  /**
   * --- イベントとライフサイクル ---
   */
  useEffect(() => {
    const controller = new AbortController();

    // 初回ロード（非同期で実行）
    const timer = setTimeout(() => {
      void loadData(controller.signal);
    }, 0);

    // 画面にフォーカスが戻った時に最新の状態に更新
    const handleFocus = () => {
      void loadData(controller.signal);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(timer);
      controller.abort(); // 💡 画面を離れる時に通信をすべて止める
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadData]);

  // 補助関数
  const isAcquired = (id: string) => acquiredBadgeIds.includes(id);

  return {
    badges,
    acquiredBadgeIds,
    syncing,
    fullUserId,
    displayId, // 💡 追加
    partySize,
    showPartyInput: partySize === null && !isAdmin, // 💡 管理者の場合は表示しない
    cameraPermission,
    isAcquired,
    // カメラ権限をリクエストする関数
    requestCameraPermission: async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((t) => t.stop()); // 確認が終わったらすぐ止める
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
