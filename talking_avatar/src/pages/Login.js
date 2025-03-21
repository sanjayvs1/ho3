import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      const token = localStorage.getItem('authToken');
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      
      if (token && sessionExpiry && new Date(sessionExpiry) > new Date()) {
        // Valid session exists, redirect to home
        navigate('/');
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Generate token
      const token = btoa(userCredential.user.uid + ':' + Date.now());
      
      // Set session expiry (14 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      
      // Store user data in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userId', userCredential.user.uid);
      localStorage.setItem('sessionExpiry', expiryDate.toISOString());
      
      navigate('/'); // Redirect to home after login
    } catch (err) {
      // Simplify error messages for better readability
      if (err.code === 'auth/invalid-credential') {
        setError('The email or password is incorrect. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('There was a problem signing in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-blue-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2" id="login-heading">
            Welcome Back
          </h1>
          <p className="text-blue-600 text-lg">Companion Care Services</p>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 border-l-4 border-red-400" role="alert">
            <p className="text-red-700 text-base">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-describedby="email-error"
              className="w-full px-4 py-3 text-lg border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="yourname@example.com"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <label htmlFor="password" className="block text-lg font-medium text-gray-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:underline text-base">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              aria-describedby="password-error"
              className="w-full px-4 py-3 text-lg border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-base text-gray-700">
              Keep me signed in
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 text-lg rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-lg text-gray-700">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;