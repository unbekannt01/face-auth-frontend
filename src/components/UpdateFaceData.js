'use client';

/* eslint-disable react-hooks/exhaustive-deps */
// src/components/UpdateFaceData.js
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { config } from '../config';
import faceDetectionService from '../utils/faceDetection';

function UpdateFaceData() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newDescriptor, setNewDescriptor] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    startVideo();
    return () => {
      stopVideo();
    };
  }, [navigate]);

  const startVideo = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load face detection models
      await faceDetectionService.loadModels();

      // Get video stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please grant permission.');
      setIsLoading(false);
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (!isLoading && videoRef.current) {
      const interval = setInterval(async () => {
        const detection = await faceDetectionService.detectFace(videoRef.current);
        
        if (detection) {
          setFaceDetected(true);
          drawDetection(detection);
        } else {
          setFaceDetected(false);
          clearCanvas();
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const drawDetection = (detection) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    };

    faceapi.matchDimensions(canvas, displaySize);
    const resizedDetection = faceapi.resizeResults(detection, displaySize);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face box
    const box = resizedDetection.detection.box;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw corner brackets
    const cornerLen = 35;
    ctx.lineWidth = 7;
    
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

    // Draw landmarks
    if (resizedDetection.landmarks) {
      ctx.fillStyle = '#00ff00';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 8;
      
      resizedDetection.landmarks.positions.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      ctx.shadowBlur = 0;
    }

    // Draw confidence
    const confidence = Math.round(resizedDetection.detection.score * 100);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 22px Arial';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 5;
    ctx.fillText(`${confidence}%`, box.x + 10, box.y - 10);
    ctx.shadowBlur = 0;
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleCapture = async () => {
    if (!videoRef.current || capturing) return;

    try {
      setError('');
      setCapturing(true);

      const detection = await faceDetectionService.detectFace(videoRef.current);

      if (!detection) {
        setError('No face detected. Please position your face in the frame.');
        setCapturing(false);
        return;
      }

      const validation = faceDetectionService.validateFaceDetection(detection);
      if (!validation.valid) {
        setError(validation.message);
        setCapturing(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      setNewDescriptor(descriptor);
      setShowConfirmation(true);
      setCapturing(false);

    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture face. Please try again.');
      setCapturing(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!newDescriptor) return;

    try {
      setCapturing(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('❌ You are not authenticated. Please login again.');
        setCapturing(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      console.log('[UpdateFaceData] Sending face descriptor update...');
      console.log('[UpdateFaceData] Descriptor length:', newDescriptor.length);

      const response = await axios.put(
        `${config.API_URL}/api/auth/update-face`,
        { faceDescriptor: newDescriptor },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[UpdateFaceData] Response:', response.data);

      if (response.data.success) {
        setSuccess('✅ Face data updated successfully!');
        stopVideo();
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('❌ ' + (response.data.message || 'Failed to update face data'));
        setCapturing(false);
        setShowConfirmation(false);
      }
    } catch (err) {
      console.error('[UpdateFaceData] Error:', err);
      
      let errorMsg = 'Failed to update face data. Please try again.';
      
      if (err.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError('❌ ' + errorMsg);
      setCapturing(false);
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setNewDescriptor(null);
  };

  const handleGoBack = () => {
    stopVideo();
    navigate('/dashboard');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={handleGoBack} style={styles.backBtn}>
            ← Back
          </button>
          <h1 style={styles.title}>🔄 Update Face Data</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        <p style={styles.subtitle}>
          Capture your face again to update your biometric authentication data
        </p>

        {/* Video Container */}
        <div style={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={styles.video}
            onLoadedMetadata={() => {
              if (canvasRef.current && videoRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
              }
            }}
          />
          <canvas ref={canvasRef} style={styles.canvas} />
          
          {isLoading && (
            <div style={styles.overlay}>
              <div style={styles.spinner}></div>
              <p style={styles.overlayText}>Loading AI models...</p>
            </div>
          )}

          {!isLoading && (
            <div style={{
              ...styles.indicator,
              backgroundColor: faceDetected ? '#4CAF50' : '#FF9800'
            }}>
              {faceDetected ? '✓ Face Detected' : '⚠ Position Face'}
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div style={styles.statusContainer}>
          {faceDetected && !showConfirmation && (
            <p style={styles.statusSuccess}>✓ Face detected - Ready to capture</p>
          )}
          {!faceDetected && !isLoading && !showConfirmation && (
            <p style={styles.statusWarning}>Position your face in the frame</p>
          )}
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div style={styles.confirmationBox}>
            <h3 style={styles.confirmTitle}>⚠️ Confirm Face Update</h3>
            <p style={styles.confirmText}>
              Are you sure you want to update your face data? 
              This will replace your current biometric authentication.
            </p>
            <div style={styles.confirmButtons}>
              <button 
                onClick={handleConfirmUpdate} 
                disabled={capturing}
                style={styles.confirmBtn}
              >
                {capturing ? '⏳ Updating...' : '✅ Confirm Update'}
              </button>
              <button 
                onClick={handleCancel}
                disabled={capturing}
                style={styles.cancelBtn}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {/* Capture Button */}
        {!showConfirmation && (
          <button
            onClick={handleCapture}
            disabled={!faceDetected || isLoading || capturing}
            style={{
              ...styles.button,
              opacity: (!faceDetected || isLoading || capturing) ? 0.5 : 1,
              cursor: (!faceDetected || isLoading || capturing) ? 'not-allowed' : 'pointer'
            }}
          >
            {capturing ? '⏳ Capturing...' : '📸 Capture New Face'}
          </button>
        )}

        {/* Instructions */}
        <div style={styles.instructions}>
          <h3 style={styles.instructionTitle}>📋 Instructions:</h3>
          <ul style={styles.instructionList}>
            <li>Face the camera directly</li>
            <li>Ensure good lighting</li>
            <li>Remove glasses if possible</li>
            <li>Keep a neutral expression</li>
            <li>Wait for green indicators</li>
            <li>Click "Capture New Face" when ready</li>
          </ul>
        </div>

        {/* Warning */}
        <div style={styles.warningBox}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <p style={styles.warningText}>
            <strong>Important:</strong> Updating your face data will replace your 
            current biometric authentication. Make sure you're in a well-lit area 
            and your face is clearly visible.
          </p>
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
    maxWidth: '700px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  title: {
    fontSize: '28px',
    margin: 0,
    color: '#333',
    textAlign: 'center',
    flex: 1
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    marginBottom: '25px'
  },
  videoContainer: {
    position: 'relative',
    borderRadius: '15px',
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: '20px'
  },
  video: {
    width: '100%',
    display: 'block'
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
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
  indicator: {
    position: 'absolute',
    bottom: '15px',
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
  statusContainer: {
    minHeight: '40px',
    marginBottom: '15px'
  },
  statusSuccess: {
    color: '#00ff00',
    fontWeight: 'bold',
    margin: 0,
    textAlign: 'center'
  },
  statusWarning: {
    color: '#ffa500',
    margin: 0,
    textAlign: 'center'
  },
  error: {
    color: '#ff0000',
    margin: 0,
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#fee',
    borderRadius: '8px',
    fontWeight: 'bold'
  },
  success: {
    color: '#00aa00',
    margin: 0,
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#efe',
    borderRadius: '8px',
    fontWeight: 'bold'
  },
  confirmationBox: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #ffc107',
    marginBottom: '20px'
  },
  confirmTitle: {
    margin: '0 0 10px 0',
    color: '#856404',
    fontSize: '20px'
  },
  confirmText: {
    margin: '0 0 20px 0',
    color: '#856404',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px'
  },
  confirmBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    transition: 'all 0.3s',
    marginBottom: '20px'
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #dee2e6',
    marginBottom: '15px'
  },
  instructionTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  instructionList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '2'
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '10px',
    border: '2px solid #ffc107',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start'
  },
  warningText: {
    margin: 0,
    fontSize: '13px',
    color: '#856404',
    lineHeight: '1.6'
  }
};

// Add animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-update-face]')) {
  styleSheet.setAttribute('data-update-face', 'true');
  document.head.appendChild(styleSheet);
}

export default UpdateFaceData;
