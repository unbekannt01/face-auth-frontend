// src/components/Login.js
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
    // 🔥 Clear all auth data when component mounts (fresh login)
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.clear();

    // Listen for face verification from mobile
    socket.on('face-verification-complete', async (data) => {
      console.log('[Login] Face verification result:', data);
      
      if (data.sessionId === sessionId) {
        if (data.success) {
          setStatus('✅ Face verified! Logging in...');
          setLoading(true);

          try {
            console.log('[Login] Waiting for server session update...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('[Login] Completing login for session:', sessionId);
            
            const response = await axios.post(`${config.API_URL}/api/auth/login/complete`, {
              sessionId: sessionId
            });

            console.log('[Login] Login complete response:', response.data);

            if (response.data.success) {
              console.log('[Login] Token received');
              
              // 🔥 Store auth data
              localStorage.setItem('authToken', response.data.token);
              localStorage.setItem('user', JSON.stringify(response.data.user));
              
              setStatus('✅ Login Successful! Redirecting...');
              setShowQR(false);
              
              await new Promise(resolve => setTimeout(resolve, 800));
              console.log('[Login] Navigating to dashboard...');
              navigate('/dashboard');
            } else {
              throw new Error(response.data.message || 'Login failed');
            }
          } catch (error) {
            setLoading(false);
            console.error('[Login] Error:', error);
            
            const errorMsg = error.response?.data?.message || 
                           error.message || 
                           'Login failed. Please try again.';
            
            setStatus('❌ ' + errorMsg);
            setShowQR(false);
            
            setTimeout(() => {
              setStatus('');
              setEmail('');
              setPassword('');
            }, 4000);
          }
        } else {
          setLoading(false);
          setStatus('❌ ' + (data.message || 'Face verification failed.'));
          setShowQR(false);
          
          setTimeout(() => {
            setStatus('');
          }, 3000);
        }
      }
    });

    return () => {
      socket.off('face-verification-complete');
    };
  }, [navigate, sessionId]);

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus('⚠️ Please fill all fields');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('⚠️ Invalid email format');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    if (password.length < 6) {
      setStatus('⚠️ Password must be at least 6 characters');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    try {
      setLoading(true);
      
      const sessionResponse = await axios.post(`${config.API_URL}/api/session/create`, {
        sessionId,
        email,
        password,
        type: 'login'
      });

      if (sessionResponse.data.success) {
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
      const errorMsg = error.response?.data?.message || 'Failed to create session. Please try again.';
      setStatus('❌ ' + errorMsg);
      
      setTimeout(() => setStatus(''), 4000);
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
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>🔐</div>
          <h2 style={styles.title}>Secure Login</h2>
          <p style={styles.subtitle}>Face Authentication System</p>
        </div>
        
        <input
          type="email"
          placeholder="📧 Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
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
          onKeyPress={handleKeyPress}
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
          onMouseOver={(e) => {
            if (!loading && !showQR) {
              e.target.style.backgroundColor = '#5568d3';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!loading && !showQR) {
              e.target.style.backgroundColor = '#667eea';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}
        >
          {loading ? '⏳ Processing...' : '🚀 Login with Face Authentication'}
        </button>

        {showQR && (
          <div style={styles.qrSection}>
            <div style={styles.qrContainer}>
              <QRCodeSVG 
                value={qrData} 
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
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
                🔗 Open on Mobile
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
              ❌ Cancel
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

        <div style={styles.linksContainer}>
          <p style={styles.registerLink}>
            Don't have an account? {' '}
            <a href="/register" style={styles.link}>Register here</a>
          </p>
          
          <p style={styles.homeLink}>
            <a href="/" style={styles.link}>← Back to Home</a>
          </p>
        </div>

        {/* Security Note */}
        <div style={styles.securityNote}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Your biometric data is encrypted and never shared
          </span>
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
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    maxWidth: '500px',
    width: '100%',
    animation: 'fadeInUp 0.5s ease-out'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '28px'
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '14px'
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
    transition: 'all 0.3s',
    boxSizing: 'border-box',
    marginBottom: '20px'
  },
  qrSection: {
    marginTop: '30px',
    textAlign: 'center',
    padding: '25px',
    backgroundColor: '#f8f9fa',
    borderRadius: '15px',
    animation: 'fadeIn 0.3s ease-out'
  },
  qrContainer: {
    display: 'inline-block',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  qrText: {
    marginTop: '15px',
    fontSize: '16px',
    color: '#666',
    fontWeight: '600',
    margin: '15px 0 5px 0'
  },
  qrSubtext: {
    fontSize: '14px',
    color: '#999',
    marginTop: '5px'
  },
  manualLinkBox: {
    marginTop: '15px',
    padding: '12px',
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
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  statusBox: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    animation: 'slideDown 0.3s ease-out'
  },
  linksContainer: {
    marginTop: '20px'
  },
  registerLink: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    marginBottom: '10px'
  },
  homeLink: {
    textAlign: 'center',
    fontSize: '14px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'color 0.3s'
  },
  securityNote: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
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

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
if (!document.head.querySelector('style[data-login]')) {
  styleSheet.setAttribute('data-login', 'true');
  document.head.appendChild(styleSheet);
}

export default Login;