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

      // Instead of storing all this:
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userId', userCredential.user.uid);
      localStorage.setItem('sessionExpiry', expiryDate.toISOString());

      // Store a single user object with minimal required data
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: email,
        authToken: token,
        sessionExpiry: expiryDate.toISOString(),
      }));

      navigate('/guardian-onboarding'); // Redirect to home after reg
      // 
      // istration
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg w-full max-w-md border border-pink-200 mx-4 my-8 md:mx-0">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-600 mb-2" id="register-heading">
            Create Account
          </h1>
          <p className="text-pink-600 text-base md:text-lg">Join Our Companion Care Community</p>
        </div>

        {error && (
          <div className="bg-red-50 p-3 rounded-lg mb-4 border-l-4 border-red-400" role="alert">
            <p className="text-red-700 text-sm md:text-base">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 md:space-y-6">
          <div>
            <label htmlFor="email" className="block text-base md:text-lg font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-3 text-base md:text-lg border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
              placeholder="yourname@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-base md:text-lg font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
              aria-required="true"
              className="w-full px-4 py-3 text-base md:text-lg border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
              placeholder="••••••••"
            />
            {passwordStrength && (
              <div className="mt-2">
                <span className="text-sm mr-2">Password strength:</span>
                <span
                  className={`text-sm font-medium ${passwordStrength === 'weak' ? 'text-red-500' :
                    passwordStrength === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}
                >
                  {passwordStrength === 'weak' ? 'Weak' :
                    passwordStrength === 'medium' ? 'Medium' :
                      'Strong'}
                </span>
              </div>
            )}
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Use at least 6 characters. Adding numbers and capital letters makes it stronger.
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-base md:text-lg font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-required="true"
              className="w-full px-4 py-3 text-base md:text-lg border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 text-base md:text-lg rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors shadow-md"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-base md:text-lg text-gray-700">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-600 hover:text-pink-600 hover:underline font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;