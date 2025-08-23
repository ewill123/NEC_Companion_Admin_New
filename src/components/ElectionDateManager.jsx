"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  FiCalendar,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import { ThemeContext } from "../themeContext";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ===== Textarea Style =====
const textAreaStyle = (dark) => ({
  width: "100%",
  padding: 12,
  fontSize: 15,
  borderRadius: 8,
  border: `1.5px solid ${dark ? "#475569" : "#cbd5e1"}`,
  backgroundColor: dark ? "#1e293b" : "#f9fafb",
  color: dark ? "#e0e7ff" : "#334155",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Inter', sans-serif",
});

// ===== Button Style =====
const buttonStyle = (dark, disabled, colorOverride) => ({
  marginTop: 0,
  backgroundColor: colorOverride ? colorOverride : "#2563eb",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  padding: "12px 28px",
  borderRadius: 10,
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  boxShadow: dark
    ? "0 4px 16px rgba(37, 99, 235, 0.7)"
    : "0 4px 16px rgba(37, 99, 235, 0.7)",
  transition: "background-color 0.3s ease",
});

// ===== Status Icon =====
const StatusIcon = ({ type }) => {
  if (!type) return null;
  const color =
    type === "success" ? "limegreen" : type === "error" ? "crimson" : "#3b82f6";
  const Icon =
    type === "success"
      ? FiCheckCircle
      : type === "error"
        ? FiAlertCircle
        : FiInfo;
  return <Icon size={18} color={color} />;
};

