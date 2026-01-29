/* eslint-disable import/no-anonymous-default-export */
// src/utils/faceDetection.js
// OPTIMIZED VERSION - Fast and reliable face detection

import * as faceapi from 'face-api.js/dist/face-api.min.js';

class FaceDetectionService {
  constructor() {
    this.isModelsLoaded = false;
    this.modelLoadPromise = null;
  }

  // Load face-api.js models from CDN
  async loadModels() {
    // Prevent multiple simultaneous loads
    if (this.modelLoadPromise) {
      return this.modelLoadPromise;
    }

    if (this.isModelsLoaded) {
      return Promise.resolve();
    }

    this.modelLoadPromise = (async () => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      try {
        console.log(' Loading face detection models...');
        
        // Load all models in parallel for faster loading
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        this.isModelsLoaded = true;
        console.log(' Face detection models loaded successfully');
        
      } catch (error) {
        console.error(' Error loading face detection models:', error);
        this.modelLoadPromise = null; // Reset so it can be retried
        throw error;
      }
    })();

    return this.modelLoadPromise;
  }

  // Fast face detection with descriptor
  async detectFace(videoElement, options = {}) {
    if (!this.isModelsLoaded) {
      await this.loadModels();
    }

    const {
      minConfidence = 0.5,
      withLandmarks = true,
      withDescriptor = true
    } = options;

    try {
      let detection = faceapi.detectSingleFace(
        videoElement, 
        new faceapi.SsdMobilenetv1Options({ minConfidence })
      );

      if (withLandmarks) {
        detection = detection.withFaceLandmarks();
      }

      if (withDescriptor) {
        detection = detection.withFaceDescriptor();
      }

      const result = await detection;
      return result;
      
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  // Detect multiple faces (if needed)
  async detectAllFaces(videoElement, options = {}) {
    if (!this.isModelsLoaded) {
      await this.loadModels();
    }

    const { minConfidence = 0.5 } = options;

    try {
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections;
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  // Get face descriptor from image (for registration)
  async getFaceDescriptor(imageElement) {
    if (!this.isModelsLoaded) {
      await this.loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return null;
      }

      return Array.from(detection.descriptor);
    } catch (error) {
      console.error('Error getting face descriptor:', error);
      return null;
    }
  }

  // Validate face detection quality
  validateFaceDetection(detection, options = {}) {
    if (!detection) {
      return { 
        valid: false, 
        message: 'No face detected. Please position your face in the frame.' 
      };
    }

    const {
      minSize = 80,
      minScore = 0.5
    } = options;

    const box = detection.detection.box;
    const score = detection.detection.score;

    // Check detection confidence
    if (score < minScore) {
      return { 
        valid: false, 
        message: 'Face detection confidence too low. Please ensure good lighting.' 
      };
    }

    // Check face size
    if (box.width < minSize || box.height < minSize) {
      return { 
        valid: false, 
        message: 'Face too small. Please move closer to the camera.' 
      };
    }

    // Check if face is too large (too close)
    const maxSize = 500;
    if (box.width > maxSize || box.height > maxSize) {
      return { 
        valid: false, 
        message: 'Face too large. Please move back a bit.' 
      };
    }

    // Check if face is roughly centered (optional)
    const videoWidth = detection.detection.imageWidth;
    const videoHeight = detection.detection.imageHeight;
    
    if (videoWidth && videoHeight) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const videoCenterX = videoWidth / 2;
      const videoCenterY = videoHeight / 2;
      
      const offsetX = Math.abs(centerX - videoCenterX);
      const offsetY = Math.abs(centerY - videoCenterY);
      
      // Allow 40% offset from center
      if (offsetX > videoWidth * 0.4 || offsetY > videoHeight * 0.4) {
        return { 
          valid: false, 
          message: 'Please center your face in the frame.' 
        };
      }
    }

    return { 
      valid: true, 
      message: 'Face detected successfully!',
      confidence: score,
      size: { width: box.width, height: box.height }
    };
  }

  // Draw face detection box and landmarks
  drawDetection(canvas, detection, options = {}) {
    if (!canvas || !detection) return;

    const {
      boxColor = '#00ff00',
      landmarkColor = '#00ff00',
      lineWidth = 3,
      showLandmarks = true,
      showCorners = true
    } = options;

    const ctx = canvas.getContext('2d');
    const box = detection.detection.box;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw main box
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw corner brackets
    if (showCorners) {
      const cornerLength = Math.min(box.width, box.height) * 0.2;
      ctx.lineWidth = lineWidth + 2;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + cornerLength);
      ctx.lineTo(box.x, box.y);
      ctx.lineTo(box.x + cornerLength, box.y);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLength, box.y);
      ctx.lineTo(box.x + box.width, box.y);
      ctx.lineTo(box.x + box.width, box.y + cornerLength);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(box.x, box.y + box.height - cornerLength);
      ctx.lineTo(box.x, box.y + box.height);
      ctx.lineTo(box.x + cornerLength, box.y + box.height);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height);
      ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
      ctx.stroke();
    }

    // Draw landmarks
    if (showLandmarks && detection.landmarks) {
      ctx.fillStyle = landmarkColor;
      const landmarks = detection.landmarks.positions;
      
      landmarks.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw confidence score
    ctx.fillStyle = boxColor;
    ctx.font = 'bold 16px Arial';
    const confidence = Math.round(detection.detection.score * 100);
    ctx.fillText(`${confidence}%`, box.x, box.y - 10);
  }

  // Compare two face descriptors
  compareFaces(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2) {
      return { distance: Infinity, match: false };
    }

    if (descriptor1.length !== descriptor2.length) {
      return { distance: Infinity, match: false };
    }

    // Calculate Euclidean distance
    const distance = Math.sqrt(
      descriptor1.reduce((sum, val, i) => 
        sum + Math.pow(val - descriptor2[i], 2), 0
      )
    );

    // Typical threshold is 0.6
    const threshold = 0.6;
    const match = distance < threshold;

    return {
      distance,
      match,
      confidence: Math.max(0, (1 - distance / threshold) * 100)
    };
  }
}

// Export singleton instance
export default new FaceDetectionService();