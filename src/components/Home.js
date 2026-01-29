// src/components/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>🔐</div>
          </div>
          
          <h1 style={styles.mainTitle}>
            Face Authentication System
          </h1>
          
          <p style={styles.subtitle}>
            Next-Generation Security with AI-Powered Facial Recognition
          </p>
          
          <p style={styles.description}>
            Experience seamless and secure authentication using advanced facial recognition technology. 
            No passwords to remember, just your face!
          </p>

          <div style={styles.buttonGroup}>
            <button 
              onClick={() => navigate('/register')}
              style={styles.primaryButton}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚀 Get Started
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              style={styles.secondaryButton}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🔑 Login
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.featuresSection}>
        <h2 style={styles.featuresTitle}>Why Choose Our System?</h2>
        
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🛡️</div>
            <h3 style={styles.featureTitle}>Ultra Secure</h3>
            <p style={styles.featureText}>
              Advanced AI algorithms ensure your identity is protected with military-grade security
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Lightning Fast</h3>
            <p style={styles.featureText}>
              Authenticate in milliseconds with real-time face detection and verification
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📱</div>
            <h3 style={styles.featureTitle}>Multi-Device</h3>
            <p style={styles.featureText}>
              Seamless QR-based mobile verification for enhanced security
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.featureTitle}>Privacy First</h3>
            <p style={styles.featureText}>
              Your biometric data is encrypted and never shared with third parties
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🌐</div>
            <h3 style={styles.featureTitle}>Cross-Platform</h3>
            <p style={styles.featureText}>
              Works seamlessly across desktop, mobile, and tablet devices
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>✨</div>
            <h3 style={styles.featureTitle}>Easy Setup</h3>
            <p style={styles.featureText}>
              Get started in minutes with our simple registration process
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Register</h3>
            <p style={styles.stepText}>
              Create your account and capture your face for secure registration
            </p>
          </div>

          <div style={styles.stepArrow}>→</div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Scan QR</h3>
            <p style={styles.stepText}>
              Scan the QR code with your mobile device for verification
            </p>
          </div>

          <div style={styles.stepArrow}>→</div>

          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Verify</h3>
            <p style={styles.stepText}>
              AI instantly verifies your face and grants secure access
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Experience the Future?</h2>
        <p style={styles.ctaText}>
          Join thousands of users who trust our face authentication system
        </p>
        <button 
          onClick={() => navigate('/register')}
          style={styles.ctaButton}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Create Free Account 🎉
        </button>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          © 2024 Face Authentication System. Powered by AI Technology.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  heroSection: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '800px',
    animation: 'fadeInUp 0.8s ease-out'
  },
  logoContainer: {
    marginBottom: '30px'
  },
  logo: {
    fontSize: '80px',
    animation: 'pulse 2s infinite',
    display: 'inline-block'
  },
  mainTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
    lineHeight: '1.2'
  },
  subtitle: {
    fontSize: '24px',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: '20px',
    fontWeight: '500'
  },
  description: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: '40px',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto 40px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '18px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
    minWidth: '180px'
  },
  secondaryButton: {
    padding: '18px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    color: 'white',
    border: '3px solid white',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '180px'
  },
  featuresSection: {
    padding: '80px 20px',
    backgroundColor: 'white'
  },
  featuresTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: '60px'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  featureCard: {
    backgroundColor: '#f8f9fa',
    padding: '40px 30px',
    borderRadius: '20px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    cursor: 'pointer'
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  featureTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px'
  },
  featureText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6'
  },
  howItWorksSection: {
    padding: '80px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: '60px'
  },
  stepsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '20px'
  },
  step: {
    backgroundColor: 'white',
    padding: '40px 30px',
    borderRadius: '20px',
    textAlign: 'center',
    flex: '1',
    minWidth: '250px',
    maxWidth: '300px'
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: '28px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  stepTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px'
  },
  stepText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6'
  },
  stepArrow: {
    fontSize: '36px',
    color: 'white',
    fontWeight: 'bold'
  },
  ctaSection: {
    padding: '80px 20px',
    backgroundColor: 'white',
    textAlign: 'center'
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px'
  },
  ctaText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '40px'
  },
  ctaButton: {
    padding: '20px 50px',
    fontSize: '20px',
    fontWeight: 'bold',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s ease'
  },
  footer: {
    padding: '40px 20px',
    backgroundColor: '#1a1a2e',
    textAlign: 'center'
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px'
  }
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @media (max-width: 768px) {
    .stepArrow {
      display: none;
    }
  }
`;
if (!document.head.querySelector('style[data-home]')) {
  styleSheet.setAttribute('data-home', 'true');
  document.head.appendChild(styleSheet);
}

export default Home;