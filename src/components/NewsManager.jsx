// NewsManager.jsx
import React, { useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";
import { storage } from "../firebaseConfig"; // <-- Firebase storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  FiPlusCircle,
  FiTrash2,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
  FiFilter,
  FiImage,
  FiX,
} from "react-icons/fi";
import { ThemeContext } from "../themeContext";

export default function NewsManager() {
  const { theme } = useContext(ThemeContext);

  // Data
  const [news, setNews] = useState([]);
  // Form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // UI state
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState("all");

  // Theming
  const isDark = theme === "dark";
  const textColor = isDark ? "#f4f4f4" : "#1f2937";
  const bgColor = isDark ? "#111827" : "#ffffff";
  const borderColor = isDark ? "#374151" : "#d1d5db";
  const cardColor = isDark ? "#1f2937" : "#f9fafb";
  const secondaryText = isDark ? "#9ca3af" : "#4b5563";

  // ---- Fetch news ----
  const fetchNews = async () => {
    setLoading(true);
    let query = supabase
      .from("news")
      .select("id,title,description,image_url,created_at")
      .order("created_at", { ascending: false });

    if (filter === "today") {
      const today = new Date().toISOString().split("T")[0];
      query = query.gte("created_at", `${today}T00:00:00Z`);
    } else if (filter === "week") {
      const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      query = query.gte("created_at", oneWeekAgo);
    } else if (filter === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query = query.gte("created_at", oneMonthAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      setStatus({ type: "error", message: "Failed to fetch news." });
    } else {
      setNews(data || []);
      setStatus(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // ---- Upload image to Firebase ----
  const uploadImage = async (file) => {
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const filePath = `news-images/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, filePath);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get public URL
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Failed to upload image." });
      return null;
    }
  };

  // ---- Add news (with optional image) ----
  const addNews = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      setStatus({
        type: "error",
        message: "Please enter both title and description.",
      });
      return;
    }

    setSaving(true);
    setStatus({ type: "info", message: "Adding news..." });

    let imageUrl = null;
    if (newImage) {
      imageUrl = await uploadImage(newImage);
      if (!imageUrl) {
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("news").insert([
      {
        title: newTitle.trim(),
        description: newDescription.trim(),
        image_url: imageUrl,
      },
    ]);

    if (error) {
      setStatus({ type: "error", message: "Error adding news." });
    } else {
      setNewTitle("");
      setNewDescription("");
      setNewImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
      setStatus({ type: "success", message: "News added successfully!" });
      fetchNews();
    }

    setSaving(false);
  };

  // ---- Delete news (with image) ----
  const deleteNews = async (id, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this news item?"))
      return;

    setDeletingId(id);
    setStatus({ type: "info", message: "Deleting news..." });

    try {
      // 1️⃣ Delete image from Firebase if it exists
      if (imageUrl) {
        const path = imageUrl
          .split("https://staff-performance-appraisal.appspot.com/o/")[1]
          .split("?")[0]; // extract path from URL
        const decodedPath = decodeURIComponent(path);
        const imageRef = ref(storage, decodedPath);
        await deleteObject(imageRef);
      }

      // 2️⃣ Delete news from Supabase
      const { error } = await supabase.from("news").delete().eq("id", id);

      if (error) {
        setStatus({ type: "error", message: "Failed to delete news." });
      } else {
        setStatus({ type: "success", message: "News deleted successfully." });
        fetchNews();
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Error deleting news." });
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Status icon ----
  const renderStatusIcon = () => {
    switch (status?.type) {
      case "success":
        return <FiCheckCircle style={{ color: "green", marginRight: 8 }} />;
      case "error":
        return <FiAlertTriangle style={{ color: "crimson", marginRight: 8 }} />;
      case "info":
        return <FiInfo style={{ color: "#3b82f6", marginRight: 8 }} />;
      default:
        return null;
    }
  };

  // ---- Handle file input + preview ----
  const onPickImage = (file) => {
    if (!file) {
      setNewImage(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: "error", message: "Image must be under 5MB." });
      return;
    }
    setNewImage(file);
    const nextPreview = URL.createObjectURL(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(nextPreview);
  };

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "3rem auto",
        padding: "0 1rem",
        fontFamily: "'Inter', sans-serif",
        color: textColor,
      }}
    >
      {/* Header + Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 30, fontWeight: 700 }}>📰 News Manager</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FiFilter size={20} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${borderColor}`,
              fontSize: 14,
              background: bgColor,
              color: textColor,
            }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Add News Form */}
      <section style={{ marginBottom: 40 }}>
        <input
          placeholder="Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 10,
            borderRadius: 10,
            border: `1px solid ${borderColor}`,
            fontSize: 16,
            background: bgColor,
            color: textColor,
          }}
        />
        <textarea
          placeholder="Description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 10,
            borderRadius: 10,
            border: `1px solid ${borderColor}`,
            fontSize: 15,
            background: bgColor,
            color: textColor,
          }}
        />

        {/* Image picker + preview */}
        <div
          style={{
            border: `1px dashed ${borderColor}`,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: isDark ? "#0b1220" : "#f9fafb",
          }}
        >
          <FiImage />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickImage(e.target.files?.[0] || null)}
            style={{ flex: 1 }}
          />
          {imagePreview && (
            <div style={{ position: "relative" }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: 80,
                  height: 56,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: `1px solid ${borderColor}`,
                }}
              />
              <button
                onClick={() => onPickImage(null)}
                title="Remove"
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "crimson",
                  color: "white",
                  border: "none",
                  borderRadius: "9999px",
                  width: 22,
                  height: 22,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <FiX size={12} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={addNews}
          disabled={saving}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          {saving ? <FiLoader className="spin" /> : <FiPlusCircle />} Add News
        </button>

        {status && (
          <p
            style={{
              marginTop: 16,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color:
                status.type === "success"
                  ? "green"
                  : status.type === "error"
                    ? "crimson"
                    : "#2563eb",
            }}
          >
            {renderStatusIcon()} {status.message}
          </p>
        )}
      </section>

      {/* News Grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 24,
        }}
      >
        {loading ? (
          <p style={{ fontSize: 18, textAlign: "center" }}>Loading news...</p>
        ) : news.length === 0 ? (
          <p style={{ fontSize: 18, textAlign: "center" }}>
            No news items found.
          </p>
        ) : (
          news.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: cardColor,
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 12,
                    border: `1px solid ${borderColor}`,
                  }}
                  loading="lazy"
                />
              )}
              <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                {item.title}
              </h4>
              <p style={{ fontSize: 15, color: secondaryText }}>
                {item.description}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 16,
                }}
              >
                <time style={{ fontSize: 13, color: secondaryText }}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
                <button
                  onClick={() => deleteNews(item.id, item.image_url)}
                  disabled={deletingId === item.id}
                  style={{
                    backgroundColor: "crimson",
                    color: "white",
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  {deletingId === item.id ? (
                    <FiLoader className="spin" />
                  ) : (
                    <FiTrash2 />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))
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
