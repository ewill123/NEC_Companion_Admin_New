import React from "react";
import { getRandomSnippet } from "../utils/getRandomSnippet";

export default function BackgroundAnimation() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          backgroundColor: "#121212",
          color: "#c5c8c6",
          fontFamily: "'Fira Code', monospace",
          fontSize: 14,
          lineHeight: 1.2,
          opacity: 0.06,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          padding: 20,
          whiteSpace: "pre-wrap",
          userSelect: "none",
        }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} style={{ animation: "fadeInOut 15s linear infinite" }}>
            {getRandomSnippet()}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.05; }
          70% { opacity: 0.15; }
        }
      `}</style>
    </>
  );
}
