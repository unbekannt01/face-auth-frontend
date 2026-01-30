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
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.newPassword;
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    let label = '';
    let color = '';

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Determine strength
    if (score <= 2) {
      label = 'Weak';
      color = '#dc3545';
    } else if (score <= 4) {
      label = 'Medium';
      color = '#ffc107';
    } else {
      label = 'Strong';
      color = '#28a745';
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
      setError('⚠️ All fields are required');
      return false;
    }

    if (newPassword.length < 8) {
      setError('⚠️ New password must be at least 8 characters long');
      return false;
    }

    if (newPassword === currentPassword) {
      setError('⚠️ New password must be different from current password');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('⚠️ New password and confirm password do not match');
      return false;
    }

    // Check password strength
    if (passwordStrength.score < 3) {
      setError('⚠️ Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols');
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

      console.log('[ChangePassword] Sending request to change password...');

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

      console.log('[ChangePassword] Response:', response.data);

      if (response.data.success) {
        setSuccess('✅ Password changed successfully! Logging out...');
        
        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Logout after 2 seconds
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
      console.error('[ChangePassword] Error:', err);
      
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
      <div style={styles.card}>
        {/* Header */}
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

        {/* Form */}
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
            
            {/* Password Strength Meter */}
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
            
            {/* Match Indicator */}
            {formData.confirmPassword && (
              <div style={styles.matchIndicator}>
                {formData.newPassword === formData.confirmPassword ? (
                  <span style={{ color: '#28a745' }}>✓ Passwords match</span>
                ) : (
                  <span style={{ color: '#dc3545' }}>✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
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

          {/* Buttons */}
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
              {loading ? '⏳ Changing...' : '✅ Change Password'}
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

        {/* Password Requirements */}
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

        {/* Security Notice */}
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

// Helper function for requirement styling
const getRequirementStyle = (met) => ({
  color: met ? '#28a745' : '#6c757d',
  fontWeight: met ? 'bold' : 'normal',
  transition: 'all 0.3s'
});

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  title: {
    fontSize: '28px',
    margin: 0,
    color: '#333',
    textAlign: 'center',
    flex: 1
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
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
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '12px 45px 12px 15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border 0.3s',
    boxSizing: 'border-box'
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px'
  },
  strengthContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '5px'
  },
  strengthBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  strengthFill: {
    height: '100%',
    transition: 'all 0.3s'
  },
  strengthLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    minWidth: '60px'
  },
  matchIndicator: {
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '5px'
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '2px solid #fcc',
    borderRadius: '8px',
    color: '#c00',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  successBox: {
    padding: '12px',
    backgroundColor: '#efe',
    border: '2px solid #cfc',
    borderRadius: '8px',
    color: '#0a0',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  submitBtn: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  cancelBtn: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  requirementsBox: {
    marginTop: '25px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #dee2e6'
  },
  requirementsTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#333'
  },
  requirementsList: {
    margin: 0,
    paddingLeft: '25px',
    fontSize: '14px',
    lineHeight: '2',
    listStyle: 'none'
  },
  securityNotice: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '10px',
    border: '2px solid #ffc107',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
    fontSize: '14px',
    color: '#856404'
  }
};

export default ChangePassword;
