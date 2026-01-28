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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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