"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import { config } from "../config";

const API_URL = config.API_URL;
let socket = null;

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState("form"); // form, qr, success
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [, setSessionId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [, setCapturedFace] = useState(null);

  // Responsive
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (step === "qr" && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

    if (countdown === 0) {
      setError("QR code expired. Please try again.");
      setTimeout(() => {
        setStep("form");
        setCountdown(300);
      }, 2000);
    }
  }, [step, countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Generate session ID
      const session = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(session);

      // Create session on backend
      const response = await fetch(`${API_URL}/api/auth/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session,
          email: formData.email,
          password: formData.password,
          type: "register",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      // Generate QR URL
      const baseUrl = window.location.origin;
      const qrLink = `${baseUrl}/mobile-verify/${session}`;
      setQrUrl(qrLink);

      // Connect to Socket.IO
      if (!socket) {
        socket = io(API_URL);
      }

      // Emit QR generated event
      socket.emit("qr-generated", {
        sessionId: session,
        type: "register",
        email: formData.email,
      });

      // Listen for face capture
      socket.on("face-verified", (data) => {
        if (data.success && data.sessionId === session) {
          setCapturedFace(data.faceDescriptor);
          completeRegistration(data.faceDescriptor);
        } else {
          setError("Face capture failed. Please try again.");
          setStep("form");
        }
      });

      setStep("qr");
      setLoading(false);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to initialize registration");
      setLoading(false);
    }
  };

  const completeRegistration = async (faceDescriptor) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          faceDescriptor: faceDescriptor,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save token
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setStep("success");

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
        setStep("form");
      }
    } catch (err) {
      console.error("Registration completion error:", err);
      setError("Registration failed. Please try again.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    setStep("form");
    setSessionId("");
    setQrUrl("");
    setCountdown(300);
    setError("");
  };

  const copyQrLink = () => {
    navigator.clipboard.writeText(qrUrl);
    alert("Link copied to clipboard!");
  };

  const openQrLink = () => {
    window.open(qrUrl, "_blank");
  };

  return (
    <div style={styles.container}>
      {/* Background Effects */}
      <div style={styles.bgOrb1}></div>
      <div style={styles.bgOrb2}></div>

      {/* Main Card */}
      <div
        style={{
          ...styles.card,
          padding: isMobile
            ? "30px 20px"
            : isTablet
              ? "40px 30px"
              : "50px 40px",
          maxWidth: isMobile ? "95%" : isTablet ? "450px" : "500px",
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div
            style={{
              ...styles.logo,
              fontSize: isMobile ? "36px" : "48px",
            }}
          >
            📝
          </div>
          <h1
            style={{
              ...styles.title,
              fontSize: isMobile ? "24px" : isTablet ? "28px" : "32px",
            }}
          >
            {step === "form" && "Create Account"}
            {step === "qr" && "Scan QR Code"}
            {step === "success" && "Registration Successful!"}
          </h1>
          <p
            style={{
              ...styles.subtitle,
              fontSize: isMobile ? "12px" : "14px",
            }}
          >
            {step === "form" && "Register with AI-powered face authentication"}
            {step === "qr" && "Capture your face with mobile device"}
            {step === "success" && "Welcome to NeuroVerify!"}
          </p>
        </div>

        {/* Registration Form */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label
                style={{
                  ...styles.label,
                  fontSize: isMobile ? "12px" : "13px",
                }}
              >
                👤 Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                style={{
                  ...styles.input,
                  fontSize: isMobile ? "14px" : "15px",
                  padding: isMobile ? "12px 15px" : "14px 18px",
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label
                style={{
                  ...styles.label,
                  fontSize: isMobile ? "12px" : "13px",
                }}
              >
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                style={{
                  ...styles.input,
                  fontSize: isMobile ? "14px" : "15px",
                  padding: isMobile ? "12px 15px" : "14px 18px",
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label
                style={{
                  ...styles.label,
                  fontSize: isMobile ? "12px" : "13px",
                }}
              >
                🔑 Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
                minLength={6}
                style={{
                  ...styles.input,
                  fontSize: isMobile ? "14px" : "15px",
                  padding: isMobile ? "12px 15px" : "14px 18px",
                }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label
                style={{
                  ...styles.label,
                  fontSize: isMobile ? "12px" : "13px",
                }}
              >
                🔑 Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                style={{
                  ...styles.input,
                  fontSize: isMobile ? "14px" : "15px",
                  padding: isMobile ? "12px 15px" : "14px 18px",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  ...styles.error,
                  fontSize: isMobile ? "12px" : "13px",
                  padding: isMobile ? "10px" : "12px",
                }}
              >
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                fontSize: isMobile ? "14px" : "16px",
                padding: isMobile ? "12px" : "14px",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "⏳ Processing..." : "🚀 Continue to Face Capture"}
            </button>

            <div
              style={{
                ...styles.links,
                fontSize: isMobile ? "12px" : "13px",
                marginTop: isMobile ? "15px" : "20px",
              }}
            >
              <span>Already have an account? </span>
              <span onClick={() => navigate("/login")} style={styles.link}>
                🔐 Login Here
              </span>
            </div>
          </form>
        )}

        {/* QR Code Display */}
        {step === "qr" && (
          <div style={styles.qrContainer}>
            <div
              style={{
                ...styles.qrBox,
                padding: isMobile ? "15px" : "20px",
              }}
            >
              <QRCodeSVG
                value={qrUrl}
                size={isMobile ? 200 : isTablet ? 220 : 250}
                level="H"
                includeMargin={true}
                style={styles.qrCode}
              />
            </div>

            <div
              style={{
                ...styles.timer,
                fontSize: isMobile ? "14px" : "16px",
                marginTop: isMobile ? "12px" : "15px",
              }}
            >
              ⏱️ Expires in: <strong>{formatTime(countdown)}</strong>
            </div>

            <div
              style={{
                ...styles.instructions,
                fontSize: isMobile ? "12px" : "13px",
                padding: isMobile ? "12px" : "15px",
                marginTop: isMobile ? "15px" : "20px",
              }}
            >
              <p style={styles.instructionTitle}>📱 Scan with Mobile:</p>
              <ol style={styles.instructionList}>
                <li>Open camera app on your phone</li>
                <li>Scan this QR code</li>
                <li>Allow camera access</li>
                <li>Capture your face</li>
              </ol>
            </div>

            {/* 🔥 Clickable Link Section */}
            <div
              style={{
                ...styles.linkSection,
                marginTop: isMobile ? "15px" : "20px",
                padding: isMobile ? "12px" : "15px",
              }}
            >
              <p
                style={{
                  ...styles.linkTitle,
                  fontSize: isMobile ? "12px" : "13px",
                }}
              >
                💻 <strong>Using PC?</strong> Open this link:
              </p>

              <div
                style={{
                  ...styles.linkBox,
                  fontSize: isMobile ? "11px" : "12px",
                  padding: isMobile ? "10px" : "12px",
                  marginTop: "10px",
                }}
              >
                <code style={styles.linkCode}>{qrUrl}</code>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: isMobile ? "8px" : "10px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={openQrLink}
                  style={{
                    ...styles.actionBtn,
                    ...styles.openBtn,
                    flex: 1,
                    fontSize: isMobile ? "12px" : "13px",
                    padding: isMobile ? "10px 15px" : "12px 20px",
                  }}
                >
                  🔗 Open Link
                </button>

                <button
                  onClick={copyQrLink}
                  style={{
                    ...styles.actionBtn,
                    ...styles.copyBtn,
                    flex: 1,
                    fontSize: isMobile ? "12px" : "13px",
                    padding: isMobile ? "10px 15px" : "12px 20px",
                  }}
                >
                  📋 Copy Link
                </button>
              </div>
            </div>

            <button
              onClick={handleCancel}
              style={{
                ...styles.cancelBtn,
                fontSize: isMobile ? "13px" : "14px",
                padding: isMobile ? "10px 20px" : "12px 24px",
                marginTop: isMobile ? "15px" : "20px",
              }}
            >
              ← Back to Form
            </button>
          </div>
        )}

        {/* Success State */}
        {step === "success" && (
          <div style={styles.successContainer}>
            <div
              style={{
                ...styles.successIcon,
                fontSize: isMobile ? "60px" : "80px",
              }}
            >
              ✅
            </div>
            <p
              style={{
                ...styles.successText,
                fontSize: isMobile ? "16px" : "18px",
              }}
            >
              Registration Successful!
            </p>
            <p
              style={{
                ...styles.successSubtext,
                fontSize: isMobile ? "12px" : "14px",
              }}
            >
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10px, -20px) scale(1.05); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

/* ================================
   STYLES (Same as Login)
================================ */
const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #0f1628 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  bgOrb1: {
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
  },
  bgOrb2: {
    position: "fixed",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)",
    bottom: "-50px",
    left: "-50px",
    filter: "blur(40px)",
    animation: "float 10s ease-in-out infinite reverse",
    zIndex: 0,
    pointerEvents: "none",
  },
  card: {
    background:
      "linear-gradient(135deg, rgba(20, 24, 82, 0.9), rgba(30, 30, 70, 0.7))",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "24px",
    width: "100%",
    boxShadow:
      "0 25px 70px rgba(0, 0, 0, 0.5), 0 0 50px rgba(139, 92, 246, 0.2)",
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logo: {
    marginBottom: "15px",
    animation: "pulse 2s ease-in-out infinite",
  },
  title: {
    color: "#ffffff",
    fontWeight: "800",
    margin: "0 0 10px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#b0b0c9",
    margin: 0,
    lineHeight: "1.5",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    color: "#b0b0c9",
    fontWeight: "600",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "10px",
    color: "#ffffff",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
  },
  error: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    color: "#ef4444",
    marginBottom: "15px",
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontWeight: "700",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  links: {
    textAlign: "center",
    color: "#b0b0c9",
  },
  link: {
    color: "#8b5cf6",
    cursor: "pointer",
    transition: "color 0.3s ease",
  },
  qrContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  qrBox: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
  },
  qrCode: {
    display: "block",
  },
  timer: {
    color: "#00d4ff",
    fontWeight: "600",
    textAlign: "center",
  },
  instructions: {
    background: "rgba(0, 212, 255, 0.1)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "12px",
    width: "100%",
  },
  instructionTitle: {
    margin: "0 0 10px 0",
    color: "#00d4ff",
    fontWeight: "700",
  },
  instructionList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#b0b0c9",
    lineHeight: "2",
  },
  linkSection: {
    background: "rgba(139, 92, 246, 0.1)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "12px",
    width: "100%",
  },
  linkTitle: {
    margin: 0,
    color: "#8b5cf6",
    textAlign: "center",
  },
  linkBox: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
    borderRadius: "8px",
    wordBreak: "break-all",
  },
  linkCode: {
    color: "#00d4ff",
    fontFamily: "monospace",
  },
  actionBtn: {
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  openBtn: {
    background: "linear-gradient(135deg, #00d4ff, #6366f1)",
    color: "#000",
  },
  copyBtn: {
    background: "rgba(139, 92, 246, 0.2)",
    color: "#8b5cf6",
    border: "1px solid rgba(139, 92, 246, 0.4)",
  },
  cancelBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  successContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
  },
  successIcon: {
    marginBottom: "20px",
  },
  successText: {
    color: "#00d4ff",
    fontWeight: "700",
    margin: "0 0 10px 0",
  },
  successSubtext: {
    color: "#b0b0c9",
    margin: 0,
  },
};

export default Register;
