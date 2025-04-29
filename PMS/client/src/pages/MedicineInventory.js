import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function MedicineInventory() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [filters, setFilters] = useState({
    symptom: '',
    brand: '',
    price: '',
    stock: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/medicines', {
        params: filters
      });
      setMedicines(res.data);
    } catch (err) {
      console.error('Fetch medicines error:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch medicines');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMedicines();
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
          <li className="active">Medicine Inventory</li>
          <li className="bold">Admin</li>
          <li onClick={() => handleSidebarClick('/add-admin')}>Add Admin</li>
          <li onClick={() => handleSidebarClick('/manage-admin')}>Manage Admin</li>
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
        <h2>Medicine Inventory</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label htmlFor="symptom">Symptom</label>
            <input
              type="text"
              id="symptom"
              name="symptom"
              value={filters.symptom}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="brand">Brand</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={filters.brand}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Max Price (Rs.)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={filters.price}
              onChange={handleFilterChange}
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="stock">Max Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={filters.stock}
              onChange={handleFilterChange}
              min="0"
            />
          </div>
          <div className="form-buttons">
            <button className="small-button" type="submit">Search</button>
            <button className="small-button" type="button" onClick={handleBack}>Back to Dashboard</button>
          </div>
        </form>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MedicineInventory;