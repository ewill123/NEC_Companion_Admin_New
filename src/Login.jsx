import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (authError || !authData?.user) {
      setError("Invalid credentials. Please try again.");
      return;
    }

    const userId = authData.user.id;

    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", userId)
        .single();

      if (roleError) {
        console.error(roleError);
        setError("Could not fetch user role. Contact admin.");
        return;
      }

      const role = roleData?.role || "call_center";
      localStorage.setItem("user_role", role);
      onLogin();
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred. Try again.");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        backgroundImage: "url('/back.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Optional subtle overlay to improve contrast */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.25)", // dark overlay for contrast
          zIndex: 0,
        }}
      />

      <form
        onSubmit={handleLogin}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          padding: "40px 50px",
          borderRadius: 20,
          backgroundColor: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src="/NEC.jpeg"
            alt="NEC Logo"
            style={{
              width: 80,
              height: 80,
              objectFit: "contain",
              marginBottom: 15,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
            }}
          />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              marginBottom: 6,
            }}
          >
            Master Admin Panel
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#eee",
              fontWeight: 500,
            }}
          >
            Manage and monitor NEC Mobile App backend securely
          </p>
        </div>

        <label
          htmlFor="email"
          style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: 16,
            outline: "none",
            backgroundColor: "rgba(255,255,255,0.25)",
            color: "#fff",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.15)",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#4caf50")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.3)")}
        />

        <label
          htmlFor="password"
          style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: 16,
            outline: "none",
            backgroundColor: "rgba(255,255,255,0.25)",
            color: "#fff",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.15)",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#4caf50")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.3)")}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px 0",
            borderRadius: 14,
            border: "none",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            backgroundColor: loading ? "#99c2ff" : "#4caf50",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 15px rgba(76, 175, 80, 0.5)",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "#388e3c";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = "#4caf50";
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {error && (
          <p
            style={{
              marginTop: 10,
              fontSize: 14,
              fontWeight: 600,
              color: "#ff5252",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
