/* eslint-disable import/no-anonymous-default-export */
import * as faceapi from 'face-api.js/dist/face-api.min.js';

class FaceDetectionService {
  constructor() {
    this.isModelsLoaded = false;
  }

  // Load face-api.js models from CDN
  async loadModels() {
    if (this.isModelsLoaded) return;

    // FIXED: Use CDN instead of local path
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    
    try {
      console.log('Loading models from CDN:', MODEL_URL);
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
      ]);
      
      this.isModelsLoaded = true;
      console.log('✅ Face detection models loaded');
    } catch (error) {
      console.error('❌ Error loading models:', error);
      throw error;
    }
  }

  // Detect face and get descriptor
  async detectFace(videoElement) {
    if (!this.isModelsLoaded) {
      await this.loadModels();
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection;
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  // Get face descriptor from image
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

  // Validate face quality
  validateFaceDetection(detection) {
    if (!detection) {
      return { valid: false, message: 'No face detected' };
    }

    const box = detection.detection.box;
    const minSize = 100;

    if (box.width < minSize || box.height < minSize) {
      return { 
        valid: false, 
        message: 'Face too small. Please move closer to the camera' 
      };
    }

    return { valid: true, message: 'Face detected successfully' };
  }
}

export default new FaceDetectionService();