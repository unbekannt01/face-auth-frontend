import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // Try authToken first (preferred), then fall back to token
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token added to request');
    } else {
      console.log('[API] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('[API] 401 Unauthorized - clearing auth');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  initiateLogin: (email) => api.post('/auth/login/initiate', { email }),
  verifyFace: (sessionId, faceDescriptor) => 
    api.post('/auth/login/verify-face', { sessionId, faceDescriptor }),
  completeLogin: (sessionId) => 
    api.post('/auth/login/complete', { sessionId }),
  checkSession: (sessionId) => 
    api.get(`/auth/session/${sessionId}`),
  getMe: () => api.get('/auth/me')
};

export default api;
