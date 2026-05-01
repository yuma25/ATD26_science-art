"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, signInAnonymously } from "@backend/lib/supabase";
import { Badge } from "@backend/types";
import { BadgeService } from "@backend/services/badgeService";

/**
 * 【AR機能用カスタムフック】
 * カメラの制御、標本の認識、解析プロセスの進捗管理などを一括して行います。
 */
export const useAR = () => {
  // --- 状態管理 (State) ---
  const [status, setStatus] = useState<"init" | "loading" | "started">("init"); // 起動状態
  const [isFound, setIsFound] = useState(false); // 標本を見つけているかどうか
  const [progress, setProgress] = useState(0); // 解析の進捗 (0-100)
  const [acquired, setAcquired] = useState(false); // すでに獲得済みかどうか
  const [showSuccess, setShowSuccess] = useState(false); // 獲得成功画面の表示フラグ
  const [isExiting, setIsExiting] = useState(false); // 終了処理中かどうか
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null); // 現在認識中の標本
  const [allBadges, setAllBadges] = useState<Badge[]>([]); // 全標本のデータ
  const [isLoaded, setIsLoaded] = useState(false); // データのロード完了フラグ

  // --- 変数管理 (Ref) ---
  // 初心者向けメモ：Refは再レンダリングを発生させずに最新の値を保持するために使います。
  const allBadgesRef = useRef<Badge[]>([]);
  useEffect(() => {
    allBadgesRef.current = allBadges;
  }, [allBadges]);

  const progressRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const acquiredRef = useRef(false);
  const acquiredBadgeIdsRef = useRef<string[]>([]);

  /**
   * --- クリーンアップ処理 ---
   * AR画面を離れる時に、カメラやメモリを解放します。
   */
  const cleanupAR = useCallback(() => {
    console.log("🧹 ARの終了処理を開始します...");

    // 1. 進捗タイマーを停止
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 2. A-Frame/MindARのシーンを停止して削除
    const sceneEl = document.querySelector("a-scene") as
      | (HTMLElement & {
          systems?: Record<string, { stop: () => void; controller?: unknown }>;
        })
      | null;
    const mindarSystem = sceneEl?.systems?.["mindar-image-system"];
    if (mindarSystem && mindarSystem.controller) {
      try {
        mindarSystem.stop();
      } catch (e) {
        console.error("MindARの停止に失敗しました:", e);
      }
    }
    if (sceneEl) {
      sceneEl.remove();
    }

    // 3. ブラウザのカメラ使用を完全に終了
    document.querySelectorAll("video").forEach((v) => {
      try {
        const stream = v.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
            console.log("🛑 カメラトラックを停止しました:", track.label);
          });
        }
      } catch (e) {
        console.error("ビデオトラックの停止に失敗しました:", e);
      }
      v.remove();
    });
  }, []);

  /**
   * --- 解析と獲得のロジック ---
   */

  /**
   * 標本の解析が完了した時の処理
   */
  const handleSuccess = useCallback(async (badgeId: string) => {
    // すでに獲得処理中なら何もしない（早期リターン）
    if (acquiredRef.current) return;

    setAcquired(true);
    acquiredRef.current = true;
    setShowSuccess(true);

    // 獲得済みリストに追加
    if (!acquiredBadgeIdsRef.current.includes(badgeId)) {
      acquiredBadgeIdsRef.current.push(badgeId);
    }

    // データベースに記録（ログインしている場合のみ）
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await BadgeService.acquireBadge(user.id, badgeId);
    }
  }, []);

  /**
   * 解析進捗（ゲージ）を溜める処理
   */
  const startProgress = useCallback(
    (badgeId: string) => {
      if (acquiredRef.current) return;
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        progressRef.current += 2; // 進むスピード
        setProgress(Math.floor(progressRef.current));

        if (progressRef.current >= 100) {
          clearInterval(timerRef.current!);
          handleSuccess(badgeId);
        }
      }, 30);
    },
    [handleSuccess],
  );

  /**
   * ゲージをリセットする処理
   */
  const resetProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!acquiredRef.current) {
      progressRef.current = 0;
      setProgress(0);
    }
  }, []);

  /**
   * --- イベントリスナーの設定 ---
   * 標本が見つかった(Found)、見失った(Lost)のイベントを監視します。
   */
  const setupListeners = useCallback(() => {
    console.log("🔍 ARマーカーの監視を開始します...");
    const targets = document.querySelectorAll("[mindar-image-target]");

    targets.forEach((targetEl) => {
      // 二重登録を防止するフラグ
      const el = targetEl as HTMLElement & { _listenerAttached?: boolean };
      if (el._listenerAttached) return;
      el._listenerAttached = true;

      // ターゲットの番号を取得
      const attr = targetEl.getAttribute("mindar-image-target");
      if (!attr) return;

      let index = -1;
      if (typeof attr === "string") {
        // 文字列として取得された場合は正規表現で抽出
        const match = attr.match(/targetIndex:\s*(\d+)/);
        index = match ? parseInt(match[1]) : -1;
      } else if (
        typeof attr === "object" &&
        attr !== null &&
        "targetIndex" in attr
      ) {
        // A-Frameによって既にオブジェクトとして解析されている場合
        index = (attr as unknown as { targetIndex: number }).targetIndex;
      }

      if (index === -1) return;

      // 見つかった時の処理
      targetEl.addEventListener("targetFound", () => {
        console.log(`🎯 発見: 番号 ${index}`);
        const badge = allBadgesRef.current.find(
          (b) => b.target_index === index,
        );
        if (!badge) return;

        setActiveBadge(badge);
        setIsFound(true);

        // 3Dモデルを表示
        document
          .querySelector(`#model-container-${index}`)
          ?.setAttribute("visible", "true");

        // すでに持っているか確認
        const alreadyHad = acquiredBadgeIdsRef.current.includes(badge.id);
        setAcquired(alreadyHad);
        acquiredRef.current = alreadyHad;

        if (!alreadyHad) {
          progressRef.current = 0;
          setProgress(0);
          startProgress(badge.id);
        }
      });

      // 見失った時の処理
      targetEl.addEventListener("targetLost", () => {
        console.log(`💨 見失い: 番号 ${index}`);
        setIsFound(false);
        document
          .querySelector(`#model-container-${index}`)
          ?.setAttribute("visible", "false");
        resetProgress();
      });
    });
  }, [startProgress, resetProgress]);

  /**
   * --- 初期化処理 ---
   */
  useEffect(() => {
    const init = async () => {
      // 1. 匿名ログイン
      const user = await signInAnonymously();
      if (!user) return;

      // 2. 標本データと自分の獲得状況を同時に取得
      const [badges, myAcquiredIds] = await Promise.all([
        BadgeService.getAllBadges(),
        BadgeService.getAcquiredBadgeIds(user.id),
      ]);

      setAllBadges(badges);
      acquiredBadgeIdsRef.current = myAcquiredIds;
      setIsLoaded(true);
    };

    init();

    // クリーンアップ関数を返して、アンマウント時に実行されるようにします
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
    setupListeners,
    // ホームに戻る処理
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