// ===== Production-Ready Component =====
export default function ElectionDateManager() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [date, setDate] = useState(null);
  const [electionDayMessage, setElectionDayMessage] = useState("");
  const [electionAfterMessage, setElectionAfterMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Fetch current config
  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("app_config")
        .select("key, value")
        .in("key", [
          "election_date",
          "electionDayMessage",
          "electionAfterMessage",
        ]);

      if (!isMounted) return;

      if (error) {
        setStatus({ type: "error", message: "Failed to load config" });
      } else {
        const config = Object.fromEntries(data.map((d) => [d.key, d.value]));
        setDate(config.election_date ? new Date(config.election_date) : null);
        setElectionDayMessage(config.electionDayMessage || "");
        setElectionAfterMessage(config.electionAfterMessage || "");
        setStatus(null);
      }
      setLoading(false);
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save config
  const handleSave = useCallback(async () => {
    if (!date) return setStatus({ type: "error", message: "Select a date" });
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    if (date < today)
      return setStatus({
        type: "error",
        message: "Election cannot be in the past",
      });

    setSaving(true);
    setStatus({ type: "info", message: "Saving..." });

    const updates = [
      { key: "election_date", value: date.toISOString().split("T")[0] },
      { key: "electionDayMessage", value: electionDayMessage },
      { key: "electionAfterMessage", value: electionAfterMessage },
    ];

    const { error } = await supabase.from("app_config").upsert(updates, {
      onConflict: "key",
    });

    setSaving(false);
    setStatus(
      error
        ? { type: "error", message: "Failed to save" }
        : { type: "success", message: "Configurations saved successfully!" }
    );

    // Auto-hide success message
    if (!error) {
      setTimeout(() => setStatus(null), 4000);
    }
  }, [date, electionDayMessage, electionAfterMessage]);

  // Delete election date
  const handleDeleteDate = useCallback(async () => {
    if (!date) return;

    if (!confirm("Are you sure you want to delete the election date?")) return;

    setSaving(true);
    setStatus({ type: "info", message: "Deleting election date..." });

    const { error: deleteError } = await supabase
      .from("app_config")
      .delete()
      .eq("key", "election_date");

    if (deleteError) {
      setStatus({ type: "error", message: "Failed to delete election date" });
    } else {
      setDate(null);
      setStatus({
        type: "success",
        message: "Election date deleted successfully!",
      });
      setTimeout(() => setStatus(null), 4000);
    }

    setSaving(false);
  }, [date]);

  // Progress calculation
  const now = new Date();
  const maxDays = 60;
  const daysLeft = date
    ? Math.max(Math.ceil((date - now) / (1000 * 60 * 60 * 24)), 0)
    : null;
  const progressPercent =
    daysLeft !== null
      ? Math.min(((maxDays - daysLeft) / maxDays) * 100, 100)
      : 0;

  const disabled = loading || saving;

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "3rem auto",
        padding: "2rem 2.5rem",
        backgroundColor: isDark ? "#121827" : "#fff",
        borderRadius: 12,
        boxShadow: isDark
          ? "0 6px 30px rgba(0,0,0,0.7)"
          : "0 6px 30px rgba(0,0,0,0.1)",
        color: isDark ? "#e0e7ff" : "#334155",
        fontFamily: "'Inter', sans-serif",
        userSelect: "none",
      }}
      aria-live="polite"
      aria-busy={loading || saving}
    >
      <h2
        style={{
          fontSize: 26,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
          color: isDark ? "#cbd5e1" : "#1e293b",
        }}
      >
        <FiCalendar />
        Set Election Date & Messages
      </h2>

      {loading ? (
        <p
          style={{
            fontStyle: "italic",
            fontSize: 16,
            color: isDark ? "#9ca3af" : "#6b7280",
          }}
        >
          Loading settings...
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          {/* Date Picker Section */}
          <section style={{ flex: "1 1 280px" }}>
            <label
              htmlFor="election-date-picker"
              style={{
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 12,
                display: "block",
                color: isDark ? "#cbd5e1" : "#334155",
              }}
            >
              Select Election Date
            </label>

            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              className={isDark ? "rdp-dark" : ""}
              modifiersClassNames={{
                selected: "rdp-selected",
                today: "rdp-today",
              }}
              disabled={disabled}
            />

            {date && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: isDark ? "#1e293b" : "#f9fafb",
                  boxShadow: isDark ? "0 0 12px #2563eb" : "0 0 12px #3b82f6",
                }}
                aria-live="polite"
                aria-atomic="true"
              >
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                  Election Date:{" "}
                  <time dateTime={date.toISOString()}>
                    {date.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </p>

                <p
                  style={{
                    margin: "8px 0 10px",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {daysLeft === 0
                    ? "Today is Election Day! 🎉"
                    : daysLeft > maxDays
                      ? `Election is in more than ${maxDays} days`
                      : `Days Left: ${daysLeft}`}
                </p>

                <div
                  style={{
                    height: 12,
                    width: "100%",
                    backgroundColor: isDark ? "#334155" : "#d1d5db",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={maxDays}
                  aria-valuenow={daysLeft !== null ? maxDays - daysLeft : 0}
                  aria-valuetext={`Time left to election: ${daysLeft} days`}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      backgroundColor: isDark ? "#2563eb" : "#3b82f6",
                      transition: "width 0.5s ease-in-out",
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Messages Section */}
          <section style={{ flex: "1 1 400px", minWidth: 280 }}>
            <label
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: isDark ? "#cbd5e1" : "#334155",
                display: "block",
              }}
            >
              Election Day Message
            </label>
            <textarea
              rows={3}
              value={electionDayMessage}
              onChange={(e) => setElectionDayMessage(e.target.value)}
              placeholder="Displayed on election day"
              style={textAreaStyle(isDark)}
              disabled={disabled}
            />

            <label
              style={{
                marginTop: 24,
                fontWeight: 600,
                fontSize: 16,
                color: isDark ? "#cbd5e1" : "#334155",
                display: "block",
              }}
            >
              After Election Message
            </label>
            <textarea
              rows={3}
              value={electionAfterMessage}
              onChange={(e) => setElectionAfterMessage(e.target.value)}
              placeholder="Displayed after election"
              style={textAreaStyle(isDark)}
              disabled={disabled}
            />

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button
                onClick={handleSave}
                disabled={disabled}
                style={buttonStyle(isDark, disabled)}
                aria-label="Save Election Configurations"
              >
                <FiSave size={20} />
                {saving ? "Saving..." : "Save Configurations"}
              </button>

              <button
                onClick={handleDeleteDate}
                disabled={disabled || !date}
                style={buttonStyle(
                  isDark,
                  disabled,
                  isDark ? "#dc2626" : "#ef4444"
                )}
                aria-label="Delete Election Date"
                type="button"
              >
                Delete Date
              </button>
            </div>

            {status && (
              <p
                role="alert"
                style={{
                  marginTop: 20,
                  fontWeight: 600,
                  fontSize: 15,
                  color:
                    status.type === "success"
                      ? "limegreen"
                      : status.type === "error"
                        ? "crimson"
                        : "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  userSelect: "text",
                }}
              >
                <StatusIcon type={status.type} /> {status.message}
              </p>
            )}
          </section>
        </div>
      )}

      <style>{`
        .rdp-dark {
          --rdp-background-color: #1e293b;
          --rdp-accent-color: #2563eb;
          --rdp-accent-hover-color: #1e40af;
          --rdp-text-color: #e0e7ff;
          --rdp-day-hover-background: #2563eb;
          --rdp-day-hover-text-color: white;
          --rdp-day-selected-background: #2563eb;
          --rdp-day-selected-text-color: white;
          --rdp-day-today-border-color: #3b82f6;
          --rdp-day-disabled-opacity: 0.3;
          border-radius: 10px;
          box-shadow: ${isDark ? "0 0 20px #3b82f6" : "none"};
        }
        .rdp-selected {
          border-radius: 10px !important;
        }
        .rdp-today {
          font-weight: 700;
        }
      `}</style>
    </main>
  );
}
