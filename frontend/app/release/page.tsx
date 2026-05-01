"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { CloseButton } from "@/components/layout/CloseButton";
import { getSpecimenSettings } from "@backend/lib/constants";

/**
 * 【フォトモード画面】
 * 獲得した標本を現実世界に配置して、写真を撮影するための画面です。
 * 自由な角度や位置で標本を観察できます。
 */

/**
 * A-Frame シーン要素のための型定義
 */
interface ASceneElement extends HTMLElement {
  renderer: {
    render: (scene: unknown, camera: unknown) => void;
  };
  camera: unknown;
  object3D: unknown;
  canvas: HTMLCanvasElement;
  hasLoaded?: boolean;
}

function ReleaseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URLパラメータから標本の情報を取得します（デフォルトは蝶）
  const modelUrl = searchParams.get("model") || "/butterfly.glb";
  const name = searchParams.get("name") || "標本";

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState("init"); // 状態：init -> loading -> ready -> started
  const [isExiting, setIsExiting] = useState(false); // 終了アニメーション中か
  const [isCapturing, setIsCapturing] = useState(false); // 写真撮影中か

  const arContainerRef = useRef<HTMLDivElement>(null);
  const lastInjectedKeyRef = useRef("");

  /**
   * --- クリーンアップ処理 ---
   * ARシーンやカメラストリームを正しく終了させます。
   */
  const cleanupAR = () => {
    // 1. A-Frame シーンの停止と削除
    const sceneEl = document.querySelector("a-scene");
    if (sceneEl) {
      const scene = sceneEl as unknown as {
        systems?: { "mindar-image-system"?: { stop: () => void } };
      };
      if (scene.systems?.["mindar-image-system"]) {
        try {
          scene.systems["mindar-image-system"].stop();
        } catch {}
      }
      sceneEl.remove();
    }

    // 2. カメラストリームの停止とビデオ要素の削除
    document.querySelectorAll("video").forEach((v) => {
      const s = v.srcObject as MediaStream | null;
      if (s) s.getTracks().forEach((t) => t.stop());
      v.remove();
    });
  };

  /**
   * --- カメラ背景の設定 ---
   * デバイスのカメラ映像を背景として表示します。
   */
  const setupCameraBackground = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      video.style.position = "fixed";
      video.style.top = "0";
      video.style.left = "0";
      video.style.width = "100vw";
      video.style.height = "100vh";
      video.style.objectFit = "cover";
      video.style.zIndex = "-1";
      video.style.filter = "brightness(1.1)";
      document.body.appendChild(video);
      await video.play();
    } catch (e) {
      console.error("❌ カメラの起動に失敗しました", e);
    }
  };

  /**
   * --- ARライブラリの読み込み ---
   */
  const startAR = async () => {
    setStatus("loading");
    try {
      const load = (src: string) =>
        new Promise((res, rej) => {
          if (document.querySelector(`script[src="${src}"]`)) return res(true);
          const s = document.createElement("script");
          s.src = src;
          s.onload = () => res(true);
          s.onerror = rej;
          document.head.appendChild(s);
        });

      await load("https://aframe.io/releases/1.5.0/aframe.min.js");
      await load(
        "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js",
      );

      setStatus("ready");
    } catch (e) {
      console.error("❌ スクリプトの読み込みに失敗しました", e);
      setStatus("init");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    startAR();
    return () => cleanupAR();
  }, []);

  /**
   * --- 写真撮影機能 ---
   * 現在のカメラ映像とAR標本を合成して画像として保存します。
   */
  const takePhoto = async () => {
    if (isCapturing) return; // 二重撮影防止
    setIsCapturing(true);

    try {
      const sceneEl = document.querySelector("a-scene") as ASceneElement | null;
      const videoEl = document.querySelector("video");
      if (!sceneEl || !videoEl) return;

      // 1. A-Frame シーンを最新状態にレンダリング
      if (sceneEl.renderer && sceneEl.camera) {
        sceneEl.renderer.render(sceneEl.object3D, sceneEl.camera);
      }

      // 2. 合成用のキャンバスを作成
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 3. カメラ映像を描画
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // 4. 標本（ARシーン）を重ねて描画
      if (sceneEl.canvas) {
        ctx.drawImage(sceneEl.canvas, 0, 0, canvas.width, canvas.height);
      }

      // 5. 画像としてダウンロード
      const link = document.createElement("a");
      link.download = `Specimen_${name}_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("❌ 写真の保存に失敗しました", e);
    } finally {
      setTimeout(() => setIsCapturing(false), 800);
    }
  };

  /**
   * --- シーンの構築 ---
   */
  useEffect(() => {
    const currentKey = `${modelUrl}:${name}`;
    if (
      status === "ready" &&
      arContainerRef.current &&
      lastInjectedKeyRef.current !== currentKey
    ) {
      const settings = getSpecimenSettings(name);

      // ARシーン（A-Frame）をHTMLとして構築し、注入します
      arContainerRef.current.innerHTML = `
        <a-scene 
          embedded 
          renderer="colorManagement: true, exposure: 1.2, alpha: true, preserveDrawingBuffer: true, antialias: true"
          vr-mode-ui="enabled: false"
          device-orientation-permission-ui="enabled: false"
          loading-screen="enabled: false"
          style="width: 100%; height: 100%;"
        >
          <a-assets><a-asset-item id="m" src="${modelUrl}"></a-asset-item></a-assets>
          <a-entity camera look-controls="pointerLockEnabled: false" position="0 1.6 0"></a-entity>
          <a-light type="ambient" intensity="1.5"></a-light>
          <a-light type="directional" intensity="2.0" position="1 2 1"></a-light>
          
          <a-entity position="0 1.6 -2.5">
            <a-entity animation="${settings.outerAnimation}">
              <a-entity animation="${settings.innerAnimation}">
                <a-gltf-model src="#m" scale="${settings.scale}" animation-mixer="clip: *; loop: repeat; timeScale: 1.0"></a-gltf-model>
              </a-entity>
            </a-entity>
          </a-entity>
        </a-scene>
      `;

      lastInjectedKeyRef.current = currentKey;

      const sceneEl = arContainerRef.current.querySelector(
        "a-scene",
      ) as ASceneElement;
      const boot = () => {
        setupCameraBackground(); // カメラ映像を開始
        setStatus("started");
        setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
      };

      if (sceneEl.hasLoaded) boot();
      else sceneEl.addEventListener("loaded", boot);
    }
  }, [status, modelUrl, name]);

  if (!mounted) return null;

  return (
    <div
      style={{
        margin: 0,
        overflow: "hidden",
        height: "100vh",
        width: "100vw",
        backgroundColor: "transparent",
        position: "fixed",
        top: 0,
        left: 0,
        fontFamily: "sans-serif",
      }}
    >
      {/* 終了時のオーバーレイ */}
      {isExiting && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5000,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="spinner"></div>
        </div>
      )}

      {/* 初期ロード画面 */}
      {(status === "loading" || status === "ready") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#fdfaf2",
            color: "#3e2f28",
          }}
        >
          <div className="spinner"></div>
          <h1
            style={{
              fontSize: "10px",
              fontWeight: "900",
              marginTop: "20px",
              letterSpacing: "0.4em",
              opacity: 0.5,
            }}
          >
            SYNCHRONIZING ARCHIVE...
          </h1>
        </div>
      )}

      {/* ARシーンコンテナ */}
      <div
        ref={arContainerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* 操作UI */}
      {status === "started" && !isExiting && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "30px",
              zIndex: 1000,
            }}
          >
            {/* シャッターボタン */}
            <button
              onClick={takePhoto}
              disabled={isCapturing}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                border: "6px solid rgba(59, 130, 246, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                transition: "all 0.2s",
              }}
              className={
                isCapturing ? "scale-90 opacity-50" : "active:scale-95"
              }
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: isCapturing ? "#3b82f6" : "#fff",
                  border: "2px solid #eee",
                }}
              ></div>
            </button>
          </div>
          {/* モード表示 */}
          <div
            style={{
              position: "absolute",
              top: "30px",
              left: "30px",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: "8px 15px",
                borderRadius: "15px",
                backdropFilter: "blur(10px)",
              }}
            >
              <Sparkles size={16} className="text-blue-400" strokeWidth={1.5} />
              <span
                style={{
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "0.1em",
                }}
              >
                PHOTO MODE
              </span>
            </div>
          </div>
        </>
      )}

      {/* 撮影時のフラッシュエフェクト */}
      {isCapturing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#fff",
            zIndex: 2000,
            animation: "flash 0.5s forwards",
          }}
        ></div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes flash { from { opacity: 1; } to { opacity: 0; } }
        .spinner { width: 30px; height: 30px; border: 1px solid #eee; border-top: 1px solid #3e2f28; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        video { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; object-fit: cover !important; z-index: -10 !important; display: block !important; }
        canvas.a-canvas { background-color: transparent !important; }
      `,
        }}
      />

      {/* 閉じるボタン */}
      <CloseButton
        onClick={() => {
          setIsExiting(true);
          cleanupAR();
          setTimeout(() => {
            router.back();
          }, 300);
        }}
      />
    </div>
  );
}

export default function ReleasePage() {
  return (
    <Suspense fallback={null}>
      <ReleaseContent />
    </Suspense>
  );
}
