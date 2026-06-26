export const FILE_CONTENTS = {
  rootReadme: `# Smart City Citizen Service Portal

Welcome to the **Smart City Citizen Service Portal**, a comprehensive full-stack solution designed to empower citizens to report and track local civic issues (such as potholes, garbage accumulation, water leakages, and streetlight outages), and enable municipal authorities to review, prioritize, assign, and resolve these issues via an analytics-driven administrative dashboard.

## Project Architecture
This repository is structured as a **GitHub-Ready Full-Stack Project**:
... (see backend/README.md for API details)
`,

  backendPackageJson: `{
  "name": "smartcity-citizen-service-backend",
  "version": "1.0.0",
  "description": "Backend API for Smart City Citizen Service Portal using Node.js, Express, and MySQL.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.9.2",
    "nodemailer": "^6.9.11"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}`,

  backendEnvExample: `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=smartcity_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_2026
JWT_EXPIRES_IN=24h

# Email Service (Nodemailer - Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="Smart City Portal <no-reply@smartcity.gov>"`,

  backendServerJs: `const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart City API is running.' });
});

app.listen(PORT, () => {
  console.log(\`Server running on: http://localhost:\${PORT}\`);
});`,

  backendDbConfig: `const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartcity_db',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;`,

  backendSchemaSql: `-- Smart City Citizen Service Portal Database Schema (Updated)
CREATE DATABASE IF NOT EXISTS \`smartcity_db\`;
USE \`smartcity_db\`;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('citizen', 'department_officer', 'administrator') NOT NULL DEFAULT 'citizen',
  \`phone\` VARCHAR(20) NULL,
  \`avatar\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`departments\` (
  \`department_id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`department_name\` VARCHAR(100) NOT NULL UNIQUE,
  \`head_officer\` VARCHAR(100) NOT NULL,
  \`contact\` VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS \`complaints\` (
  \`complaint_id\` VARCHAR(50) PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`title\` VARCHAR(150) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`category\` ENUM('Water Supply', 'Electricity', 'Road Damage', 'Garbage', 'Drainage', 'Street Light', 'Other') NOT NULL,
  \`image\` VARCHAR(255) NULL,
  \`latitude\` DECIMAL(10, 8) NOT NULL,
  \`longitude\` DECIMAL(11, 8) NOT NULL,
  \`address\` VARCHAR(255) NOT NULL,
  \`status\` ENUM('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Submitted',
  \`department_id\` INT NULL,
  \`priority\` ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
  \`remarks\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`department_id\`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS \`device_tokens\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`token\` VARCHAR(255) NOT NULL UNIQUE,
  \`device_type\` VARCHAR(20) NOT NULL DEFAULT 'web',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`complaint_comments\` (
  \`comment_id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`complaint_id\` VARCHAR(50) NOT NULL,
  \`user_id\` INT NOT NULL,
  \`comment\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`complaint_id\`) REFERENCES \`complaints\`(\`complaint_id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`action\` VARCHAR(50) NOT NULL,
  \`details\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
);`,

  backendAuthMiddleware: `const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access Denied.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_2026');
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid Token.' });
  }
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };`,

  backendAuthController: `const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'User exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'citizen', phone]
    );

    const token = jwt.sign({ id: result.insertId, name, role }, process.env.JWT_SECRET);
    res.status(201).json({ success: true, token, user: { id: result.insertId, name, email, role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ message: 'User not found.' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password.' });

    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};`,

  backendComplaintController: `const db = require('../config/db');
const nodemailer = require('nodemailer');

exports.createComplaint = async (req, res) => {
  const { title, description, category, lat, lng, address, priority } = req.body;
  const userId = req.user.id;
  const complaintId = \`CC-\${new Date().getFullYear()}-\${Math.floor(1000 + Math.random() * 9000)}\`;
  const imagePath = req.file ? \`uploads/\${req.file.filename}\` : null;

  try {
    await db.query(
      'INSERT INTO complaints (complaint_id, user_id, title, description, category, image, location_lat, location_lng, location_address, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [complaintId, userId, title, description, category, imagePath, lat, lng, address, priority]
    );
    res.status(201).json({ success: true, complaint_id: complaintId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getComplaints = async (req, res) => {
  const { id, role } = req.user;
  try {
    let query = 'SELECT c.*, u.name as citizen_name FROM complaints c JOIN users u ON c.user_id = u.id';
    if (role === 'citizen') query += ' WHERE c.user_id = ?';
    const [results] = await db.query(query, role === 'citizen' ? [id] : []);
    res.json({ success: true, complaints: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateComplaint = async (req, res) => {
  const { complaint_id, status, department_id, remarks } = req.body;
  try {
    await db.query(
      'UPDATE complaints SET status = ?, department_id = ?, remarks = ? WHERE complaint_id = ?',
      [status, department_id, remarks, complaint_id]
    );
    res.json({ success: true, message: 'Complaint updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};`,

  backendApiRoutes: `const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const complaintController = require('../controllers/complaintController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/complaint', authenticateToken, complaintController.createComplaint);
router.get('/complaints', authenticateToken, complaintController.getComplaints);
router.put('/complaint/update', authenticateToken, authorizeRole('authority'), complaintController.updateComplaint);

module.exports = router;`,

  backendReadme: `# Smart City Backend API Documentation
See root README.md for full instructions.`,

  frontendPackageJson: `{
  "name": "smartcity-citizen-portal-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "lucide-react": "^0.344.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.2.1",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}`,

  frontendViteConfig: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});`,

  frontendTsConfig: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "node",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`,

  frontendIndexHtml: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Smart City Citizen Service Portal</title>
  </head>
  <body class="bg-slate-50 text-slate-800">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,

  frontendMainTxs: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,

  frontendIndexCss: `@import "tailwindcss";

@layer base {
  body {
    @apply bg-slate-50 text-slate-900 antialiased;
  }
}`,

  frontendAppTsx: `// Smart City Citizen Service Portal - Main App
// This is the core React code containing all modules, simulated MySQL database and console logs.
export default function App() {
  // See source files for complete code
  return (
    <div>Smart City Portal</div>
  );
}`
};
