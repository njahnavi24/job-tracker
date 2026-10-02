CREATE DATABASE IF NOT EXISTS job_tracker;
USE job_tracker;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company VARCHAR(150) NOT NULL,
  role VARCHAR(150) NOT NULL,
  status ENUM('Applied','Interview','Offer','Rejected') NOT NULL DEFAULT 'Applied',
  link VARCHAR(500),
  notes TEXT,
  applied_on DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
);