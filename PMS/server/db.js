const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'hemanthg',
  database: process.env.DB_DATABASE || 'hemanth'
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

module.exports = pool.promise();