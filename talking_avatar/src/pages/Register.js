import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();

  const checkPasswordStrength = (value) => {
    if (!value) {
      setPasswordStrength('');
      return;
    }
    
    if (value.length < 6) {
      setPasswordStrength('weak');
    } else if (value.length >= 10 && /[A-Z]/.test(value) && /[0-9]/.test(value)) {
      setPasswordStrength('strong');
    } else {
      setPasswordStrength('medium');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    checkPasswordStrength(value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (password !== confirmPassword) {
      setError('The passwords do not match. Please try again.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
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
      
      navigate('/'); // Redirect to home after registration
    } catch (err) {
      // Simplify error messages
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use another email or sign in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('There was a problem creating your account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-blue-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2" id="register-heading">
            Create Account
          </h1>
          <p className="text-blue-600 text-lg">Join Our Companion Care Community</p>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 border-l-4 border-red-400" role="alert">
            <p className="text-red-700 text-base">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-6">
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
              className="w-full px-4 py-3 text-lg border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="yourname@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
              aria-required="true"
              className="w-full px-4 py-3 text-lg border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="••••••••"
            />
            {passwordStrength && (
              <div className="mt-2">
                <span className="text-sm mr-2">Password strength:</span>
                <span 
                  className={`text-sm font-medium ${
                    passwordStrength === 'weak' ? 'text-red-600' : 
                    passwordStrength === 'medium' ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}
                >
                  {passwordStrength === 'weak' ? 'Weak' : 
                   passwordStrength === 'medium' ? 'Medium' : 
                   'Strong'}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Use at least 6 characters. Adding numbers and capital letters makes it stronger.
            </p>
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-lg font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-3 text-lg border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 text-lg rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-lg text-gray-700">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;