'use client';

// src/components/ChangePassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../config';

function ChangePassword() {
  const navigate = useNavigate();
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
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const password = formData.newPassword;
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    let label = '';
    let color = '';

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      label = 'Weak';
      color = '#dc3545';
    } else if (score <= 4) {
      label = 'Medium';
      color = '#fbbf24';
    } else {
      label = 'Strong';
      color = '#00d4ff';
    }

    setPasswordStrength({ score, label, color });
  }, [formData.newPassword]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const validatePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('✗ All fields are required');
      return false;
    }

    if (newPassword.length < 8) {
      setError('✗ New password must be at least 8 characters long');
      return false;
    }

    if (newPassword === currentPassword) {
      setError('✗ New password must be different from current password');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('✗ New password and confirm password do not match');
      return false;
    }

    if (passwordStrength.score < 3) {
      setError('✗ Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

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
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('✓ Password changed successfully! Logging out...');
        
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

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
      
      if (err.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError('❌ ' + errorMsg);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.bgOrb}></div>

      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={handleCancel} style={styles.backBtn}>
            ← Back
          </button>
          <h1 style={styles.title}>🔒 Change Password</h1>
          <div style={{ width: '80px' }}></div>
        </div>

        <p style={styles.subtitle}>
          Update your password to keep your account secure
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Current Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                style={styles.input}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                style={styles.eyeBtn}
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password (min 8 characters)"
                style={styles.input}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                style={styles.eyeBtn}
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {formData.newPassword && (
              <div style={styles.strengthContainer}>
                <div style={styles.strengthBar}>
                  <div 
                    style={{
                      ...styles.strengthFill,
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  ></div>
                </div>
                <span style={{ ...styles.strengthLabel, color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                style={styles.input}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                style={styles.eyeBtn}
              >
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {formData.confirmPassword && (
              <div style={styles.matchIndicator}>
                {formData.newPassword === formData.confirmPassword ? (
                  <span style={{ color: '#00d4ff' }}>✓ Passwords match</span>
                ) : (
                  <span style={{ color: '#dc3545' }}>✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.successBox}>
              {success}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Changing...' : '✓ Change Password'}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              style={styles.cancelBtn}
            >
              ❌ Cancel
            </button>
          </div>
        </form>

        <div style={styles.requirementsBox}>
          <h3 style={styles.requirementsTitle}>📋 Password Requirements:</h3>
          <ul style={styles.requirementsList}>
            <li style={getRequirementStyle(formData.newPassword.length >= 8)}>
              <span>{formData.newPassword.length >= 8 ? '✓' : '○'}</span>
              At least 8 characters long
            </li>
            <li style={getRequirementStyle(/[a-z]/.test(formData.newPassword))}>
              <span>{/[a-z]/.test(formData.newPassword) ? '✓' : '○'}</span>
              Contains lowercase letter
            </li>
            <li style={getRequirementStyle(/[A-Z]/.test(formData.newPassword))}>
              <span>{/[A-Z]/.test(formData.newPassword) ? '✓' : '○'}</span>
              Contains uppercase letter
            </li>
            <li style={getRequirementStyle(/[0-9]/.test(formData.newPassword))}>
              <span>{/[0-9]/.test(formData.newPassword) ? '✓' : '○'}</span>
              Contains number
            </li>
            <li style={getRequirementStyle(/[^A-Za-z0-9]/.test(formData.newPassword))}>
              <span>{/[^A-Za-z0-9]/.test(formData.newPassword) ? '✓' : '○'}</span>
              Contains special character (!@#$%^&*)
            </li>
          </ul>
        </div>

        <div style={styles.securityNotice}>
          <span style={{ fontSize: '24px' }}>🔐</span>
          <div>
            <strong>Security Notice:</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
              After changing your password, you'll be logged out and need to 
              login again with your new password. Make sure you remember it!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const getRequirementStyle = (met) => ({
  color: met ? '#00d4ff' : '#6c757d',
  fontWeight: met ? 'bold' : 'normal',
  transition: 'all 0.3s'
});

const styles = {
  container: {
    minHeight: '100vh',
    background: '#050816',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative'
  },
  bgOrb: {
    position: 'fixed',
    width: '600px',
    height: '600px',
    top: '-10%',
    right: '-5%',
    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.15), transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    zIndex: 0,
    pointerEvents: 'none'
  },
  card: {
    background: 'linear-gradient(135deg, rgba(20, 24, 82, 0.8), rgba(30, 30, 70, 0.6))',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '20px',
    padding: '50px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  backBtn: {
    padding: '10px 20px',
    background: 'rgba(0, 212, 255, 0.15)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    color: '#00d4ff',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  title: {
    fontSize: '28px',
    margin: 0,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    fontWeight: '800'
  },
  subtitle: {
    textAlign: 'center',
    color: '#b0b0c9',
    fontSize: '13px',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#b0b0c9',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '12px 45px 12px 16px',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    background: 'rgba(0, 212, 255, 0.05)',
    color: '#fff',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px',
    color: '#00d4ff'
  },
  strengthContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px'
  },
  strengthBar: {
    flex: 1,
    height: '6px',
    background: 'rgba(0, 212, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  strengthFill: {
    height: '100%',
    transition: 'all 0.3s ease',
    borderRadius: '3px'
  },
  strengthLabel: {
    fontSize: '12px',
    fontWeight: '700',
    minWidth: '70px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  matchIndicator: {
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '6px',
    color: '#b0b0c9'
  },
  errorBox: {
    padding: '12px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: '13px'
  },
  successBox: {
    padding: '12px 14px',
    background: 'rgba(0, 212, 255, 0.1)',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: '8px',
    color: '#00d4ff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: '13px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  submitBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #00d4ff, #6366f1)',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)'
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  requirementsBox: {
    marginTop: '25px',
    padding: '20px',
    background: 'rgba(0, 212, 255, 0.08)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 212, 255, 0.2)'
  },
  requirementsTitle: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#b0b0c9',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  requirementsList: {
    margin: 0,
    paddingLeft: '25px',
    fontSize: '13px',
    lineHeight: '2',
    listStyle: 'none',
    color: '#b0b0c9'
  },
  securityNotice: {
    marginTop: '20px',
    padding: '15px',
    background: 'rgba(0, 212, 255, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(0, 212, 255, 0.3)',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
    fontSize: '13px',
    color: '#b0b0c9'
  }
};

export default ChangePassword;