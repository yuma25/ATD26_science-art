"use client";

import { useEffect, useState, useRef } from "react";
import { useAR } from "../../hooks/useAR";
import { DiscoveryComplete } from "../../components/ar/DiscoveryComplete";
import { CloseButton } from "../../components/layout/CloseButton";

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
    isLoaded,
    setupListeners,
    navigateHome,
    setShowSuccess,
  } = useAR();

  const [ready, setReady] = useState(false);

  const arContainerRef = useRef<HTMLDivElement>(null);

  // A-Frame / MindAR の型定義
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

  // 1. スクリプトの順次ロード
  useEffect(() => {
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
        await loadScript("https://aframe.io/releases/1.5.0/aframe.min.js");
        await loadScript(
          "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js",
        );
        await loadScript(
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
        );

        setReady(true);
        setStatus("started");
      } catch (e) {
        console.error("Initialization failed", e);
      }
    };
    init();
  }, [setStatus]);

  // 2. A-Frame シーンの動的生成 (PHOTO MODE と同じ手法)
  useEffect(() => {
    // 💡 修正：標本データのロード完了 (isLoaded) を待ってから注入を開始する
    if (status === "started" && ready && isLoaded && arContainerRef.current) {
      // 💡 修正：既に a-scene が存在する場合は再注入を避ける (二重注入による MindAR のクラッシュ防止)
      if (arContainerRef.current.querySelector("a-scene")) {
        console.log("⏭ AR Scene already exists, skipping injection.");
        return;
      }

      console.log("🛠 Injecting AR Scene HTML...");
      arContainerRef.current.innerHTML = "";

      // DBにデータがない場合のデフォルト
      const targetBadges =
        allBadges.length > 0
          ? allBadges
          : [
              {
                id: "default",
                target_index: 0,
                model_url: "/butterfly.glb",
                name: "Default",
              },
            ];

      // 💡 重複を除いたモデルのリストを作成
      const uniqueModels = Array.from(
        new Set(targetBadges.map((b) => b.model_url)),
      );

      const sceneHTML = `
        <a-scene 
          mindar-image="imageTargetSrc: /targets.mind; autoStart: false; uiLoading: no; uiScanning: no;" 
          color-space="sRGB" 
          renderer="colorManagement: true, physicallyCorrectLights: true, exposure: 1.5, alpha: true" 
          vr-mode-ui="enabled: false" 
          device-orientation-permission-ui="enabled: false" 
          loading-screen="enabled: false" 
          embedded 
          style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
        >
          <a-assets>
            ${uniqueModels.map((url, i) => `<a-asset-item id="model-${i}" src="${url}"></a-asset-item>`).join("")}
          </a-assets>

          <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

          <a-entity id="ghost" position="0 0 -0.8" visible="true">
            <a-gltf-model src="#model-0" scale="0.08 0.08 0.08" opacity="0.3" animation="property: rotation; to: 0 360 0; dur: 10000; easing: linear; loop: true"></a-gltf-model>
          </a-entity>

          ${targetBadges
            .map((badge) => {
              const modelIndex = uniqueModels.indexOf(badge.model_url);
              return `
              <a-entity mindar-image-target="targetIndex: ${badge.target_index}">
                <a-entity id="model-container-${badge.target_index}" visible="false">
                  <a-entity animation="property: rotation; to: 0 0 360; dur: 12000; easing: linear; loop: true">
                    <a-entity position="0.5 0 0.4">
                      <a-entity animation="property: rotation; from: 90 -20 -15; to: 90 20 15; dur: 4000; easing: easeInOutSine; dir: alternate; loop: true">
                        <a-gltf-model src="#model-${modelIndex}" scale="2.5 2.5 2.5" animation-mixer="clip: *; loop: repeat; timeScale: 1.2"></a-gltf-model>
                      </a-entity>
                    </a-entity>
                  </a-entity>
                </a-entity>
              </a-entity>
            `;
            })
            .join("")}
        </a-scene>
      `;

      arContainerRef.current.innerHTML = sceneHTML;

      const sceneEl = arContainerRef.current.querySelector(
        "a-scene",
      ) as AFrameScene;
      const boot = () => {
        if (sceneEl.systems?.["mindar-image-system"]) {
          console.log("🚀 Starting MindAR System...");
          sceneEl.systems["mindar-image-system"].start();
          setupListeners();
          setTimeout(() => window.dispatchEvent(new Event("resize")), 500);
        } else {
          console.log("⏳ Waiting for MindAR system to register...");
          setTimeout(boot, 200);
        }
      };

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
      {/* 1. AR シーン容器 */}
      <div ref={arContainerRef} style={{ width: "100%", height: "100%" }} />
      {/* 2. UI Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {(status === "loading" || status === "init") && (
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
              INITIALIZING VISION...
            </p>
          </div>
        )}

        {status === "started" && !isExiting && (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!isFound && !showSuccess && (
              <div
                style={{
                  position: "absolute",
                  top: "20%",
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

            {isFound && !acquired && !showSuccess && (
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .spinner { width: 40px; height: 40px; border: 2px solid rgba(62, 47, 40, 0.1); border-top: 2px solid #3e2f28; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        /* 背景ビデオを確実に表示させるための指定 */
        video { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; object-fit: cover !important; z-index: -10 !important; display: block !important; }
        canvas.a-canvas { background-color: transparent !important; }
      `,
        }}
      />

      <CloseButton onClick={navigateHome} />
    </div>
  );
}
