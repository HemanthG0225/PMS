import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

const PharmacistBill = () => {
  const [sales, setSales] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSales = async () => {
      const username = localStorage.getItem('username');
      if (!username) {
        alert('Please log in to view bills.');
        navigate('/pharmacist-login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/sales?pharmacist_username=${username}`);
        const data = await response.json();
        if (response.ok) {
          setSales(data);
        } else {
          alert(data.message || 'Failed to fetch sales.');
        }
      } catch (err) {
        console.error('Error fetching sales:', err);
        alert('Error fetching sales.');
      }
    };

    fetchSales();
  }, [navigate]);

  const totalSalesAmount = sales.reduce((total, sale) => total + parseFloat(sale.total_amount), 0).toFixed(2);

  return (
    <div className="container">
      <h1>Pharmacist Bills</h1>
      <table>
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Medicine Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total Amount</th>
            <th>Sale Date</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.sale_id}>
              <td>{sale.sale_id}</td>
              <td>{sale.medicine_name}</td>
              <td>{sale.quantity}</td>
              <td>Rs. {sale.price}</td>
              <td>Rs. {sale.total_amount}</td>
              <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4">Total Sales Amount</td>
            <td colSpan="2">Rs. {totalSalesAmount}</td>
          </tr>
        </tfoot>
      </table>
      <div className="form-buttons">
        <button className="small-button" type="button" onClick={() => navigate('/pharmacist-dashboard')}>
          Back
        </button>
      </div>
    </div>
  );
};

export default PharmacistBill;