/* eslint-disable no-unused-vars */
'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js/dist/face-api.min.js';
import faceDetectionService from '../utils/faceDetection';

function FaceCapture({ onCapture, buttonText = "Capture Face" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startVideo();
    return () => {
      stopVideo();
    };
  }, []);

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
      }, 500);

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

    // Draw face box - BLUE COLOR
    const box = resizedDetection.detection.box;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw landmarks - BLUE COLOR
    const landmarks = resizedDetection.landmarks;
    const drawOptions = {
      lineWidth: 2,
      color: '#00d4ff'
    };
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetection, drawOptions);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;

    try {
      setError('');
      const detection = await faceDetectionService.detectFace(videoRef.current);

      if (!detection) {
        setError('No face detected. Please position your face in the frame.');
        return;
      }

      const validation = faceDetectionService.validateFaceDetection(detection);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      onCapture(descriptor);

    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture face. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
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
            <p style={styles.loadingText}>Loading camera and AI models...</p>
          </div>
        )}
      </div>

      <div style={styles.statusContainer}>
        {faceDetected && (
          <p style={styles.statusSuccess}>✓ Face detected</p>
        )}
        {!faceDetected && !isLoading && (
          <p style={styles.statusWarning}>Position your face in the frame</p>
        )}
        {error && <p style={styles.error}>{error}</p>}
      </div>

      <button
        onClick={handleCapture}
        disabled={!faceDetected || isLoading}
        style={{
          ...styles.button,
          opacity: !faceDetected || isLoading ? 0.5 : 1,
          cursor: !faceDetected || isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    background: '#050816',
    minHeight: '100vh'
  },
  videoContainer: {
    position: 'relative',
    width: '640px',
    maxWidth: '100%',
    height: '480px',
    backgroundColor: '#000',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '2px solid rgba(0, 212, 255, 0.4)',
    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.3)',
    animation: 'glowPulse 3s ease-in-out infinite'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00d4ff',
    fontSize: '16px',
    fontWeight: '600'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(0, 212, 255, 0.2)',
    borderTop: '4px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px'
  },
  loadingText: {
    margin: 0,
    color: '#00d4ff'
  },
  statusContainer: {
    minHeight: '30px',
    textAlign: 'center'
  },
  statusSuccess: {
    color: '#00d4ff',
    fontWeight: '700',
    margin: 0,
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  statusWarning: {
    color: '#fbbf24',
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  error: {
    color: '#ef4444',
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px'
  },
  button: {
    padding: '14px 40px',
    fontSize: '16px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }
};

// Add spinner animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 20px 60px rgba(0, 212, 255, 0.3); }
    50% { box-shadow: 0 20px 80px rgba(0, 212, 255, 0.5); }
  }
`;
if (!document.head.querySelector('style[data-face-capture]')) {
  styleSheet.setAttribute('data-face-capture', 'true');
  document.head.appendChild(styleSheet);
}

export default FaceCapture;