/* eslint-disable no-unused-vars */
'use client';

/* eslint-disable react-hooks/exhaustive-deps */
// src/components/UpdateFaceData.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCodeSVG from 'qrcode.react'; // Import QRCodeSVG
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import io from 'socket.io-client';

let socket = null;

function UpdateFaceData() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(uuidv4());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('Generating QR code...');
  const [showQR, setShowQR] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Initialize socket
    if (!socket) {
      socket = io(config.API_URL);
      
      socket.on('face-verification-complete', (data) => {
        console.log('[UpdateFace] Verification complete:', data);
        if (data.success) {
          setSuccess('✅ Face updated successfully!');
          setVerifying(false);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setError('❌ ' + (data.message || 'Face update failed'));
          setVerifying(false);
        }
      });
    }

    initiateUpdate();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [navigate]);

  const initiateUpdate = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatus('Generating QR code...');

      const token = localStorage.getItem('authToken');
      
      // Call backend to initiate face update
      const response = await axios.post(
        `${config.API_URL}/api/auth/update-face/initiate`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        console.log('[UpdateFace] Session created:', sessionId);
        
        // Create session on server to store user data for mobile
        try {
          await axios.post(
            `${config.API_URL}/api/session/create`,
            {
              sessionId,
              email: 'update-face', // Placeholder for update-face flow
              password: '', // Not needed for update-face
              type: 'update-face'
            }
          );
          console.log('[UpdateFace] Session stored on server');
        } catch (sessionErr) {
          console.error('[UpdateFace] Session store error:', sessionErr);
          // Continue anyway - session might still work
        }
        
        setShowQR(true);
        setStatus('📱 Scan QR code with your mobile device');
        setIsLoading(false);
      } else {
        setError('❌ Failed to initiate face update');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[UpdateFace] Error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to initiate face update';
      setError('❌ ' + errorMsg);
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={handleGoBack} style={styles.backBtn}>
            ← Back
          </button>
          <h1 style={styles.title}>Update Face Data</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        <p style={styles.subtitle}>
          Update your biometric authentication with a new face scan
        </p>

        {/* QR Code Section */}
        {showQR && !isLoading && (
          <div style={styles.qrContainer}>
            <div style={styles.qrBox}>
              <QRCodeSVG 
                value={`${config.APP_URL}/mobile-update-face/${sessionId}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p style={styles.qrHint}>Scan with your mobile device</p>
            
            <div style={styles.manualLinkBox}>
              <p style={styles.manualLinkLabel}>Or click to open directly:</p>
              <a 
                href={`${config.APP_URL}/mobile-update-face/${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.manualLink}
              >
                Open on Mobile
              </a>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Generating QR code...</p>
          </div>
        )}

        {/* Verification State */}
        {verifying && (
          <div style={styles.verifyingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.verifyingText}>Verifying face...</p>
          </div>
        )}

        {/* Status Messages */}
        <div style={styles.statusContainer}>
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
          {!error && !success && showQR && (
            <p style={styles.statusText}>{status}</p>
          )}
        </div>

        {/* Instructions */}
        <div style={styles.instructions}>
          <h3 style={styles.instructionTitle}>Steps:</h3>
          <ol style={styles.instructionList}>
            <li>Scan the QR code with your mobile device</li>
            <li>Position your face in good lighting</li>
            <li>Ensure green dots appear on your face</li>
            <li>Tap "Capture Face" when prompted</li>
            <li>Wait for verification to complete</li>
          </ol>
        </div>

        {/* Warning */}
        <div style={styles.warningBox}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <p style={styles.warningText}>
            <strong>Important:</strong> This will replace your current biometric data. 
            Ensure you're in good lighting and your face is clearly visible.
          </p>
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
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  title: {
    fontSize: '28px',
    margin: 0,
    color: '#333',
    textAlign: 'center',
    flex: 1
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    marginBottom: '25px'
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '25px'
  },
  qrBox: {
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '12px',
    border: '2px solid #667eea',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    marginBottom: '15px'
  },
  qrCanvas: {
    maxWidth: '100%',
    height: 'auto'
  },
  qrHint: {
    color: '#666',
    fontSize: '14px',
    margin: '0 0 10px 0',
    fontWeight: '600'
  },
  manualLinkBox: {
    backgroundColor: '#f0f4ff',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #667eea',
    marginTop: '15px',
    textAlign: 'center'
  },
  manualLinkLabel: {
    color: '#666',
    fontSize: '13px',
    margin: '0 0 10px 0',
    fontWeight: '500'
  },
  manualLink: {
    display: 'inline-block',
    padding: '10px 25px',
    backgroundColor: '#667eea',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px'
  },
  loadingText: {
    marginTop: '15px',
    color: '#666',
    fontSize: '16px',
    fontWeight: '600'
  },
  verifyingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: '#f0f4ff',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  verifyingText: {
    marginTop: '15px',
    color: '#667eea',
    fontSize: '16px',
    fontWeight: '600'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(102, 126, 234, 0.3)',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  statusContainer: {
    minHeight: '50px',
    marginBottom: '20px'
  },
  statusText: {
    color: '#667eea',
    fontSize: '15px',
    fontWeight: '600',
    margin: 0,
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px'
  },
  error: {
    color: '#dc3545',
    margin: 0,
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '8px',
    fontWeight: '600',
    border: '1px solid #f5c6cb'
  },
  success: {
    color: '#155724',
    margin: 0,
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#d4edda',
    borderRadius: '8px',
    fontWeight: '600',
    border: '1px solid #c3e6cb'
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #dee2e6',
    marginBottom: '15px'
  },
  instructionTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  instructionList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.8'
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '10px',
    border: '2px solid #ffc107',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start'
  },
  warningText: {
    margin: 0,
    fontSize: '13px',
    color: '#856404',
    lineHeight: '1.6'
  }
};

// Add animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-update-face]')) {
  styleSheet.setAttribute('data-update-face', 'true');
  document.head.appendChild(styleSheet);
}

export default UpdateFaceData;
