// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Styles/Login/LoginPage.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Baseurl } from '../../../config/Login'; // Adjusted path based on your project structure

const ErrorPopup = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2 className="popup-title">Oops!</h2>
        <p className="popup-message">{message}</p>
        <button className="popup-close-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      console.log('Sending request to:', `${Baseurl}/login`);
      console.log('Request body:', { username, password });

      const response = await fetch(`${Baseurl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok && data.status) {
        // Store the JWT token and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Stored user:', data.user);

        // Navigate based on role
        if (data.user.role === 'student') {
          console.log('Navigating to student-dashboard');
          navigate('/student-dashboard');
        } else if (data.user.role === 'teacher') {
          console.log('Navigating to teacher-dashboard');
          navigate('/teacher-dashboard');
        } else if (data.user.role === 'admin') {
          console.log('Navigating to admin-dashboard');
          navigate('/admin-dashboard');
        } else {
          console.log('Unknown role:', data.user.role);
          setPopupMessage('Invalid user role');
          setIsPopupOpen(true);
        }
      } else {
        // Show error message from API
        console.log('Login failed:', data.error);
        setPopupMessage(data.error || 'Your username or password is incorrect!');
        setIsPopupOpen(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setPopupMessage('An error occurred. Please check your network or try again later.');
      setIsPopupOpen(true);
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setPopupMessage('');
  };

  return (
    <div className="form-container">
      <div className="login-container">
        <img src="./public/logo.png" className="logos" alt="Logo" />
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-with-icon">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <button type="submit">Login</button>
        </form>
        <ErrorPopup
          isOpen={isPopupOpen}
          onClose={closePopup}
          message={popupMessage}
        />
      </div>
    </div>
  );
};

export default LoginPage;