'use client';

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
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #0f1628 100%)',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'fixed',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        top: '-100px',
        right: '-100px',
        filter: 'blur(50px)',
        animation: 'float 8s ease-in-out infinite',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '20px',
          padding: '50px',
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.2), 0 0 40px rgba(139, 92, 246, 0.1)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '50px',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <p style={{
              margin: '0 0 8px 0',
              color: '#b0b0c9',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontWeight: '600'
            }}>Welcome back</p>
            <h1
              style={{
                color: '#ffffff',
                margin: 0,
                fontSize: '36px',
                fontWeight: '800'
              }}
            >
              {userData?.name}
            </h1>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '12px 32px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.25)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.15)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Sign Out
          </button>
        </div>

        {/* User Info Card */}
        <div
          style={{
            background: 'rgba(0, 255, 255, 0.05)',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '1px solid rgba(0, 255, 255, 0.15)',
          }}
        >
          <h3
            style={{
              color: '#00ffff',
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Account Details
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px',
            }}
          >
            <InfoItem label="Name" value={userData?.name || 'N/A'} />
            <InfoItem label="Email" value={userData?.email || 'N/A'} />
            <InfoItem label="Member Since" value={formatDate(userData?.createdAt)} />
            <InfoItem label="Last Login" value={formatDateTime(userData?.lastLogin)} />
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <StatCard title="Security Level" value="Maximum" />
          <StatCard title="Account Status" value="Active" />
          <StatCard title="Auth Method" value="Face ID" />
        </div>

        {/* Account Actions */}
        <div
          style={{
            background: 'rgba(0, 200, 200, 0.08)',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 200, 200, 0.2)',
          }}
        >
          <h4
            style={{
              margin: '0 0 15px 0',
              color: '#00ffff',
              fontSize: '16px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Quick Actions
          </h4>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <ActionButton
              label="Update Face"
              onClick={() => alert("Coming Soon!")}
            />

            <ActionButton
              label="Change Password"
              onClick={() => navigate("/change-password")}
            />

            <ActionButton
              label="View Activity"
              onClick={() => alert("Coming Soon!")}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            background: 'rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            borderRadius: '10px',
            textAlign: 'center',
            color: '#909090',
            fontSize: '13px',
          }}
        >
          <p style={{ margin: 0 }}>
            ✓ Your biometric data is encrypted end-to-end and never shared
          </p>
        </div>

      </div>
    </div>
  );
}

// Helper Component: Info Item
function InfoItem({ label, value }) {
  return (
    <div
      style={{
        padding: '15px',
        background: 'rgba(0, 255, 255, 0.08)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 255, 255, 0.15)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: '#909090',
          marginBottom: '8px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '15px',
          color: '#ffffff',
          fontWeight: '600',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Helper Component: Stat Card
function StatCard({ title, value }) {
  return (
    <div
      style={{
        padding: '20px',
        background: 'rgba(0, 255, 255, 0.08)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 255, 255, 0.15)',
        textAlign: 'center',
        transition: 'all 0.3s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(0, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'translateY(-5px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(0, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#909090',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#00ffff',
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
        padding: '12px 20px',
        background: 'rgba(0, 255, 255, 0.1)',
        color: '#00ffff',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
      onMouseOver={(e) => {
        e.target.style.background = 'rgba(0, 255, 255, 0.2)';
        e.target.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.target.style.background = 'rgba(0, 255, 255, 0.1)';
        e.target.style.transform = 'translateY(0)';
      }}
    >
      {label}
    </button>
  );
}

export default Dashboard;
