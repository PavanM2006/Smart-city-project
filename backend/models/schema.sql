-- ==========================================================
-- Smart City Citizen Service Portal - Updated Database Schema
-- Database Name: smartcity_db
-- Target: MySQL 8.0+ Community Edition
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `smartcity_db`;
USE `smartcity_db`;

-- Disable Foreign Key Checks during script execution
SET FOREIGN_KEY_CHECKS = 0;

-- Drop Tables if they exist for clean execution
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `complaint_comments`;
DROP TABLE IF EXISTS `device_tokens`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `users`;

-- ----------------------------------------------------------
-- 1. Table: users
-- Stores user data with roles: citizen, department_officer, administrator
-- ----------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('citizen', 'department_officer', 'administrator') NOT NULL DEFAULT 'citizen',
  `phone` VARCHAR(20) NULL,
  `avatar` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Table: departments
-- Stores official municipal departments
-- ----------------------------------------------------------
CREATE TABLE `departments` (
  `department_id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_name` VARCHAR(100) NOT NULL UNIQUE,
  `head_officer` VARCHAR(100) NOT NULL,
  `contact` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Table: complaints
-- Stores the reported civic issues with OSM geocoding coordinates
-- Categories: Water Supply, Electricity, Road Damage, Garbage, Drainage, Street Light, Other
-- Statuses: Submitted, Under Review, Assigned, In Progress, Resolved, Closed
-- ----------------------------------------------------------
CREATE TABLE `complaints` (
  `complaint_id` VARCHAR(50) PRIMARY KEY, -- Format CC-YYYY-XXXX
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `category` ENUM('Water Supply', 'Electricity', 'Road Damage', 'Garbage', 'Drainage', 'Street Light', 'Other') NOT NULL,
  `image` VARCHAR(255) NULL, -- Local file path saved by Multer
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `status` ENUM('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Submitted',
  `department_id` INT NULL,
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_complaints_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_complaints_departments` FOREIGN KEY (`department_id`) REFERENCES `departments`(`department_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Table: complaint_comments
-- Stores citizen and department officer communications regarding grievances
-- ----------------------------------------------------------
CREATE TABLE `complaint_comments` (
  `comment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` VARCHAR(50) NOT NULL,
  `user_id` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comments_complaints` FOREIGN KEY (`complaint_id`) REFERENCES `complaints`(`complaint_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Table: notifications
-- Stores push and in-app system notifications for users
-- ----------------------------------------------------------
CREATE TABLE `notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(20) NOT NULL DEFAULT 'info',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notifications_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. Table: device_tokens
-- Stores FCM device registration tokens for push notifications
-- ----------------------------------------------------------
CREATE TABLE `device_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `device_type` VARCHAR(20) NOT NULL DEFAULT 'web',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_device_tokens_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 7. Table: activity_logs
-- Stores operational audit logs for administrators
-- ----------------------------------------------------------
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `details` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_activity_logs_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Optimization Indexes for High Performance Querying
-- ----------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_complaints_user ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_comments_complaint ON complaint_comments(complaint_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);

-- Enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- Seed Initial Seed Data
-- ----------------------------------------------------------

-- 1. Seed Municipal Departments
INSERT INTO `departments` (`department_id`, `department_name`, `head_officer`, `contact`) VALUES
(1, 'Water Resources & Sewage', 'Michael Flores', 'waterdept@smartcity.gov'),
(2, 'Electrical Grid & Lighting', 'Elena Rostova', 'electrical@smartcity.gov'),
(3, 'Public Works & Roads', 'Robert Chen', 'publicworks@smartcity.gov'),
(4, 'Sanitation & Waste Management', 'Sarah Jenkins', 'sanitation@smartcity.gov'),
(5, 'Parks & Urban Forestry', 'Marcus Vance', 'parks@smartcity.gov');

-- 2. Seed Users (Passwords: citizen123, officer123, admin123. Hashed in bcrypt in real database)
-- Note: In production, generate securely. Hashed passwords here are for demo seeding.
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `avatar`) VALUES
(1, 'Jane Doe', 'citizen@smartcity.gov', '$2b$10$xyz...', 'citizen', '+1 (555) 019-2834', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'),
(2, 'Chief Officer Robert Chen', 'officer@smartcity.gov', '$2b$10$abc...', 'department_officer', '+1 (555) 011-9988', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'),
(3, 'Director Arthur Pendelton', 'admin@smartcity.gov', '$2b$10$qwe...', 'administrator', '+1 (555) 043-9876', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80');

-- 3. Seed Sample complaints matching the new categories
INSERT INTO `complaints` (`complaint_id`, `user_id`, `title`, `description`, `category`, `image`, `latitude`, `longitude`, `address`, `status`, `department_id`, `priority`, `remarks`, `created_at`, `updated_at`) VALUES
('CC-2026-001', 1, 'Severe Pothole on Oak Avenue', 'There is a massive pothole in the middle of the road near the Oak Avenue intersection. Multiple cars have had to swerve dangerously to avoid it. It is about 6 inches deep.', 'Road Damage', 'uploads/pothole_sample.jpg', 40.71280000, -74.00600000, '425 Oak Avenue, Central District, SmartCity', 'In Progress', 3, 'High', 'Road repair team has been dispatched. Asphalt filling is scheduled for tomorrow morning.', '2026-03-01 09:15:00', '2026-03-02 14:30:00'),
('CC-2026-002', 1, 'Overflowing Trash Bins in Riverside Park', 'The public garbage bins at the main entrance of Riverside Park have not been emptied for three days. Waste is spilling onto the walkways, attracting rodents.', 'Garbage', 'uploads/garbage_sample.jpg', 40.72500000, -74.01500000, 'Riverside Park Promenade, West Ward, SmartCity', 'Assigned', 4, 'Medium', 'Assigned to Sanitation Crew Area B. Expected pickup within 24 hours.', '2026-03-03 11:40:00', '2026-03-03 16:00:00'),
('CC-2026-003', 1, 'Water Hydrant Leaking under Bridge', 'Clean water is spraying out of the ground at a high rate under the Maple Street Bridge. It is creating a large pool of water and eroding the dirt embankment.', 'Water Supply', 'uploads/water_sample.jpg', 40.70500000, -73.99800000, 'Maple Street Bridge (South Anchor), River District', 'Under Review', NULL, 'Urgent', 'Complaint received and queued for emergency review.', '2026-03-04 07:20:00', '2026-03-04 07:20:00');

-- 4. Seed Initial Comments
INSERT INTO `complaint_comments` (`comment_id`, `complaint_id`, `user_id`, `comment`, `created_at`) VALUES
(1, 'CC-2026-001', 2, 'Road repair crew has been dispatched. Asphalt filling is scheduled for tomorrow morning.', '2026-03-02 14:30:00');

-- 5. Seed Initial Notifications
INSERT INTO `notifications` (`notification_id`, `user_id`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 1, 'Your complaint "Severe Pothole on Oak Avenue" has been updated to IN PROGRESS.', 'info', 0, '2026-03-02 14:30:00'),
(2, 1, 'Your complaint "Overflowing Trash Bins" has been assigned to Sanitation & Waste Management.', 'success', 1, '2026-03-03 16:00:00');

-- 6. Seed Activity Logs
INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `details`, `created_at`) VALUES
(1, 1, 'complaint_created', 'Complaint CC-2026-001 successfully logged.', '2026-03-01 09:15:00'),
(2, 2, 'complaint_updated', 'Complaint CC-2026-001 status changed to In Progress.', '2026-03-02 14:30:00');
