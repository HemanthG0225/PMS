const express = require('express');
const router = express.Router();
const pool = require('../db');

// Generic login route for both roles (Admin/Pharmacist)
router.post('/login/:role', async (req, res) => {
  const { username, password } = req.body;
  const role = req.params.role.toLowerCase();
  console.log('Login attempt:', { username, role, password });

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM Users WHERE username = ? AND password = ? AND role = ?`,
      [username, password, role]
    );
    console.log('Query result:', rows);

    if (rows.length > 0) {
      res.json({ success: true, message: `${role} login successful` });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials or role' });
    }
  } catch (err) {
    console.error('Login error details:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check medicine availability
router.post('/check-availability', async (req, res) => {
  const { medicines } = req.body;

  try {
    const availability = [];
    for (const medicine of medicines) {
      const [rows] = await pool.execute(
        'SELECT name, stock FROM Medicines WHERE name = ?',
        [medicine.name]
      );
      if (rows.length > 0) {
        availability.push({
          name: medicine.name,
          available: rows[0].stock >= medicine.quantity,
          stock: rows[0].stock
        });
      } else {
        availability.push({ name: medicine.name, available: false, stock: 0 });
      }
    }
    res.json(availability);
  } catch (err) {
    console.error('Availability check error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Sales statistics (Today, Yesterday, Last Seven Days, Total) - Renamed to /sales-stats
router.get('/sales-stats', async (req, res) => {
  try {
    const [today] = await pool.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM PharmaPurchases WHERE DATE(purchase_date) = CURDATE()'
    );
    const [yesterday] = await pool.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM PharmaPurchases WHERE DATE(purchase_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
    );
    const [lastSevenDays] = await pool.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM PharmaPurchases WHERE purchase_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND purchase_date < CURDATE()'
    );
    const [lifetime] = await pool.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM PharmaPurchases'
    );
    res.json({
      today: today[0].total,
      yesterday: yesterday[0].total,
      lastSevenDays: lastSevenDays[0].total,
      lifetime: lifetime[0].total
    });
  } catch (err) {
    console.error('Sales stats fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch detailed sales records for a pharmacist
router.get('/sales', async (req, res) => {
  const { pharmacist_username } = req.query;

  if (!pharmacist_username) {
    return res.status(400).json({ success: false, message: 'Pharmacist username is required' });
  }

  try {
    const [sales] = await pool.execute(
      'SELECT sale_id, pharmacist_username, medicine_name, quantity, price, total_amount, sale_date FROM PharmaSales WHERE pharmacist_username = ?',
      [pharmacist_username]
    );
    res.json(sales || []);
  } catch (err) {
    console.error('Sales fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sales' });
  }
});

// Fetch detailed purchase records for a pharmacist
router.get('/purchases', async (req, res) => {
  const { pharmacist_username } = req.query;

  if (!pharmacist_username) {
    return res.status(400).json({ success: false, message: 'Pharmacist username is required' });
  }

  try {
    const [purchases] = await pool.execute(
      'SELECT purchase_id, pharmacist_username, medicine_name, quantity, price, total_amount, purchase_date FROM PharmaPurchases WHERE pharmacist_username = ?',
      [pharmacist_username]
    );
    res.json(purchases || []);
  } catch (err) {
    console.error('Purchases fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

// Fetch invoices by date - From PharmaSales
router.get('/invoices', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT s.serial_no, s.sale_date, s.amount, s.invoice_number, p.username AS pharmacist_name ' +
      'FROM PharmaSales s JOIN Pharmacists p ON s.pharmacist_serial_no = p.serial_no ' +
      'WHERE DATE(sale_date) = ?',
      [date]
    );
    res.json(rows);
  } catch (err) {
    console.error('Invoices fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Low stock
router.get('/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT name, stock FROM Medicines WHERE stock < 10'
    );
    res.json(rows);
  } catch (err) {
    console.error('Low stock fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Categorize medicines with updated filters
router.get('/medicines', async (req, res) => {
  const { symptom, brand, price, stock } = req.query;
  let query = 'SELECT serial_no, name, symptom, brand, stock, price FROM Medicines WHERE 1=1';
  const params = [];

  if (symptom) {
    query += ' AND symptom LIKE ?';
    params.push(`%${symptom}%`);
  }
  if (brand) {
    query += ' AND brand LIKE ?';
    params.push(`%${brand}%`);
  }
  if (price) {
    query += ' AND price <= ?';
    params.push(price);
  }
  if (stock) {
    query += ' AND stock <= ?';
    params.push(stock);
  }

  try {
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Categorization error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update medicine stock
router.put('/update-medicine-stock', async (req, res) => {
  const { serial_no, stock } = req.body;

  try {
    const parsedStock = parseInt(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
    }

    const [result] = await pool.execute(
      'UPDATE Medicines SET stock = ? WHERE serial_no = ?',
      [parsedStock, serial_no]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/delete-user', async (req, res) => {
  const { username } = req.body;

  try {
    await pool.execute('DELETE FROM Pharmacists WHERE username = ?', [username]);
    const [result] = await pool.execute('DELETE FROM Users WHERE username = ?', [username]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: `User ${username} deleted` });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Total Pharmacists
router.get('/total-pharmacists', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM Pharmacists');
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error('Total pharmacists fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch all pharmacists
router.get('/pharmacists', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Pharmacists');
    res.json(rows);
  } catch (err) {
    console.error('Pharmacists fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Total Medical Companies
router.get('/total-companies', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM MedicalCompanies');
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error('Total companies fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch all companies
router.get('/companies', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM MedicalCompanies');
    res.json(rows);
  } catch (err) {
    console.error('Companies fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Total Medicines
router.get('/total-medicines', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM Medicines');
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error('Total medicines fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new medicine with price (updated to increment stock if exists)
router.post('/add-medicine', async (req, res) => {
  const { name, stock, symptom, brand, price } = req.body;

  const parsedStock = parseInt(stock);
  const parsedPrice = parseFloat(price);

  if (!name || !stock || !symptom || !brand || !price) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (isNaN(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
  }
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
  }

  try {
    let connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      'SELECT serial_no, stock, price FROM Medicines WHERE name = ? AND brand = ?',
      [name, brand]
    );

    if (existing.length > 0) {
      const existingMedicine = existing[0];
      const newStock = existingMedicine.stock + parsedStock;
      const newPrice = existingMedicine.price === parsedPrice ? parsedPrice : existingMedicine.price;
      await connection.execute(
        'UPDATE Medicines SET stock = ?, price = ? WHERE serial_no = ?',
        [newStock, newPrice, existingMedicine.serial_no]
      );
      await connection.commit();
      connection.release();
      return res.json({ success: true, message: 'Medicine stock updated successfully' });
    }

    const [maxSerial] = await connection.execute('SELECT COALESCE(MAX(serial_no), 0) as max_serial FROM Medicines');
    const nextSerialNo = maxSerial[0].max_serial + 1;

    await connection.execute(
      'INSERT INTO Medicines (serial_no, name, stock, symptom, brand, price) VALUES (?, ?, ?, ?, ?, ?)',
      [nextSerialNo, name, parsedStock, symptom, brand, parsedPrice]
    );

    await connection.commit();
    connection.release();
    res.json({ success: true, message: 'Medicine added successfully' });
  } catch (err) {
    console.error('Add medicine error:', err);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete medicine
router.delete('/delete-medicine', async (req, res) => {
  const { serial_no } = req.body;

  try {
    const [result] = await pool.execute('DELETE FROM Medicines WHERE serial_no = ?', [serial_no]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Medicine deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Medicine not found' });
    }
  } catch (err) {
    console.error('Delete medicine error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new company
router.post('/add-company', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Company name is required' });
  }

  try {
    const [maxSerial] = await pool.execute('SELECT COALESCE(MAX(serial_no), 0) as max_serial FROM MedicalCompanies');
    const nextSerialNo = maxSerial[0].max_serial + 1;

    const [existing] = await pool.execute(
      'SELECT * FROM MedicalCompanies WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Company already exists' });
    }

    await pool.execute('INSERT INTO MedicalCompanies (serial_no, name) VALUES (?, ?)', [nextSerialNo, name]);

    res.json({ success: true, message: 'Company added successfully' });
  } catch (err) {
    console.error('Add company error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete company
router.delete('/delete-company', async (req, res) => {
  const { serial_no } = req.body;

  try {
    const [result] = await pool.execute('DELETE FROM MedicalCompanies WHERE serial_no = ?', [serial_no]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Company deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Company not found' });
    }
  } catch (err) {
    console.error('Delete company error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new admin
router.post('/add-admin', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute('SELECT * FROM Users WHERE username = ?', [username]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const [maxUserSerial] = await connection.execute('SELECT COALESCE(MAX(serial_no), 0) as max_serial FROM Users');
    const nextUserSerialNo = maxUserSerial[0].max_serial + 1;

    await connection.execute(
      'INSERT INTO Users (serial_no, username, password, role) VALUES (?, ?, ?, ?)',
      [nextUserSerialNo, username, password, 'admin']
    );

    await connection.commit();
    res.json({ success: true, message: 'Admin added successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Add admin error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Add new pharmacist
router.post('/add-pharmacist', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute('SELECT * FROM Users WHERE username = ?', [username]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const [maxUserSerial] = await connection.execute('SELECT COALESCE(MAX(serial_no), 0) as max_serial FROM Users');
    const nextUserSerialNo = maxUserSerial[0].max_serial + 1;

    await connection.execute(
      'INSERT INTO Users (serial_no, username, password, role) VALUES (?, ?, ?, ?)',
      [nextUserSerialNo, username, password, 'pharmacist']
    );

    const [maxPharmacistSerial] = await connection.execute('SELECT COALESCE(MAX(serial_no), 0) as max_serial FROM Pharmacists');
    const nextPharmacistSerialNo = maxPharmacistSerial[0].max_serial + 1;

    await connection.execute('INSERT INTO Pharmacists (serial_no, username) VALUES (?, ?)', [nextPharmacistSerialNo, username]);

    await connection.commit();
    res.json({ success: true, message: 'Pharmacist added successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Add pharmacist error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Purchase medicines and generate invoice - Uses PharmaPurchases
router.post('/purchase', async (req, res) => {
  const { pharmacist_username, medicines } = req.body;
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (!pharmacist_username || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ success: false, message: 'Pharmacist username and medicines array are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [pharmacist] = await connection.execute(
      'SELECT serial_no FROM Pharmacists WHERE username = ?',
      [pharmacist_username]
    );
    if (pharmacist.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Pharmacist not found' });
    }
    const pharmacist_serial_no = pharmacist[0].serial_no;

    const [maxPurchaseSerial] = await connection.execute('SELECT COALESCE(MAX(purchase_id), 0) as max_serial FROM PharmaPurchases');
    const nextPurchaseId = maxPurchaseSerial[0].max_serial + 1;

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nextPurchaseId}`;

    let totalAmount = 0;

    for (const item of medicines) {
      const { name, quantity, price } = item;
      const parsedQuantity = parseInt(quantity);
      const parsedPrice = parseFloat(price);

      if (!name || isNaN(parsedQuantity) || isNaN(parsedPrice) || parsedQuantity <= 0 || parsedPrice < 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Invalid medicine details for ${name}` });
      }

      const [existingMedicine] = await connection.execute(
        'SELECT serial_no, stock FROM Medicines WHERE name = ?',
        [name]
      );
      if (existingMedicine.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: `Medicine ${name} not found in admin inventory` });
      }

      const currentStock = existingMedicine[0].stock;
      if (currentStock < parsedQuantity) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${name}. Available: ${currentStock}, Requested: ${parsedQuantity}` });
      }

      const newStock = currentStock - parsedQuantity;
      await connection.execute(
        'UPDATE Medicines SET stock = ? WHERE serial_no = ?',
        [newStock, existingMedicine[0].serial_no]
      );

      totalAmount += parsedQuantity * parsedPrice;
      await connection.execute(
        'INSERT INTO PharmaPurchases (purchase_id, pharmacist_username, medicine_name, quantity, price, total_amount, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nextPurchaseId, pharmacist_username, name, parsedQuantity, parsedPrice, parsedQuantity * parsedPrice, currentDate]
      );
    }

    await connection.commit();

    const invoice = {
      invoice_number: invoiceNumber,
      date: currentDate,
      pharmacist: pharmacist_username,
      medicines,
      total_amount: totalAmount
    };

    res.json({ success: true, message: 'Purchase successful', invoice });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Purchase error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

