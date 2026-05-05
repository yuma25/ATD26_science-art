"use client";

/**
 * モジュールのインポート
 * 標本の型定義を読み込みます。
 */
import { Badge } from "@backend/types";

/**
 * SpecimenRegistrationLabelProps の説明：
 * @param activeBadge - 現在認識されている標本のデータ。認識されていない場合は null になります。
 * @param onClose - ラベルを閉じるための関数
 */
interface SpecimenRegistrationLabelProps {
  activeBadge: Badge | null;
  onClose: () => void;
}

/**
 * SpecimenRegistrationLabelコンポーネント本体
 * 博物館の標本ラベル（キャプション）のようなデザインのUIコンポーネントです。
 * AR画面で標本を認識している間、画面下部に表示されます。
 */
export const SpecimenRegistrationLabel = ({
  activeBadge,
  onClose,
}: SpecimenRegistrationLabelProps) => {
  // activeBadge が存在しない場合は、何も描画しません（早期リターン）
  if (!activeBadge) return null;

  return (
    <div
      onClick={onClose}
      style={{
        pointerEvents: "auto",
        cursor: "pointer",
        padding: "40px",
        background: "#fff",
        border: "1px solid #000",
        boxShadow: "20px 20px 0px rgba(0,0,0,0.1)",
        textAlign: "left",
        animation: "label-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        width: "85vw",
        maxWidth: "400px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 登録IDを表示（右上に小さく） */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 15,
          fontSize: "10px",
          opacity: 0.3,
          fontFamily: "monospace",
        }}
      >
        REG-ID: {activeBadge.id.slice(0, 8)}
      </div>

      {/* 標本名エリア */}
      <div
        style={{
          borderBottom: "2px solid #000",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "10px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            opacity: 0.5,
          }}
        >
          アーカイブへの記録を確認
        </p>
        <h2
          style={{
            margin: "5px 0 0",
            fontSize: "32px",
            fontWeight: "900",
            fontFamily: "serif",
            fontStyle: "italic",
          }}
        >
          {activeBadge.name}
        </h2>
      </div>

      {/* 詳細情報エリア（グリッドレイアウト） */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "8px",
              textTransform: "uppercase",
              fontWeight: "bold",
              opacity: 0.4,
            }}
          >
            分類
          </label>
          <p style={{ margin: 0, fontSize: "12px", fontFamily: "monospace" }}>
            デジタル標本
          </p>
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "8px",
              textTransform: "uppercase",
              fontWeight: "bold",
              opacity: 0.4,
            }}
          >
            状態
          </label>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#3b82f6",
            }}
          >
            保存済み
          </p>
        </div>
      </div>

      {/* 登録メタデータ（フッター的な情報） */}
      <div
        style={{
          marginTop: "30px",
          borderTop: "1px dashed #ccc",
          paddingTop: "20px",
          fontSize: "10px",
          fontFamily: "monospace",
          lineHeight: "1.6",
          opacity: 0.6,
        }}
      >
        日付: {new Date().toLocaleDateString()}
        <br />
        種別: AR再構成
        <br />
        場所: リモートノード
      </div>
    </div>
  );
};
