"use client";

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

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

function MobileScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState("Position QR code in camera");

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(max-width: 768px)");

  const handleClose = () => {
    stopCamera();
    window.history.back();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setStatus("Camera ready. Scan QR code");
          requestAnimationFrame(scanQRCode);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("Camera access denied. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const scanQRCode = () => {
    if (!cameraActive || scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        setScanning(true);
        setStatus("QR detected. Redirecting...");
        handleQRData(code.data);
        return;
      }
    }

    requestAnimationFrame(scanQRCode);
  };

  const handleQRData = (qrDataString) => {
    try {
      const qrData = JSON.parse(qrDataString);

      if (!qrData.sessionId || !qrData.type || !qrData.url) {
        throw new Error("Invalid QR payload");
      }

      stopCamera();

      window.location.href = `/mobile-verify/${qrData.sessionId}`;
    } catch (err) {
      console.error("QR parse error:", err);
      setStatus("Invalid QR Code");

      setTimeout(() => {
        setScanning(false);
        setStatus("Position QR code in camera");
      }, 2000);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div
        style={{
          ...styles.header,
          maxWidth: isMobile ? "100%" : "500px",
          marginBottom: isMobile ? "20px" : "25px",
          padding: isMobile ? "0 16px" : "0",
        }}
      >
        <h2
          style={{
            ...styles.heading,
            fontSize: isMobile ? "22px" : isTablet ? "25px" : "28px",
          }}
        >
          QR Code Scanner
        </h2>
        <button
          onClick={handleClose}
          style={{
            ...styles.closeBtn,
            width: isMobile ? "35px" : "40px",
            height: isMobile ? "35px" : "40px",
            fontSize: isMobile ? "20px" : "24px",
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          ...styles.cameraBox,
          maxWidth: isMobile ? "100%" : "500px",
          margin: isMobile ? "0 16px" : "0",
        }}
      >
        <video ref={videoRef} style={styles.video} />
        <div
          style={{
            ...styles.scanBox,
            inset: isMobile ? "20px" : "40px",
          }}
        ></div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <p
        style={{
          ...styles.status,
          backgroundColor: scanning ? "#00d4ff" : "rgba(0, 212, 255, 0.15)",
          color: scanning ? "#000" : "#00d4ff",
          marginTop: isMobile ? "20px" : "25px",
          padding: isMobile ? "12px 18px" : "14px 20px",
          minWidth: isMobile ? "240px" : "280px",
          fontSize: isMobile ? "12px" : "14px",
        }}
      >
        {status}
      </p>

      <div
        style={{
          ...styles.helpBox,
          marginTop: isMobile ? "15px" : "20px",
          padding: isMobile ? "15px" : "20px",
          maxWidth: isMobile ? "calc(100% - 32px)" : "400px",
          fontSize: isMobile ? "12px" : "13px",
        }}
      >
        <strong style={{ color: "#00d4ff" }}>Instructions:</strong>
        <ul
          style={{
            ...styles.instructionList,
            lineHeight: isMobile ? "1.8" : "2",
          }}
        >
          <li>Allow camera access</li>
          <li>Point camera at QR code</li>
          <li>Hold steady</li>
          <li>Auto redirect on scan</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#050816",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
  },
  header: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    margin: "0",
    fontWeight: "800",
    background: "linear-gradient(135deg, #00d4ff, #6366f1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  closeBtn: {
    borderRadius: "50%",
    border: "2px solid rgba(0, 212, 255, 0.5)",
    background: "rgba(0, 212, 255, 0.1)",
    color: "#00d4ff",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "bold",
  },
  cameraBox: {
    width: "100%",
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0, 212, 255, 0.3)",
    border: "2px solid rgba(0, 212, 255, 0.3)",
    animation: "glowPulse 3s ease-in-out infinite",
  },
  video: {
    width: "100%",
    display: "block",
  },
  scanBox: {
    position: "absolute",
    border: "3px solid #00d4ff",
    borderRadius: "12px",
    pointerEvents: "none",
    boxShadow: "inset 0 0 20px rgba(0, 212, 255, 0.4)",
  },
  status: {
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "700",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    transition: "all 0.3s ease",
  },
  helpBox: {
    background: "rgba(0, 212, 255, 0.08)",
    borderRadius: "12px",
    color: "#b0b0c9",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    fontWeight: "500",
  },
  instructionList: {
    margin: "10px 0 0 0",
    paddingLeft: "20px",
  },
};

export default MobileScanner;
