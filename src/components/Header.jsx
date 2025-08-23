import React, { useContext } from "react";
import { ThemeContext } from "../themeContext";
import { MoonStar, SunMedium, LogOut, PhoneCall } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({ newCount, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const textColor = isDark ? "#F9FAFB" : "#111827";
  const bgColor = isDark ? "#1E1E2F" : "#FFFFFF";
  const borderColor = isDark ? "#2D2F40" : "#E5E7EB";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        height: 64,
        backgroundColor: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        fontFamily: "'Inter', sans-serif",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      {/* Logo and New Count Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: textColor,
            margin: 0,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          NEC Reports
        </h1>
        {newCount > 0 && (
          <span
            style={{
              backgroundColor: "#EF4444",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 9999,
              lineHeight: 1.2,
              animation: "pulse 1.5s infinite",
            }}
          >
            {newCount}
          </span>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Call Center Button */}
        <button
          onClick={() => navigate("/call-center")}
          title="Go to Call Center"
          style={{
            backgroundColor: "#2563EB",
            color: "#ffffff",
            border: "none",
            padding: "8px 14px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#1E40AF")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#2563EB")
          }
        >
          <PhoneCall size={18} />
          Call Center
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          style={{
            background: "none",
            border: "none",
            color: isDark ? "#FACC15" : "#1F2937",
            padding: 8,
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
          }}
        >
          {isDark ? <SunMedium size={20} /> : <MoonStar size={20} />}
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Logout"
          style={{
            backgroundColor: "#EF4444",
            color: "#ffffff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#DC2626")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#EF4444")
          }
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.85;
          }
        }

        button:focus {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
      `}</style>
    </header>
  );
}
