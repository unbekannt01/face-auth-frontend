/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.jsx
// FINAL UPDATED VERSION with close button + correct delays

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
  const isProcessingRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('🔄 Loading session...');
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);

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

      // 🔥 FIX: 1000ms delay before starting camera
      setTimeout(() => {
        startCamera();
      }, 1000);

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

    setVideoReady(false);
    setFaceDetected(false);
    isProcessingRef.current = false;
  };

  const startCamera = async () => {
    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const checkReady = () => {
          if (videoRef.current.readyState >= 2) {
            setVideoReady(true);
            setStatus('✅ Ready! Position your face');
            startFaceDetection();
          } else {
            setTimeout(checkReady, 100);
          }
        };

        checkReady();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setStatus('❌ Camera permission denied');
    }
  };

  const switchCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    setTimeout(startCamera, 300);
  };

  const startFaceDetection = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoReady && modelsLoaded && !capturing && !isProcessingRef.current) {
        try {
          isProcessingRef.current = true;
          const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks();

          setFaceDetected(!!detection);
          isProcessingRef.current = false;
        } catch {
          isProcessingRef.current = false;
        }
      }
    }, 300);
  };

  useEffect(() => {
    if (sessionId) fetchSessionData();

    if (!socket) socket = io(config.API_URL);

    return () => stopCamera();
  }, [sessionId, fetchSessionData]);

  const captureFace = async () => {
    if (!modelsLoaded || capturing || !videoReady || !sessionData) return;

    setCapturing(true);
    setStatus('🔍 Capturing face...');

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setCapturing(false);
        setStatus('❌ No face detected');
        return;
      }

      socket.emit('face-captured', {
        sessionId: sessionData.sessionId,
        faceDescriptor: Array.from(detections.descriptor),
        email: sessionData.email,
        password: sessionData.password,
        type: sessionData.type
      });

      stopCamera();
      setStatus('⏳ Waiting for verification...');

      // 🔥 FIX: redirect delay → 5000ms
      setTimeout(() => {
        navigate('/verification-success?type=' + sessionData.type);
      }, 5000);

    } catch (err) {
      console.error(err);
      setCapturing(false);
      setStatus('❌ Capture failed');
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

          {/* ❌ CLOSE BUTTON */}
          <button onClick={handleClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.videoContainer}>
          <video ref={videoRef} autoPlay muted playsInline style={styles.video} />

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
        </div>

        <button
          onClick={captureFace}
          disabled={!videoReady || capturing || !faceDetected}
          style={{
            ...styles.button,
            backgroundColor: (!videoReady || capturing || !faceDetected) ? '#94a3b8' : '#667eea'
          }}
        >
          {capturing ? '⏳ Processing...' : '📸 Capture Face'}
        </button>

        <div style={styles.statusBox}>
          <p style={styles.statusText}>{status}</p>
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
    cursor: 'pointer'
  },

  videoContainer: {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#000',
    marginBottom: '20px'
  },
  video: { width: '100%', transform: 'scaleX(-1)' },

  cameraSwitchBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'white',
    borderRadius: '18px',
    border: 'none',
    padding: '8px 14px',
    cursor: 'pointer'
  },

  detectionIndicator: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '6px 14px',
    borderRadius: '14px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'white'
  },

  button: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    borderRadius: '12px',
    border: 'none',
    color: 'white',
    fontWeight: 'bold'
  },

  statusBox: {
    marginTop: '15px',
    padding: '12px',
    background: '#fef3c7',
    borderRadius: '12px',
    textAlign: 'center'
  },
  statusText: {
    margin: 0,
    fontWeight: '600'
  }
};

export default MobileVerify;
