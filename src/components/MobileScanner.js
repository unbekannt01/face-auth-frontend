'use client';

/* eslint-disable react-hooks/exhaustive-deps */
// frontend/src/components/MobileScanner.jsx

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

function MobileScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState('Position QR code in camera');

  const handleClose = () => {
    stopCamera();
    window.history.back();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
          setStatus('Camera ready. Scan QR code');
          requestAnimationFrame(scanQRCode);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('Camera access denied. Please allow permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const scanQRCode = () => {
    if (!cameraActive || scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        setScanning(true);
        setStatus('QR detected. Redirecting...');
        handleQRData(code.data);
        return;
      }
    }

    requestAnimationFrame(scanQRCode);
  };

  const handleQRData = (qrDataString) => {
    try {
      const qrData = JSON.parse(qrDataString);

      if (!qrData.sessionId || !qrData.type || !qrData.url) {
        throw new Error('Invalid QR payload');
      }

      stopCamera();

      window.location.href = `/mobile-verify/${qrData.sessionId}`;

    } catch (err) {
      console.error('QR parse error:', err);
      setStatus('Invalid QR Code');

      setTimeout(() => {
        setScanning(false);
        setStatus('Position QR code in camera');
      }, 2000);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.heading}>QR Code Scanner</h2>
        <button onClick={handleClose} style={styles.closeBtn}>×</button>
      </div>

      <div style={styles.cameraBox}>
        <video ref={videoRef} style={styles.video} />
        <div style={styles.scanBox}></div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <p style={{
        ...styles.status,
        backgroundColor: scanning ? '#00d4ff' : 'rgba(0, 212, 255, 0.15)',
        color: scanning ? '#000' : '#00d4ff'
      }}>
        {status}
      </p>

      <div style={styles.helpBox}>
        <strong style={{color: '#00d4ff'}}>Instructions:</strong>
        <ul style={styles.instructionList}>
          <li>Allow camera access</li>
          <li>Point camera at QR code</li>
          <li>Hold steady</li>
          <li>Auto redirect on scan</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#050816',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative'
  },
  header: {
    display: 'flex',
    width: '100%',
    maxWidth: '500px',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '25px'
  },
  heading: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  closeBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid rgba(0, 212, 255, 0.5)',
    background: 'rgba(0, 212, 255, 0.1)',
    color: '#00d4ff',
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: 'bold'
  },
  cameraBox: {
    width: '100%',
    maxWidth: '500px',
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.3)',
    border: '2px solid rgba(0, 212, 255, 0.3)',
    animation: 'glowPulse 3s ease-in-out infinite'
  },
  video: { 
    width: '100%',
    display: 'block'
  },
  scanBox: {
    position: 'absolute',
    inset: '40px',
    border: '3px solid #00d4ff',
    borderRadius: '12px',
    pointerEvents: 'none',
    boxShadow: 'inset 0 0 20px rgba(0, 212, 255, 0.4)'
  },
  status: {
    marginTop: '25px',
    padding: '14px 20px',
    borderRadius: '10px',
    minWidth: '280px',
    textAlign: 'center',
    fontWeight: '700',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.3s ease'
  },
  helpBox: {
    marginTop: '20px',
    padding: '20px',
    background: 'rgba(0, 212, 255, 0.08)',
    borderRadius: '12px',
    maxWidth: '400px',
    fontSize: '13px',
    color: '#b0b0c9',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    fontWeight: '500'
  },
  instructionList: {
    margin: '10px 0 0 0',
    paddingLeft: '20px',
    lineHeight: '2'
  }
};

export default MobileScanner;