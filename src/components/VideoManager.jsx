import React, { useState, useEffect, useContext } from "react";
import VideoUploader from "./VideoUploader";
import VideoList from "./VideoList";
import { supabase } from "../supabaseClient";
import { ThemeContext } from "../themeContext";
import { FiLoader } from "react-icons/fi";

export default function VideoManager() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useContext(ThemeContext);

  const isDark = theme === "dark";
  const textColor = isDark ? "#f4f4f4" : "#1f2937";
  const bgColor = isDark ? "#111827" : "#ffffff";

  // Fetch videos from Supabase
  async function fetchVideos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("education_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error.message);
      setVideos([]);
    } else {
      setVideos(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "3rem auto",
        padding: "0 1rem",
        fontFamily: "'Inter', sans-serif",
        color: textColor,
        backgroundColor: bgColor,
        minHeight: "100vh",
      }}
    >
      <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 24 }}>
        🎥 Video Manager
      </h2>

      <section
        style={{
          backgroundColor: isDark ? "#1f2937" : "#f9fafb",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <VideoUploader onUploadComplete={fetchVideos} />
      </section>

      <section style={{ marginTop: 40 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              color: textColor,
              fontSize: 18,
            }}
          >
            <FiLoader className="spin" /> Loading videos...
          </div>
        ) : (
          <VideoList videos={videos} loading={loading} />
        )}
      </section>

      <style>
        {`
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </main>
  );
}
