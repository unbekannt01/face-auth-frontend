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
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('🔄 Loading session...');
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
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
      setStatus('❌ Failed to load AI models. Please refresh.');
    }
  };

  const stopCamera = () => {
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
  };

  const startCamera = async () => {
    try {
      // Stop existing camera first
      stopCamera();

      setStatus('📸 Starting camera...');
      console.log('Requesting camera with facingMode:', facingMode);

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('✅ Camera stream obtained');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play()
            .then(() => {
              console.log('✅ Video playing');
              setVideoReady(true);
              setStatus('✅ Ready! Position your face');
              startFaceDetection();
            })
            .catch(err => {
              console.error('Video play error:', err);
              setStatus('❌ Failed to start video');
            });
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      setStatus('❌ Camera access denied. Please allow permissions.');
    }
  };

  const switchCamera = async () => {
    console.log('Switching camera from', facingMode);
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    setStatus('🔄 Switching camera...');
    
    // Camera will restart due to facingMode change in useEffect
  };

  // Watch facingMode changes
  useEffect(() => {
    if (modelsLoaded && facingMode) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [facingMode, modelsLoaded]);

  const startFaceDetection = () => {
    console.log('Starting face detection loop');
    
    // Clear any existing interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Detect face every 500ms
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoReady && !capturing && modelsLoaded) {
        try {
          const detection = await faceapi
            .detectSingleFace(videoRef.current)
            .withFaceLandmarks();

          setFaceDetected(!!detection);
        } catch (error) {
          // Silently ignore detection errors
        }
      }
    }, 500);
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    } else {
      setStatus('❌ Invalid session');
    }

    if (!socket) {
      socket = io(config.API_URL);
      console.log('Socket connected to:', config.API_URL);
    }

    return () => {
      stopCamera();
    };
  }, [sessionId, fetchSessionData]);

  const captureFace = async () => {
    if (!modelsLoaded || capturing || !sessionData || !videoReady) {
      console.log('Capture blocked:', { modelsLoaded, capturing, sessionData: !!sessionData, videoReady });
      return;
    }

    setCapturing(true);
    setStatus('🔍 Detecting and capturing face...');

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const faceDescriptor = Array.from(detections.descriptor);
        
        console.log('Face captured, descriptor length:', faceDescriptor.length);
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

          console.log('Face data sent to server');
        } else {
          console.error('Socket not connected!');
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
      console.error('Face detection error:', error);
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
              🔄 {facingMode === 'user' ? 'Switch to Back' : 'Switch to Front'}
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
            <li>🔄 Try switching camera if needed</li>
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

export default MobileVerify;