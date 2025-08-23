import React, { useContext } from "react";
import { ThemeContext } from "../themeContext";
import { FiClock } from "react-icons/fi";

export default function AppConfigManager() {
  const { theme } = useContext(ThemeContext);

  return (
    <div
      style={{
        padding: 40,
        maxWidth: 600,
        margin: "auto",
        fontFamily: "'Inter', sans-serif",
        color: theme === "dark" ? "#eee" : "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        textAlign: "center",
        borderRadius: 12,
        backgroundColor: theme === "dark" ? "#1f2937" : "#f9fafb",
        boxShadow:
          theme === "dark"
            ? "0 6px 20px rgba(0,0,0,0.7)"
            : "0 6px 20px rgba(0,0,0,0.1)",
      }}
    >
      <FiClock size={72} style={{ marginBottom: 24, color: "#2563eb" }} />
      <h2 style={{ fontSize: 28, fontWeight: "700", marginBottom: 12 }}>
        Feature Coming Soon
      </h2>
      <p
        style={{
          fontSize: 18,
          maxWidth: 420,
          lineHeight: 1.5,
          color: theme === "dark" ? "#cbd5e1" : "#4b5563",
        }}
      >
        This configuration management tool is on its way. Stay tuned for
        powerful features that will give you more control over the app’s
        settings — without needing to write code.
      </p>
    </div>
  );
}
