'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../config';

// Custom hook for responsive breakpoints
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    media.addEventListener("change", handler);
    setMatches(media.matches);
    return () => media.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function ChangePassword() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 480px)");

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const password = formData.newPassword;
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = '', color = '';
    if (score <= 2) { label = 'Weak'; color = '#dc3545'; }
    else if (score <= 4) { label = 'Medium'; color = '#fbbf24'; }
    else { label = 'Strong'; color = '#00d4ff'; }

    setPasswordStrength({ score, label, color });
  }, [formData.newPassword]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const validatePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    if (!currentPassword || !newPassword || !confirmPassword) { setError('✗ All fields are required'); return false; }
    if (newPassword.length < 8) { setError('✗ New password must be at least 8 characters long'); return false; }
    if (newPassword === currentPassword) { setError('✗ New password must be different from current password'); return false; }
    if (newPassword !== confirmPassword) { setError('✗ New password and confirm password do not match'); return false; }
    if (passwordStrength.score < 3) { setError('✗ Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('❌ You are not authenticated. Please login again.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await axios.put(
        `${config.API_URL}/api/auth/change-password`,
        { currentPassword: formData.currentPassword, newPassword: formData.newPassword },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSuccess('✓ Password changed successfully! Logging out...');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          sessionStorage.clear();
          navigate('/login');
        }, 2000);
      } else {
        setError('❌ ' + (response.data.message || 'Failed to change password'));
        setLoading(false);
      }
    } catch (err) {
      let errorMsg = 'Failed to change password. Please try again.';
      if (err.response?.status === 401) errorMsg = 'Session expired. Please login again.';
      else if (err.response?.data?.message) errorMsg = err.response.data.message;
      else if (err.message) errorMsg = err.message;
      setError('❌ ' + errorMsg);
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/dashboard');

  return (
    <div style={{
      minHeight: '100vh', background: '#050816', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '16px' : '20px', position: 'relative'
    }}>
      {/* Background Orb */}
      <div style={{
        position: 'fixed', width: '400px', height: '400px', top: '-10%', right: '-5%',
        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.15), transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none'
      }}></div>

      {/* Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))',
        border: '1px solid rgba(0, 212, 255, 0.2)', borderRadius: '20px',
        padding: isMobile ? '24px 18px' : '50px',
        maxWidth: '600px', width: '100%',
        boxShadow: '0 20px 60px rgba(0, 212, 255, 0.2)',
        backdropFilter: 'blur(20px)', position: 'relative', zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'
        }}>
          <button onClick={handleCancel} style={{
            padding: isMobile ? '8px 14px' : '10px 20px',
            background: 'rgba(0, 212, 255, 0.15)', border: '1px solid rgba(0, 212, 255, 0.3)',
            color: '#00d4ff', borderRadius: '8px', cursor: 'pointer',
            fontSize: isMobile ? '12px' : '13px', fontWeight: '600', transition: 'all 0.3s ease'
          }}>
            ← Back
          </button>
          <h1 style={{
            fontSize: isMobile ? '20px' : '28px', margin: 0, color: '#fff',
            textAlign: 'center', flex: 1, fontWeight: '800'
          }}>🔒 Change Password</h1>
          <div style={{ width: isMobile ? '52px' : '80px' }}></div>
        </div>

        <p style={{
          textAlign: 'center', color: '#b0b0c9', fontSize: isMobile ? '12px' : '13px', marginBottom: '24px'
        }}>
          Update your password to keep your account secure
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
          {/* Current Password */}
          <PasswordField
            label="Current Password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter current password"
            show={showPasswords.current}
            onToggle={() => togglePasswordVisibility('current')}
            disabled={loading}
            isMobile={isMobile}
          />

          {/* New Password */}
          <div>
            <PasswordField
              label="New Password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder={isMobile ? "Min 8 characters" : "Enter new password (min 8 characters)"}
              show={showPasswords.new}
              onToggle={() => togglePasswordVisibility('new')}
              disabled={loading}
              isMobile={isMobile}
            />
            {formData.newPassword && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', transition: 'all 0.3s ease', borderRadius: '3px',
                    width: `${(passwordStrength.score / 6) * 100}%`,
                    backgroundColor: passwordStrength.color
                  }}></div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '58px', textTransform: 'uppercase', letterSpacing: '0.5px', color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              show={showPasswords.confirm}
              onToggle={() => togglePasswordVisibility('confirm')}
              disabled={loading}
              isMobile={isMobile}
            />
            {formData.confirmPassword && (
              <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '6px', color: formData.newPassword === formData.confirmPassword ? '#00d4ff' : '#dc3545' }}>
                {formData.newPassword === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              padding: '11px 14px', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px',
              color: '#ef4444', fontWeight: '600', textAlign: 'center', fontSize: '13px'
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              padding: '11px 14px', background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '8px',
              color: '#00d4ff', fontWeight: '600', textAlign: 'center', fontSize: '13px'
            }}>{success}</div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', marginTop: '4px' }}>
            <button
              type="submit" disabled={loading}
              style={{
                flex: 1, padding: isMobile ? '12px' : '14px',
                background: 'linear-gradient(135deg, #00d4ff, #6366f1)', color: '#000',
                border: 'none', borderRadius: '10px', fontSize: isMobile ? '13px' : '14px',
                fontWeight: '700', transition: 'all 0.3s ease', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)', opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '⏳ Changing...' : '✓ Change Password'}
            </button>
            <button
              type="button" onClick={handleCancel} disabled={loading}
              style={{
                flex: 1, padding: isMobile ? '12px' : '14px',
                background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px',
                fontSize: isMobile ? '13px' : '14px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </form>

        {/* Requirements Box */}
        <div style={{
          marginTop: '22px', padding: isMobile ? '16px' : '20px',
          background: 'rgba(0, 212, 255, 0.08)', borderRadius: '12px',
          border: '1px solid rgba(0, 212, 255, 0.2)'
        }}>
          <h3 style={{
            margin: '0 0 12px 0', fontSize: isMobile ? '12px' : '14px',
            color: '#b0b0c9', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px'
          }}>📋 Password Requirements:</h3>
          <ul style={{ margin: 0, padding: 0, fontSize: isMobile ? '12px' : '13px', lineHeight: '2', listStyle: 'none', color: '#b0b0c9' }}>
            {[
              { met: formData.newPassword.length >= 8, text: 'At least 8 characters long' },
              { met: /[a-z]/.test(formData.newPassword), text: 'Contains lowercase letter' },
              { met: /[A-Z]/.test(formData.newPassword), text: 'Contains uppercase letter' },
              { met: /[0-9]/.test(formData.newPassword), text: 'Contains number' },
              { met: /[^A-Za-z0-9]/.test(formData.newPassword), text: 'Contains special character (!@#$%^&*)' },
            ].map((req, i) => (
              <li key={i} style={{ color: req.met ? '#00d4ff' : '#6c757d', fontWeight: req.met ? 'bold' : 'normal', transition: 'all 0.3s' }}>
                <span>{req.met ? '✓' : '○'}</span> {req.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '16px', padding: isMobile ? '12px' : '15px',
          background: 'rgba(0, 212, 255, 0.1)', borderRadius: '10px',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          fontSize: isMobile ? '12px' : '13px', color: '#b0b0c9'
        }}>
          <span style={{ fontSize: isMobile ? '18px' : '24px' }}>🔐</span>
          <div>
            <strong>Security Notice:</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: isMobile ? '11px' : '13px' }}>
              After changing your password, you'll be logged out and need to login again with your new password. Make sure you remember it!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable Password Field ──────────────────────────────────
function PasswordField({ label, name, value, onChange, placeholder, show, onToggle, disabled, isMobile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '12px', fontWeight: '700', color: '#b0b0c9',
        textTransform: 'uppercase', letterSpacing: '1px'
      }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%', padding: '11px 42px 11px 14px',
            border: '1px solid rgba(0, 212, 255, 0.2)', borderRadius: '10px',
            fontSize: isMobile ? '13px' : '14px', outline: 'none',
            background: 'rgba(0, 212, 255, 0.05)', color: '#fff',
            transition: 'all 0.3s ease', boxSizing: 'border-box', fontFamily: 'inherit'
          }}
        />
        <button
          type="button" onClick={onToggle}
          style={{
            position: 'absolute', right: '12px', background: 'none', border: 'none',
            fontSize: '16px', cursor: 'pointer', padding: '4px', color: '#00d4ff'
          }}
        >
          {show ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </div>
  );
}

export default ChangePassword;