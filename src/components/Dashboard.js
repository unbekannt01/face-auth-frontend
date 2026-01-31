// frontend/src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "../config";
import AppLoader from "./AppLoader";

const API_URL = config.API_URL;

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      navigate("/login");
      return;
    }

    // Verify token and get user data
    axios
      .get(`${API_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUserData(response.data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Token verification failed:", error);
        // Clear everything on verification failure
        clearAllAuthData();
        navigate("/login");
      });
  }, [navigate]);

  //  Complete cleanup function
  const clearAllAuthData = () => {
    // Remove all auth-related items from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Clear all localStorage if needed (optional - uncomment if you want full clear)
    // localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    console.log(" All authentication data cleared");
  };

  const handleLogout = () => {
    setLoggingOut(true);

    // Show loading state briefly
    setTimeout(() => {
      clearAllAuthData();
      navigate("/login");
    }, 500);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Format datetime helper
  const formatDateTime = (dateString) => {
    if (!dateString) return "First time login";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (loading || loggingOut) return <AppLoader />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <h1
            style={{
              color: "#333",
              margin: 0,
              fontSize: "32px",
            }}
          >
            🎉 Welcome Back, {userData?.name}!
          </h1>

          <button
            onClick={handleLogout}
            style={{
              padding: "12px 30px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#d32f2f";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 12px rgba(244, 67, 54, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#f44336";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* User Info Card */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "30px",
            borderRadius: "15px",
            marginBottom: "25px",
            border: "2px solid #e9ecef",
          }}
        >
          <h3
            style={{
              color: "#667eea",
              marginBottom: "20px",
              fontSize: "22px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            👤 User Information
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            <InfoItem label="Name" value={userData?.name || "N/A"} icon="📝" />
            <InfoItem
              label="Email"
              value={userData?.email || "N/A"}
              icon="📧"
            />
            <InfoItem
              label="Registered On"
              value={formatDate(userData?.createdAt)}
              icon="📅"
            />
            <InfoItem
              label="Last Login"
              value={formatDateTime(userData?.lastLogin)}
              icon="🕐"
            />
          </div>
        </div>

        {/* Security Status */}
        <div
          style={{
            backgroundColor: "#e8f5e9",
            padding: "20px",
            borderRadius: "12px",
            border: "2px solid #81c784",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "32px" }}>🔐</span>
            <div>
              <h4
                style={{
                  margin: "0 0 5px 0",
                  color: "#2e7d32",
                  fontSize: "18px",
                }}
              >
                Face Authentication Enabled
              </h4>
              <p
                style={{
                  margin: 0,
                  color: "#388e3c",
                  fontSize: "14px",
                }}
              >
                Your account is secured with AI-powered facial recognition
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <StatCard
            icon="🛡️"
            title="Security Level"
            value="High"
            color="#4caf50"
          />
          <StatCard
            icon="👤"
            title="Account Status"
            value="Active"
            color="#2196f3"
          />
          <StatCard
            icon="🔑"
            title="Auth Method"
            value="Face ID"
            color="#ff9800"
          />
        </div>

        {/* Account Actions */}
        <div
          style={{
            backgroundColor: "#fff3e0",
            padding: "20px",
            borderRadius: "12px",
            border: "2px solid #ffb74d",
          }}
        >
          <h4
            style={{
              margin: "0 0 15px 0",
              color: "#e65100",
              fontSize: "18px",
            }}
          >
            📌 Quick Actions
          </h4>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <ActionButton
              label="🔄 Update Face Data"
              // onClick={() => alert("🚧 Under Development!")}
              onClick={() => navigate("/update-face")}
            />

            <ActionButton
              label="🔒 Change Password"
              onClick={() => navigate("/change-password")}
            />

            <ActionButton
              label="📊 View Activity"
              onClick={() => alert("🚧 Under Development!")}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "10px",
            textAlign: "center",
            color: "#666",
            fontSize: "14px",
          }}
        >
          <p style={{ margin: 0 }}>
            🔐 Your data is encrypted and secured. We never share your biometric
            information.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Component: Info Item
function InfoItem({ label, value, icon }) {
  return (
    <div
      style={{
        padding: "15px",
        backgroundColor: "white",
        borderRadius: "10px",
        border: "1px solid #e0e0e0",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#999",
          marginBottom: "5px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: "16px",
          color: "#333",
          fontWeight: "600",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Helper Component: Stat Card
function StatCard({ icon, title, value, color }) {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "12px",
        border: `2px solid ${color}20`,
        textAlign: "center",
        transition: "transform 0.3s",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.transform = "translateY(-5px)")
      }
      onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ fontSize: "36px", marginBottom: "10px" }}>{icon}</div>
      <div
        style={{
          fontSize: "14px",
          color: "#666",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          color: color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Helper Component: Action Button
function ActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        backgroundColor: "white",
        color: "#e65100",
        border: "2px solid #ffb74d",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "all 0.3s",
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = "#ffb74d";
        e.target.style.color = "white";
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = "white";
        e.target.style.color = "#e65100";
      }}
    >
      {label}
    </button>
  );
}

export default Dashboard;
