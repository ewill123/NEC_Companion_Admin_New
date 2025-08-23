import React, { useContext } from "react";
import { ThemeContext } from "../themeContext.jsx";
import { FaTrashAlt } from "react-icons/fa";

export default function VideoList({ videos, loading, onDeleteVideo }) {
  const { theme } = useContext(ThemeContext);

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading videos...</p>;
  }

  if (!videos.length) {
    return <p style={{ textAlign: "center" }}>No videos uploaded yet.</p>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxHeight: "60vh",
        overflowY: "auto",
        width: "100%",
      }}
    >
      {videos.map((video) => (
        <div
          key={video.id}
          style={{
            display: "flex",
            alignItems: "center",
            padding: 12,
            borderRadius: 8,
            backgroundColor: theme === "dark" ? "#1f1f1f" : "#fff",
            boxShadow:
              theme === "dark"
                ? "0 1px 4px rgba(255, 255, 255, 0.1)"
                : "0 1px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <video
            src={video.url}
            width={160}
            height={90}
            controls
            style={{ borderRadius: 8, marginRight: 16 }}
          />

          <div style={{ flexGrow: 1 }}>
            <h3
              style={{
                margin: 0,
                color: theme === "dark" ? "#eee" : "#111",
                fontSize: 18,
                wordBreak: "break-word",
              }}
              title={video.title}
            >
              {video.title}
            </h3>
            <small
              style={{
                color: theme === "dark" ? "#bbb" : "#555",
                fontSize: 12,
              }}
            >
              Uploaded: {new Date(video.created_at).toLocaleString()}
            </small>
          </div>

          {onDeleteVideo && (
            <button
              onClick={() => onDeleteVideo(video)}
              aria-label={`Delete video ${video.title}`}
              style={{
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                color: theme === "dark" ? "#ff6b6b" : "#d93025",
                fontSize: 20,
                marginLeft: 12,
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff3b3b")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color =
                  theme === "dark" ? "#ff6b6b" : "#d93025")
              }
            >
              <FaTrashAlt />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
