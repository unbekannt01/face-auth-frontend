// frontend/src/index.js
// PRODUCTION-READY: Security-enabled entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// IMPORT SECURITY MODULE (CRITICAL!)
import { initSecurity } from './utils/security';

/* ================================
   INITIALIZE SECURITY FIRST
   This MUST run before React renders!
================================ */

// Initialize all security features:
// - Disable console in production
// - Enable DevTools detection
// - Block keyboard shortcuts (F12, Ctrl+Shift+I, etc.)
// - Start anti-debugging measures
// - Set up function integrity checking
initSecurity();

// Log security status (will be hidden in production)
if (process.env.NODE_ENV === 'production') {
  // Console is disabled, so this won't show
} else {
  console.log('🔒 Security initialized in DEV mode');
  console.log('ℹ️ In production, console will be completely disabled');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance monitoring (optional)
reportWebVitals();