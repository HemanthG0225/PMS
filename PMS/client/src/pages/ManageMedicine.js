import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function ManageMedicine() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState('');

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/medicines');
      setMedicines(res.data);
    } catch (err) {
      console.error('Fetch medicines error:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch medicines');
    }
  }, []); // No dependencies, so fetchMedicines won't change

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/admin');
    } else {
      fetchMedicines();
    }
  }, [navigate, fetchMedicines]); // Include fetchMedicines in the dependency array

  const handleDelete = async (serial_no) => {
    try {
      await axios.delete('http://localhost:5000/api/delete-medicine', {
        data: { serial_no }
      });
      fetchMedicines(); // Refresh the list
    } catch (err) {
      console.error('Delete medicine error:', err.response);
      setError(err.response?.data?.message || 'Failed to delete medicine');
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
          <li className="active">Manage Medicine</li>
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
        <h2>Manage Medicines</h2>
        {error && <p className="error">{error}</p>}
        {medicines.length === 0 ? (
          <p>No medicines found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Serial No</th>
                <th>Name</th>
                <th>Stock</th>
                <th>Symptom</th>
                <th>Brand</th>
                <th>Price (Rs.)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((medicine) => (
                <tr key={medicine.serial_no}>
                  <td>{medicine.serial_no}</td>
                  <td>{medicine.name}</td>
                  <td>{medicine.stock}</td>
                  <td>{medicine.symptom}</td>
                  <td>{medicine.brand}</td>
                  <td>{medicine.price}</td>
                  <td>
                    <button
                      className="small-button"
                      onClick={() => handleDelete(medicine.serial_no)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="form-buttons">
          <button className="small-button" onClick={handleBack}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}

export default ManageMedicine;