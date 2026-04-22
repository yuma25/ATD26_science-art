"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Move } from "lucide-react";
import { CloseButton } from "../../components/layout/CloseButton";

/**
 * model-viewer のためのプロパティ定義
 */
interface ModelViewerProps extends React.HTMLAttributes<HTMLElement> {
  src?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "shadow-intensity"?: string;
  "environment-image"?: string;
  exposure?: string;
  poster?: string;
}

/**
 * 型安全な model-viewer コンポーネント
 * React.createElement を使用することで JSX のパースエラーを確実に回避します
 */
const ModelViewer = (props: ModelViewerProps) => {
  return React.createElement("model-viewer", props);
};

function ModelViewerContent() {
  const searchParams = useSearchParams();
  const modelUrl = searchParams.get("model") || "/butterfly.glb";
  const name = searchParams.get("name") || "標本";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={{
        margin: 0,
        backgroundColor: "#f8fafc",
        height: "100vh",
        width: "100vw",
        position: "fixed",
      }}
    >
      {/* model-viewer の読み込み */}
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
      />

      {/* ヘッダー UI */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#3e2f28",
          }}
        >
          {name}
        </h1>
      </div>

      <CloseButton />

      {/* メイン 3D/AR ビューワー */}
      <ModelViewer
        src={modelUrl}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1.2"
        style={{ width: "100%", height: "100%" }}
      >
        {/* AR 起動ボタンのカスタマイズ */}
        <button
          slot="ar-button"
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "16px 40px",
            backgroundColor: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "50px",
            fontWeight: "bold",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Move size={20} /> 空間に配置する
        </button>

        {/* 読み込み中のプレビュー */}
        <div
          slot="poster"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#94a3b8",
            fontSize: "12px",
            fontWeight: "bold",
            letterSpacing: "0.2em",
          }}
        >
          INITIALIZING 3D SPECIMEN...
        </div>
      </ModelViewer>

      {/* 操作ガイド */}
      <div
        style={{
          position: "absolute",
          bottom: "110px",
          left: 0,
          right: 0,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            display: "inline-block",
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "8px 20px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "bold",
            backdropFilter: "blur(5px)",
          }}
        >
          ピンチで拡大、ドラッグで回転
        </p>
      </div>
    </div>
  );
}

export default function ModelViewerPage() {
  return (
    <Suspense fallback={null}>
      <ModelViewerContent />
    </Suspense>
  );
}
