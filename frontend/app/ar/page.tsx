/* eslint-disable */
"use client";

import { useEffect, useState, useRef } from "react";
import { useAR } from "@/hooks/useAR";
import { DiscoveryComplete } from "@/components/ar/DiscoveryComplete";
import { CloseButton } from "@/components/layout/CloseButton";
import { getSpecimenSettings } from "@backend/lib/constants";
import { Camera } from "lucide-react";

/**
 * 【ARカメラ画面】
 * スマートフォンのカメラを使用して、現実世界に3D標本を重ねて表示します。
 * MindAR と A-Frame を組み合わせて、マーカー追従を実現しています。
 */
export default function ARPage() {
  // --- カスタムフックからARの状態と関数を取得 ---
  const {
    status, // ARの起動状況（loading, started 等）
    setStatus, // 起動状況を更新する関数
    isFound, // 標本がカメラに映っているか
    progress, // 標本の解析進捗（0-100%）
    acquired, // すでに獲得済みの標本か
    showSuccess, // 獲得成功メッセージを表示するか
    isExiting, // 画面を閉じている最中か
    activeBadge, // 現在カメラが捉えている標本
    allBadges, // 全標本データ
    isLoaded, // データ読み込みが完了したか
    setupListeners, // マーカーの認識イベントを設定する関数
    navigateHome, // ホーム画面に戻る関数
    setShowSuccess, // 成功メッセージの表示を切り替える関数
    captureImage, // キャプチャを実行する関数
  } = useAR();

  const [ready, setReady] = useState(false); // スクリプトの読み込み完了フラグ
  const arContainerRef = useRef<HTMLDivElement>(null); // A-Frameシーンを注入するコンテナ
  const lastInjectedDataHashRef = useRef(""); // 二重注入防止用のハッシュ保持

  // A-Frameシーンの型定義
  interface AFrameScene extends HTMLElement {
    systems?: {
      "mindar-image-system"?: {
        start: () => void;
        stop: () => void;
        controller?: unknown;
      };
    };
    hasLoaded?: boolean;
  }

  /**
   * --- 外部ライブラリの読み込み ---
   * A-Frame や MindAR などの重いライブラリを、必要な時だけ動的に読み込みます。
   */
  useEffect(() => {
    // スクリプトを読み込む補助関数
    const loadScript = (src: string) =>
      new Promise((res) => {
        if (document.querySelector(`script[src="${src}"]`)) return res(true);
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => res(true);
        document.head.appendChild(s);
      });

    const init = async () => {
      setStatus("loading");
      try {
        // 1. 基本ライブラリ
        await loadScript("https://aframe.io/releases/1.5.0/aframe.min.js");
        await loadScript(
          "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js",
        );
        // 2. ARエンジン
        await loadScript(
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
        );
        // 3. デコーダーの読み込み
        await loadScript(
          "https://unpkg.com/meshoptimizer@0.21.0/meshopt_decoder.js",
        );
        await loadScript(
          "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js",
        );

        // --- デコーダーの強制注入パッチ ---
        const win = window as any;
        const AFRAME = win.AFRAME;

        if (AFRAME && AFRAME.THREE) {
          const THREE = AFRAME.THREE;

          // Meshopt デコーダーの準備
          let readyDecoder = win.MeshoptDecoder;
          if (typeof readyDecoder === "function")
            readyDecoder = await readyDecoder();
          if (readyDecoder && readyDecoder.ready) await readyDecoder.ready;

          if (THREE.GLTFLoader) {
            const patchLoader = (loader: any) => {
              if (readyDecoder) loader.setMeshoptDecoder(readyDecoder);
              if ((THREE as any).DRACOLoader) {
                const dracoLoader = new (THREE as any).DRACOLoader();
                dracoLoader.setDecoderPath(
                  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
                );
                loader.setDRACOLoader(dracoLoader);
              }
            };

            const originalLoad = THREE.GLTFLoader.prototype.load;
            THREE.GLTFLoader.prototype.load = function (...args: any[]) {
              patchLoader(this);
              return originalLoad.apply(this, args);
            };

            if (typeof THREE.GLTFLoader.setMeshoptDecoder === "function") {
              THREE.GLTFLoader.setMeshoptDecoder(readyDecoder);
            }
          }
        }

        await new Promise((r) => setTimeout(r, 300));
        setReady(true);
        setStatus("started");
      } catch (e) {
        console.error("❌ ライブラリの初期化に失敗しました", e);
      }
    };
    init();
  }, [setStatus]);

  /**
   * --- ARシーンの構築と注入 ---
   * 標本データに基づいて、A-Frame の HTML タグを生成し、DOMに注入します。
   */
  useEffect(() => {
    // 1. 準備が整っているか確認（早期リターン）
    if (
      status !== "started" ||
      !ready ||
      !isLoaded ||
      allBadges.length === 0 ||
      !arContainerRef.current
    ) {
      return;
    }

    // 2. データの変更があるか確認（不要な再描画を防止）
    const currentDataHash = JSON.stringify(
      allBadges.map((b) => `${b.target_index}:${b.model_url}`),
    );
    const existingScene = arContainerRef.current.querySelector("a-scene");
    if (existingScene && lastInjectedDataHashRef.current === currentDataHash) {
      return;
    }

    // 3. 既存のシーンをクリーンアップ
    if (existingScene) {
      try {
        const sceneEl = existingScene as any;
        if (sceneEl.systems?.["mindar-image-system"])
          sceneEl.systems["mindar-image-system"].stop();
      } catch (e) {}
      arContainerRef.current.innerHTML = "";
    }

    lastInjectedDataHashRef.current = currentDataHash;
    const v = Date.now(); // キャッシュ回避用のクエリパラメータ

    // 4. ARシーンのHTMLを組み立てます
    const sceneHTML = `
      <a-scene 
        mindar-image="imageTargetSrc: /targets.mind?v=${v}; autoStart: false; uiLoading: no; uiScanning: no; maxTrack: 1; filterMinCF: 0.001; filterBeta: 10; missTolerance: 0;" 
        color-space="sRGB" 
        renderer="exposure: 1.0; alpha: true; antialias: true; physicallyCorrectLights: true; preserveDrawingBuffer: true;" 
        vr-mode-ui="enabled: false" 
        device-orientation-permission-ui="enabled: false" 
        loading-screen="enabled: false" 
        embedded 
        style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
      >
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        <!-- 物理ベースライティングへの対応 -->
        <a-light type="ambient" intensity="0.2"></a-light>
        <a-light type="directional" intensity="0.4" position="1 2 1"></a-light>

        ${allBadges
          .map((badge) => {
            const settings = getSpecimenSettings(badge.name);
            const physicalIndex = badge.target_index;

            // パラメータの取得
            const pos = settings.position || "0 0 0";
            const rot = settings.rotation || "0 0 0";
            const mixer =
              settings.animationMixer ||
              "clip: *; loop: repeat; timeScale: 1.2";

            return `
            <a-entity mindar-image-target="targetIndex: ${physicalIndex}">
              <a-entity id="model-container-${physicalIndex}" visible="false">
                  <a-entity animation="${settings.outerAnimation}">
                  <a-entity animation="${settings.innerAnimation}">
                    <a-gltf-model 
                      class="ar-model"
                      id="model-el-${physicalIndex}"
                      src="${badge.model_url}?v=${v}" 
                      scale="${settings.scale}" 
                      position="${pos}"
                      rotation="${rot}"
                      animation-mixer="${settings.animationMixer || "clip: *; loop: repeat;"}"
                      data-min-scale="${settings.minScale}"
                      data-max-scale="${settings.maxScale}"
                    ></a-gltf-model>
                    ${
                      badge.name === "ヤドカリ"
                        ? `
                        <!-- ヤドカリ専用の追従ライト（さらに強化） -->
                        <a-light type="point" intensity="2.5" distance="15" position="0 3 0"></a-light>
                        <a-light type="spot" intensity="2.0" position="0 6 0" rotation="-90 0 0"></a-light>
                      `
                        : ""
                    }
                  </a-entity>
                </a-entity>
              </a-entity>
            </a-entity>
          `;
          })
          .join("")}
      </a-scene>
    `;

    // 5. DOMに注入
    arContainerRef.current.innerHTML = sceneHTML;
    const sceneEl = arContainerRef.current.querySelector(
      "a-scene",
    ) as AFrameScene;

    /**
     * オートスケーリング機能：カメラとの距離に応じて標本の大きさを自動調整します
     */
    const setupAutoScaling = () => {
      const aframe = (window as any).AFRAME;
      if (!aframe || aframe.components["auto-scale"]) return;

      aframe.registerComponent("auto-scale", {
        init: function () {
          (this as any).cameraEl = document.querySelector("a-camera");
          (this as any).cameraPos = new (window as any).THREE.Vector3();
          (this as any).targetPos = new (window as any).THREE.Vector3();
        },
        tick: function () {
          const self = this as any;
          if (!self.cameraEl) return;

          self.cameraEl.object3D.getWorldPosition(self.cameraPos);
          self.el.object3D.getWorldPosition(self.targetPos);
          const distance = self.cameraPos.distanceTo(self.targetPos);

          const minS = parseFloat(self.el.getAttribute("data-min-scale"));
          const maxS = parseFloat(self.el.getAttribute("data-max-scale"));

          let factor = (distance - 0.5) / 2.5;
          factor = Math.min(Math.max(factor, 0), 1);

          const currentS = minS + (maxS - minS) * factor;
          self.el.object3D.scale.set(currentS, currentS, currentS);
        },
      });

      document.querySelectorAll(".ar-model").forEach((el) => {
        el.setAttribute("auto-scale", "");
      });
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
        setupListeners(); // マーカー認識のリスナーを設定
        setupAutoScaling(); // 自動サイズ調整を設定
        // 画面サイズ変更イベントを走らせて表示を整える
        setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
      } else {
        setTimeout(boot, 200); // システムが準備できるまでリトライ
      }
    };

    // 全てのモデルの準備が整うのを待つ
    const models = sceneEl.querySelectorAll(".ar-model");
    let loadedCount = 0;
    if (models.length > 0) {
      models.forEach((m) => {
        m.addEventListener("model-loaded", () => {
          loadedCount++;
          if (loadedCount === models.length) boot();
        });
      });
      // フォールバック（ネットワーク遅延などで model-loaded が遅れた場合）
      setTimeout(() => {
        boot();
      }, 8000);
    } else {
      if (sceneEl.hasLoaded) boot();
      else sceneEl.addEventListener("loaded", boot);
    }
  }, [status, ready, isLoaded, allBadges, setupListeners]);

  return (
    <div
      style={{
        backgroundColor: "transparent",
        minHeight: "100vh",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {/* ARシーンが注入される場所 */}
      <div ref={arContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* UIオーバーレイ領域 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* ローディング画面 */}
        {(!ready || !isLoaded || allBadges.length === 0) && (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#fdfaf2",
              pointerEvents: "auto",
            }}
          >
            <div className="spinner"></div>
            <p
              style={{
                marginTop: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                opacity: 0.5,
              }}
            >
              アーカイブ同期中...
            </p>
          </div>
        )}

        {/* スキャン中・解析中のUI */}
        {status === "started" &&
          isLoaded &&
          allBadges.length > 0 &&
          !isExiting && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* デバッグ用：見つかった標本の情報 */}
              {isFound && activeBadge && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    padding: "4px 8px",
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    fontSize: "9px",
                  }}
                >
                  標本番号 {activeBadge.target_index}: {activeBadge.name}
                </div>
              )}

              {/* スキャン中の案内 */}
              {!isFound && !showSuccess && (
                <div
                  style={{
                    position: "absolute",
                    top: "25%",
                    padding: "12px 24px",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "bold",
                    borderRadius: "4px",
                  }}
                >
                  標本をスキャン中...
                </div>
              )}

              {/* 解析プログレスバー */}
              {isFound && !acquired && !showSuccess && activeBadge && (
                <div style={{ width: "220px", textAlign: "center" }}>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "900",
                      marginBottom: "12px",
                    }}
                  >
                    解析中 {progress}%
                  </div>
                  <div
                    style={{
                      height: "6px",
                      width: "100%",
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: "#fff",
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 獲得成功時のモーダル */}
              {showSuccess && activeBadge && (
                <div style={{ pointerEvents: "auto" }}>
                  <DiscoveryComplete
                    badgeName={activeBadge.name}
                    onClose={() => setShowSuccess(false)}
                  />
                </div>
              )}
            </div>
          )}
      </div>

      {/* スタイル定義 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .spinner { width: 40px; height: 40px; border: 2px solid rgba(62, 47, 40, 0.1); border-top: 2px solid #3e2f28; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        /* MindAR が生成するビデオ要素を全画面に強制 */
        video { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; object-fit: cover !important; z-index: -10 !important; display: block !important; }
        canvas.a-canvas { background-color: transparent !important; }
      `,
        }}
      />

      {/* シャッターボタン (画面下部中央) */}
      {status === "started" && !isExiting && (
        <div
          style={{
            position: "fixed",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={captureImage}
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              border: "4px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Take Photo"
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3e2f28",
              }}
            >
              <Camera size={28} strokeWidth={1.5} />
            </div>
          </button>
        </div>
      )}

      {/* 閉じるボタン */}
      <CloseButton onClick={navigateHome} />
    </div>
  );
}
