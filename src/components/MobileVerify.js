/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.jsx
// FIXED VERSION with instant face detection + visual feedback

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
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('🔄 Loading session...');
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [detection, setDetection] = useState(null);

  const handleClose = () => {
    stopCamera();
    navigate('/');
  };

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

      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      setModelLoadProgress(33);

      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      setModelLoadProgress(66);

      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setModelLoadProgress(100);

      setModelsLoaded(true);
      setStatus('📸 Starting camera...');

      // FIXED: Immediate camera start
      console.log('✅ Models loaded, starting camera NOW');
      startCamera();

    } catch (error) {
      console.error('Model loading error:', error);
      setStatus('❌ Failed to load AI models. Please refresh.');
    }
  };

  const stopCamera = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setVideoReady(false);
    setFaceDetected(false);
    setDetection(null);
    isProcessingRef.current = false;
  };

  const startCamera = async () => {
    try {
      stopCamera();
      setStatus('📸 Accessing camera...');

      const constraints = {
        video: { 
          facingMode: { exact: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('🎥 Requesting camera with facingMode:', facingMode);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Camera stream obtained');

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // CRITICAL FIX: Wait for video metadata AND play
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded');
            resolve();
          };
        });

        // Now play the video
        await videoRef.current.play();
        console.log('▶️ Video playing');

        // CRITICAL FIX: Wait for video to have enough data
        await new Promise((resolve) => {
          const checkReady = () => {
            if (videoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA
              console.log('✅ Video ready state:', videoRef.current.readyState);
              resolve();
            } else {
              console.log('⏳ Waiting... ready state:', videoRef.current.readyState);
              setTimeout(checkReady, 50);
            }
          };
          checkReady();
        });

        // Set canvas dimensions
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          console.log('📐 Canvas size:', canvasRef.current.width, 'x', canvasRef.current.height);
        }
        
        setVideoReady(true);
        setStatus('✅ Ready! Position your face');
        
        console.log('🚀 Starting face detection NOW');
        // CRITICAL FIX: Start detection immediately
        setTimeout(() => {
          startFaceDetection();
        }, 200);
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      
      // Fallback: try without exact facingMode
      if (error.name === 'OverconstrainedError') {
        console.log('🔄 Trying fallback camera settings...');
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
          });
          
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            
            if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            
            setVideoReady(true);
            setStatus('✅ Ready! Position your face');
            setTimeout(() => startFaceDetection(), 200);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback failed:', fallbackError);
          setStatus('❌ Camera permission denied');
        }
      } else {
        setStatus('❌ Camera permission denied');
      }
    }
  };

  const switchCamera = async () => {
    console.log('🔄 Switching camera from', facingMode);
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    
    setFacingMode(newMode);
    setStatus('🔄 Switching camera...');
    setFaceDetected(false);
    setDetection(null);
    
    // CRITICAL FIX: Properly stop current camera first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setVideoReady(false);
    
    // Wait a bit for cleanup then start new camera
    setTimeout(async () => {
      try {
        const constraints = {
          video: { 
            facingMode: { exact: newMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        console.log('🎥 Starting new camera with:', newMode);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ New camera stream obtained');

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => resolve();
          });

          await videoRef.current.play();
          
          // Wait for video ready
          await new Promise((resolve) => {
            const checkReady = () => {
              if (videoRef.current.readyState >= 3) {
                resolve();
              } else {
                setTimeout(checkReady, 50);
              }
            };
            checkReady();
          });

          if (canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
          
          setVideoReady(true);
          setStatus('✅ Camera switched! Position your face');
          
          setTimeout(() => {
            startFaceDetection();
          }, 200);
        }
      } catch (error) {
        console.error('❌ Camera switch error:', error);
        
        // Fallback without exact constraint
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: newMode }
          });
          
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            
            if (canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            
            setVideoReady(true);
            setStatus('✅ Camera switched! Position your face');
            setTimeout(() => startFaceDetection(), 200);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback switch failed:', fallbackError);
          setStatus('❌ Could not switch camera');
        }
      }
    }, 300);
  };

  const drawFaceBox = (detection) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detection) return;

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    };

    // Resize detection to match display
    const resizedDetection = faceapi.resizeResults(detection, displaySize);
    const box = resizedDetection.detection.box;

    // Draw face box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw corner brackets for better visibility
    const cornerLength = 30;
    ctx.lineWidth = 6;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + cornerLength);
    ctx.lineTo(box.x, box.y);
    ctx.lineTo(box.x + cornerLength, box.y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLength, box.y);
    ctx.lineTo(box.x + box.width, box.y);
    ctx.lineTo(box.x + box.width, box.y + cornerLength);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + box.height - cornerLength);
    ctx.lineTo(box.x, box.y + box.height);
    ctx.lineTo(box.x + cornerLength, box.y + box.height);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
    ctx.stroke();

    // Draw landmarks
    if (resizedDetection.landmarks) {
      const landmarks = resizedDetection.landmarks.positions;
      ctx.fillStyle = '#00ff00';
      landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  };

  const startFaceDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    console.log('🔍 Face detection started');
    let detectionCount = 0;

    // CRITICAL FIX: Run face detection every 50ms for first 5 seconds, then 100ms
    const initialInterval = 50; // Very fast initially
    const normalInterval = 100; // Normal speed after

    const runDetection = async () => {
      if (videoRef.current && videoReady && modelsLoaded && !capturing && !isProcessingRef.current) {
        try {
          isProcessingRef.current = true;
          detectionCount++;
          
          const detectedFace = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })) // Lower confidence for easier detection
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detectedFace) {
            console.log('✅ Face detected! Count:', detectionCount);
            setFaceDetected(true);
            setDetection(detectedFace);
            drawFaceBox(detectedFace);
            
            // After first detection, slow down to normal interval
            if (detectionCount === 1 && detectionIntervalRef.current) {
              clearInterval(detectionIntervalRef.current);
              console.log('⚡ Switching to normal detection speed');
              detectionIntervalRef.current = setInterval(runDetection, normalInterval);
            }
          } else {
            setFaceDetected(false);
            setDetection(null);
            // Clear canvas if no face
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
          
          isProcessingRef.current = false;
        } catch (err) {
          console.error('Detection error:', err);
          isProcessingRef.current = false;
        }
      }
    };

    // Start with very fast interval
    detectionIntervalRef.current = setInterval(runDetection, initialInterval);
    
    // Run immediately once
    runDetection();
    
    // After 5 seconds, switch to normal interval if not already done
    setTimeout(() => {
      if (detectionIntervalRef.current && detectionCount === 0) {
        clearInterval(detectionIntervalRef.current);
        console.log('⏰ Timeout - switching to normal detection speed');
        detectionIntervalRef.current = setInterval(runDetection, normalInterval);
      }
    }, 5000);
  };

  useEffect(() => {
    if (sessionId) fetchSessionData();

    if (!socket) socket = io(config.API_URL);

    return () => stopCamera();
  }, [sessionId, fetchSessionData]);

  const captureFace = async () => {
    if (!modelsLoaded || capturing || !videoReady || !sessionData || !detection) return;

    setCapturing(true);
    setStatus('🔍 Capturing face...');

    try {
      // Use the already detected face
      if (!detection || !detection.descriptor) {
        setCapturing(false);
        setStatus('❌ No face detected. Please try again.');
        return;
      }

      socket.emit('face-captured', {
        sessionId: sessionData.sessionId,
        faceDescriptor: Array.from(detection.descriptor),
        email: sessionData.email,
        password: sessionData.password,
        type: sessionData.type
      });

      stopCamera();
      setStatus('⏳ Verifying your face...');

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/verification-success?type=' + sessionData.type);
      }, 3000);

    } catch (err) {
      console.error(err);
      setCapturing(false);
      setStatus('❌ Capture failed. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📱 Face Verification</h1>
            <p style={styles.subtitle}>
              {sessionData?.type === 'register' ? '🔐 Registration' : '🔑 Login'}
            </p>
          </div>

          <button onClick={handleClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.videoContainer}>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            style={styles.video}
          />
          
          <canvas 
            ref={canvasRef} 
            style={styles.canvas}
          />

          {videoReady && (
            <button onClick={switchCamera} style={styles.cameraSwitchBtn}>
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

          {!videoReady && modelsLoaded && (
            <div style={styles.loadingOverlay}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Starting camera...</p>
            </div>
          )}

          {!modelsLoaded && (
            <div style={styles.loadingOverlay}>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${modelLoadProgress}%`
                }}></div>
              </div>
              <p style={styles.loadingText}>Loading AI models... {modelLoadProgress}%</p>
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

        <div style={styles.statusBox}>
          <p style={styles.statusText}>{status}</p>
        </div>

        <div style={styles.instructions}>
          <h4 style={styles.instructionsTitle}>📋 Instructions:</h4>
          <ul style={styles.instructionsList}>
            <li>Position your face in the frame</li>
            <li>Ensure good lighting</li>
            <li>Look directly at the camera</li>
            <li>Wait for green box to appear</li>
            <li>Click "Capture Face" when ready</li>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: { fontSize: '26px', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },

  closeBtn: {
    background: '#ef4444',
    border: 'none',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  videoContainer: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#000',
    marginBottom: '20px',
    minHeight: '400px'
  },
  video: { 
    width: '100%', 
    display: 'block',
    transform: 'scaleX(-1)' 
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: 'scaleX(-1)'
  },

  cameraSwitchBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '20px',
    border: 'none',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 10
  },

  detectionIndicator: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    zIndex: 10
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
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },

  loadingText: {
    marginTop: '20px',
    fontSize: '16px',
    fontWeight: 'bold'
  },

  progressBar: {
    width: '200px',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease'
  },

  button: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    borderRadius: '12px',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    marginBottom: '15px',
    transition: 'all 0.3s'
  },

  statusBox: {
    padding: '12px',
    background: '#fef3c7',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '15px'
  },
  statusText: {
    margin: 0,
    fontWeight: '600',
    fontSize: '14px'
  },

  instructions: {
    backgroundColor: '#f8fafc',
    padding: '15px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  instructionsTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#1e293b'
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#64748b',
    fontSize: '13px',
    lineHeight: '1.8'
  }
};

// Add spinner animation
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