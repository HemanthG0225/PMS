import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function AddPharmacist() {
  const navigate = useNavigate();
  const [pharmacist, setPharmacist] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setPharmacist({ ...pharmacist, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('http://localhost:5000/api/add-pharmacist', pharmacist);
      setSuccess(res.data.message);
      setPharmacist({ username: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add pharmacist');
    }
  };

  const handleBack = () => {
    navigate('/admin-dashboard');
    window.scrollTo(0, 0);
  };

  const handleSidebarClick = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <h2>PMS</h2>
        <ul>
          <li onClick={() => handleSidebarClick('/admin-dashboard')}>Dashboard</li>
          <li onClick={() => handleSidebarClick('/medicine-inventory')}>Medicine Inventory</li>
          <li className="bold">Admin</li>
          <li onClick={() => handleSidebarClick('/add-admin')}>Add Admin</li>
          <li onClick={() => handleSidebarClick('/manage-admin')}>Manage Admin</li>
          <li className="bold">Medicine</li>
          <li onClick={() => handleSidebarClick('/add-medicine')}>Add Medicine</li>
          <li onClick={() => handleSidebarClick('/manage-medicine')}>Manage Medicine</li>
          <li className="bold">Pharmacist</li>
          <li className="active">Add Pharmacist</li>
          <li onClick={() => handleSidebarClick('/manage-pharmacist')}>Manage Pharmacist</li>
          <li className="bold" onClick={() => {
            localStorage.removeItem('userRole');
            handleSidebarClick('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Add New Pharmacist</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={pharmacist.username}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={pharmacist.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-buttons">
            <button className="small-button" type="submit">Add Pharmacist</button>
            <button className="small-button" type="button" onClick={handleBack}>Back to Dashboard</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPharmacist;