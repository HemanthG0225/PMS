import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function PharmacistDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalPurchases: 0,
    totalSales: 0
  });
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username') || 'Pharmacist';

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'pharmacist') {
      navigate('/pharmacist');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching data for username:', username); // Debug username

        const purchasesPromise = axios.get('http://localhost:5000/api/purchases', {
          params: { pharmacist_username: username }
        });
        const salesPromise = axios.get('http://localhost:5000/api/sales', {
          params: { pharmacist_username: username }
        });

        const [purchasesRes, salesRes] = await Promise.allSettled([
          purchasesPromise,
          salesPromise
        ]);

        // Handle purchases
        if (purchasesRes.status === 'fulfilled') {
          const purchasesData = Array.isArray(purchasesRes.value.data)
            ? purchasesRes.value.data
            : [];
          console.log('Purchases data:', purchasesData); // Debug response
          setPurchases(purchasesData);
          setStats(prev => ({
            ...prev,
            totalPurchases: purchasesData.reduce((sum, purchase) => sum + Number(purchase.total_amount || 0), 0) || 0
          }));
        } else {
          console.error('Purchases fetch error:', purchasesRes.reason);
          setError('Failed to fetch purchases. Check server logs or try again later.');
        }

        // Handle sales
        if (salesRes.status === 'fulfilled') {
          const salesData = Array.isArray(salesRes.value.data)
            ? salesRes.value.data
            : [];
          console.log('Sales data:', salesData); // Debug response
          setSales(salesData);
          setStats(prev => ({
            ...prev,
            totalSales: salesData.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0
          }));
        } else {
          console.error('Sales fetch error:', salesRes.reason);
          setError(prev => prev ? `${prev} Failed to fetch sales.` : 'Failed to fetch sales. Check server logs or try again later.');
        }

        // If both failed, throw an error to trigger the error state
        if (purchasesRes.status === 'rejected' && salesRes.status === 'rejected') {
          throw new Error('Both API calls failed.');
        }
      } catch (err) {
        console.error('Data fetch error:', err.response ? err.response.data : err.message);
        if (!error) setError('Failed to fetch data. Check server logs or try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username, error]);

  const handleSidebarClick = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
  if (error && purchases.length === 0 && sales.length === 0) return (
    <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
      {error}
      <button
        onClick={() => window.location.reload()}
        style={{
          marginLeft: '10px',
          padding: '5px 10px',
          backgroundColor: '#4a00e0',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <h2>PMS</h2>
        <ul>
          <li className="active">Dashboard</li>
          <li onClick={() => handleSidebarClick('/cart')}>Cart</li>
          <li onClick={() => handleSidebarClick('/orders')}>Orders</li>
          <li onClick={() => handleSidebarClick('/prescription-upload')}>Prescription Upload</li>
          <li className="bold" onClick={() => {
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            handleSidebarClick('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Welcome, {username}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <h3>Total Purchases</h3>
            <p>Rs. {stats.totalPurchases.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Sales</h3>
            <p>Rs. {stats.totalSales.toFixed(2)}</p>
          </div>
        </div>

        {/* Subsection 1: Purchase Details */}
        <div className="section">
          <h3>Purchase Details (From Admin)</h3>
          <p>Total Purchase Amount: Rs. {stats.totalPurchases.toFixed(2)}</p>
          {purchases.length === 0 ? (
            <p>No purchases found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Purchase ID</th>
                  <th>Medicine Name</th>
                  <th>Quantity</th>
                  <th>Price (Rs.)</th>
                  <th>Total (Rs.)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(purchase => (
                  <tr key={purchase.purchase_id}>
                    <td>{purchase.purchase_id}</td>
                    <td>{purchase.medicine_name}</td>
                    <td>{purchase.quantity}</td>
                    <td>{Number(purchase.price).toFixed(2)}</td>
                    <td>{Number(purchase.total_amount).toFixed(2)}</td>
                    <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Subsection 2: Sales Details */}
        <div className="section">
          <h3>Sales Details (To Customers)</h3>
          <p>Total Sales Amount: Rs. {stats.totalSales.toFixed(2)}</p>
          {sales.length === 0 ? (
            <p>No sales found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Medicine Name</th>
                  <th>Quantity</th>
                  <th>Price (Rs.)</th>
                  <th>Total (Rs.)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.sale_id}>
                    <td>{sale.sale_id}</td>
                    <td>{sale.medicine_name}</td>
                    <td>{sale.quantity}</td>
                    <td>{Number(sale.price).toFixed(2)}</td>
                    <td>{Number(sale.total_amount).toFixed(2)}</td>
                    <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default PharmacistDashboard;