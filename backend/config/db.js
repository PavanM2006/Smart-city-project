const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartcity_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test and verify database pool connectivity on startup
pool.getConnection()
  .then(connection => {
    console.log('MySQL Database connected successfully! Connection Thread ID:', connection.threadId);
    connection.release();
  })
  .catch(err => {
    console.error('=================================================');
    console.error('[MySQL Error] Connection to database failed:', err.message);
    console.error('Please ensure:');
    console.error('1. Your MySQL server is running (default port 3306).');
    console.error('2. You created the "smartcity_db" database.');
    console.error('3. The credentials in your .env file are correct.');
    console.error('=================================================');
  });

module.exports = pool;
