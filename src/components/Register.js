// src/components/Register.js
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
        setSuccess(' Registration Successful! Redirecting...');
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
        setSuccess(' Face captured successfully!');
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
      setSuccess(' Scan QR code with your mobile camera');
      
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
      <div style={styles.card}>
        <h1 style={styles.title}> Secure Registration</h1>
        
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
              placeholder="📝 Full Name"
              value={formData.name}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="📧 Email Address"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="🔒 Password (min 6 characters)"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="🔒 Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            
            {error && <p style={styles.error}>{error}</p>}
            
            <button type="submit" style={styles.button}>
              Next: Capture Face 
            </button>

            <p style={styles.loginLink}>
              Already have an account? {' '}
              <a href="/login" style={styles.link}>Login here</a>
            </p>
            
            <p style={styles.homeLink}>
              <a href="/" style={styles.link}>← Back to Home</a>
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
              <p style={styles.qrMainText}> Scan with Mobile Camera</p>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    maxWidth: '600px',
    width: '100%'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
    fontSize: '28px'
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  stepDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#999'
  },
  stepDotActive: {
    backgroundColor: '#667eea',
    color: 'white'
  },
  stepLine: {
    width: '100px',
    height: '2px',
    backgroundColor: '#e0e0e0',
    margin: '0 10px'
  },
  stepTitle: {
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '15px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none'
  },
  button: {
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  secondaryButton: {
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    flex: 1
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    margin: '10px 0',
    padding: '12px',
    backgroundColor: '#fee',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  success: {
    color: '#28a745',
    textAlign: 'center',
    margin: '10px 0',
    padding: '12px',
    backgroundColor: '#efe',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  qrInfo: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  qrMainText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  qrSubText: {
    fontSize: '14px',
    color: '#666'
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    marginBottom: '20px'
  },
  qrWrapper: {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  orDivider: {
    width: '100%',
    textAlign: 'center',
    margin: '20px 0',
    position: 'relative'
  },
  orText: {
    backgroundColor: '#f8f9fa',
    padding: '0 15px',
    color: '#999',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  manualLink: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    margin: '10px 0 0 0'
  },
  linkText: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  faceStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#d4edda',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  checkmark: {
    fontSize: '24px',
    color: '#28a745',
    fontWeight: 'bold'
  },
  loginLink: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
    fontSize: '14px'
  },
  homeLink: {
    textAlign: 'center',
    marginTop: '10px',
    fontSize: '14px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold'
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
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
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