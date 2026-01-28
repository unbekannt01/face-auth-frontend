/* eslint-disable react-hooks/exhaustive-deps */
// frontend/src/components/MobileScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

function MobileScanner() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('Position QR code in camera');
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
        setCameraActive(true);
        setStatus('📷 Camera ready! Scan QR code');
        requestAnimationFrame(scanQRCode);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setStatus('❌ Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const scanQRCode = () => {
    if (!scanning && videoRef.current && canvasRef.current && cameraActive) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          setScanning(true);
          setStatus('✅ QR Code detected! Redirecting...');
          handleQRData(code.data);
          return;
        }
      }
      
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRData = (qrDataString) => {
    try {
      const qrData = JSON.parse(qrDataString);
      
      // Validate QR data
      if (!qrData.sessionId || !qrData.type || !qrData.url) {
        setStatus('❌ Invalid QR code');
        setTimeout(() => {
          setScanning(false);
          setStatus('Position QR code in camera');
        }, 2000);
        return;
      }

      // Stop camera
      stopCamera();

      // Redirect to mobile verification page with data
      const params = new URLSearchParams({
        data: encodeURIComponent(JSON.stringify(qrData))
      });
      
      window.location.href = `/mobile-verify?${params.toString()}`;
      
    } catch (error) {
      console.error('QR Parse error:', error);
      setStatus('❌ Invalid QR code format');
      setTimeout(() => {
        setScanning(false);
        setStatus('Position QR code in camera');
      }, 2000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h2 style={{ marginBottom: '20px' }}>📱 QR Code Scanner</h2>
      
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
        
        {/* QR Scanner overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '250px',
          height: '250px',
          border: '3px solid #4CAF50',
          borderRadius: '15px',
          pointerEvents: 'none'
        }}>
          {/* Corner markers */}
          <div style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            width: '30px',
            height: '30px',
            borderTop: '6px solid #4CAF50',
            borderLeft: '6px solid #4CAF50',
            borderRadius: '5px 0 0 0'
          }} />
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '30px',
            height: '30px',
            borderTop: '6px solid #4CAF50',
            borderRight: '6px solid #4CAF50',
            borderRadius: '0 5px 0 0'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-3px',
            left: '-3px',
            width: '30px',
            height: '30px',
            borderBottom: '6px solid #4CAF50',
            borderLeft: '6px solid #4CAF50',
            borderRadius: '0 0 0 5px'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-3px',
            right: '-3px',
            width: '30px',
            height: '30px',
            borderBottom: '6px solid #4CAF50',
            borderRight: '6px solid #4CAF50',
            borderRadius: '0 0 5px 0'
          }} />
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <p style={{
        marginTop: '30px',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '15px',
        backgroundColor: scanning ? '#4CAF50' : '#333',
        borderRadius: '10px',
        minWidth: '300px'
      }}>
        {status}
      </p>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#2a2a2a',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '400px'
      }}>
        <p style={{ fontSize: '14px', color: '#aaa' }}>
          💡 <strong>Instructions:</strong>
        </p>
        <ul style={{ 
          textAlign: 'left', 
          fontSize: '13px', 
          color: '#ccc',
          marginTop: '10px' 
        }}>
          <li>Allow camera access when prompted</li>
          <li>Point camera at the QR code on screen</li>
          <li>Hold steady for 2-3 seconds</li>
          <li>Auto-redirect when detected</li>
        </ul>
      </div>
    </div>
  );
}

export default MobileScanner;