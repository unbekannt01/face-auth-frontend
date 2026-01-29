// frontend/src/components/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../config';
import AppLoader from './AppLoader';

const API_URL = config.API_URL;

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      navigate('/login');
      return;
    }

    // Verify token and get user data
    axios.get(`${API_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      setUserData(response.data.user);
      setLoading(false);
    })
    .catch(error => {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      navigate('/login');
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  if (loading) return <AppLoader />;


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ color: '#333', marginBottom: '30px' }}>
           Welcome to Dashboard!
        </h1>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#667eea', marginBottom: '15px' }}>
            👤 User Information
          </h3>
          <p><strong>Email:</strong> {userData?.email}</p>
          <p><strong>Registered:</strong> {new Date(userData?.registeredAt).toLocaleDateString()}</p>
          <p><strong>Last Login:</strong> {new Date(userData?.lastLogin).toLocaleString()}</p>
          <p style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            color: '#2e7d32'
          }}>
             <strong>Face Authentication Enabled</strong>
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px 30px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;