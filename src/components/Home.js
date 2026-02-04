/* eslint-disable no-unused-vars */
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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

function Home() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showServerStatusModal, setShowServerStatusModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(max-width: 768px)");
  const isDesktop = !isTablet;

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisitedNeuroVerify");
    if (!hasVisited) {
      setTimeout(() => {
        setShowServerModal(true);
        sessionStorage.setItem("hasVisitedNeuroVerify", "true");
      }, 1000);
    }
  }, []);

  const handleActivateServer = (e) => {
    e.preventDefault();
    setEmailSent(true);
    e.target.submit();
    setTimeout(() => {
      setShowServerModal(false);
      setEmailSent(false);
    }, 3000);
  };

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.bgWrapper}>
        <div style={styles.gradientOrb1}></div>
        <div style={styles.gradientOrb2}></div>
        <div style={styles.gradientOrb3}></div>
        <div style={styles.gridPattern}></div>
        <div
          style={{
            ...styles.cursorGlow,
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        ></div>
      </div>

      {/* Glassmorphic Navigation */}
      <nav
        style={{
          ...styles.navbar,
          background:
            scrollY > 50 ? "rgba(5, 8, 22, 0.95)" : "rgba(5, 8, 22, 0.7)",
          boxShadow:
            scrollY > 50 ? "0 8px 32px rgba(0, 212, 255, 0.1)" : "none",
        }}
      >
        <div
          style={{
            ...styles.navContent,
            padding: isMobile ? "0 16px" : isTablet ? "0 24px" : "0 60px",
          }}
        >
          <div style={styles.logo} onClick={() => navigate("/")}>
            <img
              src="/logo.png"
              alt="NeuroVerify Logo"
              style={{
                ...styles.logoImage,
                width: isMobile ? "36px" : "60px",
                height: isMobile ? "36px" : "60px",
              }}
            />
            <span
              style={{
                ...styles.logoText,
                fontSize: isMobile ? "18px" : "24px",
              }}
            >
              NeuroVerify
            </span>
          </div>
          <div style={styles.navLinks}>
            <button
              onClick={() => navigate("/login")}
              style={{
                ...styles.signInBtn,
                padding: isMobile ? "8px 18px" : "12px 30px",
                fontSize: isMobile ? "13px" : "15px",
              }}
              onMouseEnter={(e) => {
                e.target.style.background =
                  "linear-gradient(135deg, #00d4ff, #00d4ff)";
                e.target.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#00d4ff";
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        style={{
          ...styles.heroSection,
          flexDirection: isTablet ? "column" : "row",
          padding: isMobile
            ? "100px 16px 80px"
            : isTablet
              ? "110px 24px 100px"
              : "120px 60px 100px",
          gap: isMobile ? "30px" : isTablet ? "40px" : "100px",
          transform: isDesktop ? `translateY(${scrollY * 0.3}px)` : "none",
          alignItems: isTablet ? "center" : "center",
        }}
      >
        <div
          style={{
            ...styles.heroContent,
            maxWidth: isTablet ? "100%" : "600px",
            textAlign: isTablet ? "center" : "left",
          }}
        >
          <div
            style={{
              ...styles.badge,
              margin: isTablet ? "0 auto 30px" : "0 0 30px",
              justifySelf: isTablet ? "center" : "auto",
            }}
          >
            <span style={styles.badgeDot}></span>
            Next-Gen Authentication
          </div>
          <h1
            style={{
              ...styles.mainTitle,
              fontSize: isMobile ? "38px" : isTablet ? "52px" : "72px",
              letterSpacing: isMobile ? "-1px" : "-2px",
            }}
          >
            <span style={styles.titleWord1}>Secure</span>
            <span style={styles.titleWord2}>Identity</span>
            <span style={styles.titleWord3}>Verification</span>
          </h1>
          <p
            style={{ ...styles.subtitle, fontSize: isMobile ? "14px" : "18px" }}
          >
            Experience the future of biometric security with AI-powered facial
            recognition.
            <span style={styles.subtitleHighlight}>
              {" "}
              Fast. Secure. Seamless.
            </span>
          </p>
          <div
            style={{
              ...styles.ctaGroup,
              justifyContent: isTablet ? "center" : "flex-start",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
            }}
          >
            <button
              onClick={() => navigate("/register")}
              style={{
                ...styles.primaryBtn,
                padding: isMobile ? "14px 30px" : "18px 40px",
                fontSize: isMobile ? "15px" : "16px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-4px) scale(1.02)";
                e.target.style.boxShadow =
                  "0 20px 60px rgba(0, 212, 255, 0.4), 0 0 80px rgba(0, 212, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 10px 40px rgba(0, 212, 255, 0.3)";
              }}
            >
              <span style={styles.btnText}>Get Started</span>
              <span style={styles.btnIcon}>→</span>
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                ...styles.secondaryBtn,
                padding: isMobile ? "14px 30px" : "18px 40px",
                fontSize: isMobile ? "15px" : "16px",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(0, 212, 255, 0.1)";
                e.target.style.borderColor = "#00d4ff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "rgba(0, 212, 255, 0.3)";
              }}
            >
              Already a Member
            </button>
          </div>

          {/* Stats */}
          <div
            style={{
              ...styles.stats,
              justifyContent: isTablet ? "center" : "flex-start",
              gap: isMobile ? "30px" : "50px",
              paddingBottom: "20px",
            }}
          >
            {[
              { value: "99.9%", label: "Accuracy" },
              { value: "<50ms", label: "Response Time" },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.statItem,
                  alignItems: isTablet ? "center" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.statValue,
                    fontSize: isMobile ? "24px" : "32px",
                  }}
                >
                  {stat.value}
                </div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual - Scanner Card - HIDDEN on mobile, visible on tablet+ */}
        {!isMobile && (
          <div style={{ ...styles.heroVisual, flex: isTablet ? "none" : 1 }}>
            <div
              style={{
                ...styles.scannerWrapper,
                width: isTablet ? "320px" : "500px",
                height: isTablet ? "450px" : "650px",
              }}
            >
              {/* Circuit Lines Only - Behind Face */}
              <div style={styles.circuitContainer}>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.circuitLine,
                      transform: `rotate(${angle}deg)`,
                    }}
                  >
                    <div style={styles.circuitLineInner}></div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  ...styles.scannerCard,
                  width: isTablet ? "280px" : "420px",
                  height: isTablet ? "340px" : "500px",
                  padding: isTablet ? "24px 18px" : "40px 30px",
                }}
              >
                <div style={styles.scannerGlow}></div>

                {/* Corner Accents */}
                <div style={styles.cornerAccentTL}></div>
                <div style={styles.cornerAccentTR}></div>
                <div style={styles.cornerAccentBL}></div>
                <div style={styles.cornerAccentBR}></div>

                <div style={styles.scannerInner}>
                  <div
                    style={{
                      ...styles.faceOutline,
                      width: isTablet ? "150px" : "240px",
                      height: isTablet ? "190px" : "300px",
                      borderRadius: isTablet
                        ? "75px 75px 90px 90px"
                        : "120px 120px 140px 140px",
                    }}
                  >
                    <div style={styles.faceGrid}>
                      {[...Array(isTablet ? 5 : 8)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            ...styles.gridLine,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        ></div>
                      ))}
                    </div>
                    <div style={styles.scanBeam}></div>

                    <div
                      style={{
                        ...styles.faceIcon,
                        width: isTablet ? "85px" : "140px",
                        height: isTablet ? "110px" : "180px",
                      }}
                    >
                      <div style={styles.faceIconCircle}></div>
                      <div
                        style={{
                          ...styles.faceEyeLeft,
                          width: isTablet ? "13px" : "20px",
                          height: isTablet ? "16px" : "24px",
                          top: "35%",
                          left: "25%",
                        }}
                      >
                        <div
                          style={{
                            ...styles.faceEyePupil,
                            width: isTablet ? "5px" : "8px",
                            height: isTablet ? "5px" : "8px",
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          ...styles.faceEyeRight,
                          width: isTablet ? "13px" : "20px",
                          height: isTablet ? "16px" : "24px",
                          top: "35%",
                          right: "25%",
                        }}
                      >
                        <div
                          style={{
                            ...styles.faceEyePupil,
                            width: isTablet ? "5px" : "8px",
                            height: isTablet ? "5px" : "8px",
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          ...styles.faceNose,
                          width: isTablet ? "8px" : "12px",
                          height: isTablet ? "13px" : "20px",
                        }}
                      ></div>
                      <div
                        style={{
                          ...styles.faceMouth,
                          width: isTablet ? "30px" : "50px",
                          height: isTablet ? "12px" : "20px",
                        }}
                      ></div>
                    </div>
                  </div>

                  <div style={styles.dataPoints}>
                    {[
                      { left: "15%", top: "20%" },
                      { right: "15%", top: "25%" },
                      { left: "20%", bottom: "25%" },
                      { right: "20%", bottom: "20%" },
                    ].map((pos, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.dataPoint,
                          ...pos,
                          animationDelay: `${i * 0.3}s`,
                        }}
                      >
                        <div style={styles.dataPointPulse}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Biometric Status */}
              <div
                style={{
                  ...styles.scannerStatus,
                  padding: isTablet ? "10px 16px" : "14px 24px",
                }}
              >
                <div style={styles.statusIndicator}></div>
                <span
                  style={{
                    ...styles.statusText,
                    fontSize: isTablet ? "12px" : "14px",
                  }}
                >
                  Biometric Scan Active
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features - Bento Grid */}
      <section
        style={{
          ...styles.featuresSection,
          padding: isMobile
            ? "60px 16px"
            : isTablet
              ? "80px 24px"
              : "120px 60px",
        }}
      >
        <div
          style={{
            ...styles.sectionHeader,
            marginBottom: isMobile ? "40px" : "80px",
          }}
        >
          <span style={styles.sectionLabel}>CAPABILITIES</span>
          <h2
            style={{
              ...styles.sectionTitle,
              fontSize: isMobile ? "28px" : isTablet ? "40px" : "56px",
            }}
          >
            Powered by Advanced AI
          </h2>
          <p
            style={{
              ...styles.sectionSubtitle,
              fontSize: isMobile ? "14px" : "18px",
            }}
          >
            Enterprise-grade security meets consumer-friendly simplicity
          </p>
        </div>

        <div
          style={{
            ...styles.bentoGrid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gridTemplateRows: "auto",
            gap: isMobile ? "12px" : "20px",
          }}
        >
          {/* Feature 1 - Left */}
          <div
            style={{
              ...styles.bentoCard,
              padding: isMobile ? "24px" : "35px",
            }}
          >
            <div style={styles.bentoIcon}>🔐</div>
            <h3
              style={{
                ...styles.bentoTitle,
                fontSize: isMobile ? "18px" : "24px",
              }}
            >
              Military-Grade Encryption
            </h3>
            <p style={styles.bentoDesc}>
              AES-256 encryption with zero-knowledge architecture ensures your
              biometric data remains completely private and secure.
            </p>
            <div style={styles.bentoGlow1}></div>
          </div>

          {/* Feature 2 - Right */}
          <div
            style={{
              ...styles.bentoCard,
              padding: isMobile ? "24px" : "35px",
            }}
          >
            <div style={styles.bentoIcon}>⚡</div>
            <h3
              style={{
                ...styles.bentoTitle,
                fontSize: isMobile ? "18px" : "24px",
              }}
            >
              Lightning Speed
            </h3>
            <p style={styles.bentoDesc}>
              Authenticate in under 50ms with our optimized neural networks.
            </p>
          </div>

          {/* Feature 3 - Left */}
          <div
            style={{
              ...styles.bentoCard,
              padding: isMobile ? "24px" : "35px",
            }}
          >
            <div style={styles.bentoIcon}>🌍</div>
            <h3
              style={{
                ...styles.bentoTitle,
                fontSize: isMobile ? "18px" : "24px",
              }}
            >
              Global Ready
            </h3>
            <p style={styles.bentoDesc}>
              Works seamlessly across 150+ countries with multi-language
              support.
            </p>
          </div>

          {/* Feature 4 - Right */}
          <div
            style={{
              ...styles.bentoCard,
              padding: isMobile ? "24px" : "35px",
            }}
          >
            <div style={styles.bentoIcon}>🛡️</div>
            <h3
              style={{
                ...styles.bentoTitle,
                fontSize: isMobile ? "18px" : "24px",
              }}
            >
              Privacy First Design
            </h3>
            <p style={styles.bentoDesc}>
              Your biometric data is processed locally on your device. We never
              store raw facial images on our servers.
            </p>
            <div style={styles.bentoGlow2}></div>
          </div>

          {/* Feature 5 - Left */}
          <div
            style={{
              ...styles.bentoCard,
              padding: isMobile ? "24px" : "35px",
            }}
          >
            <div style={styles.bentoIcon}>📱</div>
            <h3
              style={{
                ...styles.bentoTitle,
                fontSize: isMobile ? "18px" : "24px",
              }}
            >
              Cross-Platform QR
            </h3>
            <p style={styles.bentoDesc}>
              Scan and verify from any smartphone. No app installation required.
            </p>
          </div>

          {/* Feature 6 - Right */}
          <div
            style={{
              ...styles.bentoCard,
              padding: isMobile ? "24px" : "35px",
            }}
          >
            <div style={styles.bentoIcon}>🚀</div>
            <h3
              style={{
                ...styles.bentoTitle,
                fontSize: isMobile ? "18px" : "24px",
              }}
            >
              Next-Gen Neural Technology
            </h3>
            <p style={styles.bentoDesc}>
              Powered by cutting-edge deep learning models trained on millions
              of verification patterns to deliver unmatched accuracy and
              security.
            </p>
            <div style={styles.techBadges}>
              {["AI/ML", "TensorFlow", "Edge Computing", "Real-time"].map(
                (tech, i) => (
                  <span key={i} style={styles.techBadge}>
                    {tech}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section
        style={{
          ...styles.timelineSection,
          padding: isMobile
            ? "60px 16px"
            : isTablet
              ? "80px 24px"
              : "120px 60px",
        }}
      >
        <div
          style={{
            ...styles.sectionHeader,
            marginBottom: isMobile ? "40px" : "60px",
          }}
        >
          <span style={styles.sectionLabel}>PROCESS</span>
          <h2
            style={{
              ...styles.sectionTitle,
              fontSize: isMobile ? "28px" : isTablet ? "40px" : "56px",
            }}
          >
            Three Simple Steps
          </h2>
        </div>

        <div
          style={{
            ...styles.timeline,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "24px" : "40px",
            alignItems: isMobile ? "stretch" : "flex-start",
          }}
        >
          {[
            {
              num: "01",
              title: "Create Account",
              desc: "Sign up with your email and set up your secure profile in seconds.",
              icon: "✍️",
            },
            {
              num: "02",
              title: "Biometric Scan",
              desc: "Use your device camera to capture and verify your unique facial signature.",
              icon: "📸",
            },
            {
              num: "03",
              title: "Instant Access",
              desc: "Enjoy passwordless login with AI-powered facial recognition.",
              icon: "🎉",
            },
          ].map((step, idx) => (
            <div
              key={idx}
              style={{
                ...styles.timelineItem,
                flexDirection: isMobile ? "row" : "column",
                alignItems: isMobile ? "flex-start" : "center",
                gap: isMobile ? "16px" : "0",
              }}
            >
              <div
                style={{
                  ...styles.timelineNumber,
                  width: isMobile ? "52px" : "80px",
                  height: isMobile ? "52px" : "80px",
                  fontSize: isMobile ? "18px" : "28px",
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>
              <div
                style={{
                  ...styles.timelineContent,
                  textAlign: isMobile ? "left" : "center",
                  padding: isMobile ? "20px" : "35px 30px",
                  flex: isMobile ? 1 : "auto",
                }}
              >
                <div
                  style={{
                    ...styles.timelineIcon,
                    fontSize: isMobile ? "28px" : "40px",
                    marginBottom: isMobile ? "8px" : "15px",
                  }}
                >
                  {step.icon}
                </div>
                <h3
                  style={{
                    ...styles.timelineTitle,
                    fontSize: isMobile ? "16px" : "22px",
                  }}
                >
                  {step.title}
                </h3>
                <p style={styles.timelineDesc}>{step.desc}</p>
              </div>
              {/* Connector: horizontal on desktop, vertical on mobile */}
              {idx < 2 && !isMobile && (
                <div style={styles.timelineConnector}></div>
              )}
              {idx < 2 && isMobile && (
                <div
                  style={{
                    width: "2px",
                    height: "20px",
                    background: "linear-gradient(180deg, #00d4ff, transparent)",
                    marginLeft: "26px",
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          ...styles.ctaSection,
          padding: isMobile
            ? "40px 16px"
            : isTablet
              ? "60px 24px"
              : "120px 60px",
        }}
      >
        <div
          style={{
            ...styles.ctaCard,
            padding: isMobile
              ? "40px 20px"
              : isTablet
                ? "50px 30px"
                : "80px 60px",
            borderRadius: isMobile ? "24px" : "40px",
          }}
        >
          <div style={styles.ctaContent}>
            <h2
              style={{
                ...styles.ctaTitle,
                fontSize: isMobile ? "24px" : isTablet ? "34px" : "48px",
              }}
            >
              Ready to Go Passwordless?
            </h2>
            <p
              style={{
                ...styles.ctaSubtitle,
                fontSize: isMobile ? "14px" : "18px",
                margin: isMobile ? "0 0 28px" : "0 auto 40px",
              }}
            >
              Join thousands of users who've already made the switch to secure,
              AI-powered biometric authentication.
            </p>
            <button
              onClick={() => navigate("/register")}
              style={{
                ...styles.ctaButton,
                padding: isMobile ? "14px 32px" : "20px 50px",
                fontSize: isMobile ? "15px" : "18px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px) scale(1.02)";
                e.target.style.boxShadow =
                  "0 25px 70px rgba(0, 212, 255, 0.5), 0 0 100px rgba(0, 212, 255, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 15px 50px rgba(0, 212, 255, 0.4)";
              }}
            >
              Start Free Trial
              <span style={styles.ctaButtonArrow}>→</span>
            </button>
          </div>
          <div style={styles.ctaGlow}></div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          ...styles.footer,
          padding: isMobile
            ? "40px 16px 24px"
            : isTablet
              ? "60px 24px 30px"
              : "80px 60px 40px",
        }}
      >
        <div
          style={{
            ...styles.footerContent,
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
            gap: isMobile ? "30px" : "80px",
            marginBottom: isMobile ? "30px" : "60px",
          }}
        >
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>
              <div style={styles.footerLogoIcon}>
                <div style={styles.footerLogoIconInner}></div>
              </div>
              <span style={styles.footerLogoText}>NeuroVerify</span>
            </div>
            <p style={styles.footerTagline}>
              Next-generation biometric authentication for the modern world.
            </p>
          </div>
          <div style={styles.footerLinks}>
            <div style={styles.footerLinkGroup}>
              <h4 style={styles.footerLinkTitle}>Legal</h4>
              <button
                onClick={() => setShowPrivacyModal(true)}
                style={styles.footerLink}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setShowSecurityModal(true)}
                style={styles.footerLink}
              >
                Security
              </button>
              <button
                onClick={() => setShowServerStatusModal(true)}
                style={styles.footerLink}
              >
                Server Status & Contact
              </button>
            </div>
          </div>
        </div>
        <div style={{ ...styles.footerBottom, justifyContent: "center" }}>
          <p style={styles.footerCopy}>
            © 2026 NeuroVerify. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Modals */}
      {showServerModal && (
        <ServerActivationModal
          onClose={() => setShowServerModal(false)}
          onSubmit={handleActivateServer}
          emailSent={emailSent}
          isMobile={isMobile}
        />
      )}
      {showServerStatusModal && (
        <ServerActivationModal
          onClose={() => setShowServerStatusModal(false)}
          onSubmit={handleActivateServer}
          emailSent={emailSent}
          isMobile={isMobile}
        />
      )}
      {showPrivacyModal && (
        <PolicyModal
          title="Privacy Policy"
          onClose={() => setShowPrivacyModal(false)}
          content={privacyPolicyContent}
          isMobile={isMobile}
        />
      )}
      {showSecurityModal && (
        <PolicyModal
          title="Security & Compliance"
          onClose={() => setShowSecurityModal(false)}
          content={securityContent}
          isMobile={isMobile}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.5); }
          50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.8), 0 0 60px rgba(0, 212, 255, 0.4); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dataPointPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        @keyframes circuitPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// // Server Status & Contact Modal (New Funny Version)
// function ServerStatusModal({ onClose, onSubmit, emailSent, isMobile }) {
//   return (
//     <div style={styles.modalOverlay} onClick={onClose}>
//       <div
//         style={{
//           ...styles.serverModalContent,
//           padding: isMobile ? "30px 20px" : "50px 40px",
//           maxWidth: isMobile ? "calc(100vw - 32px)" : "550px",
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div style={styles.serverModalIcon}>😴💤</div>
//         <h2
//           style={{
//             ...styles.serverModalTitle,
//             fontSize: isMobile ? "20px" : "28px",
//           }}
//         >
//           Shhh... Our Server is Catching Some Z's! 🛌✨
//         </h2>
//         <p style={styles.serverModalText}>
//           💤 We're using a free hosting tier, which means our server goes into
//           sleep mode when not in use (like a smart power-saving laptop!). Think
//           of it as our server taking a well-deserved nap. 🌙
//         </p>
//         <p style={styles.serverModalSubtext}>
//           🚀 <strong>Good news:</strong> Just click the wake-up button below and
//           we'll send a gentle nudge to our server! It usually takes about 2-3
//           minutes to stretch, yawn, and get back to work. ☕️
//         </p>
//         <p style={styles.serverModalSubtext}>
//           🐛 Found a bug? Have a question? Want to say hi? Drop us a message
//           using the form below and we'll wake up the server AND get back to you
//           faster than you can say "localhost"! ⚡
//         </p>

//         <div style={styles.warningBox}>
//           <span style={styles.warningIcon}>⚠️</span>
//           <p style={styles.warningText}>
//             <strong>Pro tip:</strong> After clicking the wake-up button, please
//             wait a bit before trying again. Our servers need some time to fully
//             boot up! Multiple requests won't speed up the process—they'll just
//             make our server grumpy. 😅
//           </p>
//         </div>

//         {!emailSent ? (
//           <form
//             action="https://formsubmit.co/testing.buddy1111@gmail.com"
//             method="POST"
//             onSubmit={onSubmit}
//             style={styles.serverForm}
//           >
//             <input
//               type="hidden"
//               name="_subject"
//               value="🚀 NeuroVerify Server Wake-Up Request!"
//             />
//             <input type="hidden" name="_captcha" value="false" />
//             <input type="hidden" name="_template" value="box" />
//             <input type="hidden" name="_next" value={window.location.href} />
//             <input
//               type="hidden"
//               name="Message"
//               value="A user is trying to access NeuroVerify. Please wake up the Render server! 🌟"
//             />
//             <input
//               type="hidden"
//               name="Timestamp"
//               value={new Date().toLocaleString("en-US", {
//                 timeZone: "Asia/Kolkata",
//               })}
//             />
//             <input
//               type="hidden"
//               name="Request-Type"
//               value="Server Activation"
//             />
//             <button
//               type="submit"
//               style={{
//                 ...styles.serverActivateBtn,
//                 padding: isMobile ? "14px 24px" : "18px 40px",
//                 fontSize: isMobile ? "15px" : "18px",
//               }}
//               onMouseEnter={(e) => {
//                 e.target.style.transform = "scale(1.05)";
//                 e.target.style.boxShadow = "0 15px 50px rgba(0, 212, 255, 0.6)";
//               }}
//               onMouseLeave={(e) => {
//                 e.target.style.transform = "scale(1)";
//                 e.target.style.boxShadow = "0 10px 40px rgba(0, 212, 255, 0.4)";
//               }}
//             >
//               🚀 Wake Up the Server
//             </button>
//           </form>
//         ) : (
//           <div style={styles.successMessage}>
//             <div style={styles.successIcon}>✅</div>
//             <p style={styles.successText}>
//               Wake-up call sent! The server should be ready soon.
//             </p>
//             <p style={styles.successSubtext}>
//               Refresh the page and try logging in again shortly!
//             </p>
//           </div>
//         )}

//         <p
//           style={{
//             ...styles.serverModalSubtext,
//             marginTop: "15px",
//             textAlign: "center",
//           }}
//         >
//           ⏰ We'll wake up the server and respond ASAP!
//         </p>

//         <button
//           onClick={onClose}
//           style={styles.serverModalClose}
//           onMouseEnter={(e) => (e.target.style.color = "#00d4ff")}
//           onMouseLeave={(e) => (e.target.style.color = "#8a8fa8")}
//         >
//           I'll wait and try later
//         </button>
//       </div>
//     </div>
//   );
// }

// Server Activation Modal (Initial Popup)
function ServerActivationModal({ onClose, onSubmit, emailSent, isMobile }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.serverModalContent,
          padding: isMobile ? "30px 20px" : "50px 40px",
          maxWidth: isMobile ? "calc(100vw - 32px)" : "550px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.serverModalIcon}>😴</div>
        <h2
          style={{
            ...styles.serverModalTitle,
            fontSize: isMobile ? "20px" : "28px",
          }}
        >
          Oops! Our NeuroVerify is Taking a Power Nap
        </h2>
        <p style={styles.serverModalText}>
          Our neural networks are currently in sleep mode to save energy. Don't
          worry - we can wake them up faster than you can say "biometric
          authentication"!
        </p>
        <p style={styles.serverModalSubtext}>
          Just click the button below and we'll send a wake-up call to our
          servers. They'll be ready to verify your identity in no time! ⚡
        </p>
        <div style={styles.warningBox}>
          <span style={styles.warningIcon}>⚠️</span>
          <p style={styles.warningText}>
            <strong>Important:</strong> After clicking the wake-up button,
            please wait a bit before trying again. Our servers need some time to
            fully boot up! Multiple requests won't speed up the process.
          </p>
        </div>

        {!emailSent ? (
          <form
            action="https://formsubmit.co/testing.buddy1111@gmail.com"
            method="POST"
            onSubmit={onSubmit}
            style={styles.serverForm}
          >
            <input
              type="hidden"
              name="_subject"
              value="🚀 NeuroVerify Server Wake-Up Request!"
            />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="box" />
            <input type="hidden" name="_next" value={window.location.href} />
            <input
              type="hidden"
              name="Message"
              value="A user is trying to access NeuroVerify. Please wake up the Render server! 🌟"
            />
            <input
              type="hidden"
              name="Timestamp"
              value={new Date().toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
              })}
            />
            <input
              type="hidden"
              name="Request-Type"
              value="Server Activation"
            />
            <button
              type="submit"
              style={{
                ...styles.serverActivateBtn,
                padding: isMobile ? "14px 24px" : "18px 40px",
                fontSize: isMobile ? "15px" : "18px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 15px 50px rgba(0, 212, 255, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 10px 40px rgba(0, 212, 255, 0.4)";
              }}
            >
              🚀 Wake Up the Server
            </button>
          </form>
        ) : (
          <div style={styles.successMessage}>
            <div style={styles.successIcon}>✅</div>
            <p style={styles.successText}>
              Wake-up call sent! The server should be ready soon.
            </p>
            <p style={styles.successSubtext}>
              Refresh the page and try logging in again shortly!
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          style={styles.serverModalClose}
          onMouseEnter={(e) => (e.target.style.color = "#00d4ff")}
          onMouseLeave={(e) => (e.target.style.color = "#8a8fa8")}
        >
          I'll wait and try later
        </button>
      </div>
    </div>
  );
}

// Policy Modal Component
function PolicyModal({ title, onClose, content, isMobile }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={{
          ...styles.modalContent,
          maxWidth: isMobile ? "calc(100vw - 24px)" : "800px",
          maxHeight: isMobile ? "90vh" : "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            ...styles.modalHeader,
            padding: isMobile ? "20px 18px 16px" : "35px 40px 25px 40px",
          }}
        >
          <h2
            style={{
              ...styles.modalTitle,
              fontSize: isMobile ? "20px" : "32px",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={styles.modalCloseBtn}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(0, 212, 255, 0.2)";
              e.target.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(0, 212, 255, 0.1)";
              e.target.style.transform = "rotate(0deg)";
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            ...styles.modalBody,
            padding: isMobile ? "18px" : "35px 45px",
          }}
        >
          {content.map((section, idx) => (
            <div key={idx} style={styles.modalSection}>
              {section.type === "heading" && (
                <h3 style={styles.modalSectionTitle}>{section.text}</h3>
              )}
              {section.type === "subheading" && (
                <h4 style={styles.modalSubheading}>{section.text}</h4>
              )}
              {section.type === "paragraph" && (
                <p style={styles.modalParagraph}>{section.text}</p>
              )}
              {section.type === "list" && (
                <ul style={styles.modalList}>
                  {section.items.map((item, i) => (
                    <li key={i} style={styles.modalListItem}>
                      <span style={styles.modalListBullet}>▸</span>
                      <span style={styles.modalListText}>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            ...styles.modalFooter,
            padding: isMobile ? "16px 18px" : "25px 40px",
          }}
        >
          <button
            onClick={onClose}
            style={styles.modalOkBtn}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 10px 40px rgba(0, 212, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 5px 20px rgba(0, 212, 255, 0.3)";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Content Data ─────────────────────────────────────────────
const privacyPolicyContent = [
  { type: "paragraph", text: "Last Updated: January 2026" },
  { type: "heading", text: "1. INTRODUCTION" },
  {
    type: "paragraph",
    text: 'NeuroVerify ("Company", "we", or "us") operates the NeuroVerify biometric authentication platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.',
  },
  { type: "heading", text: "2. INFORMATION WE COLLECT" },
  {
    type: "list",
    items: [
      "Biometric Data: Facial recognition data for authentication purposes",
      "Account Information: Name, email, password, and profile details",
      "Device Information: Device type, OS version, and app version",
      "Usage Data: Login times, authentication attempts, and feature usage",
    ],
  },
  { type: "heading", text: "3. HOW WE USE YOUR INFORMATION" },
  {
    type: "list",
    items: [
      "To provide and maintain our authentication services",
      "To process your transactions securely",
      "To improve and optimize our platform",
      "To comply with legal obligations",
      "To prevent fraud and enhance security",
    ],
  },
  { type: "heading", text: "4. DATA SECURITY" },
  {
    type: "paragraph",
    text: "Your biometric data is encrypted using military-grade encryption (AES-256). We implement end-to-end encryption and never share your data with third parties without explicit consent.",
  },
  { type: "heading", text: "5. YOUR RIGHTS" },
  {
    type: "list",
    items: [
      "Right to Access: Request a copy of your personal data",
      "Right to Deletion: Request erasure of your account and data",
      "Right to Rectification: Correct inaccurate information",
      "Right to Data Portability: Obtain your data in machine-readable format",
    ],
  },
  { type: "heading", text: "6. POLICY UPDATES" },
  {
    type: "paragraph",
    text: "We may update this policy periodically. Continued use implies acceptance of changes.",
  },
];

const securityContent = [
  { type: "paragraph", text: "Last Updated: January 2026" },
  { type: "heading", text: "1. SECURITY INFRASTRUCTURE" },
  {
    type: "paragraph",
    text: "NeuroVerify employs industry-leading security measures to protect your biometric data:",
  },
  {
    type: "list",
    items: [
      "AES-256 Encryption: Military-grade encryption for all stored data",
      "TLS 1.3: Secure end-to-end communication over the internet",
      "Zero-Knowledge Architecture: Your biometric data never leaves your device unencrypted",
    ],
  },
  { type: "heading", text: "2. BIOMETRIC DATA PROTECTION" },
  {
    type: "list",
    items: [
      "All facial recognition data is processed locally on your device",
      "Biometric templates are encrypted before transmission",
      "Server-stored data is encrypted with keys you control",
      "Biometric data cannot be used to reconstruct your face",
    ],
  },
  { type: "heading", text: "3. AUTHENTICATION SECURITY" },
  {
    type: "list",
    items: [
      "Multi-factor authentication support",
      "Secure session management with automatic timeouts",
      "Rate limiting to prevent brute force attacks",
      "Real-time anomaly detection for suspicious activities",
    ],
  },
  { type: "heading", text: "4. COMPLIANCE STANDARDS" },
  {
    type: "list",
    items: [
      "GDPR: Full compliance with EU data protection regulations",
      "CCPA: California consumer privacy rights supported",
      "ISO 27001: Information security management certification",
      "SOC 2 Type II: Security controls validation",
      "HIPAA: Healthcare data protection standards",
    ],
  },
  { type: "heading", text: "5. INCIDENT RESPONSE" },
  {
    type: "list",
    items: [
      "24/7 security monitoring and incident detection",
      "Rapid response team for security incidents",
      "Transparent disclosure of any breaches within 72 hours",
      "Regular security audits and penetration testing",
    ],
  },
  { type: "heading", text: "6. REGULAR UPDATES" },
  {
    type: "list",
    items: [
      "Weekly security patches and updates",
      "Monthly penetration testing and vulnerability assessments",
      "Quarterly third-party security audits",
      "Annual comprehensive security review",
    ],
  },
  { type: "heading", text: "7. RESPONSIBLE DISCLOSURE" },
  {
    type: "paragraph",
    text: "We follow responsible disclosure practices for all security issues.",
  },
];

// ─── Styles ───────────────────────────────────────────────────
const styles = {
  container: {
    minHeight: "100vh",
    background: "#050816",
    color: "#ffffff",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Outfit', sans-serif",
  },
  bgWrapper: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" },
  gradientOrb1: {
    position: "absolute",
    width: "600px",
    height: "600px",
    top: "-10%",
    right: "-5%",
    background:
      "radial-gradient(circle, rgba(0, 212, 255, 0.15), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(80px)",
    animation: "float 20s ease-in-out infinite",
  },
  gradientOrb2: {
    position: "absolute",
    width: "500px",
    height: "500px",
    bottom: "10%",
    left: "-10%",
    background:
      "radial-gradient(circle, rgba(0, 212, 255, 0.12), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(70px)",
    animation: "float 18s ease-in-out infinite reverse",
  },
  gradientOrb3: {
    position: "absolute",
    width: "400px",
    height: "400px",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background:
      "radial-gradient(circle, rgba(138, 43, 226, 0.1), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(90px)",
    animation: "float 25s ease-in-out infinite",
  },
  gridPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: `linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)`,
    backgroundSize: "50px 50px",
    opacity: 0.3,
  },
  cursorGlow: {
    position: "fixed",
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(0, 212, 255, 0.08), transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    filter: "blur(40px)",
    transition: "left 0.3s ease, top 0.3s ease",
  },

  // Navbar
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "70px",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(0, 212, 255, 0.1)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    transition: "all 0.3s ease",
  },
  navContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  logoImage: {
    objectFit: "contain",
    filter: "drop-shadow(0 0 10px rgba(0, 212, 255, 0.4))",
  },
  logoText: {
    fontWeight: "800",
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },
  navLinks: { display: "flex", gap: "20px", alignItems: "center" },
  signInBtn: {
    background: "transparent",
    border: "2px solid #00d4ff",
    color: "#00d4ff",
    borderRadius: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'Outfit', sans-serif",
  },

  // Hero
  heroSection: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "1400px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
    transition: "transform 0.1s ease-out",
    paddingBottom: "60px",
  },
  heroContent: { flex: 1, animation: "slideUp 0.8s ease-out" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 20px",
    background: "rgba(0, 212, 255, 0.1)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "50px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#00d4ff",
    marginBottom: "30px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  badgeDot: {
    width: "8px",
    height: "8px",
    background: "#00d4ff",
    borderRadius: "50%",
    animation: "pulse 2s ease-in-out infinite",
  },
  mainTitle: {
    fontWeight: "900",
    lineHeight: "1",
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  titleWord1: {
    background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  titleWord2: {
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  titleWord3: { color: "#ffffff" },
  subtitle: {
    color: "#8a8fa8",
    marginBottom: "32px",
    lineHeight: "1.8",
    fontWeight: "400",
  },
  subtitleHighlight: { color: "#00d4ff", fontWeight: "600" },
  ctaGroup: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "40px",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    color: "#000",
    border: "none",
    borderRadius: "14px",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all 0.4s ease",
    boxShadow: "0 10px 40px rgba(0, 212, 255, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: "0.5px",
  },
  btnText: { position: "relative" },
  btnIcon: { fontSize: "20px", transition: "transform 0.3s ease" },
  secondaryBtn: {
    background: "transparent",
    color: "#00d4ff",
    border: "2px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'Outfit', sans-serif",
  },
  stats: {
    display: "flex",
    paddingTop: "30px",
    paddingBottom: "30px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  statItem: { display: "flex", flexDirection: "column", gap: "6px" },
  statValue: {
    fontWeight: "800",
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontFamily: "'Space Mono', monospace",
  },
  statLabel: {
    fontSize: "11px",
    color: "#8a8fa8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  // Hero Visual
  heroVisual: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "slideUp 1s ease-out 0.2s backwards",
  },
  scannerWrapper: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  circuitContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  circuitLine: {
    position: "absolute",
    width: "2px",
    height: "150px",
    top: "50%",
    left: "50%",
    transformOrigin: "0 0",
    pointerEvents: "none",
  },
  circuitLineInner: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(180deg, rgba(0, 212, 255, 0.6), transparent)",
    animation: "circuitPulse 2s ease-in-out infinite",
    boxShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
  },
  scannerCard: {
    position: "relative",
    background:
      "linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(0, 212, 255, 0.05))",
    border: "1px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "30px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    backdropFilter: "blur(10px)",
    boxShadow:
      "0 30px 80px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
    zIndex: 1,
  },
  scannerGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 50% 30%, rgba(0, 212, 255, 0.15), transparent 60%)",
    animation: "pulse 4s ease-in-out infinite",
  },
  cornerAccentTL: {
    position: "absolute",
    top: "20px",
    left: "20px",
    width: "40px",
    height: "40px",
    borderTop: "3px solid #00d4ff",
    borderLeft: "3px solid #00d4ff",
    borderRadius: "8px 0 0 0",
    opacity: 0.6,
  },
  cornerAccentTR: {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "40px",
    height: "40px",
    borderTop: "3px solid #00d4ff",
    borderRight: "3px solid #00d4ff",
    borderRadius: "0 8px 0 0",
    opacity: 0.6,
  },
  cornerAccentBL: {
    position: "absolute",
    bottom: "80px",
    left: "20px",
    width: "40px",
    height: "40px",
    borderBottom: "3px solid #00d4ff",
    borderLeft: "3px solid #00d4ff",
    borderRadius: "0 0 0 8px",
    opacity: 0.6,
  },
  cornerAccentBR: {
    position: "absolute",
    bottom: "80px",
    right: "20px",
    width: "40px",
    height: "40px",
    borderBottom: "3px solid #00d4ff",
    borderRight: "3px solid #00d4ff",
    borderRadius: "0 0 8px 0",
    opacity: 0.6,
  },
  scannerInner: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  faceOutline: {
    position: "relative",
    border: "3px solid #00d4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "glow 3s ease-in-out infinite",
    background: "rgba(0, 212, 255, 0.02)",
  },
  faceGrid: {
    position: "absolute",
    inset: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    justifyContent: "space-around",
  },
  gridLine: {
    width: "100%",
    height: "1px",
    background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
    animation: "pulse 2s ease-in-out infinite",
  },
  scanBeam: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "3px",
    background:
      "linear-gradient(90deg, transparent, #00d4ff, #00d4ff, transparent)",
    filter: "blur(3px)",
    animation: "scan 4s ease-in-out infinite",
    boxShadow: "0 0 20px #00d4ff",
  },
  faceIcon: { position: "relative", zIndex: 1 },
  faceIconCircle: {
    width: "100%",
    height: "100%",
    position: "absolute",
    background: "rgba(0, 212, 255, 0.08)",
    borderRadius: "50% 50% 60% 60%",
    border: "2px solid rgba(0, 212, 255, 0.3)",
  },
  faceEyeLeft: {
    position: "absolute",
    background: "rgba(0, 212, 255, 0.3)",
    borderRadius: "50%",
    border: "2px solid #00d4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 15px rgba(0, 212, 255, 0.5)",
  },
  faceEyeRight: {
    position: "absolute",
    background: "rgba(0, 212, 255, 0.3)",
    borderRadius: "50%",
    border: "2px solid #00d4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 15px rgba(0, 212, 255, 0.5)",
  },
  faceEyePupil: {
    background: "#00d4ff",
    borderRadius: "50%",
    boxShadow: "0 0 10px #00d4ff",
    animation: "pulse 2s ease-in-out infinite",
  },
  faceNose: {
    position: "absolute",
    top: "52%",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.3))",
    borderRadius: "0 0 50% 50%",
    border: "2px solid #00d4ff",
    borderTop: "none",
  },
  faceMouth: {
    position: "absolute",
    bottom: "25%",
    left: "50%",
    transform: "translateX(-50%)",
    border: "2px solid #00d4ff",
    borderTop: "none",
    borderRadius: "0 0 25px 25px",
    background: "rgba(0, 212, 255, 0.1)",
  },
  dataPoints: { position: "absolute", inset: 0, pointerEvents: "none" },
  dataPoint: {
    position: "absolute",
    width: "10px",
    height: "10px",
    background: "#00d4ff",
    borderRadius: "50%",
    boxShadow: "0 0 20px rgba(0, 212, 255, 0.8)",
    animation: "dataPointPulse 2s ease-in-out infinite",
  },
  dataPointPulse: {
    position: "absolute",
    inset: "-100%",
    border: "2px solid #00d4ff",
    borderRadius: "50%",
    animation: "dataPointPulse 2s ease-in-out infinite",
  },
  scannerStatus: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
    background: "rgba(0, 212, 255, 0.1)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    zIndex: 1,
  },
  statusIndicator: {
    width: "12px",
    height: "12px",
    background: "#00d4ff",
    borderRadius: "50%",
    animation: "pulse 2s ease-in-out infinite",
    boxShadow: "0 0 15px #00d4ff",
  },
  statusText: {
    fontWeight: "600",
    color: "#00d4ff",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.5px",
  },

  // Features
  featuresSection: { position: "relative", zIndex: 1 },
  sectionHeader: { textAlign: "center" },
  sectionLabel: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#00d4ff",
    letterSpacing: "3px",
    textTransform: "uppercase",
    marginBottom: "15px",
    padding: "6px 16px",
    background: "rgba(0, 212, 255, 0.1)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "20px",
  },
  sectionTitle: {
    fontWeight: "900",
    background: "linear-gradient(135deg, #ffffff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "16px",
    letterSpacing: "-1px",
  },
  sectionSubtitle: {
    color: "#8a8fa8",
    maxWidth: "600px",
    margin: "0 auto",
    lineHeight: "1.6",
  },
  bentoGrid: {
    display: "grid",
    gap: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  bentoCard: {
    background:
      "linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(0, 212, 255, 0.03))",
    border: "1px solid rgba(0, 212, 255, 0.15)",
    borderRadius: "24px",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.4s ease",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    display: "flex",
    flexDirection: "column",
  },
  bentoIcon: {
    fontSize: "36px",
    marginBottom: "16px",
    filter: "drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))",
  },
  bentoTitle: {
    fontWeight: "800",
    marginBottom: "10px",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  bentoDesc: { fontSize: "14px", color: "#8a8fa8", lineHeight: "1.7", flex: 1 },
  bentoGlow1: {
    position: "absolute",
    bottom: "-50%",
    right: "-30%",
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(0, 212, 255, 0.15), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  bentoGlow2: {
    position: "absolute",
    top: "-50%",
    left: "-30%",
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(0, 212, 255, 0.12), transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    pointerEvents: "none",
  },
  techBadges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  techBadge: {
    padding: "5px 12px",
    background: "rgba(0, 212, 255, 0.1)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#00d4ff",
    fontFamily: "'Space Mono', monospace",
  },

  // Timeline
  timelineSection: { position: "relative", zIndex: 1 },
  timeline: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
  },
  timelineItem: {
    flex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  timelineNumber: {
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontFamily: "'Space Mono', monospace",
    marginBottom: "20px",
    boxShadow: "0 10px 40px rgba(0, 212, 255, 0.4)",
    position: "relative",
    zIndex: 2,
  },
  timelineContent: {
    background:
      "linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(0, 212, 255, 0.03))",
    border: "1px solid rgba(0, 212, 255, 0.15)",
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
    position: "relative",
  },
  timelineIcon: { marginBottom: "12px" },
  timelineTitle: { fontWeight: "800", marginBottom: "10px", color: "#ffffff" },
  timelineDesc: { fontSize: "13px", color: "#8a8fa8", lineHeight: "1.7" },
  timelineConnector: {
    position: "absolute",
    top: "40px",
    left: "50%",
    width: "calc(100% + 40px)",
    height: "2px",
    background: "linear-gradient(90deg, #00d4ff, #00d4ff)",
    zIndex: 1,
  },

  // CTA
  ctaSection: { position: "relative", zIndex: 1 },
  ctaCard: {
    maxWidth: "900px",
    margin: "0 auto",
    background:
      "linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.08))",
    border: "2px solid rgba(0, 212, 255, 0.3)",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(20px)",
    boxShadow: "0 30px 80px rgba(0, 212, 255, 0.2)",
  },
  ctaContent: { position: "relative", zIndex: 2 },
  ctaTitle: {
    fontWeight: "900",
    marginBottom: "16px",
    background: "linear-gradient(135deg, #ffffff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-1px",
  },
  ctaSubtitle: { color: "#8a8fa8", lineHeight: "1.8", maxWidth: "700px" },
  ctaButton: {
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    color: "#000",
    border: "none",
    borderRadius: "16px",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all 0.4s ease",
    boxShadow: "0 15px 50px rgba(0, 212, 255, 0.4)",
    fontFamily: "'Outfit', sans-serif",
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    letterSpacing: "0.5px",
  },
  ctaButtonArrow: { fontSize: "22px" },
  ctaGlow: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, rgba(0, 212, 255, 0.2), transparent 70%)",
    filter: "blur(80px)",
    animation: "pulse 4s ease-in-out infinite",
    zIndex: 1,
  },

  // Footer
  footer: {
    borderTop: "1px solid rgba(0, 212, 255, 0.1)",
    position: "relative",
    zIndex: 1,
  },
  footerContent: { maxWidth: "1400px", margin: "0 auto", display: "grid" },
  footerBrand: { display: "flex", flexDirection: "column", gap: "16px" },
  footerLogo: { display: "flex", alignItems: "center", gap: "12px" },
  footerLogoIcon: { width: "36px", height: "36px", position: "relative" },
  footerLogoIconInner: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    borderRadius: "8px",
    boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
  },
  footerLogoText: {
    fontSize: "20px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  footerTagline: {
    fontSize: "14px",
    color: "#8a8fa8",
    lineHeight: "1.7",
    maxWidth: "400px",
  },
  footerLinks: { display: "flex", gap: "60px" },
  footerLinkGroup: { display: "flex", flexDirection: "column", gap: "12px" },
  footerLinkTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#00d4ff",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  footerLink: {
    color: "#8a8fa8",
    fontSize: "14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "'Outfit', sans-serif",
    transition: "color 0.3s ease",
    padding: 0,
  },
  footerBottom: {
    maxWidth: "1400px",
    margin: "0 auto",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    paddingTop: "24px",
    display: "flex",
    alignItems: "center",
  },
  footerCopy: {
    fontSize: "12px",
    color: "#5a5f7a",
    fontFamily: "'Space Mono', monospace",
  },

  // Modals
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
    animation: "fadeIn 0.3s ease-out",
  },
  serverModalContent: {
    background:
      "linear-gradient(135deg, rgba(5, 8, 22, 0.98), rgba(10, 15, 35, 0.98))",
    border: "2px solid rgba(0, 212, 255, 0.3)",
    borderRadius: "24px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 30px 90px rgba(0, 212, 255, 0.4)",
    backdropFilter: "blur(20px)",
    animation: "slideUp 0.5s ease-out",
    position: "relative",
    overflow: "hidden",
  },
  serverModalIcon: {
    fontSize: "60px",
    marginBottom: "16px",
    animation: "pulse 2s ease-in-out infinite",
  },
  serverModalTitle: {
    fontWeight: "900",
    marginBottom: "16px",
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: "1.3",
  },
  serverModalText: {
    fontSize: "15px",
    color: "#c5c7d4",
    lineHeight: "1.7",
    marginBottom: "12px",
  },
  serverModalSubtext: {
    fontSize: "13px",
    color: "#8a8fa8",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  warningBox: {
    background: "rgba(251, 191, 36, 0.1)",
    border: "1px solid rgba(251, 191, 36, 0.3)",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "28px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    textAlign: "left",
  },
  warningIcon: { fontSize: "20px", flexShrink: 0, marginTop: "2px" },
  warningText: {
    fontSize: "12px",
    color: "#fbbf24",
    lineHeight: "1.6",
    margin: 0,
  },
  serverForm: { marginBottom: "20px" },
  serverActivateBtn: {
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    color: "#000",
    border: "none",
    borderRadius: "14px",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all 0.4s ease",
    boxShadow: "0 10px 40px rgba(0, 212, 255, 0.4)",
    width: "100%",
    maxWidth: "350px",
    fontFamily: "'Outfit', sans-serif",
  },
  successMessage: { marginBottom: "20px" },
  successIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    animation: "slideUp 0.5s ease-out",
  },
  successText: {
    fontSize: "15px",
    color: "#00d4ff",
    fontWeight: "700",
    lineHeight: "1.6",
    marginBottom: "6px",
  },
  successSubtext: { fontSize: "13px", color: "#8a8fa8", lineHeight: "1.5" },
  serverModalClose: {
    background: "none",
    border: "none",
    color: "#8a8fa8",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textDecoration: "underline",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: "600",
  },

  // Policy Modal
  modalContent: {
    background:
      "linear-gradient(135deg, rgba(5, 8, 22, 0.98), rgba(10, 15, 35, 0.98))",
    border: "2px solid rgba(0, 212, 255, 0.2)",
    borderRadius: "20px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 30px 90px rgba(0, 212, 255, 0.3)",
    backdropFilter: "blur(20px)",
    animation: "slideUp 0.4s ease-out",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(0, 212, 255, 0.15)",
  },
  modalTitle: {
    fontWeight: "900",
    margin: 0,
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },
  modalCloseBtn: {
    background: "rgba(0, 212, 255, 0.1)",
    border: "1px solid rgba(0, 212, 255, 0.3)",
    fontSize: "18px",
    color: "#00d4ff",
    cursor: "pointer",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    fontWeight: "bold",
    fontFamily: "'Outfit', sans-serif",
  },
  modalBody: {
    flex: 1,
    overflow: "auto",
    color: "#c5c7d4",
    fontSize: "14px",
    lineHeight: "1.8",
  },
  modalSection: { marginBottom: "22px" },
  modalSectionTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#00d4ff",
    marginBottom: "12px",
    marginTop: "8px",
    letterSpacing: "0.3px",
    textAlign: "left",
  },
  modalSubheading: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#8a8fa8",
    marginBottom: "10px",
    marginTop: "6px",
    textAlign: "left",
  },
  modalParagraph: {
    margin: "0 0 12px 0",
    color: "#8a8fa8",
    lineHeight: "1.8",
    textAlign: "left",
  },
  modalList: { listStyle: "none", padding: 0, margin: "12px 0" },
  modalListItem: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "10px",
    textAlign: "left",
  },
  modalListBullet: {
    color: "#00d4ff",
    fontSize: "16px",
    marginRight: "12px",
    lineHeight: "1.8",
    flexShrink: 0,
    fontWeight: "bold",
  },
  modalListText: {
    color: "#8a8fa8",
    lineHeight: "1.8",
    flex: 1,
    textAlign: "left",
  },
  modalFooter: {
    borderTop: "1px solid rgba(0, 212, 255, 0.15)",
    display: "flex",
    justifyContent: "flex-end",
  },
  modalOkBtn: {
    padding: "12px 36px",
    background: "linear-gradient(135deg, #00d4ff, #00d4ff)",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "1px",
    boxShadow: "0 5px 20px rgba(0, 212, 255, 0.3)",
    fontFamily: "'Outfit', sans-serif",
  },
};

export default Home;
