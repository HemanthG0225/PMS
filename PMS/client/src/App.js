import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import PharmacistLogin from './pages/PharmacistLogin';
import AdminDashboard from './pages/AdminDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import AddAdmin from './components/AddAdmin';
import ManageAdmin from './components/ManageAdmin';
import AddMedicine from './pages/AddMedicine';
import ManageMedicine from './pages/ManageMedicine';
import MedicineInventory from './pages/MedicineInventory';
import AddPharmacist from './pages/AddPharmacist';
import ManagePharmacist from './pages/ManagePharmacist';
import Cart from './components/Cart';
import Orders from './components/Orders';
import PrescriptionUpload from './components/PrescriptionUpload';
import PharmacistBill from './pages/PharmacistBill';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/pharmacist" element={<PharmacistLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/pharmacist-dashboard" element={<PharmacistDashboard />} />
        <Route path="/add-admin" element={<AddAdmin />} />
        <Route path="/manage-admin" element={<ManageAdmin />} />
        <Route path="/add-medicine" element={<AddMedicine />} />
        <Route path="/manage-medicine" element={<ManageMedicine />} />
        <Route path="/medicine-inventory" element={<MedicineInventory />} />
        <Route path="/add-pharmacist" element={<AddPharmacist />} />
        <Route path="/manage-pharmacist" element={<ManagePharmacist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/prescription-upload" element={<PrescriptionUpload />} />
        <Route path="/pharmacist-bill" element={<PharmacistBill />} />
      </Routes>
    </Router>
  );
}

export default App;