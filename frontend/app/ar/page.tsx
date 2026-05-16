/* eslint-disable */
"use client";

import { useEffect, useState, useRef } from "react";
import { useAR } from "@/hooks/useAR";
import { DiscoveryComplete } from "@/components/ar/DiscoveryComplete";
import { CloseButton } from "@/components/layout/CloseButton";
import { getSpecimenSettings } from "@backend/lib/constants";
import { Camera } from "lucide-react";
import type { Badge } from "@backend/types";

/**
 * 【ARカメラ画面】
 * スマートフォンのカメラを使用して、現実世界に3D標本を重ねて表示します。
 *
 * 技術スタック:
 * - A-Frame: 3Dレンダリング
 * - MindAR: 画像認識（マーカー追従）
 * - Web Share API: 写真の共有
 */
export default function ARPage() {
  const {
    status,
    setStatus,
    isFound,
    progress,
    acquired,
    showSuccess,
    isExiting,
    activeBadge,
    allBadges,
    acquiredBadgeIds,
    isLoaded,
    setupListeners,
    navigateHome,
    setShowSuccess,
    captureImage,
  } = useAR();

  const arContainerRef = useRef<HTMLDivElement>(null);
  const lastInjectedDataHashRef = useRef<string>("");
  const [isClient, setIsClient] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

  // マウント時にクライアントサイドであることをフラグ立て
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 1. 外部ライブラリ (A-Frame, extras, MindAR) の動的ロード
  useEffect(() => {
    if (!isClient) return;

    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        document.head.appendChild(script);
      });
    };

    const initScripts = async () => {
      setStatus("loading");
      try {
        // A-Frame 本体のロード
        await loadScript("https://aframe.io/releases/1.5.0/aframe.min.js");
        // アニメーション等の拡張
        await loadScript(
          "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js",
        );
        // MindAR 本体のロード
        await loadScript(
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
        );

        // 圧縮モデル用のデコーダー設定
        await loadScript(
          "https://unpkg.com/meshoptimizer@0.21.0/meshopt_decoder.js",
        );
        await loadScript(
          "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js",
        );

        // デコーダーを A-Frame に紐付け
        const win = window as any;
        const AFRAME = win.AFRAME;
        if (AFRAME && AFRAME.THREE) {
          const THREE = AFRAME.THREE;
          let MeshoptDecoder = win.MeshoptDecoder;

          if (typeof MeshoptDecoder === "function") {
            MeshoptDecoder = await MeshoptDecoder();
          }

          if (MeshoptDecoder && MeshoptDecoder.ready) {
            await MeshoptDecoder.ready;
          }

          // GLTFLoader にデコーダーを注入
          if (THREE.GLTFLoader) {
            const originalLoad = THREE.GLTFLoader.prototype.load;
            THREE.GLTFLoader.prototype.load = function (
              this: any,
              ...args: any[]
            ) {
              if (MeshoptDecoder) {
                this.setMeshoptDecoder(MeshoptDecoder);
              }
              if (THREE.DRACOLoader) {
                const dracoLoader = new THREE.DRACOLoader();
                dracoLoader.setDecoderPath(
                  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
                );
                this.setDRACOLoader(dracoLoader);
              }
              return originalLoad.apply(this, args);
            };

            // Meshopt専用の注入（最新のA-Frame/Three.js用）
            if (typeof THREE.GLTFLoader.setMeshoptDecoder === "function") {
              THREE.GLTFLoader.setMeshoptDecoder(MeshoptDecoder);
            }
          }
        }

        // ロード完了待ち
        await new Promise((resolve) => setTimeout(resolve, 300));
        setIsSceneReady(true);
        setStatus("started");
      } catch (e) {
        console.error("❌ ライブラリの初期化に失敗しました", e);
      }
    };

    initScripts();
  }, [isClient, setStatus]);

  // 2. AR シーンの動的生成
  useEffect(() => {
    if (!isSceneReady || !isClient || !isLoaded || allBadges.length === 0) {
      return;
    }

    if (!arContainerRef.current) {
      console.warn("🚫 AR Container not ready.");
      return;
    }

    // 2. データの変更があるか確認（不要な再描画を防止）
    const currentDataHash = JSON.stringify(
      allBadges.map((b: Badge) => `${b.target_index}:${b.model_url}`),
    );
    const existingScene = arContainerRef.current.querySelector("a-scene");
    if (existingScene && lastInjectedDataHashRef.current === currentDataHash) {
      return;
    }

    // 既存シーンがあれば削除して再構築
    if (existingScene) {
      try {
        const mindarSystem = (existingScene as any).systems?.[
          "mindar-image-system"
        ];
        if (mindarSystem) mindarSystem.stop();
      } catch (e) {}
      arContainerRef.current.innerHTML = "";
    }

    lastInjectedDataHashRef.current = currentDataHash;
    const sceneId = Date.now();

    // 標本ごとのエンティティを生成
    const entitiesHtml = allBadges
      .map((badge: Badge) => {
        const settings = getSpecimenSettings(badge.name);
        const physicalIndex = badge.target_index;

        // パラメータの取得
        const pos = settings.position || "0 0 0";
        const rot = settings.rotation || "0 0 0";
        const scale = settings.scale || "0.3 0.3 0.3";
        const innerAnim = settings.innerAnimation || "";
        const outerAnim = settings.outerAnimation || "";

        return `
        <a-entity mindar-image-target="targetIndex: ${physicalIndex}">
          <!-- マーカーごとにコンテナを作成。初期状態は非表示(visible:false) -->
          <a-entity id="model-container-${physicalIndex}" visible="false">
             <!-- 外側の回転・揺れアニメーション -->
             <a-entity animation="${outerAnim}">
               <!-- モデル本体。内側の浮遊アニメーション -->
               <a-gltf-model 
                 src="${badge.model_url}"
                 position="${pos}" 
                 rotation="${rot}" 
                 scale="${scale}"
                 animation="${innerAnim}"
               ></a-gltf-model>
             </a-entity>
          </a-entity>
        </a-entity>
      `;
      })
      .join("\n");

    const sceneHtml = `
      <a-scene 
        id="scene-${sceneId}"
        mindar-image="imageTargetSrc: /targets.mind; autoStart: false; uiLoading: no; uiError: no; uiScanning: no;" 
        color-space="sRGB" 
        renderer="colorManagement: true, physicallyCorrectLights: true, preserveDrawingBuffer: true, antialias: true, alpha: true" 
        vr-mode-ui="enabled: false" 
        device-orientation-permission-ui="enabled: false"
        embedded
        style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
      >
        <a-assets>
          <!-- アセットの事前ロード（任意） -->
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" cursor="fuse: false; rayOrigin: mouse;" raycaster="far: ${10000}; objects: .clickable"></a-camera>

        <!-- 物理ベースライティングへの対応 -->
        <a-light type="ambient" intensity="0.2"></a-light>
        <a-light type="directional" intensity="0.4" position="1 2 1"></a-light>

        ${entitiesHtml}
      </a-scene>
    `;

    // シーンを挿入
    arContainerRef.current.innerHTML = sceneHtml;

    // シーン要素を取得
    const sceneEl = arContainerRef.current.querySelector("a-scene") as any;

    /**
     * マーカー追従の精度を高める自動スケーリング
     */
    const setupAutoScaling = () => {
      const video = document.querySelector("video");
      if (!video) return;

      const updateScale = () => {
        const vw = video.clientWidth;
        const vh = video.clientHeight;
        if (vw === 0 || vh === 0) return;

        // 全てのモデルコンテナに適用
        allBadges.forEach((b) => {
          const container = document.querySelector(
            `#model-container-${b.target_index}`,
          );
          if (container) {
            // 必要に応じて物理サイズに合わせたスケール微調整をここで行う
          }
        });
      };

      window.addEventListener("resize", updateScale);
      video.addEventListener("loadedmetadata", updateScale);
    };

    /**
     * ARエンジンの起動
     */
    let isBooted = false;
    const boot = () => {
      if (isBooted) return;
      if (sceneEl.systems?.["mindar-image-system"]) {
        isBooted = true;
        sceneEl.systems["mindar-image-system"].start();

        /**
         * 再生マーク（▶️）対策:
         * 1. MutationObserver でビデオ要素の追加を監視
         * 2. 発見次第、即座に playsinline / muted を設定
         */
        const fixVideo = (video: HTMLVideoElement) => {
          video.setAttribute("playsinline", "");
          video.setAttribute("webkit-playsinline", "");
          video.setAttribute("autoplay", "");
          video.muted = true;
          video.play().catch((e) => console.warn("Video play failed:", e));
        };

        const existingVideo = document.querySelector("video");
        if (existingVideo) fixVideo(existingVideo);

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeName === "VIDEO") {
                fixVideo(node as HTMLVideoElement);
              }
            });
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // 💡 修正: DOMのパース待ちとして少し遅延させてからリスナーを設定
        setTimeout(() => {
          setupListeners();
          setupAutoScaling();
        }, 300);

        // 画面サイズ変更イベントを走らせて表示を整える
        setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
      } else {
        setTimeout(boot, 200); // システムが準備できるまでリトライ
      }
    };

    // シーンのロード完了を待って起動
    if (sceneEl.hasLoaded) {
      boot();
    } else {
      sceneEl.addEventListener("loaded", boot);
    }
  }, [isSceneReady, isClient, isLoaded, allBadges, setupListeners]);

  // ローディング表示
  if (!isClient) return null;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none touch-none">
      {/* 1. ARレンダリング用コンテナ */}
      <div
        ref={arContainerRef}
        className="absolute inset-0 w-full h-full z-10"
      />

      {/* 2. UIオーバーレイ */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center">
        {/* ローディング状態 */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em]">
              Initializing AR System...
            </p>
          </div>
        )}

        {/* スキャン中 UI */}
        {status === "started" && !showSuccess && (
          <div className="w-full h-full flex flex-col items-center justify-between p-8 pt-20 pb-40">
            {/* 上部メッセージ */}
            <div className="text-center space-y-2">
              <div className="inline-block px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  {isFound ? "Analyzing Specimen..." : "Scan Painting"}
                </p>
              </div>
              {!isFound && (
                <p className="text-white/40 text-[8px] uppercase tracking-widest animate-pulse">
                  絵画にカメラを向けてください
                </p>
              )}
            </div>

            {/* 下部の進捗バー（解析中のみ表示） */}
            {isFound && !acquired && (
              <div className="w-full max-w-[280px] space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-white text-[10px] font-black italic tracking-tighter">
                    {activeBadge?.name}
                  </span>
                  <span className="text-white font-mono text-[10px]">
                    {progress}%
                  </span>
                </div>
                <div className="h-[6px] w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* 下部：すでに持っている場合のメッセージ */}
            {isFound && acquired && (
              <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-white text-[10px] font-bold uppercase tracking-widest">
                  標本データ取得済み
                </p>
              </div>
            )}
          </div>
        )}

        {/* 獲得成功時のモーダル */}
        {showSuccess && activeBadge && (
          <div className="h-full w-full flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
            <DiscoveryComplete
              badgeName={activeBadge.name}
              artistName={activeBadge.artist}
              isLast={
                allBadges.length > 0 &&
                acquiredBadgeIds.length === allBadges.length
              }
              onClose={() => setShowSuccess(false)}
            />
          </div>
        )}
      </div>

      {/* 3. アクションボタン（シャッター） */}
      {status === "started" && !showSuccess && (
        <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center px-8">
          <button
            onClick={captureImage}
            className="w-16 h-16 bg-white/10 backdrop-blur-xl border-4 border-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-2xl group pointer-events-auto"
          >
            <div
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center transition-colors group-hover:bg-white/80"
              style={{
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              <Camera size={28} strokeWidth={1.5} className="text-black" />
            </div>
          </button>
        </div>
      )}

      {/* 閉じるボタン */}
      <CloseButton onClick={navigateHome} />

      {/* スタイル定義 */}
      <style jsx global>{`
        .a-canvas {
          width: 100% !important;
          height: 100% !important;
        }
        /* MindARが生成するビデオ要素を背景に固定 */
        video {
          object-fit: cover !important;
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 0 !important;
        }
      `}</style>
    </div>
  );
}
