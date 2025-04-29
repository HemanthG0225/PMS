import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file

function HomePage() {
  return (
    <div className="home-container">
      <div className="top-right-links">
        <Link to="/admin">Admin Login</Link> | 
        <Link to="/pharmacist">Pharmacist Login</Link>
      </div>
      <div className="center-heading">
        <h1>Welcome to Pharmacy Management System</h1>
        <p>Select your role to proceed.</p>
      </div>
    </div>
  );
}

export default HomePage;