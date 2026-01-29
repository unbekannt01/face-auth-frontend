/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.jsx
// ZERO DELAY VERSION - INSTANT DETECTION ON FIRST LOAD

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
  const detectionLoopRef = useRef(null);
  const isDetectingRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('🔄 Initializing...');
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentDetection, setCurrentDetection] = useState(null);

  const handleClose = () => {
    cleanup();
    navigate('/');
  };

  const cleanup = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isDetectingRef.current = false;
  };

  const fetchSessionData = useCallback(async () => {
    try {
      setStatus('📥 Loading session...');
      const response = await axios.get(`${config.API_URL}/api/session/${sessionId}`);
      if (response.data.success) {
        setSessionData({
          sessionId,
          ...response.data.data
        });
        loadModels();
      } else {
        setStatus('❌ Session expired');
      }
    } catch (error) {
      setStatus('❌ Failed to load session');
      console.error('Session error:', error);
    }
  }, [sessionId]);

  const loadModels = async () => {
    try {
      setStatus('📦 Loading AI models...');
      
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      console.log('[MODELS] Loading all models...');
      
      // Load all in parallel for speed
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('[MODELS] ✅ ALL LOADED!');
      setModelsLoaded(true);
      setStatus('📸 Starting camera...');
      
      // CRITICAL: Start camera IMMEDIATELY, no delay!
      startCamera();
      
    } catch (error) {
      console.error('[MODELS] ❌ Loading failed:', error);
      setStatus('❌ Failed to load AI. Refresh page.');
    }
  };

  const startCamera = async () => {
    try {
      cleanup();
      
      console.log('[CAMERA] Starting with facingMode:', facingMode);
      setStatus('📸 Accessing camera...');

      // CRITICAL: Simple, reliable constraints
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[CAMERA] ✅ Stream obtained');
      
      streamRef.current = stream;

      if (!videoRef.current) {
        console.error('[CAMERA] ❌ Video ref null');
        return;
      }

      videoRef.current.srcObject = stream;
      
      // CRITICAL: Play immediately
      videoRef.current.play().catch(err => {
        console.error('[CAMERA] Play error:', err);
      });

      // CRITICAL: Setup canvas BEFORE waiting for video
      if (canvasRef.current) {
        // Set default size immediately
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
        console.log('[CANVAS] Initial size: 640x480');
      }

      // CRITICAL: Start detection IMMEDIATELY, don't wait for perfect readyState
      console.log('[DETECTION] Starting IMMEDIATELY...');
      setVideoReady(true);
      setStatus('✅ Detecting face...');
      startDetection();

      // Update canvas size when video metadata loads (async, non-blocking)
      videoRef.current.onloadedmetadata = () => {
        console.log('[VIDEO] Metadata loaded');
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 480;
          console.log('[CANVAS] Updated size:', canvasRef.current.width, 'x', canvasRef.current.height);
        }
      };

    } catch (error) {
      console.error('[CAMERA] ❌ Error:', error);
      setStatus('❌ Camera access denied');
    }
  };

  const startDetection = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
    }

    console.log('[DETECTION] Loop started');
    isDetectingRef.current = true;
    
    const detect = async () => {
      // Check if we should continue
      if (!isDetectingRef.current || capturing || !modelsLoaded) {
        return;
      }

      if (!videoRef.current || !canvasRef.current) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      // CRITICAL: Check if video has ANY data (even readyState 1 is OK!)
      if (videoRef.current.readyState < 1) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        // Detect face
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ 
            minConfidence: 0.3  // Low confidence for easy detection
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          // FACE FOUND!
          if (!faceDetected) {
            console.log('[DETECTION] ✅ FACE DETECTED!');
          }
          
          setFaceDetected(true);
          setCurrentDetection(detection);
          
          const box = detection.detection.box;
          const confidence = Math.round(detection.detection.score * 100);
          
          // Draw green box
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          // Draw corner brackets
          const cornerLen = 30;
          ctx.lineWidth = 6;
          
          // Top-left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + cornerLen);
          ctx.lineTo(box.x, box.y);
          ctx.lineTo(box.x + cornerLen, box.y);
          ctx.stroke();
          
          // Top-right
          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLen, box.y);
          ctx.lineTo(box.x + box.width, box.y);
          ctx.lineTo(box.x + box.width, box.y + cornerLen);
          ctx.stroke();
          
          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(box.x, box.y + box.height - cornerLen);
          ctx.lineTo(box.x, box.y + box.height);
          ctx.lineTo(box.x + cornerLen, box.y + box.height);
          ctx.stroke();
          
          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height);
          ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
          ctx.stroke();
          
          // Draw landmarks (green dots)
          if (detection.landmarks) {
            ctx.fillStyle = '#00ff00';
            const landmarks = detection.landmarks.positions;
            landmarks.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
          
          // Draw confidence
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 20px Arial';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          ctx.fillText(`${confidence}%`, box.x + 5, box.y - 10);
          ctx.shadowBlur = 0;
          
        } else {
          // No face
          if (faceDetected) {
            console.log('[DETECTION] ⚠️ Face lost');
          }
          setFaceDetected(false);
          setCurrentDetection(null);
        }

      } catch (err) {
        console.error('[DETECTION] Error:', err);
      }

      // Continue loop
      detectionLoopRef.current = requestAnimationFrame(detect);
    };

    // Start the loop
    detect();
  };

  const switchCamera = async () => {
    console.log('[CAMERA] Switching from', facingMode);
    
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    setFaceDetected(false);
    setCurrentDetection(null);
    
    // Stop detection
    isDetectingRef.current = false;
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setVideoReady(false);
    setStatus('🔄 Switching camera...');
    
    // Small delay for cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Start new camera with new mode
    try {
      const constraints = {
        video: {
          facingMode: newMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[CAMERA] ✅ Switched to', newMode);
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        if (canvasRef.current) {
          canvasRef.current.width = 640;
          canvasRef.current.height = 480;
        }
        
        // CRITICAL: Start detection IMMEDIATELY
        setVideoReady(true);
        setStatus('✅ Detecting face...');
        startDetection();
        
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth || 640;
            canvasRef.current.height = videoRef.current.videoHeight || 480;
          }
        };
      }
    } catch (error) {
      console.error('[CAMERA] Switch failed:', error);
      setStatus('❌ Camera switch failed');
    }
  };

  const captureFace = async () => {
    if (!currentDetection || capturing) return;

    setCapturing(true);
    setStatus('📸 Capturing...');

    try {
      const descriptor = Array.from(currentDetection.descriptor);
      
      console.log('[CAPTURE] Sending to server...');
      socket.emit('face-captured', {
        sessionId: sessionData.sessionId,
        faceDescriptor: descriptor,
        email: sessionData.email,
        password: sessionData.password,
        type: sessionData.type
      });

      cleanup();
      setStatus('⏳ Verifying...');

      setTimeout(() => {
        navigate('/verification-success?type=' + sessionData.type);
      }, 2000);

    } catch (err) {
      console.error('[CAPTURE] Error:', err);
      setCapturing(false);
      setStatus('❌ Capture failed');
    }
  };

  useEffect(() => {
    if (sessionId) fetchSessionData();
    if (!socket) socket = io(config.API_URL);
    
    return () => {
      cleanup();
    };
  }, [sessionId]);

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

        <div style={styles.videoBox}>
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

          {!modelsLoaded && (
            <div style={styles.overlay}>
              <div style={styles.spinner}></div>
              <p style={styles.overlayText}>Loading AI models...</p>
            </div>
          )}

          {videoReady && (
            <button onClick={switchCamera} style={styles.switchBtn}>
              🔄 {facingMode === 'user' ? 'Back' : 'Front'} Camera
            </button>
          )}

          {videoReady && (
            <div style={{
              ...styles.indicator,
              backgroundColor: faceDetected ? '#4CAF50' : '#FF9800'
            }}>
              {faceDetected ? '✓ Face Detected!' : '⚠ Position Your Face'}
            </div>
          )}
        </div>

        <button
          onClick={captureFace}
          disabled={!faceDetected || capturing}
          style={{
            ...styles.captureBtn,
            backgroundColor: (!faceDetected || capturing) ? '#ccc' : '#667eea',
            cursor: (!faceDetected || capturing) ? 'not-allowed' : 'pointer'
          }}
        >
          {capturing ? '⏳ Processing...' : '📸 Capture Face'}
        </button>

        <div style={styles.statusBox}>
          <p style={styles.statusText}>{status}</p>
        </div>

        <div style={styles.instructions}>
          <p style={styles.instructionTitle}>💡 Tips:</p>
          <ul style={styles.instructionList}>
            <li>Face camera directly</li>
            <li>Ensure good lighting</li>
            <li>Remove glasses if needed</li>
            <li>Wait for green box</li>
          </ul>
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
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    margin: 0,
    color: '#333'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '5px 0 0 0'
  },
  closeBtn: {
    background: '#ef4444',
    border: 'none',
    color: 'white',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '20px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  videoBox: {
    position: 'relative',
    borderRadius: '15px',
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: '20px'
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  overlayText: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '15px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(255,255,255,0.3)',
    borderTop: '5px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  switchBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 15px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: 10
  },
  indicator: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 20px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    zIndex: 10
  },
  captureBtn: {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    marginBottom: '15px',
    transition: 'all 0.3s'
  },
  statusBox: {
    backgroundColor: '#fff3cd',
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '15px',
    border: '1px solid #ffc107'
  },
  statusText: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#856404',
    textAlign: 'center'
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #dee2e6'
  },
  instructionTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  instructionList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#666',
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
if (!document.head.querySelector('style[data-mobile-verify]')) {
  styleSheet.setAttribute('data-mobile-verify', 'true');
  document.head.appendChild(styleSheet);
}

export default MobileVerify;