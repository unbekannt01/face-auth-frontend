'use client';

/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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
  const isDetectingRef = useRef(false);
  const videoReadyFiredRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('✨ Initializing...');
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
    console.log('[CLEANUP] Starting...');
    
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
    
    isDetectingRef.current = false;
    videoReadyFiredRef.current = false;
  };

  const fetchSessionData = useCallback(async () => {
    try {
      setStatus('✨ Loading session...');
      const apiUrl = config.API_URL + '/api/session/' + sessionId;
      const response = await axios.get(apiUrl);
      
      if (response.data.success) {
        console.log('[SESSION] ✓ Loaded');
        setSessionData({
          sessionId,
          ...response.data.data
        });
        loadModels();
      } else {
        setStatus('✗ Session expired');
      }
    } catch (error) {
      console.error('[SESSION] Error:', error);
      setStatus('✗ Failed to load session');
    }
  }, [sessionId]);

  const loadModels = async () => {
    try {
      setStatus('✨ Loading AI models...');
      console.log('[MODELS] Loading...');
      
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('[MODELS] ✓ LOADED');
      setModelsLoaded(true);
      startCamera();
      
    } catch (error) {
      console.error('[MODELS] Failed:', error);
      setStatus('✗ Failed to load AI');
    }
  };

  const startCamera = async () => {
    try {
      cleanup();
      
      console.log('[CAMERA] Starting...');
      setStatus('✨ Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('[CAMERA] ✓ Stream ready');
      streamRef.current = stream;

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.muted = true;
      
      videoRef.current.onloadedmetadata = async () => {
        if (videoReadyFiredRef.current) {
          console.log('[VIDEO] Already initialized, skipping...');
          return;
        }
        videoReadyFiredRef.current = true;
        
        console.log('[VIDEO] ✓ Metadata loaded (ONCE)');
        
        if (canvasRef.current && videoRef.current) {
          const width = videoRef.current.videoWidth || 640;
          const height = videoRef.current.videoHeight || 480;
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          console.log('[CANVAS] Size set:', width, 'x', height);
        }
        
        try {
          await videoRef.current.play();
          console.log('[VIDEO] ✓ Playing');
        } catch (err) {
          console.error('[VIDEO] Play error:', err);
        }
        
        console.log('[VIDEO] ⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[VIDEO] ✓ READY');
        
        setVideoReady(true);
        setStatus('✨ Position your face');
        
        startDetection();
      };

    } catch (error) {
      console.error('[CAMERA] Error:', error);
      setStatus('✗ Camera denied');
    }
  };

  const startDetection = () => {
    if (isDetectingRef.current) {
      console.log('[DETECTION] ✓ Already running');
      return;
    }

    isDetectingRef.current = true;
    console.log('[DETECTION] 🚀 STARTING NOW...');
    
    let frameCount = 0;
    
    detectionIntervalRef.current = setInterval(async () => {
      if (capturing) return;
      
      if (!videoRef.current || !canvasRef.current) {
        console.log('[DETECTION] ✗ Missing refs');
        return;
      }

      if (videoRef.current.readyState < 2) {
        if (frameCount === 0) {
          console.log('[DETECTION] ⏳ Waiting for video ready...');
        }
        frameCount++;
        return;
      }

      try {
        frameCount++;
        
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ 
            minConfidence: 0.3
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          if (!faceDetected) {
            console.log('✓ FIRST FACE DETECTED!');
          }
          
          if (frameCount % 30 === 1) {
            const conf = Math.round(detection.detection.score * 100);
            console.log('[DETECTION] Frame ' + frameCount + ', Confidence: ' + conf + '%');
          }
          
          setFaceDetected(true);
          setCurrentDetection(detection);
          
          const box = detection.detection.box;
          const confidence = Math.round(detection.detection.score * 100);
          
          // BLUE BOX (Changed from green)
          ctx.strokeStyle = '#00d4ff';
          ctx.lineWidth = 5;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          // BLUE CORNER BRACKETS
          const cornerLen = 35;
          ctx.lineWidth = 7;
          ctx.strokeStyle = '#00d4ff';
          
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
          
          // BLUE LANDMARKS
          if (detection.landmarks) {
            ctx.fillStyle = '#00d4ff';
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 8;
            
            detection.landmarks.positions.forEach((point, idx) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
              ctx.fill();
            });
            
            ctx.shadowBlur = 0;
          }
          
          // Draw confidence
          ctx.fillStyle = '#00d4ff';
          ctx.font = 'bold 22px Arial';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 5;
          ctx.fillText(confidence + '%', box.x + 10, box.y - 10);
          ctx.shadowBlur = 0;
          
        } else {
          if (faceDetected) {
            console.log('[DETECTION] ✗ Face lost');
          }
          setFaceDetected(false);
          setCurrentDetection(null);
        }

      } catch (err) {
        console.error('[DETECTION] Error:', err);
      }
    }, 50);
  };

  const switchCamera = async () => {
    console.log('[CAMERA] Switching...');
    
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    setFaceDetected(false);
    setCurrentDetection(null);
    setVideoReady(false);
    
    cleanup();
    
    setStatus('✨ Switching...');
    await new Promise(r => setTimeout(r, 300));
    
    await startCamera();
  };

  const captureFace = async () => {
    if (!currentDetection || capturing) return;

    setCapturing(true);
    setStatus('✨ Capturing...');
    console.log('[CAPTURE] Sending...');

    try {
      const descriptor = Array.from(currentDetection.descriptor);
      
      socket.emit('face-captured', {
        sessionId: sessionData.sessionId,
        faceDescriptor: descriptor,
        email: sessionData.email,
        password: sessionData.password,
        type: sessionData.type
      });

      cleanup();
      setStatus('✨ Verifying...');

      setTimeout(() => {
        navigate('/verification-success?type=' + sessionData.type);
      }, 2000);

    } catch (err) {
      console.error('[CAPTURE] Error:', err);
      setCapturing(false);
      setStatus('✗ Failed');
    }
  };

  useEffect(() => {
    console.log('[INIT] Component mounted');
    
    if (sessionId) {
      fetchSessionData();
    }
    
    if (!socket) {
      socket = io(config.API_URL);
    }
    
    return () => {
      console.log('[UNMOUNT] Cleanup');
      cleanup();
    };
  }, [sessionId]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>👤 Face Verification</h1>
            <p style={styles.subtitle}>
              {sessionData?.type === 'register' ? '📝 Registration' : '🔐 Login'}
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
              <p style={styles.overlayText}>Loading AI...</p>
            </div>
          )}

          {videoReady && (
            <button onClick={switchCamera} style={styles.switchBtn}>
              🔄 {facingMode === 'user' ? 'Back' : 'Front'}
            </button>
          )}

          {videoReady && (
            <div style={{
              ...styles.indicator,
              backgroundColor: faceDetected ? '#00d4ff' : '#fbbf24'
            }}>
              {faceDetected ? '✓ FACE DETECTED!' : '⏳ Position Face'}
            </div>
          )}
        </div>

        <button
          onClick={captureFace}
          disabled={!faceDetected || capturing}
          style={{
            ...styles.captureBtn,
            backgroundColor: (!faceDetected || capturing) ? '#ccc' : '#00d4ff',
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
            <li>Good lighting needed</li>
            <li>Wait 2-3 seconds after opening</li>
            <li>Blue dots = landmarks detected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#050816',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative'
  },
  card: {
    background: 'linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px'
  },
  title: {
    fontSize: '26px',
    margin: 0,
    color: '#fff',
    fontWeight: '800'
  },
  subtitle: {
    fontSize: '13px',
    color: '#b0b0c9',
    margin: '8px 0 0 0',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  closeBtn: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  videoBox: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: '20px',
    border: '2px solid rgba(0, 212, 255, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.3)'
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
    transform: 'scaleX(-1)',
    pointerEvents: 'none'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  overlayText: {
    color: '#00d4ff',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '15px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(0, 212, 255, 0.2)',
    borderTop: '4px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  switchBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(0, 212, 255, 0.8)',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0, 212, 255, 0.4)',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    zIndex: 10,
    transition: 'all 0.3s ease'
  },
  indicator: {
    position: 'absolute',
    bottom: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 28px',
    borderRadius: '25px',
    color: '#000',
    fontSize: '13px',
    fontWeight: '700',
    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
    zIndex: 10,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  captureBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    marginBottom: '15px',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer'
  },
  statusBox: {
    background: 'rgba(0, 212, 255, 0.1)',
    padding: '14px',
    borderRadius: '10px',
    marginBottom: '15px',
    border: '1px solid rgba(0, 212, 255, 0.3)'
  },
  statusText: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#b0b0c9',
    textAlign: 'center'
  },
  instructions: {
    background: 'rgba(0, 212, 255, 0.08)',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 212, 255, 0.2)'
  },
  instructionTitle: {
    margin: '0 0 10px 0',
    fontSize: '13px',
    fontWeight: '700',
    color: '#b0b0c9',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  instructionList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#b0b0c9',
    lineHeight: '2'
  }
};

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