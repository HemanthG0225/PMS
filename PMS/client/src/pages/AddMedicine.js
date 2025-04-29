import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function AddMedicine() {
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState({
    name: '',
    stock: '',
    symptom: '',
    brand: '',
    price: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setMedicine({ ...medicine, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      console.log('Sending data:', medicine); // Debug: Log the data being sent
      const res = await axios.post('http://localhost:5000/api/add-medicine', medicine);
      setSuccess(res.data.message || 'Medicine added successfully');
      setMedicine({ name: '', stock: '', symptom: '', brand: '', price: '' });
    } catch (err) {
      console.error('Add medicine error:', err.response); // Debug: Log the full error response
      setError(err.response?.data?.message || 'Failed to add medicine');
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
          <li className="active">Add Medicine</li>
          <li onClick={() => handleSidebarClick('/manage-medicine')}>Manage Medicine</li>
          <li className="bold">Pharmacist</li>
          <li onClick={() => handleSidebarClick('/add-pharmacist')}>Add Pharmacist</li>
          <li onClick={() => handleSidebarClick('/manage-pharmacist')}>Manage Pharmacist</li>
          <li className="bold" onClick={() => {
            localStorage.removeItem('userRole');
            handleSidebarClick('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Add New Medicine</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Medicine Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={medicine.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="stock">Stock Quantity</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={medicine.stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="symptom">Symptom</label>
            <input
              type="text"
              id="symptom"
              name="symptom"
              value={medicine.symptom}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="brand">Brand</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={medicine.brand}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price (Rs.)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={medicine.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="form-buttons">
            <button className="small-button" type="submit">Add Medicine</button>
            <button className="small-button" type="button" onClick={handleBack}>Back to Dashboard</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMedicine;