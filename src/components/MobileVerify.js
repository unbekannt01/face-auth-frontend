"use client";

/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import io from "socket.io-client";
import axios from "axios";
import { config } from "../config";

/* ================================
   ⚡ GLOBAL MODEL PRELOADER
   Using LOCAL models from /models
================================ */
let modelsLoaded = false;
let modelsLoading = false;
let modelLoadError = null;

const modelLoader = {
  promise: null,
  resolve: null,
  reject: null,
};

modelLoader.promise = new Promise((resolve, reject) => {
  modelLoader.resolve = resolve;
  modelLoader.reject = reject;
});

// ⚡ PRELOAD FUNCTION - LOCAL FIRST!
const preloadModels = async () => {
  if (modelsLoaded) {
    console.log("[MODELS] ✅ Already loaded");
    return true;
  }

  if (modelsLoading) {
    console.log("[MODELS] ⏳ Loading in progress...");
    return modelLoader.promise;
  }

  modelsLoading = true;
  console.log("[MODELS] 🚀 Loading from LOCAL...");

  try {
    // DIRECT LOCAL LOADING (fastest & most reliable)
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);

    console.log("[MODELS] ✅ Loaded from LOCAL /models");
    modelsLoaded = true;
    modelLoadError = null;
    modelLoader.resolve(true);
    return true;
  } catch (error) {
    console.error("[MODELS] ❌ Failed:", error);
    modelLoadError = error;
    modelLoader.reject(error);
    modelsLoading = false;
    throw error;
  }
};

// ⚡ START PRELOADING
preloadModels().catch((err) => {
  console.error("[MODELS] Preload error:", err);
});

/* ================================
   CUSTOM HOOK
================================ */
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

