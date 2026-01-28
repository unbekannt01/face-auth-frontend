/* eslint-disable react-hooks/exhaustive-deps */
// src/components/MobileVerify.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import io from 'socket.io-client';
import axios from 'axios';
import { config } from '../config';

let socket = null;

function MobileVerify() {
  const { sessionId } = useParams();
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState('🔄 Loading session...');
  const [sessionData, setSessionData] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

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
      
      const MODEL_URL = `${window.location.origin}/models`;
      
      console.log('📍 Loading models from:', MODEL_URL);

      // Load models one by one with better error handling
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        .catch(err => {
          console.error('❌ SSD MobileNet loading failed:', err);
          throw new Error('Failed to load face detection model');
        });
      
      console.log('✅ Face detection model loaded');

      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        .catch(err => {
          console.error('❌ Face Landmark loading failed:', err);
          throw new Error('Failed to load landmark model');
        });
      
      console.log('✅ Landmark model loaded');

      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        .catch(err => {
          console.error('❌ Face Recognition loading failed:', err);
          throw new Error('Failed to load recognition model');
        });
      
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
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
        };
      }
    } catch (error) {
      setStatus('❌ Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', error);
    }
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
        
        setStatus('✅ Face captured! Sending data...');

        if (socket) {
          socket.emit('face-captured', {
            sessionId: sessionData.sessionId,
            faceDescriptor,
            email: sessionData.email,
            password: sessionData.password
          });
        }

        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }

        setTimeout(() => {
          setStatus('✅ Success! Return to your computer.');
        }, 500);

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
            <div style={styles.faceGuide}>
              <div style={styles.guideLine} />
            </div>
          </div>
        </div>

        <button 
          onClick={captureFace}
          disabled={!videoReady || capturing}
          style={{
            ...styles.button,
            backgroundColor: !videoReady || capturing ? '#94a3b8' : '#667eea',
            cursor: !videoReady || capturing ? 'not-allowed' : 'pointer'
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
    animation: 'pulse 2s ease-in-out infinite'
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