// frontend/src/services/api.js
// PRODUCTION-READY: Fully secured API service

import axios from 'axios';
import { config } from '../config';
import { SecureAPI, SecureStorage, NetworkObfuscator } from '../utils/security';

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 second timeout
});

/* ================================
   REQUEST INTERCEPTOR
   Adds security layers to every request
================================ */
api.interceptors.request.use(
  async (config) => {
    try {
      // ✅ GET TOKEN FROM SECURE STORAGE (encrypted)
      // Try 'authToken' first, fallback to 'token'
      const token = SecureStorage.getItem('authToken') || SecureStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // ✅ ADD SECURITY HEADERS
      // This adds HMAC signature + timestamp + fingerprint
      const secureHeaders = SecureAPI.createSecureHeaders(config.data || {});
      Object.assign(config.headers, secureHeaders);
      
      // ✅ ADD RANDOM NETWORK JITTER
      // Makes timing attacks harder
      await NetworkObfuscator.addJitter(50, 200);
      
      // ✅ SEND DUMMY REQUESTS (30% chance)
      // Confuses traffic analysis
      NetworkObfuscator.sendDummyRequests();
      
      // Log only in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('[API] Request:', config.method?.toUpperCase(), config.url);
      }
      
      return config;
    } catch (error) {
      console.error('[API] Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* ================================
   RESPONSE INTERCEPTOR
   Handles errors and decryption
================================ */
api.interceptors.response.use(
  (response) => {
    // ✅ DECRYPT RESPONSE if encrypted
    if (response.data?.encrypted) {
      try {
        response.data = SecureAPI.decryptPayload(response.data.payload);
      } catch (error) {
        console.error('[API] Response decryption failed');
      }
    }
    
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - clear auth and redirect
    if (error.response?.status === 401) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[API] 401 Unauthorized - clearing auth');
      }
      
      // Clear ALL auth data from SECURE storage
      SecureStorage.removeItem('authToken');
      SecureStorage.removeItem('token');
      SecureStorage.removeItem('user');
      sessionStorage.clear();
      
      // Redirect to login (only if not already there)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[API] Network error - server may be down');
      }
    }
    
    return Promise.reject(error);
  }
);

/* ================================
   API ENDPOINTS
   All use the secured API instance
================================ */
export const authAPI = {
  // Register new user
  register: (data) => api.post('/api/auth/register', data),
  
  // Login - Step 1: Validate email & password
  initiateLogin: (email, password) => 
    api.post('/api/auth/login/initiate', { email, password }),
  
  // Login - Step 2: Complete after face verification
  completeLogin: (sessionId) => 
    api.post('/api/auth/login/complete', { sessionId }),
  
  // Verify JWT token
  verify: () => api.get('/api/auth/verify'),
  
  // Get current user
  getMe: () => api.get('/api/auth/me'),
  
  // Session management
  createSession: (sessionData) => 
    api.post('/api/auth/session/create', sessionData),
  
  getSession: (sessionId) => 
    api.get(`/api/auth/session/${sessionId}`),
  
  // Face update
  initiateFaceUpdate: () => 
    api.post('/api/auth/update-face/initiate'),
  
  completeFaceUpdate: (sessionId) => 
    api.post('/api/auth/update-face/complete', { sessionId }),
  
  // Password change
  changePassword: (currentPassword, newPassword) => 
    api.put('/api/auth/change-password', { currentPassword, newPassword }),
};

/* ================================
   HELPER FUNCTIONS
================================ */

/**
 * Check if server is reachable
 * @returns {Promise<boolean>}
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${config.API_URL}/api/health`, {
      timeout: 5000
    });
    return response.data.status === 'healthy';
  } catch (error) {
    return false;
  }
};

/**
 * Retry failed requests with exponential backoff
 * @param {Function} requestFn - Function that returns a promise
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<any>}
 */
export const retryRequest = async (requestFn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      // If last retry, throw error
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[API] Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  SecureStorage.removeItem('authToken');
  SecureStorage.removeItem('token');
  SecureStorage.removeItem('user');
  sessionStorage.clear();
};

export default api;