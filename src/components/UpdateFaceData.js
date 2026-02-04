"use client";

/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { config } from "../config";
import io from "socket.io-client";

let socket = null;

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

function UpdateFaceData() {
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [progressSteps, setProgressSteps] = useState([
    { label: "QR Generated", completed: false },
    { label: "Mobile Scanning", completed: false },
    { label: "Face Captured", completed: false },
    { label: "Verifying Face", completed: false },
    { label: "Update Complete", completed: false },
  ]);
  const sessionRef = useRef(null);

  const isMobile = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!socket) {
      socket = io(config.API_URL);
      console.log("[Socket] Connected to server");
    }

    initiateUpdate();

    return () => {
      if (socket) {
        socket.off("face-verification-complete");
      }
    };
  }, [navigate, sessionId]); // Added sessionId to dependencies

  useEffect(() => {
    if (!sessionId || !socket) return;

    console.log("🎧 Listening for verification on:", sessionId);

    const handler = (data) => {
      console.log("📩 Socket Event Received:", data);

      if (data.sessionId === sessionRef.current) {
        console.log("✅ Session matched, updating UI");

        updateProgress(4);
        setSuccess("✅ Face updated successfully!");
        setStatus("Face data has been updated in your account");
        setIsLoading(false);

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.faceUpdatedAt = new Date().toISOString();
        localStorage.setItem("user", JSON.stringify(user));

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    };

    socket.on("face-verification-complete", handler);

    return () => {
      socket.off("face-verification-complete", handler);
    };
  }, [sessionId]);

  const updateProgress = (stepIndex) => {
    setProgressSteps((prev) =>
      prev.map((step, idx) => ({
        ...step,
        completed: idx <= stepIndex,
      })),
    );
  };

  const initiateUpdate = async () => {
    try {
      setIsLoading(true);
      setError("");
      setStatus("Preparing face update...");

      const token = localStorage.getItem("authToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      console.log("[UpdateFace] Starting for user:", user.email);

      const initiateResponse = await axios.post(
        `${config.API_URL}/api/auth/update-face/initiate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const newSessionId = initiateResponse.data.sessionId;
      setSessionId(newSessionId);
      sessionRef.current = newSessionId;

      if (initiateResponse.data.success) {
        console.log("[UpdateFace] ✓ Session created:", newSessionId);

        // Update progress
        updateProgress(0); // QR Generated

        setShowQR(true);
        setStatus("📱 Scan QR code with your mobile device");
        setIsLoading(false);

        socket.emit("qr-generated", {
          sessionId: newSessionId,
          type: "update-face",
          email: user.email,
        });

        // Start polling for face capture
        startPolling(newSessionId);
      } else {
        throw new Error("Failed to initiate face update");
      }
    } catch (err) {
      console.error("[UpdateFace] Error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to initiate face update";
      setError("❌ " + errorMsg);
      setIsLoading(false);
    }
  };

  // Poll for session status updates
  const startPolling = (sid) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/auth/session/${sid}`,
        );

        if (response.data.success) {
          const sessionStatus = response.data.status;

          // Update UI based on session status
          if (sessionStatus === "scanned") {
            updateProgress(1); // Mobile Scanning
            setStatus("📱 Mobile device connected");
          } else if (sessionStatus === "capturing") {
            updateProgress(2); // Face Captured
            setStatus("📸 Capturing face data...");
          } else if (sessionStatus === "verifying") {
            updateProgress(3); // Verifying
            setStatus("🔍 Verifying face data...");
          } else if (
            sessionStatus === "verified" ||
            sessionStatus === "completed"
          ) {
            updateProgress(4);
            setSuccess("Face updated successfully!");
            setStatus("Face data has been updated in your account");
            setIsLoading(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        // Session might be expired or deleted
        console.log("[Polling] Session check failed:", err.message);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 10 minutes
    setTimeout(
      () => {
        clearInterval(pollInterval);
      },
      10 * 60 * 1000,
    );
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  const qrSize = isMobile ? 200 : isTablet ? 220 : 256;
  const qrData = `${config.APP_URL}/mobile-update-face/${sessionId}`;

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.card,
          padding: isMobile ? "25px 20px" : isTablet ? "30px 25px" : "40px",
          maxWidth: isMobile ? "100%" : isTablet ? "550px" : "650px",
          margin: isMobile ? "0 16px" : "0",
        }}
      >
        <div
          style={{
            ...styles.header,
            marginBottom: isMobile ? "12px" : "15px",
          }}
        >
          <button
            onClick={handleGoBack}
            style={{
              ...styles.backBtn,
              padding: isMobile ? "8px 16px" : "10px 20px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            ← Back
          </button>
          <h1
            style={{
              ...styles.title,
              fontSize: isMobile ? "22px" : isTablet ? "25px" : "28px",
            }}
          >
            Update Face Data
          </h1>
          <div style={{ width: isMobile ? "60px" : "80px" }}></div>
        </div>

        <p
          style={{
            ...styles.subtitle,
            fontSize: isMobile ? "12px" : "14px",
            marginBottom: isMobile ? "20px" : "25px",
          }}
        >
          Update your biometric authentication with a new face scan
        </p>

        {/* Progress Steps */}
        {showQR && (
          <div
            style={{
              ...styles.progressContainer,
              marginBottom: isMobile ? "20px" : "25px",
            }}
          >
            {progressSteps.map((step, idx) => (
              <div key={idx} style={styles.progressStep}>
                <div
                  style={{
                    ...styles.progressDot,
                    background: step.completed
                      ? "#00d4ff"
                      : "rgba(0, 212, 255, 0.2)",
                    boxShadow: step.completed
                      ? "0 0 15px rgba(0, 212, 255, 0.6)"
                      : "none",
                  }}
                >
                  {step.completed && <span style={styles.checkmark}>✓</span>}
                </div>
                <span
                  style={{
                    ...styles.progressLabel,
                    color: step.completed ? "#00d4ff" : "#6c757d",
                    fontSize: isMobile ? "10px" : "12px",
                  }}
                >
                  {step.label}
                </span>
                {idx < progressSteps.length - 1 && (
                  <div
                    style={{
                      ...styles.progressLine,
                      background: step.completed
                        ? "#00d4ff"
                        : "rgba(0, 212, 255, 0.2)",
                    }}
                  ></div>
                )}
              </div>
            ))}
          </div>
        )}

        {showQR && !isLoading && sessionId && (
          <div
            style={{
              ...styles.qrContainer,
              marginBottom: isMobile ? "20px" : "25px",
            }}
          >
            <p
              style={{
                ...styles.qrHint,
                fontSize: isMobile ? "13px" : "14px",
                marginBottom: isMobile ? "12px" : "15px",
              }}
            >
              📱 Scan with your mobile camera
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

            <div
              style={{
                ...styles.manualLinkBox,
                padding: isMobile ? "12px" : "15px",
                marginTop: isMobile ? "12px" : "15px",
              }}
            >
              <p
                style={{
                  ...styles.manualLinkLabel,
                  fontSize: isMobile ? "12px" : "13px",
                }}
              >
                Or click to open directly:
              </p>

              <a
                href={qrData}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...styles.manualLink,
                  padding: isMobile ? "8px 20px" : "10px 25px",
                  fontSize: isMobile ? "13px" : "14px",
                }}
              >
                Open on Mobile
              </a>
            </div>
          </div>
        )}

        {isLoading && (
          <div
            style={{
              ...styles.loadingContainer,
              padding: isMobile ? "30px 15px" : "40px 20px",
            }}
          >
            <div
              style={{
                ...styles.spinner,
                width: isMobile ? "40px" : "50px",
                height: isMobile ? "40px" : "50px",
              }}
            ></div>
            <p
              style={{
                ...styles.loadingText,
                fontSize: isMobile ? "14px" : "16px",
              }}
            >
              {status || "Processing..."}
            </p>
          </div>
        )}

        <div
          style={{
            ...styles.statusContainer,
            marginBottom: isMobile ? "15px" : "20px",
          }}
        >
          {error && (
            <p
              style={{
                ...styles.error,
                padding: isMobile ? "10px" : "12px",
                fontSize: isMobile ? "13px" : "14px",
              }}
            >
              {error}
            </p>
          )}
          {success && (
            <p
              style={{
                ...styles.success,
                padding: isMobile ? "10px" : "12px",
                fontSize: isMobile ? "13px" : "14px",
              }}
            >
              {success}
            </p>
          )}
          {!error && !success && status && showQR && (
            <p
              style={{
                ...styles.statusText,
                padding: isMobile ? "10px" : "12px",
                fontSize: isMobile ? "13px" : "15px",
              }}
            >
              {status}
            </p>
          )}
        </div>

        <div
          style={{
            ...styles.instructions,
            padding: isMobile ? "15px" : "20px",
            marginBottom: isMobile ? "12px" : "15px",
          }}
        >
          <h3
            style={{
              ...styles.instructionTitle,
              fontSize: isMobile ? "14px" : "16px",
              marginBottom: isMobile ? "12px" : "15px",
            }}
          >
            Steps:
          </h3>
          <ol
            style={{
              ...styles.instructionList,
              fontSize: isMobile ? "12px" : "14px",
              lineHeight: isMobile ? "1.6" : "1.8",
            }}
          >
            <li>Scan the QR code with your mobile device</li>
            <li>Position your face in good lighting</li>
            <li>Ensure blue dots appear on your face</li>
            <li>Tap "Capture Face" when prompted</li>
            <li>Wait for verification to complete</li>
          </ol>
        </div>

        <div
          style={{
            ...styles.warningBox,
            padding: isMobile ? "12px" : "15px",
            gap: isMobile ? "12px" : "15px",
          }}
        >
          <span style={{ fontSize: isMobile ? "20px" : "24px" }}>⚠️</span>
          <p
            style={{
              ...styles.warningText,
              fontSize: isMobile ? "12px" : "13px",
            }}
          >
            <strong>Important:</strong> This will replace your current biometric
            data. Ensure you're in good lighting and your face is clearly
            visible.
          </p>
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
  },
  card: {
    background:
      "linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "20px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 212, 255, 0.2)",
    backdropFilter: "blur(20px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    background: "rgba(0, 212, 255, 0.15)",
    color: "#00d4ff",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    transition: "all 0.3s ease",
  },
  title: {
    margin: 0,
    color: "#fff",
    textAlign: "center",
    flex: 1,
    fontWeight: "800",
  },
  subtitle: {
    textAlign: "center",
    color: "#b0b0c9",
    fontWeight: "500",
  },
  progressContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    background: "rgba(0, 212, 255, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    position: "relative",
  },
  progressStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    position: "relative",
  },
  progressDot: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    border: "2px solid rgba(0, 212, 255, 0.3)",
  },
  checkmark: {
    color: "#000",
    fontWeight: "bold",
    fontSize: "14px",
  },
  progressLabel: {
    fontSize: "11px",
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    maxWidth: "80px",
  },
  progressLine: {
    position: "absolute",
    top: "15px",
    left: "50%",
    width: "100%",
    height: "2px",
    zIndex: -1,
    transition: "all 0.3s ease",
  },
  qrContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  qrBox: {
    background: "#fff",
    borderRadius: "12px",
    border: "2px solid rgba(0, 212, 255, 0.3)",
    boxShadow: "0 10px 30px rgba(0, 212, 255, 0.2)",
    display: "inline-block",
  },
  qrHint: {
    color: "#b0b0c9",
    margin: "0",
    fontWeight: "600",
    textAlign: "center",
  },
  manualLinkBox: {
    background: "rgba(0, 212, 255, 0.08)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    textAlign: "center",
    width: "100%",
  },
  manualLinkLabel: {
    color: "#b0b0c9",
    margin: "0 0 10px 0",
    fontWeight: "500",
  },
  manualLink: {
    display: "inline-block",
    background: "linear-gradient(135deg, #00d4ff, #6366f1)",
    color: "#000",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "700",
    transition: "all 0.3s",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(0, 212, 255, 0.3)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: "15px",
    color: "#b0b0c9",
    fontWeight: "600",
  },
  spinner: {
    border: "4px solid rgba(0, 212, 255, 0.2)",
    borderTop: "4px solid #00d4ff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  statusContainer: {
    minHeight: "50px",
  },
  statusText: {
    color: "#00d4ff",
    fontWeight: "600",
    margin: 0,
    textAlign: "center",
    background: "rgba(0, 212, 255, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 255, 0.3)",
  },
  error: {
    color: "#ef4444",
    margin: 0,
    textAlign: "center",
    background: "rgba(239, 68, 68, 0.1)",
    borderRadius: "8px",
    fontWeight: "600",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
  success: {
    color: "#00d4ff",
    margin: 0,
    textAlign: "center",
    background: "rgba(0, 212, 255, 0.1)",
    borderRadius: "8px",
    fontWeight: "600",
    border: "1px solid rgba(0, 212, 255, 0.3)",
  },
  instructions: {
    background: "rgba(0, 212, 255, 0.08)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 212, 255, 0.2)",
  },
  instructionTitle: {
    margin: "0",
    fontWeight: "700",
    color: "#b0b0c9",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  instructionList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#b0b0c9",
  },
  warningBox: {
    background: "rgba(251, 191, 36, 0.1)",
    borderRadius: "10px",
    border: "1px solid rgba(251, 191, 36, 0.3)",
    display: "flex",
    alignItems: "flex-start",
  },
  warningText: {
    margin: 0,
    color: "#fbbf24",
    lineHeight: "1.6",
    fontWeight: "500",
  },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector("style[data-update-face]")) {
  styleSheet.setAttribute("data-update-face", "true");
  document.head.appendChild(styleSheet);
}

export default UpdateFaceData;
