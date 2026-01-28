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

    // Draw face box
    const box = resizedDetection.detection.box;
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw landmarks
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
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
            <p>Loading camera and AI models...</p>
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
          opacity: !faceDetected || isLoading ? 0.5 : 1
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
    padding: '20px'
  },
  videoContainer: {
    position: 'relative',
    width: '640px',
    height: '480px',
    backgroundColor: '#000',
    borderRadius: '10px',
    overflow: 'hidden'
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
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px'
  },
  statusContainer: {
    minHeight: '30px'
  },
  statusSuccess: {
    color: '#00ff00',
    fontWeight: 'bold',
    margin: 0
  },
  statusWarning: {
    color: '#ffa500',
    margin: 0
  },
  error: {
    color: '#ff0000',
    margin: 0
  },
  button: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default FaceCapture;