import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RouteLoader from './components/RouteLoader';
import AppLoader from './components/AppLoader';

import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MobileVerify from './components/MobileVerify';
import VerificationSuccess from './components/VerificationSuccess';
import UpdateFaceData from './components/UpdateFaceData';
import ChangePassword from './components/ChangePassword';

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (initialLoading) return <AppLoader />;

  return (
    <Router>
      <RouteLoader>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mobile-verify/:sessionId" element={<MobileVerify />} />
          <Route path="/verification-success" element={<VerificationSuccess />} />
          <Route path="/update-face" element={<UpdateFaceData />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Routes>
      </RouteLoader>
    </Router>
  );
}

export default App;