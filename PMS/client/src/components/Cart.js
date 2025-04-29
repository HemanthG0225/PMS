import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState('');
  const username = localStorage.getItem('username') || 'Pharmacist';

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'pharmacist') {
      navigate('/pharmacist');
    }
    fetchMedicines();
  }, [navigate]);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/medicines');
      const formattedMedicines = response.data.map(medicine => ({
        ...medicine,
        price: Number(medicine.price) || 0
      }));
      setMedicines(formattedMedicines);
    } catch (err) {
      console.error('Medicines fetch error:', err.response);
      setError(err.response?.data?.message || 'Failed to fetch medicines');
    }
  };

  const addToCart = (medicine) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.name === medicine.name);
      if (existingItem) {
        return prevItems.map(item =>
          item.name === medicine.name ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...medicine, quantity: 1 }];
    });
  };

  const updateQuantity = (medicineName, newQuantity) => {
    const quantity = Math.max(1, Number(newQuantity) || 1); // Ensure quantity is at least 1
    setCartItems((prevItems) =>
      prevItems.map(item =>
        item.name === medicineName ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (medicineName) => {
    setCartItems((prevItems) => prevItems.filter(item => item.name !== medicineName));
  };

  const handlePurchase = async () => {
    if (cartItems.length === 0) return;
    try {
      const response = await axios.post('http://localhost:5000/api/purchase', {
        pharmacist_username: username,
        medicines: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });
      alert(response.data.message);
      setCartItems([]);
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Failed to process purchase. Check server logs.');
    }
  };

  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <h2>PMS</h2>
        <ul>
          <li onClick={() => navigate('/pharmacist-dashboard')}>Dashboard</li>
          <li className="active">Cart</li>
          <li onClick={() => navigate('/orders')}>Orders</li>
          <li onClick={() => navigate('/prescription-upload')}>Prescription Upload</li>
          <li className="bold" onClick={() => {
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            navigate('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Cart</h2>
        <div className="section">
          <h3>Available Medicines</h3>
          {medicines.length === 0 ? (
            <p>No medicines available.</p>
          ) : (
            <ul>
              {medicines.map((medicine) => (
                <li key={medicine.serial_no}>
                  {medicine.name} - Rs. {medicine.price.toFixed(2)} (Stock: {medicine.stock})
                  <button
                    onClick={() => addToCart(medicine)}
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
                    Add to Cart
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="section">
          <h3>Your Cart</h3>
          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Price (Rs.)</th>
                    <th>Total (Rs.)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map(item => (
                    <tr key={item.serial_no}>
                      <td>{item.name}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.name, e.target.value)}
                          style={{
                            marginTop: '5px',
                            width: '60px',
                            padding: '2px',
                            color: 'red' // Red text color for input
                          }}
                        />
                      </td>
                      <td>{item.price.toFixed(2)}</td>
                      <td>{(item.quantity * item.price).toFixed(2)}</td>
                      <td>
                        <button
                          onClick={() => removeFromCart(item.name)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3">Total Amount</td>
                    <td>
                      Rs. {cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              <button
                onClick={handlePurchase}
                style={{
                  marginTop: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#4a00e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Purchase
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cart;