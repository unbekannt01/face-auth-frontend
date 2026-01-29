/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.jsx
// FIXED: Instant face detection without camera switch

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
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const isProcessingRef = useRef(false); // Prevent multiple detections
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('🔄 Loading session...');
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // Start with front camera
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);

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
      setStatus('📦 Loading AI models...');
      setModelLoadProgress(0);
      
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      console.log('📍 Loading models from CDN:', MODEL_URL);

      // Load models with progress
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      console.log('✅ Face detection model loaded');
      setModelLoadProgress(33);

      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('✅ Landmark model loaded');
      setModelLoadProgress(66);

      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('✅ Recognition model loaded');
      setModelLoadProgress(100);
      
      setModelsLoaded(true);
      setStatus('📸 Starting camera...');
      
      // ✅ FIX: Wait a bit before starting camera
      setTimeout(() => {
        startCamera();
      }, 500);
      
    } catch (error) {
      console.error('Model loading error:', error);
      setStatus('❌ Failed to load AI models. Please refresh.');
    }
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    
    // Stop detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setVideoReady(false);
    setFaceDetected(false);
    isProcessingRef.current = false;
  };

  const startCamera = async () => {
    try {
      // Stop existing camera first
      stopCamera();

      setStatus('📸 Starting camera...');
      console.log('🎥 Requesting camera with facingMode:', facingMode);

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('✅ Camera stream obtained');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        
        // Better video readiness detection
        const checkVideoReady = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or better
            console.log('📹 Video ready with state:', videoRef.current.readyState);
            setVideoReady(true);
            setStatus('✅ Ready! Position your face');
            startFaceDetection();
          } else {
            setTimeout(checkVideoReady, 100);
          }
        };

        videoRef.current.play()
          .then(() => {
            console.log('✅ Video playing');
            checkVideoReady();
          })
          .catch(err => {
            console.error('Video play error:', err);
            setStatus('❌ Failed to start video');
          });
      }
    } catch (error) {
      console.error('Camera error:', error);
      setStatus('❌ Camera access denied. Please allow permissions.');
    }
  };

  const switchCamera = async () => {
    console.log('🔄 Switching camera from', facingMode);
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setStatus('🔄 Switching camera...');
    setVideoReady(false);
    setFaceDetected(false);
    
    // Camera will restart
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  const startFaceDetection = () => {
    console.log('👁️ Starting face detection loop');
    
    // Clear any existing interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Start detection with a small initial delay to ensure models are ready
    setTimeout(() => {
      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoReady && !capturing && modelsLoaded && !isProcessingRef.current) {
          try {
            isProcessingRef.current = true;
            
            // Check video state before detection
            if (videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
              const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                .withFaceLandmarks();

              setFaceDetected(!!detection);
            }
            
            isProcessingRef.current = false;
          } catch (error) {
            isProcessingRef.current = false;
            console.log('[v0] Detection iteration skip:', error.message);
          }
        }
      }, 300); // Detection interval
    }, 200); // Initial delay before starting detection
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    } else {
      setStatus('❌ Invalid session');
    }

    if (!socket) {
      socket = io(config.API_URL);
      console.log('🔌 Socket connected to:', config.API_URL);
    }

    return () => {
      stopCamera();
    };
  }, [sessionId, fetchSessionData]);

  const captureFace = async () => {
    if (!modelsLoaded || capturing || !sessionData || !videoReady) {
      console.log('[v0] Capture blocked:', { modelsLoaded, capturing, sessionData: !!sessionData, videoReady });
      return;
    }

    setCapturing(true);
    setStatus('🔍 Detecting and capturing face...');

    try {
      // Verify video is in correct state
      if (!videoRef.current || videoRef.current.readyState < 2) {
        throw new Error('Video not ready');
      }

      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const faceDescriptor = Array.from(detections.descriptor);
        
        console.log('[v0] Face captured, descriptor length:', faceDescriptor.length);
        setStatus('✅ Face captured! Verifying with registered face...');

        // Send to backend for verification
        if (socket && socket.connected) {
          socket.emit('face-captured', {
            sessionId: sessionData.sessionId,
            faceDescriptor: faceDescriptor,
            email: sessionData.email,
            password: sessionData.password,
            type: sessionData.type
          });

          console.log('[v0] Face data sent to server');
        } else {
          console.error('[v0] Socket not connected!');
          setStatus('❌ Connection error. Please try again.');
          setCapturing(false);
          return;
        }

        // Stop camera
        stopCamera();

        // Wait for server response
        setTimeout(() => {
          setStatus('⏳ Waiting for verification...');
        }, 1000);

        // Navigate to success page after delay
        setTimeout(() => {
          navigate('/verification-success?type=' + sessionData.type);
        }, 3000);

      } else {
        setStatus('❌ No face detected. Please try again.');
        setCapturing(false);
      }
    } catch (error) {
      console.error('[v0] Face detection error:', error);
      setStatus('❌ Detection failed. Please try again.');
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
              boxShadow: faceDetected 
                ? '0 0 40px rgba(76, 175, 80, 0.6)' 
                : '0 0 40px rgba(102, 126, 234, 0.6)'
            }}>
              <div style={styles.guideLine} />
            </div>
          </div>
          
          {videoReady && !capturing && (
            <button
              onClick={switchCamera}
              style={styles.cameraSwitchBtn}
            >
              🔄 {facingMode === 'user' ? 'Back' : 'Front'}
            </button>
          )}
          
          {videoReady && (
            <div style={{
              ...styles.detectionIndicator,
              backgroundColor: faceDetected ? '#4CAF50' : '#ff9800'
            }}>
              {faceDetected ? '✓ Face Detected' : '⚠ Position Your Face'}
            </div>
          )}

          {/* Loading progress */}
          {!videoReady && modelsLoaded && (
            <div style={styles.loadingOverlay}>
              <div style={styles.spinner}></div>
              <p>Starting camera...</p>
            </div>
          )}

          {!modelsLoaded && modelLoadProgress > 0 && (
            <div style={styles.loadingOverlay}>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${modelLoadProgress}%`}}></div>
              </div>
              <p>Loading AI Models: {modelLoadProgress}%</p>
            </div>
          )}
        </div>

        <button 
          onClick={captureFace}
          disabled={!videoReady || capturing || !faceDetected}
          style={{
            ...styles.button,
            backgroundColor: (!videoReady || capturing || !faceDetected) ? '#94a3b8' : '#667eea',
            cursor: (!videoReady || capturing || !faceDetected) ? 'not-allowed' : 'pointer'
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
            <li>✨ Ensure good lighting</li>
            <li>👤 Face the camera directly</li>
            <li>😐 Keep neutral expression</li>
            <li>📏 Stay within the frame</li>
            <li>⏱️ Wait for green indicator</li>
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
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    minHeight: '400px'
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
    transform: 'scaleX(-1)' // Mirror effect for front camera
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
    border: '4px solid',
    borderRadius: '50%',
    transition: 'all 0.3s ease'
  },
  guideLine: {
    position: 'absolute',
    top: '50%',
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: 'currentColor',
    opacity: 0.5,
    transform: 'translateY(-50%)'
  },
  cameraSwitchBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '10px 15px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    zIndex: 10,
    color: '#1e293b'
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: 5
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(255, 255, 255, 0.3)',
    borderTop: '5px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px'
  },
  progressBar: {
    width: '80%',
    height: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '15px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    transition: 'width 0.3s ease'
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

// Add CSS animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-mobile-verify-spin]')) {
  styleSheet.setAttribute('data-mobile-verify-spin', 'true');
  document.head.appendChild(styleSheet);
}

export default MobileVerify;
