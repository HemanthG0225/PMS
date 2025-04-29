import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function PharmacistLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/login/pharmacist', {
        username,
        password,
      });
      if (res.data.success) {
        // Store user role and username in localStorage
        localStorage.setItem('userRole', 'pharmacist');
        localStorage.setItem('username', username);
        console.log('Username stored in localStorage:', localStorage.getItem('username'));
        navigate('/pharmacist-dashboard');
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Pharmacist login error:', err.response);
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="login-container">
      <h2>Pharmacist Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default PharmacistLogin;