/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.js
//  FINAL FIX - GREEN DOTS GUARANTEED! 

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
  const videoReadyFiredRef = useRef(false); //  PREVENT MULTIPLE CALLS

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState(' Initializing...');
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
      setStatus(' Loading session...');
      const response = await axios.get(`${config.API_URL}/api/session/${sessionId}`);
      
      if (response.data.success) {
        console.log('[SESSION]  Loaded');
        setSessionData({
          sessionId,
          ...response.data.data
        });
        loadModels();
      } else {
        setStatus(' Session expired');
      }
    } catch (error) {
      console.error('[SESSION] Error:', error);
      setStatus(' Failed to load session');
    }
  }, [sessionId]);

  const loadModels = async () => {
    try {
      setStatus(' Loading AI models...');
      console.log('[MODELS] Loading...');
      
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      
      console.log('[MODELS]  LOADED');
      setModelsLoaded(true);
      startCamera();
      
    } catch (error) {
      console.error('[MODELS] Failed:', error);
      setStatus(' Failed to load AI');
    }
  };

  const startCamera = async () => {
    try {
      cleanup();
      
      console.log('[CAMERA] Starting...');
      setStatus(' Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('[CAMERA]  Stream ready');
      streamRef.current = stream;

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.muted = true;
      
      //  FIX: USE ONLY ONE EVENT LISTENER
      videoRef.current.onloadedmetadata = async () => {
        //  PREVENT MULTIPLE CALLS
        if (videoReadyFiredRef.current) {
          console.log('[VIDEO] Already initialized, skipping...');
          return;
        }
        videoReadyFiredRef.current = true;
        
        console.log('[VIDEO]  Metadata loaded (ONCE)');
        
        // Set canvas size
        if (canvasRef.current && videoRef.current) {
          const width = videoRef.current.videoWidth || 640;
          const height = videoRef.current.videoHeight || 480;
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          console.log('[CANVAS] Size set:', width, 'x', height);
        }
        
        // Play video
        try {
          await videoRef.current.play();
          console.log('[VIDEO]  Playing');
        } catch (err) {
          console.error('[VIDEO] Play error:', err);
        }
        
        //  Wait for video to fully stabilize
        console.log('[VIDEO]  Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[VIDEO]  READY');
        
        setVideoReady(true);
        setStatus('✨ Position your face');
        
        // Start detection
        startDetection();
      };

    } catch (error) {
      console.error('[CAMERA] Error:', error);
      setStatus(' Camera denied');
    }
  };

  const startDetection = () => {
    if (isDetectingRef.current) {
      console.log('[DETECTION]  Already running');
      return;
    }

    isDetectingRef.current = true;
    console.log('[DETECTION] 🚀 STARTING NOW...');
    
    let frameCount = 0;
    
    detectionIntervalRef.current = setInterval(async () => {
      // Skip if already capturing
      if (capturing) return;
      
      // Check refs exist
      if (!videoRef.current || !canvasRef.current) {
        console.log('[DETECTION]  Missing refs');
        return;
      }

      // Check video is ready
      if (videoRef.current.readyState < 2) {
        if (frameCount === 0) {
          console.log('[DETECTION]  Waiting for video ready...');
        }
        frameCount++;
        return;
      }

      try {
        frameCount++;
        
        // Detect face
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ 
            minConfidence: 0.3
          }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        //  CRITICAL: Always clear canvas FIRST
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          // Log first detection
          if (!faceDetected) {
            console.log(' FIRST FACE DETECTED! ');
          }
          
          // Log every 30 frames
          if (frameCount % 30 === 1) {
            const conf = Math.round(detection.detection.score * 100);
            console.log(`[DETECTION] Frame ${frameCount}, Confidence: ${conf}%`);
          }
          
          setFaceDetected(true);
          setCurrentDetection(detection);
          
          const box = detection.detection.box;
          const confidence = Math.round(detection.detection.score * 100);
          
          //  DRAW GREEN BOX (THICK & BRIGHT)
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 5;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          
          //  DRAW BIG CORNER BRACKETS
          const cornerLen = 35;
          ctx.lineWidth = 7;
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
          
          //  DRAW BRIGHT GREEN LANDMARKS (BIG DOTS) 
          if (detection.landmarks) {
            console.log('[DRAW] Drawing', detection.landmarks.positions.length, 'landmarks');
            
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 8;
            
            detection.landmarks.positions.forEach((point, idx) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI); //  BIG DOTS: 4px radius
              ctx.fill();
              
              // Log first few landmarks
              if (frameCount === 1 && idx < 3) {
                console.log(`[LANDMARK ${idx}] x=${point.x}, y=${point.y}`);
              }
            });
            
            ctx.shadowBlur = 0;
          }
          
          // Draw confidence
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 22px Arial';
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 5;
          ctx.fillText(`${confidence}%`, box.x + 10, box.y - 10);
          ctx.shadowBlur = 0;
          
        } else {
          // No face
          if (faceDetected) {
            console.log('[DETECTION]  Face lost');
          }
          setFaceDetected(false);
          setCurrentDetection(null);
        }

      } catch (err) {
        console.error('[DETECTION] Error:', err);
      }
    }, 50); // 20 times per second
  };

  const switchCamera = async () => {
    console.log('[CAMERA] Switching...');
    
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    setFaceDetected(false);
    setCurrentDetection(null);
    setVideoReady(false);
    
    cleanup();
    
    setStatus(' Switching...');
    await new Promise(r => setTimeout(r, 300));
    
    await startCamera();
  };

  const captureFace = async () => {
    if (!currentDetection || capturing) return;

    setCapturing(true);
    setStatus(' Capturing...');
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
      setStatus(' Verifying...');

      setTimeout(() => {
        navigate('/verification-success?type=' + sessionData.type);
      }, 2000);

    } catch (err) {
      console.error('[CAPTURE] Error:', err);
      setCapturing(false);
      setStatus(' Failed');
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
            <h1 style={styles.title}> Face Verification</h1>
            <p style={styles.subtitle}>
              {sessionData?.type === 'register' ? ' Registration' : ' Login'}
            </p>
          </div>
          <button onClick={handleClose} style={styles.closeBtn}></button>
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
               {facingMode === 'user' ? 'Back' : 'Front'}
            </button>
          )}

          {videoReady && (
            <div style={{
              ...styles.indicator,
              backgroundColor: faceDetected ? '#4CAF50' : '#FF9800'
            }}>
              {faceDetected ? ' FACE DETECTED!' : ' Position Face'}
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
          {capturing ? ' Processing...' : ' Capture Face'}
        </button>

        <div style={styles.statusBox}>
          <p style={styles.statusText}>{status}</p>
        </div>

        <div style={styles.instructions}>
          <p style={styles.instructionTitle}> Tips:</p>
          <ul style={styles.instructionList}>
            <li>Face camera directly</li>
            <li>Good lighting needed</li>
            <li>Wait 2-3 seconds after opening</li>
            <li>Green dots = landmarks detected</li>
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
    transform: 'scaleX(-1)',
    pointerEvents: 'none'
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
    padding: '10px 25px',
    borderRadius: '25px',
    color: 'white',
    fontSize: '15px',
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