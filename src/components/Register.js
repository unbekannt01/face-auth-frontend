'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

let socket = null;

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [sessionId] = useState(uuidv4());
  const [showQR, setShowQR] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleRegister = useCallback(async (descriptor) => {
    if (!descriptor) {
      setError('Please capture your face first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${config.API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        faceDescriptor: descriptor
      });

      if (response.data.success) {
        setSuccess('✓ Registration Successful! Redirecting...');
        setLoading(false);
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  }, [formData.name, formData.email, formData.password, navigate]);

  useEffect(() => {
    if (!socket) {
      socket = io(config.API_URL);
    }

    socket.on('face-verified', async (data) => {
      if (data.success && data.faceDescriptor) {
        setFaceDescriptor(data.faceDescriptor);
        setSuccess('✓ Face captured successfully!');
        setShowQR(false);
        
        setTimeout(() => {
          handleRegister(data.faceDescriptor);
        }, 1000);
      }
    });

    return () => {
      if (socket) {
        socket.off('face-verified');
      }
    };
  }, [handleRegister]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    try {
      await axios.post(`${config.API_URL}/api/session/create`, {
        sessionId,
        email,
        password,
        type: 'register'
      });

      setStep(2);
      setShowQR(true);
      setSuccess('✓ Scan QR code with your mobile camera');
      
      if (socket) {
        socket.emit('qr-generated', { 
          sessionId, 
          type: 'register' 
        });
      }
    } catch (err) {
      setError('Failed to create session. Please try again.');
    }
  };

  const qrData = `${config.APP_URL}/mobile-verify/${sessionId}`;

  return (
    <div style={styles.container}>
      <div style={styles.bgOrbs}></div>
      <div style={styles.card}>
        <button 
          onClick={() => navigate('/')}
          style={styles.backButton}
        >
          ← Home
        </button>

        <h1 style={styles.title}>Create Account</h1>
        
        {step === 1 && (
          <form onSubmit={handleNextStep} style={styles.form}>
            <div style={styles.stepIndicator}>
              <div style={{...styles.stepDot, ...styles.stepDotActive}}>1</div>
              <div style={styles.stepLine}></div>
              <div style={styles.stepDot}>2</div>
            </div>
            <p style={styles.stepTitle}>Step 1: Personal Information</p>
            
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            
            {error && <p style={styles.error}>{error}</p>}
            
            <button type="submit" style={styles.button}>
              Next: Capture Face →
            </button>

            <p style={styles.loginLink}>
              Already have an account? {' '}
              <a href="/login" style={styles.link}>Sign In</a>
            </p>
          </form>
        )}

        {step === 2 && (
          <div>
            <div style={styles.stepIndicator}>
              <div style={styles.stepDot}>1</div>
              <div style={styles.stepLine}></div>
              <div style={{...styles.stepDot, ...styles.stepDotActive}}>2</div>
            </div>
            <p style={styles.stepTitle}>Step 2: Face Verification</p>
            
            <div style={styles.qrInfo}>
              <p style={styles.qrMainText}>📱 Scan with Mobile Camera</p>
              <p style={styles.qrSubText}>Open your camera app and point at the QR code</p>
            </div>
            
            {showQR && (
              <div style={styles.qrContainer}>
                <div style={styles.qrWrapper}>
                  <QRCodeSVG 
                    value={qrData} 
                    size={260}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                
                <div style={styles.orDivider}>
                  <span style={styles.orText}>OR</span>
                </div>
                
                <p style={styles.manualLink}>
                  <strong>Manual link:</strong><br/>
                  <a 
                    href={qrData} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.linkText}
                  >
                    Open on mobile browser
                  </a>
                </p>
              </div>
            )}

            {faceDescriptor && !loading && (
              <div style={styles.faceStatus}>
                <span style={styles.checkmark}>✓</span>
                <p>Face captured successfully!</p>
              </div>
            )}
            
            {success && <p style={styles.success}>{success}</p>}
            {error && <p style={styles.error}>{error}</p>}
            
            {loading && (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Creating your account...</p>
              </div>
            )}
            
            <div style={styles.buttonGroup}>
              <button 
                onClick={() => {
                  setStep(1);
                  setShowQR(false);
                  setFaceDescriptor(null);
                  setSuccess('');
                  setError('');
                }} 
                style={styles.secondaryButton}
                disabled={loading}
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#050816',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative'
  },
  bgOrbs: {
    position: 'fixed',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.25) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
    filter: 'blur(50px)',
    animation: 'float 8s ease-in-out infinite',
    zIndex: 0
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    background: 'linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '20px',
    padding: '50px 40px',
    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeInUp 0.6s ease-out'
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(0, 212, 255, 0.15)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    color: '#00d4ff',
    padding: '8px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    marginTop: '20px',
    color: '#fff',
    fontSize: '28px',
    fontWeight: '800'
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px'
  },
  stepDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(0, 212, 255, 0.2)',
    border: '2px solid rgba(0, 212, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#b0b0c9'
  },
  stepDotActive: {
    background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
    border: '2px solid #00d4ff',
    color: '#000'
  },
  stepLine: {
    width: '100px',
    height: '2px',
    background: 'rgba(0, 212, 255, 0.1)',
    margin: '0 10px'
  },
  stepTitle: {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '700',
    color: '#b0b0c9',
    marginBottom: '25px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '14px 16px',
    fontSize: '14px',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '10px',
    outline: 'none',
    background: 'rgba(0, 212, 255, 0.05)',
    color: '#fff',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.3)'
  },
  secondaryButton: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    background: 'rgba(0, 212, 255, 0.1)',
    color: '#00d4ff',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.3s ease'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    margin: '10px 0',
    padding: '12px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px'
  },
  success: {
    color: '#00d4ff',
    textAlign: 'center',
    margin: '10px 0',
    padding: '12px 14px',
    background: 'rgba(0, 212, 255, 0.1)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px'
  },
  qrInfo: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  qrMainText: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '5px'
  },
  qrSubText: {
    fontSize: '13px',
    color: '#b0b0c9'
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '25px',
    background: 'rgba(0, 212, 255, 0.08)',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  qrWrapper: {
    padding: '15px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)',
    marginBottom: '15px'
  },
  orDivider: {
    width: '100%',
    textAlign: 'center',
    margin: '15px 0',
    position: 'relative'
  },
  orText: {
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(99, 102, 241, 0.05))',
    padding: '0 15px',
    color: '#b0b0c9',
    fontWeight: '600',
    fontSize: '12px',
    textTransform: 'uppercase'
  },
  manualLink: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#b0b0c9',
    margin: '10px 0 0 0'
  },
  linkText: {
    color: '#00d4ff',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '13px'
  },
  faceStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '15px',
    background: 'rgba(0, 212, 255, 0.1)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  checkmark: {
    fontSize: '24px',
    color: '#00d4ff',
    fontWeight: 'bold'
  },
  loginLink: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#b0b0c9',
    fontSize: '13px'
  },
  link: {
    color: '#00d4ff',
    textDecoration: 'none',
    fontWeight: '700',
    cursor: 'pointer'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(0, 212, 255, 0.2)',
    borderTop: '3px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-register]')) {
  styleSheet.setAttribute('data-register', 'true');
  document.head.appendChild(styleSheet);
}

export default Register;