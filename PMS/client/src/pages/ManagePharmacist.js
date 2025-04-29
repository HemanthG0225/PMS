import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function ManagePharmacist() {
  const navigate = useNavigate();
  const [pharmacists, setPharmacists] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/admin');
    }
  }, [navigate]);

  const fetchPharmacists = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pharmacists');
      setPharmacists(res.data);
    } catch (err) {
      console.error('Pharmacists fetch error:', err);
    }
  };

  useEffect(() => {
    fetchPharmacists();
  }, []);

  const handleDelete = async (username) => {
    if (window.confirm('Are you sure you want to delete this pharmacist?')) {
      try {
        const res = await axios.delete('http://localhost:5000/api/delete-user', {
          data: { username }
        });
        setSuccess(res.data.message);
        await fetchPharmacists();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete pharmacist');
      }
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
          <li onClick={() => handleSidebarClick('/add-pharmacist')}>Add Pharmacist</li>
          <li className="active">Manage Pharmacist</li>
          <li className="bold" onClick={() => {
            localStorage.removeItem('userRole');
            handleSidebarClick('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Manage Pharmacists</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        {pharmacists.length > 0 ? (
          <div className="pharmacist-list">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pharmacists.map((pharmacist) => (
                  <tr key={pharmacist.id}>
                    <td>{pharmacist.id}</td>
                    <td className="username">{pharmacist.username}</td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDelete(pharmacist.username)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No pharmacists found.</p>
        )}
        <div className="form-buttons">
          <button className="small-button" onClick={handleBack}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

export default ManagePharmacist;