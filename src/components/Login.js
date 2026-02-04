"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import io from "socket.io-client";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { config } from "../config";

const socket = io(config.API_URL);

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

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionId] = useState(uuidv4());
  const [showQR, setShowQR] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!showQR) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.clear();
    }

    socket.on("face-verification-complete", async (data) => {
      if (data.sessionId === sessionId) {
        if (data.success) {
          setStatus("✓ Face verified! Logging in...");
          setLoading(true);

          try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const response = await axios.post(
              `${config.API_URL}/api/auth/login/complete`,
              {
                sessionId: sessionId,
              },
            );

            localStorage.setItem("authToken", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            navigate("/dashboard");
          } catch (error) {
            setStatus("✗ Login failed. Please try again.");
            setLoading(false);
          }
        } else {
          setStatus("✗ Face verification failed");
          setLoading(false);
        }
      }
    });

    return () => socket.off("face-verification-complete");
  }, [sessionId, navigate, showQR]);

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus("✗ Please fill all fields");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("✗ Invalid email format");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    if (password.length < 6) {
      setStatus("✗ Password must be at least 6 characters");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    try {
      setLoading(true);

      const validateResponse = await axios.post(
        `${config.API_URL}/api/auth/login/initiate`,
        {
          email: email.toLowerCase(),
          password,
        },
      );

      if (validateResponse.data.success) {
        console.log(
          "[Login] ✓ Credentials valid! Session ID:",
          validateResponse.data.sessionId,
        );

        // Now create session with validated credentials
        const sessionResponse = await axios.post(
          `${config.API_URL}/api/session/create`,
          {
            sessionId,
            email: email.toLowerCase(),
            password,
            type: "login",
          },
        );

        if (sessionResponse.data.success) {
          setShowQR(true);
          setStatus("✓ Credentials verified! Scan QR code with mobile");
          setLoading(false);

          socket.emit("qr-generated", {
            sessionId,
            type: "login",
            email: email.toLowerCase(),
          });
        }
      }
    } catch (error) {
      setLoading(false);
      console.error("[Login] ✗ Error:", error);

      // Check for specific error messages
      let errorMsg = "Failed to login. Please try again.";

      if (error.response?.status === 401) {
        errorMsg = "Invalid email or password";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setStatus("✗ " + errorMsg);

      setTimeout(() => {
        setStatus("");
      }, 4000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading && !showQR) {
      handleLogin();
    }
  };
  
  const qrData = `${config.APP_URL}/mobile-verify/${sessionId}`;
  // Responsive QR size
  const qrSize = isMobile ? 180 : isTablet ? 200 : 220;

  return (
    <div style={styles.container}>
      {/* Background Elements */}
      <div
        style={{
          ...styles.bgBlob1,
          width: isMobile ? "300px" : "500px",
          height: isMobile ? "300px" : "500px",
        }}
      ></div>
      <div
        style={{
          ...styles.bgBlob2,
          width: isMobile ? "250px" : "400px",
          height: isMobile ? "250px" : "400px",
        }}
      ></div>

      <div
        style={{
          ...styles.card,
          padding: isMobile
            ? "30px 20px"
            : isTablet
              ? "40px 30px"
              : "50px 40px",
          maxWidth: isMobile ? "100%" : "420px",
          margin: isMobile ? "0 16px" : "0",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            ...styles.backBtn,
            top: isMobile ? "15px" : "20px",
            left: isMobile ? "15px" : "20px",
            fontSize: isMobile ? "11px" : "12px",
            padding: isMobile ? "6px 12px" : "8px 15px",
          }}
        >
          ← Back
        </button>

        <div
          style={{
            ...styles.header,
            marginBottom: isMobile ? "20px" : "30px",
            marginTop: isMobile ? "20px" : "0",
          }}
        >
          <div
            style={{
              ...styles.headerIcon,
              fontSize: isMobile ? "32px" : "40px",
              marginBottom: isMobile ? "10px" : "15px",
            }}
          >
            ⬡
          </div>
          <h2
            style={{
              ...styles.title,
              fontSize: isMobile ? "22px" : isTablet ? "25px" : "28px",
            }}
          >
            Sign In
          </h2>
          <p
            style={{
              ...styles.subtitle,
              fontSize: isMobile ? "12px" : "14px",
            }}
          >
            to your NeuroVerify account
          </p>
        </div>

        {!showQR ? (
          <div style={styles.formContainer}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{
                ...styles.input,
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? "13px" : "14px",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#00d4ff")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(0, 212, 255, 0.2)")
              }
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={{
                ...styles.input,
                padding: isMobile ? "12px 14px" : "14px 16px",
                fontSize: isMobile ? "13px" : "14px",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#00d4ff")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(0, 212, 255, 0.2)")
              }
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                ...styles.signInBtn,
                opacity: loading ? 0.6 : 1,
                padding: isMobile ? "12px" : "14px",
                fontSize: isMobile ? "14px" : "16px",
              }}
            >
              {loading ? "⏳ Verifying..." : "Sign In with Face ID"}
            </button>
          </div>
        ) : (
          <div
            style={{
              ...styles.qrContainer,
              padding: isMobile ? "15px" : "20px",
            }}
          >
            <p
              style={{
                ...styles.qrLabel,
                fontSize: isMobile ? "12px" : "14px",
                marginBottom: isMobile ? "12px" : "15px",
              }}
            >
              Scan to Verify Your Face
            </p>
            <div
              style={{
                ...styles.qrBox,
                padding: isMobile ? "12px" : "15px",
              }}
            >
              <QRCodeSVG
                value={qrData}
                size={qrSize}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p
              style={{
                ...styles.qrInstructions,
                fontSize: isMobile ? "11px" : "13px",
                marginBottom: isMobile ? "15px" : "20px",
              }}
            >
              Open your phone camera and point it at this code
            </p>
            <button
              onClick={() => {
                setShowQR(false);
                setStatus("");
                setLoading(false);
              }}
              style={{
                ...styles.backToFormBtn,
                padding: isMobile ? "10px" : "12px",
                fontSize: isMobile ? "13px" : "14px",
              }}
            >
              Back to Form
            </button>
          </div>
        )}

        {status && (
          <div
            style={{
              ...styles.statusMessage,
              borderColor: status.includes("✗")
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(0, 212, 255, 0.3)",
              background: status.includes("✗")
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(0, 212, 255, 0.1)",
              color: status.includes("✗") ? "#ef4444" : "#00d4ff",
              padding: isMobile ? "10px 12px" : "12px 14px",
              fontSize: isMobile ? "12px" : "13px",
            }}
          >
            {status}
          </div>
        )}

        <div style={styles.divider}></div>

        <p
          style={{
            ...styles.signupPrompt,
            fontSize: isMobile ? "12px" : "13px",
          }}
        >
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            style={styles.signupLink}
          >
            Create one
          </button>
        </p>

        <div
          style={{
            ...styles.securityNote,
            padding: isMobile ? "10px" : "12px",
            fontSize: isMobile ? "11px" : "12px",
            gap: isMobile ? "8px" : "10px",
          }}
        >
          <span>🔐</span>
          <span>Your biometric data is encrypted and never shared</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#050816",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
    overflow: "auto",
  },
  bgBlob1: {
    position: "fixed",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0, 212, 255, 0.25) 0%, transparent 70%)",
    top: "-100px",
    right: "-100px",
    filter: "blur(50px)",
    animation: "float 8s ease-in-out infinite",
    zIndex: 0,
  },
  bgBlob2: {
    position: "fixed",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
    bottom: "-100px",
    left: "-100px",
    filter: "blur(50px)",
    animation: "float 10s ease-in-out infinite 2s",
    zIndex: 0,
  },
  card: {
    width: "100%",
    background:
      "linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "20px",
    boxShadow:
      "0 20px 60px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)",
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 1,
    animation: "fadeInUp 0.6s ease-out",
    maxHeight: "calc(100vh - 40px)",
    overflow: "auto",
  },
  backBtn: {
    position: "absolute",
    background: "rgba(0, 212, 255, 0.15)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    color: "#00d4ff",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  header: {
    textAlign: "center",
  },
  headerIcon: {
    display: "block",
  },
  title: {
    fontWeight: "800",
    color: "#fff",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#b0b0c9",
    margin: 0,
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(0, 212, 255, 0.05)",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "10px",
    color: "#fff",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  },
  signInBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #00d4ff, #6366f1)",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 30px rgba(0, 212, 255, 0.3)",
    marginTop: "10px",
  },
  qrContainer: {
    textAlign: "center",
    background: "rgba(0, 212, 255, 0.08)",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  qrLabel: {
    color: "#b0b0c9",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  qrBox: {
    background: "#fff",
    borderRadius: "12px",
    display: "inline-block",
    boxShadow: "0 10px 30px rgba(0, 212, 255, 0.2)",
    marginBottom: "15px",
  },
  qrInstructions: {
    color: "#b0b0c9",
  },
  backToFormBtn: {
    width: "100%",
    background: "rgba(0, 212, 255, 0.15)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    color: "#00d4ff",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  statusMessage: {
    borderRadius: "8px",
    fontWeight: "600",
    border: "1px solid",
    marginBottom: "15px",
  },
  divider: {
    height: "1px",
    background: "rgba(0, 212, 255, 0.1)",
    margin: "25px 0",
  },
  signupPrompt: {
    color: "#b0b0c9",
    textAlign: "center",
    margin: "0 0 20px 0",
  },
  signupLink: {
    background: "none",
    border: "none",
    color: "#00d4ff",
    fontWeight: "700",
    cursor: "pointer",
    padding: 0,
    fontSize: "inherit",
  },
  securityNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 212, 255, 0.05)",
    borderRadius: "8px",
    color: "#b0b0c9",
    flexWrap: "wrap",
  },
};

export default Login;
