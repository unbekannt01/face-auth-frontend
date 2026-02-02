'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

const socket = io(config.API_URL);

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionId] = useState(uuidv4());
  const [showQR, setShowQR] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.clear();

    socket.on('face-verification-complete', async (data) => {
      if (data.sessionId === sessionId) {
        if (data.success) {
          setStatus('✓ Face verified! Logging in...');
          setLoading(true);

          try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const response = await axios.post(`${config.API_URL}/api/auth/login/complete`, {
              sessionId: sessionId
            });

            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/dashboard');
          } catch (error) {
            setStatus('✗ Login failed. Please try again.');
            setLoading(false);
          }
        } else {
          setStatus('✗ Face verification failed');
          setLoading(false);
        }
      }
    });

    return () => socket.off('face-verification-complete');
  }, [sessionId, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus('✗ Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${config.API_URL}/api/auth/login`, {
        email,
        password,
        sessionId
      });

      if (response.data.success) {
        setShowQR(true);
        setStatus('');
      } else {
        setStatus('✗ ' + response.data.message);
        setLoading(false);
      }
    } catch (error) {
      setStatus('✗ Login failed: ' + (error.response?.data?.message || 'Server error'));
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !showQR) {
      handleLogin();
    }
  };

  const qrData = `${config.APP_URL}/mobile-verify/${sessionId}`;

  return (
    <div style={styles.container}>
      {/* Background Elements */}
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>

      <div style={styles.card}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          ← Back
        </button>

        <div style={styles.header}>
          <div style={styles.headerIcon}>⬡</div>
          <h2 style={styles.title}>Sign In</h2>
          <p style={styles.subtitle}>to your NeuroVerify account</p>
        </div>

        {!showQR ? (
          <div style={styles.formContainer}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#00d4ff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 212, 255, 0.2)'}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#00d4ff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 212, 255, 0.2)'}
            />

            <button 
              onClick={handleLogin}
              disabled={loading}
              style={{...styles.signInBtn, opacity: loading ? 0.6 : 1}}
            >
              {loading ? '⏳ Verifying...' : 'Sign In with Face ID'}
            </button>
          </div>
        ) : (
          <div style={styles.qrContainer}>
            <p style={styles.qrLabel}>Scan to Verify Your Face</p>
            <div style={styles.qrBox}>
              <QRCodeSVG 
                value={qrData} 
                size={220}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p style={styles.qrInstructions}>
              Open your phone camera and point it at this code
            </p>
            <button
              onClick={() => {
                setShowQR(false);
                setStatus('');
                setLoading(false);
              }}
              style={styles.backToFormBtn}
            >
              Back to Form
            </button>
          </div>
        )}

        {status && (
          <div style={{
            ...styles.statusMessage,
            borderColor: status.includes('✗') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 212, 255, 0.3)',
            background: status.includes('✗') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 212, 255, 0.1)',
            color: status.includes('✗') ? '#ef4444' : '#00d4ff'
          }}>
            {status}
          </div>
        )}

        <div style={styles.divider}></div>

        <p style={styles.signupPrompt}>
          Don't have an account? <button onClick={() => navigate('/register')} style={styles.signupLink}>Create one</button>
        </p>

        <div style={styles.securityNote}>
          <span>🔐</span>
          <span>Your biometric data is encrypted and never shared</span>
        </div>
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
    padding: '40px 20px',
    position: 'relative',
    overflow: 'auto'
  },
  bgBlob1: {
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
  bgBlob2: {
    position: 'fixed',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
    bottom: '-100px',
    left: '-100px',
    filter: 'blur(50px)',
    animation: 'float 10s ease-in-out infinite 2s',
    zIndex: 0
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '20px',
    padding: '50px 40px',
    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.2), 0 0 40px rgba(0, 212, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeInUp 0.6s ease-out',
    maxHeight: 'calc(100vh - 80px)',
    overflow: 'auto'
  },
  backBtn: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(0, 212, 255, 0.15)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    color: '#00d4ff',
    padding: '8px 15px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  headerIcon: {
    fontSize: '40px',
    marginBottom: '15px',
    display: 'block'
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#b0b0c9',
    margin: 0
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(0, 212, 255, 0.05)',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  signInBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.3)',
    marginTop: '10px'
  },
  qrContainer: {
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(0, 212, 255, 0.08)',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  qrLabel: {
    fontSize: '14px',
    color: '#b0b0c9',
    marginBottom: '15px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  qrBox: {
    background: '#fff',
    padding: '15px',
    borderRadius: '12px',
    display: 'inline-block',
    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)',
    marginBottom: '15px'
  },
  qrInstructions: {
    fontSize: '13px',
    color: '#b0b0c9',
    marginBottom: '20px'
  },
  backToFormBtn: {
    width: '100%',
    padding: '12px',
    background: 'rgba(0, 212, 255, 0.15)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    color: '#00d4ff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  statusMessage: {
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid',
    marginBottom: '15px'
  },
  divider: {
    height: '1px',
    background: 'rgba(0, 212, 255, 0.1)',
    margin: '25px 0'
  },
  signupPrompt: {
    fontSize: '13px',
    color: '#b0b0c9',
    textAlign: 'center',
    margin: '0 0 20px 0'
  },
  signupLink: {
    background: 'none',
    border: 'none',
    color: '#00d4ff',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
    fontSize: 'inherit'
  },
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px',
    background: 'rgba(0, 212, 255, 0.05)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#b0b0c9'
  }
};

export default Login;