import React, { useState, useContext } from "react";
import { storage } from "../firebaseConfig";
import { supabase } from "../supabaseClient";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from "react-hot-toast";
import { ThemeContext } from "../themeContext.jsx";

export default function VideoUploader({ onUploadComplete }) {
  const { theme } = useContext(ThemeContext);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const isDark = theme === "dark";
  const bgColor = isDark ? "#1f2937" : "#ffffff";
  const borderColor = isDark ? "#374151" : "#d1d5db";
  const inputBg = isDark ? "#111827" : "#f9fafb";
  const textColor = isDark ? "#f4f4f4" : "#1f2937";

  async function uploadVideo() {
    if (!file) {
      toast.error("Please select a video file");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a video title");
      return;
    }

    setUploading(true);
    setProgress(0);
    const toastId = toast.loading("Uploading video...");

    try {
      const uniqueFilename = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `education_videos/${uniqueFilename}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(percent);
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(storageRef);

      const { data: existingVideos, error: fetchError } = await supabase
        .from("education_videos")
        .select("id")
        .eq("url", downloadURL)
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingVideos && existingVideos.length > 0) {
        toast.dismiss(toastId);
        toast.error("This video was already uploaded.");
        setUploading(false);
        return;
      }

      const { error } = await supabase.from("education_videos").insert([
        {
          title: title.trim(),
          url: downloadURL,
          firebase_path: storageRef.fullPath,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.dismiss(toastId);
      toast.success("Video uploaded successfully!");
      setTitle("");
      setFile(null);
      setProgress(0);
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 14,
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease",
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h3 style={{ marginBottom: 16, fontSize: 22, fontWeight: 600 }}>
        📤 Upload New Educational Video
      </h3>

      <input
        type="text"
        placeholder="Video Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={uploading}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 14,
          borderRadius: 10,
          border: `1px solid ${borderColor}`,
          backgroundColor: inputBg,
          color: textColor,
          fontSize: 15,
        }}
      />

      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="file-upload"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 8,
            backgroundColor: "#10b981", // Emerald green
            color: "#fff",
            fontWeight: "bold",
            fontSize: 14,
            cursor: uploading ? "not-allowed" : "pointer",
            transition: "background 0.3s",
            marginRight: 12,
          }}
        >
          {file ? "Change File" : "Choose Video"}
        </label>

        <input
          id="file-upload"
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
          disabled={uploading}
          style={{ display: "none" }}
        />

        {file && (
          <span
            style={{
              fontSize: 14,
              color: isDark ? "#d1d5db" : "#374151",
              wordBreak: "break-word",
            }}
          >
            {file.name}
          </span>
        )}
      </div>

      {uploading && (
        <div
          style={{
            height: 10,
            width: "100%",
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: isDark ? "#374151" : "#e5e7eb",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, #4bb2d6, #00c9a7)`,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}

      <button
        onClick={uploadVideo}
        disabled={uploading}
        style={{
          padding: "12px 24px",
          borderRadius: 10,
          border: "none",
          backgroundColor: uploading ? "#6b7280" : "#2563eb",
          color: "white",
          fontWeight: "bold",
          fontSize: 16,
          cursor: uploading ? "not-allowed" : "pointer",
          transition: "background-color 0.3s ease",
        }}
      >
        {uploading ? `Uploading... (${progress}%)` : "Upload Video"}
      </button>
    </div>
  );
}