// Fetch pharmacist orders with purchased medicines - From PharmaPurchases
router.get('/orders', async (req, res) => {
  const { pharmacist_username } = req.query;

  if (!pharmacist_username) {
    return res.status(400).json({ success: false, message: 'Pharmacist username is required' });
  }

  try {
    const [purchases] = await pool.execute(
      'SELECT purchase_id, purchase_date, total_amount FROM PharmaPurchases WHERE pharmacist_username = ? GROUP BY purchase_id',
      [pharmacist_username]
    );

    const orders = [];
    for (const purchase of purchases) {
      const [medicines] = await pool.execute(
        'SELECT medicine_name, quantity, price, total_amount FROM PharmaPurchases WHERE purchase_id = ?',
        [purchase.purchase_id]
      );
      orders.push({
        ...purchase,
        medicines: medicines.map(med => ({
          name: med.medicine_name,
          quantity: med.quantity,
          price: med.price,
          total: med.total_amount.toFixed(2)
        }))
      });
    }

    res.json(orders);
  } catch (err) {
    console.error('Orders fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch users by role (e.g., for managing admins)
router.get('/users', async (req, res) => {
  const { role } = req.query;

  if (!role) {
    return res.status(400).json({ success: false, message: 'Role is required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT serial_no, username, password, role FROM Users WHERE role = ?',
      [role]
    );
    res.json(rows);
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Handle prescription upload and generate bill - Uses PharmaSales
router.post('/upload-prescription', async (req, res) => {
  const { pharmacist_username, medicines } = req.body; // Expecting { name, quantity } array

  if (!pharmacist_username || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ success: false, message: 'Pharmacist username and medicines array are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [pharmacist] = await connection.execute(
      'SELECT serial_no FROM Pharmacists WHERE username = ?',
      [pharmacist_username]
    );
    if (pharmacist.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Pharmacist not found' });
    }
    const pharmacist_serial_no = pharmacist[0].serial_no;

    const [maxSalesSerial] = await connection.execute('SELECT COALESCE(MAX(serial_no), 0) as max_serial FROM PharmaSales');
    const nextSalesSerialNo = maxSalesSerial[0].max_serial + 1;

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nextSalesSerialNo}`;
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let totalAmount = 0;
    const billItems = [];

    for (const item of medicines) {
      const { name, quantity } = item;
      const parsedQuantity = parseInt(quantity);

      if (!name || isNaN(parsedQuantity) || parsedQuantity <= 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Invalid details for ${name}` });
      }

      const [existingMedicine] = await connection.execute(
        'SELECT serial_no, stock, price FROM Medicines WHERE name = ?',
        [name]
      );
      if (existingMedicine.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Medicine ${name} not found` });
      }

      const { stock, price } = existingMedicine[0];
      if (stock < parsedQuantity) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for ${name}. Available: ${stock}, Requested: ${parsedQuantity}` });
      }

      const newStock = stock - parsedQuantity;
      await connection.execute(
        'UPDATE Medicines SET stock = ? WHERE serial_no = ?',
        [newStock, existingMedicine[0].serial_no]
      );

      const itemTotal = parsedQuantity * price;
      totalAmount += itemTotal;
      billItems.push({ name, quantity: parsedQuantity, price, total: itemTotal.toFixed(2) });

      await connection.execute(
        'INSERT INTO PharmaSales (serial_no, sale_date, amount, pharmacist_serial_no, invoice_number, medicine_name, quantity, price, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nextSalesSerialNo, currentDate, itemTotal, pharmacist_serial_no, invoiceNumber, name, parsedQuantity, price, itemTotal]
      );
    }

    await connection.commit();

    const bill = {
      invoice_number: invoiceNumber,
      date: currentDate,
      pharmacist: pharmacist_username,
      items: billItems,
      total_amount: totalAmount.toFixed(2)
    };

    res.json({ success: true, message: 'Prescription uploaded and bill generated', bill });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Prescription upload error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;