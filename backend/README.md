# Smart City Citizen Service Portal - Backend API

This directory contains the production-ready backend code for the **Smart City Citizen Service Portal**, built using Node.js, Express, and MySQL.

## Tech Stack & Core Dependencies
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database Driver**: MySQL2 (with connection pooling and async/await support)
- **Security**: JWT (jsonwebtoken) & bcryptjs (password hashing)
- **Image Uploads**: Multer (limits files to 5MB, filters for JPEG/PNG/WEBP)
- **Email Dispatch**: Nodemailer with Gmail SMTP setup
- **Notification Logs**: Firebase Cloud Messaging (FCM) integration outline

---

## Installation & Setup Guide

### 1. Prerequisites
- Install [Node.js](https://nodejs.org/) (version 18 or higher)
- Install [MySQL Server](https://dev.mysql.com/downloads/mysql/) and ensure it is running on your local machine.

### 2. Database Setup
1. Open your MySQL command-line interface or any database management tool (e.g., phpMyAdmin, DBeaver, MySQL Workbench).
2. Execute the schema script located at `models/schema.sql`:
   ```bash
   mysql -u root -p < models/schema.sql
   ```
   This will automatically create the database `smartcity_db` and seed it with departments, initial users, and sample complaints.

### 3. Install Dependencies
Navigate to the `backend/` directory and run:
```bash
npm install
```

### 4. Configuration (.env)
Create a `.env` file in the root of the `backend/` directory (you can copy `.env.example` as a template):
```bash
cp .env.example .env
```
Update the database credentials and mail server credentials:
- `DB_USER`: Your MySQL username (default: `root`)
- `DB_PASSWORD`: Your MySQL password
- `JWT_SECRET`: A secure random secret key
- `SMTP_USER`: Your Gmail address (if utilizing email notifications)
- `SMTP_PASS`: Your Gmail App Password

### 5. Running the Server
**For development (with hot-reloading):**
```bash
npm run dev
```

**For production:**
```bash
npm start
```

Upon starting, you will see the console logs:
```text
Smart City Backend Server successfully started!
Running on: http://localhost:5000
Environment: development
MySQL Database connected successfully! Connection thread ID: 14
```

---

## API Documentation

### 1. Authentication
All endpoints except `/api/register` and `/api/login` require an `Authorization` header containing the JWT token.
*Header Format:* `Authorization: Bearer <your_jwt_token>`

#### **POST /api/register**
*   **Description**: Registers a new user (Citizen or Authority).
*   **Request Body**:
    ```json
    {
      "name": "Jane Doe",
      "email": "citizen@smartcity.gov",
      "password": "citizen123",
      "role": "citizen",
      "phone": "+1 (555) 019-2834"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "User registered successfully!",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 4,
        "name": "Jane Doe",
        "email": "citizen@smartcity.gov",
        "role": "citizen",
        "phone": "+1 (555) 019-2834",
        "avatar": "https://..."
      }
    }
    ```

#### **POST /api/login**
*   **Description**: Authenticates user credentials and returns a JWT token.
*   **Request Body**:
    ```json
    {
      "email": "citizen@smartcity.gov",
      "password": "citizen123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Login successful!",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "citizen@smartcity.gov",
        "role": "citizen",
        "phone": "+1 (555) 019-2834",
        "avatar": "https://..."
      }
    }
    ```

---

### 2. Complaints Management

#### **POST /api/complaint**
*   **Description**: Submits a new civic issue report with optional image attachment.
*   **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
*   **Form Data Fields**:
    *   `title` (String, Required): Title of the complaint.
    *   `description` (String, Required): Detailed explanation of the issue.
    *   `category` (String, Required): One of `Pothole`, `Garbage`, `Water Leakage`, `Streetlight Failure`, `Other`.
    *   `lat` (Float, Required): Latitude coordinates.
    *   `lng` (Float, Required): Longitude coordinates.
    *   `address` (String, Required): Textual description of the location.
    *   `priority` (String, Optional): `Low`, `Medium`, `High`, `Urgent`.
    *   `image` (File, Optional): Binary file upload (JPEG/PNG).
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Complaint submitted successfully!",
      "complaint_id": "CC-2026-8910",
      "image_url": "uploads/image-17100000000.jpg"
    }
    ```

#### **GET /api/complaints**
*   **Description**: Retrieves a list of complaints.
    *   *Citizens* receive only their own submitted complaints.
    *   *Authorities* receive all complaints, with support for filters.
*   **Query Parameters (Optional)**: `status`, `category`, `priority`.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "count": 1,
      "complaints": [
        {
          "complaint_id": "CC-2026-001",
          "user_id": 1,
          "citizen_name": "Jane Doe",
          "title": "Severe Pothole on Oak Avenue",
          "description": "A massive pothole in the road...",
          "category": "Pothole",
          "image": "uploads/pothole_sample.jpg",
          "location_lat": "40.71280000",
          "location_lng": "-74.00600000",
          "location_address": "425 Oak Avenue",
          "status": "In Progress",
          "department_id": 1,
          "department_name": "Public Works & Roads",
          "priority": "High",
          "remarks": "Repair team dispatched...",
          "created_at": "2026-03-01T09:15:00.000Z",
          "updated_at": "2026-03-02T14:30:00.000Z"
        }
      ]
    }
    ```

#### **GET /api/complaint/:id**
*   **Description**: Retrieves full details of a single complaint, including assigned department contacts.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "complaint": {
        "complaint_id": "CC-2026-001",
        "title": "Severe Pothole on Oak Avenue",
        "status": "In Progress",
        "citizen_name": "Jane Doe",
        "citizen_phone": "+1 (555) 019-2834",
        "department_name": "Public Works & Roads",
        "head_officer": "Robert Chen",
        "department_contact": "publicworks@smartcity.gov",
        "remarks": "Road repair team has been dispatched..."
      }
    }
    ```

#### **PUT /api/complaint/update**
*   **Description**: Updates a complaint's status, assigned department, priority level, and remarks. Automatically triggers email SMTP alerts and FCM push notifications.
*   **Headers**: Requires `Authority` role token.
*   **Request Body**:
    ```json
    {
      "complaint_id": "CC-2026-001",
      "status": "In Progress",
      "department_id": 1,
      "priority": "High",
      "remarks": "Road repair crew has arrived on site. Asphalt mixing underway."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Complaint updated and notifications dispatched successfully!",
      "updated_data": {
        "complaint_id": "CC-2026-001",
        "status": "In Progress",
        "department_id": 1,
        "remarks": "Road repair crew has arrived on site...",
        "priority": "High"
      }
    }
    ```

---

### 3. Notifications Service

#### **GET /api/notifications**
*   **Description**: Fetches all system notification logs for the authenticated citizen.
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "notifications": [
        {
          "notification_id": 1,
          "user_id": 1,
          "message": "Your complaint CC-2026-001 has been updated to IN PROGRESS.",
          "type": "info",
          "is_read": 0,
          "created_at": "2026-03-02T14:30:00.000Z"
        }
      ]
    }
    ```
