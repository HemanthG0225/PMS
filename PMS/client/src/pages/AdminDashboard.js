import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPharmacists: 0,
    totalMedicines: 0,
    todaySale: 0,
    yesterdaySale: 0,
    lastSevenDaysSale: 0,
    totalSale: 0
  });

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pharmacistsRes, medicinesRes, salesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/total-pharmacists'),
          axios.get('http://localhost:5000/api/total-medicines'),
          axios.get('http://localhost:5000/api/admin-sales')
        ]);

        setStats({
          totalPharmacists: pharmacistsRes.data.total || 0,
          totalMedicines: medicinesRes.data.total || 0,
          todaySale: Number(salesRes.data.today) || 0,
          yesterdaySale: Number(salesRes.data.yesterday) || 0,
          lastSevenDaysSale: Number(salesRes.data.lastSevenDays) || 0,
          totalSale: Number(salesRes.data.lifetime) || 0
        });
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    };

    fetchStats();
  }, []);

  const handleSidebarClick = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <h2>PMS</h2>
        <ul>
          <li className="active">Dashboard</li>
          <li onClick={() => handleSidebarClick('/medicine-inventory')}>Medicine Inventory</li>
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
            localStorage.removeItem('username');
            handleSidebarClick('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Admin Dashboard</h2>
        <div className="stats-row">
          <div className="stat-card">
            <h3>Total Pharmacist</h3>
            <p>{stats.totalPharmacists}</p>
          </div>
          <div className="stat-card">
            <h3>Total Medicine</h3>
            <p>{stats.totalMedicines}</p>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <h3>Today's Sale</h3>
            <p>Rs. {stats.todaySale.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Yesterday's Sale</h3>
            <p>Rs. {stats.yesterdaySale.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Last Seven Days Sale</h3>
            <p>Rs. {stats.lastSevenDaysSale.toFixed(2)}</p>
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-card total-sale">
            <h3>Total Sale</h3>
            <p>Rs. {stats.totalSale.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;