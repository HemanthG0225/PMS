import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function ManageAdmin() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users?role=admin');
        setAdmins(response.data);
      } catch (error) {
        setMessage('Failed to fetch admins');
      }
    };
    fetchAdmins();
  }, []);

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
          <li className="active">Manage Admin</li>
          <li className="bold">Medicine</li>
          <li onClick={() => handleSidebarClick('/add-medicine')}>Add Medicine</li>
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
        <h2>Manage Admins</h2>
        {message && <p className="error">{message}</p>}
        {admins.length === 0 ? (
          <p>No admins found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.serial_no}>
                  <td>{admin.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="form-buttons">
          <button className="small-button" type="button" onClick={handleBack}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

export default ManageAdmin;