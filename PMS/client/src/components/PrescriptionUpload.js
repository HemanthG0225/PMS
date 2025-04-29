import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import '../styles/GlobalStyles.css';

function PrescriptionUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [bill, setBill] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const pharmacistUsername = localStorage.getItem('username');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'pharmacist') {
      navigate('/pharmacist');
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMedicines([]);
    setBill(null);
    setMessage('');
  };

  const extractMedicines = (text) => {
    console.log('OCR Output:', text); // Debug: Log the raw OCR output
    const lines = text.split('\n').filter(line => line.trim());
    const medicineList = [];
    // More flexible regex: allows for optional spaces, punctuation, and case-insensitive medicine names
    const medicineRegex = /^([a-zA-Z\s-]+)\s+(\d+)$/i; // Matches "Paracetamol 5" or "Ibuprofen  3"
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const match = trimmedLine.match(medicineRegex);
      if (match) {
        const name = match[1].trim();
        const quantity = parseInt(match[2], 10);
        if (name && !isNaN(quantity) && quantity > 0) {
          medicineList.push({ name, quantity });
        }
      } else {
        console.log(`Line ${index + 1} did not match: "${trimmedLine}"`); // Debug: Log unmatched lines
      }
    });
    return medicineList;
  };

  const handleSearch = async () => {
    if (!file) {
      setMessage('Please select a file to upload');
      return;
    }

    // Check file type
    const fileType = file.type;
    if (!fileType.match(/image\/(png|jpg|jpeg)/)) {
      setMessage('Only image files (PNG, JPG, JPEG) are supported for OCR');
      return;
    }

    setLoading(true);
    setMessage('');
    setMedicines([]);
    setBill(null);

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => console.log('Tesseract Progress:', m), // Debug: Log Tesseract progress
      });

      if (!text || text.trim() === '') {
        setMessage('No text found in the file. Please ensure the image contains readable text.');
        setLoading(false);
        return;
      }

      const extractedMedicines = extractMedicines(text);
      if (extractedMedicines.length === 0) {
        setMessage('No valid medicines found in the file. Expected format: "MedicineName Quantity" (e.g., Paracetamol 5)');
        setLoading(false);
        return;
      }
      setMedicines(extractedMedicines);

      const availabilityCheck = await axios.post('http://localhost:5000/api/check-availability', {
        medicines: extractedMedicines
      });

      const unavailable = availabilityCheck.data.filter(item => !item.available);
      if (unavailable.length > 0) {
        setMessage(`Insufficient stock for: ${unavailable.map(item => item.name).join(', ')}`);
        setLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:5000/api/upload-prescription', {
        pharmacist_username: pharmacistUsername,
        medicines: extractedMedicines
      });
      setBill(response.data.bill);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to process the file. Check the console for details.');
      console.error('OCR Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setMedicines([]);
    setBill(null);
    setMessage('');
    document.getElementById('prescription-file').value = '';
  };

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
          <li onClick={() => handleSidebarClick('/orders')}>Orders</li>
          <li onClick={() => handleSidebarClick('/pharmacist-bill')}>Bills</li>
          <li className="active">Prescription Upload</li>
          <li className="bold" onClick={() => {
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            handleSidebarClick('/');
          }}>Logout</li>
        </ul>
      </div>
      <div className="main-content">
        <h2>Prescription Upload</h2>
        {message && <p className={message.includes('success') ? 'success' : 'error'}>{message}</p>}
        <div className="form-group">
          <label>Upload Prescription</label>
          <input
            id="prescription-file"
            type="file"
            onChange={handleFileChange}
            accept=".jpg,.png,.jpeg"
          />
        </div>
        <div className="form-buttons">
          <button onClick={handleSearch} disabled={loading} className="small-button">
            {loading ? 'Processing...' : 'Search'}
          </button>
          {bill && (
            <button onClick={handleClear} className="small-button">Clear</button>
          )}
          <button className="small-button" type="button" onClick={handleBack}>Back to Dashboard</button>
        </div>
        {medicines.length > 0 && (
          <div>
            <h3>Extracted Medicines</h3>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med, index) => (
                  <tr key={index}>
                    <td>{med.name}</td>
                    <td>{med.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {bill && (
          <div>
            <h3>Bill</h3>
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>Rs. {Number(item.price).toFixed(2)}</td>
                    <td>Rs. {Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">Total Amount</td>
                  <td>Rs. {Number(bill.total_amount).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PrescriptionUpload;