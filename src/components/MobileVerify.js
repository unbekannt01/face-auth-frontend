/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import io from 'socket.io-client';
import axios from 'axios';
import { config } from '../config';

let socket = null;

function MobileVerify() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('🔄 Loading session...');
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back
  const [faceDetected, setFaceDetected] = useState(false);

  const fetchSessionData = useCallback(async () => {
    try {
      setStatus('📥 Loading session data...');
      const response = await axios.get(`${config.API_URL}/api/session/${sessionId}`);
      
      if (response.data.success) {
        setSessionData({
          sessionId,
          ...response.data.data
        });
        loadModels();
      } else {
        setStatus('❌ Session expired or invalid');
      }
    } catch (error) {
      setStatus('❌ Failed to load session');
      console.error('Session fetch error:', error);
    }
  }, [sessionId]);

  const loadModels = async () => {
    try {
      setStatus('📦 Loading AI models... (this may take a moment)');
      
      // Use CDN for models
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      console.log('📍 Loading models from CDN:', MODEL_URL);

      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      console.log('✅ Face detection model loaded');

      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('✅ Landmark model loaded');

      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('✅ Recognition model loaded');
      
      setModelsLoaded(true);
      setStatus('📸 Starting camera...');
      await startCamera();
      
    } catch (error) {
      console.error('Model loading error:', error);
      setStatus('❌ Failed to load AI models. Please check internet connection and refresh.');
    }
  };

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setVideoReady(true);
          setStatus('✅ Ready! Position your face and tap "Capture"');
          startFaceDetection();
        };
      }
    } catch (error) {
      setStatus('❌ Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', error);
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setVideoReady(false);
    setFaceDetected(false);
    setStatus('📸 Switching camera...');
    
    // Restart camera with new facing mode
    await startCamera();
  };

  // Real-time face detection
  const startFaceDetection = () => {
    const detectFace = async () => {
      if (videoRef.current && videoReady && !capturing) {
        try {
          const detection = await faceapi
            .detectSingleFace(videoRef.current)
            .withFaceLandmarks();

          setFaceDetected(!!detection);
        } catch (error) {
          // Ignore detection errors during continuous detection
        }
      }
      
      // Continue detection loop
      if (videoReady && !capturing) {
        requestAnimationFrame(detectFace);
      }
    };
    
    detectFace();
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    } else {
      setStatus('❌ Invalid session');
    }

    if (!socket) {
      socket = io(config.API_URL);
    }

    return () => {
      const video = videoRef.current;
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, fetchSessionData]);

  const captureFace = async () => {
    if (!modelsLoaded || capturing || !sessionData || !videoReady) return;

    setCapturing(true);
    setStatus('🔍 Detecting face...');

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const faceDescriptor = Array.from(detections.descriptor);
        
        setStatus('✅ Face captured! Verifying...');

        if (socket) {
          socket.emit('face-captured', {
            sessionId: sessionData.sessionId,
            faceDescriptor,
            email: sessionData.email,
            password: sessionData.password
          });
        }

        // Stop camera
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }

        // Redirect to success page after 2 seconds
        setTimeout(() => {
          setStatus('✅ Verification successful!');
          navigate('/verification-success');
        }, 2000);

      } else {
        setStatus('❌ No face detected. Please try again.');
        setCapturing(false);
      }
    } catch (error) {
      setStatus('❌ Detection failed. Please try again.');
      console.error('Face detection error:', error);
      setCapturing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>📱 Face Verification</h1>
          <p style={styles.subtitle}>
            {sessionData?.type === 'register' ? '🔐 Registration' : '🔑 Login'}
          </p>
        </div>
        
        <div style={styles.videoContainer}>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            style={styles.video}
          />
          <div style={styles.overlay}>
            <div style={{
              ...styles.faceGuide,
              borderColor: faceDetected ? '#4CAF50' : '#667eea',
              boxShadow: faceDetected ? '0 0 40px rgba(76, 175, 80, 0.6)' : '0 0 40px rgba(102, 126, 234, 0.6)'
            }}>
              <div style={styles.guideLine} />
            </div>
          </div>
          
          {/* Camera switch button */}
          {videoReady && (
            <button
              onClick={switchCamera}
              style={styles.cameraSwitchBtn}
              disabled={capturing}
            >
              🔄 Switch Camera
            </button>
          )}
          
          {/* Face detection indicator */}
          {videoReady && (
            <div style={{
              ...styles.detectionIndicator,
              backgroundColor: faceDetected ? '#4CAF50' : '#ff9800'
            }}>
              {faceDetected ? '✓ Face Detected' : '⚠ Position Your Face'}
            </div>
          )}
        </div>

        <button 
          onClick={captureFace}
          disabled={!videoReady || capturing || !faceDetected}
          style={{
            ...styles.button,
            backgroundColor: !videoReady || capturing || !faceDetected ? '#94a3b8' : '#667eea',
            cursor: !videoReady || capturing || !faceDetected ? 'not-allowed' : 'pointer'
          }}
        >
          {capturing ? '⏳ Processing...' : '📸 Capture Face'}
        </button>

        <div style={{
          ...styles.statusBox,
          backgroundColor: status.includes('❌') ? '#fee2e2' : 
                         status.includes('✅') ? '#dcfce7' : '#fef3c7',
          color: status.includes('❌') ? '#991b1b' : 
                 status.includes('✅') ? '#166534' : '#854d0e'
        }}>
          <p style={styles.statusText}>{status}</p>
        </div>

        {!modelsLoaded && status.includes('❌') && (
          <button 
            onClick={fetchSessionData}
            style={{...styles.button, backgroundColor: '#6c757d', marginTop: '10px'}}
          >
            🔄 Retry Loading
          </button>
        )}

        <div style={styles.tips}>
          <p style={styles.tipsTitle}>💡 Tips:</p>
          <ul style={styles.tipsList}>
            <li>✨ Good lighting required</li>
            <li>👤 Face camera directly</li>
            <li>😐 Neutral expression</li>
            <li>📏 Stay in frame</li>
            <li>🔄 Use camera switch if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '25px'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    color: '#1e293b',
    fontWeight: 'bold'
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    color: '#64748b'
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '20px',
    backgroundColor: '#000',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  faceGuide: {
    position: 'relative',
    width: '220px',
    height: '280px',
    border: '4px solid #667eea',
    borderRadius: '50%',
    boxShadow: '0 0 40px rgba(102, 126, 234, 0.6)',
    animation: 'pulse 2s ease-in-out infinite',
    transition: 'all 0.3s ease'
  },
  guideLine: {
    position: 'absolute',
    top: '50%',
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: '#667eea',
    boxShadow: '0 0 10px rgba(102, 126, 234, 0.8)',
    transform: 'translateY(-50%)'
  },
  cameraSwitchBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '10px 15px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 10
  },
  detectionIndicator: {
    position: 'absolute',
    bottom: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'white',
    zIndex: 10,
    transition: 'background-color 0.3s ease'
  },
  button: {
    width: '100%',
    padding: '18px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    marginBottom: '20px',
    transition: 'all 0.3s',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  statusBox: {
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px solid',
    textAlign: 'center'
  },
  statusText: {
    margin: 0,
    fontWeight: '600',
    fontSize: '15px'
  },
  tips: {
    backgroundColor: '#f8fafc',
    padding: '18px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  tipsTitle: {
    fontWeight: 'bold',
    margin: '0 0 12px 0',
    color: '#334155',
    fontSize: '15px'
  },
  tipsList: {
    paddingLeft: '20px',
    margin: 0,
    color: '#64748b',
    lineHeight: '2',
    fontSize: '14px'
  }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.8;
      transform: scale(1.03);
    }
  }
`;
if (!document.head.querySelector('style[data-mobileverify]')) {
  styleSheet.setAttribute('data-mobileverify', 'true');
  document.head.appendChild(styleSheet);
}

export default MobileVerify;