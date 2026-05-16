"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useSWR from "swr";

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

  // --- データ取得 (SWRキャッシュ利用) ---
  // useHome と同じキーを使用することで、ホーム画面で取得済みのデータを再利用（キャッシュ）します。

  // 1. セッション情報
  const { data: sessionData } = useSWR("user-session", async () => {
    if (!supabase) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  });
  const userId = sessionData?.user?.id || "";

  // 2. 全標本リスト
  const { data: allBadges = [], isLoading: loadingBadges } = useSWR(
    "all-badges",
    () => BadgeService.getAllBadges(),
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  // 3. 獲得済み標本リスト
  const {
    data: acquiredRows = [],
    isLoading: loadingAcquired,
    mutate: mutateAcquired,
  } = useSWR(
    userId ? `acquired-${userId}` : null,
    () => BadgeService.getAcquiredBadges(userId),
    { revalidateOnFocus: false },
  );

  const acquiredBadgeIds = useMemo(
    () => acquiredRows.map((r) => r.badge_id),
    [acquiredRows],
  );
  const isLoaded = !loadingBadges && (!userId || !loadingAcquired);

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

  useEffect(() => {
    acquiredBadgeIdsRef.current = acquiredBadgeIds;
  }, [acquiredBadgeIds]);

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
  const handleSuccess = useCallback(
    async (badgeId: string) => {
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
        const { data: newAcquired } = await BadgeService.acquireBadge(
          user.id,
          badgeId,
        );
        if (newAcquired) {
          // キャッシュを更新して、ホーム画面に戻った時にも反映されるようにします
          void mutateAcquired();
        }
      }
    },
    [mutateAcquired],
  );

  /**
   * 解析進捗（ゲージ）を溜める処理
   */
  const startProgress = useCallback(
    (badgeId: string) => {
      if (acquiredRef.current) return;
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        progressRef.current += 1; // 進むスピード
        setProgress(Math.floor(progressRef.current));

        if (progressRef.current >= 100) {
          clearInterval(timerRef.current!);
          handleSuccess(badgeId);
        }
      }, 40);
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
    // クリーンアップ関数を返して、アンマウント時に実行されるようにします
    return () => cleanupAR();
  }, [cleanupAR]);

  return {
    /** 起動状態 */
    status,
    /** 起動状態を更新する関数 */
    setStatus,
    /** 標本を発見中かどうか */
    isFound,
    /** 解析進捗 (0-100) */
    progress,
    /** 現在認識中の標本が獲得済みかどうか */
    acquired,
    /** 獲得成功画面の表示フラグ */
    showSuccess,
    /** 画面遷移（終了処理）中かどうか */
    isExiting,
    /** 現在認識中の標本データ */
    activeBadge,
    /** すべての標本データのリスト */
    allBadges,
    /** データの読み込みが完了したかどうか */
    isLoaded,
    /** 獲得済みの標本IDリスト */
    acquiredBadgeIds,
    /**
     * マーカー認識のリスナーを設定する関数
     * A-Frame のエンティティに対して、発見・見失い時のイベントを紐付けます。
     */
    setupListeners,
    /**
     * ホーム画面に戻る処理
     * ARのクリーンアップを実行した後に遷移します。
     */
    navigateHome: useCallback(() => {
      setIsExiting(true);
      cleanupAR();
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
    }, [cleanupAR]),
    /** 獲得成功画面の表示フラグを更新する関数 */
    setShowSuccess,
    /**
     * 標本の記念撮影（キャプチャ）を行う関数
     * ビデオ映像と3Dモデルを合成して画像を生成し、共有または保存します。
     */
    captureImage: useCallback(async () => {
      // a-scene 要素は A-Frame のカスタム要素であるため、必要なプロパティを持つことを想定します
      const sceneEl = document.querySelector("a-scene") as HTMLElement & {
        components: {
          screenshot: { getCanvas: (type: string) => HTMLCanvasElement };
        };
        renderer: { render: (scene: unknown, camera: unknown) => void };
        camera: unknown;
        object3D: unknown;
        canvas: HTMLCanvasElement;
      };
      const videoEl = document.querySelector("video");
      if (!sceneEl || !videoEl) {
        console.warn("🚫 キャプチャに必要な要素が見つかりません。");
        return;
      }

      try {
        // 1. キャンバスの準備（ビデオの解像度に合わせる）
        const canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 2. 背面のビデオ映像を描画
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        // 3. 前面のA-Frame（3Dモデル）を描画
        // renderer と camera が利用可能な場合にのみ実行
        if (sceneEl.renderer && sceneEl.camera) {
          // 重要：キャプチャ直前に現在の状態を強制的にレンダリングします
          // これにより preserveDrawingBuffer の制限や描画タイミングの問題を回避します
          sceneEl.renderer.render(sceneEl.object3D, sceneEl.camera);

          const aframeCanvas = sceneEl.canvas;
          if (aframeCanvas) {
            // A-Frameのキャンバスをビデオのサイズに合わせて合成
            ctx.drawImage(aframeCanvas, 0, 0, canvas.width, canvas.height);
          }
        }

        // 4. 保存または共有処理
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `specimen-${timestamp}.jpg`;

        // Canvas を Blob に変換
        canvas.toBlob(
          async (blob) => {
            if (!blob) return;

            // 共有機能（Web Share API）が使えるか確認
            const file = new File([blob], fileName, { type: "image/jpeg" });
            if (
              navigator.share &&
              navigator.canShare &&
              navigator.canShare({ files: [file] })
            ) {
              try {
                await navigator.share({
                  files: [file],
                  title: "標本の観察記録",
                  text: "ARで標本を撮影しました！",
                });
                console.log("📸 共有メニューを表示しました");
              } catch (shareError) {
                // ユーザーがキャンセルした場合は何もしない
                if ((shareError as Error).name !== "AbortError") {
                  console.error("🚫 共有に失敗しました:", shareError);
                }
              }
            } else {
              // フォールバック: 従来のダウンロード方式
              const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
              const link = document.createElement("a");
              link.download = fileName;
              link.href = dataUrl;
              link.click();
              console.log("📸 写真をダウンロードしました:", fileName);
            }
          },
          "image/jpeg",
          0.9,
        );
      } catch (e) {
        console.error("🚫 キャプチャの保存に失敗しました:", e);
      }
    }, []),
  };
};
