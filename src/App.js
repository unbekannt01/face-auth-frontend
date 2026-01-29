// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MobileVerify from './components/MobileVerify';
import VerificationSuccess from './components/VerificationSuccess';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mobile-verify/:sessionId" element={<MobileVerify />} />
        <Route path="/verification-success" element={<VerificationSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;