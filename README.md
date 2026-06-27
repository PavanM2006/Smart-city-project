# Smart City Citizen Service Portal

Welcome to the **Smart City Citizen Service Portal**, a comprehensive full-stack solution designed to empower citizens to report and track local civic issues (such as potholes, garbage accumulation, water leakages, and streetlight outages), and enable municipal authorities to review, prioritize, assign, and resolve these issues via an analytics-driven administrative dashboard.

## Project Architecture
This repository is structured as a **GitHub-Ready Full-Stack Project**:
```text
smart-city-portal/
│
├── backend/                        # Node.js + Express + MySQL Backend
│   ├── config/                     # Database Pool Configuration
│   │   └── db.js
│   ├── controllers/                # Business Logic Controllers
│   │   ├── authController.js       # Auth (JWT, Bcrypt)
│   │   └── complaintController.js  # Complaints (Multer, Nodemailer SMTP, FCM)
│   ├── middleware/                 # Route Protection & RBAC Middlewares
│   │   └── auth.js
│   ├── models/                     # SQL Database Schemas & Seeds
│   │   └── schema.sql
│   ├── routes/                     # API Routes
│   │   └── api.js
│   ├── uploads/                    # Local storage for evidence images (Multer destination)
│   ├── .env.example                # Example environment configuration
│   ├── package.json                # Node package manifest
│   └── README.md                   # Backend specific documentation & API reference
│
├── src/                            # React + TypeScript + Tailwind CSS Frontend
│   ├── components/                 # Reusable UI Components
│   ├── data/                       # Mock databases & initial seeds for Sandbox Simulator
│   │   └── mockData.ts
│   ├── App.tsx                     # Main Application shell
│   ├── index.css                   # Global Tailwind Styles
│   └── main.tsx                    # React Entry point
│
├── index.html                      # HTML Entry point
├── package.json                    # Frontend package configuration
├── vite.config.ts                  # Vite configuration
└── README.md                       # Master Documentation (This file)
```

---

## Live Interactive Full-Stack Sandbox (Try it in Browser!)
When you run this application, it boots up an **interactive full-stack simulator** in the browser. 

This simulator includes:
1.  **Fully Interactive Portals**: Toggle between the **Citizen Portal** (submit complaints with OSM / Leaflet interactive maps, upload photo evidence, receive push notifications) and the **Department / Admin Portals** (assign departments, update statuses, view responsive charts).
2.  **Live Node.js Terminal**: Watch the simulated backend server spin up, establish a MySQL pool connection, and stream live HTTP request/response logs (e.g. `POST /api/complaints 201 Created`) as you click buttons in the UI.
3.  **Active MySQL Database Console**: View the database tables (`users`, `complaints`, `departments`, `notifications`, `device_tokens`, `complaint_comments`, `activity_logs`) in real-time as grids. You can even write custom SQL queries to select, filter, or join tables, and see the results instantly updated!
4.  **Swagger API Explorer**: Inspect request and response payloads, token headers, and status codes for all endpoints.
5.  **One-Click ZIP Download**: A button in the developer panel that dynamically bundles every single file (both frontend and backend structures) into a ready-to-run `.zip` file on the fly and downloads it to your machine!

---

## Local Installation Guide (To run the real server locally)

### 1. Backend Setup
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Install the required npm packages (including Firebase Admin SDK and MySQL2):
    ```bash
    npm install
    ```
3.  Ensure your **MySQL Server** is running. Log into your MySQL console and execute the SQL schema to create and seed the database:
    ```bash
    mysql -u root -p < models/schema.sql
    ```
4.  Configure your environment variables:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and provide your MySQL root password, Gmail SMTP details, and Firebase private key.
5.  Start the backend server:
    ```bash
    npm run dev
    ```
    *The server will start running on `http://localhost:5000`.*

### 2. Frontend Setup
1.  Return to the root directory:
    ```bash
    cd ..
    ```
2.  Install the frontend packages:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
    *The React application will be available at `http://localhost:5173`.*

---

## Detailed Features

### 🌟 Citizen Module
-   **User Authentication**: JWT-based secure sign-up and log-in (Roles: citizen, department_officer, administrator).
-   **Civic Issue Submission**:
    -   *Category Select*: Water Supply, Electricity, Road Damage, Garbage, Drainage, Street Light, Other.
    -   *Evidence Upload*: Drag & drop photo attachments.
    -   *OpenStreetMap Leaflet Map*: Double-click or click to place a pin on the city map to automatically fetch latitude, longitude, and approximate street address.
    -   *GPS Locator*: Uses the browser Geolocation API to auto-detect and snap coordinates in real-time.
-   **Real-time Tracking**: Vertical timelines that track complaints through all six stages (`Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`), showing assigned department heads, contact information, and action remarks.
-   **FCM & Email Alerts**: Real-time push notifications pop up in the app header and send SMTP emails when authorities make progress on your issue.

### 🛡️ Department & Admin Modules
-   **Secure Login**: Restricted access controls.
-   **Analytics Dashboard**:
    -   *KPI Cards*: Resolution Rates, Mean Resolution Times, Unassigned Incidents.
    -   *Dynamic Charts*: Interactive SVG charts representing complaints by category, weekly trends, and priority distributions.
-   **Issue Management System**:
    -   *Filterable Tables*: Search complaints by text, sort by priority, category, or status.
    -   *Complaint Inspector*: View citizen contact details, larger image uploads, and precise map coordinates.
    -   *Department Allocation*: Assign complaints to specialized departments (e.g. Public Works, Sanitation) to notify their respective team heads.
    -   *Status Updates & Remarks*: Update tracking status and add notes (which instantly notifies the reporting citizen).
    -   *Comment Threading*: Officers and citizens can chat back-and-forth about active dispatches.
-   **Administrative Department Registrar**: Admins can register new municipal departments to the city network via secure JWT authorization checks.
