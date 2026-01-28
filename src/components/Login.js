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
    socket.on('face-verified', async (data) => {
      if (data.success) {
        setStatus('✅ Face verified! Logging in...');
        setLoading(true);

        try {
          const response = await axios.post(`${config.API_URL}/api/auth/login`, {
            email: data.email,
            password: data.password,
            faceDescriptor: data.faceDescriptor
          });

          if (response.data.success) {
            // Save token to localStorage
            localStorage.setItem('authToken', response.data.token);
            
            setStatus('✅ Login Successful! Redirecting...');
            setShowQR(false);
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          }
        } catch (error) {
          setLoading(false);
          const errorMsg = error.response?.data?.message || 'Login failed';
          setStatus('❌ ' + errorMsg);
          setShowQR(false);
          
          // Reset after 3 seconds
          setTimeout(() => {
            setStatus('');
          }, 3000);
        }
      }
    });

    return () => socket.off('face-verified');
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus('❌ Please fill all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('❌ Invalid email format');
      return;
    }

    try {
      // Create session on backend
      await axios.post(`${config.API_URL}/api/session/create`, {
        sessionId,
        email,
        password,
        type: 'login'
      });

      setShowQR(true);
      setStatus('📱 Scan QR code with mobile to verify face');
      
      socket.emit('qr-generated', { 
        sessionId, 
        type: 'login' 
      });
    } catch (error) {
      setStatus('❌ Failed to create session. Please try again.');
    }
  };

  // FIXED: Proper QR data with full URL
  const qrData = `${config.APP_URL}/mobile-verify/${sessionId}`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: '#333',
          fontSize: '28px'
        }}>
          🔐 Secure Login
        </h2>
        
        <input
          type="email"
          placeholder="📧 Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '15px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '16px',
            outline: 'none',
            transition: 'border 0.3s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.border = '2px solid #667eea'}
          onBlur={(e) => e.target.style.border = '2px solid #e0e0e0'}
        />
        
        <input
          type="password"
          placeholder="🔒 Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            marginBottom: '20px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '16px',
            outline: 'none',
            transition: 'border 0.3s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.border = '2px solid #667eea'}
          onBlur={(e) => e.target.style.border = '2px solid #e0e0e0'}
        />
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: loading ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
            boxSizing: 'border-box'
          }}
          onMouseOver={(e) => {
            if (!loading) e.target.style.backgroundColor = '#5568d3';
          }}
          onMouseOut={(e) => {
            if (!loading) e.target.style.backgroundColor = '#667eea';
          }}
        >
          {loading ? '⏳ Processing...' : '🚀 Login with Face Authentication'}
        </button>

        {showQR && (
          <div style={{
            marginTop: '30px',
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '15px'
          }}>
            <QRCodeSVG 
              value={qrData} 
              size={256}
              level="H"
              includeMargin={true}
            />
            <p style={{
              marginTop: '15px',
              fontSize: '16px',
              color: '#666',
              fontWeight: '500'
            }}>
              📱 Scan with mobile camera
            </p>
            <p style={{
              fontSize: '14px',
              color: '#999',
              marginTop: '5px'
            }}>
              Open camera app or QR scanner
            </p>
            
            {/* Manual link for testing */}
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                Or click to open directly:
              </p>
              <a 
                href={qrData}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#667eea',
                  fontSize: '12px',
                  wordBreak: 'break-all'
                }}
              >
                {qrData}
              </a>
            </div>
          </div>
        )}

        {status && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
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

        <p style={{
          marginTop: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          Don't have an account? {' '}
          <a 
            href="/register" 
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;