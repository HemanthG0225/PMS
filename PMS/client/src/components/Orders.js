import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'pharmacist') {
      navigate('/pharmacist');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/orders', {
          params: { pharmacist_username: localStorage.getItem('username') }
        });
        setOrders(response.data);
      } catch (err) {
        setMessage('Failed to fetch orders');
      }
    };
    fetchOrders();
  }, []);

  const handleBack = () => {
    navigate('/pharmacist-dashboard');
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
          <li onClick={() => handleSidebarClick('/pharmacist-dashboard')}>Dashboard</li>
          <li onClick={() => handleSidebarClick('/cart')}>Cart</li>
          <li className="active">Orders</li>
          <li onClick={() => handleSidebarClick('/prescription-upload')}>Prescription Upload</li>
          <li onClick={() => handleSidebarClick('/pharmacist-bill')}>Bills</li>
          <li className="bold" onClick={() => {
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            handleSidebarClick('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Orders</h2>
        {message && <p className="error">{message}</p>}
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.sale_id}>
                  <td>{order.sale_id}</td>
                  <td>{new Date(order.sale_date).toLocaleDateString()}</td>
                  <td>{Number(order.total_amount).toFixed(2)}</td>
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

export default Orders;