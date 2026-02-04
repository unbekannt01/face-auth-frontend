"use client";

// frontend/src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../config";
import AppLoader from "./AppLoader";

const API_URL = config.API_URL;

// Custom hook for responsive breakpoints
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    media.addEventListener("change", handler);
    setMatches(media.matches);
    return () => media.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showFaceConfirm, setShowFaceConfirm] = useState(false);

  const isMobile = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const user = response.data.user;

        // Merge with any additional data from localStorage (like faceUpdatedAt)
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = { ...user, ...localUser };

        setUserData(mergedUser);

        // Update localStorage with merged data
        localStorage.setItem("user", JSON.stringify(mergedUser));

        setLoading(false);
      })
      .catch((error) => {
        console.error("Token verification failed:", error);
        clearAllAuthData();
        navigate("/login");
      });
  }, [navigate]);

  const clearAllAuthData = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();
  };

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      clearAllAuthData();
      navigate("/login");
    }, 500);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never updated";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatExactDateTime = (dateString) => {
    if (!dateString) return "Never updated";

    try {
      return new Date(dateString).toLocaleString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60)
        return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
      if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      return formatDate(dateString);
    } catch {
      return "Unknown";
    }
  };

  if (loading || loggingOut) return <AppLoader />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #0f1628 100%)",
        padding: isMobile ? "20px 12px" : isTablet ? "28px 18px" : "40px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background orb */}
      <div
        style={{
          position: "fixed",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
          top: "-100px",
          right: "-100px",
          filter: "blur(50px)",
          animation: "float 8s ease-in-out infinite",
          zIndex: 0,
          pointerEvents: "none",
        }}
      ></div>

      {/* Main Card */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background:
            "linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          borderRadius: "20px",
          padding: isMobile ? "20px 16px" : isTablet ? "32px 24px" : "50px",
          boxShadow:
            "0 20px 60px rgba(139, 92, 246, 0.2), 0 0 40px rgba(139, 92, 246, 0.1)",
          backdropFilter: "blur(20px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isMobile ? "24px" : "40px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px 0",
                color: "#b0b0c9",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: "600",
              }}
            >
              Welcome back
            </p>
            <h1
              style={{
                color: "#ffffff",
                margin: 0,
                fontSize: isMobile ? "24px" : isTablet ? "28px" : "36px",
                fontWeight: "800",
              }}
            >
              {userData?.name}
            </h1>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: isMobile ? "10px 20px" : "12px 32px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.25)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.15)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Account Details Card */}
        <div
          style={{
            background: "rgba(0, 255, 255, 0.05)",
            padding: isMobile ? "18px 14px" : "30px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid rgba(0, 255, 255, 0.15)",
          }}
        >
          <h3
            style={{
              color: "#00ffff",
              marginBottom: "18px",
              fontSize: isMobile ? "15px" : "18px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Account Details
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                  ? "repeat(2, 1fr)"
                  : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: isMobile ? "10px" : "15px",
            }}
          >
            <InfoItem label="Name" value={userData?.name || "N/A"} />
            <InfoItem label="Email" value={userData?.email || "N/A"} />
            <InfoItem
              label="Member Since"
              value={formatDate(userData?.createdAt)}
            />
            <InfoItem
              label="Last Login"
              value={formatDateTime(userData?.lastLogin)}
            />
          </div>
        </div>

        {/* Face Authentication Status */}
        <div
          style={{
            backgroundColor: "#e8f5e9",
            padding: isMobile ? "14px" : "20px",
            borderRadius: "12px",
            border: "2px solid #81c784",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "10px" : "12px",
            }}
          >
            <span style={{ fontSize: isMobile ? "24px" : "32px" }}>🔐</span>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  margin: "0 0 4px 0",
                  color: "#2e7d32",
                  fontSize: isMobile ? "15px" : "18px",
                }}
              >
                Face Authentication Enabled
              </h4>
              <p
                style={{
                  margin: 0,
                  color: "#388e3c",
                  fontSize: isMobile ? "12px" : "14px",
                }}
              >
                Your account is secured with AI-powered facial recognition
              </p>
              {userData?.faceUpdatedAt && (
                <p
                  style={{
                    margin: "8px 0 0 0",
                    color: "#66bb6a",
                    fontSize: isMobile ? "11px" : "12px",
                    fontWeight: "600",
                  }}
                >
                  🕐 Last updated: {getRelativeTime(userData.faceUpdatedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(3, 1fr)"
              : "repeat(auto-fit, minmax(160px, 1fr))",
            gap: isMobile ? "8px" : "20px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            title="Security Level"
            value="Maximum"
            isMobile={isMobile}
          />
          <StatCard title="Account Status" value="Active" isMobile={isMobile} />
          <StatCard title="Auth Method" value="Face ID" isMobile={isMobile} />
        </div>

        {/* Quick Actions */}
        <div
          style={{
            background: "rgba(0, 200, 200, 0.08)",
            padding: isMobile ? "16px 14px" : "25px",
            borderRadius: "12px",
            border: "1px solid rgba(0, 200, 200, 0.2)",
          }}
        >
          <h4
            style={{
              margin: "0 0 14px 0",
              color: "#00ffff",
              fontSize: isMobile ? "13px" : "16px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Quick Actions
          </h4>
          <div
            style={{
              display: "flex",
              gap: isMobile ? "8px" : "10px",
              flexWrap: "wrap",
            }}
          >
            <ActionButton
              label="Update Face"
              // onClick={() => alert("Coming Soon!")}
              onClick={() => setShowFaceConfirm(true)}
              isMobile={isMobile}
            />

            <ActionButton
              label="Change Password"
              onClick={() => navigate("/change-password")}
              isMobile={isMobile}
            />
            <ActionButton
              label="View Activity"
              onClick={() => alert("Coming Soon!")}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div
          style={{
            marginTop: "24px",
            padding: isMobile ? "14px" : "20px",
            background: "rgba(0, 255, 255, 0.05)",
            border: "1px solid rgba(0, 255, 255, 0.1)",
            borderRadius: "10px",
            textAlign: "center",
            color: "#909090",
            fontSize: isMobile ? "12px" : "13px",
          }}
        >
          <p style={{ margin: 0 }}>
            ✓ Your biometric data is encrypted end-to-end and never shared
          </p>
        </div>
      </div>

      {showFaceConfirm && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={modalTitle}>🔐 Update Face Authentication</h3>

            <p style={modalText}>
              You last updated your face data on the following date & time:
            </p>

            <p style={modalDate}>
              {formatExactDateTime(userData?.faceUpdatedAt)}
            </p>

            <ul style={modalList}>
              <li>Ensure proper lighting</li>
              <li>Make sure your face is clearly visible</li>
              <li>Keep the camera stable</li>
            </ul>

            <p style={modalWarning}>
              ⚠️ After this process, your previous face data will be permanently
              replaced.
            </p>

            <div style={modalActions}>
              <button
                style={cancelBtn}
                onClick={() => setShowFaceConfirm(false)}
              >
                Cancel
              </button>

              <button
                style={confirmBtn}
                onClick={() => {
                  setShowFaceConfirm(false);
                  navigate("/update-face");
                }}
              >
                Yes, Update Now
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, -20px); }
        }
      `}</style>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────
function InfoItem({ label, value }) {
  return (
    <div
      style={{
        padding: "12px",
        background: "rgba(0, 255, 255, 0.08)",
        borderRadius: "8px",
        border: "1px solid rgba(0, 255, 255, 0.15)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#909090",
          marginBottom: "6px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#ffffff",
          fontWeight: "600",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatCard({ title, value, isMobile }) {
  return (
    <div
      style={{
        padding: isMobile ? "12px 6px" : "20px",
        background: "rgba(0, 255, 255, 0.08)",
        borderRadius: "12px",
        border: "1px solid rgba(0, 255, 255, 0.15)",
        textAlign: "center",
        transition: "all 0.3s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "rgba(0, 255, 255, 0.15)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "rgba(0, 255, 255, 0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          fontSize: isMobile ? "9px" : "12px",
          color: "#909090",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: isMobile ? "15px" : "20px",
          fontWeight: "bold",
          color: "#00ffff",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: isMobile ? "10px 14px" : "12px 20px",
        background: "rgba(0, 255, 255, 0.1)",
        color: "#00ffff",
        border: "1px solid rgba(0, 255, 255, 0.3)",
        borderRadius: "8px",
        fontSize: isMobile ? "12px" : "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.3s",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        flex: isMobile ? "1 1 0" : "none",
      }}
      onMouseOver={(e) => {
        e.target.style.background = "rgba(0, 255, 255, 0.2)";
        e.target.style.transform = "translateY(-2px)";
      }}
      onMouseOut={(e) => {
        e.target.style.background = "rgba(0, 255, 255, 0.1)";
        e.target.style.transform = "translateY(0)";
      }}
    >
      {label}
    </button>
  );
}
const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalBox = {
  background: "linear-gradient(135deg,#0f1628,#1a1a3e)",
  padding: "30px",
  borderRadius: "16px",
  maxWidth: "420px",
  width: "90%",
  border: "1px solid rgba(0,255,255,0.3)",
  boxShadow: "0 20px 60px rgba(0,255,255,0.3)",
};

const modalTitle = {
  margin: 0,
  marginBottom: "12px",
  color: "#00ffff",
  textAlign: "center",
};

const modalText = {
  color: "#b0b0c9",
  fontSize: "14px",
  textAlign: "center",
};

const modalDate = {
  textAlign: "center",
  color: "#00ffff",
  fontWeight: "700",
  marginBottom: "12px",
};

const modalList = {
  color: "#b0b0c9",
  fontSize: "13px",
  marginLeft: "20px",
  marginBottom: "12px",
};

const modalWarning = {
  color: "#fbbf24",
  fontSize: "13px",
  textAlign: "center",
  marginBottom: "16px",
};

const modalActions = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const cancelBtn = {
  flex: 1,
  padding: "10px",
  background: "rgba(239,68,68,0.15)",
  color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.3)",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "700",
};

const confirmBtn = {
  flex: 1,
  padding: "10px",
  background: "linear-gradient(135deg,#00ffff,#6366f1)",
  color: "#000",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "800",
};

export default Dashboard;
