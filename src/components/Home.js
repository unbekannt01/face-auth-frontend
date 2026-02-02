'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedNeuroVerify');
    if (!hasVisited) {
      setTimeout(() => {
        setShowServerModal(true);
        sessionStorage.setItem('hasVisitedNeuroVerify', 'true');
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
            top: `${mousePos.y}px`
          }}
        ></div>
      </div>

      {/* Glassmorphic Navigation */}
      <nav style={{
        ...styles.navbar,
        background: scrollY > 50 ? 'rgba(5, 8, 22, 0.95)' : 'rgba(5, 8, 22, 0.7)',
        boxShadow: scrollY > 50 ? '0 8px 32px rgba(0, 255, 157, 0.1)' : 'none'
      }}>
        <div style={styles.navContent}>
          <div style={styles.logo} onClick={() => navigate('/')}>
            <div style={styles.logoIcon}>
              <div style={styles.logoIconInner}></div>
            </div>
            <span style={styles.logoText}>NeuroVerify</span>
          </div>
          <div style={styles.navLinks}>
            <button 
              onClick={() => navigate('/login')} 
              style={styles.signInBtn}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #00d4ff, #00d4ff)';
                e.target.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#00d4ff';
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} style={{
        ...styles.heroSection,
        transform: `translateY(${scrollY * 0.3}px)`
      }}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <span style={styles.badgeDot}></span>
            Next-Gen Authentication
          </div>
          <h1 style={styles.mainTitle}>
            <span style={styles.titleWord1}>Secure</span>
            <span style={styles.titleWord2}>Identity</span>
            <span style={styles.titleWord3}>Verification</span>
          </h1>
          <p style={styles.subtitle}>
            Experience the future of biometric security with AI-powered facial recognition. 
            <span style={styles.subtitleHighlight}> Fast. Secure. Seamless.</span>
          </p>
          <div style={styles.ctaGroup}>
            <button 
              onClick={() => navigate('/register')} 
              style={styles.primaryBtn}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.02)';
                e.target.style.boxShadow = '0 20px 60px rgba(0, 255, 157, 0.4), 0 0 80px rgba(0, 255, 157, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 10px 40px rgba(0, 255, 157, 0.3)';
              }}
            >
              <span style={styles.btnText}>Get Started</span>
              <span style={styles.btnIcon}>→</span>
            </button>
            <button 
              onClick={() => navigate('/login')} 
              style={styles.secondaryBtn}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 255, 157, 0.1)';
                e.target.style.borderColor = '#00d4ff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(0, 255, 157, 0.3)';
              }}
            >
              Already a Member
            </button>
          </div>

          {/* Stats */}
          <div style={styles.stats}>
            {[
              { value: '99.9%', label: 'Accuracy' },
              { value: '<50ms', label: 'Response Time' },
            ].map((stat, idx) => (
              <div key={idx} style={styles.statItem}>
                <div style={styles.statValue}>{stat.value}</div>
                <div style={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Card Visual */}
        <div style={styles.heroVisual}>
          <div style={styles.scannerWrapper}>
            <div style={styles.scannerCard}>
              <div style={styles.scannerGlow}></div>
              <div style={styles.scannerInner}>
                <div style={styles.faceOutline}>
                  <div style={styles.faceGrid}>
                    {[...Array(12)].map((_, i) => (
                      <div key={i} style={styles.gridLine}></div>
                    ))}
                  </div>
                  <div style={styles.scanBeam}></div>
                  <div style={styles.faceIcon}>
                    <div style={styles.faceIconCircle}></div>
                    <div style={styles.faceIconFeature1}></div>
                    <div style={styles.faceIconFeature2}></div>
                  </div>
                </div>
                <div style={styles.dataPoints}>
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      style={{
                        ...styles.dataPoint,
                        left: `${[20, 80, 30, 70][i]}%`,
                        top: `${[25, 30, 75, 70][i]}%`,
                        animationDelay: `${i * 0.3}s`
                      }}
                    >
                      <div style={styles.dataPointPulse}></div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.scannerStatus}>
                <div style={styles.statusIndicator}></div>
                <span style={styles.statusText}>Biometric Scan Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Bento Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>CAPABILITIES</span>
          <h2 style={styles.sectionTitle}>Powered by Advanced AI</h2>
          <p style={styles.sectionSubtitle}>
            Enterprise-grade security meets consumer-friendly simplicity
          </p>
        </div>

        <div style={styles.bentoGrid}>
          {/* Large Feature 1 */}
          <div style={{...styles.bentoCard, ...styles.bentoLarge1}}>
            <div style={styles.bentoIcon}>🔐</div>
            <h3 style={styles.bentoTitle}>Military-Grade Encryption</h3>
            <p style={styles.bentoDesc}>
              AES-256 encryption with zero-knowledge architecture ensures your biometric 
              data remains completely private and secure.
            </p>
            <div style={styles.bentoGlow1}></div>
          </div>

          {/* Small Feature 1 */}
          <div style={{...styles.bentoCard, ...styles.bentoSmall1}}>
            <div style={styles.bentoIcon}>⚡</div>
            <h3 style={styles.bentoTitle}>Lightning Speed</h3>
            <p style={styles.bentoDesc}>
              Authenticate in under 50ms with our optimized neural networks.
            </p>
          </div>

          {/* Small Feature 2 */}
          <div style={{...styles.bentoCard, ...styles.bentoSmall2}}>
            <div style={styles.bentoIcon}>🌍</div>
            <h3 style={styles.bentoTitle}>Global Ready</h3>
            <p style={styles.bentoDesc}>
              Works seamlessly across 150+ countries with multi-language support.
            </p>
          </div>

          {/* Large Feature 2 */}
          <div style={{...styles.bentoCard, ...styles.bentoLarge2}}>
            <div style={styles.bentoIcon}>🛡️</div>
            <h3 style={styles.bentoTitle}>Privacy First Design</h3>
            <p style={styles.bentoDesc}>
              Your biometric data is processed locally on your device. We never store 
              raw facial images on our servers.
            </p>
            <div style={styles.bentoGlow2}></div>
          </div>

          {/* Medium Feature */}
          <div style={{...styles.bentoCard, ...styles.bentoMedium}}>
            <div style={styles.bentoIcon}>📱</div>
            <h3 style={styles.bentoTitle}>Cross-Platform QR</h3>
            <p style={styles.bentoDesc}>
              Scan and verify from any smartphone. No app installation required.
            </p>
          </div>

          {/* Wide Feature */}
          <div style={{...styles.bentoCard, ...styles.bentoWide}}>
            <div style={styles.bentoIcon}>🚀</div>
            <h3 style={styles.bentoTitle}>Next-Gen Neural Technology</h3>
            <p style={styles.bentoDesc}>
              Powered by cutting-edge deep learning models trained on millions of verification patterns 
              to deliver unmatched accuracy and security.
            </p>
            <div style={styles.techBadges}>
              {['AI/ML', 'TensorFlow', 'Edge Computing', 'Real-time'].map((tech, i) => (
                <span key={i} style={styles.techBadge}>{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section style={styles.timelineSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>PROCESS</span>
          <h2 style={styles.sectionTitle}>Three Simple Steps</h2>
        </div>

        <div style={styles.timeline}>
          {[
            { 
              num: '01', 
              title: 'Create Account', 
              desc: 'Sign up with your email and set up your secure profile in seconds.',
              icon: '✍️'
            },
            { 
              num: '02', 
              title: 'Biometric Scan', 
              desc: 'Use your device camera to capture and verify your unique facial signature.',
              icon: '📸'
            },
            { 
              num: '03', 
              title: 'Instant Access', 
              desc: 'Enjoy passwordless login with AI-powered facial recognition.',
              icon: '🎉'
            }
          ].map((step, idx) => (
            <div key={idx} style={styles.timelineItem}>
              <div style={styles.timelineNumber}>{step.num}</div>
              <div style={styles.timelineContent}>
                <div style={styles.timelineIcon}>{step.icon}</div>
                <h3 style={styles.timelineTitle}>{step.title}</h3>
                <p style={styles.timelineDesc}>{step.desc}</p>
              </div>
              {idx < 2 && <div style={styles.timelineConnector}></div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <div style={styles.ctaContent}>
            <h2 style={styles.ctaTitle}>Ready to Go Passwordless?</h2>
            <p style={styles.ctaSubtitle}>
              Join thousands of users who've already made the switch to secure, 
              AI-powered biometric authentication.
            </p>
            <button 
              onClick={() => navigate('/register')} 
              style={styles.ctaButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.02)';
                e.target.style.boxShadow = '0 25px 70px rgba(0, 255, 157, 0.5), 0 0 100px rgba(0, 255, 157, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 15px 50px rgba(0, 255, 157, 0.4)';
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
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
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
              <button onClick={() => setShowPrivacyModal(true)} style={styles.footerLink}>
                Privacy Policy
              </button>
              <button onClick={() => setShowSecurityModal(true)} style={styles.footerLink}>
                Security
              </button>
            </div>
            {/* <div style={styles.footerLinkGroup}>
              <h4 style={styles.footerLinkTitle}>Company</h4>
              <button style={styles.footerLink}>About</button>
              <button style={styles.footerLink}>Contact</button>
            </div> */}
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopy}>© 2026 NeuroVerify. All rights reserved.</p>
          {/* <div style={styles.footerSocials}>
            <span style={styles.socialLink}>Twitter</span>
            <span style={styles.socialLink}>LinkedIn</span>
            <span style={styles.socialLink}>GitHub</span>
          </div> */}
        </div>
      </footer>

      {/* Modals */}
      {showServerModal && (
        <ServerActivationModal 
          onClose={() => setShowServerModal(false)}
          onSubmit={handleActivateServer}
          emailSent={emailSent}
        />
      )}

      {showPrivacyModal && (
        <PolicyModal
          title="Privacy Policy"
          onClose={() => setShowPrivacyModal(false)}
          content={privacyPolicyContent}
        />
      )}

      {showSecurityModal && (
        <PolicyModal
          title="Security & Compliance"
          onClose={() => setShowSecurityModal(false)}
          content={securityContent}
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

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 157, 0.5); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 157, 0.8), 0 0 60px rgba(0, 212, 255, 0.4); }
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

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}

// Server Activation Modal
function ServerActivationModal({ onClose, onSubmit, emailSent }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.serverModalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.serverModalIcon}>😴</div>
        <h2 style={styles.serverModalTitle}>
          Oops! Our AI is Taking a Power Nap
        </h2>
        <p style={styles.serverModalText}>
          Our neural networks are currently in sleep mode to save energy. 
          Don't worry - we can wake them up faster than you can say "biometric authentication"!
        </p>
        <p style={styles.serverModalSubtext}>
          Just click the button below and we'll send a wake-up call to our servers. 
          They'll be ready to verify your identity in no time! ⚡
        </p>
        <div style={styles.warningBox}>
          <span style={styles.warningIcon}>⚠️</span>
          <p style={styles.warningText}>
            <strong>Important:</strong> After clicking the wake-up button, please wait a bit before trying again. 
            Our servers need some time to fully boot up! Multiple requests won't speed up the process.
          </p>
        </div>

        {!emailSent ? (
          <form 
            action="https://formsubmit.co/testing.buddy1111@gmail.com" 
            method="POST"
            onSubmit={onSubmit}
            style={styles.serverForm}
          >
            <input type="hidden" name="_subject" value="🚀 NeuroVerify Server Wake-Up Request!" />
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
              value={new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} 
            />
            <input 
              type="hidden" 
              name="Request-Type" 
              value="Server Activation" 
            />
            
            <button 
              type="submit"
              style={styles.serverActivateBtn}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 15px 50px rgba(0, 255, 157, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 10px 40px rgba(0, 255, 157, 0.4)';
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
          onMouseEnter={(e) => e.target.style.color = '#00d4ff'}
          onMouseLeave={(e) => e.target.style.color = '#8a8fa8'}
        >
          I'll wait and try later
        </button>
      </div>
    </div>
  );
}

// Policy Modal Component
function PolicyModal({ title, onClose, content }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{title}</h2>
          <button 
            onClick={onClose} 
            style={styles.modalCloseBtn}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0, 255, 157, 0.2)';
              e.target.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 255, 157, 0.1)';
              e.target.style.transform = 'rotate(0deg)';
            }}
          >
            ✕
          </button>
        </div>
        <div style={styles.modalBody}>
          {content.map((section, idx) => (
            <div key={idx} style={styles.modalSection}>
              {section.type === 'heading' && (
                <h3 style={styles.modalSectionTitle}>{section.text}</h3>
              )}
              {section.type === 'subheading' && (
                <h4 style={styles.modalSubheading}>{section.text}</h4>
              )}
              {section.type === 'paragraph' && (
                <p style={styles.modalParagraph}>{section.text}</p>
              )}
              {section.type === 'list' && (
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
        <div style={styles.modalFooter}>
          <button 
            onClick={onClose} 
            style={styles.modalOkBtn}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 40px rgba(0, 255, 157, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 5px 20px rgba(0, 255, 157, 0.3)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Content Data
const privacyPolicyContent = [
  { type: 'paragraph', text: 'Last Updated: January 2026' },
  { type: 'heading', text: '1. INTRODUCTION' },
  { type: 'paragraph', text: 'NeuroVerify ("Company", "we", or "us") operates the NeuroVerify biometric authentication platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.' },
  { type: 'heading', text: '2. INFORMATION WE COLLECT' },
  { type: 'list', items: [
    'Biometric Data: Facial recognition data for authentication purposes',
    'Account Information: Name, email, password, and profile details',
    'Device Information: Device type, OS version, and app version',
    'Usage Data: Login times, authentication attempts, and feature usage'
  ]},
  { type: 'heading', text: '3. HOW WE USE YOUR INFORMATION' },
  { type: 'list', items: [
    'To provide and maintain our authentication services',
    'To process your transactions securely',
    'To improve and optimize our platform',
    'To comply with legal obligations',
    'To prevent fraud and enhance security'
  ]},
  { type: 'heading', text: '4. DATA SECURITY' },
  { type: 'paragraph', text: 'Your biometric data is encrypted using military-grade encryption (AES-256). We implement end-to-end encryption and never share your data with third parties without explicit consent.' },
  { type: 'heading', text: '5. YOUR RIGHTS' },
  { type: 'list', items: [
    'Right to Access: Request a copy of your personal data',
    'Right to Deletion: Request erasure of your account and data',
    'Right to Rectification: Correct inaccurate information',
    'Right to Data Portability: Obtain your data in machine-readable format'
  ]},
  { type: 'heading', text: '6. POLICY UPDATES' },
  { type: 'paragraph', text: 'We may update this policy periodically. Continued use implies acceptance of changes.' }
];

const securityContent = [
  { type: 'paragraph', text: 'Last Updated: January 2026' },
  { type: 'heading', text: '1. SECURITY INFRASTRUCTURE' },
  { type: 'paragraph', text: 'NeuroVerify employs industry-leading security measures to protect your biometric data:' },
  { type: 'list', items: [
    'AES-256 Encryption: Military-grade encryption for all stored data',
    'TLS 1.3: Secure end-to-end communication over the internet',
    'Zero-Knowledge Architecture: Your biometric data never leaves your device unencrypted'
  ]},
  { type: 'heading', text: '2. BIOMETRIC DATA PROTECTION' },
  { type: 'list', items: [
    'All facial recognition data is processed locally on your device',
    'Biometric templates are encrypted before transmission',
    'Server-stored data is encrypted with keys you control',
    'Biometric data cannot be used to reconstruct your face'
  ]},
  { type: 'heading', text: '3. AUTHENTICATION SECURITY' },
  { type: 'list', items: [
    'Multi-factor authentication support',
    'Secure session management with automatic timeouts',
    'Rate limiting to prevent brute force attacks',
    'Real-time anomaly detection for suspicious activities'
  ]},
  { type: 'heading', text: '4. COMPLIANCE STANDARDS' },
  { type: 'list', items: [
    'GDPR: Full compliance with EU data protection regulations',
    'CCPA: California consumer privacy rights supported',
    'ISO 27001: Information security management certification',
    'SOC 2 Type II: Security controls validation',
    'HIPAA: Healthcare data protection standards'
  ]},
  { type: 'heading', text: '5. INCIDENT RESPONSE' },
  { type: 'list', items: [
    '24/7 security monitoring and incident detection',
    'Rapid response team for security incidents',
    'Transparent disclosure of any breaches within 72 hours',
    'Regular security audits and penetration testing'
  ]},
  { type: 'heading', text: '6. REGULAR UPDATES' },
  { type: 'list', items: [
    'Weekly security patches and updates',
    'Monthly penetration testing and vulnerability assessments',
    'Quarterly third-party security audits',
    'Annual comprehensive security review'
  ]},
  { type: 'heading', text: '7. RESPONSIBLE DISCLOSURE' },
  { type: 'paragraph', text: 'We follow responsible disclosure practices for all security issues.' }
];

const styles = {
  container: {
    minHeight: '100vh',
    background: '#050816',
    color: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Outfit', sans-serif"
  },

  // Background Effects
  bgWrapper: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none'
  },
  gradientOrb1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    top: '-10%',
    right: '-5%',
    background: 'radial-gradient(circle, rgba(0, 255, 157, 0.15), transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    animation: 'float 20s ease-in-out infinite'
  },
  gradientOrb2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    bottom: '10%',
    left: '-10%',
    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.12), transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(70px)',
    animation: 'float 18s ease-in-out infinite reverse'
  },
  gradientOrb3: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'radial-gradient(circle, rgba(138, 43, 226, 0.1), transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(90px)',
    animation: 'float 25s ease-in-out infinite'
  },
  gridPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0, 255, 157, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 157, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    opacity: 0.3
  },
  cursorGlow: {
    position: 'fixed',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(0, 255, 157, 0.08), transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%)',
    filter: 'blur(40px)',
    transition: 'left 0.3s ease, top 0.3s ease'
  },

  // Navbar
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '80px',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0, 255, 157, 0.1)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    padding: '0 60px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoIconInner: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    borderRadius: '10px',
    animation: 'pulse 3s ease-in-out infinite',
    boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)'
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px'
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  },
  signInBtn: {
    padding: '12px 30px',
    background: 'transparent',
    border: '2px solid #00d4ff',
    color: '#00d4ff',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Outfit', sans-serif"
  },

  // Hero Section
  heroSection: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '120px 60px 60px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
    gap: '100px',
    transition: 'transform 0.1s ease-out'
  },
  heroContent: {
    flex: 1,
    maxWidth: '600px',
    animation: 'slideUp 0.8s ease-out'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 20px',
    background: 'rgba(0, 255, 157, 0.1)',
    border: '1px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '50px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: '30px',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  badgeDot: {
    width: '8px',
    height: '8px',
    background: '#00d4ff',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite'
  },
  mainTitle: {
    fontSize: '72px',
    fontWeight: '900',
    lineHeight: '1',
    marginBottom: '30px',
    letterSpacing: '-2px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  titleWord1: {
    background: 'linear-gradient(135deg, #ffffff, #a0a0a0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  titleWord2: {
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  titleWord3: {
    color: '#ffffff'
  },
  subtitle: {
    fontSize: '18px',
    color: '#8a8fa8',
    marginBottom: '40px',
    lineHeight: '1.8',
    fontWeight: '400'
  },
  subtitleHighlight: {
    color: '#00d4ff',
    fontWeight: '600'
  },
  ctaGroup: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    marginBottom: '60px'
  },
  primaryBtn: {
    padding: '18px 40px',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    color: '#000',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    boxShadow: '0 10px 40px rgba(0, 255, 157, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: '0.5px'
  },
  btnText: {
    position: 'relative'
  },
  btnIcon: {
    fontSize: '20px',
    transition: 'transform 0.3s ease'
  },
  secondaryBtn: {
    padding: '18px 40px',
    background: 'transparent',
    color: '#00d4ff',
    border: '2px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: "'Outfit', sans-serif"
  },
  stats: {
    display: 'flex',
    gap: '50px',
    paddingTop: '30px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontFamily: "'Space Mono', monospace"
  },
  statLabel: {
    fontSize: '13px',
    color: '#8a8fa8',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },

  // Hero Visual
  heroVisual: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'slideUp 1s ease-out 0.2s backwards'
  },
  scannerWrapper: {
    position: 'relative'
  },
  scannerCard: {
    width: '420px',
    height: '500px',
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.05), rgba(0, 212, 255, 0.05))',
    border: '1px solid rgba(0, 255, 157, 0.2)',
    borderRadius: '30px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 30px 80px rgba(0, 255, 157, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    padding: '40px 30px'
  },
  scannerGlow: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 30%, rgba(0, 255, 157, 0.15), transparent 60%)',
    animation: 'pulse 4s ease-in-out infinite'
  },
  scannerInner: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  faceOutline: {
    width: '280px',
    height: '340px',
    position: 'relative',
    border: '3px solid #00d4ff',
    borderRadius: '140px 140px 180px 180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'glow 3s ease-in-out infinite'
  },
  faceGrid: {
    position: 'absolute',
    inset: '20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px'
  },
  gridLine: {
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
    animation: 'pulse 2s ease-in-out infinite',
    animationDelay: 'calc(var(--i) * 0.1s)'
  },
  scanBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: 'linear-gradient(90deg, transparent, #00d4ff, #00d4ff, transparent)',
    filter: 'blur(4px)',
    animation: 'scan 3s ease-in-out infinite',
    boxShadow: '0 0 20px #00d4ff'
  },
  faceIcon: {
    position: 'relative',
    width: '120px',
    height: '120px',
    zIndex: 1
  },
  faceIconCircle: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.3), rgba(0, 212, 255, 0.2))',
    border: '2px solid rgba(0, 255, 157, 0.5)',
    position: 'absolute',
    animation: 'pulse 2s ease-in-out infinite'
  },
  faceIconFeature1: {
    position: 'absolute',
    top: '35%',
    left: '30%',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#00d4ff',
    boxShadow: '0 0 10px #00d4ff'
  },
  faceIconFeature2: {
    position: 'absolute',
    top: '35%',
    right: '30%',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#00d4ff',
    boxShadow: '0 0 10px #00d4ff'
  },
  dataPoints: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none'
  },
  dataPoint: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    background: '#00d4ff',
    borderRadius: '50%',
    boxShadow: '0 0 15px #00d4ff',
    animation: 'dataPointPulse 2s ease-in-out infinite'
  },
  dataPointPulse: {
    position: 'absolute',
    inset: '-50%',
    border: '2px solid #00d4ff',
    borderRadius: '50%',
    animation: 'dataPointPulse 2s ease-in-out infinite'
  },
  scannerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '30px',
    padding: '12px 20px',
    background: 'rgba(0, 255, 157, 0.1)',
    border: '1px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '12px'
  },
  statusIndicator: {
    width: '10px',
    height: '10px',
    background: '#00d4ff',
    borderRadius: '50%',
    animation: 'pulse 2s ease-in-out infinite',
    boxShadow: '0 0 10px #00d4ff'
  },
  statusText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#00d4ff',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.5px'
  },

  // Features Section
  featuresSection: {
    padding: '120px 60px',
    position: 'relative',
    zIndex: 1
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '80px'
  },
  sectionLabel: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#00d4ff',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    marginBottom: '15px',
    padding: '6px 16px',
    background: 'rgba(0, 255, 157, 0.1)',
    border: '1px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '20px'
  },
  sectionTitle: {
    fontSize: '56px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #ffffff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '20px',
    letterSpacing: '-1px'
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: '#8a8fa8',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6'
  },

  // Bento Grid
  bentoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(3, 280px)',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  bentoCard: {
    background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.05), rgba(0, 212, 255, 0.03))',
    border: '1px solid rgba(0, 255, 157, 0.15)',
    borderRadius: '24px',
    padding: '35px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.4s ease',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column'
  },
  bentoLarge1: {
    gridColumn: 'span 2',
    gridRow: 'span 2'
  },
  bentoLarge2: {
    gridColumn: 'span 2',
    gridRow: 'span 2'
  },
  bentoSmall1: {
    gridColumn: 'span 2'
  },
  bentoSmall2: {
    gridColumn: 'span 2'
  },
  bentoMedium: {
    gridColumn: 'span 2'
  },
  bentoWide: {
    gridColumn: 'span 4'
  },
  bentoIcon: {
    fontSize: '48px',
    marginBottom: '20px',
    filter: 'drop-shadow(0 0 20px rgba(0, 255, 157, 0.3))'
  },
  bentoTitle: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '12px',
    color: '#ffffff',
    letterSpacing: '-0.5px'
  },
  bentoDesc: {
    fontSize: '15px',
    color: '#8a8fa8',
    lineHeight: '1.7',
    flex: 1
  },
  bentoGlow1: {
    position: 'absolute',
    bottom: '-50%',
    right: '-30%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(0, 255, 157, 0.15), transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(60px)',
    pointerEvents: 'none'
  },
  bentoGlow2: {
    position: 'absolute',
    top: '-50%',
    left: '-30%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.12), transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(60px)',
    pointerEvents: 'none'
  },
  techBadges: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '20px'
  },
  techBadge: {
    padding: '6px 14px',
    background: 'rgba(0, 255, 157, 0.1)',
    border: '1px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#00d4ff',
    fontFamily: "'Space Mono', monospace"
  },

  // Timeline Section
  timelineSection: {
    padding: '120px 60px',
    position: 'relative',
    zIndex: 1
  },
  timeline: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '40px',
    position: 'relative'
  },
  timelineItem: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  timelineNumber: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '900',
    fontFamily: "'Space Mono', monospace",
    marginBottom: '30px',
    boxShadow: '0 10px 40px rgba(0, 255, 157, 0.4)',
    position: 'relative',
    zIndex: 2
  },
  timelineContent: {
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.05), rgba(0, 212, 255, 0.03))',
    border: '1px solid rgba(0, 255, 157, 0.15)',
    borderRadius: '20px',
    padding: '35px 30px',
    backdropFilter: 'blur(10px)',
    position: 'relative'
  },
  timelineIcon: {
    fontSize: '40px',
    marginBottom: '15px'
  },
  timelineTitle: {
    fontSize: '22px',
    fontWeight: '800',
    marginBottom: '12px',
    color: '#ffffff'
  },
  timelineDesc: {
    fontSize: '14px',
    color: '#8a8fa8',
    lineHeight: '1.7'
  },
  timelineConnector: {
    position: 'absolute',
    top: '40px',
    left: '50%',
    width: 'calc(100% + 40px)',
    height: '2px',
    background: 'linear-gradient(90deg, #00d4ff, #00d4ff)',
    zIndex: 1
  },

  // CTA Section
  ctaSection: {
    padding: '120px 60px',
    position: 'relative',
    zIndex: 1
  },
  ctaCard: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.1), rgba(0, 212, 255, 0.08))',
    border: '2px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '40px',
    padding: '80px 60px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 30px 80px rgba(0, 255, 157, 0.2)'
  },
  ctaContent: {
    position: 'relative',
    zIndex: 2
  },
  ctaTitle: {
    fontSize: '48px',
    fontWeight: '900',
    marginBottom: '20px',
    background: 'linear-gradient(135deg, #ffffff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-1px'
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: '#8a8fa8',
    marginBottom: '40px',
    lineHeight: '1.8',
    maxWidth: '700px',
    margin: '0 auto 40px'
  },
  ctaButton: {
    padding: '20px 50px',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    color: '#000',
    border: 'none',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    boxShadow: '0 15px 50px rgba(0, 255, 157, 0.4)',
    fontFamily: "'Outfit', sans-serif",
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    letterSpacing: '0.5px'
  },
  ctaButtonArrow: {
    fontSize: '24px'
  },
  ctaGlow: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, rgba(0, 255, 157, 0.2), transparent 70%)',
    filter: 'blur(80px)',
    animation: 'pulse 4s ease-in-out infinite',
    zIndex: 1
  },

  // Footer
  footer: {
    padding: '80px 60px 40px',
    borderTop: '1px solid rgba(0, 255, 157, 0.1)',
    position: 'relative',
    zIndex: 1
  },
  footerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '80px',
    marginBottom: '60px'
  },
  footerBrand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  footerLogoIcon: {
    width: '36px',
    height: '36px',
    position: 'relative'
  },
  footerLogoIconInner: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    borderRadius: '8px',
    boxShadow: '0 0 15px rgba(0, 255, 157, 0.3)'
  },
  footerLogoText: {
    fontSize: '20px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  footerTagline: {
    fontSize: '15px',
    color: '#8a8fa8',
    lineHeight: '1.7',
    maxWidth: '400px'
  },
  footerLinks: {
    display: 'flex',
    gap: '60px'
  },
  footerLinkGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  footerLinkTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#00d4ff',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  footerLink: {
    color: '#8a8fa8',
    fontSize: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Outfit', sans-serif",
    transition: 'color 0.3s ease',
    padding: 0
  },
  footerBottom: {
    maxWidth: '1400px',
    margin: '0 auto',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerCopy: {
    fontSize: '13px',
    color: '#5a5f7a',
    fontFamily: "'Space Mono', monospace"
  },
  footerSocials: {
    display: 'flex',
    gap: '30px'
  },
  socialLink: {
    fontSize: '13px',
    color: '#8a8fa8',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
    fontWeight: '600'
  },

  // Modals
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.3s ease-out'
  },

  // Server Modal
  serverModalContent: {
    background: 'linear-gradient(135deg, rgba(5, 8, 22, 0.98), rgba(10, 15, 35, 0.98))',
    border: '2px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '30px',
    maxWidth: '550px',
    width: '100%',
    padding: '50px 40px',
    textAlign: 'center',
    boxShadow: '0 30px 90px rgba(0, 255, 157, 0.4)',
    backdropFilter: 'blur(20px)',
    animation: 'slideUp 0.5s ease-out',
    position: 'relative',
    overflow: 'hidden'
  },
  serverModalIcon: {
    fontSize: '80px',
    marginBottom: '20px',
    animation: 'pulse 2s ease-in-out infinite'
  },
  serverModalTitle: {
    fontSize: '28px',
    fontWeight: '900',
    marginBottom: '20px',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.3'
  },
  serverModalText: {
    fontSize: '16px',
    color: '#c5c7d4',
    lineHeight: '1.7',
    marginBottom: '15px'
  },
  serverModalSubtext: {
    fontSize: '14px',
    color: '#8a8fa8',
    lineHeight: '1.6',
    marginBottom: '25px'
  },
  warningBox: {
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '16px',
    padding: '18px 22px',
    marginBottom: '35px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    textAlign: 'left'
  },
  warningIcon: {
    fontSize: '24px',
    flexShrink: 0,
    marginTop: '2px'
  },
  warningText: {
    fontSize: '13px',
    color: '#fbbf24',
    lineHeight: '1.7',
    margin: 0
  },
  serverForm: {
    marginBottom: '25px'
  },
  serverActivateBtn: {
    padding: '18px 40px',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    color: '#000',
    border: 'none',
    borderRadius: '14px',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    boxShadow: '0 10px 40px rgba(0, 255, 157, 0.4)',
    width: '100%',
    maxWidth: '350px',
    fontFamily: "'Outfit', sans-serif"
  },
  successMessage: {
    marginBottom: '25px'
  },
  successIcon: {
    fontSize: '60px',
    marginBottom: '15px',
    animation: 'slideUp 0.5s ease-out'
  },
  successText: {
    fontSize: '16px',
    color: '#00d4ff',
    fontWeight: '700',
    lineHeight: '1.6',
    marginBottom: '8px'
  },
  successSubtext: {
    fontSize: '14px',
    color: '#8a8fa8',
    lineHeight: '1.5'
  },
  serverModalClose: {
    background: 'none',
    border: 'none',
    color: '#8a8fa8',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'underline',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: '600'
  },

  // Policy Modal
  modalContent: {
    background: 'linear-gradient(135deg, rgba(5, 8, 22, 0.98), rgba(10, 15, 35, 0.98))',
    border: '2px solid rgba(0, 255, 157, 0.2)',
    borderRadius: '24px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 30px 90px rgba(0, 255, 157, 0.3)',
    backdropFilter: 'blur(20px)',
    animation: 'slideUp 0.4s ease-out'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '35px 40px 25px 40px',
    borderBottom: '1px solid rgba(0, 255, 157, 0.15)'
  },
  modalTitle: {
    fontSize: '32px',
    fontWeight: '900',
    margin: 0,
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px'
  },
  modalCloseBtn: {
    background: 'rgba(0, 255, 157, 0.1)',
    border: '1px solid rgba(0, 255, 157, 0.3)',
    fontSize: '20px',
    color: '#00d4ff',
    cursor: 'pointer',
    padding: '8px 12px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
    fontFamily: "'Outfit', sans-serif"
  },
  modalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '35px 45px',
    color: '#c5c7d4',
    fontSize: '15px',
    lineHeight: '1.8'
  },
  modalSection: {
    marginBottom: '28px'
  },
  modalSectionTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#00d4ff',
    marginBottom: '16px',
    marginTop: '12px',
    letterSpacing: '0.3px',
    textAlign: 'left'
  },
  modalSubheading: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#8a8fa8',
    marginBottom: '12px',
    marginTop: '8px',
    textAlign: 'left'
  },
  modalParagraph: {
    margin: '0 0 16px 0',
    color: '#8a8fa8',
    lineHeight: '1.8',
    textAlign: 'left'
  },
  modalList: {
    listStyle: 'none',
    padding: 0,
    margin: '16px 0'
  },
  modalListItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '14px',
    paddingLeft: '0',
    textAlign: 'left'
  },
  modalListBullet: {
    color: '#00d4ff',
    fontSize: '18px',
    marginRight: '15px',
    lineHeight: '1.8',
    flexShrink: 0,
    fontWeight: 'bold'
  },
  modalListText: {
    color: '#8a8fa8',
    lineHeight: '1.8',
    flex: 1,
    textAlign: 'left'
  },
  modalFooter: {
    padding: '25px 40px',
    borderTop: '1px solid rgba(0, 255, 157, 0.15)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  modalOkBtn: {
    padding: '14px 45px',
    background: 'linear-gradient(135deg, #00d4ff, #00d4ff)',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '800',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '0 5px 20px rgba(0, 255, 157, 0.3)',
    fontFamily: "'Outfit', sans-serif"
  }
};

export default Home;