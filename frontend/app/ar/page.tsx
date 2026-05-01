/* eslint-disable */
"use client";

import { useEffect, useState, useRef } from "react";
import { useAR } from "@/hooks/useAR";
import { DiscoveryComplete } from "@/components/ar/DiscoveryComplete";
import { CloseButton } from "@/components/layout/CloseButton";
import { getSpecimenSettings } from "@backend/lib/constants";

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
        // 1. A-Frame (3Dエンジン)
        await loadScript("https://aframe.io/releases/1.5.0/aframe.min.js");
        // 2. A-Frame Extras (アニメーション再生用)
        await loadScript(
          "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js",
        );
        // 3. MindAR (画像認識・AR追従)
        await loadScript(
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
        );

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
        renderer="colorManagement: true, exposure: 1.2, alpha: true, antialias: true" 
        vr-mode-ui="enabled: false" 
        device-orientation-permission-ui="enabled: false" 
        loading-screen="enabled: false" 
        embedded 
        style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
      >
        <a-assets>
          ${allBadges.map((b) => `<a-asset-item id="model-item-${b.target_index}" src="${b.model_url}"></a-asset-item>`).join("")}
        </a-assets>
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        ${allBadges
          .map((badge) => {
            const settings = getSpecimenSettings(badge.name);
            const physicalIndex = badge.target_index;
            return `
            <a-entity mindar-image-target="targetIndex: ${physicalIndex}">
              <a-entity id="model-container-${physicalIndex}" visible="false">
                <a-entity animation="${settings.outerAnimation}">
                  <a-entity animation="${settings.innerAnimation}">
                    <a-gltf-model 
                      id="model-el-${physicalIndex}"
                      src="#model-item-${badge.target_index}" 
                      scale="${settings.scale}" 
                      animation-mixer="clip: *; loop: repeat; timeScale: 1.2"
                      data-min-scale="${settings.minScale}"
                      data-max-scale="${settings.maxScale}"
                    ></a-gltf-model>
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

      document.querySelectorAll("a-gltf-model").forEach((el) => {
        el.setAttribute("auto-scale", "");
      });
    };

    /**
     * ARエンジンの起動
     */
    const boot = () => {
      if (sceneEl.systems?.["mindar-image-system"]) {
        sceneEl.systems["mindar-image-system"].start();
        setupListeners(); // マーカー認識のリスナーを設定
        setupAutoScaling(); // 自動サイズ調整を設定
        // 画面サイズ変更イベントを走らせて表示を整える
        setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
      } else {
        setTimeout(boot, 200); // システムが準備できるまでリトライ
      }
    };

    if (sceneEl.hasLoaded) boot();
    else sceneEl.addEventListener("loaded", boot);
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
              SYNCHRONIZING ARCHIVE...
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
                  INDEX {activeBadge.target_index}: {activeBadge.name}
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
                  SCANNING FOR SPECIMENS...
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
                    ANALYZING {progress}%
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

      {/* 閉じるボタン */}
      <CloseButton onClick={navigateHome} />
    </div>
  );
}
