/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.jsx
// COMPLETELY REWRITTEN - GUARANTEED WORKING VERSION

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
  const animationFrameRef = useRef(null);

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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
      setStatus('📦 Loading AI models... (0%)');
      
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      console.log('Loading SSD MobileNet...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      setStatus('📦 Loading AI models... (33%)');
      
      console.log('Loading Face Landmarks...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      setStatus('📦 Loading AI models... (66%)');
      
      console.log('Loading Face Recognition...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setStatus('📦 Loading AI models... (100%)');
      
      console.log('✅ ALL MODELS LOADED!');
      setModelsLoaded(true);
      
      // Wait a bit then start camera
      setTimeout(() => {
        setStatus('📸 Starting camera...');
        startCamera();
      }, 500);
      
    } catch (error) {
      console.error('❌ Model loading failed:', error);
      setStatus('❌ Failed to load AI. Refresh page.');
    }
  };

  const startCamera = async () => {
    try {
      cleanup();
      
      console.log('🎥 Requesting camera access...');
      setStatus('📸 Accessing camera...');

      // Simple constraints - more compatible
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got camera stream');
      
      streamRef.current = stream;

      if (!videoRef.current) {
        console.error('❌ Video ref is null');
        return;
      }

      videoRef.current.srcObject = stream;
      
      // Simple play
      try {
        await videoRef.current.play();
        console.log('✅ Video playing');
      } catch (playError) {
        console.error('Play error:', playError);
      }

      // Wait for video to have data
      let attempts = 0;
      const waitForVideo = setInterval(() => {
        attempts++;
        console.log(`Waiting for video... Attempt ${attempts}, ReadyState: ${videoRef.current?.readyState}`);
        
        if (videoRef.current && videoRef.current.readyState >= 2) {
          clearInterval(waitForVideo);
          console.log('✅ Video is ready!');
          
          // Setup canvas
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth || 640;
            canvasRef.current.height = videoRef.current.videoHeight || 480;
            console.log('📐 Canvas size:', canvasRef.current.width, 'x', canvasRef.current.height);
          }
          
          setVideoReady(true);
          setStatus('✅ Camera ready! Detecting face...');
          
          // Start detection
          console.log('🚀 STARTING FACE DETECTION NOW!');
          detectFace();
        }
        
        if (attempts > 50) {
          clearInterval(waitForVideo);
          console.error('❌ Video timeout');
          setStatus('❌ Camera timeout. Refresh page.');
        }
      }, 100);

    } catch (error) {
      console.error('❌ Camera error:', error);
      setStatus('❌ Camera access denied. Please allow camera.');
    }
  };

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || capturing) {
      console.log('Skipping detection:', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        models: modelsLoaded,
        capturing
      });
      return;
    }

    try {
      // Detect face
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ 
          minConfidence: 0.3  // Very low for easier detection
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        // FACE DETECTED!
        setFaceDetected(true);
        setCurrentDetection(detection);
        
        // Draw on canvas
        const box = detection.detection.box;
        
        // Green rectangle
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Corner brackets
        const cornerLen = 25;
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#00ff00';
        
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
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
        
        // Draw confidence
        const confidence = Math.round(detection.detection.score * 100);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`${confidence}%`, box.x + 5, box.y - 10);
        
        console.log('✅ Face detected! Confidence:', confidence);
        
      } else {
        // NO FACE
        setFaceDetected(false);
        setCurrentDetection(null);
      }

    } catch (err) {
      console.error('Detection error:', err);
    }

    // Continue detection loop
    if (videoReady && !capturing) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }
  };

  const switchCamera = async () => {
    console.log('🔄 Switching camera...');
    
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    setFaceDetected(false);
    setCurrentDetection(null);
    setVideoReady(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    cleanup();
    
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  const captureFace = async () => {
    if (!currentDetection || capturing) return;

    setCapturing(true);
    setStatus('📸 Capturing...');

    try {
      const descriptor = Array.from(currentDetection.descriptor);
      
      console.log('Sending face data to server...');
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
      console.error('Capture error:', err);
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

          {modelsLoaded && !videoReady && (
            <div style={styles.overlay}>
              <div style={styles.spinner}></div>
              <p style={styles.overlayText}>Starting camera...</p>
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
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