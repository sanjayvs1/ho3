import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import GuardianOnboarding from './pages/GuardianOnboarding';
import Market from './pages/Market';
// import Avatar from './pages/Avatar';

function Router() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const isPublicPage = location.pathname === '/login' || location.pathname === '/register';

    if (!authToken && !isPublicPage) {
      navigate('/login');
    }
  }, [location.pathname, navigate]); // Run on every navigation change

  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/guardian-onboarding" element={<GuardianOnboarding />} />
      <Route path="/market" element={<Market />} />
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