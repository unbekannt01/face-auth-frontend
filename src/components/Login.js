// frontend/src/components/Login.jsx
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
    // Listen for face verification from mobile
    socket.on('face-verification-complete', async (data) => {
      console.log('[v0] Face verification result:', data);
      
      if (data.sessionId === sessionId) {
        if (data.success) {
          setStatus('✅ Face verified! Logging in...');
          setLoading(true);

          try {
            // Wait a moment for server to update session status
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('[v0] Completing login for session:', sessionId);
            
            // FIXED: Use the CORRECT backend endpoint that EXISTS
            // Original code tried to use /api/auth/verify-login which doesn't exist
            // The correct endpoint is /api/auth/login/complete
            const response = await axios.post(`${config.API_URL}/api/auth/login/complete`, {
              sessionId: sessionId
            });

            console.log('[v0] Login complete response:', response.data);

            if (response.data.success) {
              localStorage.setItem('authToken', response.data.token);
              
              setStatus('✅ Login Successful! Redirecting...');
              setShowQR(false);
              
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            } else {
              throw new Error(response.data.message || 'Login failed');
            }
          } catch (error) {
            setLoading(false);
            console.error('[v0] Login error:', error);
            
            const errorMsg = error.response?.data?.message || 
                           error.message || 
                           'Login failed. Please try again.';
            
            setStatus('❌ ' + errorMsg);
            setShowQR(false);
            
            setTimeout(() => {
              setStatus('');
              setEmail('');
              setPassword('');
            }, 3000);
          }
        } else {
          // Face verification failed
          setLoading(false);
          setStatus('❌ ' + (data.message || 'Face verification failed. Face does not match.'));
          setShowQR(false);
          
          setTimeout(() => {
            setStatus('');
          }, 3000);
        }
      }
    });

    return () => socket.off('face-verification-complete');
  }, [navigate, sessionId]);

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus('❌ Please fill all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('❌ Invalid email format');
      return;
    }

    try {
      setLoading(true);
      
      // Create session on backend (SAME AS BEFORE)
      const sessionResponse = await axios.post(`${config.API_URL}/api/session/create`, {
        sessionId,
        email,
        password,
        type: 'login'
      });

      if (sessionResponse.data.success) {
        // SHOW QR CODE (PEHLE WALA FLOW)
        setShowQR(true);
        setStatus('📱 Scan QR code with mobile to verify face');
        setLoading(false);
        
        socket.emit('qr-generated', { 
          sessionId, 
          type: 'login',
          email 
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Session creation error:', error);
      setStatus('❌ Failed to create session. Please try again.');
    }
  };

  const qrData = `${config.APP_URL}/mobile-verify/${sessionId}`;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔐 Secure Login</h2>
        
        <input
          type="email"
          placeholder="📧 Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || showQR}
          style={styles.input}
          onFocus={(e) => e.target.style.border = '2px solid #667eea'}
          onBlur={(e) => e.target.style.border = '2px solid #e0e0e0'}
        />
        
        <input
          type="password"
          placeholder="🔒 Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading || showQR}
          style={styles.input}
          onFocus={(e) => e.target.style.border = '2px solid #667eea'}
          onBlur={(e) => e.target.style.border = '2px solid #e0e0e0'}
        />
        
        <button 
          onClick={handleLogin}
          disabled={loading || showQR}
          style={{
            ...styles.button,
            backgroundColor: (loading || showQR) ? '#ccc' : '#667eea',
            cursor: (loading || showQR) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Processing...' : '🚀 Login with Face Authentication'}
        </button>

        {/* QR CODE SECTION - PEHLE WALA */}
        {showQR && (
          <div style={styles.qrSection}>
            <QRCodeSVG 
              value={qrData} 
              size={256}
              level="H"
              includeMargin={true}
            />
            <p style={styles.qrText}>📱 Scan with mobile camera</p>
            <p style={styles.qrSubtext}>Open camera app or QR scanner</p>
            
            <div style={styles.manualLinkBox}>
              <p style={styles.manualLinkLabel}>Or click to open directly:</p>
              <a 
                href={qrData}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.manualLink}
              >
                Open on Mobile
              </a>
            </div>

            <button
              onClick={() => {
                setShowQR(false);
                setStatus('');
                setLoading(false);
              }}
              style={styles.cancelButton}
            >
              ✕ Cancel
            </button>
          </div>
        )}

        {status && (
          <div style={{
            ...styles.statusBox,
            backgroundColor: status.includes('❌') ? '#fee' : 
                           status.includes('✅') ? '#efe' : '#fff3cd',
            color: status.includes('❌') ? '#c00' : 
                   status.includes('✅') ? '#0a0' : '#856404',
            border: `2px solid ${status.includes('❌') ? '#fcc' : 
                                 status.includes('✅') ? '#cfc' : '#ffeaa7'}`
          }}>
            {status}
          </div>
        )}

        <p style={styles.registerLink}>
          Don't have an account? {' '}
          <a href="/register" style={styles.link}>Register here</a>
        </p>
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
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    maxWidth: '500px',
    width: '100%'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
    fontSize: '28px'
  },
  input: {
    width: '100%',
    padding: '15px',
    marginBottom: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border 0.3s',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '15px',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    boxSizing: 'border-box',
    marginBottom: '20px'
  },
  qrSection: {
    marginTop: '30px',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px'
  },
  qrText: {
    marginTop: '15px',
    fontSize: '16px',
    color: '#666',
    fontWeight: '500'
  },
  qrSubtext: {
    fontSize: '14px',
    color: '#999',
    marginTop: '5px'
  },
  manualLinkBox: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #ddd'
  },
  manualLinkLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px'
  },
  manualLink: {
    color: '#667eea',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  cancelButton: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  statusBox: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  registerLink: {
    marginTop: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold'
  }
};

export default Login;