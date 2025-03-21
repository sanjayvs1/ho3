import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import GuardianOnboarding from './pages/GuardianOnboarding';
import Market from './pages/Market';
import Community from './pages/Community';
import Exercise from './pages/Exercise';
// import Avatar from './pages/Avatar';

function Router() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    const isPublicPage = location.pathname === '/login' || location.pathname === '/register';

    // Check if token exists and is not expired
    const isValidSession = authToken && sessionExpiry && new Date(sessionExpiry) > new Date();

    if (!isValidSession && !isPublicPage) {
      // Only redirect to login if we're not already there
      if (location.pathname !== '/login') {
        navigate('/login');
      }
    } else if (isValidSession && isPublicPage) {
      // If user is authenticated and tries to access login/register, redirect to home
      navigate('/');
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/guardian-onboarding" element={<GuardianOnboarding />} />
      <Route path="/market" element={<Market />} />
      <Route path="/community" element={<Community />} />
      <Route path="/exercise" element={<Exercise />} />
      {/* <Route path="/avatar" element={<Avatar />} /> */}
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}