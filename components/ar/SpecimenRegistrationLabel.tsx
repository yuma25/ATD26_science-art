"use client";

import { Badge } from "../../backend/types";

interface SpecimenRegistrationLabelProps {
  activeBadge: Badge | null;
  onClose: () => void;
}

export const SpecimenRegistrationLabel = ({
  activeBadge,
  onClose,
}: SpecimenRegistrationLabelProps) => {
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
        REG-ID: {activeBadge?.id.slice(0, 8)}
      </div>

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
          Archive Entry Confirmed
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
          {activeBadge?.name}
        </h2>
      </div>

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
            Classification
          </label>
          <p style={{ margin: 0, fontSize: "12px", fontFamily: "monospace" }}>
            Digital Specimen
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
            Status
          </label>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontFamily: "monospace",
              color: "#3b82f6",
            }}
          >
            PRESERVED
          </p>
        </div>
      </div>

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
        DATE: {new Date().toLocaleDateString()}
        <br />
        TYPE: AR-RECONSTRUCTION
        <br />
        LOCATION: REMOTE_NODE
      </div>
    </div>
  );
};
