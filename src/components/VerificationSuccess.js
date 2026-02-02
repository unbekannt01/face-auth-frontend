'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VerificationSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const redirectTimer = setTimeout(() => {
      handleSmartRedirect();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, []);

  const isMobileDevice = () => {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent,
    );
  };

  const handleSmartRedirect = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    if (type === "register") {
      navigate("/login");
      return;
    }

    if (isMobileDevice()) {
      console.log("📱 Mobile detected → redirecting to home");
      navigate("/");
    } else {
      console.log("💻 Desktop detected → closing tab");

      window.open("", "_self");
      window.close();

      setTimeout(() => {
        navigate("/");
      }, 500);
    }
  };

  const handleBackToComputer = () => {
    if (isMobileDevice()) {
      navigate("/");
    } else {
      window.open("", "_self");
      window.close();

      setTimeout(() => {
        navigate("/");
      }, 500);
    }
  };

  const handleCloseWindow = () => {
    handleSmartRedirect();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <div style={styles.checkmarkCircle}>
            <svg style={styles.checkmark} viewBox="0 0 52 52">
              <circle
                style={styles.checkmarkCircle}
                cx="26"
                cy="26"
                r="25"
                fill="none"
              />
              <path
                style={styles.checkmarkCheck}
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>
          </div>
        </div>

        <h1 style={styles.title}>✓ Verification Successful!</h1>

        <p style={styles.message}>Your face has been verified successfully.</p>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            💻 Return to your computer to complete the process.
          </p>
          <p style={styles.infoSubtext}>
            You can safely close this mobile tab.
          </p>
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressText}>
            Auto redirect in {countdown} seconds...
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${(5 - countdown) * 20}%`,
              }}
            />
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleBackToComputer} style={styles.primaryButton}>
            💻 Return to Computer
          </button>

          <button onClick={handleCloseWindow} style={styles.secondaryButton}>
            ✕ Close This Tab
          </button>
        </div>

        <div style={styles.successDetails}>
          <h3 style={styles.detailsTitle}>What's Next?</h3>
          <ul style={styles.detailsList}>
            <li>✓ Go back to your computer</li>
            <li>✓ Your login/registration will complete automatically</li>
            <li>✓ You're all set!</li>
          </ul>
        </div>

        <div style={styles.mobileNote}>
          <p style={styles.mobileNoteText}>
            📱 <strong>Mobile Users:</strong> You will be redirected to the home
            page automatically.
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
    position: "relative",
  },
  card: {
    background: "linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "20px",
    padding: "50px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)",
    backdropFilter: "blur(20px)",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px",
  },
  checkmarkCircle: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    display: "block",
    strokeWidth: "3",
    stroke: "#00d4ff",
    strokeMiterlimit: "10",
    boxShadow: "inset 0px 0px 0px #00d4ff, 0 0 30px rgba(0, 212, 255, 0.4)",
    animation: "fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both",
  },
  checkmark: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    display: "block",
    strokeWidth: "3",
    stroke: "#fff",
    strokeMiterlimit: "10",
    boxShadow: "inset 0px 0px 0px #00d4ff",
    animation: "fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both",
  },
  checkmarkCheck: {
    transformOrigin: "50% 50%",
    strokeDasharray: "48",
    strokeDashoffset: "48",
    animation: "stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "15px",
    margin: "0 0 15px 0",
  },
  message: {
    fontSize: "16px",
    color: "#b0b0c9",
    marginBottom: "30px",
    lineHeight: "1.6",
  },
  infoBox: {
    background: "rgba(0, 212, 255, 0.1)",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    marginBottom: "30px",
  },
  infoText: {
    margin: "0 0 10px 0",
    color: "#00d4ff",
    fontSize: "15px",
    fontWeight: "700",
  },
  infoSubtext: {
    margin: 0,
    color: "#b0b0c9",
    fontSize: "13px",
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: "30px",
  },
  progressText: {
    fontSize: "13px",
    color: "#b0b0c9",
    marginBottom: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  progressBar: {
    width: "100%",
    height: "6px",
    background: "rgba(0, 212, 255, 0.1)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #00d4ff, #6366f1)",
    borderRadius: "3px",
    transition: "width 1s linear",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  primaryButton: {
    flex: 1,
    minWidth: "200px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #00d4ff, #6366f1)",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 30px rgba(0, 212, 255, 0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  secondaryButton: {
    flex: 1,
    minWidth: "200px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "700",
    background: "rgba(0, 212, 255, 0.15)",
    color: "#00d4ff",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  successDetails: {
    background: "rgba(0, 212, 255, 0.08)",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    textAlign: "left",
    marginBottom: "20px",
  },
  detailsTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#b0b0c9",
    marginBottom: "15px",
    margin: "0 0 15px 0",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  detailsList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#b0b0c9",
    lineHeight: "2",
    fontSize: "13px",
  },
  mobileNote: {
    background: "rgba(0, 212, 255, 0.1)",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid rgba(0, 212, 255, 0.3)",
  },
  mobileNoteText: {
    margin: 0,
    fontSize: "13px",
    color: "#b0b0c9",
    lineHeight: "1.6",
    fontWeight: "500",
  },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes scale {
    0%, 100% {
      transform: none;
    }
    50% {
      transform: scale3d(1.1, 1.1, 1);
    }
  }
  
  @keyframes fill {
    100% {
      box-shadow: inset 0px 0px 0px 30px #00d4ff;
    }
  }

  @media (max-width: 600px) {
    .buttonGroup {
      flex-direction: column;
    }
  }
`;
if (!document.head.querySelector("style[data-verification-success]")) {
  styleSheet.setAttribute("data-verification-success", "true");
  document.head.appendChild(styleSheet);
}

export default VerificationSuccess;