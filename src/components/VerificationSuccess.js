// src/components/VerificationSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function VerificationSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
      // Check if we came from registration or login
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      
      if (type === 'register') {
        navigate('/login');
      } else {
        // Close this window/tab or show a message
        window.close();
      }
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <div style={styles.checkmarkCircle}>
            <svg style={styles.checkmark} viewBox="0 0 52 52">
              <circle style={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
              <path style={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>

        <h1 style={styles.title}> Verification Successful!</h1>
        
        <p style={styles.message}>
          Your face has been verified successfully.
        </p>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            ✨ You can now return to your computer and complete the process.
          </p>
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.progressText}>
            Redirecting in {countdown} seconds...
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${(5 - countdown) * 20}%`
              }}
            />
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => navigate('/login')}
            style={styles.primaryButton}
          >
            🔐 Go to Login
          </button>
          
          <button
            onClick={() => window.close()}
            style={styles.secondaryButton}
          >
            ✕ Close Window
          </button>
        </div>

        <div style={styles.successDetails}>
          <h3 style={styles.detailsTitle}>What's Next?</h3>
          <ul style={styles.detailsList}>
            <li>🖥️ Return to your computer</li>
            <li>🔑 Complete the login/registration process</li>
            <li>🎉 You're all set!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center'
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px'
  },
  checkmarkCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    display: 'block',
    strokeWidth: '3',
    stroke: '#4CAF50',
    strokeMiterlimit: '10',
    boxShadow: 'inset 0px 0px 0px #4CAF50',
    animation: 'fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both'
  },
  checkmark: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    display: 'block',
    strokeWidth: '3',
    stroke: '#fff',
    strokeMiterlimit: '10',
    boxShadow: 'inset 0px 0px 0px #4CAF50',
    animation: 'fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both'
  },
  checkmarkCheck: {
    transformOrigin: '50% 50%',
    strokeDasharray: '48',
    strokeDashoffset: '48',
    animation: 'stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '15px',
    margin: '0 0 15px 0'
  },
  message: {
    fontSize: '18px',
    color: '#64748b',
    marginBottom: '30px'
  },
  infoBox: {
    backgroundColor: '#dcfce7',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #86efac',
    marginBottom: '30px'
  },
  infoText: {
    margin: 0,
    color: '#166534',
    fontSize: '16px',
    fontWeight: '600'
  },
  progressContainer: {
    marginBottom: '30px'
  },
  progressText: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '10px',
    fontWeight: '500'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: '4px',
    transition: 'width 1s linear'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px'
  },
  primaryButton: {
    flex: 1,
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
  },
  secondaryButton: {
    flex: 1,
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  successDetails: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    textAlign: 'left'
  },
  detailsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '15px',
    margin: '0 0 15px 0'
  },
  detailsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#64748b',
    lineHeight: '2',
    fontSize: '15px'
  }
};

// Add CSS animations
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
      box-shadow: inset 0px 0px 0px 30px #4CAF50;
    }
  }
`;
if (!document.head.querySelector('style[data-verification-success]')) {
  styleSheet.setAttribute('data-verification-success', 'true');
  document.head.appendChild(styleSheet);
}

export default VerificationSuccess;