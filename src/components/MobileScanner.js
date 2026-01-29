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
        backgroundColor: scanning ? '#4caf50' : '#333'
      }}>
        {status}
      </p>

      <div style={styles.helpBox}>
        <strong>Instructions:</strong>
        <ul>
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
    background: '#111',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  header: {
    display: 'flex',
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  heading: { margin: 0 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #fff',
    background: 'transparent',
    color: '#fff',
    fontSize: 24,
    cursor: 'pointer'
  },
  cameraBox: {
    width: '100%',
    maxWidth: 500,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 0 15px rgba(0,0,0,0.6)'
  },
  video: { width: '100%' },
  scanBox: {
    position: 'absolute',
    inset: 40,
    border: '3px solid #4caf50',
    borderRadius: 12,
    pointerEvents: 'none'
  },
  status: {
    marginTop: 25,
    padding: 12,
    borderRadius: 8,
    minWidth: 280,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  helpBox: {
    marginTop: 15,
    padding: 12,
    background: '#222',
    borderRadius: 8,
    maxWidth: 400,
    fontSize: 13
  }
};

export default MobileScanner;