/* ================================
   MAIN COMPONENT
================================ */
function MobileVerify() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);
  const videoReadyFiredRef = useRef(false);
  const socketRef = useRef(null);

  const [status, setStatus] = useState("✨ Initializing...");
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentDetection, setCurrentDetection] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [progress, setProgress] = useState(0);

  const isMobile = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(max-width: 768px)");

  const handleClose = () => {
    cleanup();
    navigate("/");
  };

  const cleanup = () => {
    console.log("[CLEANUP] Starting...");

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    isDetectingRef.current = false;
    videoReadyFiredRef.current = false;
  };

  const initialize = useCallback(async () => {
    try {
      console.log("[INIT] 🚀 Starting...");
      setStatus("✨ Loading AI models...");
      setProgress(10);
      setLoadError(false);

      // STEP 1: Wait for models
      try {
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 5, 40));
        }, 200);

        await modelLoader.promise;
        clearInterval(progressInterval);

        console.log("[INIT] ✅ Models ready");
        setProgress(50);
      } catch (modelError) {
        setLoadError(true);
        setStatus("❌ Failed to load AI models");
        setProgress(0);
        throw modelError;
      }

      // STEP 2: Load session
      setStatus("✨ Loading session...");
      const sessionResponse = await axios.get(
        `${config.API_URL}/api/auth/session/${sessionId}`,
      );

      if (!sessionResponse.data.success) {
        throw new Error("Session expired");
      }

      const session = {
        sessionId,
        ...sessionResponse.data.data,
      };
      setSessionData(session);

      console.log("[INIT] ✅ Session loaded");
      setProgress(70);

      // STEP 3: Start camera
      console.log("[INIT] 📷 Starting camera...");
      setStatus("✨ Starting camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      console.log("[INIT] ✅ Camera started");
      setProgress(85);
      streamRef.current = stream;

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.muted = true;

      videoRef.current.onloadedmetadata = async () => {
        if (videoReadyFiredRef.current) return;
        videoReadyFiredRef.current = true;

        console.log("[INIT] ✅ Video ready");

        if (canvasRef.current && videoRef.current) {
          const width = videoRef.current.videoWidth || 640;
          const height = videoRef.current.videoHeight || 480;
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }

        await videoRef.current.play();
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setProgress(100);
        setVideoReady(true);
        setStatus("✨ Position your face");
        console.log("[INIT] ✅ READY!");

        startDetection();
      };
    } catch (error) {
      console.error("[INIT] ❌ Error:", error);
      setLoadError(true);
      setStatus("❌ " + error.message);
      setProgress(0);

      if (error.message.includes("Session")) {
        setTimeout(() => {
          alert("Session expired. Please try again.");
          navigate("/");
        }, 2000);
      }
    }
  }, [sessionId, facingMode, navigate]);

  const handleRetry = () => {
    console.log("[RETRY] Reloading page...");
    window.location.reload();
  };

  const startDetection = () => {
    if (isDetectingRef.current) {
      console.log("[DETECTION] ✓ Already running");
      return;
    }

    if (!modelsLoaded) {
      console.log("[DETECTION] ⚠️ Models not ready, waiting...");
      setTimeout(startDetection, 500);
      return;
    }

    isDetectingRef.current = true;
    console.log("[DETECTION] 🚀 STARTING...");

    let frameCount = 0;

    detectionIntervalRef.current = setInterval(async () => {
      if (capturing) return;
      if (!videoRef.current || !canvasRef.current) return;
      if (videoRef.current.readyState < 2) {
        frameCount++;
        return;
      }

      try {
        frameCount++;

        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          if (!faceDetected) {
            console.log("[DETECTION] ✅ Face detected!");
          }

          setFaceDetected(true);
          setCurrentDetection(detection);

          const box = detection.detection.box;
          const confidence = Math.round(detection.detection.score * 100);

          // Draw box
          ctx.strokeStyle = "#00d4ff";
          ctx.lineWidth = 5;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Corners
          const cornerLen = 35;
          ctx.lineWidth = 7;

          ctx.beginPath();
          ctx.moveTo(box.x, box.y + cornerLen);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cornerLen, box.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLen, box.y);
          ctx.lineTo(box.x + box.width, box.y);
          ctx.lineTo(box.x + box.width, box.y + cornerLen);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(box.x, box.y + box.height - cornerLen);
          ctx.lineTo(box.x, box.y + box.height);
          ctx.lineTo(box.x + cornerLen, box.y + box.height);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
          ctx.stroke();

          // Landmarks
          if (detection.landmarks) {
            ctx.fillStyle = "#00d4ff";
            ctx.shadowColor = "#00d4ff";
            ctx.shadowBlur = 8;

            detection.landmarks.positions.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
              ctx.fill();
            });

            ctx.shadowBlur = 0;
          }

          // Confidence
          ctx.fillStyle = "#00d4ff";
          ctx.font = "bold 22px Arial";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 5;
          ctx.fillText(confidence + "%", box.x + 10, box.y - 10);
          ctx.shadowBlur = 0;
        } else {
          if (faceDetected) {
            console.log("[DETECTION] ✗ Face lost");
          }
          setFaceDetected(false);
          setCurrentDetection(null);
        }
      } catch (err) {
        console.error("[DETECTION] Error:", err);
      }
    }, 50);
  };

  const switchCamera = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    setFaceDetected(false);
    setCurrentDetection(null);
    setVideoReady(false);

    cleanup();
    setStatus("✨ Switching...");
    await new Promise((r) => setTimeout(r, 300));
    await initialize();
  };

  const captureFace = async () => {
    if (!currentDetection || capturing) return;

    setCapturing(true);
    setStatus("✨ Capturing...");
    console.log("[CAPTURE] Sending...");

    try {
      const descriptor = Array.from(currentDetection.descriptor);

      if (!socketRef.current) {
        socketRef.current = io(config.API_URL, {
          transports: ["websocket", "polling"],
          reconnection: true,
        });
      }

      socketRef.current.emit("face-captured", {
        sessionId: sessionData.sessionId,
        faceDescriptor: descriptor,
        email: sessionData.email,
        password: sessionData.password,
        type: sessionData.type,
      });

      cleanup();
      setStatus("✨ Verifying...");

      setTimeout(() => {
        navigate("/verification-success?type=" + sessionData.type);
      }, 2000);
    } catch (err) {
      console.error("[CAPTURE] Error:", err);
      setCapturing(false);
      setStatus("✗ Failed");
    }
  };

  useEffect(() => {
    if (sessionId) {
      initialize();
    }
    return () => cleanup();
  }, [sessionId, initialize]);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.card,
          padding: isMobile ? "25px 20px" : isTablet ? "30px 25px" : "40px",
          maxWidth: isMobile ? "100%" : "500px",
          margin: isMobile ? "0 16px" : "0",
        }}
      >
        {/* Header */}
        <div
          style={{ ...styles.header, marginBottom: isMobile ? "20px" : "25px" }}
        >
          <div>
            <h1
              style={{
                ...styles.title,
                fontSize: isMobile ? "20px" : isTablet ? "23px" : "26px",
              }}
            >
              👤 Face Verification
            </h1>
            <p
              style={{
                ...styles.subtitle,
                fontSize: isMobile ? "11px" : "13px",
              }}
            >
              {sessionData?.type === "register"
                ? "📝 Registration"
                : sessionData?.type === "update-face"
                  ? "🔄 Update Face"
                  : "🔐 Login"}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              ...styles.closeBtn,
              width: isMobile ? "35px" : "40px",
              height: isMobile ? "35px" : "40px",
              fontSize: isMobile ? "18px" : "20px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        {!videoReady && !loadError && (
          <div style={styles.progressContainer}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }}></div>
          </div>
        )}

        {/* Video */}
        <div
          style={{
            ...styles.videoBox,
            marginBottom: isMobile ? "15px" : "20px",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={styles.video}
          />
          <canvas ref={canvasRef} style={styles.canvas} />

          {/* Loading */}
          {!videoReady && !loadError && (
            <div style={styles.overlay}>
              <div
                style={{
                  ...styles.spinner,
                  width: isMobile ? "40px" : "50px",
                  height: isMobile ? "40px" : "50px",
                }}
              ></div>
              <p
                style={{
                  ...styles.overlayText,
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                {status}
              </p>
              <p
                style={{
                  ...styles.overlaySubtext,
                  fontSize: isMobile ? "11px" : "12px",
                }}
              >
                {progress < 50
                  ? "Loading from /models..."
                  : progress < 70
                    ? "Verifying session..."
                    : progress < 90
                      ? "Starting camera..."
                      : "Almost ready..."}
              </p>
            </div>
          )}

          {/* Error */}
          {loadError && (
            <div style={styles.overlay}>
              <div
                style={{ textAlign: "center", color: "#fff", padding: "20px" }}
              >
                <p style={{ fontSize: "32px", marginBottom: "15px" }}>❌</p>
                <p
                  style={{
                    fontSize: "16px",
                    marginBottom: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {status}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    marginBottom: "20px",
                    color: "#fbbf24",
                  }}
                >
                  Models are in /models but failed to load
                </p>
                <button
                  onClick={handleRetry}
                  style={{ ...styles.retryBtn, marginBottom: "10px" }}
                >
                  🔄 Reload Page
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    ...styles.retryBtn,
                    background: "rgba(239,68,68,0.8)",
                  }}
                >
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          {videoReady && !loadError && (
            <>
              <button
                onClick={switchCamera}
                style={{
                  ...styles.switchBtn,
                  top: isMobile ? "8px" : "10px",
                  right: isMobile ? "8px" : "10px",
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  fontSize: isMobile ? "11px" : "13px",
                }}
              >
                🔄 {facingMode === "user" ? "Back" : "Front"}
              </button>
              <div
                style={{
                  ...styles.indicator,
                  backgroundColor: faceDetected ? "#00d4ff" : "#fbbf24",
                  bottom: isMobile ? "10px" : "15px",
                  padding: isMobile ? "10px 20px" : "12px 28px",
                  fontSize: isMobile ? "11px" : "13px",
                }}
              >
                {faceDetected ? "✓ FACE DETECTED!" : "⏳ Position Face"}
              </div>
            </>
          )}
        </div>

        {/* Capture */}
        <button
          onClick={captureFace}
          disabled={!faceDetected || capturing || loadError}
          style={{
            ...styles.captureBtn,
            backgroundColor:
              !faceDetected || capturing || loadError ? "#ccc" : "#00d4ff",
            cursor:
              !faceDetected || capturing || loadError
                ? "not-allowed"
                : "pointer",
            padding: isMobile ? "12px" : "14px",
            fontSize: isMobile ? "14px" : "16px",
            marginBottom: isMobile ? "12px" : "15px",
          }}
        >
          {capturing ? "⏳ Processing..." : "📸 Capture Face"}
        </button>

        {/* Status */}
        <div
          style={{
            ...styles.statusBox,
            padding: isMobile ? "12px" : "14px",
            marginBottom: isMobile ? "12px" : "15px",
          }}
        >
          <p
            style={{
              ...styles.statusText,
              fontSize: isMobile ? "12px" : "13px",
            }}
          >
            {status}
          </p>
        </div>

        {/* Tips */}
        <div
          style={{
            ...styles.instructions,
            padding: isMobile ? "12px" : "15px",
          }}
        >
          <p
            style={{
              ...styles.instructionTitle,
              fontSize: isMobile ? "12px" : "13px",
            }}
          >
            💡 Tips:
          </p>
          <ul
            style={{
              ...styles.instructionList,
              fontSize: isMobile ? "11px" : "12px",
            }}
          >
            <li>Face camera directly</li>
            <li>Good lighting needed</li>
            <li>Models load from local /models</li>
            <li>Blue dots = ready</li>
          </ul>
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
  },
  card: {
    background:
      "linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "20px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 212, 255, 0.2)",
    backdropFilter: "blur(20px)",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { margin: 0, color: "#fff", fontWeight: "800" },
  subtitle: {
    color: "#b0b0c9",
    margin: "8px 0 0 0",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  closeBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s ease",
  },
  progressContainer: {
    width: "100%",
    height: "4px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "20px",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg, #00d4ff, #6366f1)",
    transition: "width 0.3s ease",
  },
  videoBox: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    backgroundColor: "#000",
    border: "2px solid rgba(0, 212, 255, 0.3)",
    boxShadow: "0 20px 60px rgba(0, 212, 255, 0.3)",
  },
  video: { width: "100%", display: "block", transform: "scaleX(-1)" },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transform: "scaleX(-1)",
    pointerEvents: "none",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayText: { color: "#00d4ff", fontWeight: "600", marginTop: "15px" },
  overlaySubtext: { color: "#b0b0c9", marginTop: "8px", fontWeight: "500" },
  spinner: {
    border: "4px solid rgba(0, 212, 255, 0.2)",
    borderTop: "4px solid #00d4ff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  retryBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #00d4ff, #6366f1)",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    width: "100%",
    maxWidth: "200px",
  },
  switchBtn: {
    position: "absolute",
    background: "rgba(0, 212, 255, 0.8)",
    border: "none",
    borderRadius: "20px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0, 212, 255, 0.4)",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    zIndex: 10,
    transition: "all 0.3s ease",
  },
  indicator: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    borderRadius: "25px",
    color: "#000",
    fontWeight: "700",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    zIndex: 10,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  captureBtn: {
    width: "100%",
    fontWeight: "700",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 30px rgba(0, 212, 255, 0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statusBox: {
    background: "rgba(0, 212, 255, 0.1)",
    borderRadius: "10px",
    border: "1px solid rgba(0, 212, 255, 0.3)",
  },
  statusText: {
    margin: 0,
    fontWeight: "600",
    color: "#b0b0c9",
    textAlign: "center",
  },
  instructions: {
    background: "rgba(0, 212, 255, 0.08)",
    borderRadius: "10px",
    border: "1px solid rgba(0, 212, 255, 0.2)",
  },
  instructionTitle: {
    margin: "0 0 10px 0",
    fontWeight: "700",
    color: "#b0b0c9",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  instructionList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#b0b0c9",
    lineHeight: "2",
  },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
if (!document.head.querySelector("style[data-mobile-verify]")) {
  styleSheet.setAttribute("data-mobile-verify", "true");
  document.head.appendChild(styleSheet);
}

export default MobileVerify;
