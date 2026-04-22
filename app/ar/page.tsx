"use client";

import { useEffect } from "react";
import { useAR } from "../../hooks/useAR";
import { DiscoveryComplete } from "../../components/ar/DiscoveryComplete";
import { CloseButton } from "../../components/layout/CloseButton";

export default function ARPage() {
  const {
    status,
    isFound,
    progress,
    acquired,
    showSuccess,
    isExiting,
    activeBadge,
    arContainerRef,
    startAR,
    navigateHome,
    setShowSuccess,
  } = useAR();

  // マウント時に自動で AR を開始
  useEffect(() => {
    startAR();
  }, [startAR]);

  return (
    <div
      style={{
        margin: 0,
        overflow: "hidden",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#000",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* 1. AR コンテナ */}
      <div
        ref={arContainerRef}
        style={{ width: "100%", height: "100%", position: "absolute" }}
      />

      {/* 2. 読み込み中オーバーレイ */}
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
          }}
        >
          <div className="spinner"></div>
          <h1
            style={{
              fontSize: "10px",
              fontWeight: "900",
              marginTop: "20px",
              letterSpacing: "0.4em",
              color: "#3e2f28",
              opacity: 0.5,
            }}
          >
            SYNCING VISION
          </h1>
        </div>
      )}

      {/* 3. 終了・退席アニメーション */}
      {isExiting && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 500,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="spinner"></div>
        </div>
      )}

      {/* 4. スキャン中の UI 演出 */}
      {status === "started" && !isExiting && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* ターゲット未検出時のヒント */}
          {!isFound && !showSuccess && (
            <div
              style={{
                position: "absolute",
                top: "15%",
                padding: "10px 30px",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                fontSize: "10px",
                fontWeight: "bold",
                letterSpacing: "0.3em",
                textShadow: "0 2px 10px #000",
              }}
            >
              LOCATING TARGET...
            </div>
          )}

          {/* 解析中のプログレスバー */}
          {isFound && !acquired && !showSuccess && (
            <div style={{ width: "200px", textAlign: "center" }}>
              <div
                style={{
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "900",
                  marginBottom: "10px",
                  letterSpacing: "0.2em",
                  textShadow: "0 2px 10px #000",
                }}
              >
                ANALYZING {progress}%
              </div>
              <div
                style={{
                  height: "4px",
                  width: "100%",
                  background: "rgba(255,255,255,0.2)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "#fff",
                    transition: "width 0.1s",
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* 読み取り成功時の演出（新UI） */}
          {showSuccess && activeBadge && (
            <DiscoveryComplete
              badgeName={activeBadge.name}
              onClose={() => setShowSuccess(false)}
            />
          )}
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .spinner { width: 30px; height: 30px; border: 1px solid #eee; border-top: 1px solid #3e2f28; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        video { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; z-index: -1 !important; filter: grayscale(0.2) brightness(1.1) contrast(1.1) !important; }
      `,
        }}
      />

      {/* 5. 終了ボタン */}
      <CloseButton onClick={navigateHome} />
    </div>
  );
}
